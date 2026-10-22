import { describe, expect, test } from 'vitest';
import { gregorianToHijri, hijriToGregorian, toHijri, fromHijri } from '../src/lib/calc/hijri';
import { calcDateSpan } from '../src/lib/calc/dates';
import { calcPregnancy } from '../src/lib/calc/pregnancy';
import { calcCalories } from '../src/lib/calc/calories';

const D = (s: string) => new Date(s + 'T00:00:00Z');
const val = <T>(r: { ok: boolean } & ({ ok: true; value: T } | { ok: false })) => { if (!r.ok) throw new Error('expected ok'); return r.value; };

describe('hijri (Umm al-Qura)', () => {
  test('known dates', () => {
    expect(toHijri(D('2026-10-21'))).toEqual({ year: 1448, month: 5, day: 10 });
    expect(toHijri(D('2024-07-07'))).toEqual({ year: 1446, month: 1, day: 1 });
    expect(val(hijriToGregorian({ hYear: 1447, hMonth: 9, hDay: 1 })).gregorian).toBe('2026-02-18');
    expect(val(hijriToGregorian({ hYear: 1447, hMonth: 10, hDay: 1 })).weekday).toBe('الجمعة');
  });
  test('round trip every 3 days 1924–2076', () => {
    for (let t = Date.UTC(1924, 0, 1); t < Date.UTC(2077, 0, 1); t += 3 * 86_400_000) {
      const d = new Date(t);
      expect(fromHijri(toHijri(d))?.getTime()).toBe(t);
    }
  });
  test('30th of a 29-day month is rejected, not rolled over', () => {
    const short = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].find((m) => !fromHijri({ year: 1447, month: m, day: 30 }))!;
    const r = hijriToGregorian({ hYear: 1447, hMonth: short, hDay: 30 });
    expect(r.ok).toBe(false);
  });
  test('validation', () => {
    expect(hijriToGregorian({ hYear: 1447, hMonth: 13, hDay: 1 }).ok).toBe(false);
    expect(hijriToGregorian({ hYear: null, hMonth: 1, hDay: 1 }).ok).toBe(false);
    expect(gregorianToHijri({ date: '1800-01-01' }).ok).toBe(false);
    expect(gregorianToHijri({ date: '2026-02-30' }).ok).toBe(false);
  });
});

describe('days between dates', () => {
  test('a leap year', () => {
    const s = val(calcDateSpan({ startDate: '2024-01-01', endDate: '2025-01-01', includeEnd: false, weekend: 'sat-sun' }));
    expect(s.days).toBe(366);
    expect(s.months).toBe(12);
    expect(s.monthRemainderDays).toBe(0);
  });
  test('include end day adds one', () => {
    expect(val(calcDateSpan({ startDate: '2026-10-01', endDate: '2026-10-31', includeEnd: true, weekend: 'sat-sun' })).days).toBe(31);
  });
  test('working days for UAE vs Saudi weekend (Oct 2026: starts Thursday)', () => {
    const uae = val(calcDateSpan({ startDate: '2026-10-01', endDate: '2026-10-31', includeEnd: true, weekend: 'sat-sun' }));
    const ksa = val(calcDateSpan({ startDate: '2026-10-01', endDate: '2026-10-31', includeEnd: true, weekend: 'fri-sat' }));
    expect(uae.weekendDays).toBe(9); // 5 Saturdays + 4 Sundays
    expect(uae.workingDays).toBe(22);
    expect(ksa.weekendDays).toBe(10); // 5 Fridays + 5 Saturdays
  });
  test('reversed order still counts', () => {
    const s = val(calcDateSpan({ startDate: '2026-10-10', endDate: '2026-10-01', includeEnd: false, weekend: 'sat-sun' }));
    expect(s.days).toBe(9);
    expect(s.reversed).toBe(true);
  });
  test('same day', () => {
    expect(val(calcDateSpan({ startDate: '2026-10-10', endDate: '2026-10-10', includeEnd: false, weekend: 'sat-sun' })).days).toBe(0);
  });
});

