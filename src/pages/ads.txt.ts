import type { APIRoute } from 'astro';
import { ADS } from '../config/site';

// Google's authorised-seller line. Written only when a real publisher id is configured.
export const GET: APIRoute = () => {
  const pub = ADS.client.replace(/^ca-/, '');
  const body = /^pub-\d{10,20}$/.test(pub) ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` : '# AdSense publisher id not configured yet\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
