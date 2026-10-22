// Long-form guides. Each one answers a searched question and leads to its calculator.
export type Guide = { slug: string; title: string; description: string; calc: string; date: string; minutes: number; kicker: string };

export const GUIDES: Guide[] = [
  { slug: 'ramadan-1448', title: 'متى يبدأ رمضان 1448؟ مواعيد رمضان والعيدين بتقويم أم القرى', description: 'موعد بداية رمضان 1448 هـ وعيد الفطر ويوم عرفة وعيد الأضحى بتقويم أم القرى، ولماذا قد يختلف الإعلان الرسمي يوماً واحداً.', calc: 'hijri', date: '2026-10-21', minutes: 4, kicker: 'التاريخ والوقت' },
  { slug: 'end-of-service-guide', title: 'مكافأة نهاية الخدمة في الإمارات: الدليل الكامل بالأمثلة', description: 'كيف تُحسب مكافأة نهاية الخدمة للقطاع الخاص في الإمارات وفق المادة 51: الأجر اليومي، و21 و30 يوماً، والحد الأعلى، وأمثلة محسوبة.', calc: 'end-of-service', date: '2026-10-21', minutes: 6, kicker: 'المال والعمل' },
  { slug: 'flat-vs-reducing-interest', title: 'الفائدة الثابتة أم المتناقصة؟ الفرق الحقيقي في قسط قرضك', description: 'لماذا تبدو الفائدة الثابتة 4.5% أرخص وهي ليست كذلك؟ مقارنة محسوبة بين الفائدة الثابتة والمتناقصة على قرض 100,000 درهم.', calc: 'loan', date: '2026-10-21', minutes: 5, kicker: 'المال والعمل' },
  { slug: 'vat-gulf-guide', title: 'ضريبة القيمة المضافة في الخليج: النسب وطريقة الحساب', description: 'نسب ضريبة القيمة المضافة في الإمارات والسعودية والبحرين وعُمان، وكيف تضيف الضريبة إلى السعر أو تستخرجها من سعر شامل.', calc: 'vat', date: '2026-10-21', minutes: 4, kicker: 'التسوق والنسب' },
  { slug: 'zakat-step-by-step', title: 'كيف أحسب زكاة مالي؟ خطوة بخطوة مع مثال', description: 'طريقة حساب زكاة المال: النصاب بالذهب، والحول، وما يدخل في الحساب وما يُخصم، مع مثال محسوب بربع العشر.', calc: 'zakat', date: '2026-10-21', minutes: 5, kicker: 'المال والعمل' },
  { slug: 'pregnancy-weeks-months', title: 'أسابيع الحمل بالأشهر: جدول كامل وكيف تحسبينها', description: 'جدول يحوّل أسابيع الحمل إلى أشهر، وكيف يُحسب عمر الحمل من آخر دورة، ومتى يبدأ كل ثلث من أثلاث الحمل.', calc: 'pregnancy', date: '2026-10-21', minutes: 4, kicker: 'الصحة والعمر' },
  { slug: 'ideal-weight-by-height', title: 'الوزن المثالي حسب الطول: جدول للبالغين', description: 'جدول الوزن الطبيعي لكل طول من 150 إلى 190 سم بحسب مؤشر كتلة الجسم، وكيف تحسبه لطولك، ومتى لا يكفي هذا المؤشر وحده.', calc: 'bmi', date: '2026-10-21', minutes: 4, kicker: 'الصحة والعمر' },
  { slug: 'how-to-calculate-percentage', title: 'طريقة حساب النسبة المئوية: ثلاث حالات بأمثلة', description: 'كيف تحسب نسبة من رقم، وكم يمثل رقم من آخر، ونسبة الزيادة أو النقص، مع أمثلة من الراتب والخصومات والدرجات.', calc: 'percentage', date: '2026-10-21', minutes: 4, kicker: 'التسوق والنسب' },
  { slug: 'age-in-hijri', title: 'كيف أحسب عمري بالهجري؟', description: 'لماذا يكون عمرك بالهجري أكبر من عمرك بالميلادي، وكيف تحسبه بدقة من تاريخ ميلادك، مع قاعدة سريعة للتقدير.', calc: 'hijri', date: '2026-10-21', minutes: 3, kicker: 'التاريخ والوقت' },
];
export const guideBySlug = (s: string) => GUIDES.find((g) => g.slug === s)!;
