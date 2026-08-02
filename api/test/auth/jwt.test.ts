import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AccessTokenInvalidError, issueAccessToken, issueMfaPendingToken, verifyAccessToken } from '../../src/auth/jwt.js';
import { createUser } from '../helpers/factories.js';
import { resetDb } from '../helpers/db.js';

// Port of rails-app/spec/lib/access_token_spec.rb (3 examples).
describe('access token', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('round-trips the user id', async () => {
    const user = await createUser();

    const token = issueAccessToken(user.id);

    expect(verifyAccessToken(token).sub).toBe(user.id);
  });

  it('rejects garbage', () => {
    expect(() => verifyAccessToken('nope')).toThrow(AccessTokenInvalidError);
  });

  it('rejects expired tokens', async () => {
    const user = await createUser();
    const t0 = Date.now();
    const token = issueAccessToken(user.id);

    // Date-only fake timers: faking setTimeout/setInterval too would hang the
    // Prisma queries used elsewhere in this suite, since the query engine
    // waits on real timers.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(t0 + 16 * 60_000);

    expect(() => verifyAccessToken(token)).toThrow(AccessTokenInvalidError);
  });

  // Security fix: impersonation tokens were previously identical in shape to
  // a normal login token (issueAccessToken(target.id) with no marker), so an
  // admin impersonating a member could act with zero trace back to
  // themselves. issueAccessToken's optional second parameter threads the
  // impersonator's id onto the token as `act` (mirrors OAuth's "actor" claim
  // convention) so downstream code (middleware.ts/me.ts) can detect and gate
  // on it.
  describe('impersonation marker (act claim)', () => {
    it('carries act when an impersonator id is passed', async () => {
      const target = await createUser();
      const admin = await createUser();

      const token = issueAccessToken(target.id, admin.id);
      const payload = verifyAccessToken(token);

      expect(payload.sub).toBe(target.id);
      expect(payload.act).toBe(admin.id);
    });

    it('omits act entirely for a plain (non-impersonated) token', async () => {
      const user = await createUser();

      const token = issueAccessToken(user.id);
      const payload = verifyAccessToken(token);

      expect(payload.act).toBeUndefined();
    });
  });

  describe('MFA pending token', () => {
    it('carries mfa_pending: true and a short TTL', () => {
      const token = issueMfaPendingToken(42);
      const payload = verifyAccessToken(token);
      expect(payload.sub).toBe(42);
      expect(payload.mfa_pending).toBe(true);
      expect(payload.exp - payload.iat).toBe(15 * 60);
    });

    it('a normal access token never carries mfa_pending', () => {
      const payload = verifyAccessToken(issueAccessToken(1));
      expect(payload.mfa_pending).toBeUndefined();
    });
  });
});
