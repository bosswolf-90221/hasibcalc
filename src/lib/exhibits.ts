// Per-calculator exhibits as HTML strings, shared by the server render and the browser update.
// Inputs are numbers only (never user text), so the markup is safe to inject.
import type { Gratuity } from './calc/gratuity';
import type { Vat } from './calc/vat';
import type { LoanYear } from './calc/loan';
import type { Discount } from './calc/discount';
import type { Zakat } from './calc/zakat';
import { BMI_BANDS } from './calc/bmi';
import { fmt, money } from './format';

const pct = (x: number) => `${Math.max(0, Math.min(100, x)).toFixed(3)}%`;

/** Service timeline: one tick per year, 21-day years then 30-day years, a marker where service ends. */
export function serviceTimeline(g: Gratuity | null): string {
  const sy = g ? g.serviceYears : 0;
  const N = Math.min(40, Math.max(6, Math.ceil(sy + 0.0001)));
  const step = N > 20 ? 5 : N > 10 ? 2 : 1;
  const a = Math.min(sy, 5);
  const b = Math.max(0, Math.min(sy, N) - 5);
  let ticks = '';
  for (let y = 0; y <= N; y++) {
    const major = y % step === 0;
    ticks += `<span class="tk${major ? ' mj' : ''}${y === 5 ? ' five' : ''}" style="inset-inline-start:${pct((y / N) * 100)}">${major ? `<i>${y}</i>` : ''}</span>`;
  }
  return `<div class="tl" role="img" aria-label="خط زمني لمدة الخدمة: ${fmt(sy, 1)} سنة">
    <div class="tl-track">
      <span class="tl-a" style="inset-inline-start:0;width:${pct((a / N) * 100)}"></span>
      <span class="tl-b" style="inset-inline-start:${pct((5 / N) * 100)};width:${pct((b / N) * 100)}"></span>
      <span class="tl-one" style="inset-inline-start:${pct((1 / N) * 100)}"></span>
      <span class="tl-now" style="inset-inline-start:${pct((Math.min(sy, N) / N) * 100)}"><b class="nums">${fmt(sy, 1)}</b></span>
    </div>
    <div class="tl-ticks">${ticks}</div>
  </div>`;
}

/** VAT as an equation: base + tax = total. */
export function vatEquation(v: Vat | null): string {
  if (!v) return '';
  return `<div class="eq">
    <div class="eq-t"><span>قبل الضريبة</span><b class="nums">${money(v.base)}</b></div>
    <span class="eq-op">+</span>
    <div class="eq-t"><span>الضريبة ${fmt(v.rate, v.rate % 1 ? 2 : 0)}%</span><b class="nums">${money(v.tax)}</b></div>
    <span class="eq-op">=</span>
    <div class="eq-t tot"><span>الإجمالي</span><b class="nums">${money(v.total)}</b></div>
  </div>`;
}

/** Yearly loan schedule. */
export function loanSchedule(years: LoanYear[]): string {
  const rows = years.map((y) => `<tr><td>السنة ${y.year}</td><td class="n">${money(y.principal)}</td><td class="n">${money(y.interest)}</td><td class="n">${money(y.balance)}</td></tr>`).join('');
  return `<div class="scroll-x"><table class="ledger"><thead><tr><th>الفترة</th><th class="n">من أصل القرض</th><th class="n">الفوائد</th><th class="n">الرصيد المتبقي</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

/** Discount chain: original → −d1 → after → −d2 → final. */
export function discountChain(d: Discount | null, d1: number, d2: number): string {
  if (!d) return '';
  const second = d2 > 0 ? `<span class="ch-op">− ${fmt(d2, d2 % 1 ? 1 : 0)}%</span><span class="ch-v nums">${money(d.final)}</span>` : '';
  return `<div class="chain">
    <span class="ch-v was nums">${money(d.price)}</span>
    <span class="ch-op">− ${fmt(d1, d1 % 1 ? 1 : 0)}%</span>
    <span class="ch-v${d2 > 0 ? '' : ' fin'} nums">${money(d.afterFirst)}</span>
    ${second.replace('class="ch-v nums"', 'class="ch-v fin nums"')}
  </div>`;
}

/** BMI as a measuring scale from 15 to 40 with category zones and a pointer. */
export function bmiScale(bmi: number | null): string {
  const lo = 15, hi = 40;
  const at = (x: number) => pct(((Math.min(hi, Math.max(lo, x)) - lo) / (hi - lo)) * 100);
  const zones = BMI_BANDS.map((b) => {
    const from = Math.max(lo, b.from), to = Math.min(hi, b.to);
    return `<span class="z z-${b.key}" style="inset-inline-start:${at(from)};width:${pct(((to - from) / (hi - lo)) * 100)}"><i>${b.label}</i></span>`;
  }).join('');
  let ticks = '';
  for (let x = lo; x <= hi; x++) {
    const major = x % 5 === 0;
    const label = major && x !== 20; // 20 sits too close to 18.5
    ticks += `<span class="tk${major ? ' mj' : ''}" style="inset-inline-start:${at(x)}">${label ? `<i>${x}</i>` : ''}</span>`;
  }
  ticks += `<span class="tk mj key" style="inset-inline-start:${at(18.5)}"><i>18.5</i></span>`;
  const ptr = bmi === null ? '' : `<span class="ptr" style="inset-inline-start:${at(bmi)}"><b class="nums">${fmt(bmi, 1)}</b></span>`;
  return `<div class="bscale" role="img" aria-label="مقياس مؤشر كتلة الجسم من 15 إلى 40">${ptr}<div class="zones">${zones}</div><div class="bticks">${ticks}</div></div>`;
}

/** Zakat ledger: assets, debts, net, nisab, zakat. */
export function zakatLedger(cash: number, inv: number, debts: number, z: Zakat | null): string {
  if (!z) return '';
  const nisab = z.nisab === null ? '<td class="n muted">أدخل سعر الذهب</td>' : `<td class="n">${money(z.nisab)}</td>`;
  const reach = z.reachesNisab === null ? '' : `<tr><td class="op"></td><td>${z.reachesNisab ? 'بلغ مالك النصاب' : 'مالك دون النصاب'}</td><td class="n">${z.reachesNisab ? '✓' : '—'}</td></tr>`;
  return `<table class="ledger zl">
    <tbody>
      <tr><td class="op"></td><td>النقد والمدخرات</td><td class="n">${money(cash)}</td></tr>
      <tr><td class="op">+</td><td>الاستثمارات</td><td class="n">${money(inv)}</td></tr>
      <tr><td class="op">−</td><td>الديون الحالّة</td><td class="n">${money(debts)}</td></tr>
      <tr class="total"><td class="op">=</td><td>صافي المال الزكوي</td><td class="n">${money(z.net)}</td></tr>
      <tr><td class="op"></td><td>النصاب (85 غراماً من الذهب)</td>${nisab}</tr>
      ${reach}
      <tr class="total"><td class="op">×</td><td>2.5% زكاة مبدئية</td><td class="n">${money(z.zakat)}</td></tr>
    </tbody>
  </table>`;
}
