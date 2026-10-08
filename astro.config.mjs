// @ts-check
import { defineConfig } from 'astro/config';

// SITE and BASE_PATH are set by the GitHub Pages workflow (actions/configure-pages).
// Once a custom domain is attached, BASE_PATH becomes "/" automatically.
export default defineConfig({
  site: process.env.SITE ?? 'https://paoloeusebi.github.io',
  base: process.env.BASE_PATH ?? '/',
  trailingSlash: 'always',
});
