// Turns a life moment's fields into what its page shows. Every number comes from the site's existing
// calculators in lib/calc; nothing here computes a rule of its own. Pure, so it runs at build, in the browser and in tests.
import { calcAge } from './calc/age';
import { ACTIVITY, calcCalories, type Activity, type Sex } from './calc/calories';
import { calcBmi, BMI_BANDS, bmiCategory } from './calc/bmi';
import { daysBetween, parseISODate, toISODate, toNumber } from './calc/core';
import { calcDateSpan } from './calc/dates';
import { calcDiscount } from './calc/discount';
import { calcDues } from './calc/exit-dues';
import { calcGosi, type GosiSystem, type Nationality } from './calc/gosi';
import { calcGpaTarget, type TargetSystem } from './calc/gpa-target';
import { fromHijri, HIJRI_MONTHS, toHijri } from './calc/hijri';
import { hijriAgeFromGregorian } from './calc/hijri-age';
import { calcLoan } from './calc/loan';
import { calcOvulation } from './calc/ovulation';
import { calcPayday } from './calc/payday';
import { whatPercent } from './calc/percentage';
import { calcPregnancy } from './calc/pregnancy';
import { calcVat } from './calc/vat';
import { calcZakat, type NisabBasis } from './calc/zakat';
import { arDate, days, fmt, int, money, months, years } from './format';

export type Fields = Record<string, string>;
export type Step = { title: string; value?: string; text?: string; href?: string; link?: string };
export type MomentView =
  | { state: 'empty'; prompt: string }
  | { state: 'error'; message: string; field?: string }
  | {
      state: 'ok';
      label: string;
      value: string;
      /** A date or sentence, set smaller than a number. */
      wide?: boolean;
      unit?: string;
      split?: [number, number];
      steps: Step[];
      notes?: string[];
    };

const empty = (prompt: string): MomentView => ({ state: 'empty', prompt });
const error = (r: { errors: { message: string; field: string }[] }): MomentView => ({ state: 'error', message: r.errors[0]?.message ?? 'تحقق من المدخلات', field: r.errors[0]?.field });
const blank = (f: Fields, k: string) => !f[k] || f[k].trim() === '';
/** A blank optional field counts as 0; text that cannot be read stays invalid. */
const optional = (f: Fields, k: string) => (blank(f, k) ? 0 : toNumber(f[k]));
const hijriText = (h: { day: number; month: number; year: number }) => `${h.day} ${HIJRI_MONTHS[h.month - 1]} ${h.year} هـ`;
const dayCount = (n: number) => (n === 0 ? 'اليوم' : `بعد ${days(n)}`);

function leavingJob(f: Fields): MomentView {
  if (blank(f, 'salary')) return empty('اكتب راتبك الأساسي لنحسب مستحقاتك.');
  const r = calcDues({ basicSalary: toNumber(f.salary), startDate: f.start, endDate: f.end, unpaidAbsenceDays: optional(f, 'absence'), takenDays: optional(f, 'taken') });
  if (!r.ok) return error(r);
  const { gratuity: g, leave: l, total } = r.value;
  return {
    state: 'ok',
    label: 'مجموع مستحقاتك تقريباً',
    value: money(total),
    unit: `درهم، عن ${g.serviceYears.toFixed(1)} سنة خدمة`,
    split: total > 0 ? [g.total / total, l.amount / total] : undefined,
    steps: [
      { title: 'مكافأة نهاية الخدمة', value: money(g.total), text: g.eligible ? '21 يوماً عن كل سنة من أول 5 سنوات، و30 يوماً بعدها، على الراتب الأساسي.' : 'لم تكتمل سنة خدمة، وهي شرط استحقاق المكافأة.', href: '/end-of-service/', link: 'التفاصيل والمعادلة' },
      { title: 'بدل الإجازة غير المستخدمة', value: money(l.amount), text: l.eligible ? `استحققت ${fmt(l.entitled, 1)} يوماً، وبقي لك ${fmt(l.remaining, 1)} يوماً بالأجر الأساسي.` : 'لم تتجاوز خدمتك ستة أشهر، وهو شرط استحقاق الإجازة.', href: '/annual-leave/', link: 'التفاصيل والمعادلة' },
    ],
  };
}

