# حاسِب — دليل العمل على المستودع

اقرأ هذا الملف كاملاً قبل أي تعديل. هو المرجع لمكان كل ملف وطريقة العمل، وتقرؤه المتابعة اليومية المجدولة («متابعة حاسِب اليومية») وأي محادثة تعمل على الموقع.

## الموقع والمالك
- https://hasibcalc.com — حاسبات وأدلة عربية مجانية، الهدف أرباح Google AdSense.
- المالك: تركي (توقيت دبي). **كل نصوص الموقع بالفصحى**، والتقارير والمنشورات المكتوبة له بالفصحى البسيطة لا بالعامية. التقديرات الجامعية بالحروف الإنجليزية (A+, B, C).
- منفصل تماماً عن DayReckon وTickedCodes وربحة؛ لا تخلطها ولا تلمسها.

## النشر
- `git push origin HEAD:main` ← Cloudflare Pages (المشروع hasibcalc) يبني `npm run build` وينشر `dist/` خلال ~85 ثانية. لا staging. لا `--force` أبداً.
- متغيرات البناء العامة في `.env.production` (لا تعدّلها): PUBLIC_SITE_URL، PUBLIC_ADS_ENABLED=true، PUBLIC_ADSENSE_CLIENT_ID. Node 22 (`.node-version`).
- `netlify.toml` من الاستضافة القديمة؛ Netlify متوقف.
- `public/_headers` رؤوس HTTP، و`public/og/` صور المشاركة لكل صفحة.

## خريطة الملفات: أين يذهب كل شيء
| ماذا | أين |
| --- | --- |
| بيانات كل حاسبة (العنوان، الوصف، التصنيف، كلمات البحث، الروابط ذات الصلة، تاريخ التحديث) والتصنيفات | `src/data/calculators.ts` (`CALCULATORS`، `CATEGORIES`) |
| بيانات الأدلة | `src/data/guides.ts` (`GUIDES`) |
| معادلات الحساب (TypeScript خالص، بلا DOM) | `src/lib/calc/<slug>.ts` — تستخدم `Validator` و`ok/fail` من `core.ts` |
| تحويل النتيجة إلى بطاقة النتيجة (View) | `src/lib/views.ts` (القديمة) و`src/lib/views-extra.ts` (الجديدة: أضف هنا) |
| الجداول والرسوم تحت النتيجة (HTML نصي) | `src/lib/exhibits.ts` و`src/lib/exhibits-extra.ts` (أضف هنا) |
| تنسيق الأرقام والتواريخ العربية | `src/lib/format.ts` (`money`، `int`، `arDate`، `days`، `months`، `years`) |
| صفحة الحاسبة | `src/pages/<slug>.astro` بـ `CalcLayout slug="<slug>"` |
| صفحة الدليل | `src/pages/guides/<slug>.astro` بـ `GuideLayout slug="<slug>"` |
| صفحات التصنيف | `src/pages/category/[key].astro` (تلقائية من CATEGORIES) |
| خريطة الموقع وrobots وads.txt | `src/pages/sitemap.xml.ts`، `robots.txt.ts`، `ads.txt.ts` (تلقائية؛ lastmod من حقل `updated`) |
| مكونات الحقول | `src/components/NumIn.astro`، `DateIn.astro`، `SelIn.astro`، `Pills.astro`، `FieldErrors.astro` |
| بطاقة النتيجة وأزرارها (واتساب، نسخ، تصفير) | `src/components/ResultCard.astro` (`sensitive` لنتائج المال والصحة: واتساب يشارك السؤال فقط) |
| الأسئلة الشائعة مع FAQPage JSON-LD | `src/components/Faq.astro` |
| عدّاد المناسبات وعدّاد الراتب | `src/components/Countdown.astro`، `SalaryDayCalc.astro` |
| بطاقات الحاسبات والرمز في كل بطاقة | `src/components/CalcIndex.astro` (`GLYPH`) |
| القوالب العامة (meta، OG، JSON-LD، التنقل) | `src/layouts/Base.astro`، `CalcLayout.astro`، `GuideLayout.astro` |
| تشغيل الحاسبة في المتصفح (قراءة الحقول، روابط URL، المشاركة) | `src/scripts/runtime.ts` (`mountCalculator`، `num`) |
| الأنماط | `src/styles/global.css` (+ `<style>` محلي في الصفحة عند الحاجة؛ استخدم `:global()` لعناصر المكونات الفرعية) |
| إعدادات الموقع وتاريخ المراجعة العام | `src/config/site.ts` |
| اختبارات المعادلات | `tests/*.test.ts` (الجديدة في `tests/new.test.ts`) |
| فحص التفاعل في المتصفح | `scripts/interaction_test.py` |
| فحص كل صفحات dist (عناوين، أوصاف، canonical، H1، روابط، sitemap) | `scripts/check-site.mjs` |
| صور OG | `scripts/og-data.ts` + `scripts/og.py` ← `public/og/<slug>.png` و`g-<slug>.png` |
| لقطات الشاشة للمراجعة | `scripts/shots.py <مجلد>` (لا ترفع اللقطات؛ `/shots/` في .gitignore) |
| قواعد التصميم | `.claude/skills/frontend-design/SKILL.md` |

