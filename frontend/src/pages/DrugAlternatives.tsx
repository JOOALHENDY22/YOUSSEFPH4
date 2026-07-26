import React, { useState } from 'react';
import { RefreshCw, Search, CheckCircle2, ArrowRight, Pill, AlertCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { fetchDrugAlternatives } from '../services/api';

export default function DrugAlternatives() {
  const { t } = useTranslation();
  const [searchName, setSearchName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchName.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await fetchDrugAlternatives(searchName.trim());
      if (data) {
        setResult(data);
      } else {
        setError(t('alternatives.not_found') || 'لم نتمكن من العثور على بدائل لهذا الدواء حالياً.');
      }
    } catch (err) {
      setError(t('alternatives.error') || 'حدث خطأ أثناء جلب بدائل الدواء، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* Hero Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-bold mb-4 border border-primary-200 dark:border-primary-800">
          <RefreshCw className="h-4 w-4 animate-spin-slow" />
          {t('alternatives.badge') || 'محرك بدائل الأدوية الذكي'}
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-3">
          {t('alternatives.title') || 'البدائل والمكافئات الدوائية'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
          {t('alternatives.subtitle') || 'ابحث عن أي دواء لمطابقة البدائل المتوفرة بنفس المادة الفعالة أو البدائل ذات التأثير العلاجي المماثل والآمنة لسنك وحالتك.'}
        </p>
      </div>

      {/* Search Input Form */}
      <div className="glass-panel p-6 max-w-2xl mx-auto mb-10 shadow-xl border border-gray-100 dark:border-gray-800">
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              placeholder={t('alternatives.placeholder') || 'أدخل اسم الدواء (مثال: Antinal, Panadol, Augmentin)...'}
              className="w-full pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-3.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none text-sm transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary px-6 flex items-center gap-2 whitespace-nowrap shadow-lg shadow-primary-500/20"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
            <span>{t('alternatives.btn_search') || 'بحث عن بدائل'}</span>
          </button>
        </form>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="h-12 w-12 text-primary-500 animate-spin mb-4" />
          <p className="text-gray-500 text-sm">{t('alternatives.loading') || 'جاري تحليل التركيبة الكيميائية وجلب البدائل المطابقة...'}</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-center text-sm mb-8 flex items-center justify-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="space-y-8 animate-fade-in">
          {/* Main Selected Drug Header Card */}
          <div className="glass-panel p-6 border-l-4 border-l-primary-500 rtl:border-r-4 rtl:border-r-primary-500 rtl:border-l-0">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <span className="text-xs text-gray-400 font-semibold">{t('alternatives.target_drug') || 'الدواء المراد إيجاد بدائله:'}</span>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{result.drugName}</h2>
                <p className="text-sm font-semibold text-primary-600 dark:text-primary-400 mt-1 flex items-center gap-1.5">
                  <Pill className="h-4 w-4" />
                  المادة الفعالة: <span className="dir-ltr">{result.activeIngredient}</span>
                </p>
              </div>
              <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                تحليل كلينيكي معتمد
              </div>
            </div>
            {result.purpose && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-4 leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                💡 <strong>استخدام المستحضر:</strong> {result.purpose}
              </p>
            )}
            {result.clinicalWarning && (
              <div className="mt-3 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{result.clinicalWarning}</span>
              </div>
            )}
          </div>

          {/* Section 1: Identical Active Ingredient Substitutes */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              <h3 className="text-xl font-bold">{t('alternatives.identical_title') || '1. البدائل المطابقة بنفس المادة الفعالة بالصيدليات المصرية'}</h3>
            </div>
            {result.identicalSubstitutes && result.identicalSubstitutes.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {result.identicalSubstitutes.map((sub: any, idx: number) => (
                  <div key={idx} className="glass-panel p-5 border border-emerald-100 dark:border-emerald-950 hover:border-emerald-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div>
                          <h4 className="font-black text-lg text-gray-900 dark:text-white">{sub.nameAr || sub.name}</h4>
                          <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            🇺🇸 المكافئ الأمريكي: {sub.usEquivalent || sub.name?.replace(/مصري|مصر/g, '') || "US Brand Equivalent"}
                          </span>
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg shrink-0 border ${
                          sub.matchType === 'exact_bioequivalent' 
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-300'
                        }`}>
                          {sub.matchBadge || '🟢 بديل مطابق بنفس المادة'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-2 dir-ltr text-right rtl:text-left">
                        🧪 {sub.activeIngredient}
                      </p>
                      
                      <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1 mb-3 bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                        {sub.dosageForm && <div>💊 <strong>الشكل الدوائي:</strong> {sub.dosageForm}</div>}
                        {sub.pharmaClass && <div>🧬 <strong>العائلة الدوائية:</strong> {sub.pharmaClass}</div>}
                        {sub.manufacturer && <div>🏭 <strong>الشركة المصنعة:</strong> {sub.manufacturer}</div>}
                      </div>

                      <p className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-900/10 p-2.5 rounded-lg leading-relaxed">
                        💬 {sub.notes}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                      <Link to={`/drug/${encodeURIComponent(sub.name)}`} className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:underline">
                        عرض التفاصيل بالصيدلية
                        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl">لا توجد بدائل مطابقة مسجلة حالياً بنفس المادة الفعالة.</p>
            )}
          </div>

          {/* Section 2: Therapeutic Class Alternatives */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Pill className="h-6 w-6 text-primary-500" />
              <h3 className="text-xl font-bold">{t('alternatives.therapeutic_title') || '2. البدائل العلاجية المصرية (نفس العائلة والفاعلية)'}</h3>
            </div>
            {result.therapeuticAlternatives && result.therapeuticAlternatives.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-4">
                {result.therapeuticAlternatives.map((alt: any, idx: number) => (
                  <div key={idx} className="glass-panel p-5 border border-purple-100 dark:border-purple-950 hover:border-purple-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2 gap-2">
                        <div>
                          <h4 className="font-black text-lg text-gray-900 dark:text-white">{alt.nameAr || alt.name}</h4>
                          <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                            🇺🇸 المكافئ الأمريكي: {alt.usEquivalent || "US Brand Equivalent"}
                          </span>
                        </div>
                        <span className="text-[10px] font-black px-2.5 py-1 bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-900/50 dark:text-purple-300 rounded-lg shrink-0">
                          {alt.matchBadge || '🟣 بديل علاجي لنفس دواعي الاستعمال'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mb-2 dir-ltr text-right rtl:text-left">
                        🧪 {alt.activeIngredient}
                      </p>

                      <div className="text-xs text-gray-700 dark:text-gray-300 space-y-1 mb-3 bg-gray-50 dark:bg-gray-800/40 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800">
                        {alt.dosageForm && <div>💊 <strong>الشكل الدوائي:</strong> {alt.dosageForm}</div>}
                        {alt.pharmaClass && <div>🧬 <strong>العائلة الدوائية:</strong> {alt.pharmaClass}</div>}
                        {alt.manufacturer && <div>🏭 <strong>الشركة المصنعة:</strong> {alt.manufacturer}</div>}
                      </div>

                      <p className="text-xs text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-900/10 p-2.5 rounded-lg leading-relaxed">
                        💡 {alt.notes}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                      <Link to={`/drug/${encodeURIComponent(alt.name)}`} className="text-xs font-bold text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:underline">
                        عرض التفاصيل بالصيدلية
                        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl">لا توجد بدائل علاجية مسجلة حالياً.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
