import axios from 'axios';

// Cache translations in memory to avoid repetitive API calls for the same text
const translationCache = new Map<string, string>();

/**
 * Translates English text to Arabic using the free Google Translate API endpoint.
 * Useful for translating dynamic medical data where hardcoded dictionaries aren't feasible.
 * 
 * @param text The English text to translate
 * @param targetLang Target language code (ar for Arabic)
 * @returns Translated text, or the original text if translation fails
 */
export const translateText = async (text: string, targetLang: string = 'ar'): Promise<string> => {
  if (!text || text.trim() === '') return text;
  
  // Return original if we are already in English
  if (targetLang === 'en') return text;

  // Since we only have one Arabic target for translations (fusha and amiya use the same translated medical text)
  const langCode = 'ar';
  
  // Check cache first
  const cacheKey = `${langCode}:${text}`;
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  try {
    // The Google Translate free GTX endpoint
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${langCode}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await axios.get(url);
    
    // Response format: [ [ [ "Translated text", "Original text", ... ] ], ... ]
    let translated = '';
    if (response.data && response.data[0]) {
      response.data[0].forEach((item: any) => {
        if (item[0]) translated += item[0];
      });
    }

    if (translated) {
      translationCache.set(cacheKey, translated);
      return translated;
    }
    
    return text; // Fallback to original
  } catch (error) {
    console.error('Translation Error:', error);
    return text; // Fallback to original
  }
};

/**
 * Translates an array of strings in parallel.
 */
export const translateArray = async (texts: string[], targetLang: string = 'ar'): Promise<string[]> => {
  if (targetLang === 'en') return texts;
  
  try {
    const promises = texts.map(text => translateText(text, targetLang));
    return await Promise.all(promises);
  } catch (error) {
    console.error('Batch Translation Error:', error);
    return texts;
  }
};