## إضافة حاسبة جديدة (الخطوات بالترتيب)
1. `src/lib/calc/<slug>.ts`: المعادلة مع التحقق من المدخلات، وتعليق في الأعلى بالمصدر الرسمي.
2. View في `src/lib/views-extra.ts` وجدول في `src/lib/exhibits-extra.ts` إن لزم.
3. مدخل في `CALCULATORS` (question = H1 كما يسأل الناس، seoTitle، description 120–160 حرفاً، categories، terms، related، updated = اليوم). أضف رمزاً في `GLYPH` إن أردت.
4. `src/pages/<slug>.astro`: الجملة بالحقول، `ResultCard`، الجدول، ثم المقال: جواب مختصر أعلى المقال، شرح، مثال محسوب، أسئلة شائعة، «المصادر».
5. اختبارات في `tests/new.test.ts`، وفحص في `scripts/interaction_test.py`.
6. اربطها من صفحة قريبة (related أو فقرة في المقال).
7. صور OG، ثم الفحص الكامل أدناه.

## الفحص قبل أي push (إلزامي)
```bash
npx vitest run
npx vite-node scripts/og-data.ts > /tmp/og.json && python3 scripts/og.py /tmp/og.json   # إذا تغيّر عنوان أو أضيفت صفحة
npm run build
npx astro preview --port 4321 &          # في الخلفية
python3 scripts/interaction_test.py
set -a; . ./.env.production; set +a; node scripts/check-site.mjs
```
ثم لقطة Playwright بعرض 390px للصفحة المعدّلة: لا تمرير أفقي، ولا نص متداخل، ولا رموز مقلوبة. انتبه إلى أن الخلايا التي تحمل `class="num"` تُعرض LTR، فلا تضع فيها نصاً عربياً مختلطاً مثل «1 إلى 4» أو «سنة 39».

## قواعد المحتوى
- أي قاعدة قانونية أو مالية أو صحية تأتي من مصدر رسمي تفتحه بنفسك (جهة حكومية، جامعة، هيئة صحية)، ويوضع رابطه في «المصادر». بلا مصدر رسمي لا تُنشر. لا تنسخ من مواقع الحاسبات الأخرى.
- تحقق من كل رقم في الأمثلة بتشغيل الحساب.
- صفحات الصحة: تنبيه «للمعلومات العامة»، وسطر `src-note` يوضح أن المراجعة ليست طبية مع رابط /about/.
- لا تحذف صفحات قائمة ولا تغيّر روابطها (slug). لا تغيّر كود الإعلانات ولا ads.txt.

## الحسابات والأدوات الخارجية (قراءة إلا ما ذُكر)
- Search Console: sc-domain:hasibcalc.com. طلب الفهرسة من مربع «فحص أي عنوان URL» أعلى «نظرة عامة» (الرابط المباشر للفحص يرجع 404).
- AdSense: pub-3721992325219610، الحالة على https://adsense.google.com/adsense/u/0/pub-3721992325219610/sites/list.
- Cloudflare: الحساب bb36cea73f3c412ee1f4b17e683dabea، Web Analytics وCrawler Hints مفعّلان. Bing Webmaster مضاف.
- الدومين: Hostinger، يتجدد 2027-10-21.
- لا تسجّل الدخول ولا تُدخل كلمات مرور، ولا تغيّر إعدادات هذه الحسابات، ولا تنشر باسم تركي في حسوب أو كورا إلا بعد موافقته في محادثة.

## السجل
- سجل العمل اليومي في مشروع claude.ai: `claude/hasib-daily-log.md` (اقرأه قبل البدء، وأضف سطراً في النهاية بعد إعادة قراءته).
- الحالة المختصرة لآخر تحديث لهذا الملف: 21 حاسبة، 12 دليلاً، 5 تصنيفات (money، shopping، health-age، dates، study)؛ آخر commit عند الكتابة fc23aed (27 أكتوبر 2026).
