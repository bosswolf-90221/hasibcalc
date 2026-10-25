// View models for the date, pregnancy and calorie calculators.
import type { View } from './views';
import { HIJRI_MONTHS, type Conversion } from './calc/hijri';
import type { DateSpan } from './calc/dates';
import type { Pregnancy } from './calc/pregnancy';
import type { Calories } from './calc/calories';
import { arDate, days, int, months, years } from './format';
import { pregnancyMonth } from './calc/pregnancy';

const G_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export const hijriText = (c: Conversion) => `${c.hijri.day} ${HIJRI_MONTHS[c.hijri.month - 1]} ${c.hijri.year} هـ`;
const gParts = (iso: string) => iso.split('-').map(Number);

export function toHijriView(c: Conversion): View {
  return {
    label: 'التاريخ الهجري (أم القرى)',
    value: c.hijri.day,
    decimals: 0,
    unit: `${HIJRI_MONTHS[c.hijri.month - 1]} ${c.hijri.year} هـ`,
    sentence: `يوافق ${c.weekday} ${arDate(c.gregorian)} م.`,
    badge: c.weekday,
    rows: [
      ['التاريخ الهجري رقمياً', `${c.hijri.year}/${String(c.hijri.month).padStart(2, '0')}/${String(c.hijri.day).padStart(2, '0')}`],
      ['عدد أيام هذا الشهر الهجري', days(c.hijriMonthLength)],
      ['التاريخ الميلادي', arDate(c.gregorian)],
    ],
  };
}

export function toGregorianView(c: Conversion): View {
  const [y, m] = gParts(c.gregorian);
  return {
    label: 'التاريخ الميلادي',
    value: gParts(c.gregorian)[2],
    decimals: 0,
    unit: `${G_MONTHS[m - 1]} ${y} م`,
    sentence: `يوافق ${c.weekday} ${hijriText(c)}.`,
    badge: c.weekday,
    rows: [
      ['التاريخ الميلادي رقمياً', c.gregorian.split('-').reverse().join('/')],
      ['عدد أيام الشهر الهجري', days(c.hijriMonthLength)],
      ['التاريخ الهجري', hijriText(c)],
    ],
  };
}

export function dateSpanView(s: DateSpan, includeEnd: boolean): View {
  return {
    label: includeEnd ? 'عدد الأيام شاملاً اليوم الأخير' : 'عدد الأيام بين التاريخين',
    value: s.days,
    decimals: 0,
    unit: 'يوماً',
    sentence: `أي ${s.months > 0 ? `${months(s.months)}${s.monthRemainderDays ? ` و${days(s.monthRemainderDays)}` : ''}` : days(s.days)}${s.reversed ? '. انتبه: تاريخ النهاية قبل تاريخ البداية، فحسبنا المدة بينهما.' : '.'}`,
    badge: `${int(s.workingDays)} يوم عمل`,
    rows: [
      ['بالأسابيع', s.weekRemainder ? `${int(s.weeks)} أسبوعاً و${days(s.weekRemainder)}` : `${int(s.weeks)} أسبوعاً`],
      ['أيام العمل', int(s.workingDays)],
      ['أيام نهاية الأسبوع', int(s.weekendDays)],
      ['بالساعات', int(s.days * 24)],
    ],
  };
}

