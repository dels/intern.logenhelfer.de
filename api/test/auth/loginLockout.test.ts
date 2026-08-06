import { beforeEach, describe, expect, it } from 'vitest';
import { isLockedOut, recordFailedLogin, resetLoginLockout } from '../../src/auth/loginLockout.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';

describe('loginLockout', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('is not locked out with no prior failures', async () => {
    expect(await isLockedOut('user@example.com')).toBe(false);
  });

  it('reports lockedOut: false for each of the first 4 failures', async () => {
    for (let i = 0; i < 4; i++) {
      const result = await recordFailedLogin('user@example.com');
      expect(result.lockedOut).toBe(false);
    }
    expect(await isLockedOut('user@example.com')).toBe(false);
  });

  it('reports lockedOut: true on the 5th consecutive failure, and locks the account', async () => {
    for (let i = 0; i < 4; i++) {
      await recordFailedLogin('user@example.com');
    }
    const result = await recordFailedLogin('user@example.com');
    expect(result.lockedOut).toBe(true);
    expect(await isLockedOut('user@example.com')).toBe(true);
  });

  it('resets the lockout on success', async () => {
    for (let i = 0; i < 5; i++) {
      await recordFailedLogin('user@example.com');
    }
    await resetLoginLockout('user@example.com');
    expect(await isLockedOut('user@example.com')).toBe(false);
    const row = await prisma.login_lockouts.findUnique({ where: { email: 'user@example.com' } });
    expect(row?.failed_count).toBe(0);
  });

  it('tracks separate emails independently', async () => {
    for (let i = 0; i < 5; i++) {
      await recordFailedLogin('victim@example.com');
    }
    expect(await isLockedOut('victim@example.com')).toBe(true);
    expect(await isLockedOut('someone-else@example.com')).toBe(false);
  });
});
