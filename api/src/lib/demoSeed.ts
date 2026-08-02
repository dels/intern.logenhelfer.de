import { randomUUID } from 'node:crypto';

import bcrypt from 'bcryptjs';
import { jsPDF } from 'jspdf';

import { prisma } from '../db.js';

// Matches session.ts's/adminAccount.ts's own (unexported, deliberately
// duplicated per that file's boundary) BCRYPT_COST.
const BCRYPT_COST = 12;
const DEMO_PASSWORD = 'Salomon333';

export interface DemoAccount {
  email: string;
  role: string;
  firstname: string;
  lastname: string;
}

/**
 * Canonical 13-account list — keep in sync with
 * docs/superpowers/specs/2026-07-30-demo-environment-accounts.md. Degree
 * accounts hold only their degree role; office/admin accounts hold only
 * their office role (no stacking), matching that doc exactly. firstname/
 * lastname are realistic German names (distinct from every other name used
 * in this seed - brothers and seekers) - `role` stays the internal English
 * CASL/role identifier (matched against ability.ts), never shown to users;
 * ROLE_DISPLAY_NAMES below carries the German label a real user sees.
 */
export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  { email: 'lehrling@logenhelfer.de', role: 'EnteredApprentice', firstname: 'Eberhard', lastname: 'Horn' },
  { email: 'geselle@logenhelfer.de', role: 'FellowCraft', firstname: 'Alexander', lastname: 'Busch' },
  { email: 'meister@logenhelfer.de', role: 'MasterMason', firstname: 'Maximilian', lastname: 'Seidel' },
  { email: 'admin@logenhelfer.de', role: 'Admin', firstname: 'Simon', lastname: 'Brandt' },
  { email: 'sekretaer@logenhelfer.de', role: 'Secretary', firstname: 'Lukas', lastname: 'Haas' },
  { email: 'mvst@logenhelfer.de', role: 'WorshipfulMaster', firstname: 'Jonas', lastname: 'Graf' },
  { email: 'internetbeauftrager@logenhelfer.de', role: 'NetDelegate', firstname: 'Felix', lastname: 'Pohl' },
  { email: 'beamtenrat@logenhelfer.de', role: 'MemberOfCouncil', firstname: 'David', lastname: 'Sauer' },
  { email: 'nurdateien@logenhelfer.de', role: 'FileAdmin', firstname: 'Niklas', lastname: 'Arnold' },
  { email: 'nurbenutzer@logenhelfer.de', role: 'UserAdmin', firstname: 'Philipp', lastname: 'Krebs' },
  { email: 'nurarbeitsplan@logenhelfer.de', role: 'WorkingPlanAdmin', firstname: 'Robert', lastname: 'Lindner' },
  { email: 'nuranwendung@logenhelfer.de', role: 'ApplicationAdmin', firstname: 'Patrick', lastname: 'Zimmer' },
  { email: 'nurankuendigungen@logenhelfer.de', role: 'AnnouncementAdmin', firstname: 'Dennis', lastname: 'Voigt' },
];

// German label shown anywhere role.display_name is rendered (member lists,
// officer titles) - mirrors app/src/i18n/de.json's demoBanner.roles short
// titles. Every role this seed ever creates is one of these 13, so there is
// no unmapped case in practice.
const ROLE_DISPLAY_NAMES: Record<string, string> = {
  EnteredApprentice: 'Lehrling',
  FellowCraft: 'Geselle',
  MasterMason: 'Meister',
  Admin: 'Administrator',
  Secretary: 'Schriftführer',
  WorshipfulMaster: 'Meister vom Stuhl',
  NetDelegate: 'Internetbeauftragter',
  MemberOfCouncil: 'Beamtenrat',
  FileAdmin: 'Dateiverwaltung',
  UserAdmin: 'Mitgliederverwaltung',
  WorkingPlanAdmin: 'Arbeitsplanverwaltung',
  ApplicationAdmin: 'Anwendungsverwaltung',
  AnnouncementAdmin: 'Ankündigungsverwaltung',
};

const ALL_DEGREE_ROLES = ['EnteredApprentice', 'FellowCraft', 'MasterMason'];

// Same pg_tables-driven TRUNCATE approach as api/e2e/seedFrontendE2e.ts's
// resetDb() / api/test/helpers/db.ts's resetDb() - duplicated rather than
// imported, since api/src must not depend on api/test or api/e2e (neither
// ships in the production build).
const EXCLUDED_TABLES = new Set(['_prisma_migrations', 'schema_migrations', 'ar_internal_metadata']);

async function resettableTableNames(): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ tablename: string }[]>`SELECT tablename FROM pg_tables WHERE schemaname = 'public'`;
  return rows.map((row) => row.tablename).filter((name) => !EXCLUDED_TABLES.has(name));
}

async function truncateAllTables(): Promise<void> {
  const tables = (await resettableTableNames()).map((name) => `"${name}"`).join(', ');
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
}

async function ensureRole(name: string): Promise<{ id: number }> {
  const now = new Date();
  const existing = await prisma.roles.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.roles.create({ data: { name, display_name: ROLE_DISPLAY_NAMES[name] ?? name, created_at: now, updated_at: now } });
}

async function createDemoAccounts(encryptedPassword: string): Promise<Map<string, { id: number }>> {
  const now = new Date();
  const usersByEmail = new Map<string, { id: number }>();

  const degreeRoleRows = await Promise.all(ALL_DEGREE_ROLES.map((name) => ensureRole(name)));
  const degreeRoleIdByName = new Map(degreeRoleRows.map((r, i) => [ALL_DEGREE_ROLES[i]!, r.id]));

  for (const [i, { email, role, firstname, lastname }] of DEMO_ACCOUNTS.entries()) {
    const roleRow = await ensureRole(role);
    // Continues past the 60 brothers' 0-59 range so matriculation_number/
    // phone/mobile/street picks never collide with a brother's.
    const seedIndex = 60 + i;

    const user = await prisma.users.create({
      data: {
        email,
        encrypted_password: encryptedPassword,
        firstname,
        lastname,
        deleted: false,
        accepted_gdpr: true,
        accepted_at: now,
        matriculation_number: matriculationNumberFor(seedIndex),
        uuid: randomUUID(),
        created_at: now,
        updated_at: now,
      },
    });

    // Degree dates: every account passes through EnteredApprentice; only
    // lehrling@ stops there, geselle@ also gets FellowCraft. meister@ and
    // every officer account (assumed master-mason-level, per Task 10's
    // brief) get all three. A degree account's own role (lehrling/geselle/
    // meister) IS one of the 3 stacked rows below, so it needs no separate
    // row; an officer's administrative role (Admin, Secretary, etc.) is a
    // 4th, undated row on top of the 3 degree rows.
    const isDegreeAccount = ALL_DEGREE_ROLES.includes(role);
    const rows: { user_id: number; role_id: number; created_at: Date; updated_at: Date; role_added_at?: Date }[] = [];
    if (!isDegreeAccount) {
      rows.push({ user_id: user.id, role_id: roleRow.id, created_at: now, updated_at: now });
    }
    rows.push(...degreeRoleRowsFor(user.id, isDegreeAccount ? role : 'MasterMason', seedIndex, degreeRoleIdByName, now));
    await prisma.user_roles.createMany({ data: rows });

    const street = BREMEN_STREETS[seedIndex % BREMEN_STREETS.length]!;
    await prisma.addresses.create({
      data: {
        addressable_type: 'User',
        addressable_id: user.id,
        type_of_address: ADDRESS_TYPE_PRIVATE,
        purpose: 'Privat',
        street1: street.street,
        zip: street.zip,
        city: 'Bremen',
        email,
        phone: bremenPhoneNumber(seedIndex),
        mobile: demoMobileNumber(seedIndex),
        created_at: now,
        updated_at: now,
      },
    });

    usersByEmail.set(email, user);
  }

  return usersByEmail;
}

