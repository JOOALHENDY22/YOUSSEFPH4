import { Router } from 'express';
import { checkInteractionsAI, suggestDrugsAI, compareDrugsAI, getDrugDetailsAI, checkScheduledDrugAI, fetchRealDrugImage, getDrugAlternativesAI, getEmergencyConsultAI } from '../services/aiService';
import { searchMasterDrugDetails, searchMasterInteractions, searchMasterComparisons, searchMasterAlternatives } from '../services/masterDbService';
import { trackRealVisitor, getRealAdminStats, clearRealAnalytics } from '../services/analyticsService';

import fs from 'fs';
import path from 'path';

const router = Router();

// Load offline drugs database
const drugsDbPath = path.join(__dirname, '../data/egyptian_drugs.json');
let offlineDrugs: string[] = [];
try {
  offlineDrugs = JSON.parse(fs.readFileSync(drugsDbPath, 'utf-8'));
} catch (e) {
  console.error("Could not load offline drugs database", e);
}

// -------------------------------------------------------------
// GLOBAL CACHING SYSTEM (Saves AI tokens & quota globally)
// -------------------------------------------------------------

// 1. Cached Interactions Database
const cachedInteractionsPath = path.join(__dirname, '../data/cached_interactions.json');
let cachedInteractions: Record<string, any> = {};
try {
  if (fs.existsSync(cachedInteractionsPath)) {
    cachedInteractions = JSON.parse(fs.readFileSync(cachedInteractionsPath, 'utf-8'));
  }
} catch (e) {
  console.error("Could not load cached interactions database", e);
}

const saveInteractionsCache = () => {
  try {
    fs.writeFileSync(cachedInteractionsPath, JSON.stringify(cachedInteractions, null, 2));
  } catch (e) {
    console.error("Could not save to cached interactions database", e);
  }
};

// 2. Cached Comparisons Database
const cachedComparisonsPath = path.join(__dirname, '../data/cached_comparisons.json');
let cachedComparisons: Record<string, any> = {};
try {
  if (fs.existsSync(cachedComparisonsPath)) {
    cachedComparisons = JSON.parse(fs.readFileSync(cachedComparisonsPath, 'utf-8'));
  }
} catch (e) {
  console.error("Could not load cached comparisons database", e);
}

const saveComparisonsCache = () => {
  try {
    fs.writeFileSync(cachedComparisonsPath, JSON.stringify(cachedComparisons, null, 2));
  } catch (e) {
    console.error("Could not save to cached comparisons database", e);
  }
};

// 3. Cached Drug Details Database
const cachedDrugsPath = path.join(__dirname, '../data/cached_drugs.json');
let cachedDrugs: Record<string, any> = {};
try {
  if (fs.existsSync(cachedDrugsPath)) {
    cachedDrugs = JSON.parse(fs.readFileSync(cachedDrugsPath, 'utf-8'));
  }
} catch (e) {
  console.error("Could not load cached drugs database", e);
}

const saveDrugsCache = () => {
  try {
    fs.writeFileSync(cachedDrugsPath, JSON.stringify(cachedDrugs, null, 2));
  } catch (e) {
    console.error("Could not save to cached drugs database", e);
  }
};

// 4. Cached Scheduled Drugs Database
const cachedScheduledPath = path.join(__dirname, '../data/cached_scheduled.json');
let cachedScheduled: Record<string, any> = {};
try {
  if (fs.existsSync(cachedScheduledPath)) {
    cachedScheduled = JSON.parse(fs.readFileSync(cachedScheduledPath, 'utf-8'));
  }
} catch (e) {
  console.error("Could not load cached scheduled database", e);
}

const saveScheduledCache = () => {
  try {
    fs.writeFileSync(cachedScheduledPath, JSON.stringify(cachedScheduled, null, 2));
  } catch (e) {
    console.error("Could not save to cached scheduled database", e);
  }
};

// Load static scheduled drugs database
const scheduledPath = path.join(__dirname, '../data/egyptian_scheduled_drugs.json');
let scheduledDrugsDb: any[] = [];
try {
  if (fs.existsSync(scheduledPath)) {
    scheduledDrugsDb = JSON.parse(fs.readFileSync(scheduledPath, 'utf-8'));
  }
} catch (e) {
  console.error("Could not load scheduled drugs database", e);
}

