import type { APIRoute } from 'astro';
import { CALCULATORS, CATEGORIES } from '../data/calculators';
import { SITE } from '../config/site';
import { GUIDES } from '../data/guides';

export const GET: APIRoute = () => {
  // lastmod = when that page's content last changed, so Google knows what to re-crawl.
  const latest = (ds: (string | undefined)[]) => ds.filter(Boolean).sort().pop() ?? SITE.lastReviewed;
  const calcDate = (c: (typeof CALCULATORS)[number]) => c.updated ?? SITE.lastReviewed;
  const all = latest([...CALCULATORS.map(calcDate), ...GUIDES.map((g) => g.date)]);
  const entries: [string, string][] = [
    ['/', all],
    ...CALCULATORS.map((c) => [`/${c.slug}/`, calcDate(c)] as [string, string]),
    ...CATEGORIES.map((k) => [`/category/${k.key}/`, latest(CALCULATORS.filter((c) => c.categories.includes(k.key)).map(calcDate))] as [string, string]),
    ['/guides/', latest(GUIDES.map((g) => g.date))],
    ...GUIDES.map((g) => [`/guides/${g.slug}/`, g.date] as [string, string]),
    ['/about/', SITE.lastReviewed], ['/privacy/', SITE.lastReviewed], ['/terms/', SITE.lastReviewed], ['/contact/', SITE.lastReviewed],
  ];
  const urls = entries.map(([p, d]) => `  <url><loc>${SITE.url}${p}</loc><lastmod>${d}</lastmod></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
