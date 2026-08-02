import { prisma } from '../../src/db.js';

// Migration bookkeeping tables - `_prisma_migrations` is Prisma's own ledger
// (`prisma migrate deploy` reads it to know what's already applied);
// `schema_migrations`/`ar_internal_metadata` are the pre-port Rails
// equivalents, kept as real Prisma models for historical data but likewise
// not test fixture data. Truncating any of these would make `migrate deploy`
// (or a stale historical assumption) think migrations need reapplying against
// tables that already exist, and error out. Every other table is fair game
// to reset between tests.
//
// This matters more than it used to: the old dmmf-driven table list only
// ever enumerated tables declared as Prisma `model`s, so `_prisma_migrations`
// (never modeled) was implicitly excluded "for free." pg_tables enumerates
// every real table in the schema, `_prisma_migrations` included - omitting
// it here would silently wipe Prisma's own migration history on the first
// resetDb() call.
const EXCLUDED_TABLES = new Set(['_prisma_migrations', 'schema_migrations', 'ar_internal_metadata']);

// Prisma's new (v7) `prisma-client` generator no longer exposes `Prisma.dmmf`
// (see Prisma's own "missing DMMF in prisma-client generated output" issue -
// it was never meant to be a stable public API). pg_tables is the
// replacement: it introspects the real database instead of the generated
// client, which is arguably more correct here anyway - this list only ever
// needs to match what's actually in Postgres.
async function resettableTableNames(): Promise<string[]> {
  const rows = await prisma.$queryRaw<
    { tablename: string }[]
  >`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
  return rows.map((row) => row.tablename).filter((name) => !EXCLUDED_TABLES.has(name));
}

/**
 * Truncates every app-data table (RESTART IDENTITY CASCADE) so each test
 * starts from a clean slate. Table list is introspected from Postgres itself
 * rather than hardcoded, so it stays correct as schema.prisma grows. Intended
 * for use in a `beforeEach` - safe to call repeatedly.
 */
export async function resetDb(): Promise<void> {
  const tables = (await resettableTableNames()).map((name) => `"${name}"`).join(', ');

  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
}
