import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), 'PUBLIC_');
const site = (process.env.PUBLIC_SITE_URL || env.PUBLIC_SITE_URL || 'https://www.example.com').replace(/\/$/, '');
if (site.includes('example.com')) {
  console.warn('\n[hasib] PUBLIC_SITE_URL is not set — canonical URLs and the sitemap use a placeholder domain. Set it before deploying.\n');
}

export default defineConfig({
  site,
  integrations: [react()],
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  compressHTML: true,
  devToolbar: { enabled: false },
});
