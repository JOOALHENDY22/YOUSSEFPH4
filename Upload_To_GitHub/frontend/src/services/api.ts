import axios from 'axios';

// --- OpenFDA API for Drug Search & Details ---
const FDA_BASE_URL = 'https://api.fda.gov/drug';

const fetchAIDrugDetails = async (drugName: string) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/api/drug-details`, { drugName });
    if (res.data) {
      return res.data;
    }
    return null;
  } catch (error) {
    console.error("AI Drug Details Fetch Error:", error);
    return null;
  }
};

export const searchDrugFDA = async (query: string) => {
  try {
    const res = await axios.get(`${FDA_BASE_URL}/label.json?search=openfda.brand_name:"${query}"+openfda.generic_name:"${query}"&limit=1`);
    if (res.data.results && res.data.results.length > 0) {
      return res.data.results[0];
    }
  } catch (error) {
    console.log("OpenFDA search returned no results, falling back to Gemini AI...");
  }

  // Fallback to AI drug details (handles Egyptian brand names like Antinal, Congestal, etc.)
  return await fetchAIDrugDetails(query);
};

const commonEgyptianDrugs = [
  // Pain, Cold & Fever
  "Congestal", "Panadol", "Panadol Extra", "Panadol Advance", "Panadol Cold & Flu", "Panadol Joint", "Panadol Sinus", "Panadol Night", 
  "Cetafen", "Cetal", "Paramol", "Abimol", "Novaldol", "Doliprane", "Adol", "Brufen", "Megafen", "Cataflam", "Voltaren", "Ketofan", 
  "Ketolac", "Ketorolac", "Mobitil", "Mobic", "Feldene", "Celebrex", "Arcoxia", "Comtrex", "1,2,3", "Flurest", "Rhinopro", "C-Retard",
  // Antibiotics & Anti-infectives
  "Augmentin", "Hibiotic", "Megamox", "Amoclan", "Curam", "E-Mox", "Amoxicillin", "Flumox", "Keflex", "Zithromax", "Zisrocin", "Azrolid", 
  "Tavanic", "Ciprofar", "Ciprofloxacin", "Tarivid", "Flagyl", "Amrizole", "Flasyl", "Suprax", "Cefotax", "Ceftriaxone", "Rocephin",
  // Gastrointestinal
  "Nexium", "Controloc", "Pantoloc", "Omeprazole", "Downoprazol", "Gastrazole", "Antinal", "Diax", "Motilium", "Motinorm", "Mosapride", 
  "Gas-Reg", "Spasmocanulase", "Spasmo-Digestin", "Digestin", "Colona", "Coloverin", "Librax", "Gaviscon", "Epicogel", "Maalox",
  // Cardiovascular & Hypertension
  "Concor", "Concor Plus", "Bisoprolol", "Capozide", "Capoten", "Lisinopril", "Zestril", "Amlodipine", "Alkapress", "Exforge", 
  "Tareg", "Diovan", "Ator", "Atorvastatin", "Lipitor", "Crestor", "Rosuvastatin", "Cordarone", "Plavix", "Clopidogrel", 
  "Aspirin Protect", "Jusprin", "Lasix", "Aldactone", "Spiromide",
  // Diabetes
  "Glucophage", "Cidophage", "Metformin", "Amaryl", "Glimepiride", "Diamicron", "Gliclazide", "Galvus", "Galvus Met", "Januvia", 
  "Janumet", "Trajenta", "Forxiga", "Jardiance", "Novomix", "Lantus", "Mixtard",
  // Respiratory, Asthma & Allergy
  "Albuterol", "Ventolin", "Farcolin", "Symbicort", "Seretide", "Claritine", "Zyrtec", "Histazine", "Mosadin", "Telfast", 
  "Aerius", "Levohistamine", "Erius", "Otrin", "Otrivin", "Bisolvon", "Mucosolvan", "Bronchicum", "Prospan", "Pentamix",
  // Supplements & Vitamins
  "Neuroton", "Neurovit", "Milga", "Milga Advance", "Centrum", "Vitayami", "Feroglobine", "Osteocare", "Cal-Mag", "Maddovit", 
  "Limitless", "C-Retard", "Sanso", "VitaZinc", "Zinco", "Omega 3 Plus",
  // Hormones & Thyroid
  "Eltroxin", "Euthyrox", "Thyrox", "Levothyroxine", "Gynera", "Yasmin", "Yaz", "Diane 35", "Microcept", "Cidolut Nor",
  // Neuro/Psychiatric
  "Cipralex", "Estikan", "Lustral", "Prozac", "Tegretol", "Depakine", "Keppra", "Lyrica", "Gaba", "Neurontin",
  // Topical & Others
  "Fucidin", "Fucicort", "Garamycin", "Kenacomb", "Betaderm", "Dermovate", "Elidel", "Bepanthen", "Panthenol", "Sudocrem",
  "Betadine", "Refresh", "Systane", "Hyfresh"
];

export const fetchDrugSuggestions = async (query: string) => {
  if (query.length < 2) return [];
  const normalizedQuery = query.toLowerCase().trim();
  
  return commonEgyptianDrugs.filter(d => d.toLowerCase().includes(normalizedQuery)).slice(0, 5);
};

const BACKEND_URL = 'https://youssefph-4.vercel.app';

export const fetchDrugComparison = async (drugA: string, drugB: string) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/api/compare`, { drugA, drugB });
    if (res.data && res.data.comparison) {
      return res.data.comparison;
    }
    return null;
  } catch (error) {
    console.error("AI Compare API Error:", error);
    throw error;
  }
};

// --- NIH RxNav API for Drug Interactions ---
const RXNAV_BASE_URL = 'https://rxnav.nlm.nih.gov/REST';

export const getRxCUI = async (drugName: string): Promise<string | null> => {
  try {
    const res = await axios.get(`${RXNAV_BASE_URL}/rxcui.json?name=${encodeURIComponent(drugName)}`);
    if (res.data.idGroup && res.data.idGroup.rxnormId) {
      return res.data.idGroup.rxnormId[0];
    }
    return null;
  } catch (error) {
    console.error("RxNav API Error fetching CUI:", error);
    return null;
  }
};

export const checkInteractions = async (drugs: string[]) => {
  try {
    const res = await axios.post(`${BACKEND_URL}/api/interactions`, { drugs });
    // Expected response: { interactions: [ { severity, description, drugs } ] }
    if (res.data && res.data.interactions) {
      return res.data.interactions;
    }
    return [];
  } catch (error) {
    console.error("AI API Error checking interactions:", error);
    // If it's a 500 error about API key, we could handle it, but we'll just throw
    throw error;
  }
};
