import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import bcrypt from 'bcryptjs';
import { config as loadDotenv } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client.js';
import { SEED_USERS } from './fixtures.js';

// api has no .env of its own - it shares the repo-root .env, same convention
// as test/setup.ts (vitest) and playwright.config.ts (this suite's
// webServer). Playwright runs globalSetup as its own one-off Node process
// (separate from the webServer child processes it also starts), so it needs
// this loaded again here rather than inheriting it from anywhere else.
const rootEnvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env');
loadDotenv({ path: rootEnvPath });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

// A dedicated PrismaClient for the setup step. Deliberately NOT
// `../src/db.ts`'s singleton - that module stashes itself on `globalThis` for
// `tsx watch` hot-reload reuse (see its own comment), a concern that doesn't
// apply here: this process runs once, seeds, and exits, so a plain
// short-lived client with an explicit $disconnect() at the end is simpler and
// avoids any accidental cross-process assumption about a shared instance.
const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

// Mirrors test/helpers/db.ts's resetDb() (pg_tables-driven TRUNCATE of every
// app-data table except migration bookkeeping tables, `_prisma_migrations`
// included - see that file's EXCLUDED_TABLES comment for why that one in
// particular matters now) - reimplemented here directly via Prisma rather
// than importing test/helpers/db.ts, per this task's file boundaries
// (api/test/** is off limits) and because a real e2e run has no business
// depending on the vitest suite's private test helpers. Queries pg_tables
// directly rather than Prisma's DMMF - the new (v7) `prisma-client`
// generator no longer exposes `Prisma.dmmf` (it was never meant to be a
// stable public API).
const EXCLUDED_TABLES = new Set(['_prisma_migrations', 'schema_migrations', 'ar_internal_metadata']);

async function resettableTableNames(): Promise<string[]> {
  const rows = await prisma.$queryRaw<
    { tablename: string }[]
  >`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
  return rows.map((row) => row.tablename).filter((name) => !EXCLUDED_TABLES.has(name));
}

async function resetDb(): Promise<void> {
  const tables = (await resettableTableNames()).map((name) => `"${name}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
}

// Low bcrypt cost purely for seed-script speed - same rationale/constant as
// api/test/routes/session.test.ts's TEST_BCRYPT_COST (format, not cost,
// is what matters for a real bcrypt hash to work against the real
// bcrypt.compare() call in src/routes/session.ts).
const SEED_BCRYPT_COST = 4;

async function ensureRole(name: string): Promise<{ id: number }> {
  const existing = await prisma.roles.findFirst({ where: { name } });
  if (existing) {
    return existing;
  }
  const now = new Date();
  return prisma.roles.create({
    data: { name, display_name: name, created_at: now, updated_at: now },
  });
}

async function createSeedUser(email: string, password: string, roleName: string): Promise<void> {
  const now = new Date();
  const role = await ensureRole(roleName);
  const user = await prisma.users.create({
    data: {
      email,
      // Real production users always get one via the Rails port's
      // `before_create :generate_uuid` (see seedFrontendE2e.ts's identical
      // port) - this fixture never had, since no test before this task's
      // MFA additions ever dereferenced a seed user's own uuid
      // (GET /api/v1/members/:uuid/mfa/reset needs a real one; a null uuid
      // coalesces to '' in me.ts's authJsonFor, which 404s as an empty
      // path segment). No collision-retry loop like seedFrontendE2e.ts's -
      // three users, once per full-suite run, isn't worth the extra code.
      uuid: randomUUID(),
      encrypted_password: bcrypt.hashSync(password, SEED_BCRYPT_COST),
      firstname: 'E2E',
      lastname: roleName,
      // src/routes/statistics.ts's age() helper explicitly documents that it
      // assumes every undeleted user has a non-null date_of_birth (a
      // NOT-NULL-validated column at the Rails model layer, which this
      // Prisma-backed port doesn't re-enforce at the DB layer) - discovered
      // by running securityBoundaries.spec.ts's statistics admin case
      // against a seed user with no date_of_birth, which threw
      // (`Cannot read properties of null (reading 'getUTCFullYear')`).
      // Setting one here keeps this fixture honoring that same invariant
      // real production data always satisfies, rather than exercising an
      // edge case the app was never designed to handle.
      date_of_birth: new Date('1990-01-01'),
      created_at: now,
      updated_at: now,
    },
  });
  await prisma.user_roles.create({
    data: { user_id: user.id, role_id: role.id, created_at: now, updated_at: now, role_added_at: now },
  });
}

/**
 * Playwright's `globalSetup` entry point - runs once before the whole e2e
 * suite (and before/independently of the webServer health checks; neither
 * depends on the other's completion, only on both finishing before any test
 * file runs). Resets the shared local Postgres to a clean slate, then seeds
 * exactly the fixed users every spec file logs into over real HTTP (see
 * fixtures.ts) - a plain EnteredApprentice member, an Admin (satisfies every
 * admin-gated ability check), and a UserAdmin.
 */
export default async function globalSetup(): Promise<void> {
  await resetDb();

  await createSeedUser(SEED_USERS.member.email, SEED_USERS.member.password, SEED_USERS.member.roleName);
  await createSeedUser(SEED_USERS.admin.email, SEED_USERS.admin.password, SEED_USERS.admin.roleName);
  await createSeedUser(SEED_USERS.userAdmin.email, SEED_USERS.userAdmin.password, SEED_USERS.userAdmin.roleName);

  await prisma.$disconnect();
}
