import { type CalcResult, Validator, daysBetween, fail, ok, toISODate } from './core';

/**
 * Calendar estimate of ovulation and the fertile window.
 * Ovulation on cycle day (cycle length − 14), e.g. day 14 of a 28-day cycle; fertile window = the 5 days before ovulation + ovulation day.
 * The current cycle is the one that contains `onDate`, counted forward from the last period in whole cycles.
 */
export type OvulationInput = { lmpDate: string; cycleDays: number | null; periodDays: number | null; onDate: string };
export type Cycle = {
  start: string; // first day of the period
  periodEnd: string;
  fertileStart: string;
  ovulation: string;
  fertileEnd: string; // = ovulation day
  nextStart: string;
};
export type Ovulation = {
  cycleDay: number; // today's day in the current cycle, from 1
  current: Cycle;
  focus: Cycle; // the cycle whose ovulation is today or ahead
  daysToOvulation: number; // from today to focus.ovulation
  daysToNextPeriod: number;
  fertileToday: boolean;
  periodToday: boolean;
  upcoming: Cycle[]; // focus + the next two
};
const DAY = 86_400_000;
const at = (d: Date, n: number) => new Date(d.getTime() + n * DAY);

function cycleFrom(start: Date, cycle: number, period: number): Cycle {
  const ov = at(start, cycle - 15); // cycle day (cycle − 14): day 14 of a 28-day cycle
  return {
    start: toISODate(start),
    periodEnd: toISODate(at(start, period - 1)),
    fertileStart: toISODate(at(ov, -5)),
    ovulation: toISODate(ov),
    fertileEnd: toISODate(ov),
    nextStart: toISODate(at(start, cycle)),
  };
}

export function calcOvulation(input: OvulationInput): CalcResult<Ovulation> {
  const v = new Validator();
  const lmp = v.date('lmpDate', input.lmpDate, 'أول يوم من آخر دورة');
  const on = v.date('onDate', input.onDate, 'تاريخ اليوم');
  const cycle = v.number('cycleDays', input.cycleDays, { label: 'طول الدورة', integer: true, min: 21, max: 45 });
  const period = v.number('periodDays', input.periodDays, { label: 'أيام الدورة', integer: true, min: 2, max: 10 });
  if (lmp && on && lmp > on) v.add('lmpDate', 'التاريخ في المستقبل');
  if (lmp && on && daysBetween(lmp, on) > 366) v.add('lmpDate', 'اختاري تاريخاً خلال السنة الماضية');
  if (!v.valid || !lmp || !on) return fail(v.errors);

  const k = Math.floor(daysBetween(lmp, on) / cycle);
  const currentStart = at(lmp, k * cycle);
  const current = cycleFrom(currentStart, cycle, period);
  const focusStart = toISODate(on) > current.ovulation ? at(currentStart, cycle) : currentStart;
  const upcoming = [0, 1, 2].map((i) => cycleFrom(at(focusStart, i * cycle), cycle, period));
  const focus = upcoming[0];
  const today = toISODate(on);
  return ok({
    cycleDay: daysBetween(currentStart, on) + 1,
    current,
    focus,
    daysToOvulation: daysBetween(on, new Date(focus.ovulation + 'T00:00:00Z')),
    daysToNextPeriod: daysBetween(on, new Date(current.nextStart + 'T00:00:00Z')),
    fertileToday: today >= current.fertileStart && today <= current.fertileEnd,
    periodToday: today <= current.periodEnd,
    upcoming,
  });
}
