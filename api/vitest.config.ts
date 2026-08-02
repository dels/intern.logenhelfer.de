import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    // api/e2e/**/*.spec.ts are Playwright specs (run via `playwright test`,
    // not vitest) - vitest's default include glob matches *.spec.ts too, so
    // without this they get picked up here and crash on `test.describe()`
    // ("Playwright Test did not expect test.describe() to be called here").
    exclude: [...configDefaults.exclude, 'e2e/**'],
    // Test files share one real Postgres DB and reset it via TRUNCATE in
    // beforeEach (see test/helpers/db.ts). Running files in parallel races
    // one file's truncate against another file's in-flight queries/inserts,
    // so force sequential file execution.
    fileParallelism: false,
    // A small, low-rate flake (an isolated test occasionally timing out or
    // getting an unexpected 401/404/empty-body, in a random file, never
    // reproducible by running that file alone) has been observed in the
    // full run. Investigated as a possible cross-test DB race (one file's
    // resetDb() TRUNCATE landing mid-flight of another file's query) via a
    // battery of checks: a temporary event-loop-lag watcher (never fired,
    // even during a hang), a stable file-descriptor count across a full run
    // (no leak), a healthy Postgres connection count (no pool exhaustion),
    // forcing per-file process isolation off (`isolate: false`, one shared
    // process/module-registry for the whole run - no effect), and forcing
    // the whole run onto a single physical DB connection
    // (`?connection_limit=1` + `isolate: false` together, which would make a
    // cross-connection race physically impossible) - which made failures
    // *more* frequent, not less, ruling out a connection race as the cause
    // (it isn't fixed by removing concurrency, and forcing full
    // serialization actively starves code paths that legitimately want
    // concurrent queries). That leaves genuinely bounded, host-level I/O
    // latency as the remaining explanation. A modest timeout bump reduces
    // (does not eliminate) the failure rate - it is a partial mitigation
    // for real latency, not a mask for a hang (the diagnostics above rule
    // out an actual stuck/deadlocked process).
    testTimeout: 15_000,
  },
});