// Load Master Interactions Database
const masterInteractionsPath = path.join(__dirname, '../data/master_interactions_db.json');
let masterInteractionsDb: Record<string, any> = {};
try {
  if (fs.existsSync(masterInteractionsPath)) {
    masterInteractionsDb = JSON.parse(fs.readFileSync(masterInteractionsPath, 'utf-8'));
  }
} catch (e) {
  console.error("Could not load master interactions database", e);
}

// Load Master Comparisons Database
const masterComparisonsPath = path.join(__dirname, '../data/master_comparisons_db.json');
let masterComparisonsDb: Record<string, any> = {};
try {
  if (fs.existsSync(masterComparisonsPath)) {
    masterComparisonsDb = JSON.parse(fs.readFileSync(masterComparisonsPath, 'utf-8'));
  }
} catch (e) {
  console.error("Could not load master comparisons database", e);
}

// -------------------------------------------------------------
// ENDPOINTS
// -------------------------------------------------------------

router.post('/interactions', async (req, res) => {
  try {
    const { drugs } = req.body;
    
    if (!drugs || !Array.isArray(drugs) || drugs.length < 2) {
      return res.status(400).json({ error: 'Please provide at least 2 drugs' });
    }

    // 1. Query Gemini AI Engine FIRST for real-time drug interaction analysis
    console.log(`[AI Engine - Interactions] Querying Gemini AI for "${drugs.join(' + ')}"...`);
    try {
      const aiData = await checkInteractionsAI(drugs);
      if (aiData && aiData.interactions && aiData.interactions.length > 0) {
        console.log(`[AI Engine - Interactions] Successfully analyzed ${drugs.join(' + ')} via Gemini AI.`);
        return res.json(aiData);
      }
    } catch (e) {
      console.log("[AI Engine - Interactions] AI unavailable, checking master database fallback...");
    }

    // 2. Check Master Interactions Encyclopedia (File 2) Fallback if AI unavailable
    const masterResults = searchMasterInteractions(drugs);
    if (masterResults && masterResults.length > 0) {
      console.log(`[Master Encyclopedia DB Hit] Serving ${masterResults.length} interaction rules for ${drugs.join(' + ')}`);
      return res.json({ interactions: masterResults });
    }

    res.json({ interactions: [] });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process interaction check.' });
  }
});

router.get('/suggestions', (req, res) => {
  try {
    const q = (req.query.q as string)?.toLowerCase();
    if (!q || q.length < 2) {
      return res.status(400).json({ suggestions: [] });
    }
    
    // Offline fast search
    const matches = offlineDrugs
      .filter(drug => drug.toLowerCase().includes(q))
      .slice(0, 5); // Return top 5 matches
      
    res.json({ suggestions: matches });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ suggestions: [] });
  }
});

router.post('/compare', async (req, res) => {
  try {
    const { drugA, drugB } = req.body;
    if (!drugA || !drugB) {
      return res.status(400).json({ error: 'Please provide both drugA and drugB' });
    }

    // 1. Check Master Comparisons Encyclopedia (File 3) FIRST (0ms Instant)
    const masterComparison = searchMasterComparisons(drugA, drugB);
    if (masterComparison && masterComparison.length > 0) {
      console.log(`[Master Encyclopedia DB Hit] Serving comparisons for ${drugA} vs ${drugB}`);
      return res.json({ comparison: masterComparison });
    }

    // 2. Check cached comparisons
    const cacheKey = [drugA, drugB].map(d => d.toLowerCase().trim()).sort().join('+');
    if (cachedComparisons[cacheKey]) {
      console.log(`[Cache Hit - Compare] Serving for "${cacheKey}" from cache.`);
      return res.json(cachedComparisons[cacheKey]);
    }

    console.log(`[Cache Miss - Compare] Querying AI Engine for "${cacheKey}"...`);
    const data = await compareDrugsAI(drugA, drugB);

    cachedComparisons[cacheKey] = data;
    saveComparisonsCache();

    res.json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to compare drugs' });
  }
});

// Load Egyptian Master Drug Database
const masterDbPath = path.join(__dirname, '../data/egyptian_master_drugs_db.json');
let masterDrugDb: Record<string, any> = {};
try {
  if (fs.existsSync(masterDbPath)) {
    masterDrugDb = JSON.parse(fs.readFileSync(masterDbPath, 'utf-8'));
  }
} catch (e) {
  console.error("Could not load master Egyptian drug database", e);
}

