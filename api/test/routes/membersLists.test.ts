import { randomUUID } from 'node:crypto';

import type { users } from '../../src/generated/prisma/client.js';
import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { issueAccessToken, verifyAccessToken } from '../../src/auth/jwt.js';
import { canManageUserAsUserAdmin, canViewUserInDirectory, loadUserRoleNames } from '../../src/authz/ability.js';
import { appConfig, KNOWN_KEYS } from '../../src/lib/appConfig.js';
import { apiErrorHandler } from '../../src/lib/errors.js';
import membersRouter from '../../src/routes/members.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

// Port of the LIST/EXPORT/IMPERSONATE portion of
// rails-app/spec/requests/api/v1/members_spec.rb (19 of that file's 58
// examples - phone_list, birthday_list, members_of_council, export_data,
// csv_export_data, record_export, and :uuid/impersonate). Basic index/show/
// create/update/destroy CRUD examples are ported separately into
// api/test/routes/members.test.ts - not duplicated here.
//
// Like seekers.test.ts/roles.test.ts, this asserts on the exact response
// shape directly rather than delegating to the OpenAPI contract validator
// (that's wired in at the real-app level, not per-route-test).

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/v1/members', membersRouter);
  app.use(apiErrorHandler);
  return app;
}

const app = buildApp();

function authHeaders(user: { id: number }): { Authorization: string } {
  return { Authorization: `Bearer ${issueAccessToken(user.id)}` };
}

async function createRole(
  name: string,
  overrides: Partial<{ display_name: string; administrational_role: boolean; group: boolean; ordering_number: number; email: string }> = {},
): Promise<{ id: number; name: string | null; display_name: string | null }> {
  const now = new Date();
  return prisma.roles.create({
    data: {
      name,
      display_name: overrides.display_name ?? name,
      administrational_role: overrides.administrational_role,
      group: overrides.group,
      ordering_number: overrides.ordering_number,
      email: overrides.email,
      created_at: now,
      updated_at: now,
    },
  });
}

async function assignRole(userId: number, roleId: number, roleAddedAt: Date | null = null): Promise<void> {
  const now = new Date();
  await prisma.user_roles.create({ data: { user_id: userId, role_id: roleId, role_added_at: roleAddedAt, created_at: now, updated_at: now } });
}

/** `createUser()` alone leaves `uuid` null (the factory only sets NOT NULL columns) - every fixture here needs one, since these routes look users up by uuid. */
async function createTaggedUser(overrides: Partial<Parameters<typeof createUser>[0]> = {}): Promise<users> {
  return createUser({ uuid: randomUUID(), ...overrides });
}

async function createUserWithRole(roleName: string, overrides: Partial<Parameters<typeof createUser>[0]> = {}): Promise<users> {
  const user = await createTaggedUser(overrides);
  const role = await createRole(roleName);
  await assignRole(user.id, role.id);
  return user;
}

function yearsAgoUtc(years: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear() - years, now.getUTCMonth(), now.getUTCDate()));
}

function addYearsUtc(date: Date, years: number): Date {
  const copy = new Date(date.getTime());
  copy.setUTCFullYear(copy.getUTCFullYear() + years);
  return copy;
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** A date_of_birth whose month/day falls `daysFromToday` from now (birth year arbitrary/in the past) - for exercising the birthday list's "soonest upcoming, wraps around the year" default sort. */
function dobForUpcomingDays(daysFromToday: number, birthYearsAgo = 30): Date {
  const now = new Date();
  const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysFromToday));
  return new Date(Date.UTC(target.getUTCFullYear() - birthYearsAgo, target.getUTCMonth(), target.getUTCDate()));
}