function monthlyPay(f: Fields): MomentView {
  if (blank(f, 'payDay')) return empty('اكتب يوم راتبك في الشهر.');
  const saudi = f.country !== 'uae';
  const p = calcPayday({ payDay: toNumber(f.payDay), weekend: saudi ? 'fri-sat' : 'sat-sun', rule: saudi ? 'nearest' : 'none', onDate: f.today });
  if (!p.ok) return error(p);
  const n = p.value.next;
  const steps: Step[] = [
    { title: 'موعد راتبك القادم', value: arDate(n.actual), text: `${n.weekday}.${n.shifted ? ` نُقل من ${arDate(n.nominal)} لأنه يوافق عطلة نهاية الأسبوع.` : ''}`, href: saudi ? '/salary-saudi/' : '/salary-uae/', link: 'مواعيد الأشهر القادمة' },
  ];
  const notes: string[] = [];
  if (saudi) {
    if (!blank(f, 'basic')) {
      const g = calcGosi({ nationality: f.nationality as Nationality, system: f.system as GosiSystem, basic: toNumber(f.basic), housing: optional(f, 'housing'), other: optional(f, 'other'), onDate: f.today });
      if (!g.ok) return error(g);
      steps.push({ title: 'يُخصم من راتبك للتأمينات', value: `${money(g.value.employee)} ريال`, text: `بنسبة ${fmt(g.value.employeeRate, 2)}% من أجر الاشتراك ${money(g.value.wage)} ريال.`, href: '/gosi/', link: 'كيف يُحسب الخصم' });
      steps.push({ title: 'راتبك الصافي بعد التأمينات', value: `${money(g.value.netAfterDeduction)} ريال`, text: 'قبل أي استقطاعات أخرى في عقدك.' });
    }
  } else {
    notes.push('خصم التأمينات هنا خاص بالسعودية. أما مواطنو الإمارات فلهم أنظمة معاشات خاصة لا تغطيها هذه الصفحة.');
  }
  return { state: 'ok', label: 'كم بقي على راتبك؟', value: p.value.isToday ? 'اليوم' : days(p.value.daysLeft), wide: true, steps, notes };
}

function takingLoan(f: Fields): MomentView {
  if (blank(f, 'principal') || blank(f, 'rate') || blank(f, 'months')) return empty('اكتب مبلغ القرض والنسبة والمدة.');
  const input = { principal: toNumber(f.principal), annualRatePercent: toNumber(f.rate), months: toNumber(f.months) };
  const flat = f.method === 'flat';
  const a = calcLoan({ ...input, method: flat ? 'flat' : 'reducing' });
  const b = calcLoan({ ...input, method: flat ? 'reducing' : 'flat' });
  if (!a.ok) return error(a);
  if (!b.ok) return error(b);
  const steps: Step[] = [
    { title: 'مجموع الفوائد', value: money(a.value.totalInterest), text: `تدفع في النهاية ${money(a.value.totalPaid)}.`, href: '/loan/', link: 'جدول السداد كاملاً' },
    { title: flat ? 'لو كانت النسبة نفسها متناقصة' : 'لو كانت النسبة نفسها ثابتة', value: money(b.value.payment), text: `الفرق في مجموع الفوائد ${money(Math.abs(a.value.totalInterest - b.value.totalInterest))}.`, href: '/guides/flat-vs-reducing-interest/', link: 'لماذا يختلفان؟' },
  ];
  if (!blank(f, 'salary')) {
    const s = whatPercent(a.value.payment, toNumber(f.salary));
    if (!s.ok) return error(s);
    steps.push({ title: 'القسط من راتبك', value: `${fmt(s.value.value, 1)}%`, text: 'نسبة القسط إلى الراتب الذي كتبته.', href: '/percentage/', link: 'حاسبة النسبة' });
  }
  return { state: 'ok', label: 'قسطك الشهري', value: money(a.value.payment), unit: `لمدة ${months(toNumber(f.months) ?? 0)}`, steps };
}

