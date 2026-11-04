// Preservation check on dist/: every page and URL that existed before the redesign must still exist,
// and SEO fields that were present must still be present. New pages are allowed; lost pages are not.
// Run after `npm run build`:  node scripts/check-baseline.mjs
// Create or refresh the baseline (only before the redesign):  node scripts/check-baseline.mjs --write
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, sep } from 'node:path';

const DIST = 'dist';
const OUT = join('tests', 'baseline', 'pages.json');
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const attr = (s, re) => s.match(re)?.[1] ?? '';

function read() {
  const pages = {};
  for (const f of walk(DIST).filter((x) => x.endsWith('.html'))) {
    const url = '/' + f.split(sep).slice(1).join('/').replace(/index\.html$/, '');
    const s = readFileSync(f, 'utf8');
    pages[url] = {
      title: attr(s, /<title>([^<]*)<\/title>/),
      description: attr(s, /<meta name="description" content="([^"]*)"/),
      canonical: attr(s, /<link rel="canonical" href="([^"]+)"/),
      ogImage: attr(s, /<meta property="og:image" content="([^"]+)"/),
      h1: (s.match(/<h1[\s\S]*?<\/h1>/) || [''])[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      jsonLd: [...new Set([...s.matchAll(/"@type":"(\w+)"/g)].map((m) => m[1]))].sort(),
      adsScript: s.includes('adsbygoogle.js?client='),
    };
  }
  const sitemap = [...readFileSync(join(DIST, 'sitemap.xml'), 'utf8').matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]).sort();
  const files = { 'ads.txt': readFileSync(join(DIST, 'ads.txt'), 'utf8').trim(), 'robots.txt': readFileSync(join(DIST, 'robots.txt'), 'utf8').trim() };
  return { pages, sitemap, files };
}

const now = read();
if (process.argv.includes('--write')) {
  mkdirSync(join('tests', 'baseline'), { recursive: true });
  writeFileSync(OUT, JSON.stringify(now, null, 2) + '\n');
  console.log(`baseline written: ${Object.keys(now.pages).length} pages, ${now.sitemap.length} sitemap URLs`);
  process.exit(0);
}
if (!existsSync(OUT)) { console.error('no baseline: run with --write first'); process.exit(1); }

const base = JSON.parse(readFileSync(OUT, 'utf8'));
const lost = [];
const changed = [];
for (const [url, b] of Object.entries(base.pages)) {
  const n = now.pages[url];
  if (!n) { lost.push(`missing page ${url}`); continue; }
  if (b.canonical !== n.canonical) lost.push(`${url}: canonical changed to ${n.canonical}`);
  for (const k of ['title', 'description', 'ogImage']) if (b[k] && !n[k]) lost.push(`${url}: lost ${k}`);
  for (const t of b.jsonLd) if (!n.jsonLd.includes(t)) lost.push(`${url}: lost JSON-LD ${t}`);
  for (const k of ['title', 'description', 'h1']) if (b[k] !== n[k]) changed.push(`${url}: ${k} changed`);
}
for (const url of base.sitemap) if (!now.sitemap.includes(url)) lost.push(`sitemap lost ${url}`);
for (const [f, v] of Object.entries(base.files)) if (now.files[f] !== v) lost.push(`${f} changed`);

const added = Object.keys(now.pages).filter((u) => !base.pages[u]);
console.log(`baseline: ${Object.keys(base.pages).length} pages · now: ${Object.keys(now.pages).length} · added: ${added.length} · text changes to review: ${changed.length}`);
for (const u of added) console.log('ADDED ', u);
for (const c of changed) console.log('REVIEW', c);
if (lost.length) { console.error(lost.map((l) => 'LOST   ' + l).join('\n')); process.exit(1); }
console.log('nothing lost: all baseline URLs, canonicals, structured data, ads.txt and robots.txt are intact');
