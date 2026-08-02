import bcrypt from 'bcryptjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { DEMO_ACCOUNTS, brotherRoleNamesFor, resetAndSeedDemoData } from '../../src/lib/demoSeed.js';

const ORIGINAL_DEMO_MODE = process.env.DEMO_MODE;
const BROTHER_COUNT = 60;
const TOTAL_USER_COUNT = DEMO_ACCOUNTS.length + BROTHER_COUNT;

function setDemoMode(value: string | undefined): void {
  if (value === undefined) delete process.env.DEMO_MODE;
  else process.env.DEMO_MODE = value;
}

async function roleIdByName(name: string): Promise<number> {
  const role = await prisma.roles.findFirst({ where: { name } });
  expect(role).not.toBeNull();
  return role!.id;
}

async function userCountWithRole(roleId: number): Promise<number> {
  return prisma.user_roles.count({ where: { role_id: roleId } });
}

beforeEach(async () => {
  await resetDb();
});

afterEach(() => {
  setDemoMode(ORIGINAL_DEMO_MODE);
  vi.restoreAllMocks();
});

describe('resetAndSeedDemoData', () => {
  it('is a no-op when DEMO_MODE is unset', async () => {
    setDemoMode(undefined);
    const usersCreateSpy = vi.spyOn(prisma.users, 'create');

    // Insert a sentinel row to prove truncation does not happen
    const sentinelDistrict = await prisma.districts.create({
      data: { name: 'Sentinel District', created_at: new Date(), updated_at: new Date() },
    });

    await resetAndSeedDemoData();

    // Prove seeding was skipped
    expect(usersCreateSpy).not.toHaveBeenCalled();
    expect(await prisma.users.count()).toBe(0);

    // Prove truncation did not happen (sentinel row still exists)
    const sentinelStillExists = await prisma.districts.findUnique({ where: { id: sentinelDistrict.id } });
    expect(sentinelStillExists).not.toBeNull();
  });

  it('is a no-op when DEMO_MODE is not exactly "true"', async () => {
    setDemoMode('1');
    const usersCreateSpy = vi.spyOn(prisma.users, 'create');

    // Insert a sentinel row to prove truncation does not happen
    const sentinelDistrict = await prisma.districts.create({
      data: { name: 'Sentinel District', created_at: new Date(), updated_at: new Date() },
    });

    await resetAndSeedDemoData();

    // Prove seeding was skipped
    expect(usersCreateSpy).not.toHaveBeenCalled();
    expect(await prisma.users.count()).toBe(0);

    // Prove truncation did not happen (sentinel row still exists)
    const sentinelStillExists = await prisma.districts.findUnique({ where: { id: sentinelDistrict.id } });
    expect(sentinelStillExists).not.toBeNull();
  });

  it('creates the 13 canonical roles and accounts with the shared password, sharing one bcrypt hash', async () => {
    setDemoMode('true');

    await resetAndSeedDemoData();

    const hashes = new Set<string>();
    for (const { email, role } of DEMO_ACCOUNTS) {
      const user = await prisma.users.findUnique({ where: { email } });
      expect(user).not.toBeNull();
      expect(user!.accepted_gdpr).toBe(true);
      expect(user!.deleted).toBe(false);
      expect(await bcrypt.compare('Salomon333', user!.encrypted_password)).toBe(true);
      hashes.add(user!.encrypted_password);

      const roleRow = await prisma.roles.findFirst({ where: { name: role } });
      expect(roleRow).not.toBeNull();
      const userRoles = await prisma.user_roles.findMany({ where: { user_id: user!.id } });
      expect(userRoles.map((ur) => ur.role_id)).toContain(roleRow!.id);
    }
    // Every account's hash is byte-identical - one bcrypt.hash call reused,
    // not recomputed per account.
    expect(hashes.size).toBe(1);
  });

  it('running it twice in a row is idempotent - second run does not error or duplicate rows', async () => {
    setDemoMode('true');

    await resetAndSeedDemoData();
    await resetAndSeedDemoData();

    expect(await prisma.users.count()).toBe(TOTAL_USER_COUNT);
    // Every role used anywhere (13 canonical accounts + brothers' degree/
    // MemberOfCouncil roles + directory/category grants) is already among
    // the 13 canonical roles - ensureRole finds rather than duplicates.
    expect(await prisma.roles.count()).toBe(DEMO_ACCOUNTS.length);
  });

  it('seeds light sample content: a district+lodge and several events', async () => {
    setDemoMode('true');

    await resetAndSeedDemoData();

    expect(await prisma.districts.count()).toBe(1);
    expect(await prisma.lodges.count()).toBe(1);
    const lodge = await prisma.lodges.findFirst();
    const district = await prisma.districts.findFirst();
    expect(lodge!.district_id).toBe(district!.id);

    const events = await prisma.events.findMany();
    // ~4 Wednesdays/month across 12 months, minus the blacked-out weeks.
    expect(events.length).toBeGreaterThanOrEqual(35);
    expect(events.length).toBeLessThanOrEqual(52);
    for (const event of events) {
      expect(event.date.getUTCDay()).toBe(3); // every event is a Wednesday
      expect(event.time?.getUTCHours()).toBe(20);
      expect(event.location).toBe('Demo-Logenhaus');
    }
    // Fixed, once-a-year events each appear exactly once.
    expect(events.filter((e) => e.title === 'Sommerfest')).toHaveLength(1);
    expect(events.filter((e) => e.title === 'Johannisfest mit Tafel')).toHaveLength(1);
    expect(events.filter((e) => e.title === 'Mitgliederversammlung')).toHaveLength(1);
  });

  it('seeds the Beispieldokumente/Rituale/Kommunikation/Vorträge category+directory structure with correct visibility', async () => {
    setDemoMode('true');

    await resetAndSeedDemoData();

    expect(await prisma.categories.count()).toBe(4);
    expect(await prisma.directories.count()).toBe(8);

    const apprenticeRoleId = await roleIdByName('EnteredApprentice');
    const fellowCraftRoleId = await roleIdByName('FellowCraft');
    const masterMasonRoleId = await roleIdByName('MasterMason');

    async function directoryRoleIds(slug: string): Promise<number[]> {
      const directory = await prisma.directories.findFirst({ where: { slug } });
      expect(directory).not.toBeNull();
      const grants = await prisma.directory_roles.findMany({ where: { directory_id: directory!.id } });
      return grants.map((g) => g.role_id!).sort();
    }

    expect(await directoryRoleIds('grad-i')).toEqual([apprenticeRoleId].sort());
    expect(await directoryRoleIds('grad-ii')).toEqual([fellowCraftRoleId].sort());
    expect(await directoryRoleIds('grad-iii')).toEqual([masterMasonRoleId].sort());
    expect(await directoryRoleIds('meisterbriefe')).toEqual([masterMasonRoleId].sort());
    expect(await directoryRoleIds('logenrundbriefe')).toEqual([apprenticeRoleId, fellowCraftRoleId, masterMasonRoleId].sort());
    expect(await directoryRoleIds('vortraege-dir')).toEqual([apprenticeRoleId, fellowCraftRoleId, masterMasonRoleId].sort());
    expect(await directoryRoleIds('zeichnungen')).toEqual([apprenticeRoleId, fellowCraftRoleId, masterMasonRoleId].sort());
    expect(await directoryRoleIds('willkommen')).toEqual([apprenticeRoleId, fellowCraftRoleId, masterMasonRoleId].sort());

    // Rituale category must also be visible (category_roles = union of its
    // directories' roles), or the directories are unreachable in the UI
    // even though their own roles are correct.
    const ritualeCategory = await prisma.categories.findFirst({ where: { slug: 'rituale' } });
    const ritualeCategoryRoles = await prisma.category_roles.findMany({ where: { category_id: ritualeCategory!.id } });
    expect(ritualeCategoryRoles.map((r) => r.role_id!).sort()).toEqual([apprenticeRoleId, fellowCraftRoleId, masterMasonRoleId].sort());

    // willkommen.txt + 3 Ritual PDFs + 2 Vorträge/Zeichnungen placeholder PDFs.
    expect(await prisma.attached_files.count()).toBe(6);
    const allFiles = await prisma.attached_files.findMany();
    for (const file of allFiles) {
      // Old bug: both attached_files.create() calls omitted `uuid` (nullable
      // in the schema, no DB default), so every row's uuid was NULL. The
      // OpenAPI response schema requires uuid to be a string, so
      // GET /api/v1/attached_files?directory_slug=... 500'd for every
      // directory that had a file in it - Rituale/Willkommen appeared empty
      // in the UI even though the rows existed.
      expect(file.uuid).not.toBeNull();
      expect(file.uuid).toMatch(/^[0-9a-f-]{36}$/i);
    }

    const ritualFiles = allFiles.filter((f) => f.filename?.startsWith('Ritual'));
    expect(ritualFiles.map((f) => f.filename).sort()).toEqual(['Ritual I.pdf', 'Ritual II.pdf', 'Ritual III.pdf'].sort());
    for (const file of ritualFiles) {
      expect(file.content).not.toBeNull();
      expect(file.content_length).toBeGreaterThan(0);
    }

    // File visibility (attached_file_roles) is a separate grant from the
    // parent directory's directory_roles - canViewAttachedFile checks it
    // exclusively, so a directory being visible does NOT make its files
    // visible. Without these grants the Grad/Willkommen directories would
    // render as empty for every non-elevated demo login.
    async function fileRoleIds(filename: string): Promise<number[]> {
      const file = await prisma.attached_files.findFirst({ where: { filename } });
      expect(file).not.toBeNull();
      const grants = await prisma.attached_file_roles.findMany({ where: { attached_file_id: file!.id } });
      return grants.map((g) => g.role_id!).sort();
    }
    expect(await fileRoleIds('Ritual I.pdf')).toEqual([apprenticeRoleId].sort());
    expect(await fileRoleIds('Ritual II.pdf')).toEqual([fellowCraftRoleId].sort());
    expect(await fileRoleIds('Ritual III.pdf')).toEqual([masterMasonRoleId].sort());
    expect(await fileRoleIds('willkommen.txt')).toEqual([apprenticeRoleId, fellowCraftRoleId, masterMasonRoleId].sort());

    // Vorträge/Zeichnungen previously seeded as empty directories - each
    // must contain one exemplary document, visible to every degree.
    const vortraegeDoc = await prisma.attached_files.findFirst({ where: { filename: { contains: 'Vortrag' } } });
    const zeichnungenDoc = await prisma.attached_files.findFirst({ where: { filename: { contains: 'Zeichnung' } } });
    expect(vortraegeDoc).not.toBeNull();
    expect(zeichnungenDoc).not.toBeNull();
    expect(await fileRoleIds(vortraegeDoc!.filename!)).toEqual([apprenticeRoleId, fellowCraftRoleId, masterMasonRoleId].sort());
    expect(await fileRoleIds(zeichnungenDoc!.filename!)).toEqual([apprenticeRoleId, fellowCraftRoleId, masterMasonRoleId].sort());
  });

  it('seeds 60 brother users with the requested degree/MemberOfCouncil distribution', async () => {
    setDemoMode('true');

    await resetAndSeedDemoData();

    expect(await prisma.users.count()).toBe(TOTAL_USER_COUNT);

    const apprenticeRoleId = await roleIdByName('EnteredApprentice');
    const fellowCraftRoleId = await roleIdByName('FellowCraft');
    const masterMasonRoleId = await roleIdByName('MasterMason');
    const memberOfCouncilRoleId = await roleIdByName('MemberOfCouncil');

    // Every brother now holds one user_roles row per degree they've ever
    // attained (EnteredApprentice -> FellowCraft -> MasterMason), mirroring
    // exactly how api/src/routes/members.ts's applyDegreeDates/setDegreeByName
    // already accumulates rows for real, promoted members - so "has an
    // EnteredApprentice row" no longer means "current degree is
    // EnteredApprentice", it means "has ever been one". Counts below are the
    // brother population who reached at least that degree, plus all 13
    // DEMO_ACCOUNTS (Task 10): every account gets an EnteredApprentice row,
    // every account except lehrling@ also gets FellowCraft, and every
    // account except lehrling@/geselle@ also gets MasterMason (meister@ plus
    // all 10 officer accounts, who are assumed master-mason-level).
    expect(await userCountWithRole(apprenticeRoleId)).toBe(60 + 13);
    expect(await userCountWithRole(fellowCraftRoleId)).toBe(56 + 12);
    expect(await userCountWithRole(masterMasonRoleId)).toBe(50 + 11);
    // +1 for the canonical beamtenrat@ account's own MemberOfCouncil
    // administrative role row (unrelated to the degree rows above).
    expect(await userCountWithRole(memberOfCouncilRoleId)).toBe(2 + 1);

    const canonicalEmails = new Set(DEMO_ACCOUNTS.map((a) => a.email));
    const brothers = (await prisma.users.findMany()).filter((u) => !canonicalEmails.has(u.email));
    expect(brothers).toHaveLength(BROTHER_COUNT);

    // bcrypt.compare at cost 12 is genuinely expensive - the "creates the 13
    // canonical roles and accounts" test above already proves the shared
    // hash is a valid bcrypt hash of 'Salomon333' via one real bcrypt.compare
    // call. Calling it again per brother (60 more times) is redundant
    // crypto work that once pushed this test past its 15s timeout on a
    // CPU-constrained remote test-gate run - a plain string-equality check
    // against an already-verified canonical hash proves reuse just as well.
    const admin = await prisma.users.findUnique({ where: { email: 'admin@logenhelfer.de' } });
    const allAddresses = await prisma.addresses.findMany({ where: { addressable_type: 'User' } });
    const privateByUserId = new Map(allAddresses.filter((a) => a.type_of_address === 0).map((a) => [a.addressable_id, a]));
    const businessByUserId = new Map(allAddresses.filter((a) => a.type_of_address === 1).map((a) => [a.addressable_id, a]));

    const brotherEmails = new Set<string>();
    let businessAddressCount = 0;
    for (const brother of brothers) {
      expect(brother.email).toMatch(/^[a-z]+\.[a-z]+@logenhelfer\.de$/);
      brotherEmails.add(brother.email);
      expect(brother.encrypted_password).toBe(admin!.encrypted_password);
      expect(brother.matriculation_number).toBeGreaterThanOrEqual(800);
      expect(brother.matriculation_number).toBeLessThanOrEqual(1000);

      const priv = privateByUserId.get(brother.id);
      expect(priv).not.toBeUndefined();
      expect(priv!.email).toBe(brother.email);
      expect(priv!.city).toBe('Bremen');
      expect(priv!.street1).toBeTruthy();
      expect(priv!.zip).toMatch(/^\d{5}$/);
      expect(priv!.phone).toBeTruthy();
      expect(priv!.mobile).toBeTruthy();

      const business = businessByUserId.get(brother.id);
      if (business) {
        businessAddressCount++;
        expect(business.city).toBe('Bremen');
        expect(business.street1).toBeTruthy();
        expect(business.street1).not.toBe(priv!.street1);
        expect(business.phone).toBeTruthy();
        expect(business.phone).not.toBe(priv!.phone);
      }
    }
    // All 60 emails are unique.
    expect(brotherEmails.size).toBe(BROTHER_COUNT);

    // Every matriculation_number is unique (the DB's own @unique constraint
    // already enforces this - createMany would have thrown otherwise - but
    // asserting it here documents the requirement directly).
    expect(new Set(brothers.map((b) => b.matriculation_number)).size).toBe(BROTHER_COUNT);

    // At least 40% (24 of 60) have a business address.
    expect(businessAddressCount).toBeGreaterThanOrEqual(Math.ceil(BROTHER_COUNT * 0.4));

    // No brother shares a firstname or a lastname with another brother -
    // the old 10x6 Cartesian product repeated each firstname 6x and each
    // lastname 10x (e.g. six different "Michael"s, ten different "Müller"s).
    expect(new Set(brothers.map((b) => b.firstname)).size).toBe(BROTHER_COUNT);
    expect(new Set(brothers.map((b) => b.lastname)).size).toBe(BROTHER_COUNT);
  });

  it('gives every brother stacked historical degree-date user_roles rows matching their current degree', async () => {
    setDemoMode('true');

    await resetAndSeedDemoData();

    const apprenticeRoleId = await roleIdByName('EnteredApprentice');
    const fellowCraftRoleId = await roleIdByName('FellowCraft');
    const masterMasonRoleId = await roleIdByName('MasterMason');

    const canonicalEmails = new Set(DEMO_ACCOUNTS.map((a) => a.email));
    const brothers = (await prisma.users.findMany()).filter((u) => !canonicalEmails.has(u.email));

    const monthMs = 30 * 24 * 60 * 60 * 1000;

    for (const brother of brothers) {
      const roles = await prisma.user_roles.findMany({ where: { user_id: brother.id } });
      const entered = roles.find((r) => r.role_id === apprenticeRoleId);
      const fellowCraft = roles.find((r) => r.role_id === fellowCraftRoleId);
      const masterMason = roles.find((r) => r.role_id === masterMasonRoleId);

      expect(entered).not.toBeUndefined();
      expect(entered!.role_added_at).not.toBeNull();

      if (masterMason) {
        expect(fellowCraft).not.toBeUndefined();
        expect(fellowCraft!.role_added_at).not.toBeNull();
        expect(masterMason.role_added_at).not.toBeNull();
        const gapEaToFc = (fellowCraft!.role_added_at!.getTime() - entered!.role_added_at!.getTime()) / monthMs;
        const gapFcToMm = (masterMason.role_added_at!.getTime() - fellowCraft!.role_added_at!.getTime()) / monthMs;
        expect(gapEaToFc).toBeGreaterThanOrEqual(7.5);
        expect(gapEaToFc).toBeLessThanOrEqual(14.5);
        expect(gapFcToMm).toBeGreaterThanOrEqual(7.5);
        expect(gapFcToMm).toBeLessThanOrEqual(14.5);
      } else if (fellowCraft) {
        expect(fellowCraft.role_added_at).not.toBeNull();
        const gapEaToFc = (fellowCraft.role_added_at!.getTime() - entered!.role_added_at!.getTime()) / monthMs;
        expect(gapEaToFc).toBeGreaterThanOrEqual(7.5);
        expect(gapEaToFc).toBeLessThanOrEqual(14.5);
      } else {
        expect(fellowCraft).toBeUndefined();
        expect(masterMason).toBeUndefined();
      }
    }
  });

  it('gives the 13 fixed-role accounts realistic, distinct German names instead of the raw English role identifier', async () => {
    setDemoMode('true');

    await resetAndSeedDemoData();

    const users = await Promise.all(DEMO_ACCOUNTS.map((a) => prisma.users.findUniqueOrThrow({ where: { email: a.email } })));

    for (const [index, user] of users.entries()) {
      // Old bug: firstname was literally the internal role constant
      // (e.g. 'EnteredApprentice') and lastname was empty.
      expect(user.firstname).not.toBe(DEMO_ACCOUNTS[index]!.role);
      expect(user.firstname).toMatch(/^[A-ZÄÖÜ][a-zäöüß]+$/);
      expect(user.lastname).toMatch(/^[A-ZÄÖÜ][a-zäöüß]+$/);
    }
    expect(new Set(users.map((u) => u.firstname)).size).toBe(DEMO_ACCOUNTS.length);
    expect(new Set(users.map((u) => u.lastname)).size).toBe(DEMO_ACCOUNTS.length);

    // Names must not collide with the 60 brothers either.
    const canonicalEmails = new Set(DEMO_ACCOUNTS.map((a) => a.email));
    const brothers = (await prisma.users.findMany()).filter((u) => !canonicalEmails.has(u.email));
    const brotherFirstnames = new Set(brothers.map((b) => b.firstname));
    const brotherLastnames = new Set(brothers.map((b) => b.lastname));
    for (const user of users) {
      expect(brotherFirstnames.has(user.firstname)).toBe(false);
      expect(brotherLastnames.has(user.lastname)).toBe(false);
    }
  });

  it('gives all 13 DEMO_ACCOUNTS a matriculation number, a Bremen address, and the correct degree-date exceptions', async () => {
    setDemoMode('true');

    await resetAndSeedDemoData();

    const apprenticeRoleId = await roleIdByName('EnteredApprentice');
    const fellowCraftRoleId = await roleIdByName('FellowCraft');
    const masterMasonRoleId = await roleIdByName('MasterMason');

    async function degreeDatesFor(userId: number) {
      const roles = await prisma.user_roles.findMany({ where: { user_id: userId } });
      return {
        entered: roles.find((r) => r.role_id === apprenticeRoleId)?.role_added_at ?? null,
        fellow: roles.find((r) => r.role_id === fellowCraftRoleId)?.role_added_at ?? null,
        master: roles.find((r) => r.role_id === masterMasonRoleId)?.role_added_at ?? null,
      };
    }

    for (const account of DEMO_ACCOUNTS) {
      const user = await prisma.users.findUniqueOrThrow({ where: { email: account.email } });
      expect(user.matriculation_number).toBeGreaterThanOrEqual(800);
      expect(user.matriculation_number).toBeLessThanOrEqual(1000);

      const address = await prisma.addresses.findFirst({ where: { addressable_type: 'User', addressable_id: user.id } });
      expect(address).not.toBeNull();
      expect(address!.city).toBe('Bremen');
      expect(address!.phone).toBeTruthy();
      expect(address!.mobile).toBeTruthy();

      const { entered, fellow, master } = await degreeDatesFor(user.id);
      if (account.email === 'lehrling@logenhelfer.de') {
        expect(entered).not.toBeNull();
        expect(fellow).toBeNull();
        expect(master).toBeNull();
      } else if (account.email === 'geselle@logenhelfer.de') {
        expect(entered).not.toBeNull();
        expect(fellow).not.toBeNull();
        expect(master).toBeNull();
      } else {
        // meister@ and all 10 officer accounts: all three dates.
        expect(entered).not.toBeNull();
        expect(fellow).not.toBeNull();
        expect(master).not.toBeNull();
        expect(fellow!.getTime()).toBeGreaterThan(entered!.getTime());
        expect(master!.getTime()).toBeGreaterThan(fellow!.getTime());
      }
    }

    // Every matriculation number across all 73 users (13 accounts + 60
    // brothers) stays unique.
    const allUsers = await prisma.users.findMany();
    expect(new Set(allUsers.map((u) => u.matriculation_number)).size).toBe(allUsers.length);
  });

  it('gives every role a German display_name, never the raw English role identifier', async () => {
    setDemoMode('true');

    await resetAndSeedDemoData();

    const roles = await prisma.roles.findMany();
    expect(roles.length).toBeGreaterThan(0);
    for (const role of roles) {
      // Old bug: ensureRole() set display_name to the raw internal `name`
      // (e.g. role.display_name === 'NetDelegate'), leaking an English
      // office title into the German UI wherever display_name is rendered.
      expect(role.display_name).not.toBe(role.name);
      expect(role.display_name).toMatch(/^[A-ZÄÖÜ]/);
    }
  });

  it('seeds 10 seekers spanning declined/accepted/inactive/active states', async () => {
    setDemoMode('true');

    await resetAndSeedDemoData();

    const seekers = await prisma.seekers.findMany();
    expect(seekers).toHaveLength(10);

    const declined = seekers.filter((s) => s.status === 1000);
    const accepted = seekers.filter((s) => s.status === 100);
    const inactive = seekers.filter((s) => s.invite === false && s.status !== 1000 && s.status !== 100);
    const active = seekers.filter((s) => s.invite === true && s.status !== 1000 && s.status !== 100);

    expect(declined).toHaveLength(1);
    expect(accepted).toHaveLength(1);
    expect(inactive).toHaveLength(2);
    expect(active).toHaveLength(6);
    // Most of the active ones have distinct statuses.
    expect(new Set(active.map((s) => s.status)).size).toBe(active.length);

    for (const seeker of seekers) {
      const address = await prisma.addresses.findFirst({ where: { addressable_type: 'Seeker', addressable_id: seeker.id } });
      expect(address).not.toBeNull();
      expect(address!.email).toMatch(/^[a-z]+\.[a-z]+@logenhelfer\.de$/);
      expect(address!.phone).toBeTruthy();
    }
  });

  it('seeds 10 announcements', async () => {
    setDemoMode('true');

    await resetAndSeedDemoData();

    const announcements = await prisma.announcements.findMany();
    expect(announcements).toHaveLength(10);
    expect(new Set(announcements.map((a) => a.title)).size).toBe(10);

    const admin = await prisma.users.findUnique({ where: { email: 'admin@logenhelfer.de' } });
    for (const announcement of announcements) {
      expect(announcement.created_by_id).toBe(admin!.id);
      expect(announcement.message_body).toBeTruthy();
    }
  });

  it('seeds 3 external ICS calendar sources for real football clubs', async () => {
    setDemoMode('true');

    await resetAndSeedDemoData();

    const sources = await prisma.external_event_ics_sources.findMany();
    expect(sources).toHaveLength(3);

    const byName = new Map(sources.map((s) => [s.name, s]));
    expect(byName.get('Werder Bremen')?.url).toBe('https://www.bundesliga-statistik.de/kalender.php?s=0&m=3&w=0&t=0');
    expect(byName.get('1. FC Köln')?.url).toBe('https://www.bundesliga-statistik.de/kalender.php?s=0&m=15&w=0&t=0');
    expect(byName.get('Borussia Dortmund')?.url).toBe('https://www.bundesliga-statistik.de/kalender.php?s=0&m=11&w=0&t=0');

    const admin = await prisma.users.findUnique({ where: { email: 'admin@logenhelfer.de' } });
    for (const source of sources) {
      expect(source.created_by_id).toBe(admin!.id);
      expect(source.uuid).toMatch(/^[0-9a-f-]{36}$/i);
    }
  });
});

