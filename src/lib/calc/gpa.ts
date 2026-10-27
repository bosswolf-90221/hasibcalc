import { type CalcResult, Validator, fail, ok } from './core';

/**
 * University GPA (semester and cumulative), weighted by credit hours.
 * GPA = Σ(hours × grade points) ÷ Σ(hours).
 * Saudi scales (out of 5 and out of 4): the unified undergraduate study and examination by-law table,
 * as published by Prince Sattam bin Abdulaziz University and Prince Sultan University (F = 1 out of 5, 0 out of 4).
 * 4.0 scale with minus grades (UAE / American): UAE University grading table.
 */
export type GpaSystem = 's5' | 's4' | 'us4';
export const GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'] as const;
export type Grade = (typeof GRADES)[number];
export const GRADE_AR: Record<Grade, string> = { 'A+': 'أ+', A: 'أ', 'A-': 'أ−', 'B+': 'ب+', B: 'ب', 'B-': 'ب−', 'C+': 'ج+', C: 'ج', 'C-': 'ج−', 'D+': 'د+', D: 'د', F: 'هـ' };
export const SCALES: Record<GpaSystem, { max: number; points: Partial<Record<Grade, number>> }> = {
  s5: { max: 5, points: { 'A+': 5, A: 4.75, 'B+': 4.5, B: 4, 'C+': 3.5, C: 3, 'D+': 2.5, D: 2, F: 1 } },
  s4: { max: 4, points: { 'A+': 4, A: 3.75, 'B+': 3.5, B: 3, 'C+': 2.5, C: 2, 'D+': 1.5, D: 1, F: 0 } },
  // A+ is not on the UAEU table; it counts as A (4.0), as on most 4.0 scales.
  us4: { max: 4, points: { 'A+': 4, A: 4, 'A-': 3.7, 'B+': 3.3, B: 3, 'B-': 2.7, 'C+': 2.3, C: 2, 'C-': 1.7, 'D+': 1.3, D: 1, F: 0 } },
};

export type CourseIn = { grade: string; hours: number | null };
export type GpaInput = { system: GpaSystem; courses: CourseIn[]; prevGpa: number | null; prevHours: number | null };
export type CourseOut = { n: number; grade: Grade; hours: number; weight: number; points: number };
export type Gpa = {
  system: GpaSystem;
  max: number;
  courses: CourseOut[];
  semHours: number;
  semPoints: number;
  semGpa: number;
  prevHours: number;
  prevGpa: number;
  hasPrev: boolean;
  totalHours: number;
  cumGpa: number;
};
const r2 = (n: number) => Math.round(n * 100) / 100;

export function calcGpa(input: GpaInput): CalcResult<Gpa> {
  const v = new Validator();
  const scale = SCALES[input.system] ?? SCALES.s5;
  const courses: CourseOut[] = [];
  input.courses.forEach((c, i) => {
    const n = i + 1;
    const g = (c.grade ?? '').trim();
    const hasH = c.hours !== null && c.hours !== undefined;
    if (!g && !hasH) return;
    if (!g) return v.add(`g${n}`, `اختر تقدير المادة ${n}`);
    if (!hasH) return v.add(`h${n}`, `اكتب ساعات المادة ${n}`);
    const hours = v.number(`h${n}`, c.hours, { min: 0.5, max: 12, label: `ساعات المادة ${n}` });
    const weight = scale.points[g as Grade];
    if (weight === undefined) return v.add(`g${n}`, `التقدير ${g} غير موجود في هذا النظام`);
    if (Number.isFinite(hours)) courses.push({ n, grade: g as Grade, hours, weight, points: hours * weight });
  });
  const prevHours = input.prevHours ?? 0;
  if (input.prevHours !== null) v.number('prevHours', input.prevHours, { min: 0, max: 400, label: 'الساعات السابقة' });
  let prevGpa = 0;
  if (prevHours > 0) prevGpa = v.number('prevGpa', input.prevGpa, { min: 0, max: scale.max, label: 'المعدل التراكمي السابق' });
  if (courses.length === 0 && v.valid) v.add('h1', 'اكتب ساعات مادة واحدة على الأقل');
  if (!v.valid) return fail(v.errors);

  const semHours = courses.reduce((s, c) => s + c.hours, 0);
  const semPoints = courses.reduce((s, c) => s + c.points, 0);
  const totalHours = semHours + prevHours;
  const totalPoints = semPoints + prevGpa * prevHours;
  return ok({
    system: input.system,
    max: scale.max,
    courses,
    semHours,
    semPoints: r2(semPoints),
    semGpa: semPoints / semHours,
    prevHours,
    prevGpa,
    hasPrev: prevHours > 0,
    totalHours,
    cumGpa: totalPoints / totalHours,
  });
}
