import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // manifest: false - the manifest is served dynamically by the API
    // (GET /api/v1/public/manifest.webmanifest, see api/src/routes/public.ts),
    // built live from AppConfig + the current uploaded logo, not a
    // build-time snapshot. This plugin is used purely for service-worker
    // generation/registration. No runtimeCaching entries are configured -
    // the SW must never cache /api/* responses (member/roster data).
    VitePWA({
      manifest: false,
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB to accommodate the large bundle
      },
    }),
  ],
  server: {
    proxy: {
      '/api': { target: process.env.API_PROXY ?? 'http://localhost:3000', changeOrigin: true },
    },
  },
  // Route-level code-splitting is in place (see routes.tsx's React.lazy
  // block), so the entry chunk no longer carries every page. The remaining
  // large chunks are third-party ones Rollup splits out on its own - jspdf
  // and its html2canvas dependency (already dynamically imported, see
  // features/*/api.ts) and @mui/x-data-grid, shared by every list page. The
  // limit stays above those so the build isn't noisy about chunks that are
  // already off the critical path; lower it if they ever get split further.
  build: {
    chunkSizeWarningLimit: 700,
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
