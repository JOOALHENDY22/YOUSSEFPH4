import { useState, useEffect, useRef } from 'react';
import { Activity, Plus, X, AlertTriangle, AlertCircle, Info, ShieldAlert, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { checkInteractions, fetchDrugSuggestions } from '../services/api';

export default function DrugInteraction() {
  const { t } = useTranslation();
  const [drugs, setDrugs] = useState<string[]>(['Lisinopril', 'Ibuprofen']);
  const [inputVal, setInputVal] = useState('');
  
  // Autocomplete states
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);
  
  const [isChecking, setIsChecking] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [interactions, setInteractions] = useState<any[]>([]);

  // Click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search for suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (inputVal.length >= 2) {
        const results = await fetchDrugSuggestions(inputVal);
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [inputVal]);

  const addDrug = (drugName: string) => {
    if (drugName.trim() && !drugs.includes(drugName.trim())) {
      setDrugs([...drugs, drugName.trim()]);
      setInputVal('');
      setShowSuggestions(false);
      setHasResults(false);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addDrug(inputVal);
  };

  const removeDrug = (drugToRemove: string) => {
    setDrugs(drugs.filter(d => d !== drugToRemove));
    setHasResults(false);
  };

  const handleCheck = async () => {
    if (drugs.length < 2) return;
    setIsChecking(true);
    setHasResults(false);
    setInteractions([]);

    try {
      const results = await checkInteractions(drugs);
      
      const formattedInteractions: any[] = [];
      if (results && results.length > 0) {
        for (const interaction of results) {
          formattedInteractions.push({
            description: interaction.description,
            severity: interaction.severity || 'N/A',
            drugs: interaction.drugs || drugs
          });
        }
      }
      setInteractions(formattedInteractions);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 500) {
        alert(err.response.data.error || "Please set your Gemini API key in the backend/.env file.");
      }
    }

    setIsChecking(false);
    setHasResults(true);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-5xl font-bold mb-4 flex items-center justify-center">
          <Activity className="h-10 w-10 mr-4 rtl:ml-4 rtl:mr-0 text-primary-500" />
          {t('interaction.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{t('interaction.subtitle')}</p>
      </div>

      <div className="glass-panel p-6 mb-8">
        <div className="relative mb-6" ref={suggestionRef}>
          <form onSubmit={handleAddSubmit} className="flex gap-4">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
              placeholder={t('interaction.placeholder')}
              className="input-field flex-1"
            />
            <button type="submit" disabled={!inputVal.trim()} className="btn-secondary whitespace-nowrap">
              <Plus className="h-5 w-5 mr-1 rtl:ml-1 rtl:mr-0" /> {t('interaction.btn_add')}
            </button>
          </form>
          
          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-32 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => addDrug(suggestion)}
                  className="w-full text-left rtl:text-right px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b last:border-b-0 border-gray-100 dark:border-gray-700 font-medium"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <AnimatePresence>
            {drugs.map(drug => (
              <motion.div
                key={drug}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-4 py-2 shadow-sm"
              >
                <span className="font-medium mr-2 rtl:ml-2 rtl:mr-0">{drug}</span>
                <button 
                  onClick={() => removeDrug(drug)}
                  className="text-gray-400 hover:text-red-500 transition-colors rounded-full p-1 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {drugs.length === 0 && (
            <p className="text-gray-500 italic py-2">{t('interaction.no_drugs')}</p>
          )}
        </div>

        <button 
          onClick={handleCheck}
          disabled={drugs.length < 2 || isChecking}
          className="w-full btn-primary py-4 text-lg"
        >
          {isChecking ? (
            <><Loader2 className="h-6 w-6 animate-spin mr-2 rtl:ml-2 rtl:mr-0" /> {t('interaction.btn_checking')}</>
          ) : (
            t('interaction.btn_check')
          )}
        </button>
      </div>

      {hasResults && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold border-b border-gray-200 dark:border-gray-800 pb-4">{t('interaction.results_title')}</h2>
          
          {interactions.length > 0 ? (
            interactions.map((interaction, idx) => (
              <div key={idx} className={`glass-panel p-6 border-l-4 ${interaction.severity === 'high' ? 'border-l-red-500' : 'border-l-amber-500'} rtl:border-r-4 rtl:border-l-0 ${interaction.severity === 'high' ? 'rtl:border-r-red-500' : 'rtl:border-r-amber-500'} relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 rtl:left-0 rtl:right-auto ${interaction.severity === 'high' ? 'bg-red-100 dark:bg-red-900/30 text-red-700' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700'} px-3 py-1 text-xs font-bold rounded-bl-xl rtl:rounded-br-xl rtl:rounded-bl-none uppercase tracking-wider`}>
                  {interaction.severity === 'high' ? t('interaction.major') : t('interaction.minor')}
                </div>
                <div className="flex items-start">
                  {interaction.severity === 'high' ? (
                    <AlertTriangle className="h-6 w-6 text-red-500 mt-1 mr-4 rtl:ml-4 rtl:mr-0 shrink-0" />
                  ) : (
                    <AlertCircle className="h-6 w-6 text-amber-500 mt-1 mr-4 rtl:ml-4 rtl:mr-0 shrink-0" />
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {interaction.drugs.join(' + ')}
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed font-medium">
                      {interaction.description}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
             <div className="glass-panel p-6 border-l-4 border-l-green-500 rtl:border-r-4 rtl:border-l-0 rtl:border-r-green-500 relative overflow-hidden">
               <div className="flex items-start">
                <Info className="h-6 w-6 text-green-500 mt-1 mr-4 rtl:ml-4 rtl:mr-0 shrink-0" />
                <div>
                  <h3 className="text-lg font-bold mb-2">{t('interaction.no_interaction_title')}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('interaction.no_interaction_desc')}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300 text-center leading-relaxed">
            <ShieldAlert className="h-4 w-4 inline-block mb-1" />
            <br />
            <strong>{t('interaction.disclaimer')}</strong>
          </div>
        </motion.div>
      )}
    </div>
  );
}
