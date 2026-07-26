import React, { useState } from 'react';
import { Stethoscope, AlertTriangle, User, Calendar, ShieldAlert, CheckCircle2, Loader2, HeartPulse, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { fetchEmergencyConsult } from '../services/api';

export default function EmergencyConsultant() {
  const { t, i18n } = useTranslation();
  const [ageGroup, setAgeGroup] = useState('Adult / بالغ (18-60 سنة)');
  const [gender, setGender] = useState('Male / ذكر');
  const [condition, setCondition] = useState('None / لا توجد أمراض مزمنة أو حمل');
  const [symptomCategory, setSymptomCategory] = useState('');
  const [symptom, setSymptom] = useState('');
  const [loading, setLoading] = useState(false);
  const [consultation, setConsultation] = useState<any>(null);
  const [error, setError] = useState('');

  const handleCategoryChange = (val: string) => {
    setSymptomCategory(val);
    if (val && val !== 'other') {
      setSymptom(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const querySymptom = symptom.trim() || symptomCategory;
    if (!querySymptom) return;

    setLoading(true);
    setError('');
    setConsultation(null);

    try {
      const data = await fetchEmergencyConsult(ageGroup, gender, condition, querySymptom, i18n.language);
      if (data) {
        setConsultation(data);
      } else {
        setError(t('emergency.error') || 'لم نتمكن من تحليل العرض، يرجى كتابة تفاصيل أكثر عن المشكلة.');
      }
    } catch (err) {
      setError(t('emergency.failed') || 'حدث خطأ أثناء التواصل مع الاستشارة الذكية، يرجى إعادة التحديث.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in">
      {/* Hero Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold mb-4 border border-red-200 dark:border-red-800">
          <HeartPulse className="h-4 w-4 animate-pulse" />
          {t('emergency.badge') || 'استشارة الطوارئ والأعراض الطارئة'}
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-3">
          {t('emergency.title') || 'مستشار الطوارئ واقتراح الأدوية'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
          {t('emergency.subtitle') || 'أدخل بيانات الحالة والأعراض التي تشتكي منها، وسيقوم النظام الذكي باقتراح أنسب وأأمن دواء طوارئ متاح طبقاً للسن والنوع والحالة الصحية.'}
        </p>
      </div>

      {/* Mandatory Clinical Disclaimer Banner */}
      <div className="mb-8 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs md:text-sm flex items-start gap-3 shadow-sm">
        <ShieldAlert className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-bold text-amber-700 dark:text-amber-300 block mb-1">⚕️ تنبيه طبي واستشاري هام:</strong>
          {t('emergency.disclaimer_text') || 'هذه الخدمة مخصصة للاسترشاد الأولي وحالات الطوارئ والإسعافات الأولية البسيطة فقط. لا تعتبر هذه الاستشارة بديلاً عن الفحص الطبي المباشر أو زيارة المستشفى في الحالات الحادة!'}
        </div>
      </div>

      {/* Interactive Form */}
      <div className="glass-panel p-6 md:p-8 shadow-xl border border-gray-100 dark:border-gray-800 mb-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Age Group Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary-500" />
                {t('emergency.age_label') || 'الفئة العمرية والسن:'}
              </label>
              <select
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Infant / رضيع (أقل من سنتين)">رضيع (أقل من سنتين)</option>
                <option value="Child / طفل (2-12 سنة)">طفل (2-12 سنة)</option>
                <option value="Teenager / ناشئ (12-18 سنة)">ناشئ (12-18 سنة)</option>
                <option value="Adult / بالغ (18-60 سنة)">بالغ (18-60 سنة)</option>
                <option value="Elderly / مسن (فوق 60 سنة)">مسن (فوق 60 سنة)</option>
              </select>
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                <User className="h-4 w-4 text-primary-500" />
                {t('emergency.gender_label') || 'النوع:'}
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Male / ذكر">ذكر</option>
                <option value="Female / أنثى">أنثى</option>
              </select>
            </div>

            {/* Health / Pregnancy Condition */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                <Info className="h-4 w-4 text-primary-500" />
                {t('emergency.condition_label') || 'حالات خاصة / حمل / أمراض:'}
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="None / لا توجد">لا توجد أمراض مزمنة</option>
                <option value="Pregnant / حامل">سيدة حامل</option>
                <option value="Nursing / مرضع">سيدة مرضع</option>
                <option value="Hypertension / ضغط دم مرتفع">مريض ضغط مرتفع</option>
                <option value="Diabetes / سكر">مريض سكر</option>
                <option value="Kidney / Liver / قصور كبد أو كلى">قصور في الكبد أو الكلى</option>
              </select>
            </div>
          </div>

          {/* Structured Symptom Category Selection */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <Stethoscope className="h-4 w-4 text-red-500" />
              اختيار العرض الرئيسي (حدد العرض للحصول على الدواء الدقيق 100%):
            </label>
            <select
              value={symptomCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full p-3.5 bg-white dark:bg-gray-800 border-2 border-primary-500/40 dark:border-primary-500/60 rounded-xl text-sm font-bold text-gray-900 dark:text-white shadow-md outline-none focus:border-primary-600 focus:ring-2 focus:ring-primary-500/30 transition-all cursor-pointer"
            >
              <option value="" className="text-gray-500 bg-white dark:bg-gray-800">-- اضغط هنا لاختيار العرض الطارئ من القائمة الشاملة --</option>
              <optgroup label="المخ والأعصاب والرأس">
                <option value="صداع نصفي شديد وزغللة بالرأس">صداع / صداع نصفي / ألم بالرأس</option>
                <option value="دوخة ودوار وطنين بالأذن وعدم اتزان">دوخة / دوار / طنين بالأذن / عدم اتزان</option>
              </optgroup>
              <optgroup label="الجهاز الهضمي والمعدة">
                <option value="إسهال ومغص ونزلة معوية">إسهال / مطهر معوي / نزلة معوية</option>
                <option value="إمساك وصعوبة بالإخراج">إمساك / ملين للأمعاء</option>
                <option value="ترجيع وقيء وغثيان">ترجيع / قيء / غثيان</option>
                <option value="حموضة وحرقان معدة وارتجاع مريء">حموضة / حرقان بالمعدة / ارتجاع مريء</option>
                <option value="مغص قولون عصبي وانتفاخ وتطبل بطن">مغص قولون عصبي / تقلصات وانتفاخ</option>
                <option value="بواسير وشرخ وشق شرجي وألم عند الإخراج">بواسير / شرخ شرجي / ألم إخراج</option>
              </optgroup>
              <optgroup label="الجهاز التنفسي والأنف والحلق">
                <option value="برد وأنفلونزا وسخونية ورشح">برد / أنفلونزا / سخونية / زكام</option>
                <option value="كحة ناشفة وسعال جاف">كحة ناشفة / سعال جاف بدون بلغم</option>
                <option value="كحة ببلغم وطرد بلغم">كحة ببلغم / مذيب وطارد للبلغم</option>
                <option value="احتقان الزور وألم بالحلق واللوزتين">احتقان الزور / التهاب الحلق واللوز</option>
                <option value="جيوب أنفية وانسداد الأنف والاحتقان">جيوب أنفية / انسداد الأنف</option>
                <option value="أزمة ربو وضيق تنفس وكتمة">أزمة ربو وحساسية صدر / ضيق تنفس</option>
                <option value="ألم الأذن والتهاب الأذن الوسطى">ألم بالأذن / التهاب أذن وسطى</option>
              </optgroup>
              <optgroup label="الأسنان والفم">
                <option value="ألم بالأسنان وضرس وخراج لثة">ألم بالأسنان / ضرس / التهاب لثة</option>
                <option value="قروح الفم واللسان وفطريات الفم">قروح الفم واللسان / آلام الفم</option>
              </optgroup>
              <optgroup label="الكلى والمسالك البولية">
                <option value="مغص كلي وأملاح وحرقان بالبول">مغص كلي / أملاح يوريك وأكسالات</option>
                <option value="حرقان بول والتهاب مسالك بولية">حرقان البول / التهاب المسالك البولية</option>
              </optgroup>
              <optgroup label="الجلدية والحروق والجروح">
                <option value="حروق جلدية وجروح وسحجات">حروق جلدية / جروح وتسريع التئام</option>
                <option value="حساسية جلدية وهرش وتسلخات">حساسية جلدية / هرش وتسلخات</option>
                <option value="فطريات الجلد وبين الأصابع">فطريات بين الأصابع / قدم رياضية</option>
              </optgroup>
              <optgroup label="العظام والمفاصل والعضلات">
                <option value="آلام بالظهر والمفاصل وشد عضلي">آلام بالظهر والفقرات / مفاصل / بسط عضلات</option>
              </optgroup>
              <optgroup label="العيون">
                <option value="حرقان بالعين وقطرة حساسيه وعين حمرا">التهاب بالعين / احمرار وقطرة عين</option>
              </optgroup>
              <optgroup label="طوارئ القلب والسكر والضغط">
                <option value="ارتفاع شديد في ضغط الدم">ارتفاع ضغط الدم (طوارئ)</option>
                <option value="هبوط ضغط وانخفاض الضغط والدوخة">هبوط ضغط الدم والدوخة</option>
                <option value="هبوط سكر وانخفاض السكر">هبوط أو انخفاض السكر (طوارئ)</option>
              </optgroup>
              <optgroup label="صحة المرأة والحمل">
                <option value="آلام الدورة الشهرية والحيض">تقلصات وآلام الدورة الشهرية</option>
                <option value="ترجيع الحمل وغثيان الصباح">ترجيع الحمل وغثيان الصباح للحامل</option>
              </optgroup>
              <option value="other">عرض آخر (اكتب تفاصيله بالأسفل)</option>
            </select>
          </div>

          {/* Symptom Complaint Text Area */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
              <Info className="h-4 w-4 text-primary-500" />
              تفاصيل إضافية عن العرض المشتكى منه (اختياري):
            </label>
            <textarea
              rows={2}
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              placeholder="يمكنك إضافة تفاصيل أكثر هنا (مثال: مستمر من يومين، أو مصحوب بترجيع...)"
              className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading || (!symptom.trim() && !symptomCategory)}
            className="w-full py-4 px-6 bg-gradient-to-r from-red-600 via-red-500 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white font-bold text-base rounded-xl shadow-lg hover:shadow-red-500/25 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>جاري تحليل الحالة واقتراح الدواء المناسب...</span>
              </>
            ) : (
              <>
                <Stethoscope className="h-5 w-5" />
                <span>عرض الدواء والدعم الاستشاري الدقيق</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Loader2 className="h-12 w-12 text-red-500 animate-spin mb-4" />
          <p className="text-gray-500 text-sm">{t('emergency.loading') || 'جاري مطابقة الأعراض مع القاعدة الكلينيكية واختيار العلاج الآمن...'}</p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-600 text-center text-sm mb-8">
          {error}
        </div>
      )}

      {/* Consultation Results */}
      {consultation && (
        <div className="space-y-6 animate-fade-in">
          {/* Assessment Summary */}
          {consultation.assessment && (
            <div className="glass-panel p-6 border-l-4 border-l-blue-500 rtl:border-r-4 rtl:border-r-blue-500 rtl:border-l-0">
              <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">📋 التقييم الإكلينيكي المبدئي للحالة:</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-xl">
                {consultation.assessment}
              </p>
            </div>
          )}

          {/* Special Maternity Block Banner */}
          {consultation.isBlockedForMaternity && (
            <div className="p-6 rounded-3xl bg-red-500/10 border-2 border-red-500 text-red-700 dark:text-red-300 shadow-xl space-y-3">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-8 w-8 text-red-600 animate-bounce shrink-0" />
                <div>
                  <h3 className="text-xl font-black text-red-600 dark:text-red-400">
                    🚫 حظر وصف أدوية التلقائي (حالة سيدة حامل / مرضع)
                  </h3>
                  <p className="text-xs font-bold text-red-500 dark:text-red-400">
                    لا يمكن وصف أو صرف أي دواء آلياً لهذه الحالة دون فحص واستشارة طبيب النساء والتوليد المختص.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Primary High-Precision Recommended Medication */}
          {!consultation.isBlockedForMaternity && (
            <div>
              <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                البروتوكول الرئيسي والأدوية المقترحة للطوارئ (أعلى دقة):
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
              {consultation.recommendedOTC && consultation.recommendedOTC.map((item: any, idx: number) => (
                <div key={idx} className="glass-panel p-5 border-2 border-emerald-500/30 dark:border-emerald-500/50 shadow-md hover:shadow-lg transition-all rounded-2xl">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-black text-xl text-gray-900 dark:text-white">{item.arabicName || item.name}</h4>
                      <span className="inline-flex items-center gap-1 mt-1 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/60">
                        🇺🇸 المكافئ الأمريكي: {item.usEquivalent || item.name?.replace(/مصري|مصر/g, '') || "US Brand Equivalent"}
                      </span>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 rounded-lg shrink-0">
                      دواء طوارئ رئيسي
                    </span>
                  </div>
                  <p className="text-xs font-mono text-gray-500 dark:text-gray-400 mb-3 dir-ltr text-right rtl:text-left">
                    🧪 المادة الفعالة: {item.activeIngredient}
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                      <strong className="text-primary-600 dark:text-primary-400 block mb-0.5">📌 الجرعة الموصى بها للسن:</strong>
                      <span className="text-gray-700 dark:text-gray-300 font-semibold">{item.dosage}</span>
                    </div>
                    <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg">
                      <strong className="text-emerald-700 dark:text-emerald-300 block mb-0.5">💡 سبب الاختيار والدواعي:</strong>
                      <span className="text-gray-700 dark:text-gray-300">{item.reason}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* All Registered Egyptian Alternatives & Substitutes (15,000 Master Drugs DB) */}
          {consultation.allEgyptianAlternatives && consultation.allEgyptianAlternatives.length > 0 && (
            <div className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg md:text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="text-xl">🇪🇬</span>
                  بدائل الأدوية المتاحة بالصيدليات المصرية (موسوعة الـ 15 ألف دواء):
                </h3>
                <span className="text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-700">
                  {consultation.allEgyptianAlternatives.length} بديل مصري متوفر
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                💡 في حالة عدم توفر الدواء الرئيسي في الصيدلية، يمكنك تناول أي بديل من هذه الأدوية المسجلة بوزارة الصحة المصرية لنفس الحالة:
              </p>
              
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {consultation.allEgyptianAlternatives.map((alt: any, idx: number) => (
                  <div key={idx} className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 shadow-sm transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-1.5 gap-2">
                        <h5 className="font-black text-sm text-gray-900 dark:text-white leading-tight">{alt.arabicName}</h5>
                        {alt.price_egp > 0 && (
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 shrink-0">
                            {alt.price_egp} ج.م
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 font-mono mb-2 dir-ltr text-right rtl:text-left truncate">
                        {alt.name}
                      </p>
                      
                      <div className="text-[11px] text-gray-700 dark:text-gray-300 space-y-1.5 border-t border-gray-100 dark:border-gray-700/60 pt-2">
                        <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400 font-semibold">
                          <span>🧪 المادة:</span>
                          <span className="truncate">{alt.activeIngredient}</span>
                        </div>
                        {alt.dosageForm && (
                          <div className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <span>💊 الشكل الدوائي:</span>
                            <span className="font-semibold text-gray-800 dark:text-gray-200">{alt.dosageForm}</span>
                          </div>
                        )}
                        {alt.pharmaClass && (
                          <div className="text-gray-500 dark:text-gray-400 text-[10px] bg-gray-50 dark:bg-gray-900/40 p-1.5 rounded border border-gray-100 dark:border-gray-800">
                            🧬 الفئة: {alt.pharmaClass}
                          </div>
                        )}
                        {alt.indication && (
                          <div className="text-emerald-700 dark:text-emerald-400 text-[10px]">
                            🎯 الاستعمال: {alt.indication}
                          </div>
                        )}
                      </div>
                    </div>

                    {alt.company && (
                      <div className="mt-2 text-[10px] text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-1 flex justify-between">
                        <span>🏭 {alt.company}</span>
                        <span className="text-emerald-600 font-semibold">مسجل بمصر 🇪🇬</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Red Flags Alert */}
          {consultation.emergencyRedFlags && consultation.emergencyRedFlags.length > 0 && (
            <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-900 dark:text-red-200 text-xs md:text-sm">
              <h4 className="font-bold text-base flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
                <AlertTriangle className="h-5 w-5" />
                علامات خطر تحذيرية تستدعي توجه للمستشفى فوراً:
              </h4>
              <ul className="list-disc list-inside space-y-1.5 text-gray-700 dark:text-gray-300">
                {consultation.emergencyRedFlags.map((flag: string, idx: number) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
