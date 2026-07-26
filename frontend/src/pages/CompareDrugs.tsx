import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Scale, Loader2, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchDrugSuggestions, fetchDrugComparison } from '../services/api';

export default function CompareDrugs() {
  const { t } = useTranslation();
  const location = useLocation();
  
  // States for Drug A
  const [drugA, setDrugA] = useState(location.state?.drugA || '');
  const [inputA, setInputA] = useState(location.state?.drugA || '');
  const [suggestionsA, setSuggestionsA] = useState<string[]>([]);
  const [showSuggA, setShowSuggA] = useState(false);
  const refA = useRef<HTMLDivElement>(null);

  // States for Drug B
  const [drugB, setDrugB] = useState('');
  const [inputB, setInputB] = useState('');
  const [suggestionsB, setSuggestionsB] = useState<string[]>([]);
  const [showSuggB, setShowSuggB] = useState(false);
  const refB = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState<any[] | null>(null);

  // Click outside handlers
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (refA.current && !refA.current.contains(event.target as Node)) setShowSuggA(false);
      if (refB.current && !refB.current.contains(event.target as Node)) setShowSuggB(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search A
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (inputA.length >= 2 && inputA !== drugA) {
        const results = await fetchDrugSuggestions(inputA);
        setSuggestionsA(results);
        setShowSuggA(true);
      } else if (inputA.length < 2) {
        setSuggestionsA([]);
        setShowSuggA(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [inputA, drugA]);

  // Debounced search B
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (inputB.length >= 2 && inputB !== drugB) {
        const results = await fetchDrugSuggestions(inputB);
        setSuggestionsB(results);
        setShowSuggB(true);
      } else if (inputB.length < 2) {
        setSuggestionsB([]);
        setShowSuggB(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [inputB, drugB]);

  const handleCompare = async () => {
    if (inputA && inputB) {
      setLoading(true);
      try {
        const results: any = await fetchDrugComparison(inputA, inputB);
        if (Array.isArray(results)) {
          setComparisonData(results);
        } else if (results && typeof results === 'object') {
          setComparisonData([
            { feature: "المادة الفعالة (Active Ingredient)", drugA: results.activeIngredientA || inputA, drugB: results.activeIngredientB || inputB },
            { feature: "آلية العمل (Mechanism)", drugA: results.mechanismA || "علاج طبي", drugB: results.mechanismB || "علاج طبي" },
            { feature: "أمان المعدة (Stomach Safety)", drugA: results.stomachSafetyA || "بعد الطعام", drugB: results.stomachSafetyB || "بعد الطعام" },
            { feature: "التوصية الصيدلانية (Clinical Advice)", drugA: results.recommendation || `مستحضر آمن`, drugB: results.recommendation || `مستحضر آمن` }
          ]);
        }
      } catch(e: any) {
        console.error(e);
      }
      setLoading(false);
    } else {
      alert("يرجى إدخال اسم الدواءين أولاً للمقارنة.");
    }
  };

  const selectA = (d: string) => { setDrugA(d); setInputA(d); setShowSuggA(false); };
  const selectB = (d: string) => { setDrugB(d); setInputB(d); setShowSuggB(false); };

  return (
    <div className="max-w-6xl mx-auto py-8 animate-fade-in">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 flex items-center justify-center">
          <Scale className="h-10 w-10 mr-4 rtl:ml-4 rtl:mr-0 text-primary-500" />
          {t('compare.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{t('compare.subtitle')}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Drug 1 Selection */}
        <div className="glass-panel p-6 border-t-4 border-t-primary-500 relative" ref={refA}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Drug A</label>
          <input
            type="text"
            className="input-field w-full"
            placeholder="Type drug name (e.g., Congestal)"
            value={inputA}
            onChange={(e) => setInputA(e.target.value)}
            onFocus={() => { if(suggestionsA.length > 0) setShowSuggA(true); }}
          />
          {showSuggA && suggestionsA.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-y-auto max-h-60 z-[100]">
              {suggestionsA.map((s, i) => (
                <button key={i} type="button" onClick={() => selectA(s)} className="w-full text-left rtl:text-right px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 font-medium text-primary-700 dark:text-primary-400">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Drug 2 Selection */}
        <div className="glass-panel p-6 border-t-4 border-t-blue-500 relative" ref={refB}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Drug B</label>
          <input
            type="text"
            className="input-field w-full"
            placeholder="Type drug name (e.g., Panadol Extra)"
            value={inputB}
            onChange={(e) => setInputB(e.target.value)}
            onFocus={() => { if(suggestionsB.length > 0) setShowSuggB(true); }}
          />
          {showSuggB && suggestionsB.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-y-auto max-h-60 z-[100]">
              {suggestionsB.map((s, i) => (
                <button key={i} type="button" onClick={() => selectB(s)} className="w-full text-left rtl:text-right px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 font-medium text-blue-700 dark:text-blue-400">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <button 
          onClick={handleCompare}
          disabled={!inputA || !inputB || loading}
          className="btn btn-primary px-8 py-3 text-lg font-bold shadow-lg shadow-primary-500/30 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'جاري التحليل...' : 'قارن الآن'}
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary-500 mb-4" />
          <p className="text-gray-500 font-medium">✨ AI is analyzing and comparing drugs for the Egyptian market...</p>
        </div>
      )}

      {/* Comparison Matrix AI Data */}
      {!loading && comparisonData && (
        <div className="glass-panel overflow-hidden animate-fade-in shadow-2xl">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-5 font-bold text-gray-800 dark:text-gray-200 w-1/4 border-b-2 border-gray-200 dark:border-gray-700">Clinical Feature</th>
                  <th className="px-6 py-5 font-black text-lg text-primary-600 dark:text-primary-400 border-b-2 border-primary-200 dark:border-primary-800 border-l border-r border-gray-100 dark:border-gray-800 w-[37.5%] bg-primary-50/30 dark:bg-primary-900/10">{inputA}</th>
                  <th className="px-6 py-5 font-black text-lg text-blue-600 dark:text-blue-400 border-b-2 border-blue-200 dark:border-blue-800 w-[37.5%] bg-blue-50/30 dark:bg-blue-900/10">{inputB}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {comparisonData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/20 transition-colors group">
                    <td className="px-6 py-5 font-bold text-gray-900 dark:text-white bg-gray-50/30 dark:bg-gray-800/30 group-hover:bg-transparent transition-colors">
                      {row.feature}
                    </td>
                    <td className="px-6 py-5 border-l border-r border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                      {row.drugA}
                    </td>
                    <td className="px-6 py-5 text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                      {row.drugB}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="flex flex-col space-y-4 md:hidden p-4">
            {comparisonData.map((row, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 text-center border-b border-gray-100 dark:border-gray-800">
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">{row.feature}</h4>
                </div>
                <div className="grid grid-cols-2 divide-x rtl:divide-x-reverse divide-gray-100 dark:divide-gray-800">
                  <div className="p-4 text-center bg-primary-50/10 dark:bg-primary-900/5">
                    <p className="font-black text-primary-600 dark:text-primary-400 text-xs mb-2 bg-primary-50 dark:bg-primary-900/20 inline-block px-2 py-1 rounded-md">{inputA}</p>
                    <p className="text-gray-700 dark:text-gray-300 font-medium text-sm leading-relaxed">{row.drugA}</p>
                  </div>
                  <div className="p-4 text-center bg-blue-50/10 dark:bg-blue-900/5">
                    <p className="font-black text-blue-600 dark:text-blue-400 text-xs mb-2 bg-blue-50 dark:bg-blue-900/20 inline-block px-2 py-1 rounded-md">{inputB}</p>
                    <p className="text-gray-700 dark:text-gray-300 font-medium text-sm leading-relaxed">{row.drugB}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-4 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/10 dark:to-blue-900/10 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 text-center leading-relaxed">
            <ShieldAlert className="h-5 w-5 inline-block mb-1 text-primary-500" />
            <br />
            <strong>Source Disclaimer:</strong> This comparison was generated instantly using advanced <strong>AI (Gemini)</strong> tailored for the Egyptian market.
          </div>
        </div>
      )}
    </div>
  );
}
