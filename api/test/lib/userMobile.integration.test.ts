import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

/**
 * DB-touching regression test for the migration's backfill `UPDATE`
 * (`api/prisma/migrations/20260819170844_add_users_mobile/migration.sql`).
 *
 * `userMobile.test.ts` covers `computeUserMobile` (the JS priority rule) in
 * isolation with fixture objects - that's necessary but NOT sufficient here,
 * because it can never catch a divergence between the SQL backfill and the
 * JS function (the exact failure mode this migration is guarding against:
 * the one-time backfill and the ongoing write-time sync, from a later task,
 * must agree). This file is authoritative for "does the real SQL, run
 * against a real Postgres, produce the same answer as `computeUserMobile`
 * would for the same data" - it re-reads and executes the actual shipped
 * migration file's SQL verbatim (not a paraphrase of it) against seeded
 * `users`/`addresses` rows, so a future hand-edit to the SQL that silently
 * diverges from `computeUserMobile` fails here, not just in production data.
 *
 * Per repo convention (never edit a shipped migration), this migration file
 * itself must not change after this test starts asserting against it - if
 * the priority rule ever needs to change, that's a NEW migration file, and
 * this test should gain a sibling for it, not a rewrite of this one.
 */

const MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL('../../prisma/migrations/20260819170844_add_users_mobile/migration.sql', import.meta.url)),
  'utf8',
);

async function createAddress(
  userId: number,
  overrides: Partial<Parameters<typeof prisma.addresses.create>[0]['data']> = {},
): Promise<{ id: number }> {
  const now = new Date();
  return prisma.addresses.create({
    data: {
      addressable_id: userId,
      addressable_type: 'User',
      created_at: now,
      updated_at: now,
      ...overrides,
    },
  });
}

async function mobileOf(userId: number): Promise<string | null> {
  const user = await prisma.users.findUniqueOrThrow({ where: { id: userId } });
  return user.mobile;
}

beforeEach(async () => {
  await resetDb();
});

describe('users.mobile backfill migration SQL (run verbatim from the shipped file)', () => {
  it('picks the lowest-id private address mobile over a business address mobile', async () => {
    const user = await createUser();
    await createAddress(user.id, { type_of_address: 1, mobile: '0170 999', deleted: false });
    await createAddress(user.id, { type_of_address: 0, mobile: '0170 111', deleted: false });

    await prisma.$executeRawUnsafe(MIGRATION_SQL);

    expect(await mobileOf(user.id)).toBe('0170 111');
  });

  it('falls back to a business address mobile when the private address has a blank mobile', async () => {
    const user = await createUser();
    await createAddress(user.id, { type_of_address: 0, mobile: '   ', deleted: false });
    await createAddress(user.id, { type_of_address: 1, mobile: '0170 222', deleted: false });

    await prisma.$executeRawUnsafe(MIGRATION_SQL);

    expect(await mobileOf(user.id)).toBe('0170 222');
  });

  it('falls back to any other address type when neither private nor business has a mobile', async () => {
    const user = await createUser();
    await createAddress(user.id, { type_of_address: 0, mobile: null, deleted: false });
    await createAddress(user.id, { type_of_address: 1, mobile: null, deleted: false });
    await createAddress(user.id, { type_of_address: 2, mobile: '0170 333', deleted: false });

    await prisma.$executeRawUnsafe(MIGRATION_SQL);

    expect(await mobileOf(user.id)).toBe('0170 333');
  });

  it('leaves mobile NULL when no address has a usable mobile', async () => {
    const user = await createUser();
    await createAddress(user.id, { type_of_address: 0, mobile: null, deleted: false });

    await prisma.$executeRawUnsafe(MIGRATION_SQL);

    expect(await mobileOf(user.id)).toBeNull();
  });

  it('ignores a deleted private address, even though it would otherwise win', async () => {
    const user = await createUser();
    await createAddress(user.id, { type_of_address: 0, mobile: '0170 111', deleted: true });
    await createAddress(user.id, { type_of_address: 1, mobile: '0170 222', deleted: false });

    await prisma.$executeRawUnsafe(MIGRATION_SQL);

    expect(await mobileOf(user.id)).toBe('0170 222');
  });

  it('treats a NULL `deleted` column as not-deleted (nullable Boolean? column)', async () => {
    const user = await createUser();
    // deleted omitted entirely -> column default is NULL, not false.
    await createAddress(user.id, { type_of_address: 0, mobile: '0170 111' });

    await prisma.$executeRawUnsafe(MIGRATION_SQL);

    expect(await mobileOf(user.id)).toBe('0170 111');
  });

  it('ignores Seeker-typed addresses entirely, even with a usable mobile', async () => {
    const user = await createUser();
    await createAddress(user.id, {
      addressable_type: 'Seeker',
      addressable_id: 999_999,
      type_of_address: 0,
      mobile: '0170 444',
      deleted: false,
    });

    await prisma.$executeRawUnsafe(MIGRATION_SQL);

    expect(await mobileOf(user.id)).toBeNull();
  });

  it('is idempotent - running it twice does not change the already-backfilled result', async () => {
    const user = await createUser();
    await createAddress(user.id, { type_of_address: 0, mobile: '0170 111', deleted: false });

    await prisma.$executeRawUnsafe(MIGRATION_SQL);
    await prisma.$executeRawUnsafe(MIGRATION_SQL);

    expect(await mobileOf(user.id)).toBe('0170 111');
  });
});
