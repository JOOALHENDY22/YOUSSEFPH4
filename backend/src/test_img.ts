import axios from 'axios';

export async function fetchDuckDuckGoDrugImage(drugName: string): Promise<string | null> {
  try {
    // 1. Obtain DuckDuckGo vqd token
    const q = encodeURIComponent(`${drugName} دواء علبة مصر`);
    const tokenRes = await axios.get(`https://duckduckgo.com/?q=${q}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 4000
    });
    
    const vqdMatch = tokenRes.data.match(/vqd=["']([^"']+)["']/);
    if (vqdMatch) {
      const vqd = vqdMatch[1];
      // 2. Fetch image search results JSON from DuckDuckGo
      const imgRes = await axios.get(`https://duckduckgo.com/i.js?q=${q}&vqd=${vqd}&o=json`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        timeout: 4000
      });
      
      if (imgRes.data && imgRes.data.results && imgRes.data.results.length > 0) {
        const firstImg = imgRes.data.results[0].image;
        console.log(`[DUCKDUCKGO REAL PHARMACY IMAGE SUCCESS] "${drugName}":`, firstImg);
        return firstImg;
      }
    }
  } catch (e: any) {
    console.error('DuckDuckGo image search error:', e.message);
  }
  return null;
}

async function testAll() {
  await fetchDuckDuckGoDrugImage('Antinal');
  await fetchDuckDuckGoDrugImage('Congestal');
  await fetchDuckDuckGoDrugImage('Panadol');
  await fetchDuckDuckGoDrugImage('Augmentin');
  await fetchDuckDuckGoDrugImage('Controloc');
}

testAll();
