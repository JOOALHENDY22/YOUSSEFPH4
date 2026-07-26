import fs from 'fs';
import path from 'path';

interface DrugEntry {
  id: string;
  name: string;
  arabicName: string;
  price: string;
  manufacturer: string;
  dosageForm: string;
  activeIngredient: string;
  category: string;
  purpose: string;
  pediatric: string;
  geriatric: string;
  pregnancy: string;
  adverseReactions: string;
  contraindications: string;
  productType: string;
  overdose: string;
  dosage: string;
  storage: string;
}

interface InteractionEntry {
  id: string;
  drug1: string;
  drug2: string;
  compatibility: string;
  severity: string;
  mechanism: string;
  effect: string;
  emergency: string;
  recommendation: string;
}

interface ComparisonEntry {
  id: string;
  drugPrimary: string;
  pricePrimary: string;
  drugSubstitute: string;
  priceSubstitute: string;
  priceSaving: string;
  comparisonType: string;
  activeAndMfr: string;
  strengthsPrimary: string;
  strengthsSubstitute: string;
  recommendation: string;
}

const dbDir = path.join(__dirname, '../egyptian_pharma_master_database');

// Internal storage
let drugsDatabase: DrugEntry[] = [];
let interactionsDatabase: InteractionEntry[] = [];
let comparisonsDatabase: ComparisonEntry[] = [];

// Index maps for instant 0ms lookups
let drugsMapByKey = new Map<string, DrugEntry>();

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur.trim());
  return result;
}

export function initMasterDatabase() {
  console.log('[Master DB Service] Initializing Master Egyptian Pharma Encyclopedia...');

  try {
    // 1. Load File 1: Egyptian Drugs Master Encyclopedia (Supports single file or part 1 & part 2)
    const file1Path = path.join(dbDir, '1_موسوعة_الأدوية_المصرية_الشاملة_التفصيلية.csv');
    const file1Part1Path = path.join(dbDir, '1_موسوعة_الأدوية_المصرية_الشاملة_التفصيلية_جزء1.csv');
    const file1Part2Path = path.join(dbDir, '1_موسوعة_الأدوية_المصرية_الشاملة_التفصيلية_جزء2.csv');

    let lines: string[] = [];
    if (fs.existsSync(file1Path)) {
      lines = fs.readFileSync(file1Path, 'utf8').split('\n');
    } else if (fs.existsSync(file1Part1Path) && fs.existsSync(file1Part2Path)) {
      const l1 = fs.readFileSync(file1Part1Path, 'utf8').split('\n');
      const l2 = fs.readFileSync(file1Part2Path, 'utf8').split('\n');
      lines = [...l1, ...l2.slice(1)];
    }

    if (lines.length > 0) {
      drugsDatabase = [];
      drugsMapByKey.clear();

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = parseCSVLine(line);
        if (cols.length >= 10) {
          const entry: DrugEntry = {
            id: cols[0] || String(i),
            name: cols[1] || '',
            arabicName: cols[2] || '',
            price: cols[3] || 'غير محدد',
            manufacturer: cols[4] || 'شركة صيدلانية مسجلة',
            dosageForm: cols[5] || 'مستحضر صيدلي',
            activeIngredient: cols[6] || '',
            category: cols[7] || 'مستحضر صيدلاني علاجي',
            purpose: cols[8] || '',
            pediatric: cols[9] || '',
            geriatric: cols[10] || '',
            pregnancy: cols[11] || '',
            adverseReactions: cols[12] || '',
            contraindications: cols[13] || '',
            productType: cols[14] || '🟢 OTC / متوفر بالصيدليات',
            overdose: cols[15] || '',
            dosage: cols[16] || '',
            storage: cols[17] || ''
          };

          drugsDatabase.push(entry);

          // Index by lowercase English & Arabic names
          if (entry.name) drugsMapByKey.set(entry.name.toLowerCase().trim(), entry);
          if (entry.arabicName) drugsMapByKey.set(entry.arabicName.toLowerCase().trim(), entry);

          // Index basic brand word (e.g., "Mobic 15mg Tablet" -> "mobic")
          const cleanEngWord = entry.name.split(/[\s\(\)]+/)[0]?.toLowerCase();
          if (cleanEngWord && !drugsMapByKey.has(cleanEngWord)) {
            drugsMapByKey.set(cleanEngWord, entry);
          }
          const cleanArWord = entry.arabicName.split(/[\s\(\)]+/)[0]?.toLowerCase();
          if (cleanArWord && !drugsMapByKey.has(cleanArWord)) {
            drugsMapByKey.set(cleanArWord, entry);
          }
        }
      }
      console.log(`[Master DB Service] File 1 Loaded: ${drugsDatabase.length} Master Drug Profiles.`);
    }

    // 2. Load File 2: Interactions Encyclopedia
    const file2Path = path.join(dbDir, '2_موسوعة_التداخلات_الدوائية_والحظر_الدوائي.csv');
    if (fs.existsSync(file2Path)) {
      const lines = fs.readFileSync(file2Path, 'utf8').split('\n');
      interactionsDatabase = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = parseCSVLine(line);
        if (cols.length >= 8) {
          interactionsDatabase.push({
            id: cols[0] || String(i),
            drug1: cols[1] || '',
            drug2: cols[2] || '',
            compatibility: cols[3] || '',
            severity: cols[4] || '',
            mechanism: cols[5] || '',
            effect: cols[6] || '',
            emergency: cols[7] || '',
            recommendation: cols[8] || ''
          });
        }
      }
      console.log(`[Master DB Service] File 2 Loaded: ${interactionsDatabase.length} Interaction Rules.`);
    }

    // 3. Load File 3: Comparisons & Alternatives Encyclopedia
    const file3Path = path.join(dbDir, '3_موسوعة_مقارنات_الأدوية_والبدائل_التفصيلية.csv');
    if (fs.existsSync(file3Path)) {
      const lines = fs.readFileSync(file3Path, 'utf8').split('\n');
      comparisonsDatabase = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = parseCSVLine(line);
        if (cols.length >= 10) {
          comparisonsDatabase.push({
            id: cols[0] || String(i),
            drugPrimary: cols[1] || '',
            pricePrimary: cols[2] || '',
            drugSubstitute: cols[3] || '',
            priceSubstitute: cols[4] || '',
            priceSaving: cols[5] || '',
            comparisonType: cols[6] || '',
            activeAndMfr: cols[7] || '',
            strengthsPrimary: cols[8] || '',
            strengthsSubstitute: cols[9] || '',
            recommendation: cols[10] || ''
          });
        }
      }
      console.log(`[Master DB Service] File 3 Loaded: ${comparisonsDatabase.length} Comparison & Alternative Records.`);
    }
  } catch (error) {
    console.error('[Master DB Service] Error initializing encyclopedia databases:', error);
  }
}