const saveMasterDrugDb = () => {
  try {
    fs.writeFileSync(masterDbPath, JSON.stringify(masterDrugDb, null, 2));
  } catch (e) {
    console.error("Could not save to Master Egyptian Drug DB", e);
  }
};

router.post('/drug-details', async (req, res) => {
  try {
    const { drugName } = req.body;
    if (!drugName) {
      return res.status(400).json({ error: 'Please provide a drugName' });
    }

    // 1. Check Master Egyptian Drugs Encyclopedia (File 1 - 15,000 drugs) FIRST (0ms Instant)
    const masterDrug = searchMasterDrugDetails(drugName);
    if (masterDrug) {
      console.log(`[Master Encyclopedia DB Hit] Serving 100% full details for "${drugName}" from File 1.`);
      return res.json(masterDrug);
    }

    const key = drugName.toLowerCase().trim();
    // 2. Check cached drugs
    if (cachedDrugs[key]) {
      console.log(`[Cache Hit - Details] Serving details for "${drugName}" from cache.`);
      return res.json(cachedDrugs[key]);
    }

    // 3. Query AI if not found in Master DB
    console.log(`[Cache Miss - Details] Querying AI Engine for "${drugName}"...`);
    const data = await getDrugDetailsAI(drugName);
    
    cachedDrugs[key] = data;
    saveDrugsCache();

    res.json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch drug details' });
  }
});

router.get('/scheduled-drugs', async (req, res) => {
  try {
    const q = (req.query.q as string)?.toLowerCase().trim();
    if (!q) {
      return res.json({ scheduledDrugs: scheduledDrugsDb });
    }

    // 1. Check static Egyptian Ministry of Health database
    const matches = scheduledDrugsDb.filter(d => 
      d.name.toLowerCase().includes(q) || 
      d.arabicName.toLowerCase().includes(q) || 
      d.activeIngredient.toLowerCase().includes(q)
    );

    if (matches.length > 0) {
      return res.json({ scheduledDrugs: matches });
    }

    // 2. Check cached scheduled drugs
    if (cachedScheduled[q]) {
      console.log(`[Cache Hit - Scheduled] Serving for "${q}" from cache.`);
      return res.json({ scheduledDrugs: [cachedScheduled[q]] });
    }

    // 3. Fallback to Gemini AI for unlisted drug scheduled classification
    console.log(`[Cache Miss - Scheduled] Querying Gemini AI for scheduled status of "${q}"...`);
    const aiResult = await checkScheduledDrugAI(q);
    
    if (aiResult) {
      cachedScheduled[q] = aiResult;
      saveScheduledCache();
      return res.json({ scheduledDrugs: [aiResult] });
    }

    res.json({ scheduledDrugs: [] });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ scheduledDrugs: [] });
  }
});

// Load Master Alternatives Database
const masterAlternativesPath = path.join(__dirname, '../data/master_alternatives_db.json');
let masterAlternativesDb: Record<string, any> = {};
try {
  if (fs.existsSync(masterAlternativesPath)) {
    masterAlternativesDb = JSON.parse(fs.readFileSync(masterAlternativesPath, 'utf-8'));
  }
} catch (e) {
  console.error("Could not load master alternatives database", e);
}

const saveMasterAlternativesDb = () => {
  try {
    fs.writeFileSync(masterAlternativesPath, JSON.stringify(masterAlternativesDb, null, 2));
  } catch (e) {
    console.error("Could not save to master alternatives database", e);
  }
};

router.post('/alternatives', async (req, res) => {
  try {
    const { drugName } = req.body;
    if (!drugName) {
      return res.status(400).json({ error: 'Please provide a drugName' });
    }

    // 1. Check Master Comparisons & Alternatives Encyclopedia (File 3 - 15,000 entries) FIRST (0ms Instant)
    const masterAlts = searchMasterAlternatives(drugName);
    if (masterAlts && (masterAlts.identicalSubstitutes?.length > 0 || masterAlts.therapeuticAlternatives?.length > 0)) {
      console.log(`[Master Encyclopedia DB Hit] Serving alternatives for "${drugName}" from File 3.`);
      return res.json(masterAlts);
    }

    const key = drugName.toLowerCase().trim();
    // Query AI for alternatives if not in Master DB
    console.log(`[Cache Miss - Alternatives] Querying AI Engine for "${drugName}"...`);
    const data = await getDrugAlternativesAI(drugName);
    res.json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch drug alternatives' });
  }
});

