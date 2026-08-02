import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// tokenConfig.ts reads process.env.JWT_ACCESS_TTL / JWT_REFRESH_TTL once, at
// module-load time (not per-call) - so unlike e.g. appConfig.test.ts's
// NODE_ENV manipulation (read fresh inside a function on every call), simply
// mutating process.env here and re-using the already-imported module would
// have no effect: the constants were already computed on first import and
// Node's module cache would just hand back the same values. vi.resetModules()
// clears that cache, and a dynamic `await import(...)` after it forces the
// module body (and therefore parseTtlSeconds) to re-run against whatever
// process.env looks like at that moment. No existing precedent for this
// pattern was found elsewhere in the suite, so this is the standard
// resetModules + dynamic re-import technique, applied fresh.
describe('tokenConfig', () => {
  const ORIGINAL_ACCESS = process.env.JWT_ACCESS_TTL;
  const ORIGINAL_REFRESH = process.env.JWT_REFRESH_TTL;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    if (ORIGINAL_ACCESS === undefined) delete process.env.JWT_ACCESS_TTL;
    else process.env.JWT_ACCESS_TTL = ORIGINAL_ACCESS;

    if (ORIGINAL_REFRESH === undefined) delete process.env.JWT_REFRESH_TTL;
    else process.env.JWT_REFRESH_TTL = ORIGINAL_REFRESH;

    vi.resetModules();
  });

  it('defaults JWT_ACCESS_TTL to 900 seconds when unset', async () => {
    delete process.env.JWT_ACCESS_TTL;
    const { JWT_ACCESS_TTL_SECONDS } = await import('../../src/auth/tokenConfig.js');
    expect(JWT_ACCESS_TTL_SECONDS).toBe(900);
  });

  it('defaults JWT_REFRESH_TTL to 604800 seconds (7 days) when unset', async () => {
    delete process.env.JWT_REFRESH_TTL;
    const { JWT_REFRESH_TTL_SECONDS } = await import('../../src/auth/tokenConfig.js');
    expect(JWT_REFRESH_TTL_SECONDS).toBe(604800);
  });

  it('respects a valid positive JWT_ACCESS_TTL override', async () => {
    process.env.JWT_ACCESS_TTL = '1800';
    const { JWT_ACCESS_TTL_SECONDS } = await import('../../src/auth/tokenConfig.js');
    expect(JWT_ACCESS_TTL_SECONDS).toBe(1800);
  });

  it('respects a valid positive JWT_REFRESH_TTL override', async () => {
    process.env.JWT_REFRESH_TTL = '3600';
    const { JWT_REFRESH_TTL_SECONDS } = await import('../../src/auth/tokenConfig.js');
    expect(JWT_REFRESH_TTL_SECONDS).toBe(3600);
  });

  it.each([['empty string', ''], ['non-numeric', 'not-a-number'], ['zero', '0'], ['negative', '-100']])(
    'falls back to the JWT_ACCESS_TTL default on %s',
    async (_label, value) => {
      process.env.JWT_ACCESS_TTL = value;
      const { JWT_ACCESS_TTL_SECONDS } = await import('../../src/auth/tokenConfig.js');
      expect(JWT_ACCESS_TTL_SECONDS).toBe(900);
    },
  );

  it.each([['empty string', ''], ['non-numeric', 'not-a-number'], ['zero', '0'], ['negative', '-100']])(
    'falls back to the JWT_REFRESH_TTL default on %s',
    async (_label, value) => {
      process.env.JWT_REFRESH_TTL = value;
      const { JWT_REFRESH_TTL_SECONDS } = await import('../../src/auth/tokenConfig.js');
      expect(JWT_REFRESH_TTL_SECONDS).toBe(604800);
    },
  );

  it.each(['', 'garbage', '0', '-5', 'NaN', 'Infinity'])(
    'never produces NaN or a negative TTL for input %j',
    async (value) => {
      process.env.JWT_ACCESS_TTL = value;
      process.env.JWT_REFRESH_TTL = value;
      const { JWT_ACCESS_TTL_SECONDS, JWT_REFRESH_TTL_SECONDS } = await import('../../src/auth/tokenConfig.js');
      expect(Number.isFinite(JWT_ACCESS_TTL_SECONDS)).toBe(true);
      expect(JWT_ACCESS_TTL_SECONDS).toBeGreaterThan(0);
      expect(Number.isFinite(JWT_REFRESH_TTL_SECONDS)).toBe(true);
      expect(JWT_REFRESH_TTL_SECONDS).toBeGreaterThan(0);
    },
  );
});
