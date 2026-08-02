import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import bcrypt from 'bcryptjs';
import { config as loadDotenv } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from '../src/generated/prisma/client.js';

/**
 * Port of rails-app/lib/tasks/e2e.rake's `e2e:seed` task - seeds the exact
 * same fixture data (fixed emails/roles/District/Event/AppConfig) the
 * *frontend* Playwright suite (`app/e2e/*.spec.ts`) logs into over real HTTP.
 *
 * Deliberately separate from `global-setup.ts`/`fixtures.ts` in this same
 * directory - those seed a much smaller, differently-shaped fixture set for
 * `api/e2e`'s OWN suite (one member/admin/userAdmin, distinct `@example.test`
 * emails). This script's fixture shape is dictated by `app/e2e/*.spec.ts`
 * instead (distinct `@example.org` emails, five users, a District, an Event,
 * two AppConfig keys) and is not meant to be shared with that other suite.
 *
 * Unlike the Rails rake task (which is purely additive via
 * `find_or_create_by!`/`find_or_initialize_by`, never dropping pre-existing
 * rows), this script truncates the whole schema first - same
 * pg_tables-driven approach as `global-setup.ts`'s `resetDb()` - then
 * seeds fresh. That keeps a second run idempotent (matches the rake task's
 * own idempotency intent) without having to hand-replicate `find_or_*`
 * semantics for every table, and is safe here because the only DB this ever
 * runs against is the disposable ephemeral stack `bin/test-gate` spins up
 * for the e2e step (torn down with `docker compose down -v` regardless of
 * outcome) - never a real deploy target.
 */

// api has no .env of its own - it shares the repo-root .env, same convention
// as global-setup.ts/test/setup.ts/playwright.config.ts.
const rootEnvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env');
loadDotenv({ path: rootEnvPath });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

// A dedicated PrismaClient for this one-off seed run, same rationale as
// global-setup.ts: this process runs once and exits, so a plain short-lived
// client with an explicit $disconnect() at the end is simpler than reusing
// ../src/db.ts's hot-reload-safe singleton.
const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

// Mirrors global-setup.ts's resetDb() - a pg_tables-driven TRUNCATE of every
// app-data table except migration bookkeeping tables, `_prisma_migrations`
// included - see test/helpers/db.ts's EXCLUDED_TABLES comment for why that
// one in particular matters now. Reimplemented here directly (rather than
// imported) per this task's file boundaries (global-setup.ts/fixtures.ts are
// api/e2e's own suite, out of scope for this frontend-fixture script) and
// because duplicating ~10 lines beats introducing a cross-suite dependency
// between two otherwise-unrelated seed scripts. Queries pg_tables directly
// rather than Prisma's DMMF - the new (v7) `prisma-client` generator no
// longer exposes `Prisma.dmmf` (it was never meant to be a stable public
// API).
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

// Low bcrypt cost purely for seed-script speed (same rationale/constant as
// global-setup.ts's SEED_BCRYPT_COST / api/test/routes/session.test.ts's
// TEST_BCRYPT_COST) - format, not cost, is what matters for the real
// bcrypt.compare() call in src/routes/session.ts to succeed at login.
const SEED_BCRYPT_COST = 4;

// The one fixed password every seeded user shares - see rails-app/lib/tasks/e2e.rake.
const PASSWORD = 'e2e-Passw0rd!';

function yearsAgo(years: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear() - years, now.getUTCMonth(), now.getUTCDate()));
}

function daysFromNow(days: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days));
}

/** `@db.Time` columns store a UTC-epoch (1970-01-01) Date - see api/src/routes/events.ts's parseTimeInput. */
function timeOfDay(hh: number, mm: number): Date {
  return new Date(Date.UTC(1970, 0, 1, hh, mm, 0));
}

const DATE_OF_BIRTH = yearsAgo(30);

