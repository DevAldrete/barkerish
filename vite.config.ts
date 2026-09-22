import { defineConfig } from 'vitest/config';

/**
 * Application build. Vite bundles and hashes assets, and resolves Lit's
 * `production` export condition for builds (the smaller, faster build); the dev
 * server resolves Lit's `development` build. Lit's docs suggest Terser, but on
 * this project Vite's default esbuild minifier produced a smaller bundle
 * (~196 kB vs ~198 kB), so we keep the default.
 */
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
    sourcemap: false,
    cssMinify: true,
  },
  test: {
    environment: 'jsdom',
    include: ['test/**/*.test.ts'],
  },
});
