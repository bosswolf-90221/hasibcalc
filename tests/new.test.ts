import { describe, expect, test } from 'vitest';
import { hijriAgeFromGregorian, hijriAgeFromHijri } from '../src/lib/calc/hijri-age';
import { calcPayday } from '../src/lib/calc/payday';
import { pregnancyMonth } from '../src/lib/calc/pregnancy';

const val = <T>(r: { ok: boolean } & ({ ok: true; value: T } | { ok: false })) => { if (!r.ok) throw new Error('expected ok'); return r.value; };

describe('hijri age', () => {
  test('born 1 Jan 1995 (29 Rajab 1415), on 25 Oct 2026 (14 Jumada I 1448)', () => {
    const a = val(hijriAgeFromGregorian({ birthDate: '1995-01-01', onDate: '2026-10-25' }));
    expect(a.birthHijri).toEqual({ year: 1415, month: 7, day: 29 });
    expect([a.years, a.months, a.days]).toEqual([32, 9, 15]);
    expect(a.gregorianYears).toBe(31);
    expect(a.nextBirthdayHijriYear).toBe(1448);
    expect(a.isBirthday).toBe(false);
  });
  test('Hijri input gives the same answer', () => {
    const a = val(hijriAgeFromHijri({ hDay: 29, hMonth: 7, hYear: 1415, onDate: '2026-10-25' }));
    expect(a.birthGregorian).toBe('1995-01-01');
    expect([a.years, a.months, a.days]).toEqual([32, 9, 15]);
  });
  test('on the Hijri birthday the age turns over and next birthday is today', () => {
    const b = val(hijriAgeFromHijri({ hDay: 14, hMonth: 5, hYear: 1418, onDate: '2026-10-25' }));
    expect([b.years, b.months, b.days]).toEqual([30, 0, 0]);
    expect(b.isBirthday).toBe(true);
    expect(b.daysToNextBirthday).toBe(0);
  });
  test('Hijri age runs ahead of Gregorian age by about 3%', () => {
    const a = val(hijriAgeFromGregorian({ birthDate: '1960-03-15', onDate: '2026-10-25' }));
    const g = a.gregorianYears + a.gregorianMonths / 12;
    const h = a.years + a.months / 12;
    expect(h / g).toBeGreaterThan(1.025);
    expect(h / g).toBeLessThan(1.035);
  });
  test('validation', () => {
    expect(hijriAgeFromGregorian({ birthDate: '2030-01-01', onDate: '2026-10-25' }).ok).toBe(false);
    expect(hijriAgeFromGregorian({ birthDate: '1900-01-01', onDate: '2026-10-25' }).ok).toBe(false);
    expect(hijriAgeFromHijri({ hDay: 1, hMonth: 13, hYear: 1415, onDate: '2026-10-25' }).ok).toBe(false);
    expect(hijriAgeFromHijri({ hDay: 1, hMonth: 1, hYear: 1460, onDate: '2026-10-25' }).ok).toBe(false);
  });
});

describe('salary day', () => {
  test('27th, Fri–Sat weekend, moved earlier', () => {
    const p = val(calcPayday({ payDay: 27, weekend: 'fri-sat', rule: 'before', onDate: '2026-10-25' }));
    expect(p.next.actual).toBe('2026-10-27');
    expect(p.daysLeft).toBe(2);
    expect(p.upcoming).toHaveLength(12);
    expect(p.upcoming[1]).toMatchObject({ nominal: '2026-11-27', actual: '2026-11-26', weekday: 'الخميس', shifted: true });
  });
  test('moved later instead', () => {
    const p = val(calcPayday({ payDay: 27, weekend: 'fri-sat', rule: 'after', onDate: '2026-11-01' }));
    expect(p.next.actual).toBe('2026-11-29');
  });
  test('day 31 becomes the last day of short months', () => {
    const p = val(calcPayday({ payDay: 31, weekend: 'sat-sun', rule: 'none', onDate: '2026-11-05' }));
    expect(p.next.actual).toBe('2026-11-30');
    expect(p.upcoming[3].actual).toBe('2027-02-28');
  });
  test('a salary pushed into the next month is still found', () => {
    // 31 Jan 2027 is a Sunday; with a Sat–Sun weekend and "after" it is paid on Monday 1 Feb.
    const p = val(calcPayday({ payDay: 31, weekend: 'sat-sun', rule: 'after', onDate: '2027-02-01' }));
    expect(p.next.actual).toBe('2027-02-01');
    expect(p.isToday).toBe(true);
  });
  test('validation', () => {
    expect(calcPayday({ payDay: 0, weekend: 'fri-sat', rule: 'none', onDate: '2026-10-25' }).ok).toBe(false);
    expect(calcPayday({ payDay: 32, weekend: 'fri-sat', rule: 'none', onDate: '2026-10-25' }).ok).toBe(false);
  });
});

