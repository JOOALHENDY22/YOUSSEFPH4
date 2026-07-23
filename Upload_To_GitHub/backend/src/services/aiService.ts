import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export const checkInteractionsAI = async (drugs: string[]): Promise<any> => {
  if (!API_KEY) {
    throw new Error('API Key missing');
  }

  const model = genAI.getGenerativeModel({ 
    model: "gemini-3.5-flash-lite",
    generationConfig: {
      responseMimeType: "application/json"
    }
  });
  
  const prompt = `
  You are an expert clinical pharmacist in Egypt. 
  The user is asking about the drug interactions between the following medications: ${drugs.join(', ')}.
  Some of these might be Egyptian brand names or generic names.

  Please provide a summary of their interactions.
  Format your response EXACTLY as a valid JSON object matching this structure:
  {
    "interactions": [
      {
        "severity": "high" or "moderate" or "minor",
        "description": "Clear explanation of the interaction and what to do in Arabic.",
        "drugs": ["Drug 1", "Drug 2"]
      }
    ]
  }
  If there are absolutely no known interactions, return:
  {
    "interactions": []
  }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    console.log("Raw AI Response (Interactions):", text);
    
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Service Error parsing response:", error);
    throw error;
  }
};

export const suggestDrugsAI = async (query: string): Promise<any> => {
  if (!API_KEY) throw new Error('API Key missing');

  const model = genAI.getGenerativeModel({ 
    model: "gemini-3.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
  You are an expert pharmacist.
  The user typed "${query}". 
  Provide a list of 5 real drug names. Include both Egyptian brand names and international/generic names that start with or match this query.

  Format EXACTLY as:
  {
    "suggestions": ["Drug 1", "Drug 2", "Drug 3", "Drug 4", "Drug 5"]
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
    model: "gemini-3.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
  You are an expert Egyptian pharmacist.
  Compare these two drugs available in Egypt: "${drugA}" and "${drugB}".

  Provide a detailed clinical comparison in Arabic.
  Format EXACTLY as:
  {
    "comparison": [
      {
        "feature": "المادة الفعالة (Active Ingredient)",
        "drugA": "...",
        "drugB": "..."
      },
      {
        "feature": "دواعي الاستعمال (Indications)",
        "drugA": "...",
        "drugB": "..."
      },
      {
        "feature": "الآثار الجانبية الشائعة (Side Effects)",
        "drugA": "...",
        "drugB": "..."
      },
      {
        "feature": "الفئة الدوائية للحمل (Pregnancy Category)",
        "drugA": "...",
        "drugB": "..."
      },
      {
        "feature": "الجرعة المعتادة (Typical Dosage)",
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

export const getDrugDetailsAI = async (drugName: string): Promise<any> => {
  if (!API_KEY) throw new Error('API Key missing');

  const model = genAI.getGenerativeModel({ 
    model: "gemini-3.5-flash-lite",
    generationConfig: { responseMimeType: "application/json" }
  });

  const prompt = `
  You are an expert clinical pharmacist specializing in Egyptian and international pharmaceuticals.
  Provide detailed medical and clinical information for the drug: "${drugName}".
  If "${drugName}" is an Egyptian trade/brand name (e.g., Antinal, Congestal, Cetafen, Novaldol, Hibiotic, Brufen, etc.), accurately identify its primary active scientific ingredient, manufacturer, and medical facts.

  Format your response EXACTLY as a valid JSON object with this exact structure:
  {
    "openfda": {
      "generic_name": ["Active Ingredient / Scientific Name in English & Arabic"],
      "manufacturer_name": ["Manufacturer Name (e.g. Amoun Pharmaceutical)"],
      "product_type": ["Prescription / OTC"]
    },
    "purpose": ["Clear indication summary of what this drug is used for in Arabic."],
    "indications_and_usage": ["Detailed indications & therapeutic uses in Arabic."],
    "dosage_and_administration": ["Recommended dosage and how to take it in Arabic."],
    "warnings": ["Important precautions, warnings, and safety advice in Arabic."],
    "contraindications": ["Contraindications / conditions when this drug should NOT be used in Arabic."],
    "adverse_reactions": ["Common and possible side effects in Arabic."],
    "pregnancy": ["Safety guidelines for pregnant and nursing mothers in Arabic."],
    "pediatric_use": ["Child dosage safety & pediatric guidelines in Arabic."],
    "geriatric_use": ["Elderly patient safety guidelines in Arabic."]
  }
  `;

  try {
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Drug Details Error:", error);
    throw error;
  }
};
