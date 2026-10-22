import { type CalcResult, Validator, fail, ok } from './core';

/** Three different questions — never mix them up. */

/** "What is P% of X?" */
export function percentOf(percent: number | null, base: number | null): CalcResult<{ value: number }> {
  const v = new Validator();
  const p = v.number('percent', percent, { label: 'النسبة' });
  const b = v.number('base', base, { label: 'الرقم' });
  if (!v.valid) return fail(v.errors);
  return ok({ value: (p * b) / 100 });
}

/** "A is what percent of B?" — undefined when B = 0. */
export function whatPercent(part: number | null, whole: number | null): CalcResult<{ value: number }> {
  const v = new Validator();
  const a = v.number('part', part, { label: 'الجزء' });
  const b = v.number('whole', whole, { label: 'الكل' });
  if (v.valid && b === 0) v.add('whole', 'لا يمكن حساب النسبة من صفر');
  if (!v.valid) return fail(v.errors);
  return ok({ value: (a / b) * 100 });
}

/** "Percent change from A to B" — undefined when A = 0. */
export function percentChange(from: number | null, to: number | null): CalcResult<{ value: number; direction: 'up' | 'down' | 'same' }> {
  const v = new Validator();
  const a = v.number('from', from, { label: 'القيمة الأصلية' });
  const b = v.number('to', to, { label: 'القيمة الجديدة' });
  if (v.valid && a === 0) v.add('from', 'لا يمكن حساب التغير من قيمة أصلية تساوي صفراً');
  if (!v.valid) return fail(v.errors);
  const value = ((b - a) / Math.abs(a)) * 100;
  return ok({ value, direction: value > 0 ? 'up' : value < 0 ? 'down' : 'same' });
}
