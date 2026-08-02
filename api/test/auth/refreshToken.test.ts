import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  RefreshTokenInvalidError,
  RefreshTokenReuseError,
  issueRefreshToken,
  rotateRefreshToken,
} from '../../src/auth/refreshToken.js';
import { prisma } from '../../src/db.js';
import { createUser } from '../helpers/factories.js';
import { resetDb } from '../helpers/db.js';

// Port of rails-app/spec/models/refresh_token_spec.rb (3 examples).
describe('refresh token', () => {
  beforeEach(async () => {
    await resetDb();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('issues and rotates within a family', async () => {
    const user = await createUser();
    const { rawToken, record } = await issueRefreshToken(user.id);

    const { rawToken: newRawToken, user: rotatedUser } = await rotateRefreshToken(rawToken);

    expect(rotatedUser.id).toBe(user.id);
    expect(newRawToken).not.toBe(rawToken);
    const count = await prisma.refresh_tokens.count({ where: { family_id: record.family_id } });
    expect(count).toBe(2);
  });

  it('revokes the whole family when a consumed token is replayed', async () => {
    const user = await createUser();
    const { rawToken, record } = await issueRefreshToken(user.id);
    await rotateRefreshToken(rawToken);

    await expect(rotateRefreshToken(rawToken)).rejects.toThrow(RefreshTokenReuseError);

    const revokedCount = await prisma.refresh_tokens.count({
      where: { family_id: record.family_id, revoked_at: { not: null } },
    });
    expect(revokedCount).toBe(2);
  });

  it('rejects unknown and expired tokens', async () => {
    await expect(rotateRefreshToken('unknown')).rejects.toThrow(RefreshTokenInvalidError);

    const user = await createUser();
    const t0 = Date.now();
    const { rawToken } = await issueRefreshToken(user.id);

    // Date-only fake timers, same reasoning as jwt.test.ts - Prisma's async
    // query engine needs real setTimeout/setInterval to resolve.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(t0 + 31 * 24 * 60 * 60 * 1000);

    await expect(rotateRefreshToken(rawToken)).rejects.toThrow(RefreshTokenInvalidError);
  });

  it('lets only one of two concurrent rotations of the same token win, treating the loser as reuse', async () => {
    const user = await createUser();
    const { rawToken, record } = await issueRefreshToken(user.id);

    const results = await Promise.allSettled([rotateRefreshToken(rawToken), rotateRefreshToken(rawToken)]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(RefreshTokenReuseError);

    // Reuse detection revokes at least the original token deterministically
    // (this holds regardless of interleaving, since only one caller can ever
    // win the atomic consume). Whether the winner's freshly-issued next
    // token also ends up revoked depends on whether that issuance commits
    // before or after the loser's revokeFamily call - not asserted here, see
    // rotateRefreshToken's own comment for that residual ordering window.
    const revokedCount = await prisma.refresh_tokens.count({
      where: { family_id: record.family_id, revoked_at: { not: null } },
    });
    expect(revokedCount).toBeGreaterThanOrEqual(1);
  });
});
