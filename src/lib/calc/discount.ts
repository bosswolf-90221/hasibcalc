import { type CalcResult, Validator, fail, ok } from './core';

/** Sequential discounts: final = price × (1 − d1) × (1 − d2). */
export type DiscountInput = { price: number | null; first: number | null; second?: number | null };
export type Discount = { price: number; afterFirst: number; final: number; saved: number; effectivePercent: number };

export function calcDiscount(input: DiscountInput): CalcResult<Discount> {
  const v = new Validator();
  const price = v.number('price', input.price, { min: 0, max: 1e12, label: 'السعر الأصلي' });
  const d1 = v.number('first', input.first, { min: 0, max: 100, label: 'نسبة الخصم' });
  const d2 = v.number('second', input.second ?? 0, { min: 0, max: 100, label: 'الخصم الإضافي' });
  if (!v.valid) return fail(v.errors);
  const afterFirst = price * (1 - d1 / 100);
  const final = afterFirst * (1 - d2 / 100);
  const saved = price - final;
  return ok({ price, afterFirst, final, saved, effectivePercent: price === 0 ? 0 : (saved / price) * 100 });
}
