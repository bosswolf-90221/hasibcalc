import { describe, expect, test } from 'vitest';
import { CALCULATORS } from '../src/data/calculators';
import { GUIDES } from '../src/data/guides';
import { initialFields, MOMENTS } from '../src/data/moments';
import { VERIFICATION } from '../src/data/verification';
import { calcDues } from '../src/lib/calc/exit-dues';
import { calcLoan } from '../src/lib/calc/loan';
import { arDate, money } from '../src/lib/format';
import { computeMoment } from '../src/lib/moments';

const TODAY = '2026-11-05';
const ok = (slug: string, overrides: Record<string, string> = {}) => {
  const m = MOMENTS.find((x) => x.slug === slug)!;
  const v = computeMoment(slug, { ...initialFields(m, TODAY), ...overrides }, TODAY);
  if (v.state !== 'ok') throw new Error(`${slug}: ${JSON.stringify(v)}`);
  return v;
};

describe('moments as a whole', () => {
  test('every calculator belongs to at least one moment', () => {
    const covered = new Set(MOMENTS.flatMap((m) => m.calcs));
    expect(CALCULATORS.map((c) => c.slug).filter((s) => !covered.has(s))).toEqual([]);
  });
  test('moments link only to pages that exist', () => {
    const slugs = new Set(CALCULATORS.map((c) => c.slug));
    const guides = new Set(GUIDES.map((g) => g.slug));
    for (const m of MOMENTS) {
      for (const c of m.calcs) expect(slugs.has(c), `${m.slug} → ${c}`).toBe(true);
      for (const g of m.guides) expect(guides.has(g), `${m.slug} → ${g}`).toBe(true);
    }
  });
  test('every moment states what was verified and lists its sources', () => {
    for (const m of MOMENTS) {
      expect(VERIFICATION[`moment:${m.slug}`], m.slug).toBeDefined();
      expect(m.sources.length, m.slug).toBeGreaterThan(0);
    }
  });
  test('titles and descriptions fit search results', () => {
    for (const m of MOMENTS) {
      expect(m.description.length, m.slug).toBeGreaterThanOrEqual(100);
      expect(m.description.length, m.slug).toBeLessThanOrEqual(170);
    }
  });
  test('moment links in a step lead to real calculators or guides', () => {
    const known = new Set([...CALCULATORS.map((c) => `/${c.slug}/`), ...GUIDES.map((g) => `/guides/${g.slug}/`)]);
    for (const m of MOMENTS) {
      const v = computeMoment(m.slug, { ...initialFields(m, TODAY), lmp: '2026-10-20', birth: '1995-01-01' }, TODAY);
      if (v.state === 'ok') for (const s of v.steps) if (s.href) expect(known.has(s.href), `${m.slug} → ${s.href}`).toBe(true);
    }
  });
});

describe('each moment reports the same numbers as its calculators', () => {
  test('leaving job', () => {
    const v = ok('leaving-job');
    const d = calcDues({ basicSalary: 8000, startDate: '2019-03-01', endDate: TODAY, unpaidAbsenceDays: 0, takenDays: 120 });
    if (!d.ok) throw new Error('dues');
    expect(v.value).toBe(money(d.value.total));
    expect(v.steps[0].value).toBe(money(d.value.gratuity.total));
    expect(v.steps[1].value).toBe(money(d.value.leave.amount));
  });
  test('leaving job accepts a comma decimal without inflating it', () => {
    expect(ok('leaving-job', { salary: '8000,50' }).value).toBe(ok('leaving-job', { salary: '8000.5' }).value);
  });
  test('unreadable numbers give a message, not a guess', () => {
    const m = MOMENTS[0];
    expect(computeMoment('leaving-job', { ...initialFields(m, TODAY), salary: '8000,500' }, TODAY).state).toBe('error');
  });
  test('monthly pay in Saudi Arabia: Saturday the 27th pays on Sunday the 28th', () => {
    const v = computeMoment('monthly-pay', { country: 'saudi', payDay: '27', nationality: 'saudi', system: 'new', basic: '', housing: '', other: '' }, '2027-02-20');
    if (v.state !== 'ok') throw new Error('pay');
    expect(v.steps[0].value).toBe('28 فبراير 2027');
    expect(v.value).toBe('8 أيام');
  });
  test('monthly pay shows GOSI only for Saudi Arabia', () => {
    expect(ok('monthly-pay').steps.map((s) => s.title)).toContain('يُخصم من راتبك للتأمينات');
    expect(ok('monthly-pay', { country: 'uae', payDay: '1' }).steps.map((s) => s.title)).not.toContain('يُخصم من راتبك للتأمينات');
  });
  test('taking a loan', () => {
    const l = calcLoan({ principal: 100000, annualRatePercent: 4.5, months: 48, method: 'reducing' });
    if (!l.ok) throw new Error('loan');
    expect(ok('taking-loan').value).toBe(money(l.value.payment));
    expect(ok('taking-loan', { method: 'flat' }).value).toBe('2,458.33');
  });
  test('zakat: below the gold nisab is not an absolute ruling', () => {
    const v = ok('ramadan-zakat', { cash: '20000', investments: '0', debts: '0', gold: '400' });
    expect(v.label).toBe('مالك دون النصاب الذي اخترته');
    expect(ok('ramadan-zakat', { cash: '20000', investments: '0', debts: '0', gold: '400', silver: '5', basis: 'lower' }).value).toBe('500.00');
  });
  test('next Ramadan is 1 Ramadan 1448 from today', () => {
    expect(ok('ramadan-zakat').steps.at(-1)!.value).toBe('8 فبراير 2027');
  });
  test('expecting a baby starts empty, with no invented date', () => {
    const m = MOMENTS.find((x) => x.slug === 'expecting-baby')!;
    expect(computeMoment(m.slug, initialFields(m, TODAY), TODAY).state).toBe('empty');
    expect(m.example).toBe(false);
  });
  test('expecting a baby: due date is 280 days from the last period', () => {
    expect(ok('expecting-baby', { stage: 'pregnant', lmp: '2026-08-26' }).value).toBe('2 يونيو 2027');
  });
  test('health and weight', () => {
    const v = ok('health-weight');
    expect(v.value).toBe('24.2');
    expect(v.steps[0].value).toBe('نطاق طبيعي');
  });
  test('shopping: two discounts do not add up', () => {
    const v = ok('shopping', { rate: '0' });
    expect(v.value).toBe('400.00');
    expect(v.steps[0].text).toContain('60.0%');
    expect(ok('shopping').value).toBe('420.00');
  });
  test('university: reachable and impossible targets', () => {
    expect(ok('university').value).toBe('4.75');
    expect(ok('university', { current: '3.2', target: '4.5', done: '60' }).label).toBe('لا يتحقق هذا الهدف في فصل واحد');
  });
  test('dates and ages always show today, and the age once a birth date is given', () => {
    expect(ok('dates-ages').steps[0].title).toBe('تاريخ اليوم بالهجري');
    expect(ok('dates-ages', { birth: '1995-01-01' }).label).toBe('عمرك بالضبط');
  });
});

describe('expecting-baby: the next period', () => {
  test('shows the same cycle the countdown counts to', () => {
    const v = computeMoment('expecting-baby', { stage: 'planning', lmp: '2026-10-16', cycle: '28', period: '5', today: '2026-11-05' }, '2026-11-05');
    expect(v.state).toBe('ok');
    if (v.state !== 'ok') return;
    const step = v.steps.find((x) => x.title === 'الدورة القادمة')!;
    expect(step.value).toBe(arDate('2026-11-13'));
    expect(step.text).toContain('8');
  });
});
