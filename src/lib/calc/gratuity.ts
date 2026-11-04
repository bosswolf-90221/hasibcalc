import { type CalcResult, Validator, daysBetween, fail, ok } from './core';

/**
 * UAE private-sector end-of-service gratuity (foreign full-time workers).
 * Source: Federal Decree-Law No. 33 of 2021, Article 51, as summarised by the UAE government portal.
 *  - No gratuity before one year of continuous service.
 *  - 21 days' basic wage per year for the first five years, 30 days per year after.
 *  - Fractions of a year are paid pro rata once one year is completed.
 *  - Unpaid absence days are excluded from the service period.
 *  - Total may not exceed two years' wage (taken here as 24 × monthly basic).
 * Year and month: Article 67 counts a Gregorian year as 365 days and a month as 30 days.
 * Daily wage: monthly basic ÷ 30. No article states this for monthly-paid workers; it is inferred from Article 67.
 * Cap: Article 51(6) says two years' wage and does not say basic; applying it to basic is an assumption, disclosed on the page.
 */
export type GratuityInput = {
  basicSalary: number | null;
  startDate: string;
  endDate: string;
  unpaidAbsenceDays?: number | null;
};

export type Gratuity = {
  totalDays: number; // calendar days from start to end, inclusive
  serviceDays: number; // after removing unpaid absence
  serviceYears: number; // serviceDays / 365
  eligible: boolean;
  dailyWage: number;
  tier1Years: number;
  tier2Years: number;
  tier1Amount: number;
  tier2Amount: number;
  uncapped: number;
  cap: number;
  capped: boolean;
  total: number;
};

export const DAYS_PER_YEAR = 365;
export const DAILY_DIVISOR = 30;

export function calcGratuity(input: GratuityInput): CalcResult<Gratuity> {
  const v = new Validator();
  const salary = v.number('basicSalary', input.basicSalary, { min: 0, max: 10_000_000, label: 'الراتب الأساسي' });
  const absence = v.number('unpaidAbsenceDays', input.unpaidAbsenceDays ?? 0, { min: 0, integer: true, label: 'أيام الغياب بدون أجر' });
  const start = v.date('startDate', input.startDate, 'تاريخ بداية العمل');
  const end = v.date('endDate', input.endDate, 'تاريخ نهاية العمل');
  if (start && end && end < start) v.add('endDate', 'تاريخ نهاية العمل يجب أن يكون بعد تاريخ البداية');
  if (!v.valid || !start || !end) return fail(v.errors);

  const totalDays = daysBetween(start, end) + 1;
  if (absence > totalDays) return fail([{ field: 'unpaidAbsenceDays', message: 'أيام الغياب أكثر من مدة العمل نفسها' }]);

  const serviceDays = totalDays - absence;
  const serviceYears = serviceDays / DAYS_PER_YEAR;
  const dailyWage = salary / DAILY_DIVISOR;
  // One year of service = 365 days (Article 67), counted after removing unpaid absence.
  const eligible = serviceDays >= DAYS_PER_YEAR;

  const tier1Years = eligible ? Math.min(serviceYears, 5) : 0;
  const tier2Years = eligible ? Math.max(0, serviceYears - 5) : 0;
  const tier1Amount = tier1Years * 21 * dailyWage;
  const tier2Amount = tier2Years * 30 * dailyWage;
  const uncapped = tier1Amount + tier2Amount;
  const cap = salary * 24;
  const capped = uncapped > cap;
  const total = Math.min(uncapped, cap);

  return ok({ totalDays, serviceDays, serviceYears, eligible, dailyWage, tier1Years, tier2Years, tier1Amount, tier2Amount, uncapped, cap, capped, total });
}