/** A plain member holding EnteredApprentice (mirrors the Rails spec's shared `member` fixture). `role_added_at` defaults to 1 year ago, same as the Rails fixture. */
async function createMember(overrides: Partial<Parameters<typeof createUser>[0]> = {}, enteredApprenticeSince: Date = yearsAgoUtc(1)): Promise<users> {
  const user = await createTaggedUser(overrides);
  const role = await createRole('EnteredApprentice', { display_name: 'Lehrling' });
  await assignRole(user.id, role.id, enteredApprenticeSince);
  return user;
}

/**
 * Port of the spec's `find_export_row` helper - these two endpoints are
 * hard-clamped to per_page<=100 server-side, and the shared test DB isn't
 * guaranteed to put a given fixture on page 0 once enough rows exist, so
 * page through (bounded by row_count) rather than assuming a single page.
 */
async function findExportRow(path: string, uuid: string, headers: { Authorization: string }): Promise<{ res: request.Response; row: Record<string, unknown> | undefined }> {
  let page = 0;
  for (;;) {
    // eslint-disable-next-line no-await-in-loop -- sequential pagination, mirrors the Ruby loop this ports.
    const res = await request(app).get(path).query({ page, per_page: 100 }).set(headers);
    const rows = (res.body.rows as Array<Record<string, unknown>>) ?? [];
    const row = rows.find((r) => r.uuid === uuid);
    const rowCount = (res.body.row_count as number) ?? 0;
    if (row || rows.length === 0 || (page + 1) * 100 >= rowCount) {
      return { res, row };
    }
    page += 1;
  }
}

