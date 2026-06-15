import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(), 
    tailwindcss()
  ],
  build: {
    outDir: '../assets/app',
    emptyOutDir: true,
    cssMinify: true, // 🌟 FIXED: Uses Vite 8's native built-in minifier layer instead of external modules!
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
        assetFileNames: 'index.css',
        chunkFileNames: '[name].js',
      },
    },
  },
});
