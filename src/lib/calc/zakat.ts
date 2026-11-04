import { type CalcResult, Validator, fail, ok } from './core';

/**
 * Preliminary zakat on money: 2.5% of net zakatable wealth if it reaches the chosen nisab.
 * Authorities differ on the nisab of paper money, so the user picks the basis; the site does not decide:
 *  - gold: 85 g of pure gold (UAE Fatwa Council statement, WAM, 9 Apr 2024).
 *  - lower: the lower of 85 g gold or 595 g silver (ZATCA individual zakat guide, citing the Saudi Standing Committee).
 * Prices are entered by the user — the site never invents a live price.
 * Whether the lunar year (hawl) has passed, and how specific investments and debts are treated, are left to the user.
 */
export const NISAB_GOLD_GRAMS = 85;
export const NISAB_SILVER_GRAMS = 595;
export const ZAKAT_RATE = 0.025;
export type NisabBasis = 'gold' | 'lower';

export type ZakatInput = { cash: number | null; investments: number | null; debts: number | null; goldPricePerGram: number | null; silverPricePerGram?: number | null; basis?: NisabBasis };
export type Zakat = { net: number; basis: NisabBasis; nisabGold: number | null; nisabSilver: number | null; nisab: number | null; reachesNisab: boolean | null; zakat: number };

export function calcZakat(input: ZakatInput): CalcResult<Zakat> {
  const v = new Validator();
  const cash = v.number('cash', input.cash ?? 0, { min: 0, max: 1e13, label: 'النقد والمدخرات' });
  const inv = v.number('investments', input.investments ?? 0, { min: 0, max: 1e13, label: 'الاستثمارات' });
  const debts = v.number('debts', input.debts ?? 0, { min: 0, max: 1e13, label: 'الديون' });
  const gold = input.goldPricePerGram === null ? null : v.number('goldPricePerGram', input.goldPricePerGram, { min: 0.01, max: 1e6, label: 'سعر غرام الذهب' });
  const silverIn = input.silverPricePerGram ?? null;
  const silver = silverIn === null ? null : v.number('silverPricePerGram', silverIn, { min: 0.01, max: 1e6, label: 'سعر غرام الفضة' });
  if (!v.valid) return fail(v.errors);

  const basis: NisabBasis = input.basis ?? 'gold';
  const net = Math.max(0, cash + inv - debts);
  const nisabGold = gold === null ? null : NISAB_GOLD_GRAMS * gold;
  const nisabSilver = silver === null ? null : NISAB_SILVER_GRAMS * silver;
  const nisab = basis === 'gold' ? nisabGold : nisabGold === null || nisabSilver === null ? null : Math.min(nisabGold, nisabSilver);
  if (nisab === null) return ok({ net, basis, nisabGold, nisabSilver, nisab, reachesNisab: null, zakat: net * ZAKAT_RATE });
  const reachesNisab = net >= nisab;
  return ok({ net, basis, nisabGold, nisabSilver, nisab, reachesNisab, zakat: reachesNisab ? net * ZAKAT_RATE : 0 });
}
