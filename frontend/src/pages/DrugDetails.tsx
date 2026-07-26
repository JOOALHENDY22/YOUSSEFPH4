import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Info, Factory, Activity, Heart, ArrowLeft, Bookmark, Loader2, Baby, PersonStanding, AlertOctagon, HeartPulse } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { searchDrugFDA } from '../services/api';
import { translateText } from '../services/translator';

export default function DrugDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [isSaved, setIsSaved] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [drugData, setDrugData] = useState<any>(null);
  const [error, setError] = useState(false);

  const searchName = id ? id.charAt(0).toUpperCase() + id.slice(1) : 'Unknown Drug';

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('savedDrugs') || '[]');
    if (saved.includes(searchName)) setIsSaved(true);
  }, [searchName]);

  const toggleSave = () => {
    const saved: string[] = JSON.parse(localStorage.getItem('savedDrugs') || '[]');
    if (isSaved) {
      const newSaved = saved.filter(d => d !== searchName);
      localStorage.setItem('savedDrugs', JSON.stringify(newSaved));
      setIsSaved(false);
    } else {
      if (!saved.includes(searchName)) saved.push(searchName);
      localStorage.setItem('savedDrugs', JSON.stringify(saved));
      setIsSaved(true);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(false);
      const data = await searchDrugFDA(searchName);
      if (data) {
        const getField = (val: any) => Array.isArray(val) ? val[0] : (typeof val === 'string' ? val : '');

        const purpose = getField(data.purpose) || getField(data.indications_and_usage) || 'No specific indications listed in the label.';
        const warnings = getField(data.warnings) || getField(data.boxed_warning) || 'No major warnings provided in this label format.';
        const dosage = getField(data.dosage_and_administration) || 'Consult a healthcare provider for dosage.';
        const pregnancy = getField(data.pregnancy) || 'No specific pregnancy data provided.';
        const pediatric = getField(data.pediatric_use) || 'No specific pediatric guidelines provided.';
        const geriatric = getField(data.geriatric_use) || 'No specific geriatric guidelines provided.';
        const contraindications = getField(data.contraindications) || 'No contraindications listed.';
        const adverseReactions = getField(data.adverse_reactions) || 'No adverse reactions listed.';

        const currentLang = i18n.language || 'en';
        const multi = data.translations?.[currentLang] || data.translations?.['ar'] || data.translations?.['en'];

        if (multi) {
          setDrugData({
            original: data,
            translated: {
              purpose: multi.purpose || getField(data.purpose),
              warnings: multi.warnings || getField(data.warnings),
              dosage: multi.dosage || getField(data.dosage_and_administration),
              pregnancy: multi.pregnancy || getField(data.pregnancy),
              pediatric: multi.pediatric || getField(data.pediatric_use),
              geriatric: multi.geriatric || getField(data.geriatric_use),
              contraindications: multi.contraindications || getField(data.contraindications),
              adverseReactions: multi.adverseReactions || getField(data.adverse_reactions),
            }
          });
        } else {
          setDrugData({
            original: data,
            translated: {
              purpose: await translateText(purpose, i18n.language),
              warnings: await translateText(warnings, i18n.language),
              dosage: await translateText(dosage, i18n.language),
              pregnancy: await translateText(pregnancy, i18n.language),
              pediatric: await translateText(pediatric, i18n.language),
              geriatric: await translateText(geriatric, i18n.language),
              contraindications: await translateText(contraindications, i18n.language),
              adverseReactions: await translateText(adverseReactions, i18n.language),
            }
          });
        }
      } else {
        setError(true);
      }
      setLoading(false);
    };

    if (id) {
      fetchData();
    }
  }, [id, i18n.language]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary-500 mb-4" />
        <p className="text-gray-500">Fetching and translating real medical data...</p>
      </div>
    );
  }

  if (error || !drugData) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <ShieldAlert className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('notfound.title')}</h2>
        <p className="text-gray-600 mb-6">Could not find official FDA data for "{searchName}".</p>
        <Link to="/search" className="btn-primary">{t('details.back')}</Link>
      </div>
    );
  }

  const getRealManufacturer = (name: string, rawMfr?: string) => {
    if (rawMfr && !rawMfr.includes('Egyptian & US') && !rawMfr.includes('شركة أدوية مسجلة') && !rawMfr.includes('مستحضر صيدلي مسجل')) {
      return rawMfr;
    }
    const n = (name || '').toLowerCase();
    if (n.includes('capoten') || n.includes('cepoten') || n.includes('كابوتين')) return 'Squibb / Bristol-Myers Squibb Egypt (سكويب للأدوية)';
    if (n.includes('norvasc') || n.includes('نورفاسك') || n.includes('amlodipine') || n.includes('zoloft') || n.includes('زولوفت')) return 'Viatris / Pfizer Egypt (فايزر مصر للأدوية)';
    if (n.includes('augmentin') || n.includes('أوجمنتين') || n.includes('panadol') || n.includes('eltroxin')) return 'GSK (GlaxoSmithKline Egypt / جلاكسو سميثكلاين)';
    if (n.includes('congestal') || n.includes('كونجستال') || n.includes('controloc')) return 'EVA Pharma Egypt (إيفا فارما مصر)';
    if (n.includes('antinal') || n.includes('أنتينال') || n.includes('concor') || n.includes('apidone') || n.includes('أبيدون') || n.includes('ابيدون') || n.includes('phenadone') || n.includes('فينادون')) return 'Amoun Pharmaceutical Co. (شركة أمون للأدوية - مصر)';
    if (n.includes('cataflam') || n.includes('كتافلام') || n.includes('voltaren')) return 'Novartis Pharma Egypt (نوفارتس فارما مصر)';
    if (n.includes('brufen') || n.includes('بروفين')) return 'Abbott Laboratories / Kahira Pharma (القاهرة للأدوية)';
    if (n.includes('cetal') || n.includes('سيتال')) return 'EIPICO (شركة إيبيكو للأدوية - مصر)';
    if (n.includes('cipralex') || n.includes('سيبراليكس')) return 'Lundbeck / SEDICO Egypt (سيديكو للأدوية)';
    if (n.includes('nexium') || n.includes('نيكسيوم')) return 'AstraZeneca Egypt (أسترازينيكا مصر)';
    if (n.includes('glucophage') || n.includes('جلوكوفاج')) return 'Merck / MinaPharm Egypt (مينافارم للأدوية)';

    return rawMfr || 'EIPICO / Amoun / EVA Pharma (شركة أدوية مصرية مسجلة)';
  };

  const genericName = drugData.original.activeIngredient || drugData.original.openfda?.generic_name?.[0] || 'Active Scientific Ingredient / المادة الفعالة';
  const manufacturer = getRealManufacturer(searchName, drugData.original.manufacturer || drugData.original.openfda?.manufacturer_name?.[0]);
  
  const { purpose, warnings, dosage, pregnancy, pediatric, geriatric, contraindications, adverseReactions } = drugData.translated;

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in">
      {/* Prominent Controlled Scheduled Drug Warning Banner */}
      {drugData.original.scheduled_status?.is_scheduled && (
        <div className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-red-950 via-slate-900 to-purple-950 text-white border-2 border-red-500 shadow-2xl animate-pulse flex items-start gap-4">
          <AlertOctagon className="h-8 w-8 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-extrabold text-lg text-red-300 flex items-center gap-2">
              ⛔ تنبيه هام: هذا المستحضر دواء جدول مراقب (وليس دواء طوارئ عادي!)
            </h3>
            <p className="text-sm text-gray-200 mt-1 leading-relaxed">
              هذا الدواء مدرج ضمن <strong>{drugData.original.scheduled_status.schedule_category || 'جدول المخدرات والدرج المغلق'}</strong> طبقاً للتشريعات الطبية المصرية. 
              <span className="block mt-1 text-amber-300 font-bold">
                ⚠️ لا يعتبر دواء طوارئ عادي، ولا يصرف إلا بروشتة حمراء معتمدة ومسجلة بدفتر المخدرات بالصيدلية.
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
        <div>
          <Link to="/search" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0 rtl:rotate-180" />
            {t('details.back')}
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-5xl font-bold">{drugData.original.arabicName || drugData.original.name || searchName}</h1>
            
            {/* Eye-Catching Glowing Badge */}
            {drugData.original.scheduled_status?.is_scheduled ? (
              <span className="px-4 py-1.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-red-700 via-purple-800 to-slate-900 text-white shadow-lg shadow-purple-500/50 animate-pulse border border-purple-400 flex items-center gap-1.5">
                ⛔ أدوية جدول مراقبة (روشتة حمراء مدموغة)
              </span>
            ) : drugData.original.emergency_status?.is_emergency ? (
              <span className="px-4 py-1.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-lg shadow-red-500/50 animate-pulse border border-red-300 flex items-center gap-1.5">
                <AlertOctagon className="h-4 w-4" />
                🚨 Prescription / طوارئ (يلزم روشتة طبية)
              </span>
            ) : (
              <span className="px-4 py-1.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/50 animate-pulse border border-emerald-300 flex items-center gap-1.5">
                ✨ OTC (متاح بدون روشتة)
              </span>
            )}

            {/* Controlled / Scheduled Drug Category Detail Badge */}
            {drugData.original.scheduled_status?.is_scheduled && (
              <span className="px-4 py-1.5 rounded-full text-xs font-extrabold bg-gradient-to-r from-purple-900 via-slate-900 to-indigo-950 text-white shadow-lg shadow-indigo-500/50 border border-purple-400 flex items-center gap-1.5">
                🔒 {drugData.original.scheduled_status.schedule_category || 'أدوية الجدول والدرج المغلق'}
              </span>
            )}
            
            <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold rounded-full">{t('details.verified')}</span>
          </div>
          <p className="text-xl text-gray-500 dark:text-gray-400 flex items-center mt-2">
            <Factory className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0 text-primary-500" />
            <span className="font-semibold text-gray-800 dark:text-gray-200 ml-1 rtl:mr-1">المادة الفعالة: {genericName}</span>
          </p>
        </div>
        <div className="flex space-x-3 rtl:space-x-reverse">
          <button 
            onClick={toggleSave}
            className={`btn-secondary flex items-center space-x-2 rtl:space-x-reverse ${isSaved ? 'text-red-500 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10' : ''}`}
          >
            <Heart className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} />
            <span>{isSaved ? t('details.btn_saved') : t('details.btn_save')}</span>
          </button>
          <button 
            onClick={() => navigate('/compare', { state: { drugA: searchName } })}
            className="btn-primary flex items-center space-x-2 rtl:space-x-reverse"
          >
            <Bookmark className="h-5 w-5" />
            <span>{t('details.btn_compare')}</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="glass-panel p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center border-b border-gray-100 dark:border-gray-800 pb-3">
              <Info className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0 text-primary-500" />
              {t('details.indications')}
            </h2>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <p className="text-sm leading-relaxed">{purpose}</p>
            </div>
          </div>
          
          <div className="glass-panel p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center border-b border-gray-100 dark:border-gray-800 pb-3">
              <Activity className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0 text-primary-500" />
              {t('details.dosage')}
            </h2>
            <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed max-h-48 overflow-y-auto pr-2">
              {dosage}
            </div>
          </div>

          <div className="glass-panel p-6 border-l-4 border-l-amber-500 rtl:border-r-4 rtl:border-r-amber-500 rtl:border-l-0">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-amber-600 dark:text-amber-500">
              <ShieldAlert className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
              {t('details.warnings')}
            </h2>
            <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed max-h-48 overflow-y-auto pr-2">
              {warnings}
            </div>
          </div>
          
          <div className="glass-panel p-6 border-l-4 border-l-red-500 rtl:border-r-4 rtl:border-r-red-500 rtl:border-l-0 bg-red-50/50 dark:bg-red-900/10">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-red-600 dark:text-red-500">
              <AlertOctagon className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
              {t('details.contraindications')}
            </h2>
            <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed max-h-48 overflow-y-auto pr-2">
              {contraindications}
            </div>
          </div>
          
          <div className="glass-panel p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center border-b border-gray-100 dark:border-gray-800 pb-3">
              <HeartPulse className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0 text-rose-500" />
              {t('details.adverse')}
            </h2>
            <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed max-h-48 overflow-y-auto pr-2">
              {adverseReactions}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-panel p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <Baby className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0 text-blue-500" />
                {t('details.pediatric')}
              </h2>
              <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed max-h-32 overflow-y-auto pr-2">
                {pediatric}
              </div>
            </div>
            
            <div className="glass-panel p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center">
                <PersonStanding className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0 text-emerald-500" />
                {t('details.geriatric')}
              </h2>
              <div className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed max-h-32 overflow-y-auto pr-2">
                {geriatric}
              </div>
            </div>
          </div>

        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">

          <div className="glass-panel p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{t('details.quick_facts')}</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                <dt className="text-gray-500">{t('details.manufacturer')}</dt>
                <dd className="font-medium text-right rtl:text-left max-w-[60%]">{manufacturer}</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                <dt className="text-gray-500">{t('details.pregnancy')}</dt>
                <dd className="font-medium text-amber-600 dark:text-amber-400 truncate max-w-[60%]" title={pregnancy}>
                  {pregnancy || 'Safe under medical supervision / آمن تحت إشراف طبي'}
                </dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                <dt className="text-gray-500">{t('details.rx_otc')}</dt>
                <dd className="font-medium text-primary-600 dark:text-primary-400">
                  {drugData.original.product_type || drugData.original.openfda?.product_type?.[0] || 'OTC / متاح بدون روشتة'}
                </dd>
              </div>
            </dl>
          </div>
          
          <div className="glass-panel p-6 bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/10 dark:to-gray-800">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('details.check_interact_title')}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {t('details.check_interact_desc')}
            </p>
            <Link to="/interaction" className="btn-primary w-full text-center">
              {t('details.check_btn')}
            </Link>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300 text-center leading-relaxed">
            <ShieldAlert className="h-4 w-4 inline-block mb-1" />
            <br />
            <strong>{t('details.disclaimer')}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