/**
 * Historically every seeded user got the same literal `matriculation_number`
 * (a byte-identical port of the Rails rake task's `'E2E-1'.to_i == 0`
 * coercion quirk - see git history). That's no longer possible: `users`
 * now has a DB-level unique index on this column (added alongside the
 * matriculation-number uniqueness feature), so five users sharing the value
 * `0` fails the seed outright with a P2002. `null` is the correct
 * replacement, not a distinct-per-user placeholder number - Postgres treats
 * multiple `NULL`s as distinct under a unique index, and no spec in
 * app/e2e asserts this column's value either way, so there's nothing to
 * preserve by inventing fake distinct numbers.
 */
const MATRICULATION_NUMBER = null;

/**
 * Port of Role.find_or_create_by!(name: ...) { |r| r.display_name = ... }.
 * `administrational_role` defaults to `true` at the DB level (matches every
 * degree/admin-grant role - EnteredApprentice, UserAdmin, etc.) - pass
 * `false` for the "position" roles (rails-app/db/seeds.rb's WorshipfulMaster,
 * Secretary, Treasurer, ...) that MemberForm's/OfficerForm's "positions"
 * Autocomplete (`useRoles('positions')`) actually lists; without at least one
 * such role seeded, that dropdown has no options and officer/position-
 * assignment e2e flows can't select anything.
 */
async function ensureRole(name: string, displayName: string, administrationalRole = true): Promise<{ id: number }> {
  const existing = await prisma.roles.findFirst({ where: { name } });
  if (existing) {
    return existing;
  }
  const now = new Date();
  return prisma.roles.create({
    data: { name, display_name: displayName, administrational_role: administrationalRole, created_at: now, updated_at: now },
  });
}

interface SeedUserSpec {
  email: string;
  firstname: string;
  lastname: string;
  matriculationNumber: number | null;
  acceptedGdpr?: boolean;
}

/** Port of the `User.find_or_initialize_by(...); ...; user.save(validate: false)` blocks. */
async function ensureUser(spec: SeedUserSpec): Promise<{ id: number }> {
  const now = new Date();
  const encryptedPassword = bcrypt.hashSync(PASSWORD, SEED_BCRYPT_COST);
  const existing = await prisma.users.findFirst({ where: { email: spec.email } });
  if (existing) {
    return prisma.users.update({
      where: { id: existing.id },
      data: {
        firstname: spec.firstname,
        lastname: spec.lastname,
        date_of_birth: DATE_OF_BIRTH,
        matriculation_number: spec.matriculationNumber,
        encrypted_password: encryptedPassword,
        accepted_gdpr: spec.acceptedGdpr ?? false,
        updated_at: now,
      },
    });
  }
  // Port of User's `before_create :generate_uuid` (UuidHelper#generate_uuid) -
  // a fresh random UUID, unique among existing rows.
  let uuid = randomUUID();
  while (await prisma.users.findFirst({ where: { uuid } })) {
    uuid = randomUUID();
  }
  return prisma.users.create({
    data: {
      email: spec.email,
      encrypted_password: encryptedPassword,
      firstname: spec.firstname,
      lastname: spec.lastname,
      date_of_birth: DATE_OF_BIRTH,
      matriculation_number: spec.matriculationNumber,
      // Rails' DB default (`t.boolean "accepted_gdpr", default: false`) -
      // the original rake task never set this true for anyone. This port
      // deliberately diverges: the app-wide GDPR gate (app/src/layouts
      // /AppShell.tsx's gdprGateActive) now blocks every route for a
      // gdpr-unaccepted, non-impersonating user, not just the dashboard's
      // announcements widget - so every "worker" fixture this suite
      // repeatedly logs in as (below: e2e@example.org, e2e-admin@example.org,
      // e2e-strict-admin@example.org, e2e-council@example.org) passes
      // `acceptedGdpr: true` explicitly, or the entire app/e2e suite would
      // regress to only ever seeing the gate. e2e-gdpr@example.org is the
      // one fixture deliberately left pending, dedicated to exercising the
      // gate itself (see app/e2e/dashboard.spec.ts).
      accepted_gdpr: spec.acceptedGdpr ?? false,
      uuid,
      created_at: now,
      updated_at: now,
    },
  });
}

