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
