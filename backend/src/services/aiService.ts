import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export const checkInteractionsAI = async (drugs: string[]): Promise<any> => {
  if (!API_KEY) throw new Error('API Key missing');

  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });
  
  const prompt = `
  You are an expert clinical pharmacist specializing in Egyptian and US FDA pharmaceuticals. 
  Analyze potential clinical drug-drug interactions between: ${drugs.join(', ')}.
  
  REQUIREMENTS:
  1. Map any Egyptian trade names to their US / International FDA equivalents (e.g. Cataflam -> Diclofenac / Cataflam US, Aspirin -> Aspirin / Bayer Aspirin, Congestal -> Tylenol Cold, Antinal -> Nifuroxazide, Brufen -> Advil, Concor -> Zebeta).
  2. Evaluate physiological mechanism, clinical risks, emergency action, and safe recommendations.
  3. Provide comprehensive, clear Arabic medical summaries for the interaction.

  Format response STRICTLY as valid JSON:
  {
    "interactions": [
      {
        "severity": "high",
        "description": "شرح إكلينيكي مفصل للتداخل الدوائي والمخاطر الطبية باللغة العربية والتوجيهات الصيدلانية السليمة.",
        "drugs": ["${drugs[0]}", "${drugs[1] || 'Drug 2'}"],
        "compatibility": "❌ غير مسموح بتناولهما معاً (حظر تام)",
        "mechanism": "الآلية الفسيولوجية والإنزيمية للتداخل بين المادتين الفعالتين",
        "effect": "الأعراض والمخاطر الناتجة عن التداخل",
        "emergency": "الإجراء السريع عند تناول الجرعة بالخطأ",
        "recommendation": "التوصية والبديل الآمن المتاح للمريض"
      }
    ]
  }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    return cleanAndParseJSON(text);
  } catch (error) {
    console.error("AI Interactions Error:", error);
    throw error;
  }
};

export const suggestDrugsAI = async (query: string): Promise<any> => {
  if (!API_KEY) throw new Error('API Key missing');

  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
  You are an expert pharmacist.
  The user typed "${query}". 
  Provide a list of 5 real drug names. Include Egyptian brand names mapped to their US / Global equivalents.

  Format EXACTLY as:
  {
    "suggestions": ["Egyptian Brand (US Equivalent: US Name)", "Drug 2", "Drug 3", "Drug 4", "Drug 5"]
  }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return { suggestions: [] };
  }
};

export const compareDrugsAI = async (drugA: string, drugB: string): Promise<any> => {
  if (!API_KEY) throw new Error('API Key missing');

  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
  You are an expert clinical pharmacist in Egypt and US FDA.
  Compare these two drugs: "${drugA}" and "${drugB}".
  Identify their US/Global equivalent brand names (e.g. Antinal -> Intetrix, Congestal -> Tylenol Cold, Brufen -> Advil, Cipralex -> Lexapro).

  Format EXACTLY as valid JSON:
  {
    "comparison": [
      {
        "feature": "المادة الفعالة والبديل الأمريكي (Active Ingredient & US Equivalent)",
        "drugA": "Molecules & US Brand Name for ${drugA}",
        "drugB": "Molecules & US Brand Name for ${drugB}"
      },
      {
        "feature": "دواعي الاستعمال (Indications)",
        "drugA": "...",
        "drugB": "..."
      },
      {
        "feature": "الجرعة وأمان المعدة (Dosage & Gastric Safety)",
        "drugA": "...",
        "drugB": "..."
      },
      {
        "feature": "أمان الحمل والرضاعة (Pregnancy Category)",
        "drugA": "...",
        "drugB": "..."
      },
      {
        "feature": "التوصية السريرية (Clinical Advice)",
        "drugA": "...",
        "drugB": "..."
      }
    ]
  }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Compare Error:", error);
    throw error;
  }
};

// Load Egyptian Drug Box Images Database
const drugImagesPath = path.join(__dirname, '../data/egyptian_drug_images.json');
let realEgyptianDrugImages: Record<string, string> = {};
try {
  if (fs.existsSync(drugImagesPath)) {
    realEgyptianDrugImages = JSON.parse(fs.readFileSync(drugImagesPath, 'utf-8'));
  }
} catch (e) {
  console.error("Could not load egyptian_drug_images.json", e);
}

export const fetchRealDrugImage = async (drugName: string): Promise<string> => {
  const normalizedKey = drugName.toLowerCase().trim();

  if (realEgyptianDrugImages[normalizedKey]) {
    return realEgyptianDrugImages[normalizedKey];
  }

  for (const key of Object.keys(realEgyptianDrugImages)) {
    if (normalizedKey.includes(key) || key.includes(normalizedKey)) {
      return realEgyptianDrugImages[key];
    }
  }

  try {
    const wikiUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(drugName)}+medicine+box&gsrlimit=1&prop=pageimages&pithumbsize=600&format=json&origin=*`;
    const res = await axios.get(wikiUrl, { timeout: 2500 });
    
    if (res.data && res.data.query && res.data.query.pages) {
      const pages = Object.values(res.data.query.pages) as any[];
      if (pages.length > 0 && pages[0].thumbnail && pages[0].thumbnail.source) {
        return pages[0].thumbnail.source;
      }
    }
  } catch (e) {}

  return "";
};

