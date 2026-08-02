import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from '@playwright/test';
import { config as loadDotenv } from 'dotenv';

// api has no .env of its own - it shares the repo-root .env (DATABASE_URL,
// JWT_SECRET, ...), same convention as api/test/setup.ts. Loaded here so
// the values are already in `process.env` when the `env:` blocks below build
// each webServer's environment.
const apiDir = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(apiDir, '../.env');
loadDotenv({ path: rootEnvPath });

// Dedicated ports for this suite - distinct from the dev server's default
// (3000, see src/index.ts), Rails' (9876), and each other.
const MAIN_PORT = 4100;
const RATE_LIMIT_PORT = 4101;

/**
 * `process.env` types every value as `string | undefined`; Playwright's
 * `webServer.env` wants plain `{ [key: string]: string }`. Filters out
 * unset keys instead of passing `undefined` through to the spawned child
 * process's environment.
 */
function cleanEnv(overrides: Record<string, string>): Record<string, string> {
  const base = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined));
  return { ...base, ...overrides };
}

export default defineConfig({
  testDir: './e2e',
  // One shared Postgres DB, seeded once by globalSetup (not reset per test,
  // unlike the vitest suite's per-test resetDb()) - fullyParallel/multiple
  // workers would race that shared, mutable state (refresh-token rotation,
  // session revocation, ...) across spec files. Same rationale as
  // vitest.config.ts's fileParallelism: false, applied one level further.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: `http://127.0.0.1:${MAIN_PORT}`,
    // No global `Content-Type` override here on purpose: Playwright already
    // sets `application/json` automatically whenever a request's `data` is a
    // plain object, and forcing it globally would stomp on the multipart
    // boundary header attached_files.spec's upload test needs instead.
  },
  webServer: [
    {
      // The real server, over real HTTP - not an in-process supertest mount.
      // `tsx` (already a devDependency, already used by `pnpm dev`) runs
      // src/index.ts directly for a fast, deterministic startup; a
      // build+start round trip isn't needed for this suite to be a genuine
      // e2e test (it's exercising the real Express app/routing/cookie/JWT
      // stack either way, not the compiled-JS-vs-ts-source distinction).
      //
      // NODE_ENV=test here (matching the vitest suite) keeps
      // src/middleware/rateLimit.ts's login rate limiter disabled (see that
      // file's own comment: it no-ops under NODE_ENV=test specifically so
      // repeated logins across many spec examples don't flake) and
      // src/auth/cookies.ts's refresh-token cookie non-`Secure` (gated on
      // NODE_ENV==='production'; this server is plain HTTP, so a `Secure`
      // cookie would silently never be sent back by Playwright's own
      // spec-compliant cookie jar, breaking every refresh/logout test for a
      // reason unrelated to what those tests are actually about).
      // Invoking the local `tsx` binary directly (rather than `pnpm exec
      // tsx ...`) so this webServer's child process doesn't go through
      // pnpm's own exec wrapper, which (in this environment) runs a
      // dependency-status check that can try to interactively prompt to
      // remove/reinstall node_modules - something a non-TTY child process
      // spawned by Playwright can never satisfy.
      command: 'node_modules/.bin/tsx src/index.ts',
      cwd: apiDir,
      url: `http://127.0.0.1:${MAIN_PORT}/healthz`,
      timeout: 30_000,
      reuseExistingServer: !process.env.CI,
      // MFA_ENCRYPTION_KEY: root .env deliberately has no real value for
      // this (it's a per-environment secret, see .env.next's own generated
      // one) - a fixed, synthetic 32-byte-hex key is fine here, same
      // rationale/value as api/test/routes/mfa.test.ts's identical literal
      // for the vitest suite. Without this, src/lib/mfaEncryption.ts's
      // loadKey() throws the moment any spec exercises TOTP setup
      // (encryptSecret), which no spec did until this suite's "MFA security
      // boundaries" describe block.
      env: cleanEnv({ PORT: String(MAIN_PORT), NODE_ENV: 'test', MFA_ENCRYPTION_KEY: 'a'.repeat(64) }),
    },
    {
      // A second, otherwise-identical server instance whose sole purpose is
      // auth.spec.ts's login-rate-limiter test. NODE_ENV is anything other
      // than the literal string 'test' so createRateLimiter's isTest branch
      // is false and the real express-rate-limit middleware actually
      // engages (see rateLimit.ts) - 'e2e-ratelimit' rather than
      // 'production' specifically so cookies.ts's `secure: NODE_ENV ===
      // 'production'` check still stays false here too (this instance isn't
      // used for any cookie-based test, but there's no reason to needlessly
      // pick the one NODE_ENV value that would break it if it ever were).
      // RATE_LIMIT_LOGIN_MAX/_WINDOW_MS are overridden low so the test trips
      // the limiter with a handful of requests instead of needing the
      // production default (10 per 60s) - see rateLimit.ts's envOverride().
      // Invoking the local `tsx` binary directly (rather than `pnpm exec
      // tsx ...`) so this webServer's child process doesn't go through
      // pnpm's own exec wrapper, which (in this environment) runs a
      // dependency-status check that can try to interactively prompt to
      // remove/reinstall node_modules - something a non-TTY child process
      // spawned by Playwright can never satisfy.
      command: 'node_modules/.bin/tsx src/index.ts',
      cwd: apiDir,
      url: `http://127.0.0.1:${RATE_LIMIT_PORT}/healthz`,
      timeout: 30_000,
      reuseExistingServer: !process.env.CI,
      env: cleanEnv({
        PORT: String(RATE_LIMIT_PORT),
        NODE_ENV: 'e2e-ratelimit',
        RATE_LIMIT_LOGIN_MAX: '3',
        RATE_LIMIT_LOGIN_WINDOW_MS: '60000',
        // This instance's NODE_ENV is deliberately not 'test' (see comment
        // above), so it doesn't get icsSyncScheduler.ts's NODE_ENV=test
        // no-op for free - disable it explicitly instead of letting it fire
        // live ICS network syncs during CI.
        ICS_SYNC_DISABLED: 'true',
      }),
    },
  ],
});