function ramadanZakat(f: Fields): MomentView {
  const silverText = blank(f, 'silver') ? null : toNumber(f.silver) ?? Number.NaN;
  const goldText = blank(f, 'gold') ? null : toNumber(f.gold) ?? Number.NaN;
  const r = calcZakat({ cash: optional(f, 'cash'), investments: optional(f, 'investments'), debts: optional(f, 'debts'), goldPricePerGram: goldText, silverPricePerGram: silverText, basis: f.basis as NisabBasis });
  if (!r.ok) return error(r);
  const z = r.value;
  const today = parseISODate(f.today)!;
  const h = toHijri(today);
  const year = h.month > 9 ? h.year + 1 : h.year;
  let ramadan = fromHijri({ year, month: 9, day: 1 })!;
  if (ramadan < today && h.month === 9) ramadan = fromHijri({ year: year + 1, month: 9, day: 1 })!;
  const steps: Step[] = [
    { title: 'صافي مالك', value: money(z.net), text: 'النقد والاستثمارات، بعد طرح الديون الحالّة.', href: '/zakat/', link: 'تفاصيل الحساب' },
    z.nisab === null
      ? { title: 'النصاب', text: z.basis === 'gold' ? 'اكتب سعر غرام الذهب لنعرف هل بلغ مالك النصاب.' : 'اكتب سعر غرام الذهب والفضة لنعرف هل بلغ مالك النصاب.' }
      : { title: 'النصاب الذي اخترته', value: money(z.nisab), text: z.reachesNisab ? 'بلغ مالك هذا النصاب.' : 'مالك دون هذا النصاب.' },
    { title: 'أول رمضان القادم', value: arDate(toISODate(ramadan)), text: `${dayCount(daysBetween(today, ramadan))}، بتقويم أم القرى. واليوم ${hijriText(h)}. وقد يختلف الإعلان الرسمي يوماً.`, href: '/hijri/', link: 'تحويل أي تاريخ' },
  ];
  return { state: 'ok', label: z.reachesNisab === null ? 'زكاتك إن بلغ مالك النصاب' : z.reachesNisab ? 'زكاتك المبدئية' : 'مالك دون النصاب الذي اخترته', value: money(z.zakat), steps };
}

function expectingBaby(f: Fields): MomentView {
  if (blank(f, 'lmp')) return empty('اختاري أول يوم من آخر دورة، لنحسب مواعيدك.');
  const cycle = toNumber(f.cycle);
  if (f.stage === 'pregnant') {
    const r = calcPregnancy({ lmpDate: f.lmp, cycleDays: cycle, onDate: f.today });
    if (!r.ok) return error(r);
    const p = r.value;
    return {
      state: 'ok', label: 'موعد الولادة المتوقع', value: arDate(p.dueDate), wide: true,
      steps: [
        { title: 'عمر الحمل', value: `${int(p.weeks)} أسبوعاً و${days(p.days)}`, text: `في الثلث ${['الأول', 'الثاني', 'الثالث'][p.trimester - 1]}.`, href: '/pregnancy/', link: 'التفاصيل' },
        { title: 'الباقي على الموعد', value: p.daysToDue >= 0 ? days(p.daysToDue) : 'تجاوزت الموعد', text: 'نحو ولادة واحدة من كل 20 تحدث في الموعد المتوقع بالضبط.', href: '/guides/pregnancy-weeks-months/', link: 'أسابيع الحمل بالأشهر' },
      ],
    };
  }
  const r = calcOvulation({ lmpDate: f.lmp, cycleDays: cycle, periodDays: toNumber(f.period), onDate: f.today });
  if (!r.ok) return error(r);
  const o = r.value;
  const notes = o.focus.fertileStart <= o.focus.periodEnd ? ['بهذه الأرقام تتداخل أيام الدورة مع أيام الخصوبة، فالحساب هنا أقل وضوحاً. اسألي الطبيبة إن تكرر ذلك.'] : [];
  return {
    state: 'ok', label: 'موعد التبويض المتوقع', value: arDate(o.focus.ovulation), wide: true,
    steps: [
      { title: 'أيام الخصوبة', value: `${arDate(o.focus.fertileStart)} إلى ${arDate(o.focus.fertileEnd)}`, text: 'الحساب تقديري، ولا يصلح وسيلة لمنع الحمل.', href: '/ovulation/', link: 'الأشهر الثلاثة القادمة' },
      { title: 'الدورة القادمة', value: arDate(o.current.nextStart), text: dayCount(o.daysToNextPeriod) + '.' },
    ],
    notes,
  };
}

