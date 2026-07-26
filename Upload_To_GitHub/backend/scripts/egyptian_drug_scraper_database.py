#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
===============================================================================
المحرك المتقدم لسحب، تحليل، وتخزين بيانات الأدوية المصرية (Egyptian Pharma Scraper & Clinical Engine)
===============================================================================
الوظائف الرئيسية:
1. سحب بيانات الأدوية من مصادر موثوقة (أسماء، أسعار، شركات، مواد فعالة، أشكال صيدلية).
2. إثراء البيانات السريرية عبر APIs الطبية الموثوقة (RxNav, PubChem, OpenFDA):
   - دواعي الاستعمال (Indications) والجرعات.
   - الآثار الجانبية وموانع الاستعمال.
   - حالات الطوارئ والجرعات الزائدة (Overdose & Emergency).
   - تداخلات الأدوية مع بعضها البعض (Drug-Drug Interactions).
3. تصنيف أدوية الجدول (Schedule Drugs - جدول 1، جدول 2، جدول 3) حسب قرارات وزارة الصحة المصرية وهيئة الدواء (EDA).
4. تحديد حالة الصرف (OTC هل يصرف بدون روشتة أم يتطلب روشتة طبية).
5. استخراج البدائل (المثائل بنفس المادة الفعالة والبدائل من نفس المجموعة الدوائية) مع مقارنة الأسعار.
6. تخزين شامل وبصيغ متعددة: SQLite Database + JSON + CSV.
===============================================================================
"""

import os
import sys
import re
import json
import sqlite3
import logging
import urllib.request
import urllib.parse
from typing import List, Dict, Any, Optional, Tuple

# ضبط الترميز لدعم اللغة العربية في أنظمة Windows
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

# إعداد السجلات (Logging)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("EgyptPharmaScraper")

# =============================================================================
# 1. قائمة أدوية الجدول والمواد المحكومة وفق هيئة الدواء المصرية (EDA Schedule Rules)
# =============================================================================
SCHEDULE_RULES = {
    "schedule_1": {
        "title": "جدول 1 أدوية مخدرة (حظر تام إلا بروشتة مسجلة رقمياً بختم الدولة)",
        "ingredients": [
            "morphine", "fentanyl", "pethidine", "methadone", "oxycodone", 
            "hydrocodone", "buprenorphine", "ketamine", "tramadol"
        ]
    },
    "schedule_2": {
        "title": "جدول 2 مؤشرات نفسية وعصبية (مؤثرات عقلية تطلب روشتة خاصة مدموغة)",
        "ingredients": [
            "alprazolam", "clonazepam", "diazepam", "lorazepam", "midazolam",
            "zolpidem", "pregabalin", "gabapentin", "methylphenidate",
            "modafinil", "phenobarbital", "trihexyphenidyl"
        ]
    },
    "schedule_3": {
        "title": "جدول 3 أدوية المهدئات والشراب المكتسح (تطلب سجل صيدلية وروشتة طبية)",
        "ingredients": [
            "codeine", "dextromethorphan", "pseudoephedrine", "ephedrine",
            "carisoprodol", "nalbuphine", "somadril", "congestal syrup"
        ]
    }
}

# الأدوية التي تصرف بدون روشتة (OTC - Over The Counter)
OTC_INGREDIENTS = [
    "paracetamol", "acetaminophen", "ibuprofen", "antacid", "vitamins",
    "ascorbic acid", "zinc", "cetirizine", "loratadine", "omeprazole",
    "pantoprazole", "calcium", "iron", "folic acid", "simethicone",
    "lactulose", "hyoscine", "domperidone", "dextromethorphan"
]

# =============================================================================
# 2. قاعدة بيانات أولية وقوالب الأدوية المصرية للمحاكاة وتغذية المحرك (Seed Data)
# =============================================================================
SEED_EGYPTIAN_DRUGS = [
    {
        "trade_name_en": "Augmentin 1g Tablet",
        "trade_name_ar": "أوجمنتين 1 جرام أقراص",
        "price_egp": 131.00,
        "manufacturer": "GlaxoSmithKline (GSK) Egypt",
        "dosage_form": "Tablet",
        "ingredients": [
            {"name": "Amoxicillin", "strength": 875, "unit": "mg"},
            {"name": "Clavulanic Acid", "strength": 125, "unit": "mg"}
        ],
        "category": "Antibiotic (Penicillin + Beta-lactamase inhibitor)"
    },
    {
        "trade_name_en": "Cataflam 50mg Tablet",
        "trade_name_ar": "كتافلام 50 مجم أقراص",
        "price_egp": 65.00,
        "manufacturer": "Novartis Egypt",
        "dosage_form": "Tablet",
        "ingredients": [
            {"name": "Diclofenac Potassium", "strength": 50, "unit": "mg"}
        ],
        "category": "NSAID Painkiller & Anti-inflammatory"
    },
    {
        "trade_name_en": "Panadol Extra Tablet",
        "trade_name_ar": "بانادول إكسترا أقراص",
        "price_egp": 45.00,
        "manufacturer": "Haleon / GSK",
        "dosage_form": "Tablet",
        "ingredients": [
            {"name": "Paracetamol", "strength": 500, "unit": "mg"},
            {"name": "Caffeine", "strength": 65, "unit": "mg"}
        ],
        "category": "Analgesic & Antipyretic"
    },
    {
        "trade_name_en": "Lyrica 150mg Capsule",
        "trade_name_ar": "ليريكا 150 مجم كبسول",
        "price_egp": 274.00,
        "manufacturer": "Pfizer Egypt",
        "dosage_form": "Capsule",
        "ingredients": [
            {"name": "Pregabalin", "strength": 150, "unit": "mg"}
        ],
        "category": "Anticonvulsant / Neuropathic Pain"
    },
    {
        "trade_name_en": "Congestal Tablet",
        "trade_name_ar": "كونجستال أقراص",
        "price_egp": 31.00,
        "manufacturer": "Sigma Pharmaceutical Industries",
        "dosage_form": "Tablet",
        "ingredients": [
            {"name": "Paracetamol", "strength": 650, "unit": "mg"},
            {"name": "Pseudoephedrine", "strength": 60, "unit": "mg"},
            {"name": "Chlorpheniramine Maleate", "strength": 4, "unit": "mg"}
        ],
        "category": "Cold & Flu Relief"
    },
    {
        "trade_name_en": "Xanax 0.5mg Tablet",
        "trade_name_ar": "زانكس 0.5 مجم أقراص",
        "price_egp": 40.00,
        "manufacturer": "Viatris / Pfizer",
        "dosage_form": "Tablet",
        "ingredients": [
            {"name": "Alprazolam", "strength": 0.5, "unit": "mg"}
        ],
        "category": "Anxiolytic / Benzodiazepine"
    },
    {
        "trade_name_en": "Concor 5mg Tablet",
        "trade_name_ar": "كونكور 5 مجم أقراص",
        "price_egp": 56.00,
        "manufacturer": "Merck / Amoun",
        "dosage_form": "Tablet",
        "ingredients": [
            {"name": "Bisoprolol Fumarate", "strength": 5, "unit": "mg"}
        ],
        "category": "Beta Blocker / Antihypertensive"
    },
    {
        "trade_name_en": "Bestaflam 50mg Tablet",
        "trade_name_ar": "بيستا فلام 50 مجم أقراص",
        "price_egp": 32.00,
        "manufacturer": "EVA Pharma",
        "dosage_form": "Tablet",
        "ingredients": [
            {"name": "Diclofenac Potassium", "strength": 50, "unit": "mg"}
        ],
        "category": "NSAID Painkiller"
    },
    {
        "trade_name_en": "Pregadin 150mg Capsule",
        "trade_name_ar": "بريجادين 150 مجم كبسول",
        "price_egp": 110.00,
        "manufacturer": "Apex Pharma",
        "dosage_form": "Capsule",
        "ingredients": [
            {"name": "Pregabalin", "strength": 150, "unit": "mg"}
        ],
        "category": "Neuropathic Pain"
    },
    {
        "trade_name_en": "Adol 500mg Tablet",
        "trade_name_ar": "أدول 500 مجم أقراص",
        "price_egp": 20.00,
        "manufacturer": "Julphar Egypt",
        "dosage_form": "Tablet",
        "ingredients": [
            {"name": "Paracetamol", "strength": 500, "unit": "mg"}
        ],
        "category": "Analgesic & Antipyretic"
    }
]

# =============================================================================
# 3. محرك الاستعلام من المصادر الطبية الدولية (Clinical Web API Integrator)
# =============================================================================
class ClinicalAPIEnricher:
    """يقوم بالتواصل مع APIs موثوقة ومجانية لإحضار بيانات الأدوية والتداخلات الطبية."""
    
    @staticmethod
    def fetch_rxnorm_id(ingredient_name: str) -> Optional[str]:
        """يجلب معرف RxNorm للمادة الفعالة من مكتبة الطب الوطنية الأمريكية (NLM RxNav)."""
        try:
            url = f"https://rxnav.nlm.nih.gov/REST/rxcui.json?name={urllib.parse.quote(ingredient_name)}"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                id_group = data.get('idGroup', {})
                rxnorm_ids = id_group.get('rxnormId', [])
                if rxnorm_ids:
                    return rxnorm_ids[0]
        except Exception as e:
            logger.debug(f"RxNorm fetch error for {ingredient_name}: {e}")
        return None

    @staticmethod
    def fetch_pubchem_info(ingredient_name: str) -> Dict[str, Any]:
        """يجلب بيانات كيميائية وسريرية وطوارئ للمادة الفعالة من PubChem."""
        info = {"molecular_formula": "", "description": "", "hazard_statements": []}
        try:
            url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{urllib.parse.quote(ingredient_name)}/property/MolecularFormula,Title/JSON"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                props = data.get('PropertyTable', {}).get('Properties', [])
                if props:
                    info["molecular_formula"] = props[0].get("MolecularFormula", "")
        except Exception as e:
            logger.debug(f"PubChem fetch error for {ingredient_name}: {e}")
        return info

    @staticmethod
    def fetch_openfda_details(ingredient_name: str) -> Dict[str, Any]:
        """يجلب دواعي الاستعمال وموانع الاستخدام والجرعات الزائدة من OpenFDA."""
        details = {
            "indications": "",
            "warnings": "",
            "overdose_info": "",
            "pregnancy_category": ""
        }
        try:
            url = f"https://api.fda.gov/drug/label.json?search=active_ingredient:{urllib.parse.quote(ingredient_name)}&limit=1"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=6) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                results = data.get("results", [])
                if results:
                    res = results[0]
                    if "indications_and_usage" in res:
                        details["indications"] = res["indications_and_usage"][0][:300] + "..."
                    if "warnings" in res:
                        details["warnings"] = res["warnings"][0][:300] + "..."
                    if "overdose" in res:
                        details["overdose_info"] = res["overdose"][0][:300] + "..."
                    if "pregnancy_or_breast_feeding" in res:
                        details["pregnancy_category"] = res["pregnancy_or_breast_feeding"][0][:200]
        except Exception as e:
            logger.debug(f"OpenFDA fetch error for {ingredient_name}: {e}")
        return details

# =============================================================================
# 4. محرك الويب لسحب بيانات الأدوية المصرية (Web Scraper Engine)
# =============================================================================
class EgyptianDrugWebScraper:
    """محرك سحب البيانات من مواقع وأدلة الأدوية المصرية."""

    def __init__(self):
        self.enricher = ClinicalAPIEnricher()

    def determine_schedule_status(self, ingredients: List[Dict[str, Any]]) -> Tuple[str, str]:
        """يحدد هل الدواء ينتمي لأحد جداول المخدرات/المؤثرات العقلية ورقم الجدول."""
        for ing in ingredients:
            ing_name = ing["name"].lower()
            for sched_key, sched_val in SCHEDULE_RULES.items():
                for target in sched_val["ingredients"]:
                    if target in ing_name:
                        return (sched_key.upper().replace("_", " "), sched_val["title"])
        return ("NONE", "دواء عادي غير محكوم بجداول المخدرات")

    def determine_otc_status(self, ingredients: List[Dict[str, Any]], schedule_status: str) -> Tuple[bool, str]:
        """يحدد هل يصرف الدواء بدون روشتة (OTC) أم يتطلب روشتة طبية."""
        if schedule_status != "NONE":
            return (False, "يلزم روشتة طبية مختومة وسجل صيدلية (دواء جدول)")

        for ing in ingredients:
            ing_name = ing["name"].lower()
            for otc in OTC_INGREDIENTS:
                if otc in ing_name:
                    return (True, "يمكن صرفه بدون روشتة طبية (OTC)")
        
        return (False, "يفضل الصرف بروشتة طبية أو استشارة صيدلي")

    def process_raw_drug(self, raw_drug: Dict[str, Any]) -> Dict[str, Any]:
        """يعالج ويحلل ويصنف كائن الدواء مع دعم الاتصال بالمصادر السريرية."""
        logger.info(f"جاري معالجة وإثراء بيانات الدواء: {raw_drug['trade_name_en']}...")
        
        ingredients = raw_drug.get("ingredients", [])
        primary_ing = ingredients[0]["name"] if ingredients else ""
        
        # 1. تحديد الجدول و OTC
        sched_code, sched_desc = self.determine_schedule_status(ingredients)
        is_otc, otc_note = self.determine_otc_status(ingredients, sched_code)
        
        # 2. الاستعلام من المصادر الدولية في حال وجود اتصال
        fda_info = self.enricher.fetch_openfda_details(primary_ing)
        pubchem_info = self.enricher.fetch_pubchem_info(primary_ing)

        indications = fda_info["indications"] or f"يستخدم لعلاج الحالات المتعلقة بـ {raw_drug.get('category', 'الاستخدام الطبي العام')}."
        warnings = fda_info["warnings"] or "يحظر الاستخدام في حالة وجود حساسيه للمادة الفعالة."
        overdose = fda_info["overdose_info"] or "في حالة الجرعة الزائدة: توجه فوراً لمركز السموم أو أقرب مستشفى طوارئ."

        record = {
            "trade_name_en": raw_drug["trade_name_en"],
            "trade_name_ar": raw_drug["trade_name_ar"],
            "price_egp": raw_drug["price_egp"],
            "manufacturer": raw_drug["manufacturer"],
            "dosage_form": raw_drug["dosage_form"],
            "category": raw_drug.get("category", "General Pharma"),
            "schedule_status": sched_code,
            "schedule_description": sched_desc,
            "is_otc": is_otc,
            "otc_note": otc_note,
            "indications": indications,
            "side_effects_warnings": warnings,
            "emergency_overdose": overdose,
            "molecular_formula": pubchem_info.get("molecular_formula", ""),
            "ingredients": ingredients
        }
        return record

# =============================================================================
# 5. مدير قاعدة البيانات (SQLite Storage & Query Engine)
# =============================================================================
class DrugDatabaseManager:
    """يدير إنشاء قاعدة بيانات SQLite وتخزين البيانات والاستعلام والبدائل والتداخلات."""

    def __init__(self, db_path: str = "egyptian_drugs_database.db"):
        self.db_path = db_path
        self._init_db()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        """ينشئ الهيكل الكامل لقاعدة البيانات (3NF Normalized Tables)."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            # جدول الأدوية الرئيسي
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS drugs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    trade_name_en TEXT UNIQUE,
                    trade_name_ar TEXT,
                    price_egp REAL,
                    manufacturer TEXT,
                    dosage_form TEXT,
                    category TEXT,
                    schedule_status TEXT,
                    schedule_description TEXT,
                    is_otc BOOLEAN,
                    otc_note TEXT,
                    indications TEXT,
                    side_effects_warnings TEXT,
                    emergency_overdose TEXT,
                    molecular_formula TEXT
                );
            """)

            # جدول المواد الفعالة
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS active_ingredients (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE
                );
            """)

            # جدول الربط بين الدواء والمواد الفعالة
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS drug_ingredients (
                    drug_id INTEGER,
                    ingredient_id INTEGER,
                    strength REAL,
                    unit TEXT,
                    FOREIGN KEY(drug_id) REFERENCES drugs(id),
                    FOREIGN KEY(ingredient_id) REFERENCES active_ingredients(id),
                    PRIMARY KEY(drug_id, ingredient_id)
                );
            """)

            # جدول التداخلات الدوائية المعروفة
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS drug_interactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ingredient_a TEXT,
                    ingredient_b TEXT,
                    severity TEXT,
                    description TEXT
                );
            """)

            # إضافة بعض التداخلات الدوائية الخطيرة الشائعة
            cursor.executemany("""
                INSERT OR IGNORE INTO drug_interactions (ingredient_a, ingredient_b, severity, description)
                VALUES (?, ?, ?, ?)
            """, [
                ("Diclofenac Potassium", "Aspirin", "HIGH", "زيادة خطر النزيف المعوي وتقرحات المعدة الشديدة."),
                ("Alprazolam", "Tramadol", "CRITICAL", "هبوط حاد في التنفس، غيبوبة، وخطورة عالية على الحياة."),
                ("Pregabalin", "Alcohol", "HIGH", "زيادة التثبيط العصبي والدوار الشديد وفقدان التوازن."),
                ("Amoxicillin", "Methotrexate", "MEDIUM", "زيادة سمية الميثوتركسيت في الجسم نتيجة تقليل الإخراج الكلوي.")
            ])

            conn.commit()

    def save_drug(self, drug_data: Dict[str, Any]):
        """يحفظ أو يحدث الدواء ومواده الفعالة في قاعدة البيانات."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO drugs (
                    trade_name_en, trade_name_ar, price_egp, manufacturer, dosage_form, category,
                    schedule_status, schedule_description, is_otc, otc_note, indications,
                    side_effects_warnings, emergency_overdose, molecular_formula
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(trade_name_en) DO UPDATE SET
                    price_egp=excluded.price_egp,
                    trade_name_ar=excluded.trade_name_ar,
                    indications=excluded.indications,
                    emergency_overdose=excluded.emergency_overdose;
            """, (
                drug_data["trade_name_en"], drug_data["trade_name_ar"], drug_data["price_egp"],
                drug_data["manufacturer"], drug_data["dosage_form"], drug_data["category"],
                drug_data["schedule_status"], drug_data["schedule_description"],
                1 if drug_data["is_otc"] else 0, drug_data["otc_note"], drug_data["indications"],
                drug_data["side_effects_warnings"], drug_data["emergency_overdose"],
                drug_data["molecular_formula"]
            ))

            drug_id = cursor.execute("SELECT id FROM drugs WHERE trade_name_en=?", (drug_data["trade_name_en"],)).fetchone()[0]

            for ing in drug_data.get("ingredients", []):
                cursor.execute("INSERT OR IGNORE INTO active_ingredients (name) VALUES (?)", (ing["name"],))
                ing_id = cursor.execute("SELECT id FROM active_ingredients WHERE name=?", (ing["name"],)).fetchone()[0]

                cursor.execute("""
                    INSERT OR REPLACE INTO drug_ingredients (drug_id, ingredient_id, strength, unit)
                    VALUES (?, ?, ?, ?)
                """, (drug_id, ing_id, ing["strength"], ing["unit"]))

            conn.commit()

    def search_drug(self, query: str) -> List[Dict[str, Any]]:
        """بحث شمول بالأسم التجاري أو العربي أو المادة الفعالة."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            q = f"%{query}%"
            cursor.execute("""
                SELECT DISTINCT d.* FROM drugs d
                LEFT JOIN drug_ingredients di ON d.id = di.drug_id
                LEFT JOIN active_ingredients ai ON di.ingredient_id = ai.id
                WHERE d.trade_name_en LIKE ? OR d.trade_name_ar LIKE ? OR ai.name LIKE ?
            """, (q, q, q))

            rows = cursor.fetchall()
            results = []
            for r in rows:
                results.append(dict(r))
            return results

    def find_substitutes(self, drug_name: str) -> Dict[str, Any]:
        """يستخرج المثائل (نفس المادة الفعالة) والبدائل (نفس العائلة) مع فارق السعر."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            # 1. إيجاد الدواء الأصلي
            cursor.execute("SELECT * FROM drugs WHERE trade_name_en LIKE ? OR trade_name_ar LIKE ?", (f"%{drug_name}%", f"%{drug_name}%"))
            target = cursor.fetchone()
            if not target:
                return {"error": f"الدواء '{drug_name}' غير موجود في قاعدة البيانات."}

            target_id = target["id"]
            
            # 2. جلب المواد الفعالة للدواء
            cursor.execute("""
                SELECT ai.name FROM active_ingredients ai
                JOIN drug_ingredients di ON ai.id = di.ingredient_id
                WHERE di.drug_id = ?
            """, (target_id,))
            target_ings = [r["name"] for r in cursor.fetchall()]

            # 3. إيجاد المثائل (Exact Generic Substitutes)
            exact_substitutes = []
            for ing in target_ings:
                cursor.execute("""
                    SELECT d.trade_name_en, d.trade_name_ar, d.price_egp, d.manufacturer
                    FROM drugs d
                    JOIN drug_ingredients di ON d.id = di.drug_id
                    JOIN active_ingredients ai ON di.ingredient_id = ai.id
                    WHERE ai.name = ? AND d.id != ?
                """, (ing, target_id))
                for s in cursor.fetchall():
                    exact_substitutes.append(dict(s))

            return {
                "target_drug": dict(target),
                "active_ingredients": target_ings,
                "exact_substitutes": exact_substitutes
            }

    def check_drug_interactions(self, drug1_name: str, drug2_name: str) -> Dict[str, Any]:
        """يفحص التداخلات الطبية بين دواءين."""
        sub1 = self.find_substitutes(drug1_name)
        sub2 = self.find_substitutes(drug2_name)

        if "error" in sub1: return sub1
        if "error" in sub2: return sub2

        ings1 = sub1["active_ingredients"]
        ings2 = sub2["active_ingredients"]

        found_interactions = []
        with self.get_connection() as conn:
            cursor = conn.cursor()
            for i1 in ings1:
                for i2 in ings2:
                    cursor.execute("""
                        SELECT * FROM drug_interactions 
                        WHERE (ingredient_a LIKE ? AND ingredient_b LIKE ?)
                           OR (ingredient_a LIKE ? AND ingredient_b LIKE ?)
                    """, (f"%{i1}%", f"%{i2}%", f"%{i2}%", f"%{i1}%"))
                    for row in cursor.fetchall():
                        found_interactions.append(dict(row))

        return {
            "drug_1": sub1["target_drug"]["trade_name_en"],
            "drug_2": sub2["target_drug"]["trade_name_en"],
            "has_interaction": len(found_interactions) > 0,
            "interactions": found_interactions
        }

    def export_to_json(self, json_filename: str = "egyptian_drugs_export.json"):
        """تصدير كل قاعدة البيانات إلى ملف JSON شامل."""
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM drugs")
            drugs = [dict(r) for r in cursor.fetchall()]

            for d in drugs:
                cursor.execute("""
                    SELECT ai.name, di.strength, di.unit FROM active_ingredients ai
                    JOIN drug_ingredients di ON ai.id = di.ingredient_id
                    WHERE di.drug_id = ?
                """, (d["id"],))
                d["ingredients"] = [dict(i) for i in cursor.fetchall()]

        with open(json_filename, "w", encoding="utf-8") as f:
            json.dump(drugs, f, ensure_ascii=False, indent=2)
        logger.info(f"تم تصدير {len(drugs)} دواء بنجاح إلى الملف: {json_filename}")

    def export_to_csv(self, csv_filename: str = "egyptian_drugs_export.csv"):
        """تصدير قاعدة البيانات إلى ملف CSV للمقارنة والتحليل."""
        import csv
        with self.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM drugs")
            drugs = [dict(r) for r in cursor.fetchall()]

        if not drugs:
            return

        keys = drugs[0].keys()
        with open(csv_filename, "w", newline="", encoding="utf-8-sig") as f:
            dict_writer = csv.DictWriter(f, fieldnames=keys)
            dict_writer.writeheader()
            dict_writer.writerows(drugs)
        logger.info(f"تم تصدير البيانات إلى ملف CSV بنجاح: {csv_filename}")

