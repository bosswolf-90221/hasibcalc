// View models shared by the server render and the browser, so both always agree.
import type { CalcResult } from './calc/core';
import type { Gratuity } from './calc/gratuity';
import type { Vat } from './calc/vat';
import type { Loan, LoanMethod } from './calc/loan';
import type { Discount } from './calc/discount';
import type { Age } from './calc/age';
import { BMI_BANDS, type Bmi } from './calc/bmi';
import type { Zakat } from './calc/zakat';
import { NISAB_GOLD_GRAMS } from './calc/zakat';
import { arDate, days, fmt, int, money, months, pct, years } from './format';

export type Row = [label: string, value: string];
export type View = {
  label: string;
  value: number | null;
  decimals: number;
  unit: string;
  sentence: string;
  badge?: string;
  rows: Row[];
  notes?: string[];
  error?: string;
  /** «ماذا لو؟» lines under the result: the next question people usually ask, already computed */
  whatif?: string[];
};

export function errorView<T>(r: CalcResult<T>, label: string): View | null {
  if (r.ok) return null;
  return { label, value: null, decimals: 0, unit: '', sentence: '', rows: [], error: r.errors[0]?.message ?? 'تحقق من المدخلات' };
}

export function gratuityView(g: Gratuity): View {
  if (!g.eligible)
    return {
      label: 'مكافأة نهاية خدمتك',
      value: 0,
      decimals: 0,
      unit: 'درهم',
      sentence: `مدة خدمتك ${days(g.serviceDays)}، وتُستحق المكافأة بعد إكمال سنة كاملة.`,
      badge: 'لم تكمل سنة بعد',
      rows: [['مدة الخدمة المحتسبة', days(g.serviceDays)]],
    };
  return {
    label: 'مكافأة نهاية خدمتك تقريباً',
    value: g.total,
    decimals: 2,
    unit: 'درهم',
    sentence: `عن ${years(Math.round(g.serviceYears * 100) / 100)} من الخدمة المحتسبة (${days(g.serviceDays)}).`,
    badge: g.capped ? 'وصلت إلى الحد الأعلى: أجر سنتين' : undefined,
    rows: [
      ['الأجر اليومي (الأساسي ÷ 30)', money(g.dailyWage)],
      [`أول 5 سنوات: ${fmt(g.tier1Years, 2)} × 21 يوماً`, money(g.tier1Amount)],
      [`ما بعد 5 سنوات: ${fmt(g.tier2Years, 2)} × 30 يوماً`, money(g.tier2Amount)],
      ['قبل تطبيق الحد الأعلى', money(g.uncapped)],
      ['الحد الأعلى (24 × الأساسي)', money(g.cap)],
    ],
    whatif: gratuityWhatIf(g),
  };
}

export function vatView(r: Vat, mode: 'add' | 'extract'): View {
  return mode === 'add'
    ? {
        label: 'المبلغ شامل الضريبة',
        value: r.total,
        decimals: 2,
        unit: '',
        sentence: `منها ${money(r.tax)} ضريبة بنسبة ${fmt(r.rate, r.rate % 1 ? 2 : 0)}%.`,
        rows: [['المبلغ قبل الضريبة', money(r.base)], ['قيمة الضريبة', money(r.tax)], ['الإجمالي', money(r.total)]],
      }
    : {
        label: 'المبلغ قبل الضريبة',
        value: r.base,
        decimals: 2,
        unit: '',
        sentence: `والضريبة المضمّنة في ${money(r.total)} هي ${money(r.tax)}.`,
        rows: [['المبلغ الشامل', money(r.total)], ['قيمة الضريبة', money(r.tax)], ['المبلغ قبل الضريبة', money(r.base)]],
      };
}

export function loanView(r: Loan, method: LoanMethod): View {
  return {
    label: 'قسطك الشهري',
    value: r.payment,
    decimals: 2,
    unit: '',
    sentence: `على ${months(r.months)}، تدفع خلالها ${money(r.totalInterest)} فوائد.`,
    badge: method === 'flat' ? 'فائدة ثابتة (نموذج مبسّط)' : 'فائدة متناقصة',
    rows: [
      ['أصل القرض', money(r.totalPaid - r.totalInterest)],
      ['إجمالي الفوائد', money(r.totalInterest)],
      ['إجمالي ما ستدفعه', money(r.totalPaid)],
      ['عدد الأقساط', int(r.months)],
    ],
  };
}