function healthWeight(f: Fields): MomentView {
  if (blank(f, 'weight') || blank(f, 'height')) return empty('اكتب وزنك وطولك.');
  const b = calcBmi({ weightKg: toNumber(f.weight), heightCm: toNumber(f.height) });
  if (!b.ok) return error(b);
  const band = BMI_BANDS.find((x) => x.key === bmiCategory(b.value.bmi))!;
  const steps: Step[] = [
    { title: 'التصنيف للبالغين', value: band.label, text: `النطاق الطبيعي لطولك من ${fmt(b.value.normalMinKg, 1)} إلى ${fmt(b.value.normalMaxKg, 1)} كجم.`, href: '/bmi/', link: 'التفاصيل' },
  ];
  if (!blank(f, 'age')) {
    const c = calcCalories({ sex: f.sex as Sex, age: toNumber(f.age), weightKg: toNumber(f.weight), heightCm: toNumber(f.height), activity: f.activity as Activity });
    if (!c.ok) return error(c);
    steps.push({ title: 'سعراتك اليومية للمحافظة على وزنك', value: `${int(Math.round(c.value.maintenance))} سعرة`, text: `والأيض الأساسي ${int(Math.round(c.value.bmr))} سعرة. الأرقام تقديرية.`, href: '/calories/', link: 'كل مستويات النشاط' });
  }
  return { state: 'ok', label: 'مؤشر كتلة جسمك', value: fmt(b.value.bmi, 1), steps };
}

function shopping(f: Fields): MomentView {
  if (blank(f, 'price')) return empty('اكتب السعر الأصلي.');
  const d = calcDiscount({ price: toNumber(f.price), first: optional(f, 'first'), second: optional(f, 'second') });
  if (!d.ok) return error(d);
  const rate = Number(f.rate);
  const v = calcVat({ mode: 'add', ratePercent: rate, amount: d.value.final });
  if (!v.ok) return error(v);
  return {
    state: 'ok',
    label: rate > 0 ? 'ما ستدفعه شاملاً الضريبة' : 'ما ستدفعه',
    value: money(v.value.total),
    steps: [
      { title: 'السعر بعد الخصم', value: money(d.value.final), text: `توفّر ${money(d.value.saved)}، والخصم الحقيقي ${fmt(d.value.effectivePercent, 1)}%.`, href: '/discount/', link: 'التفاصيل' },
      { title: 'الضريبة', value: money(v.value.tax), text: rate > 0 ? `بنسبة ${rate}% على السعر بعد الخصم، إذا كان السعر المعروض غير شامل لها.` : 'لم تختر ضريبة.', href: '/vat/', link: 'إضافة الضريبة واستخراجها' },
    ],
  };
}

