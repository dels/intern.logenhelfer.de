import { beforeEach, describe, expect, it } from 'vitest';
import { generateBackupCodes, consumeBackupCode } from '../../src/lib/mfaBackupCodes.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

describe('mfaBackupCodes', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('generates 10 unique plaintext codes', async () => {
    const user = await createUser();
    const codes = await generateBackupCodes(user.id);
    expect(codes).toHaveLength(10);
    expect(new Set(codes).size).toBe(10);
  });

  it('accepts a valid code exactly once', async () => {
    const user = await createUser();
    const [code] = await generateBackupCodes(user.id);
    expect(await consumeBackupCode(user.id, code!)).toBe(true);
    expect(await consumeBackupCode(user.id, code!)).toBe(false);
  });

  it('rejects an unknown code', async () => {
    const user = await createUser();
    await generateBackupCodes(user.id);
    expect(await consumeBackupCode(user.id, 'not-a-real-code')).toBe(false);
  });

  it('regeneration invalidates all previous codes', async () => {
    const user = await createUser();
    const [firstCode] = await generateBackupCodes(user.id);
    await generateBackupCodes(user.id);
    expect(await consumeBackupCode(user.id, firstCode!)).toBe(false);
    const remaining = await prisma.mfa_backup_codes.count({ where: { user_id: user.id } });
    expect(remaining).toBe(10);
  });
});