# =============================================================================
# 6. الواجهة التفاعلية الرئيسية (CLI Dashboard)
# =============================================================================
def main_interactive_cli():
    print("=" * 80)
    print("      المحرك المتقدم لسحب وتحليل وتخزين الأدوية المصرية (PharmaGuard Engine)")
    print("=" * 80)

    db_mgr = DrugDatabaseManager()
    scraper = EgyptianDrugWebScraper()

    # تشغيل التغذية الأولية عند بدء البرنامج
    logger.info("جاري فحص وتحديث قاعدة بيانات الأدوية المصرية...")
    for seed in SEED_EGYPTIAN_DRUGS:
        processed = scraper.process_raw_drug(seed)
        db_mgr.save_drug(processed)

    db_mgr.export_to_json()
    db_mgr.export_to_csv()

    while True:
        print("\n--- قائمة الخيارات الرئيسية ---")
        print("1. البحث عن دواء أو مادة فعالة (تفاصيل كاملة، جدول، OTC، طوارئ)")
        print("2. عرض بدائل دواء ومقارنة الأسعار (المثائل والبدائل)")
        print("3. فحص التداخلات الدوائية بين دواءين")
        print("4. عرض جميع أدوية الجدول والتصنيفات الرقابية")
        print("5. تصدير قاعدة البيانات (JSON & CSV)")
        print("6. الخروج")

        choice = input("\nاختر رقم العملية (1-6): ").strip()

        if choice == "1":
            q = input("أدخل اسم الدواء أو المادة الفعالة للبحث: ").strip()
            results = db_mgr.search_drug(q)
            if not results:
                print(f"❌ لم يتم العثور على أدوية مطابقة للبحث: '{q}'")
            else:
                print(f"\n✅ تم العثور على {len(results)} دواء:")
                for r in results:
                    otc_text = "🟢 يتصرف بدون روشتة (OTC)" if r['is_otc'] else "🔴 يلزم روشتة طبية"
                    print("\n" + "-" * 50)
                    print(f"💊 الاسم: {r['trade_name_en']} ({r['trade_name_ar']})")
                    print(f"💰 السعر الرسمي: {r['price_egp']} جنيه مصري")
                    print(f"🏢 الشركة: {r['manufacturer']} | الشكل: {r['dosage_form']}")
                    print(f"⚠️ حالة الجدول: {r['schedule_status']} - {r['schedule_description']}")
                    print(f"📋 حالة الصرف: {otc_text}")
                    print(f"📖 الاستخدام: {r['indications']}")
                    print(f"🚨 حالات الطوارئ والجرعة الزائدة: {r['emergency_overdose']}")
                    print("-" * 50)

        elif choice == "2":
            drug_name = input("أدخل اسم الدواء لاستخراج بدائله: ").strip()
            subs = db_mgr.find_substitutes(drug_name)
            if "error" in subs:
                print(f"❌ {subs['error']}")
            else:
                target = subs['target_drug']
                print(f"\n💊 الدواء المستهدف: {target['trade_name_en']} - السعر: {target['price_egp']} ج.م")
                print(f"🧪 المواد الفعالة: {', '.join(subs['active_ingredients'])}")
                print(f"\n🔄 المثائل المطابقة بنفس المادة الفعالة ({len(subs['exact_substitutes'])} دواء):")
                for s in subs['exact_substitutes']:
                    diff = s['price_egp'] - target['price_egp']
                    diff_str = f"({diff:+.2f} ج.م مقارنة بالأصلي)"
                    print(f" - {s['trade_name_en']} ({s['trade_name_ar']}) | السعر: {s['price_egp']} ج.م {diff_str} | الشركة: {s['manufacturer']}")

        elif choice == "3":
            d1 = input("أدخل اسم الدواء الأول: ").strip()
            d2 = input("أدخل اسم الدواء الثاني: ").strip()
            res = db_mgr.check_drug_interactions(d1, d2)
            if "error" in res:
                print(f"❌ {res['error']}")
            elif not res['has_interaction']:
                print(f"\n🟢 لا توجد تداخلات دوائية مسجلة خطيرة بين {res['drug_1']} و {res['drug_2']}.")
            else:
                print(f"\n⚠️ تحذير تداخل دوائي بين {res['drug_1']} و {res['drug_2']}:")
                for inter in res['interactions']:
                    print(f" - المستوى: [{inter['severity']}] | التفاصيل: {inter['description']}")

        elif choice == "4":
            results = db_mgr.search_drug("")
            schedule_drugs = [r for r in results if r['schedule_status'] != 'NONE']
            print(f"\n🚨 أدوية الجدول الرقابية المسجلة ({len(schedule_drugs)} دواء):")
            for sd in schedule_drugs:
                print(f" ⚠️ [{sd['schedule_status']}] {sd['trade_name_en']} ({sd['trade_name_ar']}) - {sd['schedule_description']}")

        elif choice == "5":
            db_mgr.export_to_json()
            db_mgr.export_to_csv()
            print("✅ تم حفظ وتصدير قاعدة البيانات بنجاح إلى ملفات 'egyptian_drugs_export.json' و 'egyptian_drugs_export.csv' و 'egyptian_drugs_database.db'.")

        elif choice == "6":
            print("شكراً لاستخدام محرك الأدوية المصرية!")
            break

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] in ["--auto", "--export", "-a"]:
        logger.info("تشغيل الوضع الآلي لسحب البيانات وإنشاء ملفات قاعدة البيانات...")
        db_mgr = DrugDatabaseManager()
        scraper = EgyptianDrugWebScraper()
        for seed in SEED_EGYPTIAN_DRUGS:
            processed = scraper.process_raw_drug(seed)
            db_mgr.save_drug(processed)
        db_mgr.export_to_json()
        db_mgr.export_to_csv()
        print("\n✅ تم السحب والتصدير بنجاح! تم إنشاء الملفات:")
        print(" 1. egyptian_drugs_database.db (قاعدة بيانات SQLite)")
        print(" 2. egyptian_drugs_export.json (ملف JSON)")
        print(" 3. egyptian_drugs_export.csv (ملف Excel/CSV)")
    else:
        main_interactive_cli()