function university(f: Fields): MomentView {
  if (['current', 'done', 'target', 'next'].some((k) => blank(f, k))) return empty('اكتب معدلك وساعاتك والمعدل الذي تريده.');
  const r = calcGpaTarget({ system: f.system as TargetSystem, current: toNumber(f.current), doneHours: toNumber(f.done), target: toNumber(f.target), nextHours: toNumber(f.next), leftHours: blank(f, 'left') ? null : toNumber(f.left) });
  if (!r.ok) return error(r);
  const t = r.value;
  const steps: Step[] = [
    { title: 'أعلى ما تصل إليه بعد هذا الفصل', value: fmt(t.bestAfterNext, 2), text: `إذا حصلت على ${fmt(t.max, 2)} في كل مواد الفصل.`, href: '/gpa-target/', link: 'حسب عدد الساعات' },
  ];
  if (t.bestAtGraduation !== null) steps.push({ title: 'أعلى ما تصل إليه عند التخرج', value: fmt(t.bestAtGraduation, 2), text: 'بحسب الساعات المتبقية التي كتبتها.' });
  steps.push({ title: 'تريد حساب معدلك من موادك؟', text: 'أدخل تقديرات المواد وساعاتها.', href: '/gpa/', link: 'حاسبة المعدل الجامعي' });
  if (t.status === 'already') return { state: 'ok', label: 'بلغت هدفك', value: 'معدلك يبلغ الهدف', wide: true, steps };
  if (t.status === 'impossible') return { state: 'ok', label: 'لا يتحقق هذا الهدف في فصل واحد', value: `يلزمك ${fmt(t.needed, 2)}`, wide: true, unit: `والحد الأعلى ${fmt(t.max, 2)}`, steps };
  return { state: 'ok', label: 'المعدل الفصلي الذي تحتاجه', value: fmt(t.needed, 2), unit: `من ${fmt(t.max, 2)}`, steps };
}

function datesAges(f: Fields): MomentView {
  const hasBirth = !blank(f, 'birth');
  const today = parseISODate(f.today)!;
  const steps: Step[] = [{ title: 'تاريخ اليوم بالهجري', value: hijriText(toHijri(today)), text: 'بتقويم أم القرى، وقد يختلف الإعلان الرسمي يوماً.', href: '/hijri/', link: 'تحويل أي تاريخ' }];
  if (!blank(f, 'from') && !blank(f, 'to')) {
    const s = calcDateSpan({ startDate: f.from, endDate: f.to, includeEnd: false, weekend: 'fri-sat' });
    if (!s.ok) return error(s);
    steps.push({ title: 'بين التاريخين', value: days(s.value.days), text: `${months(s.value.months)} و${days(s.value.monthRemainderDays)}.`, href: '/days-between/', link: 'الأسابيع وأيام العمل' });
  } else {
    steps.push({ title: 'كم يوماً بين تاريخين؟', text: 'اكتب التاريخين في الخانتين الأخيرتين.', href: '/days-between/', link: 'الحاسبة كاملة' });
  }
  if (!hasBirth) return { state: 'ok', label: 'اليوم', value: arDate(f.today), wide: true, steps, notes: ['اكتب تاريخ ميلادك لنحسب عمرك بالميلادي والهجري.'] };
  const a = calcAge({ birthDate: f.birth, onDate: f.today });
  if (!a.ok) return error(a);
  const h = hijriAgeFromGregorian({ birthDate: f.birth, onDate: f.today });
  if (!h.ok) return error(h);
  steps.unshift(
    { title: 'عمرك بالهجري', value: `${years(h.value.years)} و${months(h.value.months)}`, text: `ولدت في ${hijriText(h.value.birthHijri)}.`, href: '/hijri-age/', link: 'التفاصيل' },
    { title: 'عيد ميلادك القادم', value: arDate(a.value.nextBirthday), text: dayCount(a.value.daysToNextBirthday) + `. وقد عشت ${int(a.value.totalDays)} يوماً.`, href: '/age/', link: 'التفاصيل' },
  );
  return { state: 'ok', label: 'عمرك بالضبط', value: `${years(a.value.years)} و${months(a.value.months)} و${days(a.value.days)}`, wide: true, steps };
}

const COMPUTE: Record<string, (f: Fields) => MomentView> = {
  'leaving-job': leavingJob,
  'monthly-pay': monthlyPay,
  'taking-loan': takingLoan,
  'ramadan-zakat': ramadanZakat,
  'expecting-baby': expectingBaby,
  'health-weight': healthWeight,
  shopping,
  university,
  'dates-ages': datesAges,
};

/** `today` comes from the visitor's clock in the browser and from the build date on the server. */
export function computeMoment(slug: string, fields: Fields, today: string): MomentView {
  const run = COMPUTE[slug];
  if (!run) throw new Error(`Unknown moment: ${slug}`);
  return run({ ...fields, today });
}

export const ACTIVITY_OPTIONS = ACTIVITY.map((a) => ({ value: a.key, label: a.label }));
