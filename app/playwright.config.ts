import { defineConfig } from '@playwright/test';

// A handful of tests mutate global fixtures that many other specs read - a
// shared login's password (account.spec.ts), an app-wide AppConfig toggle
// (authorization-boundaries.spec.ts's statistics-visibility test), a
// one-way GDPR-acceptance flip on a dedicated user (dashboard.spec.ts).
// Tagged @shared-state and routed to their own project below so they never
// run concurrently with anything that could race them.
const SHARED_STATE_TAG = '@shared-state';

export default defineConfig({
  testDir: './e2e',
  use: { baseURL: 'http://localhost:5173' },
  // The deploy gate (bin/test-gate) runs the whole suite under several
  // parallel workers against a cold Vite dev server - the very first
  // navigation in whichever spec starts first can occasionally lose a race
  // with Vite's dependency pre-bundling and time out on its first
  // interaction, unrelated to any actual test/feature bug (observed across
  // Events/Members/Seekers Increment 1 gate runs: a different spec fails
  // each time, always on the first getByLabel/heading check, never a real
  // assertion mismatch). One retry re-runs against the by-then-warmed-up
  // server without masking a genuinely broken feature, which would still
  // fail on retry.
  retries: 2,
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
  projects: [
    {
      // workers: 1 serializes these against each other too - there are only
      // a few, so running them one at a time first is cheap.
      name: 'shared-state',
      grep: new RegExp(SHARED_STATE_TAG),
      workers: 1,
    },
    {
      // dependencies means every 'shared-state' test has fully finished
      // (its whole mutate-then-restore cycle) before any of these start -
      // not just capped concurrency, actual sequencing.
      name: 'parallel',
      grepInvert: new RegExp(SHARED_STATE_TAG),
      dependencies: ['shared-state'],
    },
  ],
});
