-- ==============================================================================
-- YMH DRUG CHECK - Master PostgreSQL 3NF Schema DDL
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 1. Active Ingredients Registry
CREATE TABLE IF NOT EXISTS active_ingredients (
    id SERIAL PRIMARY KEY,
    scientific_name_en VARCHAR(255) NOT NULL UNIQUE,
    scientific_name_ar VARCHAR(255) NOT NULL,
    atc_code VARCHAR(20),
    pregnancy_category VARCHAR(5) CHECK (pregnancy_category IN ('A', 'B', 'C', 'D', 'X', 'N')),
    is_otc BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Manufacturers
CREATE TABLE IF NOT EXISTS manufacturers (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL UNIQUE,
    country VARCHAR(100) DEFAULT 'Egypt'
);

-- 3. Dosage Forms
CREATE TABLE IF NOT EXISTS dosage_forms (
    id SERIAL PRIMARY KEY,
    form_name_en VARCHAR(100) NOT NULL UNIQUE,
    form_name_ar VARCHAR(100) NOT NULL
);

-- 4. Master Egyptian Commercial Drugs Table
CREATE TABLE IF NOT EXISTS egyptian_drugs (
    id SERIAL PRIMARY KEY,
    brand_name_en VARCHAR(255) NOT NULL,
    brand_name_ar VARCHAR(255) NOT NULL,
    price_egp NUMERIC(10, 2) NOT NULL CHECK (price_egp >= 0),
    manufacturer_id INT REFERENCES manufacturers(id) ON DELETE RESTRICT,
    dosage_form_id INT REFERENCES dosage_forms(id) ON DELETE RESTRICT,
    registration_number VARCHAR(100) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Junction: Egyptian Drugs <-> Active Ingredients
CREATE TABLE IF NOT EXISTS drug_active_ingredients (
    drug_id INT NOT NULL REFERENCES egyptian_drugs(id) ON DELETE CASCADE,
    active_ingredient_id INT NOT NULL REFERENCES active_ingredients(id) ON DELETE RESTRICT,
    strength_amount NUMERIC(10, 3) NOT NULL CHECK (strength_amount > 0),
    strength_unit VARCHAR(20) NOT NULL, -- mg, mcg, ml, %, IU
    PRIMARY KEY (drug_id, active_ingredient_id)
);

-- 5. Exact Substitutes Mapping Table
CREATE TABLE IF NOT EXISTS substitutes_exact (
    drug_id INT NOT NULL REFERENCES egyptian_drugs(id) ON DELETE CASCADE,
    substitute_drug_id INT NOT NULL REFERENCES egyptian_drugs(id) ON DELETE CASCADE,
    match_quality_score INT DEFAULT 100 CHECK (match_quality_score BETWEEN 1 AND 100),
    PRIMARY KEY (drug_id, substitute_drug_id),
    CONSTRAINT check_substitute_different CHECK (drug_id <> substitute_drug_id)
);

-- 6. Therapeutic Alternatives Mapping Table
CREATE TABLE IF NOT EXISTS substitutes_therapeutic (
    drug_id INT NOT NULL REFERENCES egyptian_drugs(id) ON DELETE CASCADE,
    alternative_drug_id INT NOT NULL REFERENCES egyptian_drugs(id) ON DELETE CASCADE,
    pharmacological_class VARCHAR(255) NOT NULL,
    PRIMARY KEY (drug_id, alternative_drug_id),
    CONSTRAINT check_alternative_different CHECK (drug_id <> alternative_drug_id)
);

-- 7. Pairwise Drug Interactions Matrix
CREATE TABLE IF NOT EXISTS drug_interactions (
    id SERIAL PRIMARY KEY,
    ingredient_a_id INT NOT NULL REFERENCES active_ingredients(id) ON DELETE CASCADE,
    ingredient_b_id INT NOT NULL REFERENCES active_ingredients(id) ON DELETE CASCADE,
    severity_level VARCHAR(20) NOT NULL CHECK (severity_level IN ('Major', 'Moderate', 'Minor')),
    clinical_mechanism TEXT NOT NULL,
    action_required TEXT NOT NULL,
    CONSTRAINT unique_interaction_pair UNIQUE (ingredient_a_id, ingredient_b_id),
    CONSTRAINT check_distinct_molecules CHECK (ingredient_a_id <> ingredient_b_id)
);

-- 8. Emergency, Toxicity & High-Alert Module Table
CREATE TABLE IF NOT EXISTS emergency_high_alert (
    id SERIAL PRIMARY KEY,
    drug_id INT REFERENCES egyptian_drugs(id) ON DELETE CASCADE,
    active_ingredient_id INT REFERENCES active_ingredients(id) ON DELETE CASCADE,
    high_alert_flag BOOLEAN DEFAULT FALSE,
    toxicity_threshold VARCHAR(100),
    antidote_name VARCHAR(255),
    emergency_instructions TEXT NOT NULL
);

-- 9. Symptoms & OTC Triage Module Tables
CREATE TABLE IF NOT EXISTS symptoms_otc_triage (
    id SERIAL PRIMARY KEY,
    symptom_name_en VARCHAR(255) NOT NULL UNIQUE,
    symptom_name_ar VARCHAR(255) NOT NULL UNIQUE,
    pharmacological_class VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS triage_class_ingredients (
    triage_id INT REFERENCES symptoms_otc_triage(id) ON DELETE CASCADE,
    active_ingredient_id INT REFERENCES active_ingredients(id) ON DELETE CASCADE,
    PRIMARY KEY (triage_id, active_ingredient_id)
);

-- 10. Patient Factors & Contraindications Table
CREATE TABLE IF NOT EXISTS contraindications (
    id SERIAL PRIMARY KEY,
    active_ingredient_id INT NOT NULL REFERENCES active_ingredients(id) ON DELETE CASCADE,
    disease_state VARCHAR(255) NOT NULL,
    min_age_months INT DEFAULT NULL,
    max_age_months INT DEFAULT NULL,
    pregnancy_contraindicated BOOLEAN DEFAULT FALSE,
    lactation_contraindicated BOOLEAN DEFAULT FALSE,
    warning_text TEXT NOT NULL
);

-- Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_egyptian_drugs_brand_en ON egyptian_drugs USING gin (brand_name_en gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_egyptian_drugs_brand_ar ON egyptian_drugs USING gin (brand_name_ar gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_interactions_pair ON drug_interactions(ingredient_a_id, ingredient_b_id);
