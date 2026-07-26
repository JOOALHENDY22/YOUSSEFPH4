import { useState, useEffect } from 'react';
import { Search, FileText, CheckCircle2, Scale, Info, Sparkles, Loader2 } from 'lucide-react';
import { fetchScheduledDrugs } from '../services/api';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface ScheduledDrug {
  name: string;
  arabicName: string;
  scheduleType: string;
  scheduleLevel: 'schedule_1' | 'schedule_2' | 'monitored';
  activeIngredient: string;
  description: string;
  dispensingRules: string;
}

export default function ControlledDrugs() {
  const { t } = useTranslation();

  const [query, setQuery] = useState('');
  const [scheduledList, setScheduledList] = useState<ScheduledDrug[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'schedule_1' | 'schedule_2'>('all');

  useEffect(() => {
    loadDrugs();
  }, []);

  const loadDrugs = async (searchQuery?: string) => {
    setLoading(true);
    const data = await fetchScheduledDrugs(searchQuery);
    setScheduledList(data);
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadDrugs(query);
  };

  const [visibleCount, setVisibleCount] = useState(40);

  const filteredList = scheduledList.filter(drug => {
    if (activeTab === 'schedule_1') return drug.scheduleLevel === 'schedule_1';
    if (activeTab === 'schedule_2') return drug.scheduleLevel === 'schedule_2' || drug.scheduleLevel === 'monitored';
    return true;
  });

  const visibleList = filteredList.slice(0, visibleCount);

  return (
    <div className="max-w-5xl mx-auto py-8 animate-fade-in space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-900 via-rose-900 to-slate-900 text-white p-8 md:p-12 shadow-2xl border border-red-700/50">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 rtl:space-x-reverse px-3 py-1.5 rounded-full bg-red-500/20 border border-red-400/40 text-red-200 text-xs font-semibold mb-4 backdrop-blur-md">
            <Scale className="w-4 h-4 text-red-400" />
            <span>{t('scheduled.badge')}</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black mb-4 tracking-tight leading-tight">
            {t('scheduled.title')}
          </h1>
          <p className="text-red-100/90 text-base md:text-lg leading-relaxed mb-6">
            {t('scheduled.subtitle')}
          </p>

          {/* Quick Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 rtl:left-auto rtl:right-4" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('scheduled.placeholder')}
                className="w-full pl-4 pr-12 py-3.5 bg-white/10 dark:bg-slate-950/40 backdrop-blur-xl border border-white/20 rounded-2xl text-white placeholder-red-200/60 focus:outline-none focus:ring-2 focus:ring-red-400 transition-all text-sm md:text-base"
              />
            </div>
            <button type="submit" className="px-6 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-colors flex items-center gap-2 text-sm shadow-lg shadow-red-900/50">
              <Search className="h-4 w-4" />
              <span>{t('scheduled.btn_check')}</span>
            </button>
          </form>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="flex space-x-2 rtl:space-x-reverse">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {t('scheduled.all_tab')} ({scheduledList.length})
          </button>
          <button
            onClick={() => setActiveTab('schedule_1')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'schedule_1'
                ? 'bg-red-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {t('scheduled.schedule_1_tab')}
          </button>
          <button
            onClick={() => setActiveTab('schedule_2')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === 'schedule_2'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {t('scheduled.schedule_2_tab')}
          </button>
        </div>

        <div className="text-xs text-gray-500 flex items-center gap-1">
          <Info className="w-4 h-4 text-primary-500" />
          <span>{t('scheduled.eda_notice')}</span>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-red-500 mb-3" />
          <p className="text-gray-500 text-sm font-medium">Checking scheduled database...</p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="text-center py-16 glass-panel p-8 rounded-3xl">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Drug is not listed in scheduled tables</h3>
          <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
            No match found for "{query}". You can also view full medical details page.
          </p>
          <Link to={`/drug/${encodeURIComponent(query || 'Panadol')}`} className="btn-primary inline-flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>AI Full Inspection</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {visibleList.map((drug, index) => {
              const isSchedule1 = drug.scheduleLevel === 'schedule_1';
              return (
                <div
                  key={index}
                  className={`glass-panel p-6 rounded-3xl transition-all duration-300 hover:shadow-xl border-l-4 rtl:border-r-4 rtl:border-l-0 ${
                    isSchedule1 ? 'border-r-red-600 bg-red-50/20 dark:bg-red-950/10' : 'border-r-amber-500 bg-amber-50/20 dark:bg-amber-950/10'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white mb-1 flex flex-wrap items-center gap-2">
                        <span>{drug.arabicName || drug.name}</span>
                        {drug.arabicName && drug.arabicName !== drug.name && (
                          <span className="text-xs font-normal text-gray-500 truncate block">({drug.name})</span>
                        )}
                      </h3>
                      <p className="text-xs font-semibold text-primary-600 dark:text-primary-400">
                        {t('scheduled.active_ingredient')} {drug.activeIngredient}
                      </p>
                    </div>

                    <span className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-normal sm:whitespace-nowrap text-center shrink-0 shadow-sm ${
                      isSchedule1 
                        ? 'bg-red-600 text-white' 
                        : 'bg-amber-500 text-white'
                    }`}>
                      {drug.scheduleType}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                    {drug.description}
                  </p>

                  <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-slate-900/80 border border-gray-100 dark:border-gray-800 text-xs leading-relaxed space-y-1">
                    <div className="font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      <span>{t('scheduled.dispensing_rules')}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">
                      {drug.dispensingRules}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {visibleCount < filteredList.length && (
            <div className="text-center pt-6">
              <button
                onClick={() => setVisibleCount(prev => prev + 40)}
                className="px-8 py-3.5 bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                عرض المزيد من أدوية الجدول ({filteredList.length - visibleCount} مستحضر متبقي)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
