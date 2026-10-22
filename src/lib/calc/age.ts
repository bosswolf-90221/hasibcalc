import { type CalcResult, Validator, clampedDate, daysBetween, fail, ok, toISODate } from './core';

/**
 * Exact age by calendar arithmetic. A 29 February birthday falls on 28 February in non-leap years.
 */
export type AgeInput = { birthDate: string; onDate: string };
export type Age = {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalWeeks: number;
  nextBirthday: string;
  daysToNextBirthday: number;
  isBirthday: boolean;
};

export function calcAge(input: AgeInput): CalcResult<Age> {
  const v = new Validator();
  const birth = v.date('birthDate', input.birthDate, 'تاريخ الميلاد');
  const on = v.date('onDate', input.onDate, 'تاريخ الحساب');
  if (birth && on && birth > on) v.add('birthDate', 'تاريخ الميلاد بعد تاريخ اليوم');
  if (birth && on && on.getUTCFullYear() - birth.getUTCFullYear() > 150) v.add('birthDate', 'تحقق من سنة الميلاد');
  if (!v.valid || !birth || !on) return fail(v.errors);

  const bY = birth.getUTCFullYear(), bM = birth.getUTCMonth(), bD = birth.getUTCDate();
  const anniversary = (year: number) => clampedDate(year, bM, bD);

  let years = on.getUTCFullYear() - bY;
  if (anniversary(on.getUTCFullYear()) > on) years--;
  const lastBirthday = anniversary(bY + years);

  // whole months after the last birthday
  let months = 0;
  while (months < 12 && clampedDate(bY + years, bM + months + 1, bD) <= on) months++;
  const monthAnchor = clampedDate(bY + years, bM + months, bD);
  const days = daysBetween(monthAnchor, on);

  let next = anniversary(on.getUTCFullYear());
  if (next < on) next = anniversary(on.getUTCFullYear() + 1);
  const totalDays = daysBetween(birth, on);

  return ok({
    years,
    months,
    days,
    totalDays,
    totalWeeks: Math.floor(totalDays / 7),
    nextBirthday: toISODate(next),
    daysToNextBirthday: daysBetween(on, next),
    isBirthday: daysBetween(lastBirthday, on) === 0 && totalDays > 0,
  });
}
