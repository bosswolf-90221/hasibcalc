import { type CalcResult, Validator, fail, ok } from './core';

/** VAT add / extract. Rate is given in percent (5 = 5%). */
export type VatInput = { mode: 'add' | 'extract'; ratePercent: number | null; amount: number | null };
export type Vat = { base: number; tax: number; total: number; rate: number };

export function calcVat(input: VatInput): CalcResult<Vat> {
  const v = new Validator();
  const rate = v.number('ratePercent', input.ratePercent, { min: 0, max: 100, label: 'نسبة الضريبة' });
  const amount = v.number('amount', input.amount, { min: 0, max: 1e12, label: 'المبلغ' });
  if (input.mode !== 'add' && input.mode !== 'extract') v.add('mode', 'اختر إضافة الضريبة أو استخراجها');
  if (!v.valid) return fail(v.errors);

  const r = rate / 100;
  if (input.mode === 'add') {
    const total = amount * (1 + r);
    return ok({ base: amount, tax: total - amount, total, rate });
  }
  const base = amount / (1 + r);
  return ok({ base, tax: amount - base, total: amount, rate });
}
