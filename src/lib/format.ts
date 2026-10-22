// One formatting policy for the whole site: Western digits, en-US grouping.
const cache = new Map<number, Intl.NumberFormat>();
function nf(decimals: number) {
  let f = cache.get(decimals);
  if (!f) cache.set(decimals, (f = new Intl.NumberFormat('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })));
  return f;
}

/** Never lets NaN/Infinity reach the screen. */
export function fmt(n: number | null | undefined, decimals = 2): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  const out = nf(decimals).format(n);
  return out === '-0' || /^-0\.0+$/.test(out) ? out.slice(1) : out;
}

export const money = (n: number | null | undefined) => fmt(n, 2);
export const int = (n: number | null | undefined) => fmt(n, 0);
export const pct = (n: number | null | undefined, d = 2) => `${fmt(n, d)}%`;

/** "17 أكتوبر 2026" with Western digits. */
export function arDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  return `${d} ${months[m - 1]} ${y}`;
}

/** Arabic plural for counted nouns (simplified, Western digits). */
export function plural(n: number, forms: { one: string; two: string; few: string; many: string }): string {
  const a = Math.abs(n);
  if (a === 1) return forms.one;
  if (a === 2) return forms.two;
  if (a >= 3 && a <= 10 && Number.isInteger(a)) return `${int(n)} ${forms.few}`;
  return `${fmt(n, Number.isInteger(n) ? 0 : 1)} ${forms.many}`;
}
export const years = (n: number) => plural(n, { one: 'سنة واحدة', two: 'سنتان', few: 'سنوات', many: 'سنة' });
export const days = (n: number) => plural(n, { one: 'يوم واحد', two: 'يومان', few: 'أيام', many: 'يوماً' });
export const months = (n: number) => plural(n, { one: 'شهر واحد', two: 'شهران', few: 'أشهر', many: 'شهراً' });

/** Counter-style digits: each digit in its own cell, separators narrow. Input is our own formatted number. */
export function odo(text: string): string {
  const cells = Array.from(text)
    .map((ch) => (/\d/.test(ch) ? `<i>${ch}</i>` : ch === '—' ? `<i>—</i>` : `<i class="c">${ch === '-' ? '−' : ch}</i>`))
    .join('');
  // screen readers get the whole number once; the cells are decoration
  return `<span class="sr-only">${text}</span><span class="cells" aria-hidden="true">${cells}</span>`;
}
/** The plain number inside an odo() element. */
export const odoText = (el: Element) => el.querySelector('.sr-only')?.textContent ?? el.textContent ?? '';