/** Port of `user.roles << role unless user.roles.include?(role)`. */
async function ensureUserHasRole(userId: number, roleId: number, roleAddedAt?: Date): Promise<void> {
  const existing = await prisma.user_roles.findFirst({ where: { user_id: userId, role_id: roleId } });
  if (existing) {
    if (roleAddedAt && !existing.role_added_at) {
      await prisma.user_roles.update({ where: { id: existing.id }, data: { role_added_at: roleAddedAt } });
    }
    return;
  }
  const now = new Date();
  await prisma.user_roles.create({
    data: {
      user_id: userId,
      role_id: roleId,
      role_added_at: roleAddedAt ?? null,
      created_at: now,
      updated_at: now,
    },
  });
}

async function setAppConfig(key: string, value: string): Promise<void> {
  // Port of AppConfig[]= (app_config.rb) / api/src/lib/appConfig.ts's
  // fullKey() - keys are namespaced by environment exactly like Rails
  // prefixes by `Rails.env`. Reimplemented directly against
  // `app_config_adapters` (rather than importing api/src/lib/appConfig.ts)
  // to avoid pulling in that module's `../db.js` long-lived Prisma
  // singleton into this short-lived script - see the header comment on
  // `prisma` above for why a dedicated client with an explicit
  // `$disconnect()` is preferred here.
  const fullKey = `${process.env.NODE_ENV ?? 'development'}_${key}`;
  const existing = await prisma.app_config_adapters.findFirst({ where: { key: fullKey } });
  if (existing) {
    await prisma.app_config_adapters.update({ where: { id: existing.id }, data: { value } });
  } else {
    await prisma.app_config_adapters.create({ data: { key: fullKey, value } });
  }
}

/**
 * Seeds the fixed e2e fixture data every `app/e2e/*.spec.ts` file logs into
 * / relies on over real HTTP. Mirrors rails-app/lib/tasks/e2e.rake 1:1 (see
 * that file's comments for the *why* behind each shape decision - not
 * repeated here).
 */
