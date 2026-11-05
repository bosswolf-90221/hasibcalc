// What the site can honestly say about each page's rules. Kept apart from `updated`, which is only the
// date the page text last changed. Change `verified` only after the cited sources were actually opened.
//   official : the rules on the page were checked against official sources.
//   partial  : most were checked; what could not be confirmed is stated on the page.
//   math     : plain arithmetic or calendar logic with no legal, religious or medical rule behind it.
export type Basis = 'official' | 'partial' | 'math';
export type Verification = { basis: Basis; verified?: string };

const CHECKED = '2026-11-04';
const official: Verification = { basis: 'official', verified: CHECKED };
const partial: Verification = { basis: 'partial', verified: CHECKED };
const math: Verification = { basis: 'math' };
const partial5Nov: Verification = { basis: 'partial', verified: '2026-11-05' };

export const VERIFICATION: Record<string, Verification> = {
  // calculators
  'end-of-service': partial5Nov, // daily-wage divisor and the base of the two-year cap are not settled by a text
  'annual-leave': partial5Nov, // effect of unpaid absence on accrued leave is not stated
  'exit-dues': partial5Nov,
  vat: official,
  loan: official,
  zakat: partial, // authorities differ on the nisab; combining karats not found in the official statements
  percentage: math,
  discount: math,
  age: math,
  'days-between': math,
  bmi: official,
  calories: partial, // Mifflin-St Jeor is cited; activity factors have no single official source
  pregnancy: official,
  ovulation: partial, // sources differ on sperm survival
  hijri: partial, // Ramadan and Eid 1448 matched the Umm al-Qura reference; not every date was compared
  'hijri-age': partial,
  'salary-day': official,
  'salary-saudi': official,
  'salary-uae': official,
  gosi: partial, // wage floors come from an undated official FAQ
  gpa: official,
  'gpa-target': math,
  // life moments
  'moment:leaving-job': partial,
  'moment:monthly-pay': partial, // no official 2027 salary calendar; GOSI floors from an undated FAQ
  'moment:taking-loan': official,
  'moment:ramadan-zakat': partial,
  'moment:expecting-baby': partial,
  'moment:health-weight': partial,
  'moment:shopping': official,
  'moment:university': official,
  'moment:dates-ages': partial,
  // guides
  'guide:end-of-service-guide': partial5Nov,
  'guide:flat-vs-reducing-interest': official,
  'guide:vat-gulf-guide': partial5Nov, // no official statement found for Kuwait
  'guide:zakat-step-by-step': partial,
  'guide:pregnancy-weeks-months': official,
  'guide:ideal-weight-by-height': official,
  'guide:how-to-calculate-percentage': math,
  'guide:age-in-hijri': partial,
  'guide:ramadan-1448': partial, // sighting decisions are announced later
  'guide:new-year-2027': partial, // 1 Muharram 1449 was not confirmed officially
  'guide:uae-national-day-2026': partial, // no 2026 circular found yet
  'guide:white-friday-2026': math,
};

export const BASIS_LABEL: Record<Basis, string> = {
  official: 'تحققنا من القواعد مقابل مصادرها الرسمية',
  partial: 'تحققنا من أغلب القواعد، وما لم نؤكده مذكور في الصفحة',
  math: 'حساب رياضي لا يعتمد على قاعدة قانونية أو طبية',
};

/** The latest date a page's text changed, separate from when its sources were checked. */
export const TRUST_PAGES_UPDATED = { about: '2026-11-05', privacy: '2026-11-05', terms: '2026-10-17', contact: '2026-11-05' };
