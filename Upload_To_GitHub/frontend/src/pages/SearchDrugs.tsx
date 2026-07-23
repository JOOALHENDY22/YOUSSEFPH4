import { Search, ArrowRight, History, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchDrugSuggestions } from '../services/api';

export default function SearchDrugs() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    setRecentSearches(history.map((h: any) => h.query).slice(0, 3));
  }, []);

  const saveToHistory = (query: string) => {
    let history = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    history = history.filter((h: any) => h.query.toLowerCase() !== query.toLowerCase());
    history.unshift({ query, time: new Date().toISOString() });
    localStorage.setItem('searchHistory', JSON.stringify(history.slice(0, 20)));
  };

  // Debounced search for suggestions
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const results = await fetchDrugSuggestions(searchQuery);
        setSuggestions(results);
        setIsSearching(false);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      saveToHistory(searchQuery.trim());
      setTimeout(() => {
        setIsSearching(false);
        navigate(`/drug/${encodeURIComponent(searchQuery.trim())}`);
      }, 500);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    saveToHistory(suggestion);
    navigate(`/drug/${encodeURIComponent(suggestion)}`);
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-5xl font-bold mb-4">{t('search.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400">{t('search.subtitle')}</p>
      </div>

      <div className="relative mb-12">
        <form onSubmit={handleSearch} className="relative">
          <div className="absolute inset-y-0 left-0 rtl:left-auto rtl:right-0 pl-4 rtl:pr-4 flex items-center pointer-events-none">
            <Search className="h-6 w-6 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-12 rtl:pl-4 rtl:pr-12 pr-32 rtl:pr-12 rtl:pl-32 py-5 text-lg rounded-2xl border-0 ring-1 ring-inset ring-gray-200 dark:ring-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-lg shadow-gray-200/20 dark:shadow-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-all"
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          />
          <div className="absolute inset-y-0 right-2 rtl:right-auto rtl:left-2 flex items-center">
            <button
              type="submit"
              disabled={!searchQuery.trim() || isSearching}
              className="btn-primary py-3 px-6 rounded-xl text-sm"
            >
              {isSearching ? <Loader2 className="h-5 w-5 animate-spin" /> : t('search.btn_search')}
            </button>
          </div>
        </form>

        {/* Live Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-y-auto max-h-60 z-[100]">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => selectSuggestion(suggestion)}
                className="w-full text-left rtl:text-right px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between transition-colors border-b last:border-b-0 border-gray-100 dark:border-gray-700"
              >
                <span className="font-medium text-primary-700 dark:text-primary-300">{suggestion}</span>
                <ArrowRight className="h-4 w-4 text-gray-400 rtl:rotate-180" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <History className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0 text-primary-500" />
            {t('search.recent_title')}
          </h2>
          <div className="glass-panel overflow-hidden">
            {(recentSearches.length > 0 ? recentSearches : ['Amoxicillin', 'Lisinopril', 'Omeprazole']).map((drug, i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center text-gray-700 dark:text-gray-300">
                  <Clock className="h-4 w-4 mr-3 rtl:ml-3 rtl:mr-0 text-gray-400" />
                  {drug}
                </div>
                <button onClick={() => selectSuggestion(drug)} className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline flex items-center">
                  {t('search.btn_search')} <ArrowRight className="h-4 w-4 ml-1 rtl:mr-1 rtl:ml-0 rtl:rotate-180" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0 text-rose-500" />
            {t('search.trending_title')}
          </h2>
          <div className="flex flex-wrap gap-3">
            {['Atorvastatin', 'Levothyroxine', 'Metformin', 'Amlodipine', 'Albuterol'].map((drug, i) => (
              <button 
                key={i}
                onClick={() => selectSuggestion(drug)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm font-medium hover:border-primary-500 hover:text-primary-600 transition-colors shadow-sm"
              >
                {drug}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-12 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-900/50 text-sm text-blue-800 dark:text-blue-300 text-center leading-relaxed">
        <strong>{t('search.disclaimer')}</strong>
      </div>
    </div>
  );
}