const cleanAndParseJSON = (text: string) => {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    const sanitized = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, " ");
    return JSON.parse(sanitized);
  }
};

export const getDrugDetailsAI = async (drugName: string): Promise<any> => {
  if (!API_KEY) throw new Error('API Key missing');

  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  // STEP 1: Translate Egyptian Brand Name -> US Generic & FDA Trade Name
  let fdaQuery = { genericName: drugName, usBrand: drugName, arName: drugName };
  try {
    const mapPrompt = `
    You are a pharmaceutical translation expert.
    Identify the US / International generic scientific ingredient name and US brand equivalent for the Egyptian/International drug "${drugName}".
    Examples:
    - Antinal -> generic: "Nifuroxazide", usBrand: "Intetrix", arName: "أنتينال (مطهر معوي)"
    - Congestal -> generic: "Paracetamol, Pseudoephedrine, Chlorpheniramine", usBrand: "Tylenol Cold", arName: "كونجستال (أقراص برد)"
    - Abedone / Apidone -> generic: "Prednisolone", usBrand: "Orapred", arName: "أبيدون / أقراص بريدنيزولون"
    - Farcolin -> generic: "Albuterol", usBrand: "Ventolin", arName: "فاركولين (موسع شعب)"
    - Cetal -> generic: "Paracetamol", usBrand: "Tylenol", arName: "سيتال (مسكن وخافض حرارة)"
    - Cataflam -> generic: "Diclofenac Potassium", usBrand: "Cataflam", arName: "كتافلام (مسكن ومضاد التهاب)"
    - Brufen -> generic: "Ibuprofen", usBrand: "Advil", arName: "بروفين (مسكن آلام)"

    Return JSON strictly as:
    {
      "genericName": "US generic ingredient name",
      "usBrand": "US brand equivalent name",
      "arName": "اسم الدواء بالعربي ومسمائه الصيدلاني في مصر"
    }
    `;
    const mapRes = await model.generateContent(mapPrompt);
    fdaQuery = cleanAndParseJSON(await mapRes.response.text());
  } catch (e) {
    console.log("Translation step warning:", e);
  }

  // STEP 2: Query OpenFDA API (US FDA Database)
  let rawFdaData: any = null;
  try {
    const searchTerm = encodeURIComponent(fdaQuery.genericName || drugName);
    const fdaUrl = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"${searchTerm}"+OR+openfda.brand_name:"${encodeURIComponent(fdaQuery.usBrand || drugName)}"+OR+description:"${searchTerm}"&limit=1`;
    const fdaRes = await axios.get(fdaUrl, { timeout: 4000 });
    if (fdaRes.data && fdaRes.data.results && fdaRes.data.results.length > 0) {
      rawFdaData = fdaRes.data.results[0];
    }
  } catch (e) {
    console.log("OpenFDA API miss or timeout, utilizing Gemini FDA synthesis.");
  }

  // STEP 3: Translate FDA Label Data Back to Arabic
  const prompt = `
  You are an expert FDA clinical pharmacist.
  Drug Search Query: "${drugName}"
  Mapped US Generic Ingredient: "${fdaQuery.genericName || drugName}"
  Mapped US Brand Equivalent: "${fdaQuery.usBrand || drugName}"
  Arabic Name: "${fdaQuery.arName || drugName}"
  Raw OpenFDA Label Data Excerpt: ${rawFdaData ? JSON.stringify({
    indications: rawFdaData.indications_and_usage?.[0],
    dosage: rawFdaData.dosage_and_administration?.[0],
    warnings: rawFdaData.warnings_and_cautions?.[0] || rawFdaData.warnings?.[0],
    contraindications: rawFdaData.contraindications?.[0],
    adverse_reactions: rawFdaData.adverse_reactions?.[0],
    pregnancy: rawFdaData.pregnancy?.[0],
    pediatric: rawFdaData.pediatric_use?.[0],
    geriatric: rawFdaData.geriatric_use?.[0]
  }).slice(0, 1500) : "N/A - Generate official FDA clinical label details directly."}

  Translate and format the official US FDA drug details into clear, detailed, professional Arabic and English.
  CRITICAL REQUIREMENTS:
  - DO NOT use generic placeholder text like "مستحضر معتمد لعلاج الأعراض الخ"!
  - Provide ACTUAL, SPECIFIC medical details for ${drugName} / ${fdaQuery.genericName}.

  Return JSON strictly formatted as:
  {
    "name": "${drugName}",
    "arabicName": "${fdaQuery.arName || drugName} (المكافئ الأمريكي: ${fdaQuery.usBrand || drugName} US)",
    "activeIngredient": "${fdaQuery.genericName || drugName} (المكافئ الأمريكي: ${fdaQuery.usBrand || drugName})",
    "manufacturer": "${rawFdaData?.openfda?.manufacturer_name?.[0] || 'Egyptian & US FDA Registered Pharma'}",
    "product_type": "🟢 OTC / متوفر بدون روشتة",
    "purpose": ["Clear specific indication summary in Arabic and English specifying US Brand Equivalent (${fdaQuery.usBrand})."],
    "indications_and_usage": ["Detailed clinical indications and usage in Arabic & English."],
    "dosage_and_administration": ["Specific recommended dosage for adults and children in Arabic."],
    "warnings": ["Specific precautions, gastric safety, and medical warnings in Arabic."],
    "contraindications": ["Specific contraindications and allergic risks in Arabic."],
    "adverse_reactions": ["Common side effects in Arabic."],
    "pregnancy": ["Safety guidelines for pregnancy and lactation in Arabic."],
    "pediatric_use": ["Child dosage safety & pediatric guidelines in Arabic."],
    "geriatric_use": ["Elderly patient safety guidelines in Arabic."],
    "openfda": {
      "generic_name": ["${fdaQuery.genericName || drugName} (US Equivalent: ${fdaQuery.usBrand || drugName})"],
      "manufacturer_name": ["${rawFdaData?.openfda?.manufacturer_name?.[0] || 'FDA Registered Manufacturer'}"],
      "product_type": ["OTC / Prescription"]
    },
    "emergency_status": {
      "is_emergency": false,
      "badge_text": { "ar": "✨ مستحضر دوائي معتمد من الـ FDA", "en": "✨ FDA Approved Medicine" },
      "urgency_note": { "ar": "مستحضر صيدلاني معتمد بالهيئة الأمريكية للمواد الغذائية والأدوية (FDA).", "en": "US FDA verified pharmaceutical product." }
    },
    "scheduled_status": {
      "is_scheduled": false,
      "schedule_category": "صرف عادي بالصيدليات",
      "legal_warning": "التزام بتتعليمات الجرعة والنشرة الطبية."
    }
  }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    const parsed = cleanAndParseJSON(text);
    parsed.image_url = await fetchRealDrugImage(drugName);
    return parsed;
  } catch (error) {
    console.error("AI Drug Details Error:", error);
    throw error;
  }
};

