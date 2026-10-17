// Post-build checks on dist/: every page has a title, description, canonical and exactly one H1;
// every internal link resolves; the sitemap lists real pages; ads stay off unless configured.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const html = walk(DIST).filter((f) => f.endsWith('.html'));
const problems = [];
const resolve = (href) => {
  const p = href.split(/[?#]/)[0];
  if (p.endsWith('/')) return existsSync(join(DIST, p, 'index.html'));
  return existsSync(join(DIST, p));
};

for (const file of html) {
  const s = readFileSync(file, 'utf8');
  const page = file.replace(DIST, '');
  const title = s.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  const desc = s.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  const h1 = (s.match(/<h1[\s>]/g) || []).length;
  if (!title.trim()) problems.push(`${page}: missing <title>`);
  if (desc.length < 50) problems.push(`${page}: description too short (${desc.length})`);
  if (!/<link rel="canonical" href="[^"]+"/.test(s)) problems.push(`${page}: missing canonical`);
  if (h1 !== 1) problems.push(`${page}: ${h1} <h1> elements`);
  if (!/<html lang="ar" dir="rtl">/.test(s)) problems.push(`${page}: missing lang/dir`);
  if (/NaN|Infinity/.test(s.replace(/<script[\s\S]*?<\/script>/g, ''))) problems.push(`${page}: NaN/Infinity in markup`);
  if (/adsbygoogle/.test(s) && process.env.PUBLIC_ADS_ENABLED !== 'true') problems.push(`${page}: ad code present while ads are disabled`);
  for (const [, href] of s.matchAll(/href="(\/[^"]*)"/g)) {
    if (href.startsWith('//')) continue;
    if (!resolve(href)) problems.push(`${page}: broken internal link ${href}`);
  }
}

const titles = html.map((f) => readFileSync(f, 'utf8').match(/<title>([^<]*)<\/title>/)?.[1]);
const dupes = titles.filter((t, i) => titles.indexOf(t) !== i);
if (dupes.length) problems.push(`duplicate titles: ${[...new Set(dupes)].join(' | ')}`);

const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
for (const [, loc] of sitemap.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)) if (!resolve(loc)) problems.push(`sitemap lists missing page ${loc}`);
if (!existsSync(join(DIST, 'robots.txt'))) problems.push('robots.txt missing');

console.log(`checked ${html.length} pages`);
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log('all page checks passed');
