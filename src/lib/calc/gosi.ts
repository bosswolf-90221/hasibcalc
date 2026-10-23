import { type CalcResult, Validator, fail, ok, parseISODate } from './core';

/**
 * Saudi GOSI monthly contributions on the contributory wage (basic + housing, SAR 1,500–45,000).
 * Saudis: annuities (pension) + SANED 0.75% each side + occupational hazards 2% on the employer.
 * Annuities: 9% each under the legacy system; for people first registered on/after 3 July 2024
 * (the new Social Insurance Law) it rises 0.5 point a year each side from 1 July 2025 until 11% in July 2028.
 * Non-Saudis: occupational hazards 2% on the employer only.
 */
export type GosiSystem = 'legacy' | 'new';
export type Nationality = 'saudi' | 'non-saudi';
export type GosiInput = { nationality: Nationality; system: GosiSystem; basic: number | null; housing: number | null; other?: number | null; onDate: string };
export type Gosi = {
  wage: number; // contributory wage after min/max
  rawWage: number;
  capped: 'min' | 'max' | null;
  pensionRate: number; // each side, %
  employeeRate: number;
  employerRate: number;
  employee: number;
  employer: number;
  total: number;
  gross: number; // basic + housing + other allowances
  netAfterDeduction: number; // gross − employee share (take-home before any other deductions)
};

export const WAGE_MIN = 1500;
export const WAGE_MAX = 45000;
export const SANED = 0.75;
export const HAZARDS = 2;
export const NEW_SYSTEM_STEPS: [string, number][] = [
  ['2024-07-03', 9],
  ['2025-07-01', 9.5],
  ['2026-07-01', 10],
  ['2027-07-01', 10.5],
  ['2028-07-01', 11],
];

export function pensionRate(system: GosiSystem, onISO: string): number {
  if (system === 'legacy') return 9;
  let r = 9;
  for (const [from, rate] of NEW_SYSTEM_STEPS) if (onISO >= from) r = rate;
  return r;
}

export function calcGosi(input: GosiInput): CalcResult<Gosi> {
  const v = new Validator();
  const basic = v.number('basic', input.basic, { label: 'الراتب الأساسي', min: 0, max: 10_000_000 });
  const housing = v.number('housing', input.housing ?? 0, { label: 'بدل السكن', min: 0, max: 10_000_000 });
  const other = v.number('other', input.other ?? 0, { label: 'البدلات الأخرى', min: 0, max: 10_000_000 });
  if (!parseISODate(input.onDate)) v.add('onDate', 'تاريخ غير صالح');
  if (v.valid && basic + housing <= 0) v.add('basic', 'أدخل الراتب الأساسي');
  if (!v.valid) return fail(v.errors);

  const rawWage = basic + housing;
  const wage = Math.min(WAGE_MAX, Math.max(WAGE_MIN, rawWage));
  const capped = rawWage > WAGE_MAX ? 'max' : rawWage < WAGE_MIN ? 'min' : null;
  const saudi = input.nationality === 'saudi';
  const p = saudi ? pensionRate(input.system, input.onDate) : 0;
  const employeeRate = saudi ? p + SANED : 0;
  const employerRate = saudi ? p + SANED + HAZARDS : HAZARDS;
  const employee = (wage * employeeRate) / 100;
  const employer = (wage * employerRate) / 100;
  return ok({ wage, rawWage, capped, pensionRate: p, employeeRate, employerRate, employee, employer, total: employee + employer, gross: rawWage + other, netAfterDeduction: rawWage + other - employee });
}
