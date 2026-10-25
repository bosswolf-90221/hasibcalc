// Exhibits for the newer calculators. Numbers and fixed labels only.
import { HIJRI_MONTHS, type Conversion } from './calc/hijri';
import type { DateSpan } from './calc/dates';
import type { Pregnancy } from './calc/pregnancy';
import type { Calories } from './calc/calories';
import { arDate, int } from './format';

/** Two calendar leaves side by side. */
export function calendarLeaves(c: Conversion | null): string {
  if (!c) return '';
  const [y, m, d] = c.gregorian.split('-').map(Number);
  const G = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const leaf = (k: string, day: number, month: string, year: string) =>
    `<div class="leaf"><span class="lk">${k}</span><b class="nums">${day}</b><span>${month}</span><small class="nums">${year}</small></div>`;
  return `<div class="leaves">${leaf('هجري · أم القرى', c.hijri.day, HIJRI_MONTHS[c.hijri.month - 1], `${c.hijri.year} هـ`)}<span class="eq-op">=</span>${leaf('ميلادي', d, G[m - 1], `${y} م`)}</div><p class="leaf-day">${c.weekday}</p>`;
}

/** A row of week blocks: working days vs weekend days. */
export function spanBlocks(s: DateSpan | null): string {
  if (!s) return '';
  const total = Math.max(s.days, 1);
  const w = (s.workingDays / total) * 100;
  return `<div class="split"><span class="sa" style="width:${w.toFixed(2)}%"></span><span class="sb" style="width:${(100 - w).toFixed(2)}%"></span></div>
  <div class="eq"><div class="eq-t"><span>أيام عمل</span><b class="nums">${int(s.workingDays)}</b></div><span class="eq-op">+</span><div class="eq-t"><span>نهاية الأسبوع</span><b class="nums">${int(s.weekendDays)}</b></div><span class="eq-op">=</span><div class="eq-t tot"><span>المجموع</span><b class="nums">${int(s.days)}</b></div></div>`;
}

/** 40-week ruler with trimester zones and a marker. */
export function pregnancyRuler(p: Pregnancy | null): string {
  const ga = p ? Math.min(p.gestationDays / 7, 42) : 0;
  const at = (w: number) => `${((w / 42) * 100).toFixed(3)}%`;
  let ticks = '';
  for (let w = 0; w <= 42; w += 2) ticks += `<span class="tk${w % 4 === 0 ? ' mj' : ''}" style="inset-inline-start:${at(w)}">${w % 4 === 0 ? `<i>${w}</i>` : ''}</span>`;
  const zone = (from: number, to: number, cls: string, label: string) => `<span class="z ${cls}" style="inset-inline-start:${at(from)};width:${at(to - from)}"><i>${label}</i></span>`;
  const ptr = p ? `<span class="ptr" style="inset-inline-start:${at(ga)}"><b class="nums">${p.weeks}</b></span>` : '';
  return `<div class="bscale" role="img" aria-label="مسطرة الحمل بالأسابيع">${ptr}<div class="zones">${zone(0, 14, 'z-under', 'الثلث الأول')}${zone(14, 28, 'z-normal', 'الثلث الثاني')}${zone(28, 42, 'z-over', 'الثلث الثالث')}</div><div class="bticks">${ticks}</div></div>${p ? `<p class="leaf-day">الموعد المتوقع ${arDate(p.dueDate)}، والولادة بين الأسبوع 37 والأسبوع 42 تُعد في موعدها.</p>` : ''}`;
}

/** Calories for every activity level, the chosen one highlighted. */
export function activityTable(c: Calories | null, chosen: string): string {
  if (!c) return '';
  const max = Math.max(...c.byActivity.map((a) => a.kcal));
  const rows = c.byActivity
    .map((a) => `<tr${a.key === chosen ? ' class="total"' : ''}><td>${a.label}</td><td class="bar-cell"><span class="hbar" style="width:${((a.kcal / max) * 100).toFixed(1)}%"></span></td><td class="n">${int(Math.round(a.kcal))}</td></tr>`)
    .join('');
  return `<div class="scroll-x"><table class="ledger"><thead><tr><th>مستوى النشاط</th><th></th><th class="n">سعرة يومياً</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

import { NEW_SYSTEM_STEPS, SANED, HAZARDS } from './calc/gosi';
import { fmt } from './format';
/** Rates by period: legacy vs new system, current period highlighted. */
export function gosiSchedule(onISO: string, system: string, nationality: string): string {
  const fmtD = (iso: string) => { const [y, m] = iso.split('-').map(Number); return `${['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'][m - 1]} ${y}`; };
  let cur = 0;
  NEW_SYSTEM_STEPS.forEach(([from], i) => { if (onISO >= from) cur = i; });
  const rows = NEW_SYSTEM_STEPS.map(([from, rate], i) => {
    const hl = nationality === 'saudi' && system === 'new' && i === cur;
    return `<tr${hl ? ' class="total"' : ''}><td>من ${fmtD(from)}</td><td class="n">${fmt(rate + SANED, 2)}%</td><td class="n">${fmt(rate + SANED + HAZARDS, 2)}%</td></tr>`;
  }).join('');
  const legacyHl = nationality === 'saudi' && system === 'legacy';
  return `<div class="scroll-x"><table class="ledger"><thead><tr><th>الفترة</th><th class="n">على الموظف</th><th class="n">على صاحب العمل</th></tr></thead><tbody>
  <tr${legacyHl ? ' class="total"' : ''}><td>النظام السابق (أي وقت)</td><td class="n">9.75%</td><td class="n">11.75%</td></tr>${rows}
  <tr${nationality !== 'saudi' ? ' class="total"' : ''}><td>غير السعوديين</td><td class="n">0%</td><td class="n">2%</td></tr></tbody></table></div>
  <p class="leaf-day">النسب تشمل المعاشات وساند (0.75% لكل طرف)، وعلى صاحب العمل 2% للأخطار المهنية. صفوف «من…» للمسجلين أول مرة بعد 3 يوليو 2024.</p>`;
}

import type { PaydayResult } from './calc/payday';
/** The next 12 salary days, marking those moved off the weekend. */
export function paydayTable(p: PaydayResult | null): string {
  if (!p) return '';
  const rows = p.upcoming
    .map((d, i) => `<tr${i === 0 ? ' class="total"' : ''}><td>${arDate(d.actual)}</td><td>${d.weekday}</td><td>${d.shifted ? `نُقل من ${arDate(d.nominal)}` : 'في موعده'}</td></tr>`)
    .join('');
  return `<div class="scroll-x"><table class="ledger"><thead><tr><th>تاريخ الراتب</th><th>اليوم</th><th>ملاحظة</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}
