// View models for the date, pregnancy and calorie calculators.
import type { View } from './views';
import { HIJRI_MONTHS, type Conversion } from './calc/hijri';
import type { DateSpan } from './calc/dates';
import type { Pregnancy } from './calc/pregnancy';
import type { Calories } from './calc/calories';
import { arDate, days, int, months } from './format';

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
