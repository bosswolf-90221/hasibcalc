// The site's organising idea: a visitor starts from what is happening to them, not from a calculator's name.
// Facts here were checked against the sources listed with them; see verification.ts and FORMULA_CHANGES.md.
export type MomentField = {
  name: string;
  label: string;
  kind: 'number' | 'date' | 'choice' | 'select';
  value?: string;
  hint?: string;
  today?: boolean;
  options?: { value: string; label: string }[];
  /** Only shown while another field holds this value. */
  showIf?: { name: string; value: string };
};
export type Moment = {
  slug: string;
  icon: string;
  tint: string;
  name: string;
  ask: string;
  shows: string[];
  calcs: string[];
  guides: string[];
  seoTitle: string;
  description: string;
  title: string;
  lead: string;
  fields: MomentField[];
  /** The numbers on screen are an example until the visitor changes them. Dated and personal moments start empty. */
  example: boolean;
  next: string[];
  about: string[];
  sources: { href: string; label: string }[];
  health?: boolean;
  updated: string;
};

const UPDATED = '2026-11-05';
const LAW = 'https://mohre.gov.ae/assets/download/43e39236/%D9%85%D8%B1%D8%B3%D9%88%D9%85%20%D8%A8%D9%82%D8%A7%D9%86%D9%88%D9%86%20%D8%A7%D8%AA%D8%AD%D8%A7%D8%AF%D9%8A%20%D8%B1%D9%82%D9%85%2033%20%D9%84%D8%B3%D9%86%D8%A9%202021%20%D8%A8%D8%B4%D8%A3%D9%86%20%D8%AA%D9%86%D8%B8%D9%8A%D9%85%20%D8%B9%D9%84%D8%A7%D9%82%D8%A7%D8%AA%20%D8%A7%D9%84%D8%B9%D9%85%D9%84%20%D9%88%D8%AA%D8%B9%D8%AF%D9%8A%D9%84%D8%A7%D8%AA%D9%87_638990570577815564.pdf.aspx';
const LAW_L = 'وزارة الموارد البشرية والتوطين: المرسوم بقانون 33 لسنة 2021 وتعديلاته (النص العربي)';
const MOF = 'https://web.archive.org/web/20261013233930/https://www.mof.gov.sa/mediacenter/Payroll/Pages/2026.aspx';
const WAM = 'https://www.wam.ae/ar/article/b2kivtk-%D8%A7%D9%84%D8%A5%D9%81%D8%AA%D8%A7%D8%A1-%D8%A7%D9%84%D8%B4%D8%B1%D8%B9%D9%8A-%D9%8A%D8%B5%D8%AF%D8%B1-%D8%A8%D9%8A%D8%A7%D9%86%D8%A7-%D9%8A%D9%88%D8%B6%D8%AD-%D9%81%D9%8A%D9%87-%D8%A3%D9%86%D9%88%D8%A7%D8%B9-%D8%B2%D9%83%D8%A7%D8%A9';
const NICE = 'https://www.nice.org.uk/guidance/ng246/chapter/Identifying-and-assessing-overweight-obesity-and-central-adiposity';

