// Shared primitives for every calculator. Pure, framework-free, testable.

export type FieldError = { field: string; message: string };
export type CalcResult<T> = { ok: true; value: T } | { ok: false; errors: FieldError[] };

export const ok = <T>(value: T): CalcResult<T> => ({ ok: true, value });
export const fail = <T>(errors: FieldError[]): CalcResult<T> => ({ ok: false, errors });

/** Parse user text/number into a finite number, or null. Accepts Arabic-Indic digits and commas. */
export function toNumber(input: unknown): number | null {
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;
  if (typeof input !== 'string') return null;
  const s = input
    .trim()
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[٫]/g, '.')
    .replace(/[,٬\s]/g, '');
  if (s === '' || s === '-' || s === '.') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Round only for display/reporting. Internal maths keeps full precision. */
export function round(n: number, decimals = 2): number {
  const f = 10 ** decimals;
  return Math.round((n + Number.EPSILON) * f) / f;
}

/** Collects validation errors. */
export class Validator {
  errors: FieldError[] = [];
  number(field: string, v: number | null, opts: { min?: number; max?: number; integer?: boolean; label: string; optional?: boolean }): number {
    if (v === null || !Number.isFinite(v)) {
      if (!opts.optional || v !== null) this.errors.push({ field, message: `أدخل ${opts.label}` });
      return NaN;
    }
    if (opts.integer && !Number.isInteger(v)) this.errors.push({ field, message: `${opts.label} يجب أن يكون رقماً صحيحاً` });
    if (opts.min !== undefined && v < opts.min) this.errors.push({ field, message: `${opts.label} لا يمكن أن يكون أقل من ${opts.min}` });
    if (opts.max !== undefined && v > opts.max) this.errors.push({ field, message: `${opts.label} لا يمكن أن يتجاوز ${opts.max}` });
    return v;
  }
  date(field: string, v: string | undefined | null, label: string): Date | null {
    const d = parseISODate(v);
    if (!d) this.errors.push({ field, message: `أدخل ${label} بصيغة صحيحة` });
    return d;
  }
  add(field: string, message: string) {
    this.errors.push({ field, message });
  }
  get valid() {
    return this.errors.length === 0;
  }
}

const DAY = 86_400_000;

/** Parse YYYY-MM-DD as a UTC calendar date (no timezone drift). */
export function parseISODate(v: string | undefined | null): Date | null {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const [y, m, d] = v.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return dt;
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Whole calendar days from a to b (b − a). */
export function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY);
}

export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

/** Date in (year, month) on `day`, clamped to the month's last day (29 Feb → 28 Feb). */
export function clampedDate(year: number, monthIndex: number, day: number): Date {
  // normalise month overflow
  const y = year + Math.floor(monthIndex / 12);
  const m = ((monthIndex % 12) + 12) % 12;
  return new Date(Date.UTC(y, m, Math.min(day, daysInMonth(y, m))));
}

/** Today's date in the visitor's local timezone, as YYYY-MM-DD. */
export function localTodayISO(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
