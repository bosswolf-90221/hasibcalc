// Browser runtime shared by every calculator: read the sentence, compute, render, animate, copy, share, reset.
import type { CalcResult, FieldError } from '../lib/calc/core';
import type { View } from '../lib/views';
import { fmt, odo, odoText } from '../lib/format';
import { toNumber } from '../lib/calc/core';

export type Fields = Record<string, string>;
export type Computed<R> = { result: CalcResult<R>; view: View | null };

type Options<R> = {
  compute: (f: Fields) => Computed<R>;
  /** page-specific exhibit updates (bars, scales, tables) */
  extras?: (r: R, f: Fields) => void;
  /** params that must not be shared by default — only included by the explicit "with my numbers" button */
  paramPrefix?: string;
};

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function mountCalculator<R>(root: HTMLElement, opts: Options<R>) {
  const result = root.querySelector<HTMLElement>('[data-result]')!;
  const $ = (k: string) => result.querySelector<HTMLElement>(`[data-r="${k}"]`)!;
  const valueEl = $('value');
  const prefix = opts.paramPrefix ?? '';
  let shown = Number(odoText(valueEl).replace(/,/g, '')) || 0;
  let lastInput = 0;
  let raf = 0;
  let liveTimer = 0;
  let toastTimer = 0;

  const fieldEls = () => Array.from(root.querySelectorAll<HTMLElement>('[data-field]'));

  function read(): Fields {
    const f: Fields = {};
    for (const el of fieldEls()) {
      const name = el.dataset.field!;
      if (el instanceof HTMLInputElement) f[name] = el.value;
      else f[name] = el.querySelector<HTMLInputElement>('input:checked')?.value ?? el.dataset.default ?? '';
    }
    return f;
  }

  function write(name: string, value: string) {
    const el = root.querySelector<HTMLElement>(`[data-field="${CSS.escape(name)}"]`);
    if (!el) return;
    if (el instanceof HTMLInputElement) el.value = value;
    else {
      const radio = el.querySelector<HTMLInputElement>(`input[value="${CSS.escape(value)}"]`);
      if (radio) radio.checked = true;
    }
  }

  function showErrors(errors: FieldError[]) {
    const byField = new Map(errors.map((e) => [e.field, e.message]));
    for (const el of fieldEls()) {
      const name = el.dataset.field!;
      const msg = byField.get(name);
      const input = el instanceof HTMLInputElement ? el : null;
      if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
      const errEl = root.querySelector<HTMLElement>(`#f-${CSS.escape(name)}-err`);
      if (errEl) {
        errEl.textContent = msg ?? '';
        errEl.hidden = !msg;
      }
    }
  }

  function animateTo(target: number, decimals: number) {
    cancelAnimationFrame(raf);
    const burst = performance.now() - lastInput < 260;
    const tiny = Math.abs(target - shown) <= Math.abs(shown) * 0.002;
    if (reduceMotion() || burst || tiny) {
      shown = target;
      valueEl.innerHTML = odo(fmt(target, decimals));
      return;
    }
    const from = shown;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 450);
      const e = 1 - Math.pow(1 - p, 3);
      shown = from + (target - from) * e;
      valueEl.innerHTML = odo(fmt(shown, decimals));
      if (p < 1) raf = requestAnimationFrame(step);
      else shown = target;
    };
    raf = requestAnimationFrame(step);
  }

  function render(view: View) {
    result.dataset.state = 'ok';
    $('error').hidden = true;
    $('label').textContent = view.label;
    $('unit').textContent = view.unit;
    $('sentence').textContent = view.sentence;
    const badge = $('badge');
    badge.textContent = view.badge ?? '';
    badge.hidden = !view.badge;
    const rows = $('rows');
    rows.replaceChildren(
      ...view.rows.map(([k, v]) => {
        const d = document.createElement('div');
        const dt = document.createElement('dt');
        const dd = document.createElement('dd');
        dt.textContent = k;
        dd.textContent = v;
        dd.className = 'num';
        d.append(dt, dd);
        return d;
      }),
    );
    if (view.value !== null) animateTo(view.value, view.decimals);
    clearTimeout(liveTimer);
    liveTimer = window.setTimeout(() => {
      $('live').textContent = `${view.label}: ${fmt(view.value, view.decimals)} ${view.unit}`.trim();
    }, 900);
  }

  function update() {
    const f = read();
    const { result: r, view } = opts.compute(f);
    if (!r.ok) {
      showErrors(r.errors);
      result.dataset.state = 'error';
      const err = $('error');
      err.textContent = r.errors[0]?.message ?? 'تحقق من المدخلات';
      err.hidden = false;
      return;
    }
    showErrors([]);
    if (view) render(view);
    opts.extras?.(r.value, f);
  }

  // ---- URL params (only fill; we never write user numbers into the URL by ourselves)
  const params = new URLSearchParams(location.search);
  let filledFromUrl = false;
  for (const el of fieldEls()) {
    const name = el.dataset.field!;
    const v = params.get(prefix + name);
    if (v !== null && v.length < 40) {
      write(name, v);
      filledFromUrl = true;
    }
  }
  if (filledFromUrl) $('from-url').hidden = false;

  // ---- events
  root.addEventListener('input', () => {
    lastInput = performance.now();
    update();
  });
  root.addEventListener('change', update);
  root.addEventListener('focusout', (e) => {
    const el = e.target as HTMLInputElement;
    if (!(el instanceof HTMLInputElement) || el.inputMode !== 'decimal' || !el.value.trim()) return;
    const n = toNumber(el.value);
    if (n === null || Math.abs(n) < 10000) return;
    el.value = n.toLocaleString('en-US', { maximumFractionDigits: 6 });
  });

  const toast = (msg: string) => {
    const t = $('toast');
    t.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => (t.textContent = ''), 2600);
  };
  async function copy(text: string, msg: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast(msg);
    } catch {
      window.prompt('انسخ النص:', text);
    }
  }
  const cleanUrl = () => location.origin + location.pathname;

  result.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-act]');
    if (!btn) return;
    const act = btn.dataset.act;
    if (act === 'copy') {
      const text = `${$('label').textContent}: ${odoText(valueEl)} ${$('unit').textContent}`.replace(/\s+/g, ' ').trim();
      copy(`${text}\n${cleanUrl()}`, 'نسخنا النتيجة');
    } else if (act === 'share-clean') {
      copy(cleanUrl(), 'نسخنا رابط الحاسبة بدون أرقامك');
    } else if (act === 'share-values') {
      const q = new URLSearchParams();
      const f = read();
      for (const k of Object.keys(f)) if (f[k] !== '') q.set(prefix + k, f[k]);
      copy(`${cleanUrl()}?${q.toString()}`, btn.dataset.sensitive ? 'نسخنا الرابط، وفيه أرقامك المالية' : 'نسخنا الرابط مع أرقامك');
    } else if (act === 'reset') {
      for (const el of fieldEls()) write(el.dataset.field!, el.dataset.default ?? '');
      update();
      toast('رجعنا للقيم الافتراضية');
    } else if (act === 'clear-url') {
      history.replaceState(null, '', location.pathname);
      $('from-url').hidden = true;
      toast('حذفنا أرقامك من الرابط');
    }
  });

  update();
  return { update, read, write };
}

/** Helper for pages: get a field as number|null */
export { toNumber as num } from '../lib/calc/core';
