import { type CalcResult, Validator, fail, ok } from './core';

/**
 * Preliminary zakat on money: 2.5% of net zakatable wealth if it reaches the gold nisab (85 g).
 * The gold price is entered by the user — the site never invents a live price.
 * Whether the lunar year (hawl) has passed, and how specific investments and debts are treated, are left to the user.
 */
export const NISAB_GOLD_GRAMS = 85;
export const ZAKAT_RATE = 0.025;

export type ZakatInput = { cash: number | null; investments: number | null; debts: number | null; goldPricePerGram: number | null };
export type Zakat = { net: number; nisab: number | null; reachesNisab: boolean | null; zakat: number };

export function calcZakat(input: ZakatInput): CalcResult<Zakat> {
  const v = new Validator();
  const cash = v.number('cash', input.cash ?? 0, { min: 0, max: 1e13, label: 'النقد والمدخرات' });
  const inv = v.number('investments', input.investments ?? 0, { min: 0, max: 1e13, label: 'الاستثمارات' });
  const debts = v.number('debts', input.debts ?? 0, { min: 0, max: 1e13, label: 'الديون' });
  const gold = input.goldPricePerGram === null ? null : v.number('goldPricePerGram', input.goldPricePerGram, { min: 0.01, max: 1e6, label: 'سعر غرام الذهب' });
  if (!v.valid) return fail(v.errors);

  const net = Math.max(0, cash + inv - debts);
  if (gold === null) return ok({ net, nisab: null, reachesNisab: null, zakat: net * ZAKAT_RATE });
  const nisab = NISAB_GOLD_GRAMS * gold;
  const reachesNisab = net >= nisab;
  return ok({ net, nisab, reachesNisab, zakat: reachesNisab ? net * ZAKAT_RATE : 0 });
}
