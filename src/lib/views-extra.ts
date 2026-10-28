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

import type { Leave } from './calc/annual-leave';
import { money as moneyFmt } from './format';
const leaveDays = (n: number) => (Number.isInteger(n) ? days(n) : `${fmt1(n)} يوم`);
const fmt1 = (n: number) => (Math.round(n * 10) / 10).toLocaleString('en-US', { maximumFractionDigits: 1 });
export function leaveView(l: Leave): View {
  const service = `${l.fullYears ? years(l.fullYears) : ''}${l.fullYears && l.months % 12 ? ' و' : ''}${l.months % 12 ? months(l.months % 12) : ''}${l.extraDays ? `${l.months ? ' و' : ''}${days(l.extraDays)}` : ''}` || days(0);
  return {
    label: 'بدل الإجازة غير المستخدمة',
    value: l.amount,
    decimals: 2,
    unit: 'درهم',
    sentence: !l.eligible
      ? 'مدة خدمتك أقل من 6 أشهر، فلا تستحق إجازة سنوية بعد.'
      : l.overdrawn > 0
        ? `أخذت ${leaveDays(l.overdrawn)} أكثر من رصيدك، فلا يبقى لك بدل.`
        : `رصيدك ${leaveDays(l.remaining)} من أصل ${leaveDays(l.entitled)} استحققتها خلال خدمتك.`,
    badge: `رصيد ${fmt1(l.remaining)} يوم`,
    rows: [
      ['مدة الخدمة', service],
      ['الأيام المستحقة', leaveDays(l.entitled)],
      ['الأيام المأخوذة', leaveDays(l.taken)],
      ['الرصيد المتبقي', leaveDays(l.remaining)],
      ['أجر اليوم', `${moneyFmt(l.dailyWage)} درهم`],
    ],
  };
}

