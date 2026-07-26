"""
FastAPI Clinical Core Engine
Implements Consultation (Symptom Checker), Phonetic Search & Comparison,
and Pairwise Interaction Matrix with Zero-Crossover Rules.
"""

from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import psycopg2

app = FastAPI(title="Egyptian Pharmaceutical Platform - FastAPI Engine", version="2.0.0")

DB_CONFIG = {"dbname": "pharma_db", "user": "postgres", "password": "password", "host": "localhost", "port": 5432}

class ConsultationRequest(BaseModel):
    symptoms: List[str] = Field(..., example=["headache", "fever"])
    age_years: float = Field(..., example=25)
    gender: str = Field(..., example="M")
    is_pregnant: bool = Field(False)
    is_lactating: bool = Field(False)
    chronic_diseases: List[str] = Field([], example=["hypertension"])
    current_medications: List[str] = Field([], example=["Aspirin"])

class InteractionCheckRequest(BaseModel):
    drug_ids: List[int] = Field(..., example=[101, 102])

# ==============================================================================
# A. Consultation Engine (Symptom Checker & Zero-Crossover Safety Validator)
# ==============================================================================
@app.post("/api/v1/consultation", response_model=Dict[str, Any])
def run_automated_consultation(payload: ConsultationRequest):
    """
    Automated Medical Triage & Consultation Engine:
    1. Maps symptoms to OTC pharmacological classes.
    2. Filters out drugs contraindicated by Age, Pregnancy, Lactation, or Chronic Conditions.
    3. STRICT ZERO-CROSSOVER RULE: Validates candidate OTC drugs against current_medications to ensure NO interactions.
    """
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    try:
        age_months = int(payload.age_years * 12)
        
        # 1. Fetch OTC drug candidates for symptoms
        cursor.execute("""
            SELECT DISTINCT d.id, d.trade_name_en, d.trade_name_ar, d.price_egp, ai.id AS ingredient_id, ai.inn_name
            FROM symptoms s
            JOIN symptom_otc_mappings som ON s.id = som.symptom_id
            JOIN active_ingredients ai ON som.pharmacological_class_id = ai.pharmacological_class_id
            JOIN drug_active_ingredients dai ON ai.id = dai.active_ingredient_id
            JOIN drugs d ON dai.drug_id = d.id
            WHERE LOWER(s.symptom_name_en) IN %s AND d.is_otc = TRUE AND d.age_limit_min_months <= %s;
        """, (tuple([s.lower() for s in payload.symptoms]), age_months))
        candidates = cursor.fetchall()

        if not candidates:
            return {"status": "no_match", "recommendations": [], "note": "No OTC drugs found matching symptoms."}

        safe_recommendations = []
        for candidate in candidates:
            drug_id, name_en, name_ar, price, ing_id, ing_name = candidate

            # 2. Check Contraindications (Age, Pregnancy, Chronic Conditions)
            cursor.execute("""
                SELECT c.warning_text_en 
                FROM contraindications c
                LEFT JOIN medical_conditions mc ON c.condition_id = mc.id
                WHERE (c.active_ingredient_id = %s OR c.drug_id = %s) AND (
                    (c.pregnancy_forbidden = TRUE AND %s = TRUE) OR
                    (c.lactation_forbidden = TRUE AND %s = TRUE) OR
                    (LOWER(mc.condition_name_en) IN %s)
                );
            """, (ing_id, drug_id, payload.is_pregnant, payload.is_lactating, tuple([c.lower() for c in payload.chronic_diseases]) if payload.chronic_diseases else ('none',)))
            contra_warnings = cursor.fetchall()
            
            if contra_warnings:
                continue # Skip unsafe candidate

            # 3. ZERO CROSSOVER RULE: Validate interaction against current medications
            if payload.current_medications:
                cursor.execute("""
                    SELECT di.severity, di.mechanism 
                    FROM drug_interactions di
                    JOIN drug_active_ingredients dai_curr ON (di.ingredient_a_id = dai_curr.active_ingredient_id OR di.ingredient_b_id = dai_curr.active_ingredient_id)
                    JOIN drugs d_curr ON dai_curr.drug_id = d_curr.id
                    WHERE dai_curr.active_ingredient_id <> %s AND (
                        (di.ingredient_a_id = %s AND di.ingredient_b_id = dai_curr.active_ingredient_id) OR
                        (di.ingredient_b_id = %s AND di.ingredient_a_id = dai_curr.active_ingredient_id)
                    ) AND LOWER(d_curr.trade_name_en) IN %s;
                """, (ing_id, ing_id, ing_id, tuple([m.lower() for m in payload.current_medications])))
                interaction_conflict = cursor.fetchone()
                
                if interaction_conflict:
                    continue # Skip due to Drug-Drug Interaction crossover conflict!

            safe_recommendations.append({
                "drug_id": drug_id,
                "trade_name_en": name_en,
                "trade_name_ar": name_ar,
                "price_egp": float(price),
                "active_ingredient": ing_name
            })

        return {
            "status": "success",
            "patient_age_years": payload.age_years,
            "total_safe_recommendations": len(safe_recommendations),
            "recommendations": safe_recommendations
        }
    finally:
        cursor.close()
        conn.close()

