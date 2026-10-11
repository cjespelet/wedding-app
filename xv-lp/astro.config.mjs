// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import event from './src/data/event.json' with { type: 'json' };

const siteUrl = process.env.SITE_URL ?? event.site.url;
const basePath = process.env.ASTRO_BASE ?? '/';

export default defineConfig({
  site: siteUrl,
  base: basePath,
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
});