// Regression coverage for a finding from the 2026-08-01 whole-branch review:
// seedBrothers() used to derive its roleIdByName solely from whichever
// role/extraRole values happened to appear among the 60 brother specs. That
// worked "by luck" today (4 EnteredApprentice + 6 FellowCraft + 50
// MasterMason - all three degrees happen to appear), but degreeRoleRowsFor
// requires roleIdByName to contain EVERY degree at or below a brother's
// final degree, so if the demo distribution ever shifted to zero brothers
// at some degree (e.g. all promoted past EnteredApprentice), the missing
// map entry would silently produce a `role_id: undefined` row and crash
// user_roles.createMany. brotherRoleNamesFor() was pulled out of
// seedBrothers specifically so this invariant - "every ALL_DEGREE_ROLES
// entry is always included, regardless of the specs passed in" - can be
// tested directly, without needing to change the real 60-brother
// distribution (which the "seeds 60 brother users ..." and "gives every
// brother stacked historical degree-date user_roles rows ..." tests above
// already exercise, but only for today's lucky distribution).
describe('brotherRoleNamesFor', () => {
  it('always includes every ALL_DEGREE_ROLES entry, even if no spec passed in uses a given degree', () => {
    // Deliberately omits EnteredApprentice entirely - the exact shape of bug
    // that would previously have left 'EnteredApprentice' out of the map.
    const specsWithNoApprentices = [
      { role: 'FellowCraft' },
      { role: 'MasterMason', extraRole: 'MemberOfCouncil' },
      { role: 'MasterMason' },
    ];

    const names = brotherRoleNamesFor(specsWithNoApprentices);

    expect(names).toEqual(expect.arrayContaining(['EnteredApprentice', 'FellowCraft', 'MasterMason', 'MemberOfCouncil']));
  });

  it('includes every ALL_DEGREE_ROLES entry even for an empty spec list', () => {
    expect(brotherRoleNamesFor([])).toEqual(expect.arrayContaining(['EnteredApprentice', 'FellowCraft', 'MasterMason']));
  });

  it('does not duplicate a degree role name that also appears as an extraRole-less spec role', () => {
    const specs = [{ role: 'MasterMason' }, { role: 'MasterMason' }, { role: 'EnteredApprentice' }];

    const names = brotherRoleNamesFor(specs);

    expect(names.filter((n) => n === 'MasterMason')).toHaveLength(1);
    expect(names.filter((n) => n === 'EnteredApprentice')).toHaveLength(1);
  });

  it('includes distinct extraRole names alongside the always-present degree roles', () => {
    const specs = [
      { role: 'MasterMason', extraRole: 'MemberOfCouncil' },
      { role: 'MasterMason', extraRole: 'MemberOfCouncil' },
    ];

    const names = brotherRoleNamesFor(specs);

    expect(names.sort()).toEqual(['EnteredApprentice', 'FellowCraft', 'MasterMason', 'MemberOfCouncil'].sort());
  });
});