function daysFromNow(days: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days));
}

function timeOfDay(hh: number, mm: number): Date {
  return new Date(Date.UTC(1970, 0, 1, hh, mm, 0));
}

// Folds German umlauts/ß to their plain-ASCII transliteration for email
// local-parts (Müller -> mueller), matching how a real member's email would
// typically be generated from their name.
function foldUmlauts(value: string): string {
  return value
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/Ä/g, 'Ae')
    .replace(/Ö/g, 'Oe')
    .replace(/Ü/g, 'Ue');
}

function emailFor(firstname: string, lastname: string): string {
  return `${foldUmlauts(firstname).toLowerCase()}.${foldUmlauts(lastname).toLowerCase()}@logenhelfer.de`;
}

// Deterministic placeholder phone number - a seed script needs stable,
// reproducible output, not real entropy.
function demoPhoneNumber(index: number): string {
  return `030 55${String(10000 + index).slice(-5)}`;
}

// Same house style as demoPhoneNumber above: deterministic, not
// Math.random(), so reruns are reproducible and the "idempotent twice" test
// stays meaningful. Bremen's own dialing code, for brothers' Bremen addresses.
function bremenPhoneNumber(index: number): string {
  return `0421 ${String(1000000 + index * 37).slice(-6)}`;
}

// Real German mobile prefixes, cycled - format matches how a real member
// would enter a mobile number (no strict validation on this free-text field).
const MOBILE_PREFIXES = ['0151', '0152', '0157', '0160', '0170', '0171', '0175', '0176'];
function demoMobileNumber(index: number): string {
  const prefix = MOBILE_PREFIXES[index % MOBILE_PREFIXES.length]!;
  return `${prefix} ${String(1000000 + index * 53).slice(-7)}`;
}

// matriculation_number is @unique in schema.prisma - independent random
// draws from [800,1000] (201 values) would collide across 60 brothers.
// 7 is coprime with 201 (=3*67), so multiplying by 7 mod 201 is injective:
// every index 0..59 maps to a distinct value, scattered-looking but
// reproducible (ponytail: deterministic beats real randomness here, since a
// seed script needs reruns to be stable, not entropy).
function matriculationNumberFor(index: number): number {
  return 800 + ((index * 7) % 201);
}

function addMonthsUTC(date: Date, months: number): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate()));
}

// Deterministic 8-14 month gap between successive degree dates - index-based,
// not Math.random(), so reruns stay reproducible (same reasoning as
// matriculationNumberFor above).
function degreeGapMonthsFor(seedIndex: number): number {
  return 8 + (seedIndex % 7);
}

// Deterministic "entered apprentice" date, scattered 5-40 years before now -
// same index-based-not-random reasoning as matriculationNumberFor.
function enteredApprenticeSinceFor(seedIndex: number): Date {
  const now = new Date();
  const yearsAgo = 5 + ((seedIndex * 7) % 36);
  return new Date(Date.UTC(now.getUTCFullYear() - yearsAgo, seedIndex % 12, 1 + (seedIndex % 28)));
}

// Builds the stacked user_roles rows (with role_added_at) for every degree a
// person has attained on their way to `finalRole` - e.g. a MasterMason gets
// 3 rows (EnteredApprentice, FellowCraft, MasterMason), mirroring exactly how
// api/src/routes/members.ts's applyDegreeDates/setDegreeByName already
// accumulates rows for real, non-demo members.
function degreeRoleRowsFor(
  userId: number,
  finalRole: string,
  seedIndex: number,
  roleIdByName: Map<string, number>,
  now: Date,
): { user_id: number; role_id: number; created_at: Date; updated_at: Date; role_added_at: Date }[] {
  const finalIndex = ALL_DEGREE_ROLES.indexOf(finalRole);
  if (finalIndex === -1) return [];
  const enteredApprenticeSince = enteredApprenticeSinceFor(seedIndex);
  const fellowCraftSince = addMonthsUTC(enteredApprenticeSince, degreeGapMonthsFor(seedIndex));
  const masterMasonSince = addMonthsUTC(fellowCraftSince, degreeGapMonthsFor(seedIndex + 1));
  const dateByDegree: Record<string, Date> = {
    EnteredApprentice: enteredApprenticeSince,
    FellowCraft: fellowCraftSince,
    MasterMason: masterMasonSince,
  };
  return ALL_DEGREE_ROLES.slice(0, finalIndex + 1).map((degree) => ({
    user_id: userId,
    role_id: roleIdByName.get(degree)!,
    created_at: now,
    updated_at: now,
    role_added_at: dateByDegree[degree]!,
  }));
}

// 20 real Bremen streets with their correct postal codes - private/business
// addresses pick two different entries via different offsets (7 doesn't
// divide 20, so index and index+7 mod 20 are never equal).
const BREMEN_STREETS: { street: string; zip: string }[] = [
  { street: 'Sögestraße', zip: '28195' },
  { street: 'Am Wall', zip: '28195' },
  { street: 'Osterdeich', zip: '28203' },
  { street: 'Vor dem Steintor', zip: '28203' },
  { street: 'Schwachhauser Heerstraße', zip: '28211' },
  { street: 'Contrescarpe', zip: '28203' },
  { street: 'Domsheide', zip: '28195' },
  { street: 'Findorffstraße', zip: '28215' },
  { street: 'Neustadtscontrescarpe', zip: '28199' },
  { street: 'Vegesacker Heerstraße', zip: '28757' },
  { street: 'Buntentorsteinweg', zip: '28201' },
  { street: 'Steffensweg', zip: '28217' },
  { street: 'Am Dobben', zip: '28203' },
  { street: 'Parkallee', zip: '28209' },
  { street: 'Kirchbachstraße', zip: '28211' },
  { street: 'Delmestraße', zip: '28213' },
  { street: 'Hemmstraße', zip: '28215' },
  { street: 'Kornstraße', zip: '28201' },
  { street: 'Humboldtstraße', zip: '28203' },
  { street: 'Rembertiring', zip: '28203' },
];

