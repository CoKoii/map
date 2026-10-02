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
    // Keep binary assets such as the vehicle GLB next to the single HTML file.
    assetsInlineLimit: 0,
    rollupOptions: mode === 'single'
      ? { output: { inlineDynamicImports: true } }
      : {
          output: {
            manualChunks(id) {
              if (id.includes('/node_modules/three/')) return 'three-vendor';
            }
          }
        }
  }
}));
