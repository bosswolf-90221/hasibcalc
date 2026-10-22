import { type CalcResult, Validator, fail, ok, toISODate } from './core';

/**
 * Gregorian ↔ Hijri (Umm al-Qura) using the browser/Node ICU calendar `islamic-umalqura`.
 * Umm al-Qura is the official tabular-astronomical calendar of Saudi Arabia; actual month starts
 * announced by moon sighting may differ by a day.
 */
export const HIJRI_MONTHS = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
export const WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
export const MIN_HIJRI_YEAR = 1343; // ≈ 1924
export const MAX_HIJRI_YEAR = 1500; // ≈ 2077

export type HDate = { year: number; month: number; day: number };
export type Conversion = {
  gregorian: string; // ISO
  hijri: HDate;
  weekday: string;
  hijriMonthLength: number;
};

const fmtH = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric' });

export function toHijri(d: Date): HDate {
  const parts = fmtH.formatToParts(d);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value.replace(/\D/g, ''));
  return { year: get('year'), month: get('month'), day: get('day') };
}

const approx = (h: HDate) => (h.year - 1) * 354.36667 + (h.month - 1) * 29.5306 + (h.day - 1);
const HIJRI_EPOCH = Date.UTC(622, 6, 19); // 1 Muharram 1 (civil), only a starting guess

/** Gregorian date for a Hijri date, or null if that day doesn't exist (e.g. 30th of a 29-day month). */
export function fromHijri(h: HDate): Date | null {
  let t = HIJRI_EPOCH + Math.round(approx(h)) * 86_400_000;
  for (let i = 0; i < 8; i++) {
    const cur = toHijri(new Date(t));
    const diff = Math.round(approx(h) - approx(cur));
    if (diff === 0) break;
    t += diff * 86_400_000;
  }
  for (let k = -3; k <= 3; k++) {
    const d = new Date(t + k * 86_400_000);
    const c = toHijri(d);
    if (c.year === h.year && c.month === h.month && c.day === h.day) return d;
  }
  return null;
}

export function hijriMonthLength(year: number, month: number): number {
  return fromHijri({ year, month, day: 30 }) ? 30 : 29;
}

function describe(d: Date): Conversion {
  const h = toHijri(d);
  return { gregorian: toISODate(d), hijri: h, weekday: WEEKDAYS[d.getUTCDay()], hijriMonthLength: hijriMonthLength(h.year, h.month) };
}

export function gregorianToHijri(input: { date: string }): CalcResult<Conversion> {
  const v = new Validator();
  const d = v.date('date', input.date, 'التاريخ الميلادي');
  if (d && (d.getUTCFullYear() < 1924 || d.getUTCFullYear() > 2076)) v.add('date', 'اختر تاريخاً بين 1924 و2076');
  if (!v.valid || !d) return fail(v.errors);
  return ok(describe(d));
}

export function hijriToGregorian(input: { hYear: number | null; hMonth: number | null; hDay: number | null }): CalcResult<Conversion> {
  const v = new Validator();
  const y = v.number('hYear', input.hYear, { label: 'السنة الهجرية', integer: true, min: MIN_HIJRI_YEAR, max: MAX_HIJRI_YEAR });
  const m = v.number('hMonth', input.hMonth, { label: 'الشهر', integer: true, min: 1, max: 12 });
  const dd = v.number('hDay', input.hDay, { label: 'اليوم', integer: true, min: 1, max: 30 });
  if (!v.valid) return fail(v.errors);
  const d = fromHijri({ year: y, month: m, day: dd });
  if (!d) return fail([{ field: 'hDay', message: `شهر ${HIJRI_MONTHS[m - 1]} ${y} تسعة وعشرون يوماً فقط` }]);
  return ok(describe(d));
}