import type { Gpa } from './calc/gpa';
const g2 = (n: number) => (Math.round(n * 100) / 100).toFixed(2);
const hrs = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)} ساعة`;
export function gpaView(g: Gpa): View {
  const main = g.hasPrev ? g.cumGpa : g.semGpa;
  return {
    label: g.hasPrev ? 'معدلك التراكمي' : 'معدلك الفصلي',
    value: Math.round(main * 100) / 100,
    decimals: 2,
    unit: `من ${g.max}`,
    sentence: g.hasPrev
      ? `معدل هذا الفصل ${g2(g.semGpa)} من ${hrs(g.semHours)}، والتراكمي ${g2(g.cumGpa)} من مجموع ${hrs(g.totalHours)}.`
      : `من ${hrs(g.semHours)} في ${g.courses.length === 1 ? 'مادة واحدة' : g.courses.length === 2 ? 'مادتين' : `${g.courses.length} مواد`}. أضف معدلك السابق وساعاته لتعرف التراكمي.`,
    badge: g.system === 's5' ? 'النظام السعودي من 5' : g.system === 's4' ? 'النظام السعودي من 4' : 'نظام 4 بالسالب',
    rows: [
      ['المعدل الفصلي', g2(g.semGpa)],
      ['ساعات الفصل', hrs(g.semHours)],
      ['نقاط الفصل', g2(g.semPoints)],
      ...(g.hasPrev ? ([['المعدل التراكمي', g2(g.cumGpa)], ['مجموع الساعات', hrs(g.totalHours)]] as [string, string][]) : []),
    ],
    whatif: gpaWhatIf(g),
  };
}

import type { GpaTarget } from './calc/gpa-target';
export function gpaTargetView(t: GpaTarget): View {
  const f = (n: number) => (Math.round(n * 100) / 100).toFixed(2);
  const rows: [string, string][] = [
    ['أعلى تراكمي بعد الفصل القادم', `${f(t.bestAfterNext)} (لو حصلت على ${t.max} في كل المواد)`],
  ];
  if (t.hoursAtMax !== null) rows.push(['ساعات تحتاجها بالدرجة الكاملة', `${Math.ceil(t.hoursAtMax)} ساعة`]);
  if (t.bestAtGraduation !== null) rows.push(['أعلى معدل ممكن عند التخرج', f(t.bestAtGraduation)]);
  return {
    label: 'المعدل الفصلي المطلوب',
    value: t.status === 'already' ? t.min : Math.round(t.needed * 100) / 100,
    decimals: 2,
    unit: `من ${t.max}`,
    sentence:
      t.status === 'impossible'
        ? `لا يمكن الوصول إليه في فصل واحد، لأنه يحتاج معدلاً فصلياً ${f(t.needed)} وهو أعلى من ${t.max}. تحتاج نحو ${Math.ceil(t.hoursAtMax ?? 0)} ساعة كلها بالدرجة الكاملة.`
        : t.status === 'already'
          ? 'معدلك سيبقى فوق هدفك بعد الفصل القادم مهما كانت درجاتك فيه.'
          : `تحتاج معدلاً فصلياً ${f(t.needed)} من ${t.max} في الفصل القادم لتصل إلى هدفك.`,
    badge: t.status === 'impossible' ? 'غير ممكن في فصل واحد' : t.status === 'already' ? 'الهدف محقق' : 'ممكن',
    rows,
  };
}

function gpaWhatIf(g: Gpa): string[] {
  const out: string[] = [];
  const prevPts = g.prevGpa * g.prevHours;
  const cum = (semPts: number) => (prevPts + semPts) / g.totalHours;
  // lowest course raised to the top grade of the scale
  const low = g.courses.reduce<null | (typeof g.courses)[number]>((m, c) => (!m || c.weight < m.weight ? c : m), null);
  if (low && low.weight < g.max) {
    const pts = g.semPoints - low.points + low.hours * g.max;
    out.push(`لو رفعت المادة ${low.n} (${low.grade}) إلى الدرجة الكاملة: يصير ${g.hasPrev ? 'تراكمك' : 'معدلك'} ${g2(g.hasPrev ? cum(pts) : pts / g.semHours)}.`);
  }
  if (g.hasPrev && g.semGpa < g.max) out.push(`لو حصلت على الدرجة الكاملة في كل مواد هذا الفصل: يصير تراكمك ${g2(cum(g.max * g.semHours))}.`);
  if (g.hasPrev) out.push(`كل فصل من 15 ساعة يحرّك تراكمك بقدر أقل، لأن ساعاتك صارت ${hrs(g.totalHours)}. لتعرف ما تحتاجه لهدف معيّن استخدم حاسبة المعدل المطلوب.`);
  return out;
}

import { calcLoan, type LoanMethod } from './calc/loan';
/** What-ifs for the loan page: one year shorter / longer, and 0.5 point less interest. */
export function loanWhatIf(input: { principal: number | null; annualRatePercent: number | null; months: number | null; method: LoanMethod }): string[] {
  const base = calcLoan(input);
  if (!base.ok || !input.months || !input.principal || input.annualRatePercent === null) return [];
  const b = base.value;
  const out: string[] = [];
  const line = (m: number, label: string) => {
    const r = calcLoan({ ...input, months: m });
    if (!r.ok) return;
    const di = r.value.totalInterest - b.totalInterest;
    out.push(`${label}: القسط ${money(r.value.payment)}، والفوائد ${di < 0 ? 'أقل' : 'أكثر'} بـ ${money(Math.abs(di))}.`);
  };
  if (input.months > 12) line(input.months - 12, 'لو قصّرت المدة سنة');
  if (input.months + 12 <= 600) line(input.months + 12, 'لو مددتها سنة');
  if (input.annualRatePercent >= 0.5) {
    const r = calcLoan({ ...input, annualRatePercent: input.annualRatePercent - 0.5 });
    if (r.ok) out.push(`لو كانت الفائدة أقل بنصف نقطة: توفّر ${money(b.totalInterest - r.value.totalInterest)} على كامل المدة.`);
  }
  return out;
}
