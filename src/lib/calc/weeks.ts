import { type CalcResult, Validator, clampedDate, daysBetween, fail, ok, toISODate } from './core';
import { pregnancyMonth } from './pregnancy';

/**
 * Weeks ↔ months. Plain calendar arithmetic, no legal or medical rule behind it.
 * A week is 7 days. The average Gregorian month is 365.2425 ÷ 12 = 30.436875 days
 * (the Gregorian calendar repeats every 400 years with 97 leap years: 146,097 days ÷ 4,800 months).
 * Because real months are 28–31 days, we also count whole calendar months from a start date.
 */
export const AVG_MONTH_DAYS = 365.2425 / 12;
export const AVG_YEAR_DAYS = 365.2425;

export type WeeksUnit = 'weeks' | 'months';
export type WeeksInput = { amount: number | null; unit: WeeksUnit; startDate: string };
export type WeeksResult = {
  unit: WeeksUnit;
  amount: number;
  days: number; // exact for weeks; average-month days for months
  weeks: number;
  months: number; // by the average month
  years: number;
  endDate: string; // start + the span on the calendar
  calMonths: number; // whole calendar months from start to end
  calRemainderDays: number;
  pregnancyMonth: number | null; // for 1–42 whole weeks only
};

export function calcWeeks(input: WeeksInput): CalcResult<WeeksResult> {
  const v = new Validator();
  const isWeeks = input.unit === 'weeks';
  const amount = v.number('amount', input.amount, isWeeks
    ? { min: 0, max: 5200, label: 'عدد الأسابيع' }
    : { min: 0, max: 1200, label: 'عدد الأشهر' });
  const start = v.date('startDate', input.startDate, 'تاريخ البداية');
  if (!v.valid || !start) return fail(v.errors);

  let days: number;
  let end: Date;
  if (isWeeks) {
    days = amount * 7;
    end = new Date(start.getTime() + Math.round(days) * 86_400_000);
  } else if (Number.isInteger(amount)) {
    end = clampedDate(start.getUTCFullYear(), start.getUTCMonth() + amount, start.getUTCDate());
    days = amount * AVG_MONTH_DAYS;
  } else {
    days = amount * AVG_MONTH_DAYS;
    end = new Date(start.getTime() + Math.round(days) * 86_400_000);
  }

  let calMonths = 0;
  while (clampedDate(start.getUTCFullYear(), start.getUTCMonth() + calMonths + 1, start.getUTCDate()) <= end) calMonths++;
  const anchor = clampedDate(start.getUTCFullYear(), start.getUTCMonth() + calMonths, start.getUTCDate());

  return ok({
    unit: input.unit,
    amount,
    days,
    weeks: days / 7,
    months: days / AVG_MONTH_DAYS,
    years: days / AVG_YEAR_DAYS,
    endDate: toISODate(end),
    calMonths,
    calRemainderDays: daysBetween(anchor, end),
    pregnancyMonth: isWeeks && Number.isInteger(amount) && amount >= 1 && amount <= 42 ? pregnancyMonth(amount) : null,
  });
}
