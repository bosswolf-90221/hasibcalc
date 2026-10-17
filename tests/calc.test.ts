import { describe, expect, it } from 'vitest';
import { toNumber, round, parseISODate } from '../src/lib/calc/core';
import { calcGratuity } from '../src/lib/calc/gratuity';
import { calcVat } from '../src/lib/calc/vat';
import { calcLoan, monthlyPayment } from '../src/lib/calc/loan';
import { percentOf, whatPercent, percentChange } from '../src/lib/calc/percentage';
import { calcDiscount } from '../src/lib/calc/discount';
import { calcAge } from '../src/lib/calc/age';
import { calcBmi, bmiCategory } from '../src/lib/calc/bmi';
import { calcZakat } from '../src/lib/calc/zakat';

const val = <T>(r: { ok: boolean } & ({ value: T } | { errors: unknown })) => {
  if (!r.ok) throw new Error('expected ok: ' + JSON.stringify((r as any).errors));
  return (r as { value: T }).value;
};
const errs = (r: any) => (r.ok ? [] : r.errors.map((e: any) => e.field));

describe('core', () => {
  it('parses Arabic-Indic digits, commas and decimals', () => {
    expect(toNumber('١٢٬٣٤٥٫٥')).toBe(12345.5);
    expect(toNumber('1,000')).toBe(1000);
    expect(toNumber('')).toBeNull();
    expect(toNumber('abc')).toBeNull();
    expect(toNumber(Infinity)).toBeNull();
    expect(toNumber(NaN)).toBeNull();
  });
  it('rounds half up for display', () => {
    expect(round(1.005, 2)).toBe(1.01);
    expect(round(2.345, 1)).toBe(2.3);
  });
  it('rejects impossible dates', () => {
    expect(parseISODate('2023-02-29')).toBeNull();
    expect(parseISODate('2024-02-29')).not.toBeNull();
    expect(parseISODate('31/12/2020')).toBeNull();
  });
});

describe('gratuity (UAE Art. 51)', () => {
  it('pays nothing before one full year', () => {
    const g = val(calcGratuity({ basicSalary: 10000, startDate: '2024-01-01', endDate: '2024-12-30' }));
    // 2024 is a leap year: 1 Jan – 30 Dec is 365 days but not yet a full calendar year
    expect(g.serviceDays).toBe(365);
    expect(g.eligible).toBe(false);
    expect(g.total).toBe(0);
  });
  it('exactly one year (inclusive) = 21 days of basic', () => {
    const g = val(calcGratuity({ basicSalary: 9000, startDate: '2023-01-01', endDate: '2023-12-31' }));
    expect(g.serviceDays).toBe(365);
    expect(g.total).toBeCloseTo(21 * 300, 6);
  });
  it('splits 21-day and 30-day tiers after five years', () => {
    // 7 × 365 days exactly
    const g = val(calcGratuity({ basicSalary: 6000, startDate: '2010-01-01', endDate: '2016-12-29' }));
    expect(g.serviceDays).toBe(7 * 365);
    expect(g.tier1Amount).toBeCloseTo(5 * 21 * 200, 6);
    expect(g.tier2Amount).toBeCloseTo(2 * 30 * 200, 6);
    expect(g.capped).toBe(false);
  });
  it('pays fractions of a year pro rata', () => {
    const g = val(calcGratuity({ basicSalary: 3000, startDate: '2020-01-01', endDate: '2021-07-01' })); // 548 days
    expect(g.serviceDays).toBe(548);
    expect(g.total).toBeCloseTo((548 / 365) * 21 * 100, 6);
  });
  it('removes unpaid absence days from service', () => {
    const g = val(calcGratuity({ basicSalary: 3000, startDate: '2023-01-01', endDate: '2023-12-31', unpaidAbsenceDays: 10 }));
    expect(g.serviceDays).toBe(355);
    expect(g.eligible).toBe(false);
  });
  it('caps at two years of basic wage', () => {
    const g = val(calcGratuity({ basicSalary: 1000, startDate: '1980-01-01', endDate: '2020-01-01' }));
    expect(g.capped).toBe(true);
    expect(g.total).toBe(24000);
  });
  it('accepts zero salary', () => {
    expect(val(calcGratuity({ basicSalary: 0, startDate: '2020-01-01', endDate: '2023-01-01' })).total).toBe(0);
  });
  it('validates bad input', () => {
    expect(errs(calcGratuity({ basicSalary: -1, startDate: '2020-01-01', endDate: '2023-01-01' }))).toContain('basicSalary');
    expect(errs(calcGratuity({ basicSalary: 100, startDate: '2023-01-01', endDate: '2020-01-01' }))).toContain('endDate');
    expect(errs(calcGratuity({ basicSalary: null, startDate: 'x', endDate: '2020-01-01' }))).toEqual(['basicSalary', 'startDate']);
    expect(errs(calcGratuity({ basicSalary: 100, startDate: '2023-01-01', endDate: '2023-01-05', unpaidAbsenceDays: 9 }))).toContain('unpaidAbsenceDays');
  });
});

