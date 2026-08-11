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
        // Precache scope (Task 7 of the perf-optimization plan): Task 6 split
        // routes.tsx's ~51 page components into React.lazy() chunks (116 JS
        // chunks instead of 6). Workbox's default generateSW behavior (no
        // globPatterns override) precaches every build output, which meant
        // the SW was proactively re-fetching all ~109 lazy route chunks
        // immediately after first paint - undoing much of Task 6's benefit.
        // This list instead precaches only the entry chunk plus the
        // vendor/core chunks the entry itself statically pulls in - i.e.
        // exactly what dist/index.html's own <script>/<link
        // rel="modulepreload"> tags reference after a build, which is the
        // ground truth for "needed before first paint" - plus the core
        // stylesheet, the SW registration script, and the static
        // offline/error pages. Every lazy route chunk is excluded here and
        // gets runtime-cached by the browser's normal HTTP cache on first
        // real visit instead of being force-fetched upfront.
        // If the entry's static import graph grows a new shared chunk
        // (e.g. after a dependency upgrade changes how Rollup splits
        // vendor code), add its name-prefixed glob below - rebuild and
        // check dist/index.html's modulepreload hrefs to find it. Missing
        // one here only means that one file isn't precached (it still
        // loads fine from the network on first visit); it does not break
        // the SW or the app shell.
        // These globs match on Rollup's human-readable chunk name prefix,
        // not a stable chunk ID - if a lazy route chunk ever happens to
        // get the same name prefix as one of these (e.g. a new lazy
        // "Modal-*.js"), it would be silently over-included (extra bytes
        // precached, not a break). After any dependency bump that changes
        // vendor chunking, re-check: `ls dist/assets | grep '^<prefix>-'`
        // for each prefix below should return exactly one file.
        globPatterns: [
          'index.html',
          'registerSW.js',
          'errors/**/*.{html,css,js}',
          'assets/index-*.{js,css}',
          'assets/rolldown-runtime-*.js',
          'assets/Box-*.js',
          'assets/Typography-*.js',
          'assets/useSlot-*.js',
          'assets/useSlotProps-*.js',
          'assets/Grow-*.js',
          'assets/Paper-*.js',
          'assets/contains-*.js',
          'assets/useRovingTabIndex-*.js',
          'assets/Modal-*.js',
          'assets/createSvgIcon-*.js',
          'assets/List-*.js',
          'assets/TextField-*.js',
          'assets/listItemTextClasses-*.js',
          'assets/MenuItem-*.js',
          'assets/useQuery-*.js',
          'assets/client-*.js',
        ],
        // 1 MB: headroom above the ~655 KB entry chunk Task 6 left behind
        // (down from 1,567 KB pre-split). Previously raised to 3 MB
        // specifically "to accommodate the large bundle" - now that the
        // entry chunk is small again, a tighter limit works as a real size
        // canary again (it will fail the build if the entry chunk balloons
        // back up) instead of a muted alarm that would silently accept a
        // multi-MB regression.
        maximumFileSizeToCacheInBytes: 1024 * 1024,
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
