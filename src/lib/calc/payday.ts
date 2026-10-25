import { type CalcResult, Validator, clampedDate, daysBetween, fail, ok, toISODate } from './core';
import { WEEKDAYS } from './hijri';

/**
 * Next salary day for a fixed day of the Gregorian month.
 * Day 31 in a 30-day month (or 29–31 in February) becomes the month's last day.
 * If the day falls on the weekend, it can move to the working day before or after it.
 * Public holidays are not known in advance and are not considered.
 */
export type Weekend = 'fri-sat' | 'sat-sun';
export type ShiftRule = 'before' | 'after' | 'none';
export type PaydayInput = { payDay: number | null; weekend: Weekend; rule: ShiftRule; onDate: string };
export type Payday = { nominal: string; actual: string; weekday: string; shifted: boolean };
export type PaydayResult = {
  next: Payday;
  daysLeft: number;
  isToday: boolean;
  upcoming: Payday[]; // the next 12, starting with `next`
};

const OFF: Record<Weekend, number[]> = { 'fri-sat': [5, 6], 'sat-sun': [6, 0] };

function payFor(year: number, month: number, day: number, weekend: Weekend, rule: ShiftRule): Payday {
  const nominal = clampedDate(year, month, day);
  let actual = nominal;
  if (rule !== 'none') {
    const step = rule === 'before' ? -1 : 1;
    while (OFF[weekend].includes(actual.getUTCDay())) actual = new Date(actual.getTime() + step * 86_400_000);
  }
  return { nominal: toISODate(nominal), actual: toISODate(actual), weekday: WEEKDAYS[actual.getUTCDay()], shifted: actual.getTime() !== nominal.getTime() };
}

export function calcPayday(input: PaydayInput): CalcResult<PaydayResult> {
  const v = new Validator();
  const day = v.number('payDay', input.payDay, { label: 'يوم الراتب', integer: true, min: 1, max: 31 });
  const on = v.date('onDate', input.onDate, 'تاريخ اليوم');
  if (!v.valid || !on) return fail(v.errors);

  // Start one month back: a salary moved "after" the weekend can land in the next month.
  const y = on.getUTCFullYear();
  const m = on.getUTCMonth();
  const list: Payday[] = [];
  for (let k = -1; list.length < 12 && k < 15; k++) {
    const p = payFor(y, m + k, day, input.weekend, input.rule);
    if (p.actual >= toISODate(on)) list.push(p);
  }
  const next = list[0];
  const left = daysBetween(on, new Date(next.actual + 'T00:00:00Z'));
  return ok({ next, daysLeft: left, isToday: left === 0, upcoming: list });
}