describe('pregnancy month', () => {
  test('weeks to months', () => {
    expect(pregnancyMonth(1)).toBe(1);
    expect(pregnancyMonth(4)).toBe(1);
    expect(pregnancyMonth(5)).toBe(2);
    expect(pregnancyMonth(13)).toBe(3);
    expect(pregnancyMonth(14)).toBe(4);
    expect(pregnancyMonth(22)).toBe(5);
    expect(pregnancyMonth(27)).toBe(6);
    expect(pregnancyMonth(28)).toBe(7);
    expect(pregnancyMonth(36)).toBe(9);
    expect(pregnancyMonth(42)).toBe(9);
  });
});

import { calcOvulation } from '../src/lib/calc/ovulation';
describe('ovulation', () => {
  test('28-day cycle: ovulation day 14, fertile 9–14, next period day 29', () => {
    const o = val(calcOvulation({ lmpDate: '2026-10-01', cycleDays: 28, periodDays: 5, onDate: '2026-10-05' }));
    expect(o.cycleDay).toBe(5);
    expect(o.focus).toMatchObject({ start: '2026-10-01', periodEnd: '2026-10-05', fertileStart: '2026-10-09', ovulation: '2026-10-14', nextStart: '2026-10-29' });
    expect(o.daysToOvulation).toBe(9);
    expect(o.periodToday).toBe(true);
    expect(o.fertileToday).toBe(false);
  });
  test('after ovulation the focus moves to the next cycle', () => {
    const o = val(calcOvulation({ lmpDate: '2026-10-01', cycleDays: 28, periodDays: 5, onDate: '2026-10-20' }));
    expect(o.focus.start).toBe('2026-10-29');
    expect(o.focus.ovulation).toBe('2026-11-11');
    expect(o.daysToNextPeriod).toBe(9);
  });
  test('35-day cycle ovulates around day 21; fertile today', () => {
    const o = val(calcOvulation({ lmpDate: '2026-10-01', cycleDays: 35, periodDays: 5, onDate: '2026-10-18' }));
    expect(o.focus.ovulation).toBe('2026-10-21');
    expect(o.fertileToday).toBe(true);
  });
  test('an old last period rolls forward whole cycles', () => {
    const o = val(calcOvulation({ lmpDate: '2026-08-01', cycleDays: 30, periodDays: 5, onDate: '2026-10-25' }));
    expect(o.current.start).toBe('2026-09-30');
    expect(o.cycleDay).toBe(26);
    expect(o.upcoming).toHaveLength(3);
  });
  test('validation', () => {
    expect(calcOvulation({ lmpDate: '2026-11-01', cycleDays: 28, periodDays: 5, onDate: '2026-10-25' }).ok).toBe(false);
    expect(calcOvulation({ lmpDate: '2026-10-01', cycleDays: 15, periodDays: 5, onDate: '2026-10-25' }).ok).toBe(false);
    expect(calcOvulation({ lmpDate: '2026-10-01', cycleDays: 28, periodDays: 12, onDate: '2026-10-25' }).ok).toBe(false);
  });
});