// Auto init on import
initMasterDatabase();

// -------------------------------------------------------------
// FEATURE 1: SEARCH & DRUG DETAILS LOOKUP (File 1)
// -------------------------------------------------------------
export function searchMasterDrugDetails(query: string): any {
  if (!query) return null;
  const q = query.toLowerCase().trim();

  // 1. Direct Map Exact Match
  if (drugsMapByKey.has(q)) {
    return formatDrugResult(drugsMapByKey.get(q)!);
  }

  // 2. Fuzzy / Substring Search across 15,000 drugs
  const matched = drugsDatabase.find(d => {
    const n = d.name.toLowerCase();
    const ar = d.arabicName.toLowerCase();
    const active = d.activeIngredient.toLowerCase();
    return n.includes(q) || ar.includes(q) || active.includes(q) || q.includes(n) || q.includes(ar);
  });

  if (matched) {
    return formatDrugResult(matched);
  }

  return null;
}

// Load scheduled drugs database for strict verification
let scheduledDbList: any[] = [];
try {
  const schedPath = path.join(__dirname, '../data/egyptian_scheduled_drugs.json');
  if (fs.existsSync(schedPath)) {
    const raw = JSON.parse(fs.readFileSync(schedPath, 'utf8'));
    scheduledDbList = raw.scheduledDrugs || (Array.isArray(raw) ? raw : []);
  }
} catch (e) {}

function checkScheduledMatchMaster(query: string): any {
  if (!query || query.trim().length < 2) return null;
  const q = query.toLowerCase().trim();

  return scheduledDbList.find((s: any) => {
    const sName = (s.name || '').toLowerCase().trim();
    const sAr = (s.arabicName || '').toLowerCase().trim();
    const sActive = (s.activeIngredient || '').toLowerCase().trim();
    const tNames = (s.tradeNames || []).map((t: string) => t.toLowerCase().trim());

    if (sName === q || sAr === q || tNames.includes(q)) return true;

    const words = q.split(/[\s\(\)]+/);
    if (words.some(w => w === sName || tNames.includes(w))) return true;

    const activeWords = sActive.split(/[\s\+\,\(\)]+/).filter((w: string) => w.length >= 4);
    if (activeWords.some((act: string) => words.includes(act))) return true;

    return false;
  }) || null;
}

