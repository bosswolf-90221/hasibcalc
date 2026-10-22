import { type CalcResult, Validator, fail, ok } from './core';

/** Adult BMI (age 20+). Categories per WHO / CDC: <18.5, 18.5–<25, 25–<30, ≥30. */
export type BmiCategory = 'under' | 'normal' | 'over' | 'obese';
export type BmiInput = { weightKg: number | null; heightCm: number | null };
export type Bmi = { bmi: number; category: BmiCategory; normalMinKg: number; normalMaxKg: number };

export const BMI_BANDS: { key: BmiCategory; from: number; to: number; label: string }[] = [
  { key: 'under', from: 0, to: 18.5, label: 'نقص وزن' },
  { key: 'normal', from: 18.5, to: 25, label: 'نطاق طبيعي' },
  { key: 'over', from: 25, to: 30, label: 'زيادة وزن' },
  { key: 'obese', from: 30, to: Infinity, label: 'سمنة' },
];

export function bmiCategory(bmi: number): BmiCategory {
  return BMI_BANDS.find((b) => bmi >= b.from && bmi < b.to)!.key;
}

export function calcBmi(input: BmiInput): CalcResult<Bmi> {
  const v = new Validator();
  const w = v.number('weightKg', input.weightKg, { min: 2, max: 400, label: 'الوزن' });
  const h = v.number('heightCm', input.heightCm, { min: 50, max: 250, label: 'الطول' });
  if (!v.valid) return fail(v.errors);
  const m = h / 100;
  const bmi = w / (m * m);
  return ok({ bmi, category: bmiCategory(bmi), normalMinKg: 18.5 * m * m, normalMaxKg: 25 * m * m });
}
