import { type CalcResult, Validator, fail, ok } from './core';

/** Daily energy needs for adults: Mifflin–St Jeor BMR × activity factor. */
export type Sex = 'male' | 'female';
export type Activity = 'sedentary' | 'light' | 'moderate' | 'active' | 'very';
export const ACTIVITY: { key: Activity; factor: number; label: string; hint: string }[] = [
  { key: 'sedentary', factor: 1.2, label: 'قليل الحركة', hint: 'عمل مكتبي بلا رياضة' },
  { key: 'light', factor: 1.375, label: 'نشاط خفيف', hint: 'رياضة 1 إلى 3 أيام أسبوعياً' },
  { key: 'moderate', factor: 1.55, label: 'نشاط متوسط', hint: 'رياضة 3 إلى 5 أيام أسبوعياً' },
  { key: 'active', factor: 1.725, label: 'نشاط عالٍ', hint: 'رياضة 6 إلى 7 أيام أسبوعياً' },
  { key: 'very', factor: 1.9, label: 'نشاط عالٍ جداً', hint: 'عمل بدني شاق أو تمرين مرتين يومياً' },
];
export type CaloriesInput = { sex: Sex; age: number | null; weightKg: number | null; heightCm: number | null; activity: Activity };
export type Calories = { bmr: number; maintenance: number; factor: number; byActivity: { key: Activity; label: string; kcal: number }[] };

export function calcCalories(input: CaloriesInput): CalcResult<Calories> {
  const v = new Validator();
  const age = v.number('age', input.age, { label: 'العمر', min: 18, max: 90 });
  const w = v.number('weightKg', input.weightKg, { label: 'الوزن', min: 30, max: 300 });
  const h = v.number('heightCm', input.heightCm, { label: 'الطول', min: 120, max: 230 });
  const act = ACTIVITY.find((a) => a.key === input.activity);
  if (!act) v.add('activity', 'اختر مستوى النشاط');
  if (!v.valid || !act) return fail(v.errors);
  const bmr = 10 * w + 6.25 * h - 5 * age + (input.sex === 'male' ? 5 : -161);
  return ok({
    bmr,
    maintenance: bmr * act.factor,
    factor: act.factor,
    byActivity: ACTIVITY.map((a) => ({ key: a.key, label: a.label, kcal: bmr * a.factor })),
  });
}