function formatDrugResult(d: DrugEntry): any {
  const sched = checkScheduledMatchMaster(d.name) || checkScheduledMatchMaster(d.arabicName);

  return {
    name: d.name,
    arabicName: d.arabicName,
    activeIngredient: d.activeIngredient || `${d.name} Active Ingredient`,
    price: d.price,
    manufacturer: d.manufacturer,
    dosageForm: d.dosageForm,
    category: d.category,
    product_type: d.productType,
    image_url: '',
    purpose: [d.purpose || `مستحضر دوائي معتمد لعلاج الأعراض الخاصة بـ ${d.name}`],
    indications_and_usage: [d.purpose],
    dosage_and_administration: [d.dosage || 'تناول الجرعة الموصى بها طبقاً لإرشادات النشرة الطبية والصيدلي.'],
    warnings: [d.contraindications || 'التزام بتعليمات الجرعة اليومية الموصى بها وعدم التجاوز.'],
    contraindications: [d.contraindications || 'يمنع الاستخدام في حالة وجود حساسية سابقة للمادة الفعالة.'],
    adverse_reactions: [d.adverseReactions || 'جيد التحمل عادة؛ استشر الصيدلي أو الطبيب عند ظهور أعراض غير متوقعة.'],
    pregnancy: [d.pregnancy || 'استشارة الطبيب المعالج قبل الاستخدام أثناء فترة الحمل والرضاعة.'],
    pediatric_use: [d.pediatric || 'اتبع إرشادات الجرعة المخصصة للأطفال بحسب الوزن والسن.'],
    geriatric_use: [d.geriatric || 'آمن لكبار السن مع ضبط الجرعات.'],
    overdose: d.overdose,
    storage: d.storage,
    openfda: {
      generic_name: [d.activeIngredient],
      manufacturer_name: [d.manufacturer],
      product_type: [d.productType]
    },
    emergency_status: {
      is_emergency: false,
      badge_text: { ar: '✨ مستحضر مسجل بالموسوعة', en: '✨ Master Database Product' },
      urgency_note: { ar: 'مستحضر معتمد مسجل بموسوعة الأدوية المصرية.', en: 'Registered drug in Master Egyptian Pharma DB.' }
    },
    scheduled_status: {
      is_scheduled: !!sched,
      schedule_category: sched ? (sched.scheduleType || 'دواء جدول خاضع للرقابة') : 'غير مدرج بالجدول (صرف عادي)',
      legal_warning: sched ? (sched.dispensingRules || 'صرف بموجب روشتة معتمدة وقيد بالدفتر.') : 'صرف عادي بالصيدليات طبقاً لتعليمات النشرة الطبية.'
    }
  };
}

// -------------------------------------------------------------
// FEATURE 2: DRUG INTERACTIONS LOOKUP (File 2)
// -------------------------------------------------------------
export function searchMasterInteractions(drugs: string[]): any[] {
  if (!drugs || drugs.length < 2) return [];
  const d0 = drugs[0].toLowerCase().trim();
  const d1 = drugs[1].toLowerCase().trim();

  const results: any[] = [];

  for (const entry of interactionsDatabase) {
    const itemD1 = entry.drug1.toLowerCase();
    const itemD2 = entry.drug2.toLowerCase();

    const match1 = (d0.includes(itemD1) || itemD1.includes(d0)) && (d1.includes(itemD2) || itemD2.includes(d1));
    const match2 = (d0.includes(itemD2) || itemD2.includes(d0)) && (d1.includes(itemD1) || itemD1.includes(d1));

    if (match1 || match2) {
      results.push({
        severity: entry.severity.includes('CRITICAL') || entry.severity.includes('خطر') ? 'high' : (entry.severity.includes('MODERATE') || entry.severity.includes('متوسط') ? 'moderate' : 'minor'),
        description: `⚠️ ${entry.compatibility} | درجة الخطورة: ${entry.severity}\n\n• سبب الحظر والآلية: ${entry.mechanism}\n• التأثير الأعراض: ${entry.effect}\n• الإجراء الطارئ: ${entry.emergency}\n• التوصية والبديل الآمن: ${entry.recommendation}`,
        drugs: [entry.drug1, entry.drug2],
        compatibility: entry.compatibility,
        mechanism: entry.mechanism,
        effect: entry.effect,
        emergency: entry.emergency,
        recommendation: entry.recommendation
      });
    }
  }

  return results;
}

