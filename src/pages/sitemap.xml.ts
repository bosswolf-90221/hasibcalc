import type { APIRoute } from 'astro';
import { CALCULATORS, CATEGORIES } from '../data/calculators';
import { SITE } from '../config/site';

export const GET: APIRoute = () => {
  const paths = ['/', ...CALCULATORS.map((c) => `/${c.slug}/`), ...CATEGORIES.map((c) => `/category/${c.key}/`), '/about/', '/privacy/', '/terms/', '/contact/'];
  const urls = paths.map((p) => `  <url><loc>${SITE.url}${p}</loc><lastmod>${SITE.lastReviewed}</lastmod></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
