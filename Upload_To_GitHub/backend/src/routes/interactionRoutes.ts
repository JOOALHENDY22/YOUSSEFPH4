import { Router } from 'express';
import { checkInteractionsAI, suggestDrugsAI, compareDrugsAI, getDrugDetailsAI } from '../services/aiService';

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

router.post('/interactions', async (req, res) => {
  try {
    const { drugs } = req.body;
    
    if (!drugs || !Array.isArray(drugs) || drugs.length < 2) {
      return res.status(400).json({ error: 'Please provide at least 2 drugs' });
    }

    const data = await checkInteractionsAI(drugs);
    res.json(data);
  } catch (error: any) {
    console.error(error);
    if (error.message === 'API Key missing') {
      res.status(500).json({ error: 'Gemini API Key is missing. Please add it to the .env file.' });
    } else {
      res.status(500).json({ error: 'Failed to process AI interaction check.' });
    }
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
    const data = await compareDrugsAI(drugA, drugB);
    res.json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to compare drugs' });
  }
});

router.post('/drug-details', async (req, res) => {
  try {
    const { drugName } = req.body;
    if (!drugName) {
      return res.status(400).json({ error: 'Please provide a drugName' });
    }
    const data = await getDrugDetailsAI(drugName);
    res.json(data);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch AI drug details' });
  }
});

export default router;