export const MOMENTS: Moment[] = [
  {
    slug: 'leaving-job', icon: 'job', tint: 'job', name: 'تركت عملي', ask: 'كم أستحق، وماذا أفعل بعدها؟',
    shows: ['مكافأة نهاية الخدمة', 'بدل الإجازة', 'مجموع المستحقات'], calcs: ['exit-dues', 'end-of-service', 'annual-leave'], guides: ['end-of-service-guide'],
    seoTitle: 'تركت عملي: ماذا أحسب وما خطوتي التالية بعد انتهاء العقد؟',
    description: 'اكتب راتبك وتاريخي عملك مرة واحدة، واعرف مكافأة نهاية الخدمة وبدل الإجازة ومجموع مستحقاتك في القطاع الخاص بالإمارات، وماذا تتحقق منه بعدها.',
    title: 'تركت عملي: كم أستحق؟',
    lead: 'اكتب بياناتك مرة واحدة، ونحسب مكافأة نهاية الخدمة وبدل الإجازة معاً. للقطاع الخاص في الإمارات، لغير المواطنين بدوام كامل.',
    example: true,
    fields: [
      { name: 'salary', label: 'الراتب الأساسي الشهري (درهم)', kind: 'number', value: '8000', hint: 'بدون السكن والمواصلات' },
      { name: 'start', label: 'أول يوم عمل', kind: 'date', value: '2019-03-01' },
      { name: 'end', label: 'آخر يوم عمل', kind: 'date', today: true },
      { name: 'taken', label: 'أيام الإجازة التي أخذتها طوال خدمتك', kind: 'number', value: '120' },
      { name: 'absence', label: 'أيام الغياب بدون أجر', kind: 'number', value: '0' },
    ],
    next: [
      'تُدفع المستحقات خلال 14 يوماً من انتهاء العقد (المادة 53).',
      'لا يشمل هذا المبلغ آخر راتب، ولا بدل الإنذار، ولا تذكرة العودة.',
      'يجوز لصاحب العمل خصم ما يكون مستحقاً له عليك.',
      'إن كانت شركتك في نظام الادخار البديل (قرار مجلس الوزراء 96 لسنة 2023) فقد يختلف حسابك.',
    ],
    about: [
      'تعدّ المادة 67 من القانون السنة 365 يوماً والشهر 30 يوماً، ونحسب الأجر اليومي بقسمة الراتب الأساسي على 30. ولم نجد نصاً صريحاً يحدد الأجر اليومي لمن يتقاضى راتباً شهرياً.',
      'نحسب سقف المكافأة 24 ضعف الراتب الأساسي، ونص المادة 51 يقول «أجر سنتين». ولم نجد نصاً صريحاً في أثر الغياب بدون أجر على رصيد الإجازة، فلا نخصمه هنا.',
    ],
    sources: [
      { href: 'https://u.ae/ar/information-and-services/jobs/Sector-of-employment/employment-in-the-private-sector/end-of-service-benefits-for-employees-in-the-private-sector', label: 'بوابة حكومة الإمارات: مكافأة نهاية الخدمة' },
      { href: 'https://u.ae/ar/information-and-services/jobs/Sector-of-employment/employment-in-the-private-sector/Types-of-leaves', label: 'بوابة حكومة الإمارات: الإجازات' },
      { href: LAW, label: LAW_L },
    ],
    updated: UPDATED,
  },
  {
    slug: 'monthly-pay', icon: 'pay', tint: 'pay', name: 'راتبي الشهري', ask: 'متى ينزل، وكم يُخصم منه؟',
    shows: ['موعد الراتب', 'راتب السعودية', 'راتب الإمارات', 'التأمينات'], calcs: ['salary-day', 'salary-saudi', 'salary-uae', 'gosi'], guides: [],
    seoTitle: 'راتبي الشهري: الموعد والخصم والصافي في صفحة واحدة',
    description: 'كم بقي على راتبك في السعودية أو الإمارات، وما موعده إذا وافق عطلة، وكم يُخصم منه للتأمينات الاجتماعية في السعودية، وكم يبقى لك صافياً.',
    title: 'راتبي الشهري: متى ينزل، وكم يبقى لي؟',
    lead: 'اختر بلدك ويوم راتبك، فتعرف كم بقي عليه. وفي السعودية تعرف أيضاً خصم التأمينات وراتبك الصافي.',
    example: true,
    fields: [
      { name: 'country', label: 'أين تعمل؟', kind: 'choice', value: 'saudi', options: [{ value: 'saudi', label: 'السعودية' }, { value: 'uae', label: 'الإمارات' }] },
      { name: 'payDay', label: 'يوم راتبك في الشهر', kind: 'number', value: '27', hint: 'إن كان آخر الشهر فاكتب 31' },
      { name: 'nationality', label: 'الجنسية', kind: 'choice', value: 'saudi', options: [{ value: 'saudi', label: 'سعودي' }, { value: 'non-saudi', label: 'غير سعودي' }], showIf: { name: 'country', value: 'saudi' } },
      { name: 'system', label: 'أول تسجيل في التأمينات', kind: 'choice', value: 'new', options: [{ value: 'legacy', label: 'قبل 3 يوليو 2024' }, { value: 'new', label: 'بعده' }], showIf: { name: 'country', value: 'saudi' } },
      { name: 'basic', label: 'الراتب الأساسي (ريال)', kind: 'number', value: '8000', showIf: { name: 'country', value: 'saudi' } },
      { name: 'housing', label: 'بدل السكن (ريال)', kind: 'number', value: '2000', showIf: { name: 'country', value: 'saudi' } },
      { name: 'other', label: 'بدلات أخرى (ريال)', kind: 'number', value: '1000', showIf: { name: 'country', value: 'saudi' } },
    ],
    next: [
      'رواتب القطاع الحكومي في السعودية يوم 27: إذا وافق الجمعة فالصرف الخميس قبله، وإذا وافق السبت فالأحد بعده، بحسب وزارة المالية.',
      'وفي القطاع الخاص بالسعودية يعتمد الموعد على عقدك، فاكتب يومك.',
      'في القطاع الخاص بالإمارات، منذ 1 يونيو 2026 يكون الموعد الموحد للأجر اليوم الأول من الشهر، بحسب القرار الوزاري 340 لسنة 2026.',
      'قد تُعلن مواعيد خاصة قبل الأعياد، فتابع الإعلان الرسمي.',
    ],
    about: [
      'نسب التأمينات من منصة التأمينات الاجتماعية: 9% معاشات في النظام السابق على الموظف ومثلها على صاحب العمل، وتزيد في النظام الجديد نصف نقطة كل 1 يوليو حتى 11%، و0.75% ساند على كل طرف، و2% أخطار مهنية على صاحب العمل.',
      'لم نجد تقويم رواتب 2027 الرسمي في السعودية وقت المراجعة، فمواعيده هنا مبنية على القاعدة. ومواطنو دول الخليج لهم ترتيبات خاصة في التأمينات لا يغطيها هذا الحساب.',
    ],
    sources: [
      { href: MOF, label: 'وزارة المالية السعودية: مواعيد صرف الرواتب 2026 (نسخة مؤرشفة، لأن الصفحة الأصلية لم تفتح وقت المراجعة)' },
      { href: 'https://awareness.gosi.gov.sa/businessJourney.html', label: 'المؤسسة العامة للتأمينات الاجتماعية: المنصة التوعوية' },
      { href: 'https://www.mohre.gov.ae/assets/download/9e530b2e/Ministerial%20Resolution%20No.%200340%20of%202026.pdf.aspx', label: 'وزارة الموارد البشرية والتوطين: القرار الوزاري 340 لسنة 2026' },
    ],
    updated: UPDATED,
  },
  {
    slug: 'taking-loan', icon: 'loan', tint: 'loan', name: 'سآخذ قرضاً', ask: 'كم القسط، وكم الفائدة الحقيقية؟',
    shows: ['القسط الشهري', 'الثابتة والمتناقصة', 'نسبة القسط من راتبك'], calcs: ['loan', 'percentage'], guides: ['flat-vs-reducing-interest'],
    seoTitle: 'سآخذ قرضاً: كم القسط والفائدة الحقيقية ونسبة القسط من الراتب؟',
    description: 'قبل أن توقّع على القرض، اعرف قسطك الشهري ومجموع الفوائد، وقارن بين الفائدة الثابتة والمتناقصة بالنسبة نفسها، واعرف نسبة القسط من راتبك.',
    title: 'سآخذ قرضاً: كم سيكلفني فعلاً؟',
    lead: 'النسبة التي يعلنها البنك لا تكفي وحدها. اكتب عرض البنك، وقارن القسط والفوائد بالطريقتين، قبل أن توقّع.',
    example: true,
    fields: [
      { name: 'principal', label: 'مبلغ القرض', kind: 'number', value: '100000' },
      { name: 'rate', label: 'النسبة السنوية %', kind: 'number', value: '4.5' },
      { name: 'months', label: 'المدة بالأشهر', kind: 'number', value: '48' },
      { name: 'method', label: 'كيف يعرض البنك النسبة؟', kind: 'choice', value: 'reducing', options: [{ value: 'reducing', label: 'متناقصة' }, { value: 'flat', label: 'ثابتة' }] },
      { name: 'salary', label: 'راتبك الشهري (اختياري)', kind: 'number', value: '15000' },
    ],
    next: [
      'اطلب من البنك المعدل الفعلي السنوي مكتوباً، فهو ما يوحّد المقارنة بين العروض.',
      'في الإمارات، على البنك الذي يعلن نسبة ثابتة أن يذكر بجانبها المعدل الفعلي المعادل، بحسب قواعد المصرف المركزي.',
      'اسأل عن رسوم المعالجة والتأمين ورسوم السداد المبكر، فهي لا تظهر في القسط.',
    ],
    about: [
      'الفائدة المتناقصة تُحسب كل شهر على الرصيد المتبقي فقط، والثابتة تُحسب على المبلغ كله طوال المدة. لذلك تكلف النسبة الثابتة أكثر من النسبة المتناقصة نفسها، وهذا الحساب نموذج مبسط لا يشمل الرسوم والتأمين.',
      'مثال: قرض 100,000 لمدة 4 سنوات بنسبة 4.5%. بالفائدة الثابتة تدفع 18,000 فوائد وقسطاً 2,458.33، وبالمتناقصة تدفع 9,456.73 فوائد وقسطاً 2,280.35. أي نحو 8,500 زيادة بالرقم المعلن نفسه، وتعادل الثابتة هنا متناقصة نحو 8.4%.',
      'ولأن الفائدة المتناقصة تُحسب على الرصيد المتبقي، فإن فائدة السنة الأولى أكبر منها في الأخيرة، ولذلك يوفّر السداد المبكر في أول القرض أكثر. تحقق من رسوم السداد المبكر في عقدك قبل أن تقرر.',
    ],
    sources: [
      { href: 'https://rulebook.centralbank.ae/en/rulebook/article-6-computation-interest', label: 'مصرف الإمارات المركزي: حساب الفائدة' },
      { href: 'https://rulebook.centralbank.ae/en/rulebook/consumer-protection-standards', label: 'مصرف الإمارات المركزي: معايير حماية المستهلك' },
    ],
    updated: UPDATED,
  },
  {
    slug: 'ramadan-zakat', icon: 'faith', tint: 'faith', name: 'رمضان والزكاة', ask: 'كم زكاتي، ومتى المواعيد؟',
    shows: ['زكاة المال', 'موعد رمضان', 'التاريخ الهجري'], calcs: ['zakat', 'hijri'], guides: ['zakat-step-by-step', 'ramadan-1448'],
    seoTitle: 'رمضان والزكاة: كم زكاة مالي ومتى يبدأ رمضان القادم؟',
    description: 'احسب زكاة مالك واختر أساس النصاب بين الذهب أو الأقل من الذهب والفضة، واعرف موعد أول رمضان القادم بتقويم أم القرى وكم بقي عليه من الأيام.',
    title: 'رمضان والزكاة: كم زكاتي، وكم بقي؟',
    lead: 'كثيرون يخرجون زكاتهم في رمضان. احسبها هنا، واعرف كم بقي على الشهر.',
    example: true,
    fields: [
      { name: 'cash', label: 'النقد والمدخرات', kind: 'number', value: '60000' },
      { name: 'investments', label: 'الاستثمارات التي تجب فيها الزكاة', kind: 'number', value: '20000' },
      { name: 'debts', label: 'الديون الحالّة عليك', kind: 'number', value: '5000' },
      { name: 'gold', label: 'سعر غرام الذهب عيار 24 اليوم', kind: 'number', hint: 'بالعملة نفسها. لا نعرض سعراً آنياً' },
      { name: 'silver', label: 'سعر غرام الفضة اليوم', kind: 'number', hint: 'يلزم لخيار الأقل من الذهب والفضة' },
      { name: 'basis', label: 'أساس النصاب', kind: 'choice', value: 'gold', options: [{ value: 'gold', label: 'الذهب' }, { value: 'lower', label: 'الأقل من الذهب والفضة' }] },
    ],
    next: [
      'تجب الزكاة إذا بلغ المال النصاب ومرّ عليه حول قمري كامل.',
      'لا نرجّح بين قولَي النصاب: مجلس الإمارات للإفتاء يعتمد 85 غراماً من الذهب، ودليل هيئة الزكاة السعودية يعتمد الأقل من نصاب الذهب أو الفضة (595 غراماً).',
      'هذه الصفحة ليست فتوى. لحالتك الخاصة اسأل جهة الإفتاء في بلدك.',
    ],
    about: [
      'طريقة احتساب الأسهم والصناديق والعقارات المعدّة للتجارة والديون تختلف بحسب نوعها. وتُحسب مواعيد الأشهر هنا بتقويم أم القرى، والإعلان الرسمي بعد الرؤية قد يختلف يوماً.',
    ],
    sources: [
      { href: WAM, label: 'وكالة أنباء الإمارات: بيان مجلس الإمارات للإفتاء الشرعي عن الزكاة' },
      { href: 'https://zatca.gov.sa/ar/HelpCenter/guidelines/Documents/Zakat_Individual.pdf', label: 'هيئة الزكاة والضريبة والجمارك: الدليل الإرشادي لزكاة الأفراد (إرشادي غير ملزم)' },
      { href: 'https://www.ummulqura.org.sa/en/annual-reference', label: 'تقويم أم القرى: المرجع السنوي' },
    ],
    updated: UPDATED,
  },
  {
    slug: 'expecting-baby', icon: 'baby', tint: 'baby', name: 'ننتظر طفلاً', ask: 'متى التبويض، وموعد الولادة؟',
    shows: ['حاسبة التبويض', 'موعد الولادة', 'عمر الحمل'], calcs: ['ovulation', 'pregnancy'], guides: ['pregnancy-weeks-months'],
    seoTitle: 'ننتظر طفلاً: موعد التبويض وأيام الخصوبة وموعد الولادة المتوقع',
    description: 'اكتبي تاريخ آخر دورة وطولها، واعرفي موعد التبويض وأيام الخصوبة إن كنتما تخططان للحمل، أو موعد الولادة المتوقع وعمر الحمل إن كنتِ حاملاً.',
    title: 'ننتظر طفلاً: ما مواعيدك؟',
    lead: 'من تاريخ واحد نحسب ما يهمك الآن، سواء كنتما تخططان للحمل أو كنتِ حاملاً.',
    example: false, health: true,
    fields: [
      { name: 'stage', label: 'أين أنتما الآن؟', kind: 'choice', value: 'planning', options: [{ value: 'planning', label: 'نخطط للحمل' }, { value: 'pregnant', label: 'أنا حامل' }] },
      { name: 'lmp', label: 'أول يوم من آخر دورة', kind: 'date' },
      { name: 'cycle', label: 'طول الدورة بالأيام', kind: 'number', value: '28', hint: 'إن لم تعرفيه فاتركيه 28' },
      { name: 'period', label: 'عدد أيام نزول الدورة', kind: 'number', value: '5', showIf: { name: 'stage', value: 'planning' } },
    ],
    next: [
      'هذه الحسابات تقدير، وموعد الولادة بالموجات فوق الصوتية في الثلث الأول أدق منها.',
      'حساب أيام الخصوبة لا يصلح وسيلة لمنع الحمل.',
      'راجعي طبيبتك في أي قرار يخص صحتك أو حملك.',
    ],
    about: [
      'موعد الولادة = أول يوم من آخر دورة + 280 يوماً، مع تعديل تقريبي لطول الدورة. ويأتي التبويض نحو 14 يوماً قبل الدورة التالية. وتختلف المصادر قليلاً: فالحيوانات المنوية قد تعيش خمسة أيام بحسب هيئة الصحة النيوزيلندية، وقد تصل إلى سبعة بحسب NHS.',
      'مثال: إذا كان أول يوم من آخر دورة 26 أغسطس 2026، وطول الدورة 28 يوماً، فموعد الولادة المتوقع 2 يونيو 2027. وأيام الخصوبة ستة: الأيام الخمسة التي تسبق التبويض ويوم التبويض نفسه.',
      'ونقسم الحمل إلى ثلاثة أثلاث بحسب الكلية الأمريكية لأطباء النساء والتوليد: الأول حتى 13 أسبوعاً و6 أيام، والثاني حتى 27 أسبوعاً و6 أيام، والثالث من 28 أسبوعاً حتى الولادة. وقد تختلف بعض المصادر أسبوعاً.',
    ],
    sources: [
      { href: 'https://www.acog.org/womens-health/faqs/how-your-fetus-grows-during-pregnancy', label: 'الكلية الأمريكية لأطباء النساء والتوليد: نمو الجنين أثناء الحمل' },
      { href: 'https://www.nhs.uk/conditions/periods/fertility-in-the-menstrual-cycle/', label: 'NHS: الخصوبة في الدورة الشهرية' },
      { href: 'https://www.healthnz.govt.nz/health-topics/pregnancy-maternity/planning-your-pregnancy/timing-for-conception', label: 'Health New Zealand: توقيت الحمل' },
    ],
    updated: UPDATED,
  },
  {
    slug: 'health-weight', icon: 'health', tint: 'health', name: 'صحتي ووزني', ask: 'هل وزني طبيعي، وكم أحتاج؟',
    shows: ['مؤشر كتلة الجسم', 'السعرات اليومية'], calcs: ['bmi', 'calories'], guides: ['ideal-weight-by-height'],
    seoTitle: 'صحتي ووزني: مؤشر كتلة الجسم والسعرات في صفحة واحدة',
    description: 'اكتب وزنك وطولك وعمرك ونشاطك، واعرف مؤشر كتلة جسمك ونطاق الوزن الطبيعي لطولك وسعراتك اليومية للمحافظة على وزنك. أرقام تقديرية للبالغين.',
    title: 'صحتي ووزني: أين أنا الآن؟',
    lead: 'وزنك وطولك يكفيان لمعرفة نطاقك، وعمرك ونشاطك يضيفان سعراتك اليومية. للبالغين فقط.',
    example: true, health: true,
    fields: [
      { name: 'weight', label: 'الوزن (كجم)', kind: 'number', value: '70' },
      { name: 'height', label: 'الطول (سم)', kind: 'number', value: '170' },
      { name: 'age', label: 'العمر', kind: 'number', value: '30' },
      { name: 'sex', label: 'الجنس', kind: 'choice', value: 'male', options: [{ value: 'male', label: 'رجل' }, { value: 'female', label: 'امرأة' }] },
      { name: 'activity', label: 'مستوى النشاط', kind: 'select', value: 'moderate' },
    ],
    next: [
      'مؤشر كتلة الجسم أداة فحص أولي وليس تشخيصاً، ولا يفرّق بين العضلات والدهون.',
      'لأصحاب الأصول الآسيوية والشرق أوسطية وبعض الأصول الأفريقية توصي إرشادات NICE البريطانية بعتبات أقل: زيادة الوزن من 23، والسمنة من 27.5.',
      'الحامل والمرضعة ومن لديه حالة صحية يراجع الطبيب قبل تغيير غذائه.',
    ],
    about: [
      'السعرات محسوبة بمعادلة Mifflin-St Jeor المنشورة سنة 1990، ثم تُضرب في معامل النشاط. ومعاملات النشاط تقريبية وشائعة الاستخدام، ولم نجد لها مصدراً رسمياً واحداً.',
    ],
    sources: [
      { href: NICE, label: 'NICE البريطانية: تحديد زيادة الوزن والسمنة (NG246)' },
      { href: 'https://www.who.int/data/gho/data/themes/topics/topic-details/GHO/body-mass-index', label: 'منظمة الصحة العالمية: مؤشر كتلة الجسم' },
      { href: 'https://pubmed.ncbi.nlm.nih.gov/2305711/', label: 'Mifflin وSt Jeor وآخرون (1990): معادلة معدل الأيض الأساسي' },
    ],
    updated: UPDATED,
  },
  {
    slug: 'shopping', icon: 'shop', tint: 'shop', name: 'أشتري وأقارن', ask: 'كم السعر الحقيقي بعد الخصم والضريبة؟',
    shows: ['الخصم', 'الضريبة', 'النسبة المئوية'], calcs: ['discount', 'vat', 'percentage'], guides: ['white-friday-2026', 'vat-gulf-guide', 'how-to-calculate-percentage'],
    seoTitle: 'أشتري وأقارن: كم السعر الحقيقي بعد الخصم والضريبة؟',
    description: 'اكتب السعر والخصمين ونسبة الضريبة، واعرف ما ستدفعه فعلاً، وكم توفّر، ونسبة الخصم الحقيقية. فخصم 50% ثم 20% لا يساوي 70%، بل 60%.',
    title: 'أشتري وأقارن: كم سأدفع فعلاً؟',
    lead: 'خصمان فوق بعضهما لا يُجمعان، والضريبة قد تُضاف عند الدفع. اكتب العرض الذي أمامك واعرف السعر الحقيقي.',
    example: true,
    fields: [
      { name: 'price', label: 'السعر الأصلي', kind: 'number', value: '1000' },
      { name: 'first', label: 'الخصم الأول %', kind: 'number', value: '50' },
      { name: 'second', label: 'خصم إضافي % (اختياري)', kind: 'number', value: '20' },
      { name: 'rate', label: 'الضريبة إن لم تكن مشمولة', kind: 'choice', value: '5', options: [{ value: '0', label: 'مشمولة' }, { value: '5', label: '5%' }, { value: '10', label: '10%' }, { value: '15', label: '15%' }] },
    ],
    next: [
      'النسبة الأساسية لضريبة القيمة المضافة 5% في الإمارات وعُمان، و10% في البحرين، و15% في السعودية.',
      'الخصم الثاني يُحسب على السعر بعد الخصم الأول، فلا يُجمع مع الأول.',
      'قارن بالسعر النهائي عند الدفع، لا بنسبة الخصم المعلنة.',
    ],
    about: [
      'لاستخراج الضريبة من سعر شامل لها، اقسم السعر على (1 + نسبة الضريبة)، لا تضربه في النسبة. فبنسبة 5%: 1,050 ÷ 1.05 = 1,000، والضريبة 50.',
      'مثال: سلعة بـ1,000 عليها خصم 50% ثم 20%. تصبح 500 ثم 400، فالخصم الحقيقي 60% لا 70%. فإن لم تكن الضريبة مشمولة، فبنسبة 5% تدفع 420.',
      'وانتبه للنسب المتعاقبة عموماً: إذا ارتفع السعر 10% ثم انخفض 10% فلا يعود كما كان، فـ100 تصبح 110 ثم 99، لأن النسبة الثانية تُحسب على رقم أكبر.',
    ],
    sources: [
      { href: 'https://tax.gov.ae/', label: 'الهيئة الاتحادية للضرائب، الإمارات' },
      { href: 'https://zatca.gov.sa/', label: 'هيئة الزكاة والضريبة والجمارك، السعودية' },
    ],
    updated: UPDATED,
  },
  {
    slug: 'university', icon: 'study', tint: 'study', name: 'أدرس في الجامعة', ask: 'كم معدلي، وكيف أرفعه؟',
    shows: ['المعدل الجامعي', 'المعدل المطلوب'], calcs: ['gpa', 'gpa-target'], guides: [],
    seoTitle: 'أدرس في الجامعة: معدلي الآن وما أحتاجه لأصل إلى هدفي',
    description: 'اكتب معدلك التراكمي وساعاتك والمعدل الذي تريده، واعرف ما تحتاجه في الفصل القادم، وأعلى ما تصل إليه، من 5 أو من 4، مع حاسبة المعدل من موادك.',
    title: 'أدرس في الجامعة: كم أحتاج لأرفع معدلي؟',
    lead: 'اكتب أين أنت الآن وأين تريد أن تصل، ونحسب المعدل الذي يلزمك في الفصل القادم، وهل الهدف ممكن.',
    example: true,
    fields: [
      { name: 'system', label: 'نظام المعدل', kind: 'choice', value: 's5', options: [{ value: 's5', label: 'من 5' }, { value: 's4', label: 'من 4' }] },
      { name: 'current', label: 'معدلك التراكمي الآن', kind: 'number', value: '3.5' },
      { name: 'done', label: 'الساعات التي أنهيتها', kind: 'number', value: '60' },
      { name: 'target', label: 'المعدل الذي تريده', kind: 'number', value: '3.75' },
      { name: 'next', label: 'ساعات الفصل القادم', kind: 'number', value: '15' },
      { name: 'left', label: 'الساعات المتبقية حتى التخرج (اختياري)', kind: 'number', hint: 'مع ساعات الفصل القادم' },
    ],
    next: [
      'كلما زادت ساعاتك السابقة صعب رفع المعدل التراكمي، لأن وزن الفصل الجديد يصغر أمامها.',
      'المواد الأكثر ساعات تؤثر في المعدل أكثر من غيرها.',
      'راجع لائحة جامعتك، فالأوزان والحد الأدنى قد يختلفان بين الجامعات.',
    ],
    about: [
      'المعدل المطلوب = (المعدل الهدف × الساعات بعد الفصل − معدلك الحالي × ساعاتك الحالية) ÷ ساعات الفصل القادم.',
      'مثال: طالب معدله 3.20 بعد 60 ساعة يريد 3.30 بعد فصل من 15 ساعة: (3.30 × 75 − 3.20 × 60) ÷ 15 = 3.70. أما 3.40 فيحتاج 4.20، وهو فوق الحد الأعلى في نظام 4، فلا يتحقق في فصل واحد.',
      'ولهذا يصعب رفع المعدل مع الوقت: طالب معدله 3.50 من 5 بعد 100 ساعة، لو حصل على 5.00 في فصل من 15 ساعة يصبح معدله نحو 3.70 فقط.',
    ],
    sources: [
      { href: 'https://csh.psau.edu.sa/en/calculate-semester-and-cumulative-average', label: 'جامعة الأمير سطام بن عبدالعزيز: حساب المعدل الفصلي والتراكمي' },
    ],
    updated: UPDATED,
  },
  {
    slug: 'dates-ages', icon: 'dates', tint: 'dates', name: 'تواريخ وأعمار', ask: 'كم عمري، وكم بين تاريخين؟',
    shows: ['العمر', 'العمر بالهجري', 'تحويل التاريخ', 'الأيام بين تاريخين'], calcs: ['age', 'hijri-age', 'hijri', 'days-between', 'weeks-to-months'], guides: ['age-in-hijri', 'new-year-2027', 'uae-national-day-2026'],
    seoTitle: 'تواريخ وأعمار: عمرك بالميلادي والهجري والأيام بين تاريخين',
    description: 'اكتب تاريخ ميلادك، واعرف عمرك بالضبط بالميلادي والهجري وموعد عيد ميلادك القادم، وتاريخ اليوم بالهجري، وعدد الأيام بين أي تاريخين.',
    title: 'تواريخ وأعمار: كم عمري؟ وكم بقي؟',
    lead: 'كل حسابات التاريخ في مكان واحد: عمرك بالتقويمين، وتاريخ اليوم بالهجري، والمدة بين تاريخين.',
    example: false,
    fields: [
      { name: 'birth', label: 'تاريخ ميلادك', kind: 'date' },
      { name: 'from', label: 'من تاريخ (اختياري)', kind: 'date', today: true },
      { name: 'to', label: 'إلى تاريخ (اختياري)', kind: 'date' },
    ],
    next: [
      'السنة الهجرية أقصر من الميلادية بنحو 11 يوماً، ولذلك يكون عمرك بالهجري أكبر.',
      'من وُلد في 29 فبراير نعتبر عيد ميلاده 28 فبراير في السنوات غير الكبيسة.',
      'تُحسب التواريخ الهجرية بتقويم أم القرى، وقد يختلف الإعلان الرسمي للأشهر يوماً.',
    ],
    about: [
      'طابقنا مواعيد رمضان والعيد لسنة 1448 مع المرجع السنوي لتقويم أم القرى، ولم نطابق بقية التواريخ يوماً بيوم.',
      'مثال: من وُلد في 1 يناير 1995 يوافق ميلاده 29 رجب 1415 هـ. ولأن السنة الهجرية 354 أو 355 يوماً، فهي أقصر من الميلادية (365 أو 366 يوماً) بنحو 11 يوماً، ويتقدم رمضان كل سنة بهذا القدر تقريباً.',
      'وعند حساب الأيام بين تاريخين، لا نحتسب هنا اليوم الأخير. وفي الحاسبة الكاملة يمكنك احتسابه، ومعرفة الأسابيع وأيام العمل والتاريخ بعد عدد من الأيام.',
    ],
    sources: [
      { href: 'https://www.ummulqura.org.sa/en/annual-reference', label: 'تقويم أم القرى: المرجع السنوي' },
    ],
    updated: UPDATED,
  },
];

export const momentBySlug = (slug: string) => {
  const m = MOMENTS.find((x) => x.slug === slug);
  if (!m) throw new Error(`Unknown moment: ${slug}`);
  return m;
};

/** The starting values of a moment's form. */
export function initialFields(m: Moment, today: string): Record<string, string> {
  return Object.fromEntries(m.fields.map((f) => [f.name, f.today ? today : f.value ?? '']));
}