const TRIMESTER = ['الأول', 'الثاني', 'الثالث'];
export function pregnancyView(p: Pregnancy): View {
  const [y, m, d] = gParts(p.dueDate);
  const left = p.daysToDue >= 0 ? `باقي ${days(p.daysToDue)} تقريباً` : `تجاوزتِ الموعد بـ${days(-p.daysToDue)}`;
  return {
    label: 'موعد الولادة المتوقع',
    value: d,
    decimals: 0,
    unit: `${G_MONTHS[m - 1]} ${y}`,
    sentence: `عمر الحمل ${int(p.weeks)} أسبوعاً${p.days ? ` و${days(p.days)}` : ''}، في الثلث ${TRIMESTER[p.trimester - 1]}. ${left}.`,
    badge: `الأسبوع ${p.weeks + 1} من الحمل`,
    rows: [
      ['عمر الحمل', `${int(p.weeks)} أسبوعاً و${days(p.days)}`],
      ['الشهر من الحمل', `الشهر ${['الأول','الثاني','الثالث','الرابع','الخامس','السادس','السابع','الثامن','التاسع'][pregnancyMonth(p.weeks + 1) - 1]}`],
      ['الإخصاب التقريبي', arDate(p.conception)],
      ['نهاية الثلث الأول', arDate(p.firstTrimesterEnds)],
      ['نهاية الثلث الثاني', arDate(p.secondTrimesterEnds)],
    ],
  };
}

export function caloriesView(c: Calories): View {
  return {
    label: 'سعراتك اليومية للمحافظة على وزنك',
    value: Math.round(c.maintenance),
    decimals: 0,
    unit: 'سعرة',
    sentence: `جسمك يحرق نحو ${int(Math.round(c.bmr))} سعرة في الراحة التامة، وتضاف إليها حركتك اليومية.`,
    rows: [
      ['معدل الأيض الأساسي (BMR)', `${int(Math.round(c.bmr))} سعرة`],
      ['معامل النشاط', String(c.factor)],
      ['خسارة تدريجية (نحو نصف كيلو أسبوعياً)', `${int(Math.round(Math.max(c.maintenance - 500, c.bmr)))} سعرة`],
      ['زيادة تدريجية', `${int(Math.round(c.maintenance + 300))} سعرة`],
    ],
  };
}

import type { Gosi, Nationality, GosiSystem } from './calc/gosi';
import { money } from './format';
const pctTxt = (n: number) => `${String(n).replace(/\.0+$/, '')}%`;
export function gosiView(g: Gosi, nationality: Nationality, system: GosiSystem): View {
  const saudi = nationality === 'saudi';
  const capNote = g.capped === 'max' ? ' (حُسب على الحد الأعلى 45,000 ريال)' : g.capped === 'min' ? ' (حُسب على الحد الأدنى 1,500 ريال)' : '';
  return {
    label: 'يُخصم من راتبك شهرياً',
    value: g.employee,
    decimals: 2,
    unit: 'ريال',
    sentence: saudi
      ? `راتبك الصافي ${money(g.netAfterDeduction)} ريال. ويدفع صاحب العمل ${money(g.employer)} ريال، فمجموع الاشتراك ${money(g.total)} ريال${capNote}.`
      : `لا يُخصم شيء من راتب غير السعودي، فراتبك الصافي ${money(g.netAfterDeduction)} ريال. صاحب العمل وحده يدفع 2% للأخطار المهنية: ${money(g.employer)} ريال شهرياً${capNote}.`,
    badge: saudi ? (system === 'new' ? `النظام الجديد · معاشات ${pctTxt(g.pensionRate)}` : 'النظام السابق · معاشات 9%') : 'غير سعودي',
    rows: [
      ['راتبك الصافي بعد الخصم', `${money(g.netAfterDeduction)} ريال`],
      ['إجمالي راتبك', `${money(g.gross)} ريال`],
      ['أجر الاشتراك (الأساسي + السكن)', `${money(g.wage)} ريال`],
      ['نسبة خصمك', pctTxt(+g.employeeRate.toFixed(2))],
      ['حصة صاحب العمل', `${money(g.employer)} ريال`],
      ['نسبة صاحب العمل', pctTxt(+g.employerRate.toFixed(2))],
    ],
  };
}

