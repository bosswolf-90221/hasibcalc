import { type CalcResult, fail, ok } from './core';
import { type Gratuity, calcGratuity } from './gratuity';
import { type Leave, calcLeave } from './annual-leave';

/**
 * UAE private-sector dues on leaving a job: end-of-service gratuity + cash value of unused annual leave.
 * Both parts are computed by the existing calculators, so the rules and their sources are exactly theirs:
 *  - gratuity: Federal Decree-Law No. 33 of 2021, Article 51 (u.ae);
 *  - annual leave: Article 29 (u.ae), 30 days a year, paid on the basic wage, daily wage = basic ÷ 30.
 * Not included on purpose: last month's wage, notice pay, tickets and overtime, which depend on the contract.
 */
export type DuesInput = {
  basicSalary: number | null;
  startDate: string;
  endDate: string;
  unpaidAbsenceDays: number | null;
  takenDays: number | null;
};
export type Dues = { gratuity: Gratuity; leave: Leave; total: number; gratuityShare: number };

export function calcDues(input: DuesInput): CalcResult<Dues> {
  const g = calcGratuity({ basicSalary: input.basicSalary, startDate: input.startDate, endDate: input.endDate, unpaidAbsenceDays: input.unpaidAbsenceDays ?? 0 });
  if (!g.ok) return fail(g.errors);
  const l = calcLeave({ salary: input.basicSalary, startDate: input.startDate, endDate: input.endDate, annualDays: 30, takenDays: input.takenDays ?? 0, divisor: '30' });
  if (!l.ok) return fail(l.errors.map((e) => (e.field === 'salary' ? { ...e, field: 'basicSalary' } : e)));
  const total = Math.round((g.value.total + l.value.amount) * 100) / 100;
  const gratuityShare = total > 0 ? g.value.total / total : 0;
  return ok({ gratuity: g.value, leave: l.value, total, gratuityShare });
}
