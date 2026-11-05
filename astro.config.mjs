import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV || 'production', process.cwd(), 'PUBLIC_');
const site = (process.env.PUBLIC_SITE_URL || env.PUBLIC_SITE_URL || 'https://www.example.com').replace(/\/$/, '');
if (site.includes('example.com')) {
  console.warn('\n[hasib] PUBLIC_SITE_URL is not set — canonical URLs and the sitemap use a placeholder domain. Set it before deploying.\n');
}

export default defineConfig({
  site,
  trailingSlash: 'always',
  build: { format: 'directory', inlineStylesheets: 'auto' },
  compressHTML: true,
  devToolbar: { enabled: false },
});