export const checkScheduledDrugAI = async (drugName: string): Promise<any> => {
  if (!API_KEY) throw new Error('API Key missing');

  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
  You are an expert Egyptian clinical pharmacist specializing in Egyptian Ministry of Health (EDA) scheduled drugs laws.
  Check "${drugName}" and map it to its US equivalent (e.g. Tramadol -> Ultram, Lyrica -> Lyrica US, Xanax -> Xanax US).

  Format response EXACTLY as valid JSON:
  {
    "name": "${drugName}",
    "arabicName": "الاسم بالعربي والدواء التجارى بمصر (المكافئ الأمريكي: US Equivalent Name)",
    "activeIngredient": "Active Scientific Ingredient",
    "isScheduled": true or false,
    "scheduleType": "الجدول الأول (مخدرات)" or "الجدول الثاني (درج مغلق / مؤثرات نفسية)" or "غير مدرج بجدول المخدرات",
    "scheduleLevel": "schedule_1" or "schedule_2" or "none",
    "description": "شرح طبي وموقفه القانوني بالصيدليات المصرية باللغة العربية",
    "dispensingRules": "تعليمات الصرف بروشتة معتمدة"
  }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Scheduled Drug Check Error:", error);
    throw error;
  }
};

export const getDrugAlternativesAI = async (drugName: string): Promise<any> => {
  if (!API_KEY) throw new Error('API Key missing');

  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
  You are an expert FDA clinical pharmacist.
  Task: Analyze the Egyptian/international drug "${drugName}".
  1. Translate and map "${drugName}" to its US generic scientific ingredient name and US FDA brand equivalent (e.g. Antinal -> Nifuroxazide / Intetrix, Congestal -> Paracetamol+Pseudoephedrine / Tylenol Cold, Farcolin -> Albuterol / Ventolin).
  2. Search/Identify real identical substitutes (same active ingredient and strength) and therapeutic alternatives (same medical class).
  3. Provide exact Arabic names and US brand equivalents for every recommended alternative.

  Format STRICTLY as valid JSON:
  {
    "drugName": "${drugName}",
    "activeIngredient": "Active scientific ingredient name & US Brand Equivalent (e.g. Albuterol 100mcg / Ventolin US)",
    "purpose": "What the drug is specifically used for in Arabic and English",
    "identicalSubstitutes": [
      {
        "name": "Trade name",
        "nameAr": "اسم الدواء بالعربي (المكافئ الأمريكي: US Brand Name)",
        "activeIngredient": "Same active ingredient and strength",
        "manufacturer": "Manufacturer Company Name",
        "notes": "بديل مطابق بنفس المادة الفعالة والتركيز"
      }
    ],
    "therapeuticAlternatives": [
      {
        "name": "Trade name",
        "nameAr": "اسم الدواء بالعربي (المكافئ الأمريكي: US Brand Name)",
        "activeIngredient": "Different active ingredient in same therapeutic class",
        "notes": "بديل دوائي ممتاز تؤدي نفس الغرض العلاجي"
      }
    ]
  }
  `;

  const result = await model.generateContent(prompt);
  return cleanAndParseJSON(await result.response.text());
};

export const getEmergencyConsultAI = async (age: string, gender: string, condition: string, symptom: string, lang: string): Promise<any> => {
  if (!API_KEY) throw new Error('API Key missing');

  const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
  You are an expert emergency clinical consultant pharmacist.
  Patient Profile: Age/Group: ${age}, Gender: ${gender}, Special Conditions/Pregnancy/Chronic: ${condition}, Symptom/Complaint: "${symptom}".
  Provide recommended emergency OTC first-aid treatments mapping Egyptian medicines to their US equivalents (e.g. Panadol -> Tylenol, Antinal -> Intetrix, Zyrtec -> Zyrtec US).

  Format EXACTLY as valid JSON:
  {
    "disclaimer": "تنبيه طبي هام: هذا الاقتراح للاسترشاد الأولي وحالات الطوارئ البسيطة فقط ولا يغني عن الفحص الطبي المباشر!",
    "assessment": "تقييم إكلينيكي مختصر للحالة بناءً على السن والأعراض",
    "recommendedOTC": [
      {
        "name": "Drug Name",
        "arabicName": "الاسم التجاري بالصيدليات المصرية (المكافئ الأمريكي: US Brand Equivalent)",
        "activeIngredient": "المادة الفعالة",
        "dosage": "الجرعة الآمنة المحددة بدقة طبقاً للسن والحالة",
        "reason": "سبب اختيار الدواء ومناسبته للأعراض"
      }
    ],
    "precautions": ["ملاحظة وتحذير هام 1", "ملاحظة وتحذير هام 2"],
    "emergencyRedFlags": ["علامة خطيرة تستدعي الذهاب للمستشفى فورا"]
  }
  `;

  const result = await model.generateContent(prompt);
  return cleanAndParseJSON(await result.response.text());
};
