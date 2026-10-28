// AdSense readiness audit on dist/ — the checks Google's help pages list as approval blockers
// (support.google.com/adsense/answer/81904, /9061852, /1348695). Run after `npm run build`:
//   set -a; . ./.env.production; set +a; node scripts/adsense-audit.mjs
// FAIL = likely to block approval; WARN = worth fixing. Exit code 1 on any FAIL.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const pages = walk(DIST).filter((f) => f.endsWith('.html') && !f.includes('/404'));
const fail = [];
const warn = [];
const client = process.env.PUBLIC_ADSENSE_CLIENT_ID || '';
const pub = client.replace(/^ca-/, '');

const text = (s) =>
  s.replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<header[\s\S]*?<\/header>/, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/, ' ').replace(/<dialog[\s\S]*?<\/dialog>/, ' ').replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ').replace(/\s+/g, ' ').trim();

// 1. "Site not ready / under construction": placeholder wording anywhere a reviewer can read it
const PLACEHOLDER = [/سنضيف[^.]{0,40}قريب/, /غير مفعّل بعد/, /قيد الإنشاء/, /تحت الإنشاء/, /قريباً جداً/, /coming soon/i, /under construction/i, /lorem ipsum/i, /\bTODO\b/, /\bTBD\b/];
const titles = new Map();
for (const f of pages) {
  const s = readFileSync(f, 'utf8');
  const page = f.replace(DIST, '').replace(/index\.html$/, '');
  const t = text(s);
  for (const re of PLACEHOLDER) if (re.test(t)) fail.push(`${page}: placeholder / unfinished wording (${re})`);
  // 2. thin content (Google: "insufficient content", "low value content")
  const words = t.split(' ').length;
  const legal = /\/(privacy|terms|contact)\/$/.test(page);
  if (!legal && words < 250) warn.push(`${page}: thin page (${words} words)`);
  // 3. ad code in <head> on every page, with the account's publisher id
  const head = s.split('</head>')[0];
  if (pub && !head.includes(`adsbygoogle.js?client=${client}`)) fail.push(`${page}: AdSense script missing from <head>`);
  if (pub && !head.includes(`google-adsense-account" content="${client}"`)) warn.push(`${page}: google-adsense-account meta missing`);
  // 4. accidental noindex / login walls
  if (/<meta name="robots" content="[^"]*noindex/.test(head)) fail.push(`${page}: noindex`);
  if (/type="password"/.test(s)) warn.push(`${page}: password field (pages behind login are not reviewed)`);
  // 5. duplicate titles look auto-generated
  const title = s.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
  titles.set(title, [...(titles.get(title) ?? []), page]);
  // 6. affiliate-heavy pages (Google: affiliate content should be a minor part)
  const sponsored = (s.match(/rel="[^"]*sponsored/g) || []).length;
  if (sponsored > 5) warn.push(`${page}: ${sponsored} sponsored links`);
}
for (const [t, ps] of titles) if (ps.length > 1) warn.push(`duplicate <title> "${t}" on ${ps.join(', ')}`);

// 7. trust pages exist and are linked from every page's footer
for (const p of ['/about/', '/privacy/', '/contact/', '/terms/']) {
  if (!existsSync(join(DIST, p, 'index.html'))) fail.push(`missing page ${p}`);
  const unlinked = pages.filter((f) => !readFileSync(f, 'utf8').includes(`href="${p}"`)).length;
  if (unlinked) warn.push(`${p} not linked from ${unlinked} page(s)`);
}
// 8. a real way to reach the owner
const contact = existsSync(join(DIST, 'contact/index.html')) ? readFileSync(join(DIST, 'contact/index.html'), 'utf8') : '';
if (!/mailto:[^"]+@|<form[^>]+action="https?:/.test(contact)) fail.push('/contact/: no working email link or form');
// 9. privacy policy wording Google requires for ads (answer/1348695)
const privacy = existsSync(join(DIST, 'privacy/index.html')) ? text(readFileSync(join(DIST, 'privacy/index.html'), 'utf8')) : '';
const privacyHtml = existsSync(join(DIST, 'privacy/index.html')) ? readFileSync(join(DIST, 'privacy/index.html'), 'utf8') : '';
for (const [label, ok] of [
  ['mentions Google / AdSense', /Google/.test(privacy) && /AdSense/.test(privacy)],
  ['third-party vendors use cookies', /موردون خارجيون|موردين خارجيين/.test(privacy) && /ملفات تعريف الارتباط/.test(privacy)],
  ['ads based on prior visits', /زياراتك السابقة/.test(privacy)],
  ['opt-out via Google Ads Settings', /adssettings\.google\.com/.test(privacyHtml)],
  ['opt-out via aboutads.info', /aboutads\.info/.test(privacyHtml)],
]) if (!ok) fail.push(`/privacy/: missing — ${label}`);
// 10. ads.txt and robots.txt
const adsTxt = existsSync(join(DIST, 'ads.txt')) ? readFileSync(join(DIST, 'ads.txt'), 'utf8') : '';
if (pub && !adsTxt.includes(`google.com, ${pub}, DIRECT, f08c47fec0942fa0`)) fail.push('ads.txt: missing the Google line for this publisher id');
const robots = existsSync(join(DIST, 'robots.txt')) ? readFileSync(join(DIST, 'robots.txt'), 'utf8') : '';
const blocks = robots.split(/\n(?=User-agent)/i).filter((b) => /User-agent:\s*(\*|Mediapartners-Google|Googlebot)/i.test(b) && /^Disallow:\s*\/\s*$/im.test(b));
if (blocks.length) fail.push('robots.txt blocks Google crawlers');

console.log(`AdSense audit: ${pages.length} pages`);
for (const m of fail) console.log('FAIL', m);
for (const m of warn) console.log('WARN', m);
if (!fail.length) console.log(warn.length ? `no blockers, ${warn.length} warning(s)` : 'all AdSense checks passed');
process.exit(fail.length ? 1 : 0);
