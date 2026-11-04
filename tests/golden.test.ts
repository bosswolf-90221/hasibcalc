// Golden results: the exact output of every calculator for fixed inputs, recorded before the redesign.
// A failure here means a calculation changed. If the change is intended, it must be listed with its
// reason and source in FORMULA_CHANGES.md, and only then may tests/baseline/golden.json be updated (vitest -u).
import { expect, test } from 'vitest';
import { calcAge } from '../src/lib/calc/age';
import { calcLeave } from '../src/lib/calc/annual-leave';
import { calcBmi } from '../src/lib/calc/bmi';
import { calcCalories } from '../src/lib/calc/calories';
import { toNumber } from '../src/lib/calc/core';
import { calcDateSpan } from '../src/lib/calc/dates';
import { calcDiscount } from '../src/lib/calc/discount';
import { calcDues } from '../src/lib/calc/exit-dues';
import { calcGosi } from '../src/lib/calc/gosi';
import { calcGpa } from '../src/lib/calc/gpa';
import { calcGpaTarget } from '../src/lib/calc/gpa-target';
import { calcGratuity } from '../src/lib/calc/gratuity';
import { gregorianToHijri, hijriToGregorian } from '../src/lib/calc/hijri';
import { hijriAgeFromGregorian, hijriAgeFromHijri } from '../src/lib/calc/hijri-age';
import { calcLoan } from '../src/lib/calc/loan';
import { calcOvulation } from '../src/lib/calc/ovulation';
import { calcPayday } from '../src/lib/calc/payday';
import { percentChange, percentOf, whatPercent } from '../src/lib/calc/percentage';
import { calcPregnancy } from '../src/lib/calc/pregnancy';
import { calcVat } from '../src/lib/calc/vat';
import { calcZakat } from '../src/lib/calc/zakat';

const ON = '2026-11-04';
const C = (...x: [string, number | null][]) => x.map(([grade, hours]) => ({ grade, hours }));