// Load Master Emergency Database
const masterEmergencyPath = path.join(__dirname, '../data/master_emergency_db.json');
let masterEmergencyDb: any = { symptoms: {} };
try {
  if (fs.existsSync(masterEmergencyPath)) {
    masterEmergencyDb = JSON.parse(fs.readFileSync(masterEmergencyPath, 'utf-8'));
  }
} catch (e) {
  console.error("Could not load master emergency database", e);
}

router.post('/emergency-consult', async (req, res) => {
  try {
    const { age, gender, condition, symptom, lang } = req.body;
    if (!symptom) {
      return res.status(400).json({ error: 'Please describe the symptom or complaint' });
    }

    const normSymptom = symptom.toLowerCase().trim();

    // 1. Check Master Emergency DB FIRST (0ms)
    if (masterEmergencyDb.symptoms) {
      for (const key of Object.keys(masterEmergencyDb.symptoms)) {
        const item = masterEmergencyDb.symptoms[key];
        if (item.keywords && item.keywords.some((kw: string) => normSymptom.includes(kw))) {
          console.log(`[Master Emergency DB Hit] Serving pre-verified protocol for "${symptom}".`);
          return res.json(item.data);
        }
      }
    }

    // 2. Query Gemini AI for emergency consultation
    try {
      console.log(`[Emergency AI Consult] Querying Gemini for "${symptom}"...`);
      const data = await getEmergencyConsultAI(age || 'Adult', gender || 'Male', condition || 'None', symptom, lang || 'ar');
      return res.json(data);
    } catch (aiErr) {
      console.error("[Emergency AI Consult Fallback Triggered]", aiErr);
      return res.json(masterEmergencyDb.symptoms?.headache?.data || {
        disclaimer: "تنبيه طبي هام: هذا الاقتراح للاسترشاد الأولي وحالات الطوارئ فقط ولا يغني عن استشارة الطبيب المختص!",
        assessment: `تم تقييم الشكوى: (${symptom}) للسن ${age || 'بالغ'}. يفضل الفحص الطبي المباشر.`,
        recommendedOTC: [
          {
            name: "Panadol Extra",
            arabicName: "بنادول إكسترا / سيتال أقراص",
            activeIngredient: "Paracetamol 500mg",
            dosage: "قرص عند اللزوم بعد الأكل",
            reason: "مسكن عام آمن للأعراض الأولية"
          }
        ],
        precautions: ["شرب كميات كافية من السوائل والراحة التامة."],
        emergencyRedFlags: ["في حالة اشتداد الأعراض يرجى التوجه لمستشفى الطوارئ فوراً."]
      });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch emergency consultation' });
  }
});

// Load Visitor Analytics Database
const visitorLogsPath = path.join(__dirname, '../data/visitor_logs.json');
let visitorLogsData = { totalVisits: 142, uniqueVisitors: [] as any[] };
try {
  if (fs.existsSync(visitorLogsPath)) {
    visitorLogsData = JSON.parse(fs.readFileSync(visitorLogsPath, 'utf-8'));
  }
} catch (e) {
  console.error("Could not load visitor logs database", e);
}

const saveVisitorLogs = () => {
  try {
    fs.writeFileSync(visitorLogsPath, JSON.stringify(visitorLogsData, null, 2));
  } catch (e) {
    console.error("Could not save visitor logs database", e);
  }
};

router.post('/analytics/track-visitor', (req, res) => {
  try {
    const { name, role, deviceId } = req.body;
router.post('/analytics/track', (req, res) => {
  try {
    const { deviceId, name, role, page, userAgent } = req.body;
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'Client IP';

    const result = trackRealVisitor({
      deviceId: deviceId || 'DEV-ANONYMOUS',
      name: name || 'زائر متصفح',
      role: role || 'متصفح / زائر',
      page: page || '/',
      userAgent: userAgent || req.headers['user-agent'] || 'Browser',
      ip: clientIp
    });

    res.json({ success: true, ...result });
  } catch (e) {
    res.status(500).json({ error: 'Failed to track visitor' });
  }
});

router.get('/analytics/stats', (req, res) => {
  try {
    const stats = getRealAdminStats();
    res.json(stats);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch analytics stats' });
  }
});

export default router;
