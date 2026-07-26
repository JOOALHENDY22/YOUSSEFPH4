#!/usr/bin/env python3
"""
Specialized Ingestion Pipeline for Alternatives & Emergency Consultation
Processes:
1. دليل_بدائل_الأدوية_المصرية_الموثوق_الشامل.csv
2. دليل_الطوارئ_والأعراض_والحمل_والأعمار_الكامل.csv
Outputs rich master_alternatives_db.json and master_emergency_db.json
"""

import csv
import json
import os
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

base_dir = r"c:\Users\Lenovo\Downloads\Telegram Desktop\app"
csv_alt_new = os.path.join(base_dir, "دليل_بدائل_الأدوية_المصرية_الموثوق_الشامل.csv")
csv_emerg_new = os.path.join(base_dir, "دليل_الطوارئ_والأعراض_والحمل_والأعمار_الكامل.csv")

# 1. Process Alternatives CSV
print("Processing Specialized Alternatives CSV...")
master_alternatives_db = {}
alt_count = 0

if os.path.exists(csv_alt_new):
    with open(csv_alt_new, mode='r', encoding='utf-8-sig', errors='replace') as f:
        reader = csv.reader(f)
        header = next(reader, None)
        
        for row in reader:
            if not row or len(row) < 10:
                continue
            
            drug_name_en = row[1].strip()
            drug_name_ar = row[2].strip()
            price_egp = row[3].strip()
            manufacturer = row[4].strip()
            active_ingredient = row[5].strip()
            exact_index = row[6].strip()
            cheaper_alternative = row[7].strip()
            therapeutic_index = row[8].strip()
            rx_status = row[9].strip()
            pharmacist_recommendation = row[10].strip() if len(row) > 10 else ""

            alt_obj = {
                "drugName": drug_name_en,
                "drugNameAr": drug_name_ar,
                "price_egp": price_egp,
                "manufacturer": manufacturer,
                "activeIngredient": active_ingredient,
                "purpose": f"دواعي الصرف: {therapeutic_index} - حالة الصرف: {rx_status}",
                "identicalSubstitutes": [
                    {
                        "name": f"{drug_name_en} (بديل مطابق معتمد)",
                        "nameAr": f"{drug_name_ar} (مثيل بنفس المادة والتركيز)",
                        "activeIngredient": active_ingredient,
                        "manufacturer": manufacturer,
                        "notes": exact_index or "بديل مطابق 100% بنفس المادة الفعالة والتركيز والفعالية الطبية."
                    },
                    {
                        "name": cheaper_alternative.split('(')[0].strip() if '(' in cheaper_alternative else cheaper_alternative,
                        "nameAr": f"المثيل الأوفر بالسوق المصري ({cheaper_alternative})",
                        "activeIngredient": active_ingredient,
                        "manufacturer": "صناعة دوائية مصرية معتمدة",
                        "notes": f"💡 البديل الأوفر تنافسياً: {cheaper_alternative}"
                    }
                ],
                "therapeuticAlternatives": [
                    {
                        "name": f"بديل من عائلة {therapeutic_index}",
                        "nameAr": f"بديل علاجي آمن ({therapeutic_index})",
                        "activeIngredient": active_ingredient,
                        "notes": pharmacist_recommendation or f"ينصح باستشارة الصيدلي لاختيار البديل الأنسب: {therapeutic_index}."
                    }
                ],
                "pharmacist_recommendation": pharmacist_recommendation
            }

            # Indexing by multiple keys
            keys = [
                drug_name_en.lower().strip(),
                drug_name_ar.strip(),
                re.sub(r'\b\d+.*', '', drug_name_en).strip().lower(),
                re.sub(r'\b\d+.*', '', active_ingredient).strip().lower()
            ]

            for k in keys:
                if k and k not in master_alternatives_db:
                    master_alternatives_db[k] = alt_obj
                    alt_count += 1

