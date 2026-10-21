// Single source of truth for calculator pages: routes, metadata, categories, search terms and related links.
export type CategoryKey = 'money' | 'shopping' | 'health-age';

export type CalculatorMeta = {
  slug: string;
  question: string; // H1, and how people actually ask
  short: string; // short name for chips and lists
  blurb: string; // one short line for the editorial index
  seoTitle: string;
  description: string;
  categories: CategoryKey[];
  terms: string[]; // search words that really describe the page
  related: string[]; // 4 slugs
};

export const CALCULATORS: CalculatorMeta[] = [
  {
    slug: 'end-of-service',
    question: 'كم مكافأة نهاية خدمتي؟',
    short: 'نهاية الخدمة',
    blurb: '21 يوماً ثم 30 يوماً عن كل سنة، وفق المادة 51',
    seoTitle: 'حاسبة مكافأة نهاية الخدمة في الإمارات (القطاع الخاص)',
    description: 'احسب مكافأة نهاية الخدمة وفق المادة 51 من قانون العمل الإماراتي: 21 يوماً عن أول 5 سنوات و30 يوماً بعدها، مع الحد الأعلى وأيام الغياب.',
    categories: ['money'],
    terms: ['نهاية الخدمة', 'مكافأة', 'المكافأة', 'استقالة', 'قانون العمل', 'الإمارات', 'راتب أساسي', 'gratuity'],
    related: ['loan', 'zakat', 'percentage', 'vat'],
  },
  {
    slug: 'vat',
    question: 'كم الضريبة على هذا المبلغ؟',
    short: 'ضريبة القيمة المضافة',
    blurb: 'أضف 5% إلى السعر أو استخرجها منه',
    seoTitle: 'حاسبة ضريبة القيمة المضافة 5%: إضافة واستخراج',
    description: 'أضف ضريبة القيمة المضافة إلى السعر أو استخرجها من سعر شامل، بنسبة 5% الإماراتية أو أي نسبة أخرى، مع شرح الفرق بين الطريقتين.',
    categories: ['money', 'shopping'],
    terms: ['ضريبة', 'الضريبة', 'القيمة المضافة', 'vat', '5%', 'شامل الضريبة', 'فاتورة'],
    related: ['discount', 'percentage', 'loan', 'zakat'],
  },
  {
    slug: 'loan',
    question: 'كم قسطي الشهري؟',
    short: 'القسط الشهري',
    blurb: 'فائدة ثابتة أو متناقصة، مع جدول السداد',
    seoTitle: 'حاسبة القرض والقسط الشهري: فائدة ثابتة أو متناقصة',
    description: 'احسب القسط الشهري لقرض شخصي أو تمويل سيارة أو عقار، وقارن بين الفائدة الثابتة والمتناقصة، مع جدول توزيع الأصل والفائدة.',
    categories: ['money'],
    terms: ['قرض', 'القرض', 'قسط', 'تمويل', 'سيارة', 'فائدة', 'بنك', 'عقار'],
    related: ['end-of-service', 'percentage', 'vat', 'zakat'],
  },
  {
    slug: 'percentage',
    question: 'كم تساوي النسبة؟',
    short: 'النسبة المئوية',
    blurb: 'نسبة من رقم، ونسبة رقم لآخر، ونسبة التغير',
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
    seoTitle: 'حاسبة الخصم: السعر بعد التخفيض والخصم الإضافي',
    description: 'اعرف السعر النهائي بعد الخصم، وكم توفّر، ونسبة الخصم الفعلية عند وجود خصم إضافي فوق الخصم الأول.',
    categories: ['shopping'],
    terms: ['خصم', 'الخصم', 'تخفيض', 'تخفيضات', 'عروض', 'سعر', 'تسوق', 'sale'],
    related: ['percentage', 'vat', 'loan', 'age'],
  },
  {
    slug: 'age',
    question: 'كم عمري بالضبط؟',
    short: 'العمر',
    blurb: 'بالسنة والشهر واليوم، والأيام لعيد ميلادك',
    seoTitle: 'حاسبة العمر بالسنوات والأشهر والأيام',
    description: 'احسب عمرك بالضبط بالسنوات والأشهر والأيام، وعدد الأيام التي عشتها، وكم بقي على عيد ميلادك القادم.',
    categories: ['health-age'],
    terms: ['عمر', 'العمر', 'عمري', 'ميلاد', 'عيد ميلاد', 'تاريخ', 'سن'],
    related: ['bmi', 'percentage', 'end-of-service', 'discount'],
  },
  {
    slug: 'bmi',
    question: 'هل وزني طبيعي؟',
    short: 'مؤشر كتلة الجسم',
    blurb: 'مؤشر كتلة الجسم ونطاق الوزن لطولك',
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
    seoTitle: 'حاسبة زكاة المال والنصاب بالذهب',
    description: 'احسب الزكاة المبدئية على النقد والمدخرات والاستثمارات، مع خصم الديون وتحديد النصاب بسعر غرام الذهب الذي تدخله.',
    categories: ['money'],
    terms: ['زكاة', 'الزكاة', 'نصاب', 'ذهب', 'مدخرات', 'ربع العشر', 'رمضان'],
    related: ['end-of-service', 'loan', 'percentage', 'vat'],
  },
];

export const CATEGORIES: { key: CategoryKey; name: string; intro: string; description: string }[] = [
  {
    key: 'money',
    name: 'المال والعمل',
    intro: 'أسئلة الراتب والقروض والضرائب والزكاة: ما ستأخذه، وما ستدفعه، وما عليك.',
    description: 'حاسبات مالية عربية: مكافأة نهاية الخدمة في الإمارات، القسط الشهري للقرض، ضريبة القيمة المضافة، وزكاة المال.',
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
    intro: 'أرقام عنك أنت: عمرك بالضبط، ومؤشر كتلة جسمك ونطاق وزنك.',
    description: 'حاسبات شخصية: العمر بالسنوات والأشهر والأيام، ومؤشر كتلة الجسم BMI للبالغين.',
  },
];

export const bySlug = (slug: string) => {
  const c = CALCULATORS.find((x) => x.slug === slug);
  if (!c) throw new Error(`Unknown calculator: ${slug}`);
  return c;
};
export const inCategory = (key: CategoryKey) => CALCULATORS.filter((c) => c.categories.includes(key));
