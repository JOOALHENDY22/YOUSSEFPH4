-- ==============================================================================
-- Egyptian Pharmaceutical Platform - Production Database Schema (3NF)
-- PostgreSQL DDL Specification
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Pharmacological Classes Table
CREATE TABLE IF NOT EXISTS pharmacological_classes (
    id SERIAL PRIMARY KEY,
    class_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Active Scientific Ingredients Table
CREATE TABLE IF NOT EXISTS active_ingredients (
    id SERIAL PRIMARY KEY,
    inn_name VARCHAR(255) NOT NULL UNIQUE, -- International Nonproprietary Name
    arabic_name VARCHAR(255) NOT NULL,
    pharmacological_class_id INT REFERENCES pharmacological_classes(id) ON DELETE SET NULL,
    mechanism_of_action TEXT,
    pregnancy_category VARCHAR(10) CHECK (pregnancy_category IN ('A', 'B', 'C', 'D', 'X', 'N')),
    lactation_safety_rating VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Manufacturers Table
CREATE TABLE IF NOT EXISTS manufacturers (
    id SERIAL PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL UNIQUE,
    country_of_origin VARCHAR(100) DEFAULT 'Egypt',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Dosage Forms Table
CREATE TABLE IF NOT EXISTS dosage_forms (
    id SERIAL PRIMARY KEY,
    form_name VARCHAR(100) NOT NULL UNIQUE
);

-- 5. Master Drugs Table
CREATE TABLE IF NOT EXISTS drugs (
    id SERIAL PRIMARY KEY,
    trade_name_en VARCHAR(255) NOT NULL,
    trade_name_ar VARCHAR(255) NOT NULL,
    registration_number VARCHAR(100) UNIQUE,
    manufacturer_id INT NOT NULL REFERENCES manufacturers(id) ON DELETE RESTRICT,
    dosage_form_id INT NOT NULL REFERENCES dosage_forms(id) ON DELETE RESTRICT,
    strength_description VARCHAR(100),
    price_egp NUMERIC(10, 2) NOT NULL CHECK (price_egp >= 0),
    age_limit_min_months INT DEFAULT 0 CHECK (age_limit_min_months >= 0),
    is_emergency BOOLEAN DEFAULT FALSE,
    is_prescription_only BOOLEAN DEFAULT FALSE,
    is_scheduled_drug BOOLEAN DEFAULT FALSE,
    storage_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Junction Table: Drugs <-> Active Ingredients
CREATE TABLE IF NOT EXISTS drug_active_ingredients (
    drug_id INT NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
    active_ingredient_id INT NOT NULL REFERENCES active_ingredients(id) ON DELETE RESTRICT,
    strength_amount NUMERIC(10, 3) NOT NULL CHECK (strength_amount > 0),
    strength_unit VARCHAR(50) NOT NULL, -- mg, mcg, ml, %, IU
    PRIMARY KEY (drug_id, active_ingredient_id)
);

-- 6. Pairwise Active Ingredient Interactions Table
CREATE TABLE IF NOT EXISTS ingredient_interactions (
    id SERIAL PRIMARY KEY,
    ingredient_a_id INT NOT NULL REFERENCES active_ingredients(id) ON DELETE CASCADE,
    ingredient_b_id INT NOT NULL REFERENCES active_ingredients(id) ON DELETE CASCADE,
    severity_level VARCHAR(20) NOT NULL CHECK (severity_level IN ('Major', 'Moderate', 'Minor')),
    mechanism TEXT NOT NULL,
    clinical_management TEXT NOT NULL,
    CONSTRAINT unique_ingredient_pair UNIQUE (ingredient_a_id, ingredient_b_id),
    CONSTRAINT check_different_ingredients CHECK (ingredient_a_id <> ingredient_b_id)
);

-- 7. Disease & Chronic Conditions Registry Table
CREATE TABLE IF NOT EXISTS medical_conditions (
    id SERIAL PRIMARY KEY,
    icd10_code VARCHAR(20) UNIQUE,
    condition_name_en VARCHAR(255) NOT NULL,
    condition_name_ar VARCHAR(255) NOT NULL
);

-- 8. Contraindications & Safety Rules Table
CREATE TABLE IF NOT EXISTS contraindications (
    id SERIAL PRIMARY KEY,
    active_ingredient_id INT REFERENCES active_ingredients(id) ON DELETE CASCADE,
    drug_id INT REFERENCES drugs(id) ON DELETE CASCADE,
    condition_id INT REFERENCES medical_conditions(id) ON DELETE CASCADE,
    risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('Absolute', 'Relative')),
    min_age_months INT DEFAULT NULL,
    max_age_months INT DEFAULT NULL,
    pregnancy_forbidden BOOLEAN DEFAULT FALSE,
    lactation_forbidden BOOLEAN DEFAULT FALSE,
    warning_text_en TEXT NOT NULL,
    warning_text_ar TEXT NOT NULL,
    CONSTRAINT check_target_specified CHECK (active_ingredient_id IS NOT NULL OR drug_id IS NOT NULL)
);

-- 9. Symptoms & Emergency Consultation Mapping Tables
CREATE TABLE IF NOT EXISTS symptoms (
    id SERIAL PRIMARY KEY,
    symptom_name_en VARCHAR(255) NOT NULL UNIQUE,
    symptom_name_ar VARCHAR(255) NOT NULL UNIQUE,
    urgency_level VARCHAR(20) CHECK (urgency_level IN ('Routine', 'Urgent', 'Emergency'))
);

CREATE TABLE IF NOT EXISTS symptom_drug_mappings (
    id SERIAL PRIMARY KEY,
    symptom_id INT NOT NULL REFERENCES symptoms(id) ON DELETE CASCADE,
    drug_id INT NOT NULL REFERENCES drugs(id) ON DELETE CASCADE,
    recommendation_tier VARCHAR(20) CHECK (recommendation_tier IN ('First-Line', 'Second-Line', 'OTC-Emergency')),
    clinical_notes TEXT,
    CONSTRAINT unique_symptom_drug UNIQUE (symptom_id, drug_id)
);

-- 10. Side Effects Registry Table
CREATE TABLE IF NOT EXISTS side_effects (
    id SERIAL PRIMARY KEY,
    active_ingredient_id INT NOT NULL REFERENCES active_ingredients(id) ON DELETE CASCADE,
    side_effect_name VARCHAR(255) NOT NULL,
    frequency VARCHAR(20) CHECK (frequency IN ('Common', 'Uncommon', 'Rare', 'Severe')),
    clinical_advice TEXT
);

-- Optimization & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_drugs_trade_en ON drugs(trade_name_en VARCHAR_PATTERN_OPS);
CREATE INDEX IF NOT EXISTS idx_drugs_trade_ar ON drugs(trade_name_ar VARCHAR_PATTERN_OPS);
CREATE INDEX IF NOT EXISTS idx_drugs_price ON drugs(price_egp);
CREATE INDEX IF NOT EXISTS idx_drug_ingredients_lookup ON drug_active_ingredients(active_ingredient_id, drug_id);
CREATE INDEX IF NOT EXISTS idx_interactions_lookup ON ingredient_interactions(ingredient_a_id, ingredient_b_id);
CREATE INDEX IF NOT EXISTS idx_contraindications_lookup ON contraindications(active_ingredient_id, condition_id);
