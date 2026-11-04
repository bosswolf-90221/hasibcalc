// Opens every external link in dist/ and reports the ones that do not work.
// Run after `npm run build`:  node scripts/check-links.mjs
// DEAD fails the run. BLOCKED (401/403/429, or a site that refuses scripts) must be opened by hand; a script cannot judge it.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

const DIST = 'dist';
const SKIP = /^https?:\/\/(www\.)?(hasibcalc\.com|schema\.org|www\.w3\.org)/;
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const links = new Map();
for (const f of walk(DIST).filter((x) => x.endsWith('.html'))) {
  const page = '/' + f.split(sep).slice(1).join('/').replace(/index\.html$/, '');
  for (const [, href] of readFileSync(f, 'utf8').matchAll(/<a\b[^>]*href="(https?:\/\/[^"]+)"/g)) {
    const url = href.replace(/&amp;/g, '&');
    if (SKIP.test(url)) continue;
    if (!links.has(url)) links.set(url, new Set());
    links.get(url).add(page);
  }
}

const UA = { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36', accept: 'text/html,*/*' };
async function probe(url) {
  try {
    const res = await fetch(url, { headers: UA, redirect: 'follow', signal: AbortSignal.timeout(25000) });
    await res.body?.cancel();
    return { status: res.status, final: res.url };
  } catch (e) {
    return { status: 0, error: e.cause?.code || e.name };
  }
}

const urls = [...links.keys()].sort();
const results = [];
for (let i = 0; i < urls.length; i += 6) {
  results.push(...(await Promise.all(urls.slice(i, i + 6).map(async (url) => ({ url, ...(await probe(url)) })))));
}
const kind = (r) => (r.status >= 200 && r.status < 400 ? 'OK' : [401, 403, 405, 429, 503].includes(r.status) ? 'BLOCKED' : 'DEAD');
const count = { OK: 0, BLOCKED: 0, DEAD: 0 };
for (const r of results) {
  const k = kind(r);
  count[k]++;
  if (k !== 'OK') console.log(`${k.padEnd(8)}${r.status || r.error}  ${r.url}\n         on ${[...links.get(r.url)].join(', ')}`);
}
console.log(`external links: ${urls.length} · OK ${count.OK} · BLOCKED ${count.BLOCKED} · DEAD ${count.DEAD}`);
process.exit(count.DEAD ? 1 : 0);
