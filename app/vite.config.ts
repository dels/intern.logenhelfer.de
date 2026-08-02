import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: process.env.API_PROXY ?? 'http://localhost:3000', changeOrigin: true },
    },
  },
  // ponytail: single-bundle app, no route-level code-splitting yet — raise the
  // ceiling to match reality instead of warning on every build. Add
  // React.lazy() per route in routes.tsx if initial load time becomes a
  // real complaint.
  build: {
    chunkSizeWarningLimit: 2500,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    exclude: [...configDefaults.exclude, 'e2e/**'],
    // ponytail: default 5000ms timeout has been observed to flake under full-suite
    // CPU contention (test itself finishes in <100ms in isolation) — 10s gives
    // headroom without hiding a genuine hang.
    testTimeout: 10000,
  },
});