// Matches routes/members.ts's own ADDRESS_TYPE_PRIVATE/ADDRESS_TYPE_BUSINESS
// (duplicated, not imported - api/src/lib must not depend on api/src/routes).
const ADDRESS_TYPE_PRIVATE = 0;
const ADDRESS_TYPE_BUSINESS = 1;

// 60 distinct German given names, paired index-for-index with 60 distinct
// German family names below - every brother gets a unique firstname AND a
// unique lastname (no repeats of either, unlike the old 10x6 Cartesian
// product this replaced, which repeated each firstname 6x and each lastname
// 10x). None of these overlap SEEKER_SPECS' or DEMO_ACCOUNTS' names either.
const BROTHER_FIRST_NAMES = [
  'Michael', 'Thomas', 'Andreas', 'Stefan', 'Christian', 'Peter', 'Wolfgang', 'Klaus', 'Jürgen', 'Frank',
  'Werner', 'Helmut', 'Manfred', 'Günther', 'Rainer', 'Dieter', 'Uwe', 'Jörg', 'Bernd', 'Rolf',
  'Horst', 'Herbert', 'Erwin', 'Heinz', 'Kurt', 'Walter', 'Karl', 'Hans', 'Otto', 'Ernst',
  'Willi', 'Erich', 'Fritz', 'Bruno', 'Rudolf', 'Alfred', 'Gerhard', 'Reinhard', 'Volker', 'Norbert',
  'Detlef', 'Holger', 'Lothar', 'Siegfried', 'Wilhelm', 'Gustav', 'Arno', 'Ulrich', 'Dietmar', 'Harald',
  'Joachim', 'Ralf', 'Torsten', 'Matthias', 'Markus', 'Sven', 'Carsten', 'Oliver', 'Marcus', 'Bernhard',
];
const BROTHER_LAST_NAMES = [
  'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann',
  'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Schröder', 'Hofmann', 'Schmitt', 'Krause', 'Meier',
  'Lehmann', 'Schmid', 'Schulze', 'Maier', 'Köhler', 'Herrmann', 'Mayer', 'Huber', 'Kaiser', 'Fuchs',
  'Peters', 'Lang', 'Scholz', 'Möller', 'Weiß', 'Jung', 'Hahn', 'Schubert', 'Vogel', 'Friedrich',
  'Keller', 'Günther', 'Berger', 'Winkler', 'Roth', 'Beck', 'Lorenz', 'Baumann', 'Franke', 'Albrecht',
  'Schuster', 'Ludwig', 'Böhm', 'Winter', 'Kraus', 'Schumacher', 'Krämer', 'Vogt', 'Engel', 'Sommer',
];

interface BrotherSpec {
  firstname: string;
  lastname: string;
  role: string;
  extraRole?: string;
}

// 4 EnteredApprentice, 6 FellowCraft, 50 MasterMason (2 of whom also hold
// MemberOfCouncil) - the exact distribution requested for the demo roster.
function buildBrotherSpecs(): BrotherSpec[] {
  return BROTHER_FIRST_NAMES.map((firstname, index) => {
    let role: string;
    if (index < 4) role = 'EnteredApprentice';
    else if (index < 10) role = 'FellowCraft';
    else role = 'MasterMason';
    const extraRole = index === 10 || index === 11 ? 'MemberOfCouncil' : undefined;
    return { firstname, lastname: BROTHER_LAST_NAMES[index]!, role, extraRole };
  });
}

// Must structurally guarantee every ALL_DEGREE_ROLES entry is present,
// not just whatever roles happen to appear among the given specs -
// otherwise degreeRoleRowsFor's roleIdByName.get(degree)! would return
// undefined for any brother stacking through a degree that no current spec
// happens to hold (e.g. if the demo's degree distribution ever shifted to
// zero EnteredApprentice brothers), producing a role_id: undefined row that
// user_roles.createMany would reject. Mirrors createDemoAccounts' own
// unconditional ALL_DEGREE_ROLES.map(ensureRole) further up this file.
// Exported so tests can verify this invariant in isolation, independent of
// whatever the current 60 brother specs' real distribution happens to be.
export function brotherRoleNamesFor(specs: { role: string; extraRole?: string }[]): string[] {
  const extraRoleNames = [...new Set(specs.flatMap((s) => (s.extraRole ? [s.extraRole] : [])))];
  return [...new Set([...ALL_DEGREE_ROLES, ...extraRoleNames])];
}

// Batched (createMany + one findMany-back-by-email, rather than 60 rounds
// of individual sequential create() calls): with ~250 individual round
// trips the earlier version pushed a single resetAndSeedDemoData() call
// close to/over vitest's 15s per-test timeout, and a timed-out test's
// still-running (JS promises aren't cancellable) insert loop then raced the
// next test's own truncate+reseed - producing nondeterministic user counts
// and unique-constraint violations. Batching keeps this to a handful of
// round trips.
async function seedBrothers(encryptedPassword: string): Promise<void> {
  const now = new Date();
  const specs = buildBrotherSpecs();

  await prisma.users.createMany({
    data: specs.map((spec, index) => ({
      email: emailFor(spec.firstname, spec.lastname),
      encrypted_password: encryptedPassword,
      firstname: spec.firstname,
      lastname: spec.lastname,
      deleted: false,
      accepted_gdpr: true,
      accepted_at: now,
      matriculation_number: matriculationNumberFor(index),
      uuid: randomUUID(),
      created_at: now,
      updated_at: now,
    })),
  });

  const emails = specs.map((spec) => emailFor(spec.firstname, spec.lastname));
  const createdUsers = await prisma.users.findMany({ where: { email: { in: emails } } });
  const userIdByEmail = new Map(createdUsers.map((u) => [u.email, u.id]));

  const roleNames = brotherRoleNamesFor(specs);
  const roleRows = await Promise.all(roleNames.map((name) => ensureRole(name)));
  const roleIdByName = new Map(roleRows.map((r, i) => [roleNames[i]!, r.id]));

  const userRoleRows: { user_id: number; role_id: number; created_at: Date; updated_at: Date; role_added_at?: Date }[] = [];
  const addressRows: {
    addressable_type: string;
    addressable_id: number;
    type_of_address: number;
    purpose: string;
    street1: string;
    zip: string;
    city: string;
    email?: string;
    phone: string;
    mobile?: string;
    created_at: Date;
    updated_at: Date;
  }[] = [];
  specs.forEach((spec, index) => {
    const email = emailFor(spec.firstname, spec.lastname);
    const userId = userIdByEmail.get(email)!;
    userRoleRows.push(...degreeRoleRowsFor(userId, spec.role, index, roleIdByName, now));
    if (spec.extraRole) {
      userRoleRows.push({ user_id: userId, role_id: roleIdByName.get(spec.extraRole)!, created_at: now, updated_at: now });
    }

    const privateStreet = BREMEN_STREETS[index % BREMEN_STREETS.length]!;
    addressRows.push({
      addressable_type: 'User',
      addressable_id: userId,
      type_of_address: ADDRESS_TYPE_PRIVATE,
      purpose: 'Privat',
      street1: privateStreet.street,
      zip: privateStreet.zip,
      city: 'Bremen',
      email,
      phone: bremenPhoneNumber(index),
      mobile: demoMobileNumber(index),
      created_at: now,
      updated_at: now,
    });

    // At least 40% get a business address too - index % 5 < 2 gives exactly
    // 24 of 60 (40%). Offset by 7 so the business street never matches the
    // private one (7 doesn't divide BREMEN_STREETS.length === 20).
    if (index % 5 < 2) {
      const businessStreet = BREMEN_STREETS[(index + 7) % BREMEN_STREETS.length]!;
      addressRows.push({
        addressable_type: 'User',
        addressable_id: userId,
        type_of_address: ADDRESS_TYPE_BUSINESS,
        purpose: 'Geschäftlich',
        street1: businessStreet.street,
        zip: businessStreet.zip,
        city: 'Bremen',
        phone: bremenPhoneNumber(index + 1000),
        created_at: now,
        updated_at: now,
      });
    }
  });

  await prisma.user_roles.createMany({ data: userRoleRows });
  await prisma.addresses.createMany({ data: addressRows });
}

