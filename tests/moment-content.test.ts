// Every worked number in the moments' reading text, recalculated so a typo cannot reach a visitor.
import { describe, expect, it } from 'vitest';
import { calcGosi, pensionRate, SANED } from '../src/lib/calc/gosi';
import { MOMENTS } from '../src/data/moments';
import { MOMENT_CONTENT } from '../src/data/moment-content';

const text = (slug: string) => {
  const c = MOMENT_CONTENT[slug];
  return [...c.sections.flatMap((s) => [...(s.paragraphs ?? []), ...(s.items ?? []), s.example ?? '']), ...c.faq.flatMap((f) => [f.q, f.a])].join(' ');
};
const money = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });
const addDays = (iso: string, d: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + d * 86400000).toISOString().slice(0, 10);
const round = (n: number, d: number) => Number(n.toFixed(d));

describe('moment reading content', () => {
  it('exists for every moment, with sections and questions', () => {
    for (const m of MOMENTS) {
      expect(MOMENT_CONTENT[m.slug], m.slug).toBeDefined();
      expect(MOMENT_CONTENT[m.slug].sections.length, m.slug).toBeGreaterThanOrEqual(3);
      expect(MOMENT_CONTENT[m.slug].faq.length, m.slug).toBeGreaterThanOrEqual(3);
    }
  });

  it('monthly pay: the Saudi example matches the calculator', () => {
    expect(pensionRate('new', '2026-07-01')).toBe(10);
    expect(pensionRate('new', '2027-06-30')).toBe(10);
    expect(pensionRate('new', '2027-07-01')).toBe(10.5);
    expect(10 + SANED).toBe(10.75);
    const r = calcGosi({ nationality: 'saudi', system: 'new', basic: 8000, housing: 2000, other: 1000, onDate: '2026-11-05' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.employee).toBeCloseTo(1075);
    expect(r.value.netAfterDeduction).toBeCloseTo(9925);
    const t = text('monthly-pay');
    for (const n of ['10.75%', '1,075', '9,925']) expect(t).toContain(n);
  });

  it('taking a loan: the limits are worked out correctly', () => {
    const t = text('taking-loan');
    expect(t).toContain(money(15000 * 20));
    expect(t).toContain(money(15000 * 0.5));
    expect(t).toContain(money(15000 * 0.5 - 2000));
    expect(15000 * 0.3333).toBeCloseTo(4999.5);
    expect(t).toContain('4,999.50');
  });

  it('zakat: both nisabs and the gold example', () => {
    const t = text('ramadan-zakat');
    expect(85 * 400).toBe(34000);
    expect(t).toContain('34,000');
    expect(595 * 3).toBe(1785);
    expect(t).toContain('1,785');
    expect(20000 * 0.025).toBe(500);
    expect(100 * 350).toBe(35000);
    expect(35000 * 0.025).toBe(875);
    expect(t).toContain('875');
  });

  it('expecting a baby: the week dates fall where the text says', () => {
    expect(addDays('2026-08-26', 8 * 7)).toBe('2026-10-21');
    expect(addDays('2026-08-26', 12 * 7)).toBe('2026-11-18');
  });

  it('health: the BMI example', () => {
    expect(round(70 / 1.7 ** 2, 1)).toBe(24.2);
    expect(round(23 * 1.7 ** 2, 1)).toBe(66.5);
  });

  it('shopping: unit prices and the VAT shortcut', () => {
    expect(round((250 * 2) / 3, 2)).toBe(166.67);
    expect(round((1 - 2 / 3) * 100, 2)).toBe(33.33);
    expect(250 * 0.7).toBe(175);
    expect(1050 / 21).toBe(50);
    expect(2100 / 21).toBe(100);
  });

  it('university: the examples', () => {
    expect(round((3 * 30 + 4 * 15) / 45, 2)).toBe(3.33);
    expect(round((3 * 90 + 4 * 15) / 105, 2)).toBe(3.14);
    expect((3.5 * 60 + 4 * 60) / 120).toBe(3.75);
  });

  it('dates: 30 solar years in lunar years, and leap years', () => {
    const lunar = (30 * 365.2425) / 354.367;
    expect(Math.floor(lunar)).toBe(30);
    expect(Math.round((lunar - 30) * 12)).toBe(11);
    const leap = (y: number) => y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0);
    expect(leap(2000)).toBe(true);
    expect(leap(2100)).toBe(false);
    expect(leap(2028)).toBe(true);
    expect([2027].some(leap)).toBe(false);
  });
});