export async function seedFrontendE2e(): Promise<void> {
  await resetDb();

  const enteredApprenticeRole = await ensureRole('EnteredApprentice', 'Lehrling');

  const user = await ensureUser({
    email: 'e2e@example.org',
    firstname: 'E2E',
    lastname: 'Tester',
    matriculationNumber: MATRICULATION_NUMBER,
    acceptedGdpr: true,
  });
  await ensureUserHasRole(user.id, enteredApprenticeRole.id);
  // User#entered_apprentice_since reads UserRole#role_added_at for the
  // EnteredApprentice role - see rails-app/lib/tasks/e2e.rake's comment.
  // Explicitly backdated 5 years, same as the rake task.
  await prisma.user_roles.updateMany({
    where: { user_id: user.id, role_id: enteredApprenticeRole.id },
    data: { role_added_at: yearsAgo(5) },
  });
  console.log('seeded e2e@example.org');

  const workingPlanAdminRole = await ensureRole('WorkingPlanAdmin', 'Kann Arbeitsplan bearbeiten');
  const userAdminRole = await ensureRole('UserAdmin', 'Mitgliederverwaltung');
  const worshipfulMasterRole = await ensureRole('WorshipfulMaster', 'Meister vom Stuhl', false);
  // Not granted to any user - member-management-increment-1.spec.ts only
  // needs this to exist as a selectable position (Role.positions:
  // administrational_role: false) in a member's "Ämter" dropdown.
  await ensureRole('SeniorWarden', '1. Aufseher', false);
  const applicationAdminRole = await ensureRole('ApplicationAdmin', 'Kann Anwendung konfigurieren');
  const netDelegateRole = await ensureRole('NetDelegate', 'Internet-Beauftragter');

  const admin = await ensureUser({
    email: 'e2e-admin@example.org',
    firstname: 'E2E',
    lastname: 'Admin',
    matriculationNumber: MATRICULATION_NUMBER,
    acceptedGdpr: true,
  });
  await ensureUserHasRole(admin.id, workingPlanAdminRole.id);
  await ensureUserHasRole(admin.id, userAdminRole.id);
  await ensureUserHasRole(admin.id, worshipfulMasterRole.id);
  await ensureUserHasRole(admin.id, applicationAdminRole.id);
  await ensureUserHasRole(admin.id, netDelegateRole.id);
  console.log('seeded e2e-admin@example.org');

  const strictAdminRole = await ensureRole('Admin', 'Administrator');
  const strictAdmin = await ensureUser({
    email: 'e2e-strict-admin@example.org',
    firstname: 'E2E',
    lastname: 'StrictAdmin',
    matriculationNumber: MATRICULATION_NUMBER,
    acceptedGdpr: true,
  });
  await ensureUserHasRole(strictAdmin.id, strictAdminRole.id);
  console.log('seeded e2e-strict-admin@example.org');

  const councilRole = await ensureRole('MemberOfCouncil', 'Mitglieder des Beamtenrates');
  const councilMember = await ensureUser({
    email: 'e2e-council@example.org',
    firstname: 'E2E',
    lastname: 'Council',
    matriculationNumber: MATRICULATION_NUMBER,
    acceptedGdpr: true,
  });
  await ensureUserHasRole(councilMember.id, enteredApprenticeRole.id);
  await ensureUserHasRole(councilMember.id, councilRole.id);
  console.log('seeded e2e-council@example.org');

  const now = new Date();
  const existingDistrict = await prisma.districts.findFirst({ where: { name: 'E2E-Distrikt' } });
  if (!existingDistrict) {
    await prisma.districts.create({ data: { name: 'E2E-Distrikt', created_at: now, updated_at: now } });
  }
  console.log('seeded E2E-Distrikt');

  const existingEvent = await prisma.events.findFirst({ where: { title: 'E2E Öffentlicher Termin' } });
  if (!existingEvent) {
    let eventUuid = randomUUID();
    while (await prisma.events.findFirst({ where: { uuid: eventUuid } })) {
      eventUuid = randomUUID();
    }
    await prisma.events.create({
      data: {
        title: 'E2E Öffentlicher Termin',
        date: daysFromNow(10),
        time: timeOfDay(19, 0),
        location: 'Logenhaus',
        public_description: 'Öffentliche Beschreibung für den E2E-Test.',
        created_by_id: user.id,
        uuid: eventUuid,
        created_at: now,
        updated_at: now,
      },
    });
  }
  console.log('seeded E2E Öffentlicher Termin');

  const gdprPending = await ensureUser({
    email: 'e2e-gdpr@example.org',
    firstname: 'E2E',
    lastname: 'GdprPending',
    matriculationNumber: MATRICULATION_NUMBER,
    acceptedGdpr: false,
  });
  await ensureUserHasRole(gdprPending.id, enteredApprenticeRole.id);
  console.log('seeded e2e-gdpr@example.org');

  await setAppConfig('lodge', 'E2E Testloge');
  await setAppConfig('impressum', '<h2 id="vereinsinformation">Vereinsinformation</h2><p>:lodge</p>');
  console.log('seeded AppConfig[:lodge] and AppConfig[:impressum] for e2e');
}

/** CLI entry point - `pnpm --filter api run seed:e2e` (see api/package.json). */
async function main(): Promise<void> {
  try {
    await seedFrontendE2e();
  } finally {
    await prisma.$disconnect();
  }
}

const isMain = process.argv[1] !== undefined && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exitCode = 1;
  });
}
