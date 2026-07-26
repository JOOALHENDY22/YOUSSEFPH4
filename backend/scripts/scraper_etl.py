#!/usr/bin/env python3
"""
Egyptian Pharmaceutical Platform - Web Scraping & Data Extraction ETL Pipeline
Extracts, cleans, normalizes, and loads drug data into PostgreSQL schema.
"""

import asyncio
import re
import logging
from typing import List, Dict, Any, Optional
from bs4 import BeautifulSoup
import psycopg2

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

class EgyptianPharmaETL:
    def __init__(self, db_config: dict):
        self.db_config = db_config
        self.extracted_records: List[Dict[str, Any]] = []

    def parse_raw_html(self, html_content: str) -> List[Dict[str, Any]]:
        """Extracts raw drug entities from HTML using BeautifulSoup."""
        soup = BeautifulSoup(html_content, 'html.parser')
        raw_items = []
        
        cards = soup.select('.drug-item, .product-card, tr.drug-row')
        for card in cards:
            name_en_elem = card.select_one('.name-en, .product-title-en, .drug-name-en')
            name_ar_elem = card.select_one('.name-ar, .product-title-ar, .drug-name-ar')
            price_elem = card.select_one('.price, .product-price, .drug-price')
            comp_elem = card.select_one('.active-ingredient, .composition, .formula')
            mfg_elem = card.select_one('.company, .manufacturer')
            form_elem = card.select_one('.dosage-form, .form-type')

            raw_items.append({
                "trade_name_en": name_en_elem.get_text(strip=True) if name_en_elem else "",
                "trade_name_ar": name_ar_elem.get_text(strip=True) if name_ar_elem else "",
                "raw_price": price_elem.get_text(strip=True) if price_elem else "0",
                "raw_composition": comp_elem.get_text(strip=True) if comp_elem else "",
                "manufacturer": mfg_elem.get_text(strip=True) if mfg_elem else "Egyptian Pharmaceutical Co.",
                "dosage_form": form_elem.get_text(strip=True) if form_elem else "Tablet"
            })
        return raw_items

    def transform_record(self, raw: dict) -> Optional[dict]:
        """Cleans, parses numbers/units, normalizes active ingredients."""
        if not raw["trade_name_en"] and not raw["trade_name_ar"]:
            return None

        # Price parsing
        price_match = re.search(r"(\d+(\.\d+)?)", raw["raw_price"].replace(',', ''))
        price_egp = float(price_match.group(1)) if price_match else 0.0

        # Ingredients parsing
        ingredients = []
        parts = re.split(r'\+|\band\b|/', raw["raw_composition"], flags=re.IGNORECASE)
        for part in parts:
            part_str = part.strip()
            if not part_str:
                continue
            
            match = re.search(r"([A-Za-z\s\-]+)\s*(\d+(\.\d+)?)\s*(mg|mcg|g|ml|iu|%)", part_str, re.IGNORECASE)
            if match:
                ingredients.append({
                    "name": match.group(1).strip().title(),
                    "strength": float(match.group(2)),
                    "unit": match.group(4).lower()
                })
            else:
                ingredients.append({
                    "name": part_str.title(),
                    "strength": 1.0,
                    "unit": "unit"
                })

        return {
            "trade_name_en": raw["trade_name_en"] or raw["trade_name_ar"],
            "trade_name_ar": raw["trade_name_ar"] or raw["trade_name_en"],
            "price_egp": price_egp,
            "manufacturer": raw["manufacturer"] or "Generic Egyptian Pharma",
            "dosage_form": raw["dosage_form"] or "Tablet",
            "ingredients": ingredients
        }

    def process_and_load(self, raw_html_sample: str):
        """Runs the ETL transform and persists data into PostgreSQL 3NF schema."""
        raw_list = self.parse_raw_html(raw_html_sample)
        logging.info(f"Parsed {len(raw_list)} raw records from source HTML.")

        transformed_records = []
        for r in raw_list:
            t = self.transform_record(r)
            if t:
                transformed_records.append(t)

        logging.info(f"Transformed {len(transformed_records)} records successfully.")
        self.load_to_postgres(transformed_records)

    def load_to_postgres(self, records: List[dict]):
        """Executes database insertion with transaction safety."""
        if not records:
            logging.info("No valid records to load.")
            return

        try:
            conn = psycopg2.connect(**self.db_config)
            cursor = conn.cursor()

            for rec in records:
                # 1. Upsert Manufacturer
                cursor.execute("""
                    INSERT INTO manufacturers (company_name) VALUES (%s)
                    ON CONFLICT (company_name) DO UPDATE SET company_name=EXCLUDED.company_name
                    RETURNING id;
                """, (rec["manufacturer"],))
                mfg_id = cursor.fetchone()[0]

                # 2. Upsert Dosage Form
                cursor.execute("""
                    INSERT INTO dosage_forms (form_name) VALUES (%s)
                    ON CONFLICT (form_name) DO UPDATE SET form_name=EXCLUDED.form_name
                    RETURNING id;
                """, (rec["dosage_form"],))
                form_id = cursor.fetchone()[0]

                # 3. Insert Drug
                cursor.execute("""
                    INSERT INTO drugs (trade_name_en, trade_name_ar, manufacturer_id, dosage_form_id, price_egp)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id;
                """, (rec["trade_name_en"], rec["trade_name_ar"], mfg_id, form_id, rec["price_egp"]))
                drug_id = cursor.fetchone()[0]

                # 4. Insert Active Ingredients & Junction
                for ing in rec["ingredients"]:
                    cursor.execute("""
                        INSERT INTO active_ingredients (inn_name, arabic_name)
                        VALUES (%s, %s)
                        ON CONFLICT (inn_name) DO UPDATE SET inn_name=EXCLUDED.inn_name
                        RETURNING id;
                    """, (ing["name"], ing["name"]))
                    ing_id = cursor.fetchone()[0]

                    cursor.execute("""
                        INSERT INTO drug_active_ingredients (drug_id, active_ingredient_id, strength_amount, strength_unit)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT DO NOTHING;
                    """, (drug_id, ing_id, ing["strength"], ing["unit"]))

            conn.commit()
            logging.info("Transaction committed successfully.")
            cursor.close()
            conn.close()
        except Exception as err:
            logging.error(f"ETL Load Error: {err}")

if __name__ == "__main__":
    sample_html = """
    <div class="drug-item">
        <span class="name-en">Augmentin 1g</span>
        <span class="name-ar">أوجمنتين 1 جرام</span>
        <span class="price">131.00 EGP</span>
        <span class="composition">Amoxicillin 875mg + Clavulanic Acid 125mg</span>
        <span class="company">GSK Egypt</span>
        <span class="dosage-form">Tablet</span>
    </div>
    """
    config = {
        "dbname": "pharma_db",
        "user": "postgres",
        "password": "password",
        "host": "localhost",
        "port": 5432
    }
    etl = EgyptianPharmaETL(config)
    logging.info("Sample ETL pipeline created successfully.")
