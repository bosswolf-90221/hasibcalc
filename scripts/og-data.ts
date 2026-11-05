// Dumps the data the preview-image renderer needs (run with vite-node).
import { CALCULATORS } from '../src/data/calculators';
import { GUIDES } from '../src/data/guides';
import { MOMENTS } from '../src/data/moments';

// Same calm backgrounds as src/styles/tokens.css
const TINT: Record<string, string> = { job: '#e4f1ec', pay: '#f3ede1', loan: '#e7edf6', faith: '#ece9f4', baby: '#f7e7e9', health: '#eaf1dd', shop: '#fbefd9', study: '#e2f0f2', dates: '#efefea' };
const momentOf = (calc: string, guide?: string) => MOMENTS.find((m) => guide && m.guides.includes(guide)) ?? MOMENTS.find((m) => m.calcs.includes(calc))!;

const out = [
  { file: '../og.png', title: 'ماذا يحدث معك الآن؟', sub: 'حاسبات عربية مجانية لمواقف الحياة، وكل نتيجة معها طريقة حسابها', bg: TINT.job },
  ...MOMENTS.map((m) => ({ file: `m-${m.slug}.png`, title: m.name, sub: m.ask, bg: TINT[m.tint] })),
  ...CALCULATORS.map((c) => ({ file: `${c.slug}.png`, title: c.question, sub: c.blurb, bg: TINT[momentOf(c.slug).tint] })),
  ...GUIDES.map((g) => ({ file: `g-${g.slug}.png`, title: g.title, sub: '', bg: TINT[momentOf(g.calc, g.slug).tint] })),
];
console.log(JSON.stringify(out));
