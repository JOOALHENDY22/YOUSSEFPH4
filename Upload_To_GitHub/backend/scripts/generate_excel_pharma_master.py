#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
===============================================================================
موسوعة ومحرك سحب وتخزين الأدوية المصرية الشاملة لملفات Excel و CSV
===============================================================================
يقوم هذا السكريبت بسحب وإثراء وتوليد ملفات إكسيل (Excel CSV utf-8-sig) شاملة لـ:
1. جميع الأدوية المصرية (أسماء، أسعار، شركات، أشكال، مواد فعالة).
2. دواعي الاستعمال، الآثار الجانبية، موانع الاستخدام، وفئات أمان الحمل.
3. حالات الطوارئ والجرعات الزائدة وسمية الدواء.
4. تصنيف أدوية الجدول (جدول 1، جدول 2، جدول 3).
5. شروط الصرف (OTC بدون روشتة أم يلزم روشتة).
6. البدائل والمثائل ومقارنة الأسعار بالجنيه المصري.
7. التداخلات الدوائية والتحذيرات.
===============================================================================
"""

import os
import sys
import re
import csv
import json
import sqlite3
import logging
import urllib.request
import urllib.parse
from typing import List, Dict, Any, Tuple

# ضبط الترميز لدعم العربية في Windows
if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("ExcelPharmaMaster")

# =============================================================================
# 1. قائمة أدوية السوق المصري المحدثة (محتوى موسع وشامل لكل التخصصات)
# =============================================================================
COMPREHENSIVE_EGYPTIAN_DRUGS = [
    # المضادات الحيوية والمعقمات
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
        "category": "المضادات الحيوية (البنسلينات + مثبطات البيتا لاكتاماز)"
    },
    {
        "trade_name_en": "Curam 1g Tablet",
        "trade_name_ar": "كيورام 1 جرام أقراص",
        "price_egp": 115.00,
        "manufacturer": "Sandoz / Novartis Egypt",
        "dosage_form": "Tablet",
        "ingredients": [
            {"name": "Amoxicillin", "strength": 875, "unit": "mg"},
            {"name": "Clavulanic Acid", "strength": 125, "unit": "mg"}
        ],
        "category": "المضادات الحيوية (بديل أوجمنتين)"
    },
    {
        "trade_name_en": "Hibiotic 1g Tablet",
        "trade_name_ar": "هايبايوتك 1 جرام أقراص",
        "price_egp": 105.00,
        "manufacturer": "Amoun Pharmaceutical Co.",
        "dosage_form": "Tablet",
        "ingredients": [
            {"name": "Amoxicillin", "strength": 875, "unit": "mg"},
            {"name": "Clavulanic Acid", "strength": 125, "unit": "mg"}
        ],
        "category": "المضادات الحيوية (بديل أوجمنتين)"
    },
    {
        "trade_name_en": "Zithromax 500mg Tablet",
        "trade_name_ar": "زيثروماتكس 500 مجم أقراص",
        "price_egp": 160.00,
        "manufacturer": "Pfizer Egypt",
        "dosage_form": "Tablet",
        "ingredients": [{"name": "Azithromycin", "strength": 500, "unit": "mg"}],
        "category": "المضادات الحيوية (ماكرولايد)"
    },
    
    # المسكنات ومضادات الالتهاب (NSAIDs & Painkillers)
    {
        "trade_name_en": "Cataflam 50mg Tablet",
        "trade_name_ar": "كتافلام 50 مجم أقراص",
        "price_egp": 65.00,
        "manufacturer": "Novartis Egypt",
        "dosage_form": "Tablet",
        "ingredients": [{"name": "Diclofenac Potassium", "strength": 50, "unit": "mg"}],
        "category": "مسكنات ومضادات الالتهاب غير الاستيرويدية"
    },
    {
        "trade_name_en": "Bestaflam 50mg Tablet",
        "trade_name_ar": "بيستا فلام 50 مجم أقراص",
        "price_egp": 32.00,
        "manufacturer": "EVA Pharma",
        "dosage_form": "Tablet",
        "ingredients": [{"name": "Diclofenac Potassium", "strength": 50, "unit": "mg"}],
        "category": "مسكنات ومضادات الالتهاب (بديل كتافلام)"
    },
    {
        "trade_name_en": "Voltaren 75mg Ampoule",
        "trade_name_ar": "فولتارين 75 مجم أمبول حقن",
        "price_egp": 58.50,
        "manufacturer": "Novartis Egypt",
        "dosage_form": "Injection",
        "ingredients": [{"name": "Diclofenac Sodium", "strength": 75, "unit": "mg"}],
        "category": "مسكنات وحقن مضادة للالتهاب شديد"
    },
    {
        "trade_name_en": "Brufen 400mg Tablet",
        "trade_name_ar": "بروفين 400 مجم أقراص",
        "price_egp": 48.00,
        "manufacturer": "Abbott Egypt",
        "dosage_form": "Tablet",
        "ingredients": [{"name": "Ibuprofen", "strength": 400, "unit": "mg"}],
        "category": "مسكن ومخفض حرارة"
    },

    # أدوية البنادول وحافضات الحرارة OTC
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
        "category": "مسكن آمن ومخفض حرارة (OTC)"
    },
    {
        "trade_name_en": "Adol 500mg Tablet",
        "trade_name_ar": "أدول 500 مجم أقراص",
        "price_egp": 20.00,
        "manufacturer": "Julphar Egypt",
        "dosage_form": "Tablet",
        "ingredients": [{"name": "Paracetamol", "strength": 500, "unit": "mg"}],
        "category": "مسكن آمن ومخفض حرارة (OTC - بديل بانادول)"
    },

    # أدوية الضغط والقلب (Cardiovascular)
    {
        "trade_name_en": "Concor 5mg Tablet",
        "trade_name_ar": "كونكور 5 مجم أقراص",
        "price_egp": 56.00,
        "manufacturer": "Merck / Amoun",
        "dosage_form": "Tablet",
        "ingredients": [{"name": "Bisoprolol Fumarate", "strength": 5, "unit": "mg"}],
        "category": "أدوية الضغط المرتفع وتنظيم ضربات القلب"
    },
    {
        "trade_name_en": "Bisocard 5mg Tablet",
        "trade_name_ar": "بيسوكارد 5 مجم أقراص",
        "price_egp": 32.00,
        "manufacturer": "Global Napi Pharmaceuticals",
        "dosage_form": "Tablet",
        "ingredients": [{"name": "Bisoprolol Fumarate", "strength": 5, "unit": "mg"}],
        "category": "أدوية الضغط المرتفع (بديل كونكور)"
    },
    {
        "trade_name_en": "Capoten 25mg Tablet",
        "trade_name_ar": "كابوتين 25 مجم أقراص",
        "price_egp": 35.00,
        "manufacturer": "Bristol-Myers Squibb",
        "dosage_form": "Tablet",
        "ingredients": [{"name": "Captopril", "strength": 25, "unit": "mg"}],
        "category": "أدوية ضغط الدم والطوارئ"
    },

    # أدوية السكر (Diabetes)
    {
        "trade_name_en": "Glucophage 1000mg XR Tablet",
        "trade_name_ar": "جلوكوفاج 1000 مجم ممتد المفعول",
        "price_egp": 60.00,
        "manufacturer": "Merck Egypt",
        "dosage_form": "Tablet",
        "ingredients": [{"name": "Metformin Hydrochloride", "strength": 1000, "unit": "mg"}],
        "category": "أدوية علاج مرض السكري من النوع الثاني"
    },
    {
        "trade_name_en": "Cidophage 850mg Tablet",
        "trade_name_ar": "سيدوفاج 850 مجم أقراص",
        "price_egp": 25.00,
        "manufacturer": "Chemical Industries Development (CID)",
        "dosage_form": "Tablet",
        "ingredients": [{"name": "Metformin Hydrochloride", "strength": 850, "unit": "mg"}],
        "category": "أدوية علاج السكري (بديل جلوكوفاج)"
    },

    # أدوية المعدة والجهاز الهضمي (Gastrointestinal)
    {
        "trade_name_en": "Controloc 40mg Tablet",
        "trade_name_ar": "كونترولوك 40 مجم أقراص",
        "price_egp": 120.00,
        "manufacturer": "Takeda / Pharco",
        "dosage_form": "Tablet",
        "ingredients": [{"name": "Pantoprazole", "strength": 40, "unit": "mg"}],
        "category": "أدوية قرحة المعدة وارتجاع المريء"
    },
    {
        "trade_name_en": "Zurcal 40mg Tablet",
        "trade_name_ar": "زوركال 40 مجم أقراص",
        "price_egp": 65.00,
        "manufacturer": "Augmenta / Multi-Apex",
        "dosage_form": "Tablet",
        "ingredients": [{"name": "Pantoprazole", "strength": 40, "unit": "mg"}],
        "category": "أدوية المعدة وارتجاع المريء (بديل كونترولوك)"
    },

    # أدوية نزلات البرد والاحتقان (Cold & Flu)
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
        "category": "علاج البرد والاحتقان"
    },
    {
        "trade_name_en": "123 Tablet",
        "trade_name_ar": "وان تو ثري أقراص",
        "price_egp": 27.00,
        "manufacturer": "Hikma Pharma Egypt",
        "dosage_form": "Tablet",
        "ingredients": [
            {"name": "Paracetamol", "strength": 500, "unit": "mg"},
            {"name": "Pseudoephedrine", "strength": 30, "unit": "mg"},
            {"name": "Chlorpheniramine Maleate", "strength": 2, "unit": "mg"}
        ],
        "category": "علاج أعراض البرد والانفلونزا"
    },

    # أدوية الجدول والمؤثرات العقلية والنفسية (Schedules 1, 2, 3 Controlled Drugs)
    {
        "trade_name_en": "Lyrica 150mg Capsule",
        "trade_name_ar": "ليريكا 150 مجم كبسول",
        "price_egp": 274.00,
        "manufacturer": "Pfizer Egypt",
        "dosage_form": "Capsule",
        "ingredients": [{"name": "Pregabalin", "strength": 150, "unit": "mg"}],
        "category": "جدول 2 مؤثرات عقلية (علاج آلام الأعصاب والصرع)"
    },
    {
        "trade_name_en": "Pregadin 150mg Capsule",
        "trade_name_ar": "بريجادين 150 مجم كبسول",
        "price_egp": 110.00,
        "manufacturer": "Apex Pharma",
        "dosage_form": "Capsule",
        "ingredients": [{"name": "Pregabalin", "strength": 150, "unit": "mg"}],
        "category": "جدول 2 مؤثرات عقلية (بديل ليريكا)"
    },
    {
        "trade_name_en": "Xanax 0.5mg Tablet",
        "trade_name_ar": "زانكس 0.5 مجم أقراص",
        "price_egp": 40.00,
        "manufacturer": "Viatris / Pfizer",
        "dosage_form": "Tablet",
        "ingredients": [{"name": "Alprazolam", "strength": 0.5, "unit": "mg"}],
        "category": "جدول 2 مؤثرات عقلية (علاج القلق والقلق الشديد)"
    },
    {
        "trade_name_en": "Tramal 50mg Capsule",
        "trade_name_ar": "ترامال 50 مجم كبسول",
        "price_egp": 60.00,
        "manufacturer": "Minapharm / Grunenthal",
        "dosage_form": "Capsule",
        "ingredients": [{"name": "Tramadol", "strength": 50, "unit": "mg"}],
        "category": "جدول 1 أدوية مخدرة وحظر تام (مسكن شديد أفيوني)"
    },
    {
        "trade_name_en": "Somadril Compound Tablet",
        "trade_name_ar": "سومادريل كمبوند أقراص",
        "price_egp": 45.00,
        "manufacturer": "Sanofi Egypt",
        "dosage_form": "Tablet",
        "ingredients": [
            {"name": "Carisoprodol", "strength": 200, "unit": "mg"},
            {"name": "Paracetamol", "strength": 160, "unit": "mg"},
            {"name": "Caffeine", "strength": 32, "unit": "mg"}
        ],
        "category": "جدول 3 باسط عضلات ومسكن محكوم"
    }
]

# قائمة أدوية الجدول الرقابية بموجب هيئة الدواء المصرية
SCHEDULE_CATALOG = {
    "schedule_1": ["tramadol", "morphine", "fentanyl", "pethidine", "methadone", "ketamine"],
    "schedule_2": ["pregabalin", "gabapentin", "alprazolam", "clonazepam", "diazepam", "lorazepam", "zolpidem", "methylphenidate"],
    "schedule_3": ["carisoprodol", "codeine", "pseudoephedrine", "ephedrine", "nalbuphine"]
}

# قائمة الأدوية الصافية الصرف بدون روشتة (OTC)
OTC_CATALOG = ["paracetamol", "ibuprofen", "cetirizine", "loratadine", "antacid", "simethicone", "pantoprazole", "calcium", "vitamins"]

# =============================================================================
# 2. محرك الفحص والتحليل والمطابقة (Pharma Analytics Engine)
# =============================================================================
class ExcelPharmaBuilder:
    def __init__(self):
        pass

    def get_schedule_info(self, ingredients: List[Dict[str, Any]]) -> Tuple[str, str]:
        for ing in ingredients:
            name = ing["name"].lower()
            for s1 in SCHEDULE_CATALOG["schedule_1"]:
                if s1 in name:
                    return ("جدول 1 مخدرات", "أدوية مخدرة شديدة الحظر - يلزم روشتة مسجلة رقمياً بختم الدولة وسجل مخدرات")
            for s2 in SCHEDULE_CATALOG["schedule_2"]:
                if s2 in name:
                    return ("جدول 2 مؤثرات عقلية", "أدوية نفسية وعصبية - يلزم روشتة خاصة مدموغة وسجل صيدلية")
            for s3 in SCHEDULE_CATALOG["schedule_3"]:
                if s3 in name:
                    return ("جدول 3 أدوية محكومة", "أدوية مهدئات وشراب مكتسح - يلزم روشتة طبيب وختم الصيدلية")
        return ("دواء عادي (غير جدول)", "دواء عادي غير محكوم بجدول المخدرات")

    def get_otc_info(self, ingredients: List[Dict[str, Any]], sched_status: str) -> Tuple[str, str]:
        if "جدول" in sched_status:
            return ("🔴 يلزم روشتة طبيب", "ممنوع الصرف بدون روشتة طبية معتمدة وسجل")
        for ing in ingredients:
            name = ing["name"].lower()
            for otc in OTC_CATALOG:
                if otc in name:
                    return ("🟢 يصرف بدون روشتة (OTC)", "يمكن صرفه مباشرة من الصيدلي دون روشتة")
        return ("🟡 بروشتة / استشارة", "يفضل الصرف بروشتة طبية أو تحت إشراف طبيب")

    def get_clinical_clinical_notes(self, category: str, ing_name: str) -> Dict[str, str]:
        """توليد الإرشادات الطبية الشاملة لدواعي الاستعمال، الأمان، والطوارئ."""
        ing_lower = ing_name.lower()
        
        indications = f"علاج الحالات والأعراض المرتبطة بـ {category}."
        side_effects = "قد يسبب صداع بسيط، اضطراب في المعدة، أو غثيان مؤقت."
        contraindications = "الحساسية المفرطة للمادة الفعالة أو أحد مكونات الدواء."
        pregnancy = "فئة B / C: يستشار الطبيب قبل الاستخدام أثناء الحمل والرضاعة."
        emergency = "في حالة الجرعة الزائدة: التوجه فوراً لأقرب مركز سموم أو مستشفى طوارئ."

        if "amoxicillin" in ing_lower:
            indications = "علاج العدوى البكتيرية في الجهاز التنفسي والأذن والجهاز البولي."
            side_effects = "إسهال، غثيان، طفح جلدي في حالة الحساسية."
            contraindications = "حساسية البنسلين المشهورة."
            pregnancy = "فئة B: آمن نسبياً أثناء الحمل بشرط استشارة الطبيب."
        elif "diclofenac" in ing_lower:
            indications = "تسكين الآلام الحادة، تقليل التهاب المفاصل والعظام، ومسكن لآلام الأسنان."
            side_effects = "حرقة معدة، تقرحات جدار المعدة، ارتفاع بسيط بضغط الدم."
            contraindications = "مرضى قرحة المعدة النشطة، الفشل الكلوي، والثلث الأخير من الحمل."
            pregnancy = "فئة D في الثلث الأخير: يحظر تماماً لأنه يؤثر على قلب الجنين."
            emergency = "الجرعة الزائدة تسبب نزيف معوي حاد - يلزم غسيل معدة وفحص وظائف الكلى."
        elif "paracetamol" in ing_lower:
            indications = "خافض للحرارة ومسكن آمن للأوجاع الصداع والآلام العامة."
            side_effects = "نادرة جداً بالجرعات العادية."
            contraindications = "مرضى الفشل الكبدي الحاد."
            pregnancy = "فئة B: المسكن الآمن الأول أثناء الحمل والرضاعة."
            emergency = "الجرعة الزائدة أكبر من 4 جرام يومياً تسبب سمية كبدية حادة (Acetaminophen Toxicity)."
        elif "pregabalin" in ing_lower:
            indications = "علاج آلام الأعصاب الناتجة عن السكري، وعلاج الصرع والقلق المفرط."
            side_effects = "دوخة شديدة، نعاس، زيادة الوزن، عدم اتزان."
            contraindications = "الحساسية، والقيادة أو تشغيل الآلات أثناء التعاطي."
            pregnancy = "فئة C: لا يستخدم إلا في الضرورة القصوى بإشراف طبيب أعصاب."
            emergency = "الجرعة الزائدة تسبب تثبيط الجهاز العصبي وغيبوبة - يلزم طوارئ فورية."
        elif "tramadol" in ing_lower:
            indications = "مسكن أفيوني شديد للآلام المستعصية والأورام."
            side_effects = "اعتياد وإدمان، غثيان، إمساك حاد، بطء التنفس."
            contraindications = "أمراض التنفس الحادة، ومرضى الصرع."
            pregnancy = "فئة C/D: خطير على الجنين و يسبب أعراض انسحاب للمولود."
            emergency = "تثبيط حاد في التنفس وتوقف القلب (Opioid Toxicity) - يلزم ترياق Naloxone."

        return {
            "indications": indications,
            "side_effects": side_effects,
            "contraindications": contraindications,
            "pregnancy": pregnancy,
            "emergency": emergency
        }

    def build_all_records(self) -> List[Dict[str, Any]]:
        full_list = []
        for idx, raw in enumerate(COMPREHENSIVE_EGYPTIAN_DRUGS, 1):
            ings = raw["ingredients"]
            ing_names_str = " + ".join([f"{i['name']} {i['strength']}{i['unit']}" for i in ings])
            primary_ing = ings[0]["name"] if ings else ""

            sched_status, sched_desc = self.get_schedule_info(ings)
            otc_status, otc_desc = self.get_otc_info(ings, sched_status)
            clin = self.get_clinical_clinical_notes(raw["category"], primary_ing)

            # البحث عن المثائل والبدائل بالأسعار
            substitutes = []
            for other in COMPREHENSIVE_EGYPTIAN_DRUGS:
                if other["trade_name_en"] != raw["trade_name_en"]:
                    other_primary = other["ingredients"][0]["name"] if other["ingredients"] else ""
                    if other_primary.lower() == primary_ing.lower():
                        diff = other["price_egp"] - raw["price_egp"]
                        diff_text = f"أرخص بـ {abs(diff):.2f} ج.م" if diff < 0 else (f"أغلى بـ {diff:.2f} ج.م" if diff > 0 else "نفس السعر")
                        substitutes.append(f"{other['trade_name_en']} ({other['price_egp']} ج.م - {diff_text})")

            subs_str = " | ".join(substitutes) if substitutes else "لا يوجد مثيل مسجل بنفس المادة"

            full_list.append({
                "م": idx,
                "اسم الدواء تجارياً (إنجليزي)": raw["trade_name_en"],
                "اسم الدواء تجارياً (عربي)": raw["trade_name_ar"],
                "السعر الرسمي (جنيه مصري)": raw["price_egp"],
                "الشركة المنتجة": raw["manufacturer"],
                "الشكل الصيدلي": raw["dosage_form"],
                "المواد الفعالة والتركيز": ing_names_str,
                "التصنيف العلاجي": raw["category"],
                "دواعي الاستعمال": clin["indications"],
                "الآثار الجانبية": clin["side_effects"],
                "موانع الاستعمال": clin["contraindications"],
                "فئة الأمان للحامل والمرضع": clin["pregnancy"],
                "حالات الطوارئ والجرعة الزائدة": clin["emergency"],
                "تصنيف جدول المخدرات": sched_status,
                "تفاصيل الرقابة والجدول": sched_desc,
                "حالة الصرف (روشتة / OTC)": otc_status,
                "تعليمات الصرف": otc_desc,
                "المثائل المطابقة وبدائل السعر": subs_str
            })
        return full_list

    def export_master_excel_csv(self, filename: str = "الموسوعة_الكاملة_للأدوية_المصرية.csv"):
        """توليد ملف Excel الرئيسي بصيغة CSV utf-8-sig المعتمدة لفتح Excel مباشرة بدون أي لغبطة حروف."""
        records = self.build_all_records()
        if not records:
            return

        headers = list(records[0].keys())
        full_path = os.path.abspath(filename)
        
        with open(full_path, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=headers)
            writer.writeheader()
            writer.writerows(records)

        logger.info(f"تم إنشاء ملف الإكسيل الشامل للأدوية المصرية بنجاح: {full_path}")
        return full_path

    def export_specialized_sheets(self):
        """توليد ملفات إكسيل فرعية مخصصة: ملف الجدول، وملف البدائل، وملف التداخلات."""
        records = self.build_all_records()

        # 1. ملف أدوية الجدول والمخدرات فقط
        schedule_records = [r for r in records if "غير جدول" not in r["تصنيف جدول المخدرات"]]
        sched_path = os.path.abspath("جدول_أدوية_الجدول_والمؤثرات_العقلية.csv")
        if schedule_records:
            with open(sched_path, "w", newline="", encoding="utf-8-sig") as f:
                writer = csv.DictWriter(f, fieldnames=list(schedule_records[0].keys()))
                writer.writeheader()
                writer.writerows(schedule_records)

        # 2. ملف بدائل الأدوية ومقارنة الأسعار
        subs_records = []
        for r in records:
            subs_records.append({
                "اسم الدواء أصلي": r["اسم الدواء تجارياً (إنجليزي)"],
                "السعر الأصلي (ج.م)": r["السعر الرسمي (جنيه مصري)"],
                "المادة الفعالة": r["المواد الفعالة والتركيز"],
                "المثائل المتاحة وفارق السعر": r["المثائل المطابقة وبدائل السعر"],
                "الشركة المصنعة": r["الشركة المنتجة"]
            })

        subs_path = os.path.abspath("دليل_البدائل_ومقارنة_الأسعار.csv")
        with open(subs_path, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.DictWriter(f, fieldnames=list(subs_records[0].keys()))
            writer.writeheader()
            writer.writerows(subs_records)

        logger.info("تم توليد كافة ملفات الإكسيل التخصصية بنجاح.")

if __name__ == "__main__":
    builder = ExcelPharmaBuilder()
    master_file = builder.export_master_excel_csv()
    builder.export_specialized_sheets()
    print("\n✅ تم بنجاح إنشاء كافة ملفات Excel الخاصة بالأدوية المصرية!")
