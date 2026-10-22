import { type CalcResult, Validator, fail, ok } from './core';

/**
 * Monthly instalment.
 *  - reducing: standard annuity PMT = P·r / (1 − (1+r)^−n), r = annual/12. r = 0 → P/n.
 *  - flat (simplified): interest = P × annual × n/12, spread evenly over n instalments.
 * Bank fees, insurance and the first-payment timing are not modelled.
 */
export type LoanMethod = 'reducing' | 'flat';
export type LoanInput = { principal: number | null; annualRatePercent: number | null; months: number | null; method: LoanMethod };
export type LoanYear = { year: number; principal: number; interest: number; balance: number };
export type Loan = { payment: number; totalInterest: number; totalPaid: number; months: number; years: LoanYear[] };

export function monthlyPayment(principal: number, annualRate: number, months: number): number {
  const r = annualRate / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

export function calcLoan(input: LoanInput): CalcResult<Loan> {
  const v = new Validator();
  const P = v.number('principal', input.principal, { min: 0, max: 1e11, label: 'مبلغ القرض' });
  const ratePct = v.number('annualRatePercent', input.annualRatePercent, { min: 0, max: 100, label: 'نسبة الفائدة' });
  const n = v.number('months', input.months, { min: 1, max: 600, integer: true, label: 'عدد الأشهر' });
  if (input.method !== 'reducing' && input.method !== 'flat') v.add('method', 'اختر نوع الفائدة');
  if (!v.valid) return fail(v.errors);

  const R = ratePct / 100;
  const years: LoanYear[] = [];
  let payment: number;
  let totalInterest: number;

  if (input.method === 'flat') {
    totalInterest = P * R * (n / 12);
    payment = (P + totalInterest) / n;
    const pM = P / n;
    const iM = totalInterest / n;
    for (let m = 1; m <= n; m++) addToYear(years, m, pM, iM, P - pM * m);
  } else {
    payment = monthlyPayment(P, R, n);
    const r = R / 12;
    let balance = P;
    totalInterest = 0;
    for (let m = 1; m <= n; m++) {
      const interest = balance * r;
      const principalPart = payment - interest;
      balance -= principalPart;
      totalInterest += interest;
      addToYear(years, m, principalPart, interest, Math.max(0, balance));
    }
  }
  const lastYear = years[years.length - 1];
  if (lastYear) lastYear.balance = 0; // absorb floating-point residue
  return ok({ payment, totalInterest, totalPaid: P + totalInterest, months: n, years });
}

function addToYear(years: LoanYear[], month: number, principal: number, interest: number, balance: number) {
  const y = Math.ceil(month / 12);
  let row = years[y - 1];
  if (!row) years.push((row = { year: y, principal: 0, interest: 0, balance: 0 }));
  row.principal += principal;
  row.interest += interest;
  row.balance = Math.max(0, balance);
}