interface DirectorySpec {
  name: string;
  slug: string;
  roleNames: string[];
}

// Creates one category + its directories, granting category_roles as the
// union of every directory's roleNames (canViewCategory/canViewDirectory
// both use rolesOverlap against an *explicit* role list - an empty list is
// invisible to every non-elevated role, so "visible to everyone" means
// granting all three degree roles, not leaving the list empty) and
// directory_roles per directory. Returns directory ids keyed by slug so
// callers can attach files afterward.
async function seedCategoryWithDirectories(categoryName: string, categorySlug: string, directories: DirectorySpec[]): Promise<Map<string, number>> {
  const now = new Date();
  const allRoleNames = [...new Set(directories.flatMap((d) => d.roleNames))];
  const categoryRoleRows = await Promise.all(allRoleNames.map((name) => ensureRole(name)));

  const category = await prisma.categories.create({
    data: { name: categoryName, slug: categorySlug, uuid: randomUUID(), created_at: now, updated_at: now },
  });
  if (categoryRoleRows.length > 0) {
    await prisma.category_roles.createMany({
      data: categoryRoleRows.map((r) => ({ category_id: category.id, role_id: r.id, created_at: now, updated_at: now })),
    });
  }

  const directoryIdsBySlug = new Map<string, number>();
  for (const dir of directories) {
    const directory = await prisma.directories.create({
      data: { name: dir.name, slug: dir.slug, category_id: category.id, uuid: randomUUID(), created_at: now, updated_at: now },
    });
    const dirRoleRows = await Promise.all(dir.roleNames.map((name) => ensureRole(name)));
    if (dirRoleRows.length > 0) {
      await prisma.directory_roles.createMany({
        data: dirRoleRows.map((r) => ({ directory_id: directory.id, role_id: r.id, created_at: now, updated_at: now })),
      });
    }
    directoryIdsBySlug.set(dir.slug, directory.id);
  }
  return directoryIdsBySlug;
}

// Grants every degree role visibility to a category/directory/file triple
// that already exists (used to fix the pre-existing Beispieldokumente/
// Willkommen/willkommen.txt trio, which had no roles at all anywhere and
// was therefore invisible to every non-elevated demo login). File
// visibility is its own, separate grant (attached_file_roles) - it is NOT
// inherited from the parent directory's directory_roles grant; canViewAttachedFile
// (api/src/authz/ability.ts) checks attached_file_roles exclusively, so a
// directory being visible does not make the files inside it visible.
async function grantAllDegreesVisibility(categoryId: number, directoryId: number, attachedFileId: number): Promise<void> {
  const now = new Date();
  const roleRows = await Promise.all(ALL_DEGREE_ROLES.map((name) => ensureRole(name)));
  await prisma.category_roles.createMany({
    data: roleRows.map((r) => ({ category_id: categoryId, role_id: r.id, created_at: now, updated_at: now })),
  });
  await prisma.directory_roles.createMany({
    data: roleRows.map((r) => ({ directory_id: directoryId, role_id: r.id, created_at: now, updated_at: now })),
  });
  await prisma.attached_file_roles.createMany({
    data: roleRows.map((r) => ({ attached_file_id: attachedFileId, role_id: r.id, created_at: now, updated_at: now })),
  });
}

// A one-page placeholder PDF - deliberately NOT the real ritual texts (see
// docs/superpowers/specs/2026-07-30-demo-environment-design.md's account
// list neighbor doc / project decision log): this demo is publicly
// reachable, and the requested source files are a real lodge's actual
// confidential ritual documents. Generated at seed time via the jsPDF
// dependency already used by public.ts's workingplan.pdf route, so there's
// no binary to commit and no network fetch on boot.
function buildPlaceholderPdf(title: string): Buffer {
  const doc = new jsPDF();
  doc.setFontSize(20);
  doc.text(title, 20, 30);
  doc.setFontSize(12);
  doc.text('Platzhalter-Dokument für die Demo-Umgebung.', 20, 45);
  return Buffer.from(doc.output('arraybuffer'));
}

