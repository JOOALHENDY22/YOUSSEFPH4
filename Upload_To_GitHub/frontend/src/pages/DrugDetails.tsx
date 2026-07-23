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

  const genericName = drugData.original.openfda?.generic_name?.[0] || 'Unknown Generic';
  const manufacturer = drugData.original.openfda?.manufacturer_name?.[0] || 'Unknown Manufacturer';
  
  const { purpose, warnings, dosage, pregnancy, pediatric, geriatric, contraindications, adverseReactions } = drugData.translated;

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
        <div>
          <Link to="/search" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1 rtl:ml-1 rtl:mr-0 rtl:rotate-180" />
            {t('details.back')}
          </Link>
          <div className="flex items-center space-x-3 rtl:space-x-reverse mb-2">
            <h1 className="text-3xl md:text-5xl font-bold">{searchName}</h1>
            <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold rounded-full">{t('details.verified')}</span>
          </div>
          <p className="text-xl text-gray-500 dark:text-gray-400 flex items-center">
            <Factory className="h-5 w-5 mr-2 rtl:ml-2 rtl:mr-0" />
            {genericName}
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
                <dd className="font-medium text-amber-500 truncate max-w-[50%]" title={pregnancy}>View Label</dd>
              </div>
              <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                <dt className="text-gray-500">{t('details.rx_otc')}</dt>
                <dd className="font-medium">{drugData.original.openfda?.product_type?.[0] || 'Unknown'}</dd>
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
