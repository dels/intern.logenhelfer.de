import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isMfaLockedOut, recordFailedMfaAttempt, resetMfaLockout } from '../../src/auth/mfaLockout.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';

describe('mfaLockout', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('is not locked out with no prior failures', async () => {
    expect(await isMfaLockedOut('user@example.com')).toBe(false);
  });

  it('locks out after 5 consecutive failures', async () => {
    for (let i = 0; i < 5; i++) {
      await recordFailedMfaAttempt('user@example.com');
    }
    expect(await isMfaLockedOut('user@example.com')).toBe(true);
  });

  it('resets the lockout on success', async () => {
    for (let i = 0; i < 5; i++) {
      await recordFailedMfaAttempt('user@example.com');
    }
    await resetMfaLockout('user@example.com');
    expect(await isMfaLockedOut('user@example.com')).toBe(false);
    const row = await prisma.mfa_lockouts.findUnique({ where: { subject_key: 'user@example.com' } });
    expect(row?.failed_count).toBe(0);
  });

  it('tracks separate subject keys independently', async () => {
    for (let i = 0; i < 5; i++) {
      await recordFailedMfaAttempt('credential-abc');
    }
    expect(await isMfaLockedOut('credential-abc')).toBe(true);
    expect(await isMfaLockedOut('credential-xyz')).toBe(false);
  });

  it('reports lockedOut: false for each of the first 4 failures, true on the 5th', async () => {
    for (let i = 0; i < 4; i++) {
      const result = await recordFailedMfaAttempt('user2@example.com');
      expect(result.lockedOut).toBe(false);
    }
    const fifth = await recordFailedMfaAttempt('user2@example.com');
    expect(fifth.lockedOut).toBe(true);
  });
});
