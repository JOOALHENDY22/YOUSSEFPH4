#!/usr/bin/env python3
"""
YMH DRUG CHECK - Active Ingredient Normalization & OpenFDA API Mapping Layer
"""

import re
import requests
import logging
from typing import Dict, Any, List

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

class ActiveIngredientNormalizer:
    def __init__(self):
        self.openfda_url = "https://api.fda.gov/drug/label.json"
        self.rxnorm_url = "https://rxnav.nlm.nih.gov/REST"

    def clean_brand_name_and_extract_ingredients(self, brand_name: str) -> List[str]:
        """
        Regex Active Ingredient Extraction:
        Strips dosage numbers (e.g. 500mg, 1g, 250mcg, %, IU), forms, and splits combination drugs.
        """
        cleaned = re.sub(r'\b\d+(\.\d+)?\s*(mg|mcg|g|ml|iu|%)\b', '', brand_name, flags=re.IGNORECASE)
        cleaned = re.sub(r'\b\d+\b', '', cleaned)
        cleaned = re.sub(r'\b(tablets?|capsules?|syrup|ampoule|injection|cream|ointment|gel|suspension)\b', '', cleaned, flags=re.IGNORECASE)
        cleaned = cleaned.strip()

        parts = re.split(r'\+|\bwith\b|/|\band\b', cleaned, flags=re.IGNORECASE)
        ingredients = [p.strip().title() for p in parts if p.strip()]
        return ingredients

    def fetch_openfda_clinical_data(self, generic_name: str) -> Dict[str, Any]:
        """
        Queries OpenFDA API for verified FDA label clinical data.
        Returns data_status='pending_verification' on 404 / missing records without outputting fake text.
        """
        try:
            query_str = f'openfda.generic_name:"{generic_name}" OR openfda.brand_name:"{generic_name}"'
            params = {"search": query_str, "limit": 1}
            response = requests.get(self.openfda_url, params=params, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                if "results" in data and len(data["results"]) > 0:
                    result = data["results"][0]
                    openfda_meta = result.get("openfda", {})
                    return {
                        "data_status": "verified_openfda",
                        "generic_name": openfda_meta.get("generic_name", [generic_name]),
                        "brand_name": openfda_meta.get("brand_name", []),
                        "product_type": openfda_meta.get("product_type", ["Prescription"]),
                        "indications_and_usage": result.get("indications_and_usage", ["Consult physician."]),
                        "dosage_and_administration": result.get("dosage_and_administration", ["Follow medical guidance."]),
                        "boxed_warnings": result.get("boxed_warning", ["None reported."]),
                        "warnings": result.get("warnings", ["Standard precautions apply."])
                    }
        except Exception as e:
            logging.warning(f"OpenFDA API query failed for '{generic_name}': {e}")

        return {
            "data_status": "pending_verification",
            "generic_name": [generic_name],
            "note": "Official FDA label details pending verification in local drug registry."
        }

if __name__ == "__main__":
    normalizer = ActiveIngredientNormalizer()
    print("Ingredient Normalizer module ready.")