async function seedRitualFiles(gradDirectoryIds: Map<string, number>, creatorId: number): Promise<void> {
  const now = new Date();
  const files: { slug: string; title: string; roleName: string }[] = [
    { slug: 'grad-i', title: 'Ritual I', roleName: 'EnteredApprentice' },
    { slug: 'grad-ii', title: 'Ritual II', roleName: 'FellowCraft' },
    { slug: 'grad-iii', title: 'Ritual III', roleName: 'MasterMason' },
  ];
  for (const file of files) {
    const directoryId = gradDirectoryIds.get(file.slug);
    if (directoryId === undefined) continue;
    const content = buildPlaceholderPdf(file.title);
    const attachedFile = await prisma.attached_files.create({
      data: {
        uuid: randomUUID(),
        filename: `${file.title}.pdf`,
        // Prisma's generated `Bytes` field type is `Uint8Array<ArrayBuffer>`,
        // while `Buffer` is typed `Buffer<ArrayBufferLike>` (its backing
        // buffer can be a `SharedArrayBuffer`) - a plain `Uint8Array` copy
        // narrows that back to a real `ArrayBuffer` so this type-checks
        // (same pattern as attachedFiles.ts's own upload route).
        content: new Uint8Array(content),
        content_type: 'application/pdf',
        content_length: content.length,
        directory_id: directoryId,
        uploader_id: creatorId,
        created_at: now,
        updated_at: now,
      },
    });
    // File visibility is its own grant, separate from (and not inherited
    // from) the parent directory's directory_roles - see
    // grantAllDegreesVisibility's comment.
    const roleRow = await ensureRole(file.roleName);
    await prisma.attached_file_roles.create({
      data: { attached_file_id: attachedFile.id, role_id: roleRow.id, created_at: now, updated_at: now },
    });
  }
}

// Drops one placeholder PDF into each given directory, visible to the same
// roles as the directory itself - used for Vorträge/Zeichnungen, which
// previously seeded as empty directories with nothing exemplary inside.
async function seedPlaceholderDocuments(
  directoryIdsBySlug: Map<string, number>,
  docs: { slug: string; title: string }[],
  roleNames: string[],
  creatorId: number,
): Promise<void> {
  const now = new Date();
  const roleRows = await Promise.all(roleNames.map((name) => ensureRole(name)));
  for (const doc of docs) {
    const directoryId = directoryIdsBySlug.get(doc.slug);
    if (directoryId === undefined) continue;
    const content = buildPlaceholderPdf(doc.title);
    const attachedFile = await prisma.attached_files.create({
      data: {
        uuid: randomUUID(),
        filename: `${doc.title}.pdf`,
        content: new Uint8Array(content),
        content_type: 'application/pdf',
        content_length: content.length,
        directory_id: directoryId,
        uploader_id: creatorId,
        created_at: now,
        updated_at: now,
      },
    });
    await prisma.attached_file_roles.createMany({
      data: roleRows.map((r) => ({ attached_file_id: attachedFile.id, role_id: r.id, created_at: now, updated_at: now })),
    });
  }
}

// Real status/invite values from api/src/routes/seekers.ts's STATUS
// constant and query-filter semantics: declined -> status 1000; accepted ->
// status 100; inactive -> invite:false with status outside {100,1000};
// active (default) -> invite:true with status outside {100,1000}.
const SEEKER_SPECS: { firstname: string; lastname: string; status: number; invite: boolean }[] = [
  { firstname: 'Sebastian', lastname: 'Braun', status: 1000, invite: false }, // declined
  { firstname: 'Florian', lastname: 'Wolf', status: 100, invite: true }, // accepted
  { firstname: 'Tobias', lastname: 'Neumann', status: 0, invite: false }, // inactive - contacted
  { firstname: 'Daniel', lastname: 'Schwarz', status: 10, invite: false }, // inactive - visiting
  { firstname: 'Martin', lastname: 'Zimmermann', status: 0, invite: true }, // active - contacted
  { firstname: 'Christoph', lastname: 'Krüger', status: 10, invite: true }, // active - visiting
  { firstname: 'Benjamin', lastname: 'Hartmann', status: 20, invite: true }, // active - application_expected
  { firstname: 'Julian', lastname: 'Lange', status: 30, invite: true }, // active - application_received
  { firstname: 'Tim', lastname: 'Werner', status: 40, invite: true }, // active - ballotage_scheduled
  { firstname: 'Fabian', lastname: 'König', status: 60, invite: true }, // active - admission_scheduled
];

function initials(firstname: string, lastname: string): string {
  return `${firstname[0]}.${lastname[0]}.`;
}

// Sliced from buildBrotherSpecs' own distribution (index<4 apprentice,
// 4-9 FellowCraft) rather than a DB round-trip - the event schedule below
// only needs initials, and this keeps buildDemoEventSchedule a pure function.
const APPRENTICE_INITIALS = BROTHER_FIRST_NAMES.slice(0, 4).map((f, i) => initials(f, BROTHER_LAST_NAMES[i]!));
const FELLOWCRAFT_INITIALS = BROTHER_FIRST_NAMES.slice(4, 10).map((f, i) => initials(f, BROTHER_LAST_NAMES[i + 4]!));
const ALL_BROTHER_INITIALS = BROTHER_FIRST_NAMES.map((f, i) => initials(f, BROTHER_LAST_NAMES[i]!));

// Ties "Kugelung <initials>" to the actual seeded seekers - it's literally
// the ballot a seeker goes through before admission.
const SEEKER_INITIALS = SEEKER_SPECS.map((s) => initials(s.firstname, s.lastname));

const LECTURE_TOPICS = [
  'Die Symbolik des Zirkels', 'Brüderlichkeit und Toleranz', 'Das raue und behauene Gestein',
  'Licht und Erkenntnis', 'Die Bauhütten des Mittelalters', 'Der Wert der Schweigepflicht',
  'Symbole am Bauplatz', 'Vom Lehrling zum Meister', 'Die drei Säulen der Loge',
  'Geschichte der Freimaurerei in Bremen',
];

async function seedSeekers(): Promise<void> {
  const now = new Date();
  for (const [index, spec] of SEEKER_SPECS.entries()) {
    const seeker = await prisma.seekers.create({
      data: {
        firstname: spec.firstname,
        lastname: spec.lastname,
        status: spec.status,
        invite: spec.invite,
        source: 'Empfehlung',
        preferred_way_of_contact: 10, // email, see WAY_OF_CONTACT in seekers.ts
        deleted: false,
        uuid: randomUUID(),
        created_at: now,
        updated_at: now,
      },
    });
    await prisma.addresses.create({
      data: {
        addressable_type: 'Seeker',
        addressable_id: seeker.id,
        email: emailFor(spec.firstname, spec.lastname),
        phone: demoPhoneNumber(1000 + index),
        created_at: now,
        updated_at: now,
      },
    });
  }
}

const ICS_SOURCE_SPECS: { name: string; url: string }[] = [
  { name: 'Werder Bremen', url: 'https://www.bundesliga-statistik.de/kalender.php?s=0&m=3&w=0&t=0' },
  { name: '1. FC Köln', url: 'https://www.bundesliga-statistik.de/kalender.php?s=0&m=15&w=0&t=0' },
  { name: 'Borussia Dortmund', url: 'https://www.bundesliga-statistik.de/kalender.php?s=0&m=11&w=0&t=0' },
];

