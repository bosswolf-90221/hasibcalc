import { type CalcResult, Validator, clampedDate, daysBetween, fail, ok, toISODate } from './core';

/**
 * UAE private-sector annual leave balance and its cash value on leaving.
 * Source: Federal Decree-Law No. 33 of 2021, Article 29, as summarised by u.ae:
 *  - Under 6 months of service: no annual leave.
 *  - 6 months to 1 year: 2 days for each complete month.
 *  - After 1 year: 30 days a year (a contract may give more, never less); the last part-year is pro rata.
 *  - Unused days are paid on leaving, on the basic wage.
 * Daily wage: basic ÷ 30 (common practice) or basic × 12 ÷ 365; the law does not fix the divisor.
 * Taken days are all leave days used over the whole service, so carried-over days are already in the balance.
 */
export type LeaveInput = {
  salary: number | null;
  startDate: string;
  endDate: string;
  annualDays: number | null;
  takenDays: number | null;
  divisor: '30' | '365';
};
export type LeaveYear = { n: number; from: string; to: string; earned: number; partial: boolean };
export type Leave = {
  months: number; // complete months of service
  extraDays: number; // days after the last complete month
  fullYears: number;
  eligible: boolean; // at least 6 complete months
  entitled: number; // leave days earned over the whole service
  taken: number;
  remaining: number; // never below 0
  overdrawn: number; // days taken beyond the balance
  dailyWage: number;
  amount: number;
  years: LeaveYear[];
};
const DAY = 86_400_000;
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Add whole months to a date, clamping the day (31 Jan + 1 month = 28/29 Feb). */
function addMonths(d: Date, m: number): Date {
  const t = d.getUTCMonth() + m;
  return clampedDate(d.getUTCFullYear() + Math.floor(t / 12), ((t % 12) + 12) % 12, d.getUTCDate());
}

export function calcLeave(input: LeaveInput): CalcResult<Leave> {
  const v = new Validator();
  const salary = v.number('salary', input.salary, { min: 0, max: 10_000_000, label: 'الراتب الأساسي' });
  const annual = v.number('annualDays', input.annualDays, { integer: true, min: 30, max: 90, label: 'أيام الإجازة في السنة' });
  const taken = v.number('takenDays', input.takenDays ?? 0, { min: 0, max: 5000, label: 'الأيام التي أخذتها' });
  const start = v.date('startDate', input.startDate, 'تاريخ بداية العمل');
  const end = v.date('endDate', input.endDate, 'تاريخ نهاية العمل');
  if (start && end && end < start) v.add('endDate', 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
  if (start && end && daysBetween(start, end) > 50 * 366) v.add('startDate', 'مدة الخدمة أطول من 50 سنة');
  if (!v.valid || !start || !end) return fail(v.errors);

  // Service runs to the end of the last working day.
  const after = new Date(end.getTime() + DAY);
  let months = (after.getUTCFullYear() - start.getUTCFullYear()) * 12 + after.getUTCMonth() - start.getUTCMonth();
  while (months > 0 && addMonths(start, months) > after) months--;
  const extraDays = daysBetween(addMonths(start, months), after);
  const fullYears = Math.floor(months / 12);
  const eligible = months >= 6;

  const years: LeaveYear[] = [];
  const row = (n: number, from: Date, to: Date, earned: number, partial: boolean) =>
    years.push({ n, from: toISODate(from), to: toISODate(to), earned: r2(earned), partial });
  let entitled = 0;
  if (fullYears === 0) {
    // First year: 2 days per complete month, scaled if the contract gives more than 30 days.
    entitled = eligible ? months * 2 * (annual / 30) : 0;
    row(1, start, end, entitled, true);
  } else {
    for (let i = 0; i < fullYears; i++) row(i + 1, addMonths(start, i * 12), new Date(addMonths(start, (i + 1) * 12).getTime() - DAY), annual, false);
    const restMonths = months - fullYears * 12;
    const part = restMonths * (annual / 12) + extraDays * (annual / 365);
    if (restMonths > 0 || extraDays > 0) row(fullYears + 1, addMonths(start, fullYears * 12), end, part, true);
    entitled = fullYears * annual + part;
  }
  entitled = r2(entitled);
  const remaining = r2(Math.max(0, entitled - taken));
  const overdrawn = r2(Math.max(0, taken - entitled));
  const dailyWage = input.divisor === '365' ? (salary * 12) / 365 : salary / 30;
  return ok({ months, extraDays, fullYears, eligible, entitled, taken, remaining, overdrawn, dailyWage, amount: r2(remaining * dailyWage), years });
}
