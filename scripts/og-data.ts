// Dumps the data the preview-image renderer needs (run with vite-node).
import { CALCULATORS } from '../src/data/calculators';
import { GUIDES } from '../src/data/guides';
const out = [
  ...CALCULATORS.map((c) => ({ file: `${c.slug}.png`, kicker: 'أريد أن أعرف…', title: c.question, sub: c.blurb, tone: c.tone })),
  ...GUIDES.map((g) => ({ file: `g-${g.slug}.png`, kicker: g.kicker, title: g.title, sub: '', tone: '#7df0c8' })),
];
console.log(JSON.stringify(out));