async function seedIcsSources(creatorId: number): Promise<void> {
  const now = new Date();
  await prisma.external_event_ics_sources.createMany({
    data: ICS_SOURCE_SPECS.map((spec) => ({
      uuid: randomUUID(),
      name: spec.name,
      url: spec.url,
      created_by_id: creatorId,
      created_at: now,
      updated_at: now,
    })),
  });
}

const ANNOUNCEMENT_SPECS: { title: string; message_body: string }[] = [
  { title: 'Grosslogentag 2026', message_body: 'Save the date: Der diesjährige Grosslogentag findet im Herbst statt. Details folgen in Kürze.' },
  { title: 'Neue Aufnahme in unsere Loge', message_body: 'Wir freuen uns, ein neues Mitglied in unseren Reihen begrüßen zu dürfen.' },
  { title: 'Stuhlmeistertag', message_body: 'Der jährliche Stuhlmeistertag findet in der Landesloge statt. Anmeldung über den Sekretär.' },
  { title: 'Bibliotheksbestand erweitert', message_body: 'Die Logenbibliothek wurde um mehrere Bände zur Freimaurerei erweitert.' },
  { title: 'Sommerfest der Loge', message_body: 'In diesem Jahr findet unser Sommerfest wieder im Logengarten statt.' },
  { title: 'Vortragsreihe: Symbolik im Ritual', message_body: 'Eine neue Vortragsreihe zur Symbolik der drei Grade startet im nächsten Monat.' },
  { title: 'Terminänderung Arbeitsplan', message_body: 'Bitte beachtet die Verschiebung der nächsten Arbeit um eine Woche.' },
  { title: 'Trauer um einen Bruder', message_body: 'Mit großer Trauer geben wir den Tod eines langjährigen Bruders bekannt.' },
  { title: 'Neue Ausgabe der Logenrundbriefe', message_body: 'Die aktuelle Ausgabe der Logenrundbriefe steht ab sofort zum Download bereit.' },
  { title: 'Einladung zur Ballotage', message_body: 'Die nächste Ballotage findet im Rahmen der kommenden Arbeit statt.' },
];

async function seedAnnouncements(creatorId: number): Promise<void> {
  for (const [index, spec] of ANNOUNCEMENT_SPECS.entries()) {
    const createdAt = daysFromNow(-index * 3);
    await prisma.announcements.create({
      data: {
        uuid: randomUUID(),
        title: spec.title,
        message_body: spec.message_body,
        created_by_id: creatorId,
        deleted: false,
        created_at: createdAt,
        updated_at: createdAt,
      },
    });
  }
}

export interface DemoEventSpec {
  date: Date;
  time: Date;
  title: string;
}

interface WednesdaySlot {
  date: Date;
  month: number; // UTC month, 0-indexed
  indexInMonth: number; // 1-based (1st, 2nd, ... Wednesday of its month)
  isFirst: boolean;
  blackout: boolean;
}

