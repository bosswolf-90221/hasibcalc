import type { CalcResult } from './calc/core';
import { toNumber } from './calc/core';
import { fmt } from './format';
import type { View } from './views';

const n = (s: string) => fmt(toNumber(s), Number.isInteger(toNumber(s) ?? 0) ? 0 : 2);
const err = (r: CalcResult<unknown>, label: string): View => ({ label, value: null, decimals: 0, unit: '', sentence: '', rows: [], error: r.ok ? undefined : r.errors[0].message });

export function pctOfView(r: CalcResult<{ value: number }>, p: string, b: string): View {
  if (!r.ok) return err(r, 'النتيجة');
  return { label: `${n(p)}% من ${n(b)}`, value: r.value.value, decimals: 2, unit: '', sentence: '', rows: [['الحساب', `${n(b)} × ${n(p)} ÷ 100`]] };
}

export function whatPctView(r: CalcResult<{ value: number }>, a: string, b: string): View {
  if (!r.ok) return err(r, 'النسبة');
  return { label: `${n(a)} تمثل من ${n(b)}`, value: r.value.value, decimals: 2, unit: '%', sentence: '', rows: [['الحساب', `${n(a)} ÷ ${n(b)} × 100`]] };
}

export function changeView(r: CalcResult<{ value: number; direction: 'up' | 'down' | 'same' }>, a: string, b: string): View {
  if (!r.ok) return err(r, 'نسبة التغير');
  const word = r.value.direction === 'up' ? 'زيادة' : r.value.direction === 'down' ? 'نقص' : 'بدون تغيير';
  return {
    label: `نسبة التغير من ${n(a)} إلى ${n(b)}`,
    value: Math.abs(r.value.value),
    decimals: 2,
    unit: '%',
    sentence: '',
    badge: word,
    rows: [['الفرق', fmt((toNumber(b) ?? 0) - (toNumber(a) ?? 0), 2)], ['الحساب', `(${n(b)} − ${n(a)}) ÷ |${n(a)}| × 100`]],
  };
}