# ==============================================================================
# B. Phonetic Search & Side-by-Side Comparison Engine
# ==============================================================================
@app.get("/api/v1/search-compare")
def phonetic_search_and_compare(drug_a: str, drug_b: str):
    """Phonetic fuzzy search and side-by-side drug comparison API."""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    try:
        query = """
            SELECT d.id, d.trade_name_en, d.trade_name_ar, d.price_egp, m.company_name, df.form_name_en, ai.inn_name, ai.pregnancy_category
            FROM drugs d
            JOIN manufacturers m ON d.manufacturer_id = m.id
            JOIN dosage_forms df ON d.dosage_form_id = df.id
            JOIN drug_active_ingredients dai ON d.id = dai.drug_id
            JOIN active_ingredients ai ON dai.active_ingredient_id = ai.id
            WHERE LOWER(d.trade_name_en) % LOWER(%s) OR LOWER(d.trade_name_en) % LOWER(%s)
               OR d.trade_name_en ILIKE %s OR d.trade_name_en ILIKE %s;
        """
        cursor.execute(query, (drug_a, drug_b, f"%{drug_a}%", f"%{drug_b}%"))
        rows = cursor.fetchall()
        
        compared = []
        for r in rows:
            compared.append({
                "drug_id": r[0],
                "trade_name_en": r[1],
                "trade_name_ar": r[2],
                "price_egp": float(r[3]),
                "manufacturer": r[4],
                "dosage_form": r[5],
                "active_ingredient": r[6],
                "pregnancy_category": r[7]
            })

        return {"status": "success", "compared_drugs": compared}
    finally:
        cursor.close()
        conn.close()

# ==============================================================================
# C. Interaction Matrix Scanner
# ==============================================================================
@app.post("/api/v1/check-interactions")
def check_drug_interactions_api(payload: InteractionCheckRequest):
    """Pairwise Drug Interaction Checker against database matrix."""
    conn = psycopg2.connect(**DB_CONFIG)
    cursor = conn.cursor()
    try:
        cursor.execute("""
            SELECT d1.trade_name_en, d2.trade_name_en, di.severity, di.mechanism, di.clinical_management
            FROM drug_active_ingredients dai1
            JOIN drug_active_ingredients dai2 ON dai1.active_ingredient_id <> dai2.active_ingredient_id
            JOIN drug_interactions di ON (di.ingredient_a_id = dai1.active_ingredient_id AND di.ingredient_b_id = dai2.active_ingredient_id)
            JOIN drugs d1 ON d1.id = dai1.drug_id
            JOIN drugs d2 ON d2.id = dai2.drug_id
            WHERE dai1.drug_id IN %s AND dai2.drug_id IN %s AND dai1.drug_id < dai2.drug_id;
        """, (tuple(payload.drug_ids), tuple(payload.drug_ids)))
        rows = cursor.fetchall()
        
        results = [{"drug_a": r[0], "drug_b": r[1], "severity": r[2], "mechanism": r[3], "clinical_management": r[4]} for r in rows]
        return {"total_interactions": len(results), "interactions": results}
    finally:
        cursor.close()
        conn.close()
