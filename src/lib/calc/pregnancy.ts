import { type CalcResult, Validator, daysBetween, fail, ok, toISODate } from './core';

/**
 * Due date by Naegele's rule from the first day of the last menstrual period (LMP):
 * LMP + 280 days, shifted by (cycle length − 28). Gestational age is counted the same way.
 */
export type PregnancyInput = { lmpDate: string; cycleDays: number | null; onDate: string };
export type Pregnancy = {
  dueDate: string;
  weeks: number;
  days: number; // days past the whole weeks
  gestationDays: number;
  daysToDue: number;
  trimester: 1 | 2 | 3;
  conception: string; // estimated
  firstTrimesterEnds: string;
  secondTrimesterEnds: string;
};
const DAY = 86_400_000;

export function calcPregnancy(input: PregnancyInput): CalcResult<Pregnancy> {
  const v = new Validator();
  const lmp = v.date('lmpDate', input.lmpDate, 'تاريخ أول يوم من آخر دورة');
  const on = v.date('onDate', input.onDate, 'تاريخ اليوم');
  const cycle = v.number('cycleDays', input.cycleDays, { label: 'طول الدورة', integer: true, min: 21, max: 45 });
  if (lmp && on && lmp > on) v.add('lmpDate', 'التاريخ في المستقبل');
  if (lmp && on && daysBetween(lmp, on) > 44 * 7) v.add('lmpDate', 'مرّ أكثر من 44 أسبوعاً على هذا التاريخ');
  if (!v.valid || !lmp || !on) return fail(v.errors);

  const shift = cycle - 28;
  const due = new Date(lmp.getTime() + (280 + shift) * DAY);
  const gestationDays = Math.max(0, daysBetween(lmp, on) - shift);
  const weeks = Math.floor(gestationDays / 7);
  const trimester = weeks < 14 ? 1 : weeks < 28 ? 2 : 3;
  const at = (gaDays: number) => toISODate(new Date(lmp.getTime() + (gaDays + shift) * DAY));
  return ok({
    dueDate: toISODate(due),
    weeks,
    days: gestationDays % 7,
    gestationDays,
    daysToDue: daysBetween(on, due),
    trimester,
    conception: at(14),
    firstTrimesterEnds: at(14 * 7 - 1),
    secondTrimesterEnds: at(28 * 7 - 1),
  });
}

/** Pregnancy months by the common week ranges: 1–4, 5–8, 9–13, 14–17, 18–22, 23–27, 28–31, 32–35, 36–40. */
export const MONTH_WEEKS: [number, number][] = [[1, 4], [5, 8], [9, 13], [14, 17], [18, 22], [23, 27], [28, 31], [32, 35], [36, 40]];
/** Month of pregnancy (1–9) for a pregnancy week counted from 1. */
export function pregnancyMonth(week: number): number {
  const i = MONTH_WEEKS.findIndex(([, to]) => week <= to);
  return i === -1 ? 9 : i + 1;
}
