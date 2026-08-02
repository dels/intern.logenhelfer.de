import { beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../src/db.js';
import { resetDb } from './db.js';

// Regression coverage for resetDb()'s table-list source: Prisma v7's
// `prisma-client` generator dropped `Prisma.dmmf` (never a stable public
// API), so this now introspects pg_tables directly instead. That's a real
// behavior change, not just a mechanical swap: the old dmmf-driven list only
// ever enumerated Prisma `model`s, so `_prisma_migrations` (Prisma's own
// migration ledger, never modeled) was implicitly excluded "for free";
// pg_tables enumerates every real table, so it has to be excluded
// explicitly now - this asserts that it actually is, not just "resetDb()
// doesn't throw".
async function prismaMigrationsCount(): Promise<number> {
  const rows = await prisma.$queryRaw<{ count: number }[]>`SELECT count(*)::int AS count FROM "_prisma_migrations"`;
  return rows[0]?.count ?? 0;
}

describe('resetDb', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('truncates app-data tables (resetting their id sequence) while leaving migration bookkeeping tables untouched', async () => {
    const now = new Date();
    await prisma.roles.create({
      data: { name: 'reset-db-test', display_name: 'Reset Db Test', created_at: now, updated_at: now },
    });

    // `_prisma_migrations` is guaranteed non-empty by design - a real
    // `prisma migrate deploy` always runs before any test suite does (see
    // bin/test-gate). `ar_internal_metadata`, by contrast, is a vestigial
    // pre-port Rails table with no guaranteed seed data of its own (whether
    // it happens to already hold a row depends on incidental state, not
    // anything resetDb() controls) - seeding a canary row here directly
    // makes that half of the assertion self-contained instead of resting on
    // ambient DB state that turned out not to be reliable.
    const migrationRowsBefore = await prismaMigrationsCount();
    expect(migrationRowsBefore).toBeGreaterThan(0);
    await prisma.ar_internal_metadata.create({
      data: { key: 'reset-db-test-canary', value: 'present', created_at: now, updated_at: now },
    });

    await resetDb();

    expect(await prisma.roles.count()).toBe(0);
    expect(await prismaMigrationsCount()).toBe(migrationRowsBefore);
    await expect(prisma.ar_internal_metadata.findUnique({ where: { key: 'reset-db-test-canary' } })).resolves.not.toBeNull();

    const nextRole = await prisma.roles.create({
      data: { name: 'reset-db-test-2', display_name: 'Reset Db Test 2', created_at: now, updated_at: now },
    });
    expect(nextRole.id).toBe(1);
  });
});
