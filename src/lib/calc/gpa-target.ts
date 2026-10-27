import { type CalcResult, Validator, fail, ok } from './core';

/**
 * Semester GPA needed to reach a target cumulative GPA.
 * needed = (target × (done + next) − current × done) ÷ next.
 * Lowest possible course grade: 1 on the Saudi 5-point scale (F = 1), 0 on 4-point scales.
 */
export type TargetSystem = 's5' | 's4';
export type TargetInput = {
  system: TargetSystem;
  current: number | null;
  doneHours: number | null;
  target: number | null;
  nextHours: number | null;
  leftHours: number | null; // optional: hours left until graduation, including next semester
};
export type GpaTarget = {
  max: number;
  min: number;
  needed: number; // raw semester GPA needed next semester
  status: 'reachable' | 'impossible' | 'already';
  bestAfterNext: number; // cumulative if the whole next semester is at max
  hoursAtMax: number | null; // hours at full marks to reach the target (null if target ≥ max)
  leftHours: number | null;
  bestAtGraduation: number | null;
  byLoad: { hours: number; needed: number }[];
};

export function calcGpaTarget(input: TargetInput): CalcResult<GpaTarget> {
  const v = new Validator();
  const max = input.system === 's4' ? 4 : 5;
  const min = input.system === 's4' ? 0 : 1;
  const cur = v.number('current', input.current, { min, max, label: 'المعدل الحالي' });
  const done = v.number('doneHours', input.doneHours, { min: 1, max: 400, label: 'الساعات المجتازة' });
  const target = v.number('target', input.target, { min, max, label: 'المعدل المستهدف' });
  const next = v.number('nextHours', input.nextHours, { min: 1, max: 30, label: 'ساعات الفصل القادم' });
  let left: number | null = null;
  if (input.leftHours !== null) {
    left = v.number('leftHours', input.leftHours, { min: 0, max: 300, label: 'الساعات الباقية للتخرج' });
    if (Number.isFinite(left) && Number.isFinite(next) && left > 0 && left < next) v.add('leftHours', 'الساعات الباقية أقل من ساعات الفصل القادم');
  }
  if (!v.valid) return fail(v.errors);

  const points = cur * done;
  const needAt = (h: number) => (target * (done + h) - points) / h;
  const needed = needAt(next);
  const status = needed > max + 1e-9 ? 'impossible' : needed <= min + 1e-9 ? 'already' : 'reachable';
  const hoursAtMax = target < max ? Math.max(0, (target * done - points) / (max - target)) : null;
  const L = left && left > 0 ? left : null;
  return ok({
    max,
    min,
    needed,
    status,
    bestAfterNext: (points + max * next) / (done + next),
    hoursAtMax,
    leftHours: L,
    bestAtGraduation: L ? (points + max * L) / (done + L) : null,
    byLoad: [12, 15, 18, 21].map((h) => ({ hours: h, needed: needAt(h) })),
  });
}