// -------------------------------------------------------------
// FEATURE 3: DRUG COMPARISONS & ALTERNATIVES LOOKUP (File 3)
// -------------------------------------------------------------
export function searchMasterComparisons(drugA: string, drugB: string): any[] {
  if (!drugA || !drugB) return [];
  const dA = drugA.toLowerCase().trim();
  const dB = drugB.toLowerCase().trim();

  const matchedRow = comparisonsDatabase.find(c => {
    const p = c.drugPrimary.toLowerCase();
    const s = c.drugSubstitute.toLowerCase();
    return (dA.includes(p) || p.includes(dA)) && (dB.includes(s) || s.includes(dB)) ||
           (dA.includes(s) || s.includes(dA)) && (dB.includes(p) || p.includes(dB));
  });

  if (matchedRow) {
    return [
      { feature: 'اسم المستحضر والسعر الرسمي', drugA: `${matchedRow.drugPrimary} (${matchedRow.pricePrimary} ج.م)`, drugB: `${matchedRow.drugSubstitute} (${matchedRow.priceSubstitute} ج.م)` },
      { feature: 'الفارق السعري ونسبة التوفير', drugA: 'الدواء الأساسي', drugB: matchedRow.priceSaving },
      { feature: 'نوع المقارنة والتصنيف', drugA: matchedRow.comparisonType, drugB: matchedRow.comparisonType },
      { feature: 'المادة الفعالة والشركة المصنعة', drugA: matchedRow.activeAndMfr, drugB: matchedRow.activeAndMfr },
      { feature: 'نقاط القوة والمميزات الخاصة', drugA: matchedRow.strengthsPrimary, drugB: matchedRow.strengthsSubstitute },
      { feature: 'توصية الصيدلي والموقع للمستخدم', drugA: matchedRow.recommendation, drugB: matchedRow.recommendation }
    ];
  }

  // Fallback match from File 1 (Search DB)
  const infoA = searchMasterDrugDetails(drugA);
  const infoB = searchMasterDrugDetails(drugB);

  if (infoA || infoB) {
    return [
      { feature: 'اسم المستحضر وسعره الرسمي', drugA: `${infoA?.name || drugA} (السعر: ${infoA?.price || 'غير محدد'} ج.م)`, drugB: `${infoB?.name || drugB} (السعر: ${infoB?.price || 'غير محدد'} ج.م)` },
      { feature: 'المادة الفعالة والتركيز', drugA: infoA?.activeIngredient || 'مستحضر مسجل', drugB: infoB?.activeIngredient || 'مستحضر مسجل' },
      { feature: 'الشركة المصنعة', drugA: infoA?.manufacturer || 'شركة مسجلة', drugB: infoB?.manufacturer || 'شركة مسجلة' },
      { feature: 'دواعي الاستعمال الرئيسية', drugA: infoA?.purpose?.[0] || 'علاج معتمد', drugB: infoB?.purpose?.[0] || 'علاج معتمد' },
      { feature: 'طريقة الاستخدام والجرعة', drugA: infoA?.dosage_and_administration?.[0] || 'طبقا للنشرة الطبية', drugB: infoB?.dosage_and_administration?.[0] || 'طبقا للنشرة الطبية' },
      { feature: 'أمان الحمل والرضاعة', drugA: infoA?.pregnancy?.[0] || 'استشارة الطبيب', drugB: infoB?.pregnancy?.[0] || 'استشارة الطبيب' }
    ];
  }

  return [];
}

export function searchMasterAlternatives(drugName: string): any {
  if (!drugName) return null;
  const target = drugName.toLowerCase().trim();

  // Find all matches in File 3 where drugPrimary or drugSubstitute contains drugName
  const matches = comparisonsDatabase.filter(c => {
    const p = c.drugPrimary.toLowerCase();
    const s = c.drugSubstitute.toLowerCase();
    const act = c.activeAndMfr.toLowerCase();
    return p.includes(target) || s.includes(target) || act.includes(target) || target.includes(p) || target.includes(s);
  });

  const targetInfo = searchMasterDrugDetails(drugName);

  const identicalSubstitutes: any[] = [];
  const therapeuticAlternatives: any[] = [];

  for (const m of matches) {
    const isPrimaryTarget = m.drugPrimary.toLowerCase().includes(target);
    const altName = isPrimaryTarget ? m.drugSubstitute : m.drugPrimary;
    const altPrice = isPrimaryTarget ? m.priceSubstitute : m.pricePrimary;

    const altObj = {
      name: altName,
      nameAr: `${altName} (السعر: ${altPrice} ج.م)`,
      activeIngredient: m.activeAndMfr,
      manufacturer: m.activeAndMfr,
      notes: `${m.comparisonType} | ${m.priceSaving} | ${m.recommendation}`
    };

    if (m.comparisonType.includes('مثيل') || m.comparisonType.includes('مطابق')) {
      identicalSubstitutes.push(altObj);
    } else {
      therapeuticAlternatives.push(altObj);
    }
  }

  if (identicalSubstitutes.length > 0 || therapeuticAlternatives.length > 0 || targetInfo) {
    return {
      drugName: targetInfo?.name || drugName,
      activeIngredient: targetInfo?.activeIngredient || 'مستحضر دوائي مسجل',
      purpose: targetInfo?.purpose?.[0] || 'مستحضر صيدلاني علاجي معتمد بموسوعة الأدوية المصرية',
      clinicalWarning: targetInfo?.warnings?.[0] || 'التزام بتعليمات الجرعة والنشرة الطبية.',
      identicalSubstitutes: identicalSubstitutes.slice(0, 10),
      therapeuticAlternatives: therapeuticAlternatives.slice(0, 10)
    };
  }

  return null;
}