describe('Members API - lists/export/impersonate', () => {
  let member: users;
  let admin: users;
  let userAdmin: users;

  beforeEach(async () => {
    await resetDb();
    // appConfig caches records process-wide (mirrors Rails' AppConfig
    // module) - resetDb() truncates app_config_adapters but doesn't by
    // itself invalidate that in-memory cache, so every known key is
    // explicitly dirtied to force a fresh (post-truncate, default) read.
    // Same pattern as public.test.ts.
    for (const key of Object.keys(KNOWN_KEYS)) appConfig.dirty(key);

    member = await createMember();
    admin = await createUserWithRole('Admin');
    userAdmin = await createUserWithRole('UserAdmin');
  });

  // Net-new coverage for this task - GET /api/v1/members' basic list route
  // itself isn't otherwise exercised in this file (see this file's header
  // comment: index/show/create/update/destroy CRUD lives in members.test.ts
  // instead), but the task brief specifically targets this file, and the
  // shared `admin` fixture from the outer beforeEach is already a real
  // Admin - reusing it here avoids duplicating a createAdminUser helper.
  describe('GET /api/v1/members - mfa_enabled field', () => {
    it('includes mfa_enabled per row, batched (no N+1)', async () => {
      const withMfa = await createTaggedUser();
      const withoutMfa = await createTaggedUser();
      const now = new Date();
      await prisma.mfa_totp_credentials.create({
        data: { user_id: withMfa.id, encrypted_secret: 'x', verified_at: now, created_at: now, updated_at: now },
      });

      const res = await request(app).get('/api/v1/members').query({ per_page: 100 }).set(authHeaders(admin));

      expect(res.status).toBe(200);
      const rows = res.body.rows as Array<{ uuid: string; mfa_enabled: boolean }>;
      expect(rows.find((r) => r.uuid === withMfa.uuid)?.mfa_enabled).toBe(true);
      expect(rows.find((r) => r.uuid === withoutMfa.uuid)?.mfa_enabled).toBe(false);
    });
  });

  describe('GET /api/v1/members/phone_list', () => {
    it('lists members with their contact numbers', async () => {
      const now = new Date();
      await prisma.addresses.create({
        data: {
          addressable_id: member.id,
          addressable_type: 'User',
          purpose: 'privat',
          phone: '+49 (30) 1234567',
          type_of_address: 0,
          deleted: false,
          created_at: now,
          updated_at: now,
        },
      });

      const res = await request(app).get('/api/v1/members/phone_list').set(authHeaders(member));

      expect(res.status).toBe(200);
      const row = (res.body.rows as Array<{ uuid: string; phone: string }>).find((r) => r.uuid === member.uuid);
      expect(row?.phone).toContain('+49 (30) 1234567');
    });

    it('defaults to sorting by lastname ascending', async () => {
      await prisma.users.update({ where: { id: member.id }, data: { lastname: 'Zeta' } });
      await prisma.users.update({ where: { id: admin.id }, data: { lastname: 'Alpha' } });

      const res = await request(app).get('/api/v1/members/phone_list').set(authHeaders(member));
      const uuids = (res.body.rows as Array<{ uuid: string }>).map((r) => r.uuid);
      expect(uuids.indexOf(admin.uuid!)).toBeLessThan(uuids.indexOf(member.uuid!));
    });

    it('sorts by lastname descending via ?sort=-lastname', async () => {
      await prisma.users.update({ where: { id: member.id }, data: { lastname: 'Zeta' } });
      await prisma.users.update({ where: { id: admin.id }, data: { lastname: 'Alpha' } });

      const res = await request(app).get('/api/v1/members/phone_list?sort=-lastname').set(authHeaders(member));
      const uuids = (res.body.rows as Array<{ uuid: string }>).map((r) => r.uuid);
      expect(uuids.indexOf(member.uuid!)).toBeLessThan(uuids.indexOf(admin.uuid!));
    });

    it('falls back to the default sort for an unknown/malicious ?sort= value, without erroring', async () => {
      const res = await request(app).get('/api/v1/members/phone_list?sort=deleted;DROP TABLE users;--').set(authHeaders(member));
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/members/birthday_list', () => {
    it('lists members with age and jubilee dates', async () => {
      const dob = yearsAgoUtc(30);
      const eas = yearsAgoUtc(25);
      await prisma.users.update({ where: { id: member.id }, data: { date_of_birth: dob } });
      await prisma.user_roles.updateMany({ where: { user_id: member.id }, data: { role_added_at: eas } });

      const res = await request(app).get('/api/v1/members/birthday_list').set(authHeaders(member));

      expect(res.status).toBe(200);
      const row = (res.body.rows as Array<{ uuid: string; age: number; twentyfifth_jubilee: string | null }>).find((r) => r.uuid === member.uuid);
      expect(row?.age).toBe(30);
      expect(row?.twentyfifth_jubilee).toBeTruthy();
      expect(row?.twentyfifth_jubilee).toBe(formatDateOnly(addYearsUtc(eas, 25)));
    });

    it('defaults to soonest-upcoming-birthday-first, wrapping around the year', async () => {
      const soon = await createMember();
      const far = await createMember();
      const justPassed = await createMember();
      await prisma.users.update({ where: { id: soon.id }, data: { date_of_birth: dobForUpcomingDays(5) } });
      await prisma.users.update({ where: { id: far.id }, data: { date_of_birth: dobForUpcomingDays(60) } });
      // A birthday that fell yesterday has already passed this year, so the
      // "soonest upcoming" distance wraps to next year (~364 days) rather
      // than sorting first as a naive "most recent date" sort would.
      await prisma.users.update({ where: { id: justPassed.id }, data: { date_of_birth: dobForUpcomingDays(-1) } });

      const res = await request(app).get('/api/v1/members/birthday_list?per_page=100').set(authHeaders(member));

      expect(res.status).toBe(200);
      const uuids = (res.body.rows as Array<{ uuid: string }>).map((r) => r.uuid);
      const soonIdx = uuids.indexOf(soon.uuid!);
      const farIdx = uuids.indexOf(far.uuid!);
      const justPassedIdx = uuids.indexOf(justPassed.uuid!);
      expect(soonIdx).toBeGreaterThanOrEqual(0);
      expect(soonIdx).toBeLessThan(farIdx);
      expect(farIdx).toBeLessThan(justPassedIdx);
    });

    it('sorts by lastname ascending/descending via ?sort=', async () => {
      await prisma.users.update({ where: { id: member.id }, data: { lastname: 'Aaronson' } });
      await prisma.users.update({ where: { id: admin.id }, data: { lastname: 'Zimmermann' } });

      const asc = await request(app).get('/api/v1/members/birthday_list?sort=lastname&per_page=100').set(authHeaders(member));
      const ascLastnames = (asc.body.rows as Array<{ lastname: string }>).map((r) => r.lastname);
      expect(ascLastnames.indexOf('Aaronson')).toBeLessThan(ascLastnames.indexOf('Zimmermann'));

      const desc = await request(app).get('/api/v1/members/birthday_list?sort=-lastname&per_page=100').set(authHeaders(member));
      const descLastnames = (desc.body.rows as Array<{ lastname: string }>).map((r) => r.lastname);
      expect(descLastnames.indexOf('Zimmermann')).toBeLessThan(descLastnames.indexOf('Aaronson'));
    });

    it('sorts members without a date_of_birth to the end regardless of direction', async () => {
      await prisma.users.update({ where: { id: member.id }, data: { date_of_birth: dobForUpcomingDays(3) } });
      // admin/userAdmin both have no date_of_birth (never set in beforeEach).

      const res = await request(app).get('/api/v1/members/birthday_list?per_page=100').set(authHeaders(member));
      const uuids = (res.body.rows as Array<{ uuid: string }>).map((r) => r.uuid);
      expect(uuids.indexOf(member.uuid!)).toBeLessThan(uuids.indexOf(admin.uuid!));
      expect(uuids.indexOf(member.uuid!)).toBeLessThan(uuids.indexOf(userAdmin.uuid!));
    });

    it('falls back to the default sort for an unknown/malicious ?sort= value, without erroring', async () => {
      const res = await request(app).get('/api/v1/members/birthday_list?sort=deleted;DROP TABLE users;--').set(authHeaders(member));
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/members/members_of_council', () => {
    it('lists positions that currently have a holder', async () => {
      const council = await createRole(`CouncilPosition${Date.now()}`, {
        display_name: 'Ratsposten',
        administrational_role: false,
        group: false,
        ordering_number: 1,
        email: 'rat@example.org',
      });
      await assignRole(member.id, council.id);

      const res = await request(app).get('/api/v1/members/members_of_council').set(authHeaders(member));

      expect(res.status).toBe(200);
      const row = (res.body.rows as Array<{ role_display_name: string; holder_uuid: string }>).find((r) => r.role_display_name === council.display_name);
      expect(row?.holder_uuid).toBe(member.uuid);
    });

    it('lists every holder of a position held by more than one person', async () => {
      // Regression test: a role_id can be assigned to multiple user_roles
      // rows (no unique constraint), but the handler used to look up the
      // holder with findFirst - which silently dropped every additional
      // holder past the first one it happened to find.
      const deputyMaster = await createRole(`DeputyMaster${Date.now()}`, {
        display_name: 'zug. MvSt',
        administrational_role: false,
        group: false,
        ordering_number: 2,
      });
      const secondHolder = await createTaggedUser();
      await assignRole(member.id, deputyMaster.id);
      await assignRole(secondHolder.id, deputyMaster.id);

      const res = await request(app).get('/api/v1/members/members_of_council').set(authHeaders(member));

      expect(res.status).toBe(200);
      const rows = (res.body.rows as Array<{ role_display_name: string; holder_uuid: string }>).filter(
        (r) => r.role_display_name === deputyMaster.display_name,
      );
      expect(rows.map((r) => r.holder_uuid).sort()).toEqual([member.uuid, secondHolder.uuid].sort());
    });
  });

  describe('GET /api/v1/members/export_data', () => {
    it('returns full directory fields for any authenticated member', async () => {
      await prisma.users.update({ where: { id: member.id }, data: { matriculation_number: 5001 } });
      const now = new Date();
      await prisma.addresses.create({
        data: {
          addressable_id: member.id,
          addressable_type: 'User',
          type_of_address: 1,
          purpose: 'business',
          street1: 'Hauptstr. 1',
          street2: '',
          street3: '',
          zip: '12345',
          city: 'Berlin',
          phone: '',
          fax: '',
          mobile: '',
          email: '',
          deleted: false,
          created_at: now,
          updated_at: now,
        },
      });

      const { row } = await findExportRow('/api/v1/members/export_data', member.uuid ?? '', authHeaders(member));

      expect(row).not.toBeUndefined();
      expect(row?.matriculation_number).toBe(5001);
      expect((row?.business_address as { street: string } | null)?.street).toBe('Hauptstr. 1');
      expect(Array.isArray(row?.positions)).toBe(true);
    });

    it('hides admin members from a plain member when AppConfig[:show_admins] is false', async () => {
      // Regression test (post-review Critical finding): export_data used to
      // slice the raw, unfiltered scope directly and report row_count as
      // scope.count, so a non-admin caller received every admin's full
      // export row even when AppConfig[:show_admins] was off.
      await appConfig.set('show_admins', false);

      const { row: adminRow } = await findExportRow('/api/v1/members/export_data', admin.uuid ?? '', authHeaders(member));
      const { row: memberRow } = await findExportRow('/api/v1/members/export_data', member.uuid ?? '', authHeaders(member));

      // Positive control: a known non-admin is still present, so this isn't
      // passing vacuously.
      expect(adminRow).toBeUndefined();
      expect(memberRow).not.toBeUndefined();

      const res = await request(app).get('/api/v1/members/export_data').query({ page: 0, per_page: 100 }).set(authHeaders(member));
      const allUndeleted = await prisma.users.findMany({ where: { deleted: false } });
      const callerRoleNames = await loadUserRoleNames(member.id);
      const expectedCount = (
        await Promise.all(
          allUndeleted.map(async (u) => canViewUserInDirectory(callerRoleNames, await loadUserRoleNames(u.id), false)),
        )
      ).filter(Boolean).length;
      expect(res.body.row_count).toBe(expectedCount);
    });

    it('does not leak the csv_export-only street1/street2/street3/remarks fields', async () => {
      // Regression test (whole-branch review finding): export_row used to
      // reuse the same address serializer csv_export_data uses - street1/2/3
      // and remarks are meant to be CSV/VCF-export-only fields, but
      // export_data is reachable by every authenticated member via
      // :members_list, so it must not include them.
      const now = new Date();
      await prisma.addresses.createMany({
        data: [
          {
            addressable_id: member.id,
            addressable_type: 'User',
            type_of_address: 1,
            purpose: 'business',
            street1: 'Hauptstr. 1',
            street2: '',
            street3: '',
            zip: '12345',
            city: 'Berlin',
            phone: '',
            fax: '',
            mobile: '',
            email: '',
            deleted: false,
            created_at: now,
            updated_at: now,
          },
          {
            addressable_id: member.id,
            addressable_type: 'User',
            type_of_address: 0,
            purpose: 'private',
            street1: 'Privatweg 2',
            street2: 'Hinterhaus',
            street3: '',
            zip: '54321',
            city: 'Hamburg',
            email: 'priv@example.org',
            remarks: 'Klingel B',
            deleted: false,
            created_at: now,
            updated_at: now,
          },
        ],
      });

      const { row } = await findExportRow('/api/v1/members/export_data', member.uuid ?? '', authHeaders(member));

      expect(row).not.toBeUndefined();
      for (const key of ['business_address', 'private_address'] as const) {
        const addr = row?.[key] as Record<string, unknown> | null;
        if (addr === null || addr === undefined) continue;
        // Positive control: the kept field is still present.
        expect(addr).toHaveProperty('street');
        expect(Object.keys(addr)).not.toEqual(expect.arrayContaining(['street1', 'street2', 'street3', 'remarks', 'type_of_address', 'vcf_type']));
      }
    });
  });

  describe('GET /api/v1/members/csv_export_data', () => {
    it('returns 403 for a member without csv_export ability', async () => {
      const res = await request(app).get('/api/v1/members/csv_export_data').set(authHeaders(member));
      expect(res.status).toBe(403);
    });

    it('returns per-address street1/2/3 and remarks for a user_admin', async () => {
      const now = new Date();
      await prisma.addresses.create({
        data: {
          addressable_id: member.id,
          addressable_type: 'User',
          type_of_address: 0,
          purpose: 'private',
          street1: 'Privatweg 2',
          street2: 'Hinterhaus',
          street3: '',
          zip: '54321',
          city: 'Hamburg',
          email: 'priv@example.org',
          remarks: 'Klingel B',
          deleted: false,
          created_at: now,
          updated_at: now,
        },
      });

      const { row } = await findExportRow('/api/v1/members/csv_export_data', member.uuid ?? '', authHeaders(userAdmin));

      expect(row).not.toBeUndefined();
      const addr = (row?.addresses as Array<Record<string, unknown>>).find((a) => a.street1 === 'Privatweg 2');
      expect(addr?.street2).toBe('Hinterhaus');
      expect(addr?.remarks).toBe('Klingel B');
    });

    it('hides admin members from a user_admin caller when AppConfig[:show_admins] is false', async () => {
      await appConfig.set('show_admins', false);

      const { row: adminRow } = await findExportRow('/api/v1/members/csv_export_data', admin.uuid ?? '', authHeaders(userAdmin));
      const { row: memberRow } = await findExportRow('/api/v1/members/csv_export_data', member.uuid ?? '', authHeaders(userAdmin));

      expect(adminRow).toBeUndefined();
      expect(memberRow).not.toBeUndefined();

      const res = await request(app).get('/api/v1/members/csv_export_data').query({ page: 0, per_page: 100 }).set(authHeaders(userAdmin));
      const allUndeleted = await prisma.users.findMany({ where: { deleted: false } });
      const callerRoleNames = await loadUserRoleNames(userAdmin.id);
      const expectedCount = (
        await Promise.all(
          allUndeleted.map(async (u) => canManageUserAsUserAdmin(callerRoleNames, await loadUserRoleNames(u.id), false)),
        )
      ).filter(Boolean).length;
      expect(res.body.row_count).toBe(expectedCount);
    });
  });

  describe('POST /api/v1/members/record_export', () => {
    it('creates a FileDownload row for a valid kind the caller is allowed', async () => {
      const before = await prisma.file_downloads.count();

      const res = await request(app).post('/api/v1/members/record_export').set(authHeaders(member)).send({ kind: 'phone_list' });

      expect(res.status).toBe(204);
      const after = await prisma.file_downloads.count();
      expect(after).toBe(before + 1);

      const fd = await prisma.file_downloads.findFirstOrThrow({ orderBy: { id: 'desc' } });
      expect(fd.user_id).toBe(member.id);
      expect(fd.filename).toBe('Telefonliste');
      expect(fd.attached_file_id).toBeNull();
    });

    it('rejects an unknown kind', async () => {
      const res = await request(app).post('/api/v1/members/record_export').set(authHeaders(member)).send({ kind: 'bogus' });
      expect(res.status).toBe(400);
    });
  });

  describe('server-side export audit trail (security regression)', () => {
    // Bug: file_downloads rows were only ever written by the client-triggered
    // POST /record_export beacon. Calling export_data/csv_export_data
    // directly (a script, or a compromised account that never calls the
    // beacon) left zero server-side record of the bulk PII export.
    it('records a file_downloads row for GET /export_data even when /record_export is never called', async () => {
      const before = await prisma.file_downloads.count();

      const res = await request(app).get('/api/v1/members/export_data').set(authHeaders(member));

      expect(res.status).toBe(200);
      const after = await prisma.file_downloads.count();
      expect(after).toBe(before + 1);

      const fd = await prisma.file_downloads.findFirstOrThrow({ orderBy: { id: 'desc' } });
      expect(fd.user_id).toBe(member.id);
      expect(fd.filename).toBeTruthy();
      expect(fd.remote_ip).not.toBeNull();
    });

    it('records a file_downloads row for GET /csv_export_data even when /record_export is never called', async () => {
      const before = await prisma.file_downloads.count();

      const res = await request(app).get('/api/v1/members/csv_export_data').set(authHeaders(userAdmin));

      expect(res.status).toBe(200);
      const after = await prisma.file_downloads.count();
      expect(after).toBe(before + 1);

      const fd = await prisma.file_downloads.findFirstOrThrow({ orderBy: { id: 'desc' } });
      expect(fd.user_id).toBe(userAdmin.id);
      expect(fd.filename).toBeTruthy();
    });

    it('does not record a file_downloads row when export_data is forbidden', async () => {
      const noRoleUser = await createTaggedUser();
      const before = await prisma.file_downloads.count();

      const res = await request(app).get('/api/v1/members/csv_export_data').set(authHeaders(noRoleUser));

      expect(res.status).toBe(403);
      const after = await prisma.file_downloads.count();
      expect(after).toBe(before);
    });
  });

  describe('POST /api/v1/members/:uuid/impersonate', () => {
    let otherAdmin: users;
    let deletedMember: users;
    let applicationAdmin: users;

    beforeEach(async () => {
      otherAdmin = await createUserWithRole('Admin');
      deletedMember = await createTaggedUser({ deleted: true });
      applicationAdmin = await createUserWithRole('ApplicationAdmin');
    });

    it('lets a strict Admin impersonate a non-admin member and logs the event', async () => {
      const before = await prisma.impersonation_events.count();

      const res = await request(app).post(`/api/v1/members/${member.uuid}/impersonate`).set(authHeaders(admin));

      expect(res.status).toBe(200);
      const after = await prisma.impersonation_events.count();
      expect(after).toBe(before + 1);

      expect(verifyAccessToken(res.body.access_token as string).sub).toBe(member.id);
      expect(res.body.user.id).toBe(member.id);

      const event = await prisma.impersonation_events.findFirstOrThrow({ orderBy: { id: 'desc' } });
      expect(event.admin_id).toBe(BigInt(admin.id));
      expect(event.user_id).toBe(BigInt(member.id));
    });

    it('rejects a UserAdmin caller (broader admin-tier, not the strict Admin role)', async () => {
      const res = await request(app).post(`/api/v1/members/${member.uuid}/impersonate`).set(authHeaders(userAdmin));
      expect(res.status).toBe(403);
    });

    it('rejects an ordinary member caller', async () => {
      const res = await request(app).post(`/api/v1/members/${admin.uuid}/impersonate`).set(authHeaders(member));
      expect(res.status).toBe(403);
    });

    it('rejects impersonating another Admin', async () => {
      const res = await request(app).post(`/api/v1/members/${otherAdmin.uuid}/impersonate`).set(authHeaders(admin));
      expect(res.status).toBe(403);
    });

    it('rejects self-impersonation', async () => {
      const before = await prisma.impersonation_events.count();

      const res = await request(app).post(`/api/v1/members/${admin.uuid}/impersonate`).set(authHeaders(admin));

      expect(res.status).toBe(403);
      expect(await prisma.impersonation_events.count()).toBe(before);
    });

    it('rejects impersonating a deleted member', async () => {
      const res = await request(app).post(`/api/v1/members/${deletedMember.uuid}/impersonate`).set(authHeaders(admin));
      expect(res.status).toBe(403);
    });

    it('rejects an ApplicationAdmin-only caller (broader admin-tier, not the strict Admin role)', async () => {
      const res = await request(app).post(`/api/v1/members/${member.uuid}/impersonate`).set(authHeaders(applicationAdmin));
      expect(res.status).toBe(403);
    });

    it('rejects self- and admin-target impersonation for a caller holding both Admin and ApplicationAdmin', async () => {
      const dualRoleAdmin = await createTaggedUser();
      const adminRole = await createRole('Admin');
      const applicationAdminRole = await createRole('ApplicationAdmin');
      await assignRole(dualRoleAdmin.id, adminRole.id);
      await assignRole(dualRoleAdmin.id, applicationAdminRole.id);

      const selfRes = await request(app).post(`/api/v1/members/${dualRoleAdmin.uuid}/impersonate`).set(authHeaders(dualRoleAdmin));
      expect(selfRes.status).toBe(403);

      const adminTargetRes = await request(app).post(`/api/v1/members/${otherAdmin.uuid}/impersonate`).set(authHeaders(dualRoleAdmin));
      expect(adminTargetRes.status).toBe(403);
    });
  });

  // Net-new security coverage beyond the ported spec (not in members_spec.rb)
  // - impersonation is a privilege-escalation surface, so it gets extra
  // adversarial coverage on top of the direct Rails port above.
  describe('security: impersonation privilege-escalation boundary', () => {
    it('401s on impersonation attempted with a forged/tampered JWT (garbage signature)', async () => {
      const validToken = issueAccessToken(admin.id);
      const [header, payload] = validToken.split('.');
      const tamperedToken = `${header}.${payload}.tampered-signature-not-base64url-valid`;

      const res = await request(app)
        .post(`/api/v1/members/${member.uuid}/impersonate`)
        .set({ Authorization: `Bearer ${tamperedToken}` });

      expect(res.status).toBe(401);
    });

    it('rejects a Secretary caller (a broader admin-tier grant than UserAdmin, still not the strict Admin role)', async () => {
      // Secretary reaches worshipful_master/working_plan_admin/announcement_
      // admin/lodges_admin/file_admin/user_admin abilities transitively (see
      // ability.ts's secretaryAbilities), a strictly larger grant surface
      // than UserAdmin alone - but never adminAbilities, so it never reaches
      // the `can(['impersonate'], 'User')` grant, and isAdmin(roleNames) is
      // false, so buildAbility's trailing unconditional
      // `cannot(['impersonate'], 'User')` still applies. Proves the guard
      // holds even for a caller with a much wider ability surface than the
      // already-Rails-covered UserAdmin case.
      const secretary = await createUserWithRole('Secretary');

      const res = await request(app).post(`/api/v1/members/${member.uuid}/impersonate`).set(authHeaders(secretary));

      expect(res.status).toBe(403);
    });

    it('writes an ImpersonationEvent audit row with admin_id/user_id/remote_ip on a successful impersonation', async () => {
      const res = await request(app).post(`/api/v1/members/${member.uuid}/impersonate`).set(authHeaders(admin));
      expect(res.status).toBe(200);

      const event = await prisma.impersonation_events.findFirstOrThrow({
        where: { admin_id: BigInt(admin.id), user_id: BigInt(member.id) },
        orderBy: { id: 'desc' },
      });
      expect(event.admin_id).toBe(BigInt(admin.id));
      expect(event.user_id).toBe(BigInt(member.id));
      // supertest's requests are real in-process HTTP calls, so Express's
      // req.ip is always populated (loopback address) - asserting it's a
      // non-empty string confirms the route actually threads req.ip through
      // to the audit row, not that it matches one specific literal address.
      expect(typeof event.remote_ip).toBe('string');
      expect(event.remote_ip?.length ?? 0).toBeGreaterThan(0);
    });
  });
});
