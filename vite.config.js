import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: './',
  build: {
    assetsInlineLimit: mode === 'single' ? Infinity : 0
  }
}));
