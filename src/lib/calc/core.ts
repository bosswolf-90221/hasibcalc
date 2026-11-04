// Shared primitives for every calculator. Pure, framework-free, testable.

export type FieldError = { field: string; message: string };
export type CalcResult<T> = { ok: true; value: T } | { ok: false; errors: FieldError[] };

export const ok = <T>(value: T): CalcResult<T> => ({ ok: true, value });
export const fail = <T>(errors: FieldError[]): CalcResult<T> => ({ ok: false, errors });

/**
 * Parse user text/number into a finite number, or null when the text cannot be read with certainty.
 * Accepts Arabic-Indic and Persian digits, the Arabic separators ٫ ٬, and both comma conventions:
 *   8,000 and 1,234,567.5 → comma groups thousands.   8000,50 and 3,5 → comma is the decimal mark.
 * Anything that fits neither reading (8000,500 or 1,23,456) returns null instead of guessing a value.
 */
export function toNumber(input: unknown): number | null {
  if (typeof input === 'number') return Number.isFinite(input) ? input : null;
  if (typeof input !== 'string') return null;
  const text = input
    .trim()
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/٫/g, '.')
    .replace(/٬/g, ',')
    .replace(/−/g, '-')
    .replace(/\s/g, '');
  const negative = text.startsWith('-');
  const s = (negative ? text.slice(1) : text).replace(/,$/, ''); // a trailing comma is a number still being typed
  let plain: string | null = null;
  if (/^\d+\.?\d*$|^\.\d+$/.test(s)) plain = s; // 8000  8000.5  .5
  else if (/^\d{1,3}(,\d{3})+(\.\d*)?$/.test(s)) plain = s.replace(/,/g, ''); // 8,000  1,234,567.5
  else if (/^\d+,\d{1,2}$/.test(s)) plain = s.replace(',', '.'); // 8000,50  3,5
  else if (/^\d{1,3}(\.\d{3})+,\d+$/.test(s)) plain = s.replace(/\./g, '').replace(',', '.'); // 1.234,56
  if (plain === null) return null;
  const n = Number(plain);
  if (!Number.isFinite(n)) return null;
  return negative && n !== 0 ? -n : n;
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
      if (!opts.optional || v !== null) this.errors.push({ field, message: `أدخل ${opts.label} رقماً واضحاً، بلا فواصل إضافية` });
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
