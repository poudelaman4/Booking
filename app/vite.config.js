import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function preserveWordPressUnderscore() {
  return {
    name: 'preserve-wp-underscore',
    renderChunk(code) {
      const header = `var __wp_underscore = window._ || undefined;\n`;
      const footer = `\nif (typeof __wp_underscore !== 'undefined') { window._ = __wp_underscore; }`;
      return { code: header + code + footer };
    }
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    outDir: '../assets/app',
    emptyOutDir: true,
    cssMinify: true,
    rollupOptions: {
      plugins: [preserveWordPressUnderscore()],
      output: {
        entryFileNames: 'index.js',
        assetFileNames: 'index.css',
        chunkFileNames: '[name].js',
      },
    },
  },
});