import type { HijriAge } from './calc/hijri-age';
const hText = (h: { year: number; month: number; day: number }) => `${h.day} ${HIJRI_MONTHS[h.month - 1]} ${h.year} هـ`;
export function hijriAgeView(a: HijriAge): View {
  return {
    label: 'عمرك بالتقويم الهجري',
    value: a.years,
    decimals: 0,
    unit: 'سنة هجرية',
    sentence: `و${months(a.months)} و${days(a.days)}. وعمرك بالميلادي ${years(a.gregorianYears)} و${months(a.gregorianMonths)}.`,
    badge: a.isBirthday ? 'اليوم عيد ميلادك الهجري' : `باقي ${days(a.daysToNextBirthday)} على عيد ميلادك الهجري`,
    rows: [
      ['تاريخ ميلادك بالهجري', hText(a.birthHijri)],
      ['تاريخ ميلادك بالميلادي', arDate(a.birthGregorian)],
      ['عمرك بالميلادي', `${years(a.gregorianYears)} و${months(a.gregorianMonths)}`],
      [`عيد ميلادك الهجري القادم (${a.nextBirthdayHijriYear} هـ)`, arDate(a.nextBirthday)],
      ['الأيام التي عشتها', int(a.totalDays)],
    ],
  };
}

import type { PaydayResult } from './calc/payday';
import { plural } from './format';
const weeksTxt = (n: number) => plural(n, { one: 'أسبوع واحد', two: 'أسبوعان', few: 'أسابيع', many: 'أسبوعاً' });
export function paydayView(p: PaydayResult, payDay: number): View {
  const n = p.next;
  const moved = n.shifted ? ` نُقل من يوم ${payDay} لأنه يوافق عطلة نهاية الأسبوع.` : '';
  const after = p.upcoming[1];
  return {
    label: p.isToday ? 'راتبك اليوم' : 'باقي على الراتب',
    value: p.daysLeft,
    decimals: 0,
    unit: p.isToday ? 'يوم الراتب' : p.daysLeft <= 2 ? 'يوم' : p.daysLeft <= 10 ? 'أيام' : 'يوماً',
    sentence: p.isToday ? `اليوم ${n.weekday} ${arDate(n.actual)} هو يوم راتبك.${moved}` : `راتبك القادم يوم ${n.weekday} ${arDate(n.actual)}.${moved}`,
    badge: n.weekday,
    rows: [
      ['موعد الراتب القادم', `${n.weekday} ${arDate(n.actual)}`],
      ['الباقي بالأسابيع', p.daysLeft >= 7 ? `${weeksTxt(Math.floor(p.daysLeft / 7))}${p.daysLeft % 7 ? ` و${days(p.daysLeft % 7)}` : ''}` : days(p.daysLeft)],
      ['الراتب الذي يليه', after ? `${after.weekday} ${arDate(after.actual)}` : '—'],
    ],
  };
}

import type { Ovulation } from './calc/ovulation';
const shortDate = (iso: string) => { const [y, m, d] = gParts(iso); return `${d} ${G_MONTHS[m - 1]}`; };
export function ovulationView(o: Ovulation): View {
  const [y, m, d] = gParts(o.focus.ovulation);
  return {
    label: 'يوم التبويض المتوقع',
    value: d,
    decimals: 0,
    unit: `${G_MONTHS[m - 1]} ${y}`,
    sentence: `أيام الخصوبة من ${shortDate(o.focus.fertileStart)} إلى ${shortDate(o.focus.ovulation)}، ودورتك القادمة متوقعة ${arDate(o.current.nextStart)}.`,
    badge: o.fertileToday ? 'اليوم من أيام الخصوبة' : `اليوم ${o.cycleDay} من دورتك`,
    rows: [
      ['باقي على التبويض', o.daysToOvulation === 0 ? 'اليوم' : days(o.daysToOvulation)],
      ['أيام الخصوبة', `${shortDate(o.focus.fertileStart)} – ${shortDate(o.focus.ovulation)}`],
      ['الدورة القادمة', `${arDate(o.current.nextStart)} (بعد ${days(o.daysToNextPeriod)})`],
      ['اليوم من الدورة الحالية', int(o.cycleDay)],
    ],
  };
}
