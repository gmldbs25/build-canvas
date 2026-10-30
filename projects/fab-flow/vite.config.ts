import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? (process.env.PAGES_BASE_PATH || '/build-canvas/fab-flow/').replace(/\/?$/, '/') : '/',
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { outDir: 'dist-pages', emptyOutDir: true, sourcemap: false, target: 'es2022' }
});
