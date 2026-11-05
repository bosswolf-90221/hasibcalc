// SEO checks on dist/ that the other scripts do not cover. Run after `npm run build`, with .env.production loaded.
// Passing does not promise rankings. It only means the pages are readable and consistent for search engines.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

const DIST = 'dist';
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const files = walk(DIST).map((f) => f.split(sep).join('/')).filter((f) => f.endsWith('.html'));
const fail = [];
const warn = [];
const attr = (s, re) => s.match(re)?.[1] ?? '';
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const visibleText = (s) => s.replace(/<head[\s\S]*?<\/head>/, ' ').replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const pages = files.map((file) => {
  const s = readFileSync(file, 'utf8');
  const path = file === `${DIST}/404.html` ? '/404/' : file.replace(DIST, '').replace(/index\.html$/, '');
  const main = s.match(/<main[\s\S]*<\/main>/)?.[0] ?? '';
  return { file, path, s, main, noindex: /<meta name="robots" content="noindex/.test(s) };
});

const inbound = new Map(pages.map((p) => [p.path, 0]));
for (const p of pages) {
  const title = decode(attr(p.s, /<title>([^<]*)<\/title>/));
  const desc = decode(attr(p.s, /<meta name="description" content="([^"]*)"/));
  const canonical = attr(p.s, /<link rel="canonical" href="([^"]+)"/);
  const label = p.path;

  if (!p.noindex) {
    if (title.length > 70) warn.push(`${label}: long title (${title.length}): ${title}`);
    if (title.length < 15) warn.push(`${label}: short title (${title.length})`);
    if (desc.length > 170) warn.push(`${label}: long description (${desc.length})`);
    if (desc.length < 70) warn.push(`${label}: short description (${desc.length})`);
  }
  if (!canonical.endsWith(p.path)) fail.push(`${label}: canonical does not match the page: ${canonical}`);

  const image = attr(p.s, /<meta property="og:image" content="https?:\/\/[^/]+(\/[^"]+)"/);
  if (!image || !existsSync(join(DIST, image))) fail.push(`${label}: og:image file missing: ${image}`);

  for (const [, raw] of p.s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const data = JSON.parse(raw);
      for (const item of Array.isArray(data) ? data : [data]) {
        if (item['@type'] === 'FAQPage' && !item.mainEntity?.length) fail.push(`${label}: empty FAQPage`);
        if (item['@type'] === 'BreadcrumbList' && !item.itemListElement?.every((e) => e.item?.startsWith('http'))) fail.push(`${label}: breadcrumb without full address`);
        if (item.author?.['@type'] === 'Person') fail.push(`${label}: names a person as author`);
      }
    } catch { fail.push(`${label}: JSON-LD does not parse`); }
  }

  let last = 1;
  for (const [, n] of p.main.matchAll(/<h([1-6])[\s>]/g)) {
    const level = Number(n);
    if (level > last + 1) { warn.push(`${label}: heading jumps from h${last} to h${level}`); break; }
    last = level;
  }
  for (const [tag] of p.s.matchAll(/<img\b[^>]*>/g)) if (!/\balt=/.test(tag)) fail.push(`${label}: image without alt`);

  const ids = new Set([...p.s.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]));
  for (const [, id] of p.s.matchAll(/href="#([^"]+)"/g)) if (!ids.has(id)) fail.push(`${label}: link to missing #${id}`);
  for (const [, target, id] of p.s.matchAll(/href="(\/[^"#?]*)#([^"]+)"/g)) {
    const other = pages.find((x) => x.path === target);
    if (other && !new RegExp(`\\bid="${id}"`).test(other.s)) fail.push(`${label}: link to missing ${target}#${id}`);
  }

  // links in the page's own content count; the header and footer link to everything
  for (const [, href] of p.main.matchAll(/href="(\/[^"#?]*)/g)) if (inbound.has(href) && href !== p.path) inbound.set(href, inbound.get(href) + 1);

  const words = visibleText(p.main).split(' ').length;
  p.words = words;
  if (!p.noindex && words < 150) warn.push(`${label}: little text (${words} words)`);
}

for (const p of pages) if (!p.noindex && p.path !== '/' && inbound.get(p.path) === 0) fail.push(`${p.path}: no page links to it from its content`);

const sitemap = readFileSync(join(DIST, 'sitemap.xml'), 'utf8');
const listed = new Set([...sitemap.matchAll(/<loc>https?:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map((m) => m[1]));
for (const p of pages) {
  if (!p.noindex && !listed.has(p.path)) fail.push(`${p.path}: indexable but not in the sitemap`);
  if (p.noindex && listed.has(p.path)) fail.push(`${p.path}: noindex but in the sitemap`);
}
const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
if (!/Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/.test(robots)) fail.push('robots.txt: no sitemap line');
if (/Disallow:\s*\/\s*$/m.test(robots)) fail.push('robots.txt: blocks the whole site');

const titles = new Map();
for (const p of pages) { const t = attr(p.s, /<title>([^<]*)<\/title>/); titles.set(t, [...(titles.get(t) ?? []), p.path]); }
for (const [t, ps] of titles) if (ps.length > 1) fail.push(`same title on ${ps.join(', ')}: ${t}`);
const descs = new Map();
for (const p of pages) { const t = attr(p.s, /<meta name="description" content="([^"]*)"/); descs.set(t, [...(descs.get(t) ?? []), p.path]); }
for (const [, ps] of descs) if (ps.length > 1) fail.push(`same description on ${ps.join(', ')}`);

console.log(`SEO audit: ${pages.length} pages, ${listed.size} in the sitemap`);
if (process.argv.includes('--words')) for (const p of [...pages].sort((a, b) => a.words - b.words)) console.log(`  ${String(p.words).padStart(5)}  ${p.path}`);
for (const w of warn) console.log('WARN', w);
for (const f of fail) console.log('FAIL', f);
if (fail.length) process.exit(1);
console.log('no blocking SEO problems');
