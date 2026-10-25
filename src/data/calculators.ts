// Single source of truth for calculator pages: routes, metadata, categories, search terms and related links.
export type CategoryKey = 'money' | 'shopping' | 'health-age' | 'dates';

export type CalculatorMeta = {
  slug: string;
  question: string; // H1, and how people actually ask
  short: string; // short name for chips and lists
  blurb: string; // one short line for the editorial index
  tone: string; // tile colour
  sample: string; // example result shown on tiles
  seoTitle: string;
  description: string;
  categories: CategoryKey[];
  terms: string[]; // search words that really describe the page
  related: string[]; // 4 slugs
  updated?: string; // last content change (sitemap lastmod)
};

import { toHijri } from '../lib/calc/hijri';

// Current Hijri year at build time (rebuilt on every deploy).
export const HIJRI_YEAR_NOW = toHijri(new Date()).year;

export const CALCULATORS: CalculatorMeta[] = [
  {
    slug: 'end-of-service',
    question: 'كم مكافأة نهاية خدمتي؟',
    short: 'نهاية الخدمة',
    blurb: '21 يوماً ثم 30 يوماً عن كل سنة، وفق المادة 51',
    tone: '#0f6b52',
    sample: '49,194',
    seoTitle: 'حاسبة مكافأة نهاية الخدمة في الإمارات (القطاع الخاص)',
    description: 'احسب مكافأة نهاية الخدمة وفق المادة 51 من قانون العمل الإماراتي: 21 يوماً عن أول 5 سنوات و30 يوماً بعدها، مع الحد الأعلى وأيام الغياب.',
    categories: ['money'],
    terms: ['نهاية الخدمة', 'مكافأة', 'المكافأة', 'استقالة', 'قانون العمل', 'الإمارات', 'راتب أساسي', 'gratuity'],
    related: ['loan', 'zakat', 'percentage', 'vat'],
    updated: '2026-10-22',
  },
  {
    slug: 'vat',
    question: 'كم الضريبة على هذا المبلغ؟',
    short: 'ضريبة القيمة المضافة',
    blurb: 'أضف 5% إلى السعر أو استخرجها منه',
    tone: '#4b4bd6',
    sample: '50.00',
    seoTitle: 'حاسبة ضريبة القيمة المضافة 5%: إضافة واستخراج',
    description: 'أضف ضريبة القيمة المضافة إلى السعر أو استخرجها من سعر شامل، بنسبة 5% الإماراتية أو أي نسبة أخرى، مع شرح الفرق بين الطريقتين.',
    categories: ['money', 'shopping'],
    terms: ['ضريبة', 'الضريبة', 'القيمة المضافة', 'vat', '5%', 'شامل الضريبة', 'فاتورة'],
    related: ['discount', 'percentage', 'loan', 'zakat'],
    updated: '2026-10-22',
  },
  {
    slug: 'loan',
    question: 'كم قسطي الشهري؟',
    short: 'القسط الشهري',
    blurb: 'فائدة ثابتة أو متناقصة، مع جدول السداد',
    tone: '#cf3f20',
    sample: '2,280',
    seoTitle: 'حاسبة القرض والقسط الشهري: فائدة ثابتة أو متناقصة',
    description: 'احسب القسط الشهري لقرض شخصي أو تمويل سيارة أو عقار، وقارن بين الفائدة الثابتة والمتناقصة، مع جدول توزيع الأصل والفائدة.',
    categories: ['money'],
    terms: ['قرض', 'القرض', 'قسط', 'تمويل', 'سيارة', 'فائدة', 'بنك', 'عقار'],
    related: ['end-of-service', 'percentage', 'vat', 'zakat'],
    updated: '2026-10-22',
  },
  {
    slug: 'percentage',
    question: 'كم تساوي النسبة؟',
    short: 'النسبة المئوية',
    blurb: 'نسبة من رقم، ونسبة رقم لآخر، ونسبة التغير',
    tone: '#2f6fd6',
    sample: '100',
    seoTitle: 'حاسبة النسبة المئوية: نسبة من رقم، ونسبة رقم لآخر، ونسبة التغير',
    description: 'ثلاث حسبات للنسبة المئوية في صفحة واحدة: كم يساوي 40% من 250، وكم تمثل 40 من 250، ونسبة الزيادة أو النقص بين قيمتين.',
    categories: ['shopping'],
    terms: ['نسبة', 'النسبة', 'مئوية', 'بالمية', 'زيادة', 'نقص', 'تغير', 'percent'],
    related: ['discount', 'vat', 'loan', 'bmi'],
  },
  {
    slug: 'discount',
    question: 'كم السعر بعد الخصم؟',
    short: 'الخصم',
    blurb: 'السعر النهائي بعد خصم وخصم إضافي',
    tone: '#c2410c',
    sample: '251.37',
    seoTitle: 'حاسبة الخصم: السعر بعد التخفيض والخصم الإضافي',
    description: 'اعرف السعر النهائي بعد الخصم، وكم توفّر، ونسبة الخصم الفعلية عند وجود خصم إضافي فوق الخصم الأول.',
    categories: ['shopping'],
    terms: ['خصم', 'الخصم', 'تخفيض', 'تخفيضات', 'عروض', 'سعر', 'تسوق', 'sale'],
    related: ['percentage', 'vat', 'loan', 'age'],
    updated: '2026-10-22',
  },
  {
    slug: 'age',
    question: 'كم عمري بالضبط؟',
    short: 'العمر',
    blurb: 'بالسنة والشهر واليوم، والأيام لعيد ميلادك',
    tone: '#7a4bd6',
    sample: '31',
    seoTitle: 'حاسبة العمر بالسنوات والأشهر والأيام',
    description: 'احسب عمرك بالضبط بالسنوات والأشهر والأيام، وعدد الأيام التي عشتها، وكم بقي على عيد ميلادك القادم.',
    categories: ['health-age', 'dates'],
    terms: ['عمر', 'العمر', 'عمري', 'ميلاد', 'عيد ميلاد', 'تاريخ', 'سن'],
    related: ['hijri-age', 'bmi', 'days-between', 'percentage'],
    updated: '2026-10-25',
  },
  {
    slug: 'bmi',
    question: 'هل وزني طبيعي؟',
    short: 'مؤشر كتلة الجسم',
    blurb: 'مؤشر كتلة الجسم ونطاق الوزن لطولك',
    tone: '#c7305f',
    sample: '24.5',
    seoTitle: 'حاسبة مؤشر كتلة الجسم BMI للبالغين',
    description: 'احسب مؤشر كتلة الجسم من وزنك وطولك، واعرف تصنيفه للبالغين ونطاق الوزن الموافق للنطاق الطبيعي لطولك.',
    categories: ['health-age'],
    terms: ['وزن', 'الوزن', 'وزني', 'طول', 'bmi', 'كتلة الجسم', 'سمنة', 'رجيم', 'صحة'],
    related: ['age', 'percentage', 'discount', 'loan'],
  },
  {
    slug: 'zakat',
    question: 'كم زكاة مالي؟',
    short: 'زكاة المال',
    blurb: 'ربع العشر بعد خصم الديون وحساب النصاب',
    tone: '#a86600',
    sample: '1,875',
    seoTitle: 'حاسبة زكاة المال والنصاب بالذهب',
    description: 'احسب الزكاة المبدئية على النقد والمدخرات والاستثمارات، مع خصم الديون وتحديد النصاب بسعر غرام الذهب الذي تدخله.',
    categories: ['money'],
    terms: ['زكاة', 'الزكاة', 'نصاب', 'ذهب', 'مدخرات', 'ربع العشر', 'رمضان'],
    related: ['end-of-service', 'loan', 'percentage', 'vat'],
    updated: '2026-10-22',
  },
  {
    slug: 'hijri',
    question: 'كم التاريخ بالهجري؟',
    short: 'تحويل التاريخ',
    blurb: 'من الميلادي إلى الهجري وبالعكس، بتقويم أم القرى',
    tone: '#0e7490',
    sample: '1448',
    seoTitle: `التاريخ الهجري اليوم وتحويل التاريخ: السنة الهجرية ${HIJRI_YEAR_NOW}`,
    description: `كم التاريخ الهجري اليوم؟ السنة الهجرية الحالية ${HIJRI_YEAR_NOW} هـ. حوّل أي تاريخ من الميلادي إلى الهجري أو من الهجري إلى الميلادي بتقويم أم القرى، مع اسم اليوم وعدد أيام الشهر.`,
    categories: ['dates'],
    terms: ['السنة الهجرية', 'هجري', 'الهجري', 'ميلادي', 'تحويل التاريخ', 'تاريخ اليوم', 'أم القرى', 'التقويم', 'رمضان', 'hijri'],
    related: ['hijri-age', 'days-between', 'age', 'pregnancy'],
    updated: '2026-10-25',
  },
  {
    slug: 'hijri-age',
    question: 'كم عمري بالهجري؟',
    short: 'العمر بالهجري',
    blurb: 'عمرك بالسنين والأشهر الهجرية، وتاريخ ميلادك الهجري',
    tone: '#7c3aed',
    sample: '32',
    seoTitle: 'حساب العمر بالهجري: كم عمري بالتقويم الهجري؟',
    description: 'احسب عمرك بالسنوات والأشهر والأيام الهجرية بتقويم أم القرى، من تاريخ ميلادك الميلادي أو الهجري، مع تاريخ ميلادك بالهجري وموعد عيد ميلادك الهجري القادم.',
    categories: ['dates', 'health-age'],
    terms: ['العمر بالهجري', 'عمري بالهجري', 'حساب العمر', 'هجري', 'تاريخ الميلاد', 'ميلادي', 'أم القرى', 'عمر'],
    related: ['hijri', 'age', 'days-between', 'salary-day'],
    updated: '2026-10-25',
  },
  {
    slug: 'salary-day',
    question: 'كم باقي على الراتب؟',
    short: 'كم باقي على الراتب',
    blurb: 'عدّاد أيام الراتب، مع نقله إذا وافق عطلة',
    tone: '#15803d',
    sample: '2',
    seoTitle: 'كم باقي على الراتب؟ عدّاد موعد نزول الراتب',
    description: 'كم يوماً باقي على راتبك؟ اختر يوم الراتب (27 للقطاع الحكومي في السعودية مثلاً)، ونحسب الموعد القادم ونقدّمه إذا وافق الجمعة أو السبت، مع مواعيد الرواتب للأشهر الاثني عشر القادمة.',
    categories: ['money', 'dates'],
    terms: ['الراتب', 'راتب', 'كم باقي على الراتب', 'موعد الراتب', 'نزول الراتب', 'يوم 27', 'الرواتب', 'عداد'],
    related: ['gosi', 'end-of-service', 'days-between', 'loan'],
    updated: '2026-10-25',
  },
  {
    slug: 'days-between',
    question: 'كم يوماً بين تاريخين؟',
    short: 'الأيام بين تاريخين',
    blurb: 'الأيام والأسابيع والأشهر، وأيام العمل',
    tone: '#475569',
    sample: '365',
    seoTitle: 'حساب عدد الأيام بين تاريخين وأيام العمل',
    description: 'احسب عدد الأيام والأسابيع والأشهر بين تاريخين، وعدد أيام العمل بعطلة السبت والأحد أو الجمعة والسبت، مع خيار احتساب اليوم الأخير.',
    categories: ['dates'],
    terms: ['أيام', 'الأيام', 'بين تاريخين', 'عدد الأيام', 'مدة', 'أيام العمل', 'كم باقي', 'عد تنازلي'],
    related: ['hijri', 'age', 'end-of-service', 'pregnancy'],
    updated: '2026-10-21',
  },
  {
    slug: 'pregnancy',
    question: 'متى موعد ولادتي؟',
    short: 'موعد الولادة',
    blurb: 'موعد الولادة المتوقع وعمر الحمل بالأسابيع',
    tone: '#a21caf',
    sample: '280',
    seoTitle: 'حاسبة الحمل وموعد الولادة المتوقع بالأسابيع',
    description: 'احسبي موعد الولادة المتوقع من أول يوم في آخر دورة، وعمر الحمل بالأسابيع والأيام، والثلث الذي أنتِ فيه، مع مراعاة طول الدورة.',
    categories: ['health-age'],
    terms: ['حمل', 'الحمل', 'ولادة', 'موعد الولادة', 'حاسبة الحمل', 'أسابيع الحمل', 'حامل', 'الدورة'],
    related: ['days-between', 'hijri', 'calories', 'bmi'],
    updated: '2026-10-25',
  },
  {
    slug: 'calories',
    question: 'كم سعرة يحتاج جسمي يومياً؟',
    short: 'السعرات اليومية',
    blurb: 'احتياجك اليومي بحسب عمرك ووزنك ونشاطك',
    tone: '#15803d',
    sample: '2,740',
    seoTitle: 'حاسبة السعرات الحرارية اليومية للبالغين',
    description: 'احسب عدد السعرات التي يحتاجها جسمك يومياً للمحافظة على وزنك بمعادلة ميفلين سان جيور، بحسب جنسك وعمرك ووزنك وطولك ومستوى نشاطك.',
    categories: ['health-age'],
    terms: ['سعرات', 'السعرات', 'سعرة', 'حرارية', 'رجيم', 'دايت', 'تخسيس', 'calories', 'حرق'],
    related: ['bmi', 'age', 'pregnancy', 'percentage'],
    updated: '2026-10-21',
  },
  {
    slug: 'gosi',
    question: 'كم يُخصم من راتبي للتأمينات؟',
    short: 'التأمينات الاجتماعية',
    blurb: 'الخصم من راتبك وراتبك الصافي، بالنظام السابق والجديد',
    tone: '#3f6212',
    sample: '1,075',
    seoTitle: 'حاسبة الراتب الصافي بعد خصم التأمينات GOSI 2026',
    description: 'احسب راتبك الصافي بعد خصم التأمينات الاجتماعية في السعودية، وكم يُخصم منك وكم يدفع صاحب العمل، بالنظام السابق أو الجديد، للسعودي وغير السعودي.',
    categories: ['money'],
    terms: ['الراتب الصافي', 'صافي الراتب', 'تأمينات', 'التأمينات', 'gosi', 'جوسي', 'ساند', 'خصم الراتب', 'معاش', 'التقاعد', 'السعودية', 'استقطاع'],
    related: ['end-of-service', 'loan', 'zakat', 'percentage'],
    updated: '2026-10-23',
  },
];

