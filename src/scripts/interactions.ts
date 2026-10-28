// Site-wide small interactions (every page). Plain DOM, no framework; everything works without it.
// - number fields: select on focus, ArrowUp/ArrowDown step by 1 (Shift: 10)
// - back-to-top button after scrolling on long pages
// - copy a table cell's number by clicking it (ready tables in articles)
import { toNumber } from '../lib/calc/core';

const fmtBack = (n: number) => (Math.abs(n) >= 10000 ? n.toLocaleString('en-US', { maximumFractionDigits: 6 }) : String(Math.round(n * 1e6) / 1e6));

document.addEventListener('focusin', (e) => {
  const el = e.target;
  if (el instanceof HTMLInputElement && el.classList.contains('in') && el.inputMode === 'decimal') {
    // let the click place the caret first, then select so typing replaces the number
    requestAnimationFrame(() => el.select());
  }
});

document.addEventListener('keydown', (e) => {
  const el = e.target;
  if (!(el instanceof HTMLInputElement) || el.inputMode !== 'decimal' || !el.classList.contains('in')) return;
  if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
  const n = toNumber(el.value || '0');
  if (n === null) return;
  e.preventDefault();
  const step = (e.shiftKey ? 10 : 1) * (e.key === 'ArrowUp' ? 1 : -1);
  const next = n + step;
  el.value = fmtBack(next < 0 && n >= 0 ? 0 : next);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.classList.remove('nudge');
  void el.offsetWidth;
  el.classList.add('nudge');
});

// back to top
const top = document.querySelector<HTMLButtonElement>('[data-to-top]');
if (top) {
  let ticking = false;
  const check = () => {
    ticking = false;
    top.classList.toggle('show', window.scrollY > window.innerHeight * 1.5);
  };
  window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(check); } }, { passive: true });
  top.addEventListener('click', () => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
}

// click a number in an article table to copy it
let tip: HTMLElement | null = null;
let tipTimer = 0;
document.addEventListener('click', async (e) => {
  const td = (e.target as HTMLElement).closest?.('.article td.num, .article .data-table td');
  if (!(td instanceof HTMLTableCellElement)) return;
  const text = td.textContent?.trim() ?? '';
  if (!/\d/.test(text) || /[؀-ۿ]/.test(text) || window.getSelection()?.toString()) return;
  try { await navigator.clipboard.writeText(text.replace(/\*$/, '')); } catch { return; }
  tip ??= Object.assign(document.createElement('span'), { className: 'copy-tip', role: 'status' });
  tip.textContent = 'نُسخ ' + text.replace(/\*$/, '');
  const r = td.getBoundingClientRect();
  tip.style.top = `${r.top + window.scrollY - 36}px`;
  tip.style.left = `${r.left + window.scrollX + r.width / 2}px`;
  document.body.append(tip);
  td.classList.remove('copied');
  void td.offsetWidth;
  td.classList.add('copied');
  clearTimeout(tipTimer);
  tipTimer = window.setTimeout(() => tip?.remove(), 1400);
});
