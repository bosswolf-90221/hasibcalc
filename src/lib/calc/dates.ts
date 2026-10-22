import { type CalcResult, Validator, clampedDate, daysBetween, fail, ok } from './core';

/** Days between two dates, with whole weeks/months and working days for a chosen weekend. */
export type Weekend = 'sat-sun' | 'fri-sat';
export type DatesInput = { startDate: string; endDate: string; includeEnd: boolean; weekend: Weekend };
export type DateSpan = {
  days: number; // counted days (inclusive of end if asked)
  weeks: number;
  weekRemainder: number;
  months: number; // whole calendar months
  monthRemainderDays: number;
  workingDays: number;
  weekendDays: number;
  reversed: boolean;
};

const WEEKEND: Record<Weekend, number[]> = { 'sat-sun': [6, 0], 'fri-sat': [5, 6] };

export function calcDateSpan(input: DatesInput): CalcResult<DateSpan> {
  const v = new Validator();
  let a = v.date('startDate', input.startDate, 'تاريخ البداية');
  let b = v.date('endDate', input.endDate, 'تاريخ النهاية');
  if (a && b && Math.abs(b.getUTCFullYear() - a.getUTCFullYear()) > 200) v.add('endDate', 'المدة أطول من 200 سنة');
  if (!v.valid || !a || !b) return fail(v.errors);
  const reversed = b < a;
  if (reversed) [a, b] = [b, a];

  const raw = daysBetween(a, b);
  const days = raw + (input.includeEnd ? 1 : 0);

  // whole calendar months from a
  let months = 0;
  while (clampedDate(a.getUTCFullYear(), a.getUTCMonth() + months + 1, a.getUTCDate()) <= b) months++;
  const anchor = clampedDate(a.getUTCFullYear(), a.getUTCMonth() + months, a.getUTCDate());
  const monthRemainderDays = daysBetween(anchor, b) + (input.includeEnd ? 1 : 0);

  // weekend days in the counted range: full weeks contribute 2 each, then the tail
  const off = WEEKEND[input.weekend];
  const full = Math.floor(days / 7);
  let weekendDays = full * 2;
  const startDow = a.getUTCDay();
  for (let i = full * 7; i < days; i++) if (off.includes((startDow + i) % 7)) weekendDays++;

  return ok({
    days,
    weeks: Math.floor(days / 7),
    weekRemainder: days % 7,
    months,
    monthRemainderDays,
    workingDays: days - weekendDays,
    weekendDays,
    reversed,
  });
}
