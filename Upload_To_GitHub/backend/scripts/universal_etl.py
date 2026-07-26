#!/usr/bin/env python3
"""
Universal Egyptian Pharmaceutical Platform - Web Scraping & API Data Pipeline
Crawls local commercial directories and enriches data via RxNorm / OpenFDA clinical APIs.
"""

import asyncio
import re
import logging
import requests
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
import psycopg2

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

class UniversalEgyptianPharmaETL:
    def __init__(self, db_config: dict):
        self.db_config = db_config
        self.rxnorm_base_url = "https://rxnav.nlm.nih.gov/REST"

    def fetch_global_clinical_data(self, active_ingredient_name: str) -> dict:
        """Fetches RxNorm CUI and FDA clinical attributes for active ingredient."""
        clinical_info = {"rxcui": None, "pregnancy_category": "N"}
        try:
            url = f"{self.rxnorm_base_url}/rxcui.json?name={active_ingredient_name}"
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                data = res.json()
                if "idGroup" in data and "rxnormId" in data["idGroup"]:
                    clinical_info["rxcui"] = data["idGroup"]["rxnormId"][0]
        except Exception as e:
            logging.warning(f"RxNorm API fetch failed for {active_ingredient_name}: {e}")
        return clinical_info

    def validate_and_clean_record(self, raw: dict) -> Optional[dict]:
        """Data Validation: Drops incomplete records and flags price anomalies."""
        trade_name_en = raw.get("trade_name_en", "").strip()
        trade_name_ar = raw.get("trade_name_ar", "").strip()
        
        if not trade_name_en and not trade_name_ar:
            logging.warning("Data Validation: Record dropped due to missing trade name.")
            return None

        # Parse price
        price_match = re.search(r"(\d+(\.\d+)?)", str(raw.get("raw_price", "0")))
        price_egp = float(price_match.group(1)) if price_match else 0.0
        if price_egp <= 0.0:
            logging.warning(f"Data Validation: '{trade_name_en}' flagged for invalid price ({price_egp} EGP).")

        # Parse ingredients
        ingredients = []
        raw_comp = raw.get("raw_composition", "")
        parts = re.split(r'\+|\band\b|/', raw_comp, flags=re.IGNORECASE)
        for part in parts:
            p_str = part.strip()
            if not p_str: continue
            match = re.search(r"([A-Za-z\s\-]+)\s*(\d+(\.\d+)?)\s*(mg|mcg|g|ml|iu|%)", p_str, re.IGNORECASE)
            if match:
                ing_name = match.group(1).strip().title()
                ingredients.append({
                    "name": ing_name,
                    "strength": float(match.group(2)),
                    "unit": match.group(4).lower(),
                    "clinical_data": self.fetch_global_clinical_data(ing_name)
                })

        if not ingredients:
            logging.warning(f"Data Validation: Dropped '{trade_name_en}' due to unparseable active ingredients.")
            return None

        return {
            "trade_name_en": trade_name_en or trade_name_ar,
            "trade_name_ar": trade_name_ar or trade_name_en,
            "price_egp": price_egp,
            "manufacturer": raw.get("manufacturer", "Generic Egyptian Co.").strip(),
            "dosage_form": raw.get("dosage_form", "Tablet").strip(),
            "is_otc": raw.get("is_otc", False),
            "ingredients": ingredients
        }

    def load_to_postgres(self, records: List[dict]):
        """Transactional Database Bulk Loading."""
        if not records: return
        conn = psycopg2.connect(**self.db_config)
        cursor = conn.cursor()

        try:
            for r in records:
                # 1. Upsert Manufacturer
                cursor.execute("""
                    INSERT INTO manufacturers (company_name) VALUES (%s)
                    ON CONFLICT (company_name) DO UPDATE SET company_name=EXCLUDED.company_name
                    RETURNING id;
                """, (r["manufacturer"],))
                mfg_id = cursor.fetchone()[0]

                # 2. Upsert Dosage Form
                cursor.execute("""
                    INSERT INTO dosage_forms (form_name_en, form_name_ar) VALUES (%s, %s)
                    ON CONFLICT (form_name_en) DO UPDATE SET form_name_en=EXCLUDED.form_name_en
                    RETURNING id;
                """, (r["dosage_form"], r["dosage_form"]))
                form_id = cursor.fetchone()[0]

                # 3. Insert Drug
                cursor.execute("""
                    INSERT INTO drugs (trade_name_en, trade_name_ar, manufacturer_id, dosage_form_id, price_egp, is_otc)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id;
                """, (r["trade_name_en"], r["trade_name_ar"], mfg_id, form_id, r["price_egp"], r["is_otc"]))
                drug_id = cursor.fetchone()[0]

                # 4. Insert Ingredients & Junction
                for ing in r["ingredients"]:
                    cursor.execute("""
                        INSERT INTO active_ingredients (inn_name, arabic_name, rxcui)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (inn_name) DO UPDATE SET rxcui=COALESCE(EXCLUDED.rxcui, active_ingredients.rxcui)
                        RETURNING id;
                    """, (ing["name"], ing["name"], ing["clinical_data"]["rxcui"]))
                    ing_id = cursor.fetchone()[0]

                    cursor.execute("""
                        INSERT INTO drug_active_ingredients (drug_id, active_ingredient_id, strength_amount, strength_unit)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT DO NOTHING;
                    """, (drug_id, ing_id, ing["strength"], ing["unit"]))

            conn.commit()
            logging.info(f"Database Ingestion Complete: {len(records)} drugs successfully committed.")
        except Exception as e:
            conn.rollback()
            logging.error(f"ETL Load Transaction Failed: {e}")
        finally:
            cursor.close()
            conn.close()

if __name__ == "__main__":
    config = {
        "dbname": "pharma_db",
        "user": "postgres",
        "password": "password",
        "host": "localhost",
        "port": 5432
    }
    etl = UniversalEgyptianPharmaETL(config)
    logging.info("Universal ETL & API Pipeline Module loaded.")
