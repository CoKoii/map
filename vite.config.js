import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    // Inline the banner so the single-file build has no runtime image dependency.
    assetsInlineLimit: 3_000_000,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        assetFileNames: ({ name }) => name === 'car.glb' ? 'assets/car.glb' : 'assets/[name]-[hash][extname]'
      }
    }
  }
});
