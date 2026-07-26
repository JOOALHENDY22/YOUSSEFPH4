"""
YMH DRUG CHECK - FastAPI Backend Router & Route Handlers
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '../../scripts'))

from fastapi import FastAPI, HTTPException, Path
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import psycopg2
from ingredient_normalizer import ActiveIngredientNormalizer

app = FastAPI(title="YMH DRUG CHECK - Clinical Engine Router", version="1.0.0")
normalizer = ActiveIngredientNormalizer()

DB_CONFIG = {"dbname": "ymh_pharma", "user": "postgres", "password": "password", "host": "localhost", "port": 5432}

class ConsultationInput(BaseModel):
    symptoms: List[str] = Field(..., example=["headache", "fever"])
    age_years: float = Field(..., example=25)
    gender: str = Field(..., example="M")
    pregnancy: bool = Field(False)
    chronic_conditions: List[str] = Field([], example=["Hypertension"])

class InteractionRequest(BaseModel):
    drug_ids: List[int] = Field(..., example=[1, 2])

# ==============================================================================
# 1. GET /api/drug/{brand_name} (Merged Commercial Data + FDA Clinical Label)
# ==============================================================================
@app.get("/api/drug/{brand_name}")
def get_drug_details(brand_name: str = Path(..., description="Egyptian Brand Name")):
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT d.id, d.brand_name_en, d.brand_name_ar, d.price_egp, m.company_name, df.form_name_en
            FROM egyptian_drugs d
            LEFT JOIN manufacturers m ON d.manufacturer_id = m.id
            LEFT JOIN dosage_forms df ON d.dosage_form_id = df.id
            WHERE LOWER(d.brand_name_en) = LOWER(%s) OR LOWER(d.brand_name_ar) = LOWER(%s);
        """, (brand_name, brand_name))
        row = cursor.fetchone()

        extracted_ingredients = normalizer.clean_brand_name_and_extract_ingredients(brand_name)
        primary_ingredient = extracted_ingredients[0] if extracted_ingredients else brand_name

        fda_clinical_data = normalizer.fetch_openfda_clinical_data(primary_ingredient)

        if row:
            return {
                "local_commercial_data": {
                    "drug_id": row[0],
                    "brand_name_en": row[1],
                    "brand_name_ar": row[2],
                    "price_egp": float(row[3]),
                    "manufacturer": row[4],
                    "dosage_form": row[5]
                },
                "extracted_active_ingredients": extracted_ingredients,
                "fda_clinical_data": fda_clinical_data
            }
        else:
            return {
                "local_commercial_data": {
                    "brand_name_en": brand_name,
                    "price_egp": 0.0,
                    "status": "not_in_local_db"
                },
                "extracted_active_ingredients": extracted_ingredients,
                "fda_clinical_data": fda_clinical_data
            }
    finally:
        cursor.close()
        conn.close()

# ==============================================================================
# 2. POST /api/consultation (OTC Symptom Checker & Safety Filter)
# ==============================================================================
@app.post("/api/consultation")
def run_otc_consultation(payload: ConsultationInput):
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    try:
        age_months = int(payload.age_years * 12)

        cursor.execute("""
            SELECT DISTINCT ai.id, ai.scientific_name_en, ai.scientific_name_ar, d.id AS drug_id, d.brand_name_en, d.price_egp
            FROM symptoms_otc_triage s
            JOIN triage_class_ingredients tci ON s.id = tci.triage_id
            JOIN active_ingredients ai ON tci.active_ingredient_id = ai.id
            JOIN drug_active_ingredients dai ON ai.id = dai.active_ingredient_id
            JOIN egyptian_drugs d ON dai.drug_id = d.id
            WHERE LOWER(s.symptom_name_en) IN %s AND ai.is_otc = TRUE;
        """, (tuple([s.lower() for s in payload.symptoms]),))
        candidates = cursor.fetchall()

        safe_recommendations = []
        for cand in candidates:
            ing_id, ing_en, ing_ar, drug_id, brand_en, price = cand

            cursor.execute("""
                SELECT warning_text FROM contraindications
                WHERE active_ingredient_id = %s AND (
                    (pregnancy_contraindicated = TRUE AND %s = TRUE) OR
                    (min_age_months IS NOT NULL AND %s < min_age_months) OR
                    (LOWER(disease_state) IN %s)
                );
            """, (ing_id, payload.pregnancy, age_months, tuple([c.lower() for c in payload.chronic_conditions]) if payload.chronic_conditions else ('none',)))
            warnings = cursor.fetchall()

            if not warnings:
                safe_recommendations.append({
                    "drug_id": drug_id,
                    "brand_name_en": brand_en,
                    "price_egp": float(price),
                    "active_ingredient": ing_en
                })

        return {
            "status": "success",
            "patient_age_years": payload.age_years,
            "safe_otc_recommendations": safe_recommendations
        }
    finally:
        cursor.close()
        conn.close()