export const CATEGORIES: { key: CategoryKey; name: string; intro: string; description: string }[] = [
  {
    key: 'money',
    name: 'المال والعمل',
    intro: 'أسئلة الراتب والقروض والضرائب والزكاة: ما ستأخذه، وما ستدفعه، وما عليك.',
    description: 'حاسبات مالية عربية: مكافأة نهاية الخدمة في الإمارات، التأمينات الاجتماعية GOSI، القسط الشهري للقرض، ضريبة القيمة المضافة، وزكاة المال.',
  },
  {
    key: 'shopping',
    name: 'التسوق والنسب',
    intro: 'قبل أن تدفع: السعر بعد الخصم، والضريبة على الفاتورة، والنسبة الحقيقية خلف العرض.',
    description: 'حاسبات للتسوق: السعر بعد الخصم، الخصم الإضافي، ضريبة القيمة المضافة، والنسبة المئوية ونسبة التغير.',
  },
  {
    key: 'health-age',
    name: 'الصحة والعمر',
    intro: 'أرقام عنك أنت: عمرك بالضبط، ومؤشر كتلة جسمك، وموعد الولادة، وسعراتك اليومية.',
    description: 'حاسبات شخصية: العمر بالسنوات والأشهر والأيام، ومؤشر كتلة الجسم BMI، وموعد الولادة، والسعرات اليومية.',
  },
  {
    key: 'dates',
    name: 'التاريخ والوقت',
    intro: 'التاريخ الهجري والميلادي، والأيام بين تاريخين، وكم بقي على موعدك.',
    description: 'حاسبات التاريخ: تحويل التاريخ من ميلادي إلى هجري وبالعكس بتقويم أم القرى، وعدد الأيام وأيام العمل بين تاريخين.',
  },
];

export const bySlug = (slug: string) => {
  const c = CALCULATORS.find((x) => x.slug === slug);
  if (!c) throw new Error(`Unknown calculator: ${slug}`);
  return c;
};
export const inCategory = (key: CategoryKey) => CALCULATORS.filter((c) => c.categories.includes(key));
