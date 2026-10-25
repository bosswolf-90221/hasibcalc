import { type CalcResult, Validator, daysBetween, fail, ok, toISODate } from './core';
import { type HDate, HIJRI_MONTHS, MAX_HIJRI_YEAR, MIN_HIJRI_YEAR, fromHijri, toHijri } from './hijri';
import { calcAge } from './age';

/**
 * Age counted in Umm al-Qura Hijri years, months and days.
 * A birthday on the 30th falls on the 29th in months that have only 29 days.
 */
export type HijriAge = {
  years: number;
  months: number;
  days: number;
  birthHijri: HDate;
  birthGregorian: string; // ISO
  gregorianYears: number;
  gregorianMonths: number;
  totalDays: number;
  nextBirthday: string; // ISO (Gregorian date of the next Hijri birthday)
  nextBirthdayHijriYear: number;
  daysToNextBirthday: number;
  isBirthday: boolean;
};

/** Gregorian date of a Hijri day, moving the 30th back to the 29th when the month is short. */
function anniversary(year: number, month: number, day: number): Date {
  return fromHijri({ year, month, day }) ?? fromHijri({ year, month, day: 29 })!;
}

/** Hijri (year, month) after adding k months. */
function addMonths(year: number, month: number, k: number): [number, number] {
  const idx = year * 12 + (month - 1) + k;
  return [Math.floor(idx / 12), (idx % 12) + 1];
}

function compute(birth: Date, on: Date): HijriAge {
  const b = toHijri(birth);
  const t = toHijri(on);
  let years = t.year - b.year;
  if (anniversary(t.year, b.month, b.day) > on) years--;

  let months = 0;
  while (months < 12) {
    const [y, m] = addMonths(b.year + years, b.month, months + 1);
    if (anniversary(y, m, b.day) > on) break;
    months++;
  }
  const [ay, am] = addMonths(b.year + years, b.month, months);
  const anchor = anniversary(ay, am, b.day);

  let nextYear = t.year;
  let next = anniversary(nextYear, b.month, b.day);
  if (next < on) next = anniversary(++nextYear, b.month, b.day);

  const g = calcAge({ birthDate: toISODate(birth), onDate: toISODate(on) });
  const last = anniversary(b.year + years, b.month, b.day);
  return {
    years,
    months,
    days: daysBetween(anchor, on),
    birthHijri: b,
    birthGregorian: toISODate(birth),
    gregorianYears: g.ok ? g.value.years : 0,
    gregorianMonths: g.ok ? g.value.months : 0,
    totalDays: daysBetween(birth, on),
    nextBirthday: toISODate(next),
    nextBirthdayHijriYear: nextYear,
    daysToNextBirthday: daysBetween(on, next),
    isBirthday: daysBetween(last, on) === 0 && years > 0,
  };
}

/** From a Gregorian birth date. */
export function hijriAgeFromGregorian(input: { birthDate: string; onDate: string }): CalcResult<HijriAge> {
  const v = new Validator();
  const birth = v.date('birthDate', input.birthDate, 'تاريخ الميلاد');
  const on = v.date('onDate', input.onDate, 'تاريخ اليوم');
  if (birth && (birth.getUTCFullYear() < 1924 || birth.getUTCFullYear() > 2076)) v.add('birthDate', 'اختر تاريخاً بين 1924 و2076');
  if (birth && on && birth > on) v.add('birthDate', 'تاريخ الميلاد بعد تاريخ اليوم');
  if (!v.valid || !birth || !on) return fail(v.errors);
  return ok(compute(birth, on));
}

/** From a Hijri birth date (day, month, year). */
export function hijriAgeFromHijri(input: { hDay: number | null; hMonth: number | null; hYear: number | null; onDate: string }): CalcResult<HijriAge> {
  const v = new Validator();
  const y = v.number('hYear', input.hYear, { label: 'سنة الميلاد الهجرية', integer: true, min: MIN_HIJRI_YEAR, max: MAX_HIJRI_YEAR });
  const m = v.number('hMonth', input.hMonth, { label: 'الشهر', integer: true, min: 1, max: 12 });
  const d = v.number('hDay', input.hDay, { label: 'اليوم', integer: true, min: 1, max: 30 });
  const on = v.date('onDate', input.onDate, 'تاريخ اليوم');
  if (!v.valid || !on) return fail(v.errors);
  const birth = fromHijri({ year: y, month: m, day: d });
  if (!birth) return fail([{ field: 'hDay', message: `شهر ${HIJRI_MONTHS[m - 1]} ${y} تسعة وعشرون يوماً فقط` }]);
  if (birth > on) return fail([{ field: 'hYear', message: 'تاريخ الميلاد بعد تاريخ اليوم' }]);
  return ok(compute(birth, on));
}
