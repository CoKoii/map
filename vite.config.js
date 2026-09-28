import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  base: './',
  server: {
    proxy: {
      '/api/large': {
        target: 'http://139.196.108.216:9212',
        changeOrigin: true
      }
    }
  },
  build: {
    assetsInlineLimit: mode === 'single' ? Infinity : 0
  }
}));
