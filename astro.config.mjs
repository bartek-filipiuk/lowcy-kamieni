import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://stone.67projects.app',
  // pliki płaskie (kolekcja.html zamiast kolekcja/index.html) — bez przekierowań 301 za proxy
  build: { format: 'file' },
});