describe('pregnancy due date', () => {
  test('Naegele: LMP + 280 days for a 28-day cycle', () => {
    const p = val(calcPregnancy({ lmpDate: '2026-01-01', cycleDays: 28, onDate: '2026-03-12' }));
    expect(p.dueDate).toBe('2026-10-08');
    expect(p.weeks).toBe(10);
    expect(p.days).toBe(0);
    expect(p.trimester).toBe(1);
  });
  test('longer cycle shifts the due date', () => {
    expect(val(calcPregnancy({ lmpDate: '2026-01-01', cycleDays: 32, onDate: '2026-03-12' })).dueDate).toBe('2026-10-12');
  });
  test('trimester boundaries', () => {
    expect(val(calcPregnancy({ lmpDate: '2026-01-01', cycleDays: 28, onDate: '2026-04-09' })).trimester).toBe(2); // 14w
    expect(val(calcPregnancy({ lmpDate: '2026-01-01', cycleDays: 28, onDate: '2026-07-16' })).trimester).toBe(3); // 28w
  });
  test('validation', () => {
    expect(calcPregnancy({ lmpDate: '2026-12-01', cycleDays: 28, onDate: '2026-10-21' }).ok).toBe(false);
    expect(calcPregnancy({ lmpDate: '2025-01-01', cycleDays: 28, onDate: '2026-10-21' }).ok).toBe(false);
    expect(calcPregnancy({ lmpDate: '2026-09-01', cycleDays: 60, onDate: '2026-10-21' }).ok).toBe(false);
  });
});

describe('calories', () => {
  test('Mifflin–St Jeor, male', () => {
    const c = val(calcCalories({ sex: 'male', age: 30, weightKg: 80, heightCm: 178, activity: 'moderate' }));
    expect(c.bmr).toBeCloseTo(1767.5, 6);
    expect(c.maintenance).toBeCloseTo(1767.5 * 1.55, 6);
  });
  test('female constant is −161', () => {
    expect(val(calcCalories({ sex: 'female', age: 30, weightKg: 60, heightCm: 165, activity: 'sedentary' })).bmr).toBeCloseTo(1320.25, 6);
  });
  test('validation', () => {
    expect(calcCalories({ sex: 'male', age: 15, weightKg: 60, heightCm: 170, activity: 'light' }).ok).toBe(false);
    expect(calcCalories({ sex: 'male', age: 30, weightKg: null, heightCm: 170, activity: 'light' }).ok).toBe(false);
  });
});

import { calcGosi, pensionRate } from '../src/lib/calc/gosi';
describe('GOSI', () => {
  const base = { basic: 8000, housing: 2000, onDate: '2026-10-22' };
  test('legacy Saudi: 9.75% employee, 11.75% employer', () => {
    const g = val(calcGosi({ ...base, nationality: 'saudi', system: 'legacy' }));
    expect(g.employee).toBeCloseTo(975, 6);
    expect(g.employer).toBeCloseTo(1175, 6);
  });
  test('new-system Saudi in Oct 2026: pension 10% each', () => {
    const g = val(calcGosi({ ...base, nationality: 'saudi', system: 'new' }));
    expect(g.pensionRate).toBe(10);
    expect(g.employee).toBeCloseTo(1075, 6);
    expect(g.employer).toBeCloseTo(1275, 6);
  });
  test('step dates', () => {
    expect(pensionRate('new', '2025-06-30')).toBe(9);
    expect(pensionRate('new', '2025-07-01')).toBe(9.5);
    expect(pensionRate('new', '2027-07-01')).toBe(10.5);
    expect(pensionRate('new', '2030-01-01')).toBe(11);
    expect(pensionRate('legacy', '2030-01-01')).toBe(9);
  });
  test('non-Saudi: employer 2% only', () => {
    const g = val(calcGosi({ ...base, nationality: 'non-saudi', system: 'new' }));
    expect(g.employee).toBe(0);
    expect(g.employer).toBeCloseTo(200, 6);
  });
  test('wage cap and floor', () => {
    expect(val(calcGosi({ nationality: 'saudi', system: 'legacy', basic: 60000, housing: 0, onDate: '2026-10-22' })).wage).toBe(45000);
    const low = val(calcGosi({ nationality: 'saudi', system: 'legacy', basic: 1000, housing: 0, onDate: '2026-10-22' }));
    expect(low.wage).toBe(1500);
    expect(low.capped).toBe('min');
  });
  test('validation', () => {
    expect(calcGosi({ nationality: 'saudi', system: 'legacy', basic: null, housing: 0, onDate: '2026-10-22' }).ok).toBe(false);
    expect(calcGosi({ nationality: 'saudi', system: 'legacy', basic: -5, housing: 0, onDate: '2026-10-22' }).ok).toBe(false);
  });
});