describe('vat', () => {
  it('adds 5%', () => {
    const r = val(calcVat({ mode: 'add', ratePercent: 5, amount: 1000 }));
    expect(r.total).toBeCloseTo(1050);
    expect(r.tax).toBeCloseTo(50);
  });
  it('extracts 5% from an inclusive price (not 5% of the total)', () => {
    const r = val(calcVat({ mode: 'extract', ratePercent: 5, amount: 1050 }));
    expect(r.base).toBeCloseTo(1000);
    expect(r.tax).toBeCloseTo(50);
    expect(r.tax).not.toBeCloseTo(1050 * 0.05);
  });
  it('handles 15% and zero amount and zero rate', () => {
    expect(val(calcVat({ mode: 'add', ratePercent: 15, amount: 200 })).total).toBeCloseTo(230);
    expect(val(calcVat({ mode: 'add', ratePercent: 5, amount: 0 })).total).toBe(0);
    expect(val(calcVat({ mode: 'extract', ratePercent: 0, amount: 99 })).tax).toBe(0);
  });
  it('rejects negatives', () => {
    expect(errs(calcVat({ mode: 'add', ratePercent: 5, amount: -5 }))).toContain('amount');
  });
});

describe('loan', () => {
  it('matches the standard annuity formula', () => {
    // 100,000 at 4.5% for 48 months ≈ 2280.37
    const r = val(calcLoan({ principal: 100000, annualRatePercent: 4.5, months: 48, method: 'reducing' }));
    expect(round(r.payment, 2)).toBe(2280.35);
    expect(r.years).toHaveLength(4);
    const sumPrincipal = r.years.reduce((s, y) => s + y.principal, 0);
    expect(sumPrincipal).toBeCloseTo(100000, 4);
    expect(r.totalInterest).toBeCloseTo(r.payment * 48 - 100000, 6);
  });
  it('handles zero interest', () => {
    expect(monthlyPayment(1200, 0, 12)).toBe(100);
    expect(val(calcLoan({ principal: 1200, annualRatePercent: 0, months: 12, method: 'reducing' })).totalInterest).toBeCloseTo(0, 9);
  });
  it('flat interest uses the full principal for the whole term', () => {
    const r = val(calcLoan({ principal: 100000, annualRatePercent: 3, months: 60, method: 'flat' }));
    expect(r.totalInterest).toBeCloseTo(15000);
    expect(r.payment).toBeCloseTo(115000 / 60);
  });
  it('flat costs more than reducing at the same headline rate', () => {
    const f = val(calcLoan({ principal: 50000, annualRatePercent: 5, months: 36, method: 'flat' }));
    const d = val(calcLoan({ principal: 50000, annualRatePercent: 5, months: 36, method: 'reducing' }));
    expect(f.totalInterest).toBeGreaterThan(d.totalInterest);
  });
  it('validates term', () => {
    expect(errs(calcLoan({ principal: 1000, annualRatePercent: 5, months: 0, method: 'reducing' }))).toContain('months');
    expect(errs(calcLoan({ principal: 1000, annualRatePercent: 5, months: 12.5, method: 'reducing' }))).toContain('months');
  });
});

describe('percentage', () => {
  it('keeps the three questions distinct', () => {
    expect(val(percentOf(40, 250)).value).toBe(100); // 40% of 250
    expect(val(whatPercent(40, 250)).value).toBe(16); // 40 is 16% of 250
    expect(val(percentChange(250, 300)).value).toBe(20);
  });
  it('handles division by zero without NaN/Infinity', () => {
    expect(errs(whatPercent(5, 0))).toContain('whole');
    expect(errs(percentChange(0, 10))).toContain('from');
  });
  it('reports direction of change', () => {
    expect(val(percentChange(200, 150)).direction).toBe('down');
    expect(val(percentChange(-100, -50)).value).toBe(50);
  });
});

