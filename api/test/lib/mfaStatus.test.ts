import { beforeEach, describe, expect, it } from 'vitest';
import { getUserMfaMethods, userHasVerifiedMfa } from '../../src/lib/mfaStatus.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

describe('mfaStatus', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('returns no methods and false for a fresh user', async () => {
    const user = await createUser();
    expect(await getUserMfaMethods(user.id)).toEqual([]);
    expect(await userHasVerifiedMfa(user.id)).toBe(false);
  });

  it('ignores an unverified TOTP credential', async () => {
    const user = await createUser();
    await prisma.mfa_totp_credentials.create({
      data: { user_id: user.id, encrypted_secret: 'x', created_at: new Date(), updated_at: new Date(), verified_at: null },
    });
    expect(await userHasVerifiedMfa(user.id)).toBe(false);
  });

  it('lists a verified TOTP credential', async () => {
    const user = await createUser();
    await prisma.mfa_totp_credentials.create({
      data: { user_id: user.id, encrypted_secret: 'x', created_at: new Date(), updated_at: new Date(), verified_at: new Date() },
    });
    expect(await getUserMfaMethods(user.id)).toEqual(['totp']);
    expect(await userHasVerifiedMfa(user.id)).toBe(true);
  });

  it('lists multiple verified methods', async () => {
    const user = await createUser();
    await prisma.mfa_totp_credentials.create({
      data: { user_id: user.id, encrypted_secret: 'x', created_at: new Date(), updated_at: new Date(), verified_at: new Date() },
    });
    await prisma.mfa_passkey_credentials.create({
      data: { user_id: user.id, credential_id: 'cred-1', public_key: 'pk', name: 'Laptop', created_at: new Date(), updated_at: new Date() },
    });
    expect(await getUserMfaMethods(user.id)).toEqual(expect.arrayContaining(['totp', 'passkey']));
  });
});
