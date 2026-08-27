import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../src/db.js';
import { computeUserMobile } from '../../src/lib/userMobile.js';
import type { MobileCandidateAddress } from '../../src/lib/userMobile.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

/**
 * DB-touching regression test for the migration's backfill `UPDATE`
 * (`api/prisma/migrations/20260819170844_add_users_mobile/migration.sql`).
 *
 * `userMobile.test.ts` covers `computeUserMobile` (the JS priority rule) in
 * isolation with fixture objects - that's necessary but NOT sufficient here,
 * because most of the cases below only assert a hardcoded expectation
 * against the SQL's output, which can't catch a divergence between the SQL
 * backfill and the JS function unless the two independently-written
 * expectations happen to both be wrong the same way. The "SQL and JS
 * actually agree" property (the exact failure mode this migration is
 * guarding against: the one-time backfill and the ongoing write-time sync,
 * from a later task, must agree) is only genuinely exercised by the
 * `expect(await mobileOf(...)).toBe(computeUserMobile(...))` differential
 * test below - that's the one that would have caught the
 * `trim()`-vs-`String.prototype.trim()` whitespace divergence found in
 * review (Postgres `trim()` only strips ASCII space; JS's `.trim()` strips
 * all Unicode whitespace, including tabs/newlines). This file re-reads and
 * executes the actual shipped migration file's SQL verbatim (not a
 * paraphrase of it) against seeded `users`/`addresses` rows, so a future
 * hand-edit to the SQL that silently diverges from `computeUserMobile`
 * fails here, not just in production data.
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
    // The column default is `false`, not NULL - a plain insert omitting
    // `deleted` (as elsewhere in this file) would exercise the `= false`
    // branch, not the NULL one. Force an actual NULL via a raw UPDATE so
    // this test genuinely exercises the SQL's `COALESCE(a.deleted, false)`
    // path.
    const address = await createAddress(user.id, { type_of_address: 0, mobile: '0170 111', deleted: false });
    await prisma.$executeRawUnsafe(`UPDATE "addresses" SET "deleted" = NULL WHERE id = $1`, address.id);

    await prisma.$executeRawUnsafe(MIGRATION_SQL);

    expect(await mobileOf(user.id)).toBe('0170 111');
  });

  it('agrees with computeUserMobile for a mobile that is only a tab/newline (Unicode-whitespace divergence)', async () => {
    // Postgres's `trim()` only strips ASCII space; JS's
    // `String.prototype.trim()` (used by `isPresent`/`computeUserMobile`)
    // strips all Unicode whitespace, including tabs and newlines. A mobile
    // value that's only a tab/newline must be scored "absent" by both the
    // SQL backfill and the JS sync, or the two silently disagree - this is
    // a genuine differential assertion (SQL result compared directly
    // against `computeUserMobile`'s own output for the equivalent fixture),
    // not two independently-hardcoded expectations.
    const user = await createUser();
    const whitespaceOnlyAddress = await createAddress(user.id, {
      type_of_address: 0,
      mobile: '\t\n  ',
      deleted: false,
    });
    const fallbackAddress = await createAddress(user.id, { type_of_address: 1, mobile: '0170 555', deleted: false });

    await prisma.$executeRawUnsafe(MIGRATION_SQL);

    const equivalentFixture: MobileCandidateAddress[] = [
      { id: whitespaceOnlyAddress.id, type_of_address: 0, mobile: '\t\n  ', deleted: false },
      { id: fallbackAddress.id, type_of_address: 1, mobile: '0170 555', deleted: false },
    ];

    expect(await mobileOf(user.id)).toBe(computeUserMobile(equivalentFixture));
    expect(await mobileOf(user.id)).toBe('0170 555');
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