const CASES: Record<string, () => unknown> = {
  'number: thousands': () => toNumber('8,000'),
  'number: comma decimal (known issue, audit)': () => toNumber('8000,50'),
  'number: short comma (known issue, audit)': () => toNumber('3,5'),
  'number: arabic digits': () => toNumber('٨٠٠٠٫٥'),
  'number: empty': () => toNumber(''),
  'number: text': () => toNumber('abc'),

  'gratuity: 7.7 years': () => calcGratuity({ basicSalary: 8000, startDate: '2019-03-01', endDate: ON }),
  'gratuity: exactly 5 calendar years': () => calcGratuity({ basicSalary: 6000, startDate: '2020-01-01', endDate: '2024-12-31' }),
  'gratuity: under one year': () => calcGratuity({ basicSalary: 8000, startDate: '2026-01-01', endDate: ON }),
  'gratuity: first anniversary': () => calcGratuity({ basicSalary: 5000, startDate: '2024-02-29', endDate: '2025-02-28' }),
  'gratuity: with absence': () => calcGratuity({ basicSalary: 7000, startDate: '2022-04-01', endDate: '2025-09-30', unpaidAbsenceDays: 30 }),
  'gratuity: capped': () => calcGratuity({ basicSalary: 10000, startDate: '1990-01-01', endDate: ON }),
  'gratuity: end before start': () => calcGratuity({ basicSalary: 8000, startDate: ON, endDate: '2020-01-01' }),
  'gratuity: empty salary': () => calcGratuity({ basicSalary: null, startDate: '2020-01-01', endDate: ON }),

  'leave: first year': () => calcLeave({ salary: 6000, startDate: '2026-02-01', endDate: ON, annualDays: 30, takenDays: 0, divisor: '30' }),
  'leave: several years': () => calcLeave({ salary: 9000, startDate: '2021-05-10', endDate: ON, annualDays: 30, takenDays: 40, divisor: '30' }),
  'leave: 365 divisor': () => calcLeave({ salary: 9000, startDate: '2021-05-10', endDate: ON, annualDays: 30, takenDays: 40, divisor: '365' }),
  'dues: typical': () => calcDues({ basicSalary: 8000, startDate: '2019-03-01', endDate: ON, unpaidAbsenceDays: 0, takenDays: 120 }),
  'dues: absence': () => calcDues({ basicSalary: 8000, startDate: '2019-03-01', endDate: ON, unpaidAbsenceDays: 100, takenDays: 0 }),

  'gosi: saudi new': () => calcGosi({ nationality: 'saudi', system: 'new', basic: 8000, housing: 2000, other: 500, onDate: ON }),
  'gosi: saudi legacy': () => calcGosi({ nationality: 'saudi', system: 'legacy', basic: 8000, housing: 2000, other: 0, onDate: ON }),
  'gosi: saudi new July 2027': () => calcGosi({ nationality: 'saudi', system: 'new', basic: 8000, housing: 2000, other: 0, onDate: '2027-07-01' }),
  'gosi: non-saudi': () => calcGosi({ nationality: 'non-saudi', system: 'new', basic: 5000, housing: 1000, other: 0, onDate: ON }),
  'gosi: non-saudi low wage (known issue, audit)': () => calcGosi({ nationality: 'non-saudi', system: 'new', basic: 1000, housing: 0, other: 0, onDate: ON }),
  'gosi: above ceiling': () => calcGosi({ nationality: 'saudi', system: 'new', basic: 60000, housing: 0, other: 0, onDate: ON }),

  'payday: 27 before, fri-sat': () => calcPayday({ payDay: 27, weekend: 'fri-sat', rule: 'before', onDate: ON }),
  'payday: Saturday 27 Feb 2027 (known issue, audit)': () => calcPayday({ payDay: 27, weekend: 'fri-sat', rule: 'before', onDate: '2027-02-01' }),
  'payday: 1st, no shift': () => calcPayday({ payDay: 1, weekend: 'sat-sun', rule: 'none', onDate: ON }),
  'payday: 31st in short month': () => calcPayday({ payDay: 31, weekend: 'sat-sun', rule: 'after', onDate: '2027-02-01' }),

  'vat: add 5': () => calcVat({ mode: 'add', ratePercent: 5, amount: 1000 }),
  'vat: extract 5': () => calcVat({ mode: 'extract', ratePercent: 5, amount: 1050 }),
  'vat: add 15': () => calcVat({ mode: 'add', ratePercent: 15, amount: 200 }),
  'vat: extract 10': () => calcVat({ mode: 'extract', ratePercent: 10, amount: 110 }),

  'loan: reducing': () => calcLoan({ principal: 100000, annualRatePercent: 4.5, months: 48, method: 'reducing' }),
  'loan: flat': () => calcLoan({ principal: 100000, annualRatePercent: 4.5, months: 48, method: 'flat' }),
  'loan: zero rate': () => calcLoan({ principal: 12000, annualRatePercent: 0, months: 12, method: 'reducing' }),

  'percent: of': () => percentOf(40, 250),
  'percent: what': () => whatPercent(40, 250),
  'percent: change up': () => percentChange(100, 125),
  'percent: change down': () => percentChange(125, 100),
  'percent: from zero': () => percentChange(0, 10),
  'discount: single': () => calcDiscount({ price: 1000, first: 30 }),
  'discount: double': () => calcDiscount({ price: 1000, first: 50, second: 20 }),
  'discount: over 100': () => calcDiscount({ price: 1000, first: 120 }),

  'zakat: above nisab': () => calcZakat({ cash: 50000, investments: 30000, debts: 5000, goldPricePerGram: 400 }),
  'zakat: below nisab': () => calcZakat({ cash: 20000, investments: 0, debts: 0, goldPricePerGram: 400 }),
  'zakat: no gold price': () => calcZakat({ cash: 50000, investments: 0, debts: 0, goldPricePerGram: null }),
  'zakat: debts exceed': () => calcZakat({ cash: 1000, investments: 0, debts: 5000, goldPricePerGram: 400 }),

  'age: typical': () => calcAge({ birthDate: '1995-01-01', onDate: ON }),
  'age: leap birthday': () => calcAge({ birthDate: '2000-02-29', onDate: '2027-02-28' }),
  'age: birthday today': () => calcAge({ birthDate: '1990-11-04', onDate: ON }),
  'age: future': () => calcAge({ birthDate: '2030-01-01', onDate: ON }),
  'bmi: normal': () => calcBmi({ weightKg: 70, heightCm: 170 }),
  'bmi: obese': () => calcBmi({ weightKg: 110, heightCm: 170 }),
  'bmi: tiny values (known issue, audit)': () => calcBmi({ weightKg: 2, heightCm: 50 }),
  'calories: male moderate': () => calcCalories({ sex: 'male', age: 30, weightKg: 80, heightCm: 178, activity: 'moderate' }),
  'calories: female light': () => calcCalories({ sex: 'female', age: 28, weightKg: 62, heightCm: 163, activity: 'light' }),
  'pregnancy: week 10': () => calcPregnancy({ lmpDate: '2026-08-26', cycleDays: 28, onDate: ON }),
  'pregnancy: 13w3d (known issue, audit)': () => calcPregnancy({ lmpDate: '2026-08-02', cycleDays: 28, onDate: ON }),
  'pregnancy: long cycle': () => calcPregnancy({ lmpDate: '2026-08-26', cycleDays: 35, onDate: ON }),
  'ovulation: 28 days': () => calcOvulation({ lmpDate: '2026-10-20', cycleDays: 28, periodDays: 5, onDate: ON }),
  'ovulation: 21 days': () => calcOvulation({ lmpDate: '2026-10-20', cycleDays: 21, periodDays: 10, onDate: ON }),

  'hijri: to hijri': () => gregorianToHijri({ date: ON }),
  'hijri: Ramadan 1448': () => hijriToGregorian({ hYear: 1448, hMonth: 9, hDay: 1 }),
  'hijri: lower bound (known issue, audit)': () => gregorianToHijri({ date: '1924-01-01' }),
  'hijri age: gregorian birth': () => hijriAgeFromGregorian({ birthDate: '1995-01-01', onDate: ON }),
  'hijri age: hijri birth': () => hijriAgeFromHijri({ hDay: 29, hMonth: 7, hYear: 1415, onDate: ON }),
  'dates: inclusive sat-sun': () => calcDateSpan({ startDate: '2026-01-01', endDate: '2026-12-31', includeEnd: true, weekend: 'sat-sun' }),
  'dates: reversed': () => calcDateSpan({ startDate: '2026-12-31', endDate: '2026-01-01', includeEnd: false, weekend: 'fri-sat' }),
  'dates: Jan 1 to 31 (known issue, audit)': () => calcDateSpan({ startDate: '2026-01-01', endDate: '2026-01-31', includeEnd: true, weekend: 'sat-sun' }),

  'gpa: s5': () => calcGpa({ system: 's5', prevGpa: null, prevHours: null, courses: C(['A+', 3], ['A', 3], ['B+', 4], ['C', 2]) }),
  'gpa: s5 cumulative': () => calcGpa({ system: 's5', prevGpa: 4.2, prevHours: 60, courses: C(['A', 3], ['B', 3]) }),
  'gpa: s4': () => calcGpa({ system: 's4', prevGpa: null, prevHours: null, courses: C(['A', 3], ['B+', 3], ['C', 3]) }),
  'gpa: us4': () => calcGpa({ system: 'us4', prevGpa: 3.1, prevHours: 45, courses: C(['A-', 3], ['B+', 3], ['A', 3], ['B', 3]) }),
  'gpa target: reachable': () => calcGpaTarget({ system: 's5', current: 3.5, doneHours: 60, target: 3.75, nextHours: 15, leftHours: null }),
  'gpa target: with graduation': () => calcGpaTarget({ system: 's4', current: 3.37, doneHours: 108, target: 3.7, nextHours: 18, leftHours: 72 }),
  'gpa target: impossible': () => calcGpaTarget({ system: 's5', current: 3.2, doneHours: 60, target: 3.4, nextHours: 15, leftHours: null }),
};

// Rounded so the snapshot records the meaning of a result, not floating-point noise.
const stable = (_: string, v: unknown) => (typeof v === 'number' && !Number.isInteger(v) ? Math.round(v * 1e6) / 1e6 : v);

test('every calculator matches its recorded baseline', async () => {
  const results = Object.fromEntries(Object.entries(CASES).map(([name, run]) => [name, run()]));
  await expect(JSON.stringify(results, stable, 2) + '\n').toMatchFileSnapshot('./baseline/golden.json');
});