function wednesdaysInMonth(year: number, month: number): Date[] {
  const result: Date[] = [];
  const cursor = new Date(Date.UTC(year, month, 1));
  while (cursor.getUTCMonth() === month) {
    if (cursor.getUTCDay() === 3) result.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

// July/August have no events (Sommerfest is whitelisted separately by the
// caller); 20 Dec - 7 Jan (inclusive both ends) is the lodge's winter break.
function isBlackedOut(date: Date): boolean {
  const month = date.getUTCMonth();
  if (month === 6 || month === 7) return true;
  const day = date.getUTCDate();
  if (month === 11 && day >= 20) return true;
  if (month === 0 && day <= 7) return true;
  return false;
}

function nextTwelveMonths(seedDate: Date): { year: number; month: number }[] {
  const months: { year: number; month: number }[] = [];
  let year = seedDate.getUTCFullYear();
  let month = seedDate.getUTCMonth();
  for (let i = 0; i < 12; i++) {
    months.push({ year, month });
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }
  return months;
}

/**
 * Builds the lodge's recurring Wednesday-evening schedule for the 12 months
 * following seedDate - a pure function (no DB access) so its date math is
 * unit-testable directly. See the "events" section of the demo-environment
 * spec this implements for the full prose rule set; the precedence used to
 * resolve overlaps between rules (not specified there) is, highest first:
 * blackout > fixed dates (Sommerfest/Johannisfest/Mitgliederversammlung) >
 * degree-ceremony ranks (Beförderung/Aufnahme/Erhebung) > TA I monthly
 * guarantee > their >=5-week-prior precursor lectures (Gesellenvortrag/
 * Kugelung/Meistervortrag - deliberately placed *after* the guarantee pass,
 * see pendingPrecursors' own comment below for why) > Instruktion in I >
 * baseline (1st Wed = Gästeabend) + filler.
 */
export function buildDemoEventSchedule(seedDate: Date): DemoEventSpec[] {
  const time = timeOfDay(20, 0);
  const monthOrder = nextTwelveMonths(seedDate);
  const slots: WednesdaySlot[] = [];
  for (const { year, month } of monthOrder) {
    const dates = wednesdaysInMonth(year, month);
    dates.forEach((date, i) => {
      slots.push({ date, month, indexInMonth: i + 1, isFirst: i === 0, blackout: isBlackedOut(date) });
    });
  }

  const key = (s: WednesdaySlot): string => s.date.toISOString().slice(0, 10);
  const assigned = new Map<string, string>();
  const monthSlots = (month: number): WednesdaySlot[] => slots.filter((s) => s.month === month);

  function assign(slot: WednesdaySlot | undefined, title: string): void {
    if (!slot) return;
    const k = key(slot);
    if (assigned.has(k)) return;
    assigned.set(k, title);
  }

  // Fixed dates first - these win over every other rule.
  const augustSlots = monthSlots(7);
  assign(augustSlots[Math.min(2, augustSlots.length - 1)], 'Sommerfest');
  const juneSlots = monthSlots(5);
  assign(juneSlots[juneSlots.length - 1], 'Johannisfest mit Tafel');
  assign(monthSlots(4)[2], 'Mitgliederversammlung');

  // Degree ceremonies. June/July/August are excluded from the eligible
  // pool (June already holds Johannisfest, July/August are blacked out
  // except Sommerfest); May stays eligible - its 3rd-Wednesday
  // Mitgliederversammlung never collides with the 4th/last Wednesday a
  // ceremony would use. That leaves 9 eligible months for the 5+3=8 slots
  // needed below, with exactly one spare: December's 4th/last Wednesday is
  // *always* in the winter-break blackout (the earliest possible 4th
  // Wednesday of December is the 22nd, in every weekday alignment), so it
  // always fails silently here - without a spare month, Aufnahme would
  // land one short every single year.
  const eligibleMonths = monthOrder.map((m) => m.month).filter((m) => m !== 5 && m !== 6 && m !== 7);
  const takenMonths = new Set<number>();

  function pickCeremonyMonths(count: number, pickSlot: (ms: WednesdaySlot[]) => WednesdaySlot | undefined): WednesdaySlot[] {
    const picked: WednesdaySlot[] = [];
    for (const month of eligibleMonths) {
      if (picked.length >= count) break;
      if (takenMonths.has(month)) continue;
      const slot = pickSlot(monthSlots(month));
      if (!slot || slot.blackout || assigned.has(key(slot))) continue;
      takenMonths.add(month);
      picked.push(slot);
    }
    return picked;
  }

  // ponytail: two known gaps, both acceptable for a demo dataset - (1) a
  // ceremony scheduled soon after a blackout (e.g. an autumn Aufnahme whose
  // 5-12-week-earlier window falls entirely in July/August) simply gets no
  // precursor event; (2) a ceremony within the first ~12 weeks of the
  // generated window has no in-window candidate to search at all, same
  // result. Neither errors - `assign(undefined, ...)` below is a no-op.
  function placePrecursor(ceremonySlot: WednesdaySlot): WednesdaySlot | undefined {
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
    for (let weeks = 5; weeks <= 12; weeks++) {
      const candidateTime = ceremonySlot.date.getTime() - weeks * WEEK_MS;
      const candidate = slots.find((s) => s.date.getTime() === candidateTime);
      // isFirst is excluded too (found empirically 2026-08-01, after adding
      // the TA I monthly guarantee pass): that pass now claims one more
      // Wednesday per month than before, so a precursor's 5-12-week search
      // gets pushed further out more often and can land on a month's 1st
      // Wednesday - which is always reserved for Gästeabend (assigned later,
      // in the baseline loop) and must never be pre-empted by anything else.
      if (candidate && !candidate.blackout && !candidate.isFirst && !assigned.has(key(candidate))) return candidate;
    }
    return undefined;
  }

  // Precursor lectures are deliberately placed in a second pass, after the
  // TA I monthly guarantee below rather than right alongside each ceremony -
  // found empirically 2026-08-01 debugging a 4-Wednesday month (e.g. March
  // 2026 for a Jan-2026-anchored seed): that month's own Beförderung (3rd
  // Wednesday) plus a *neighboring* month's Beförderung precursor AND a
  // neighboring month's Erhebung precursor (both landing here purely because
  // this month happens to fall 5 weeks before those ceremonies) together
  // filled all 3 non-Gästeabend Wednesdays before the guarantee pass ever
  // ran, leaving that month with zero TA I events - an unfixable-by-reorder
  // capacity clash, since a month's guaranteed TA I can only ever come from
  // that same month's own Wednesdays. Precursors are the more flexible
  // commitment (placePrecursor already documents that it's fine for one to
  // simply not be placed when its 5-12-week window has no free slot), so
  // they now yield to the guarantee pass instead of racing it. Each entry
  // here is placed after the guarantee pass has taken what it needs.
  const pendingPrecursors: { ceremonySlot: WednesdaySlot; title: string }[] = [];

  // 5 times/year, 3rd Wednesday (falling back to the 5th when the month has
  // one and the 3rd isn't usable, e.g. May's 3rd Wednesday is already
  // Mitgliederversammlung): Beförderung (apprentice -> FellowCraft), preceded
  // >=5 weeks earlier by that same apprentice's Gesellenvortrag. Deliberately
  // moved off the 4th Wednesday (2026-08-01) so it stops competing with the
  // baseline "TA I mit Brudermahl" title for the same slot - see the TA I
  // monthly guarantee pass below, which now owns the 4th Wednesday instead.
  const beforderungSlots = pickCeremonyMonths(5, (ms) => {
    const third = ms[2];
    if (third && !third.blackout && !assigned.has(key(third))) return third;
    return ms[4];
  });
  beforderungSlots.forEach((slot, i) => {
    const who = APPRENTICE_INITIALS[i % APPRENTICE_INITIALS.length]!;
    assign(slot, `Tempelarbeit in II mit Beförderung von Bruder ${who}`);
    pendingPrecursors.push({ ceremonySlot: slot, title: `Gesellenvortrag ${who}` });
  });

  // 3 times/year, last Wednesday: admission + festive dinner, preceded
  // >=5 weeks earlier by the ballot for the seeker being admitted.
  const aufnahmeSlots = pickCeremonyMonths(3, (ms) => ms[ms.length - 1]);
  aufnahmeSlots.forEach((slot, i) => {
    assign(slot, 'TA I mit Aufnahme und Festtafel');
    const who = SEEKER_INITIALS[i % SEEKER_INITIALS.length]!;
    pendingPrecursors.push({ ceremonySlot: slot, title: `Kugelung ${who}` });
  });

  // Whenever a month has 5 Wednesdays: Erhebung (FellowCraft -> MasterMason)
  // on the 5th, preceded >=5 weeks earlier by that FellowCraft's
  // Meistervortrag. A 5-Wednesday June's 5th (=last) Wednesday is already
  // Johannisfest, so `assign` above naturally skips it here.
  let fellowCraftCounter = 0;
  for (const month of monthOrder.map((m) => m.month)) {
    const ms = monthSlots(month);
    if (ms.length < 5) continue;
    const fifth = ms[4]!;
    if (fifth.blackout || assigned.has(key(fifth))) continue;
    const who = FELLOWCRAFT_INITIALS[fellowCraftCounter % FELLOWCRAFT_INITIALS.length]!;
    fellowCraftCounter++;
    assign(fifth, `Tempelarbeit in III mit Erhebung von Bruder ${who}`);
    pendingPrecursors.push({ ceremonySlot: fifth, title: `Meistervortrag ${who}` });
  }

  // TA I monthly guarantee: at least one TA I-family event ('TA I mit
  // Brudermahl' or 'TA I mit Aufnahme und Festtafel') in every month except
  // July/August - this now includes June and December, unlike the old
  // baseline-loop-only 4th-Wednesday rule it replaces. Runs after
  // Beförderung/Aufnahme/Erhebung's own ceremony slots (so it works around
  // whatever they've already claimed) but before their precursor lectures
  // are placed (see pendingPrecursors above) and before Instruktion in I +
  // the baseline filler loop, so it gets first pick of whatever's left.
  // Skips a month that already has the Aufnahme ceremony (that's already a
  // TA I-family event); tries the 4th Wednesday, then 3rd, then 2nd, then
  // 5th - never the 1st, that's reserved for Gästeabend, assigned later.
  const taIEligibleMonths = [...new Set(monthOrder.map((m) => m.month).filter((m) => m !== 6 && m !== 7))];
  for (const month of taIEligibleMonths) {
    const ms = monthSlots(month);
    const alreadyHasCeremonyTaI = ms.some((s) => assigned.get(key(s)) === 'TA I mit Aufnahme und Festtafel');
    if (alreadyHasCeremonyTaI) continue;
    const candidate = [ms[3], ms[2], ms[1], ms[4]].find((s) => s && !s.blackout && !assigned.has(key(s)));
    assign(candidate, 'TA I mit Brudermahl');
  }

  // Only now place the precursor lectures collected above - after the
  // guarantee pass, so a month's guaranteed TA I never loses a three-way
  // race against two other months' spillover precursors (see
  // pendingPrecursors' own comment for the empirically-found case this
  // fixes).
  for (const { ceremonySlot, title } of pendingPrecursors) {
    assign(placePrecursor(ceremonySlot), title);
  }

  // 3 Wednesdays across the year, never a month's first or last, for
  // "Instruktion in I" - one per distinct month, scanned chronologically.
  const instruktionUsedMonths = new Set<number>();
  let instruktionCount = 0;
  for (const month of monthOrder.map((m) => m.month)) {
    if (instruktionCount >= 3) break;
    if (instruktionUsedMonths.has(month)) continue;
    const middle = monthSlots(month).slice(1, -1);
    const candidate = middle.find((s) => !s.blackout && !assigned.has(key(s)));
    if (!candidate) continue;
    instruktionUsedMonths.add(month);
    instruktionCount++;
    assign(candidate, 'Instruktion in I');
  }

  // Baseline rhythm + filler for everything still unassigned and not
  // blacked out: 1st Wednesday = Gästeabend, everything else cycles through
  // three filler activities. TA I's 4th-Wednesday assignment now happens
  // earlier, in the "TA I monthly guarantee" pass above (which also covers
  // June and December, unlike this loop's old dedicated branch) - so there's
  // no TA I-specific branch here any more.
  let fillerCounter = 0;
  function nextFillerTitle(): string {
    const kind = fillerCounter % 3;
    const n = fillerCounter;
    fillerCounter++;
    if (kind === 0) return 'Kerzengespräch';
    if (kind === 1) return 'Brüderliche Begegnung';
    const who = ALL_BROTHER_INITIALS[n % ALL_BROTHER_INITIALS.length]!;
    const topic = LECTURE_TOPICS[n % LECTURE_TOPICS.length]!;
    return `Vortrag von ${who} zum Thema ${topic}`;
  }

  for (const slot of slots) {
    if (slot.blackout) continue;
    const k = key(slot);
    if (assigned.has(k)) continue;
    if (slot.isFirst) {
      assigned.set(k, 'Gästeabend');
    } else {
      assigned.set(k, nextFillerTitle());
    }
  }

  return slots
    .filter((s) => assigned.has(key(s)))
    .map((s) => ({ date: s.date, time, title: assigned.get(key(s))! }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

async function seedEvents(creatorId: number): Promise<void> {
  const now = new Date();
  const schedule = buildDemoEventSchedule(now);
  await prisma.events.createMany({
    data: schedule.map((event) => ({
      title: event.title,
      date: event.date,
      time: event.time,
      location: 'Demo-Logenhaus',
      created_by_id: creatorId,
      uuid: randomUUID(),
      created_at: now,
      updated_at: now,
    })),
  });
}

async function seedSampleContent(creatorId: number, encryptedPassword: string): Promise<void> {
  const now = new Date();

  const district = await prisma.districts.create({
    data: { name: 'Demo-Distrikt', created_at: now, updated_at: now },
  });
  await prisma.lodges.create({
    data: { name: 'Demo-Loge Zur Eintracht', slug: 'demo-loge', district_id: district.id, created_at: now, updated_at: now },
  });

  await seedEvents(creatorId);
  await seedIcsSources(creatorId);

  const category = await prisma.categories.create({
    data: { name: 'Beispieldokumente', slug: 'beispieldokumente', uuid: randomUUID(), created_at: now, updated_at: now },
  });
  const directory = await prisma.directories.create({
    data: { name: 'Willkommen', slug: 'willkommen', category_id: category.id, uuid: randomUUID(), created_at: now, updated_at: now },
  });
  const content = Buffer.from('Willkommen in der Logenhelfer-Demo-Umgebung.\n', 'utf-8');
  const welcomeFile = await prisma.attached_files.create({
    data: {
      uuid: randomUUID(),
      filename: 'willkommen.txt',
      content,
      content_type: 'text/plain',
      content_length: content.length,
      directory_id: directory.id,
      uploader_id: creatorId,
      created_at: now,
      updated_at: now,
    },
  });
  await grantAllDegreesVisibility(category.id, directory.id, welcomeFile.id);

  const ritualeDirs = await seedCategoryWithDirectories('Rituale', 'rituale', [
    { name: 'Grad I', slug: 'grad-i', roleNames: ['EnteredApprentice'] },
    { name: 'Grad II', slug: 'grad-ii', roleNames: ['FellowCraft'] },
    { name: 'Grad III', slug: 'grad-iii', roleNames: ['MasterMason'] },
  ]);
  await seedRitualFiles(ritualeDirs, creatorId);

  await seedCategoryWithDirectories('Kommunikation', 'kommunikation', [
    { name: 'Logenrundbriefe', slug: 'logenrundbriefe', roleNames: ALL_DEGREE_ROLES },
    { name: 'Meisterbriefe', slug: 'meisterbriefe', roleNames: ['MasterMason'] },
  ]);

  const vortraegeDirs = await seedCategoryWithDirectories('Vorträge', 'vortraege', [
    { name: 'Vorträge', slug: 'vortraege-dir', roleNames: ALL_DEGREE_ROLES },
    { name: 'Zeichnungen', slug: 'zeichnungen', roleNames: ALL_DEGREE_ROLES },
  ]);
  await seedPlaceholderDocuments(
    vortraegeDirs,
    [
      { slug: 'vortraege-dir', title: 'Vortrag - Symbolik im Ritual' },
      { slug: 'zeichnungen', title: 'Zeichnung - Musterprotokoll' },
    ],
    ALL_DEGREE_ROLES,
    creatorId,
  );

  await seedBrothers(encryptedPassword);
  await seedSeekers();
  await seedAnnouncements(creatorId);
}

/**
 * Resets every app table and reseeds the fixed demo dataset - a no-op
 * unless DEMO_MODE is exactly 'true'. See
 * docs/superpowers/specs/2026-07-30-demo-environment-design.md for the
 * rationale (self-contained demo DB, reset on every deploy via API boot).
 */
export async function resetAndSeedDemoData(): Promise<void> {
  if (process.env.DEMO_MODE !== 'true') {
    return;
  }

  await truncateAllTables();
  const encryptedPassword = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_COST);
  const usersByEmail = await createDemoAccounts(encryptedPassword);
  await seedSampleContent(usersByEmail.get('admin@logenhelfer.de')!.id, encryptedPassword);
}