describe('discount', () => {
  it('applies discounts sequentially (30% then 10% = 37%)', () => {
    const r = val(calcDiscount({ price: 100, first: 30, second: 10 }));
    expect(r.final).toBeCloseTo(63);
    expect(r.effectivePercent).toBeCloseTo(37);
  });
  it('treats an empty second discount as zero and price 0 safely', () => {
    expect(val(calcDiscount({ price: 80, first: 25, second: null })).final).toBe(60);
    expect(val(calcDiscount({ price: 0, first: 50 })).effectivePercent).toBe(0);
  });
  it('rejects discounts over 100%', () => {
    expect(errs(calcDiscount({ price: 10, first: 120 }))).toContain('first');
  });
});

describe('age', () => {
  it('computes years, months, days', () => {
    const a = val(calcAge({ birthDate: '1995-06-15', onDate: '2026-10-17' }));
    expect([a.years, a.months, a.days]).toEqual([31, 4, 2]);
    expect(a.nextBirthday).toBe('2027-06-15');
  });
  it('detects the birthday itself', () => {
    const a = val(calcAge({ birthDate: '2000-10-17', onDate: '2026-10-17' }));
    expect(a.years).toBe(26);
    expect(a.isBirthday).toBe(true);
    expect(a.daysToNextBirthday).toBe(0);
  });
  it('handles 29 February birthdays in non-leap years', () => {
    const a = val(calcAge({ birthDate: '2004-02-29', onDate: '2025-02-28' }));
    expect(a.years).toBe(21);
    const b = val(calcAge({ birthDate: '2004-02-29', onDate: '2025-02-27' }));
    expect(b.years).toBe(20);
    expect(b.daysToNextBirthday).toBe(1);
  });
  it('handles month ends', () => {
    const a = val(calcAge({ birthDate: '2000-01-31', onDate: '2000-03-01' }));
    expect([a.years, a.months, a.days]).toEqual([0, 1, 1]); // 31 Jan → 29 Feb (clamped) → 1 Mar
  });
  it('rejects future birth dates', () => {
    expect(errs(calcAge({ birthDate: '2030-01-01', onDate: '2026-01-01' }))).toContain('birthDate');
  });
});

describe('bmi', () => {
  it('computes and classifies', () => {
    const b = val(calcBmi({ weightKg: 75, heightCm: 175 }));
    expect(round(b.bmi, 1)).toBe(24.5);
    expect(b.category).toBe('normal');
    expect(b.normalMinKg).toBeCloseTo(56.66, 1);
  });
  it('uses half-open bands at the boundaries', () => {
    expect(bmiCategory(18.4999)).toBe('under');
    expect(bmiCategory(18.5)).toBe('normal');
    expect(bmiCategory(25)).toBe('over');
    expect(bmiCategory(30)).toBe('obese');
  });
  it('rejects implausible values', () => {
    expect(errs(calcBmi({ weightKg: 0, heightCm: 170 }))).toContain('weightKg');
    expect(errs(calcBmi({ weightKg: 70, heightCm: 0 }))).toContain('heightCm');
  });
});

describe('zakat', () => {
  it('2.5% when nisab is reached', () => {
    const z = val(calcZakat({ cash: 60000, investments: 20000, debts: 5000, goldPricePerGram: 400 }));
    expect(z.net).toBe(75000);
    expect(z.nisab).toBe(34000);
    expect(z.reachesNisab).toBe(true);
    expect(z.zakat).toBeCloseTo(1875);
  });
  it('nothing below nisab', () => {
    const z = val(calcZakat({ cash: 10000, investments: 0, debts: 0, goldPricePerGram: 400 }));
    expect(z.reachesNisab).toBe(false);
    expect(z.zakat).toBe(0);
  });
  it('without a gold price, nisab is unknown — never invented', () => {
    const z = val(calcZakat({ cash: 1000, investments: 0, debts: 0, goldPricePerGram: null }));
    expect(z.nisab).toBeNull();
    expect(z.reachesNisab).toBeNull();
  });
  it('debts larger than assets give zero, not negative', () => {
    expect(val(calcZakat({ cash: 100, investments: 0, debts: 500, goldPricePerGram: 300 })).net).toBe(0);
  });
});
