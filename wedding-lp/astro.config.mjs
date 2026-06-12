// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import wedding from './src/data/wedding.json' with { type: 'json' };

const siteUrl = process.env.SITE_URL ?? wedding.site.url;
const basePath = process.env.ASTRO_BASE ?? '/invitacion/';

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  base: basePath,
  trailingSlash: 'always',
  devToolbar: {
    enabled: false,
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [sitemap()],
  build: {
    inlineStylesheets: 'auto',
  },
});
