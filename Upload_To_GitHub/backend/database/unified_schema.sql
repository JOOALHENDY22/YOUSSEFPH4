-- ==============================================================================
-- Unified Master PostgreSQL Schema (3NF) for Egyptian Pharmaceutical Platform
-- Supports Search, Alternatives, Interactions, Emergency, and Triage Consultation
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "fuzzystrmatch";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. ATC Classification
CREATE TABLE IF NOT EXISTS atc_classifications (
    code VARCHAR(10) PRIMARY KEY,
    level_1_name VARCHAR(255) NOT NULL,
    level_2_name VARCHAR(255) NOT NULL,
    level_3_name VARCHAR(255) NOT NULL,
    level_4_name VARCHAR(255) NOT NULL
);

-- 2. Pharmacological Classes
CREATE TABLE IF NOT EXISTS pharmacological_classes (
    id SERIAL PRIMARY KEY,
    atc_code VARCHAR(10) REFERENCES atc_classifications(code) ON DELETE SET NULL,
    class_name_en VARCHAR(255) NOT NULL UNIQUE,
    class_name_ar VARCHAR(255) NOT NULL,
    description TEXT
);

-- 3. Active Ingredients Registry
CREATE TABLE IF NOT EXISTS active_ingredients (
    id SERIAL PRIMARY KEY,
    rxcui VARCHAR(20) UNIQUE,
    inn_name VARCHAR(255) NOT NULL UNIQUE,
    arabic_name VARCHAR(255) NOT NULL,
    pharmacological_class_id INT REFERENCES pharmacological_classes(id) ON DELETE SET NULL,
    mechanism_of_action TEXT,
    pregnancy_category VARCHAR(5) CHECK (pregnancy_category IN ('A', 'B', 'C', 'D', 'X', 'N')),
    lactation_safety VARCHAR(50) DEFAULT 'Consult Physician',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Manufacturers Registry
CREATE TABLE IF NOT EXISTS manufacturers (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL UNIQUE,
    country VARCHAR(100) DEFAULT 'Egypt',
    is_local_egyptian BOOLEAN DEFAULT TRUE
);

-- 5. Dosage Forms Registry
CREATE TABLE IF NOT EXISTS dosage_forms (
    id SERIAL PRIMARY KEY,
    form_name_en VARCHAR(100) NOT NULL UNIQUE,
    form_name_ar VARCHAR(100) NOT NULL
);

-- 6. Unified Master Drugs Table
CREATE TABLE IF NOT EXISTS drugs (
    id SERIAL PRIMARY KEY,
    trade_name_en VARCHAR(255) NOT NULL,
    trade_name_ar VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE,
    manufacturer_id INT NOT NULL REFERENCES manufacturers(id) ON DELETE RESTRICT,
    dosage_form_id INT NOT NULL REFERENCES dosage_forms(id) ON DELETE RESTRICT,
    strength_description VARCHAR(100),
    price_egp NUMERIC(10, 2) NOT NULL CHECK (price_egp > 0),
    is_otc BOOLEAN DEFAULT FALSE,
    is_emergency BOOLEAN DEFAULT FALSE,
    is_scheduled_drug BOOLEAN DEFAULT FALSE,
    high_alert_flag BOOLEAN DEFAULT FALSE,
    toxicity_level VARCHAR(20) DEFAULT 'Low' CHECK (toxicity_level IN ('Low', 'Moderate', 'High', 'Severe')),
    antidote_info TEXT,
    age_limit_min_months INT DEFAULT 0 CHECK (age_limit_min_months >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Junction Table: Drugs <-> Active Ingredients
CREATE TABLE IF NOT EXISTS drug_active_ingredients (
    drug_id INT NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
    active_ingredient_id INT NOT NULL REFERENCES active_ingredients(id) ON DELETE RESTRICT,
    strength_amount NUMERIC(10, 3) NOT NULL CHECK (strength_amount > 0),
    strength_unit VARCHAR(20) NOT NULL,
    PRIMARY KEY (drug_id, active_ingredient_id)
);

-- 7. Drug & Active Ingredient Interactions Matrix
CREATE TABLE IF NOT EXISTS drug_interactions (
    id SERIAL PRIMARY KEY,
    ingredient_a_id INT NOT NULL REFERENCES active_ingredients(id) ON DELETE CASCADE,
    ingredient_b_id INT NOT NULL REFERENCES active_ingredients(id) ON DELETE CASCADE,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('Major', 'Moderate', 'Minor')),
    mechanism TEXT NOT NULL,
    clinical_management TEXT NOT NULL,
    CONSTRAINT unique_interaction_pair UNIQUE (ingredient_a_id, ingredient_b_id),
    CONSTRAINT check_distinct_molecules CHECK (ingredient_a_id <> ingredient_b_id)
);

-- 8. Diseases & Chronic Medical Conditions Registry
CREATE TABLE IF NOT EXISTS medical_conditions (
    id SERIAL PRIMARY KEY,
    icd10_code VARCHAR(20) UNIQUE,
    condition_name_en VARCHAR(255) NOT NULL,
    condition_name_ar VARCHAR(255) NOT NULL
);

-- 9. Patient Profile Safety & Contraindications Rules
CREATE TABLE IF NOT EXISTS contraindications (
    id SERIAL PRIMARY KEY,
    active_ingredient_id INT REFERENCES active_ingredients(id) ON DELETE CASCADE,
    drug_id INT REFERENCES drugs(id) ON DELETE CASCADE,
    condition_id INT REFERENCES medical_conditions(id) ON DELETE CASCADE,
    min_age_months INT DEFAULT NULL,
    max_age_months INT DEFAULT NULL,
    pregnancy_forbidden BOOLEAN DEFAULT FALSE,
    lactation_forbidden BOOLEAN DEFAULT FALSE,
    warning_text_en TEXT NOT NULL,
    warning_text_ar TEXT NOT NULL,
    CONSTRAINT check_contraindication_target CHECK (active_ingredient_id IS NOT NULL OR drug_id IS NOT NULL)
);

-- 10. Symptoms & Automated Triage Module Tables
CREATE TABLE IF NOT EXISTS symptoms (
    id SERIAL PRIMARY KEY,
    symptom_code VARCHAR(50) UNIQUE NOT NULL,
    symptom_name_en VARCHAR(255) NOT NULL,
    symptom_name_ar VARCHAR(255) NOT NULL,
    urgency_level VARCHAR(20) CHECK (urgency_level IN ('Routine-OTC', 'Urgent', 'Emergency-RedFlag'))
);

CREATE TABLE IF NOT EXISTS symptom_otc_mappings (
    id SERIAL PRIMARY KEY,
    symptom_id INT NOT NULL REFERENCES symptoms(id) ON DELETE CASCADE,
    pharmacological_class_id INT NOT NULL REFERENCES pharmacological_classes(id) ON DELETE CASCADE,
    recommendation_tier VARCHAR(20) CHECK (recommendation_tier IN ('First-Line', 'Second-Line')),
    notes TEXT,
    CONSTRAINT unique_symptom_class UNIQUE (symptom_id, pharmacological_class_id)
);

-- High-Performance Indexes
CREATE INDEX IF NOT EXISTS idx_drugs_trade_en_trgm ON drugs USING gin (trade_name_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_drugs_trade_ar_trgm ON drugs USING gin (trade_name_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_drug_active_ingredients_lookup ON drug_active_ingredients(active_ingredient_id, drug_id);
CREATE INDEX IF NOT EXISTS idx_interactions_pair_lookup ON drug_interactions(ingredient_a_id, ingredient_b_id);
CREATE INDEX IF NOT EXISTS idx_contraindications_condition ON contraindications(condition_id, active_ingredient_id);