print(f"Loaded {alt_count} alternative search entries into master_alternatives_db.json!")

# 2. Process Emergency & Symptoms CSV
print("Processing Specialized Emergency & Symptoms CSV...")
master_emergency_db = { "symptoms": {} }
emerg_count = 0

if os.path.exists(csv_emerg_new):
    with open(csv_emerg_new, mode='r', encoding='utf-8-sig', errors='replace') as f:
        reader = csv.reader(f)
        header = next(reader, None)
        
        for row in reader:
            if not row or len(row) < 11:
                continue
            
            drug_en = row[1].strip()
            drug_ar = row[2].strip()
            active = row[3].strip()
            category = row[4].strip()
            symptoms_and_side_effects = row[5].strip()
            contraindications = row[6].strip()
            pregnancy_category = row[7].strip()
            lactation_rules = row[8].strip()
            age_groups = row[9].strip()
            overdose_toxicity = row[10].strip()
            emergency_protocol = row[11].strip() if len(row) > 11 else ""

            # Extract keywords for symptom matching
            keywords = [
                drug_en.lower().strip(),
                drug_ar.strip(),
                active.lower().strip(),
                category.lower().strip()
            ]
            
            # Add common symptom terms from text
            for word in re.findall(r'[\u0600-\u06FF\w]+', symptoms_and_side_effects):
                if len(word) > 3 and word not in keywords:
                    keywords.append(word.lower())

            emerg_entry = {
                "keywords": keywords,
                "data": {
                    "disclaimer": "⚕️ تنبيه طبي واستشاري هام: هذا الاقتراح للاسترشاد الأولي وحالات الطوارئ والإسعافات الأولية ولا يغني عن الفحص الطبي المباشر!",
                    "assessment": f"التقييم الإكلينيكي لـ ({drug_ar} / {drug_en}): {category} - الفئة العمرية: {age_groups}.",
                    "recommendedOTC": [
                        {
                            "name": drug_en,
                            "arabicName": drug_ar,
                            "activeIngredient": active,
                            "dosage": f"الجرعة وإرشادات الفئة ({age_groups}): أعد ضبط الجرعة طبقاً لإرشادات الصيدلي والنشرة.",
                            "reason": f"دواعي وملاحظات الأمان: {symptoms_and_side_effects}"
                        }
                    ],
                    "precautions": [
                        f"فئة الأمان في الحمل: {pregnancy_category}",
                        f"إرشادات الرضاعة الطبيعية: {lactation_rules}",
                        f"موانع الاستعمال الحادة: {contraindications}"
                    ],
                    "emergencyRedFlags": [
                        f"إرشادات الجرعة الزائدة والتسمم: {overdose_toxicity}",
                        f"🚨 بروتوكول الطوارئ الإكلينيكي: {emergency_protocol}"
                    ]
                }
            }

            key_slug = re.sub(r'[^a-zA-Z0-9]', '_', drug_en.lower()).strip('_')
            master_emergency_db["symptoms"][key_slug] = emerg_entry
            emerg_count += 1

print(f"Loaded {emerg_count} emergency consultation entries into master_emergency_db.json!")

# Save to frontend and backend data directories
frontend_data_dir = os.path.join(base_dir, "frontend", "src", "data")
backend_data_dir = os.path.join(base_dir, "backend", "src", "data")

for ddir in [frontend_data_dir, backend_data_dir]:
    os.makedirs(ddir, exist_ok=True)
    with open(os.path.join(ddir, "master_alternatives_db.json"), 'w', encoding='utf-8') as f:
        json.dump(master_alternatives_db, f, ensure_ascii=False, indent=2)

    with open(os.path.join(ddir, "master_emergency_db.json"), 'w', encoding='utf-8') as f:
        json.dump(master_emergency_db, f, ensure_ascii=False, indent=2)

print("Specialized Databases for Alternatives & Emergency Saved Successfully!")