# ==============================================================================
# 3. POST /api/interactions (Pairwise Interaction Matrix)
# ==============================================================================
@app.post("/api/interactions")
def check_interactions(payload: InteractionRequest):
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT d1.brand_name_en, d2.brand_name_en, di.severity_level, di.clinical_mechanism, di.action_required
            FROM drug_active_ingredients dai1
            JOIN drug_active_ingredients dai2 ON dai1.active_ingredient_id <> dai2.active_ingredient_id
            JOIN drug_interactions di ON (di.ingredient_a_id = dai1.active_ingredient_id AND di.ingredient_b_id = dai2.active_ingredient_id)
            JOIN egyptian_drugs d1 ON d1.id = dai1.drug_id
            JOIN egyptian_drugs d2 ON d2.id = dai2.drug_id
            WHERE dai1.drug_id IN %s AND dai2.drug_id IN %s AND dai1.drug_id < dai2.drug_id;
        """, (tuple(payload.drug_ids), tuple(payload.drug_ids)))
        rows = cursor.fetchall()
        
        interactions = [{"drug_a": r[0], "drug_b": r[1], "severity": r[2], "mechanism": r[3], "action": r[4]} for r in rows]
        return {"total_interactions": len(interactions), "interactions": interactions}
    finally:
        cursor.close()
        conn.close()

# ==============================================================================
# 4. GET /api/alternatives/{drug_id} (Exact Substitutes & Therapeutic Alternatives)
# ==============================================================================
@app.get("/api/alternatives/{drug_id}")
def get_drug_alternatives(drug_id: int):
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    try:
        # Exact Matches
        cursor.execute("""
            SELECT d.id, d.brand_name_en, d.brand_name_ar, d.price_egp, m.company_name
            FROM substitutes_exact se
            JOIN egyptian_drugs d ON se.substitute_drug_id = d.id
            LEFT JOIN manufacturers m ON d.manufacturer_id = m.id
            WHERE se.drug_id = %s;
        """, (drug_id,))
        exact_matches = [{"drug_id": r[0], "brand_name_en": r[1], "brand_name_ar": r[2], "price_egp": float(r[3]), "manufacturer": r[4]} for r in cursor.fetchall()]

        # Therapeutic Alternatives
        cursor.execute("""
            SELECT d.id, d.brand_name_en, d.brand_name_ar, d.price_egp, st.pharmacological_class
            FROM substitutes_therapeutic st
            JOIN egyptian_drugs d ON st.alternative_drug_id = d.id
            WHERE st.drug_id = %s;
        """, (drug_id,))
        therapeutic = [{"drug_id": r[0], "brand_name_en": r[1], "brand_name_ar": r[2], "price_egp": float(r[3]), "pharmacological_class": r[4]} for r in cursor.fetchall()]

        return {
            "drug_id": drug_id,
            "exact_matches": exact_matches,
            "therapeutic_alternatives": therapeutic
        }
    finally:
        cursor.close()
        conn.close()