export function discountView(r: Discount): View {
  return {
    label: 'ستدفع',
    value: r.final,
    decimals: 2,
    unit: '',
    sentence: `بدلاً من ${money(r.price)}، أي أنك توفّر ${money(r.saved)}.`,
    badge: `الخصم الفعلي ${pct(r.effectivePercent, 1)}`,
    rows: [
      ['السعر الأصلي', money(r.price)],
      ['بعد الخصم الأول', money(r.afterFirst)],
      ['بعد الخصم الإضافي', money(r.final)],
      ['المبلغ الموفَّر', money(r.saved)],
    ],
  };
}

export function ageView(a: Age, onDate: string): View {
  return {
    label: 'عمرك',
    value: a.years,
    decimals: 0,
    unit: 'سنة',
    sentence: `و${months(a.months)} و${days(a.days)}، محسوباً بتاريخ ${arDate(onDate)}.`,
    badge: a.isBirthday ? 'عيد ميلاد سعيد، اليوم يومك' : `باقي ${days(a.daysToNextBirthday)} على عيد ميلادك`,
    rows: [
      ['الأيام التي عشتها', int(a.totalDays)],
      ['الأسابيع', int(a.totalWeeks)],
      ['عيد ميلادك القادم', arDate(a.nextBirthday)],
    ],
  };
}

export function bmiView(b: Bmi): View {
  const band = BMI_BANDS.find((x) => x.key === b.category)!;
  return {
    label: 'مؤشر كتلة جسمك',
    value: b.bmi,
    decimals: 1,
    unit: '',
    sentence: `الوزن الموافق للنطاق الطبيعي لطولك بين ${fmt(b.normalMinKg, 1)} و${fmt(b.normalMaxKg, 1)} كجم تقريباً.`,
    badge: band.label,
    rows: BMI_BANDS.map((x) => [x.to === Infinity ? `${x.from} فأكثر` : x.from === 0 ? `أقل من ${x.to}` : `${x.from} إلى أقل من ${x.to}`, x.label] as Row),
  };
}

export function zakatView(z: Zakat): View {
  if (z.reachesNisab === null)
    return {
      label: 'زكاتك المبدئية إن بلغ مالك النصاب',
      value: z.zakat,
      decimals: 2,
      unit: '',
      sentence: 'أدخل سعر غرام الذهب اليوم لنعرف هل بلغ مالك النصاب.',
      badge: 'النصاب غير محدد بعد',
      rows: [['صافي المال الزكوي', money(z.net)]],
    };
  return {
    label: z.reachesNisab ? 'زكاتك المبدئية' : 'لا زكاة عليك حالياً',
    value: z.zakat,
    decimals: 2,
    unit: '',
    sentence: z.reachesNisab ? `ربع العشر (2.5%) من صافي مالك ${money(z.net)}، إذا حال عليه الحول.` : `صافي مالك ${money(z.net)} أقل من النصاب ${money(z.nisab)}.`,
    badge: z.reachesNisab ? 'بلغ النصاب' : 'دون النصاب',
    rows: [
      ['صافي المال الزكوي', money(z.net)],
      [`النصاب (${NISAB_GOLD_GRAMS} غراماً من الذهب)`, money(z.nisab)],
      ['النسبة', '2.5%'],
    ],
  };
}

/** What-ifs for end of service, from the same rule (21 days/yr up to 5, then 30; cap 24 × basic). */
export function gratuityWhatIf(g: Gratuity): string[] {
  const out: string[] = [];
  const basic = g.dailyWage * 30;
  const at = (y: number, daily: number) => Math.min(24 * daily * 30, daily * (Math.min(y, 5) * 21 + Math.max(0, y - 5) * 30));
  if (g.capped) out.push('وصلت مكافأتك إلى الحد الأعلى (أجر سنتين)، فالبقاء مدة أطول لا يزيدها.');
  else {
    const plus = at(g.serviceYears + 1, g.dailyWage) - g.total;
    out.push(`لو بقيت سنة أخرى: تزيد مكافأتك نحو ${int(plus)} درهم.`);
    if (g.serviceYears < 5) {
      const left = 5 - g.serviceYears;
      out.push(`بعد ${left < 1 ? 'أقل من سنة' : years(Math.round(left * 10) / 10)} تكمل 5 سنوات، فتُحسب كل سنة بعدها بأجر 30 يوماً بدل 21.`);
    }
  }
  const raised = at(g.serviceYears, (basic + 1000) / 30);
  if (basic > 0) out.push(`لو كان راتبك الأساسي أعلى بـ 1,000 درهم: تصير المكافأة نحو ${int(raised)} درهم.`);
  return out;
}
