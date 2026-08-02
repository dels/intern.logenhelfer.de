import { beforeEach, describe, expect, it } from 'vitest';

import { isDeviceTrusted, issueTrustedDeviceToken } from '../../src/auth/deviceTrust.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

describe('deviceTrust', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('is not trusted with no token', async () => {
    const user = await createUser();
    expect(await isDeviceTrusted(user.id, undefined)).toBe(false);
  });

  it('is trusted after issuing a token, for the right user only', async () => {
    const user = await createUser();
    const other = await createUser({ email: 'other@example.de' });
    const raw = await issueTrustedDeviceToken(user.id, { headers: {}, ip: '127.0.0.1' } as never, 30);
    expect(await isDeviceTrusted(user.id, raw)).toBe(true);
    expect(await isDeviceTrusted(other.id, raw)).toBe(false);
  });

  it('is not trusted once expired', async () => {
    const user = await createUser();
    const raw = await issueTrustedDeviceToken(user.id, { headers: {}, ip: '127.0.0.1' } as never, 30);
    await prisma.mfa_trusted_devices.updateMany({ where: { user_id: user.id }, data: { expires_at: new Date(Date.now() - 1000) } });
    expect(await isDeviceTrusted(user.id, raw)).toBe(false);
  });
});
