import { createHash, randomUUID } from 'node:crypto';

import type { users } from '../../src/generated/prisma/client.js';
import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { issueAccessToken } from '../../src/auth/jwt.js';
import { RefreshTokenInvalidError, issueRefreshToken, rotateRefreshToken } from '../../src/auth/refreshToken.js';
import { appConfig, KNOWN_KEYS } from '../../src/lib/appConfig.js';
import { apiErrorHandler } from '../../src/lib/errors.js';
import membersRouter from '../../src/routes/members.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

// Port of the CORE CRUD portion of
// rails-app/spec/requests/api/v1/members_spec.rb (examples 1-39 of that
// file's 58: index/show/create/update/destroy). The remaining 19 examples
// (phone_list, birthday_list, members_of_council, export_data,
// csv_export_data, record_export, and POST /:uuid/impersonate) are ported
// separately into api/test/routes/membersLists.test.ts - not duplicated
// here.
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

function yearsAgoUtc(years: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear() - years, now.getUTCMonth(), now.getUTCDate()));
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** `body.roles` is now `{ display_name, kind }[]` (not a flat string[]) - see
 * memberDetailJson's roles mapping in members.ts. Most existing assertions
 * only care whether a given display name is present, regardless of kind. */
function roleDisplayNames(body: { roles: { display_name: string }[] }): string[] {
  return body.roles.map((r) => r.display_name);
}

describe('Members API - core CRUD', () => {
  let apprenticeRole: Awaited<ReturnType<typeof createRole>>;
  let adminRole: Awaited<ReturnType<typeof createRole>>;
  let userAdminRole: Awaited<ReturnType<typeof createRole>>;

  let member: users;
  let memberEnteredApprenticeSince: Date;
  let admin: users;
  let userAdmin: users;

  /** A plain member holding EnteredApprentice - reuses the single canonical apprenticeRole row (never mints a duplicate) so tests that rely on there being exactly one 'EnteredApprentice' role (the role-missing regression test below) stay deterministic. */
  async function createApprentice(overrides: Partial<Parameters<typeof createUser>[0]> = {}, roleAddedAt: Date = yearsAgoUtc(1)): Promise<users> {
    const user = await createTaggedUser(overrides);
    await assignRole(user.id, apprenticeRole.id, roleAddedAt);
    return user;
  }

  /** Not in this file's original fixture set (that's the shared `admin` var from beforeEach) - a separate helper so the mfa/reset tests below can mint an independent admin per test, matching the task brief's test shape. */
  async function createAdminUser(overrides: Partial<Parameters<typeof createUser>[0]> = {}): Promise<users> {
    const user = await createTaggedUser(overrides);
    await assignRole(user.id, adminRole.id);
    return user;
  }

  beforeEach(async () => {
    await resetDb();
    // appConfig caches records process-wide (mirrors Rails' AppConfig
    // module) - resetDb() truncates app_config_adapters but doesn't by
    // itself invalidate that in-memory cache, so every known key is
    // explicitly dirtied to force a fresh (post-truncate, default) read.
    // Same pattern as public.test.ts/membersLists.test.ts.
    for (const key of Object.keys(KNOWN_KEYS)) appConfig.dirty(key);

    // find_or_create_by!-equivalent canonical rows - created once per test
    // via resetDb(), not accumulated across a shared non-transactional DB
    // (that's a Rails-suite-specific concern noted in the Rails spec's own
    // header comment; this port's clean-slate-per-test DB doesn't have it).
    apprenticeRole = await createRole('EnteredApprentice', { display_name: 'Lehrling' });
    await createRole('FellowCraft', { display_name: 'Geselle' });
    await createRole('MasterMason', { display_name: 'Meister' });
    adminRole = await createRole('Admin', { display_name: 'Administrator' });
    userAdminRole = await createRole('UserAdmin', { display_name: 'Mitgliederverwaltung' });

    memberEnteredApprenticeSince = yearsAgoUtc(1);
    member = await createTaggedUser();
    await assignRole(member.id, apprenticeRole.id, memberEnteredApprenticeSince);

    admin = await createTaggedUser();
    await assignRole(admin.id, adminRole.id);

    userAdmin = await createTaggedUser();
    await assignRole(userAdmin.id, userAdminRole.id);
  });

  describe('GET /api/v1/members', () => {
    it('lists undeleted members visible to the caller', async () => {
      const other = await createApprentice();

      const res = await request(app).get('/api/v1/members').set(authHeaders(member));

      expect(res.status).toBe(200);
      const uuids = (res.body.rows as { uuid: string }[]).map((r) => r.uuid);
      expect(uuids).toContain(member.uuid);
      expect(uuids).toContain(other.uuid);
    });

    it('includes per-row can_edit/can_destroy so the list view can gate inline row actions', async () => {
      const other = await createApprentice();

      const asMember = await request(app).get('/api/v1/members').set(authHeaders(member));
      const rows = asMember.body.rows as { uuid: string; can_edit: boolean; can_destroy: boolean }[];
      const ownRow = rows.find((r) => r.uuid === member.uuid);
      const otherRow = rows.find((r) => r.uuid === other.uuid);
      // A plain member can edit their own row (default_user_abilities scopes
      // :update to id: @user.id) but cannot destroy anyone, and cannot edit
      // another member's row.
      expect(ownRow).toMatchObject({ can_edit: true, can_destroy: false });
      expect(otherRow).toMatchObject({ can_edit: false, can_destroy: false });

      const asUserAdmin = await request(app).get('/api/v1/members').set(authHeaders(userAdmin));
      const adminRows = asUserAdmin.body.rows as { uuid: string; can_edit: boolean; can_destroy: boolean }[];
      const adminViewOfOther = adminRows.find((r) => r.uuid === other.uuid);
      // user_admin_abilities grants update/destroy on any visible user.
      expect(adminViewOfOther).toMatchObject({ can_edit: true, can_destroy: true });
    });

    it('hides admin members from a plain member when AppConfig[:show_admins] is false', async () => {
      await appConfig.set('show_admins', false);

      const res = await request(app).get('/api/v1/members').set(authHeaders(member));

      const uuids = (res.body.rows as { uuid: string }[]).map((r) => r.uuid);
      expect(uuids).not.toContain(admin.uuid);
      expect(uuids).toContain(member.uuid);
      expect(uuids).toContain(userAdmin.uuid);
      // Exactly member + userAdmin are visible: resetDb() gives a clean
      // slate, so (unlike the Rails suite's shared non-transactional DB)
      // the exact undeleted-and-visible set is known by construction -
      // member, admin (hidden), userAdmin (not Admin-flagged, so still
      // shown) are the only three users that exist.
      expect(res.body.row_count).toBe(2);
    });

    it('shows admin members to another admin', async () => {
      await appConfig.set('show_admins', false);

      const res = await request(app).get('/api/v1/members').set(authHeaders(admin));

      const uuids = (res.body.rows as { uuid: string }[]).map((r) => r.uuid);
      expect(uuids).toContain(admin.uuid);
    });

    it('401s without a token', async () => {
      const res = await request(app).get('/api/v1/members');
      expect(res.status).toBe(401);
    });

    // Net-new coverage for MembersListPage's "Mobile" column: there is no
    // `mobile` column on `users` itself, only on `addresses` - the row's
    // `mobile` field is derived from the member's addresses (ordered by id
    // asc, same ordering as loadAddressesForUser/loadAddressesForUsers).
    describe('derived `mobile` field', () => {
      const now = new Date();

      async function addAddress(userId: number, overrides: Partial<Parameters<typeof prisma.addresses.create>[0]['data']> = {}) {
        return prisma.addresses.create({
          data: {
            addressable_id: userId, addressable_type: 'User', type_of_address: 0, purpose: 'Privat',
            street1: 'Teststr. 1', deleted: false, created_at: now, updated_at: now, ...overrides,
          },
        });
      }

      function mobileOf(body: { rows: { uuid: string; mobile: string }[] }, uuid: string | null): string | undefined {
        return body.rows.find((r) => r.uuid === uuid)?.mobile;
      }

      it('uses the first address\'s mobile when present', async () => {
        await addAddress(member.id, { mobile: '0170 111' });
        await addAddress(member.id, { mobile: '0170 222' });

        const res = await request(app).get('/api/v1/members').set(authHeaders(admin));

        expect(mobileOf(res.body, member.uuid)).toBe('0170 111');
      });

      it('falls back to the second address\'s mobile when only the second address has one', async () => {
        await addAddress(member.id, { mobile: null });
        await addAddress(member.id, { mobile: '0170 222' });

        const res = await request(app).get('/api/v1/members').set(authHeaders(admin));

        expect(mobileOf(res.body, member.uuid)).toBe('0170 222');
      });

      it('treats an empty-string mobile as absent and falls through to the second address', async () => {
        await addAddress(member.id, { mobile: '' });
        await addAddress(member.id, { mobile: '0170 222' });

        const res = await request(app).get('/api/v1/members').set(authHeaders(admin));

        expect(mobileOf(res.body, member.uuid)).toBe('0170 222');
      });

      it('is blank when the member has no addresses at all', async () => {
        const res = await request(app).get('/api/v1/members').set(authHeaders(admin));

        expect(mobileOf(res.body, member.uuid)).toBe('');
      });

      it('is blank when neither of the first two addresses has a mobile number', async () => {
        await addAddress(member.id, { mobile: null });
        await addAddress(member.id, { mobile: '' });

        const res = await request(app).get('/api/v1/members').set(authHeaders(admin));

        expect(mobileOf(res.body, member.uuid)).toBe('');
      });

      it('ignores a third address\'s mobile - only the first two are considered', async () => {
        await addAddress(member.id, { mobile: null });
        await addAddress(member.id, { mobile: null });
        await addAddress(member.id, { mobile: '0170 333' });

        const res = await request(app).get('/api/v1/members').set(authHeaders(admin));

        expect(mobileOf(res.body, member.uuid)).toBe('');
      });
    });
  });

  // Net-new coverage: the Rails spec's own `GET /api/v1/members` describe
  // block (lines 44-112) has no dedicated search/sort/pagination examples,
  // but this route implements all three (matchesSearch/sortComparator/
  // parsePageParams) and the task scope explicitly names them - so these
  // are ported as net-new tests, same precedent as seekers.test.ts's
  // "security" block below the ported examples.
  describe('GET /api/v1/members - search/sort/pagination (net-new)', () => {
    it('filters by the search query param across email/firstname/lastname/matriculation_number', async () => {
      const needle = await createTaggedUser({ firstname: 'Zzyzx', lastname: 'Uniquelast', email: 'zzyzx-search@example.test' });

      const res = await request(app).get('/api/v1/members').query({ search: 'zzyzx' }).set(authHeaders(admin));

      expect(res.status).toBe(200);
      const uuids = (res.body.rows as { uuid: string }[]).map((r) => r.uuid);
      expect(uuids).toEqual([needle.uuid]);
    });

    it('sorts by the given column ascending by default, descending with a "-" prefix', async () => {
      const first = await createTaggedUser({ lastname: 'AAA_SortFirst' });
      const last = await createTaggedUser({ lastname: 'ZZZ_SortLast' });

      const firstUuid = first.uuid ?? '';
      const lastUuid = last.uuid ?? '';

      const asc = await request(app).get('/api/v1/members').query({ sort: 'lastname', per_page: 100 }).set(authHeaders(admin));
      const ascUuids = (asc.body.rows as { uuid: string }[]).map((r) => r.uuid);
      expect(ascUuids.indexOf(firstUuid)).toBeLessThan(ascUuids.indexOf(lastUuid));

      const desc = await request(app).get('/api/v1/members').query({ sort: '-lastname', per_page: 100 }).set(authHeaders(admin));
      const descUuids = (desc.body.rows as { uuid: string }[]).map((r) => r.uuid);
      expect(descUuids.indexOf(lastUuid)).toBeLessThan(descUuids.indexOf(firstUuid));
    });

    it('paginates results according to page/per_page, with no overlap between pages and a consistent row_count', async () => {
      // 3 global fixtures (member/admin/userAdmin) + 3 more created here = 6 total.
      await createTaggedUser();
      await createTaggedUser();
      await createTaggedUser();

      // sort: 'email' (factory emails are all distinct and non-null, unlike
      // lastname which is null for these fixtures) makes the ordering fully
      // deterministic across the two sequential requests, instead of
      // relying on Postgres happening to return rows in the same order twice.
      const page0 = await request(app).get('/api/v1/members').query({ page: 0, per_page: 2, sort: 'email' }).set(authHeaders(admin));
      const page1 = await request(app).get('/api/v1/members').query({ page: 1, per_page: 2, sort: 'email' }).set(authHeaders(admin));

      expect(page0.body.rows).toHaveLength(2);
      expect(page1.body.rows).toHaveLength(2);
      const uuids0 = (page0.body.rows as { uuid: string }[]).map((r) => r.uuid);
      const uuids1 = (page1.body.rows as { uuid: string }[]).map((r) => r.uuid);
      expect(uuids0.some((u) => uuids1.includes(u))).toBe(false);
      expect(page0.body.row_count).toBe(page1.body.row_count);
      expect(page0.body.row_count).toBeGreaterThanOrEqual(6);
    });

    it('matches on job_title', async () => {
      const needle = await createTaggedUser({ job_title: 'Uniquejobtitle' });
      const res = await request(app).get('/api/v1/members').query({ search: 'uniquejobtitle' }).set(authHeaders(admin));
      const uuids = (res.body.rows as { uuid: string }[]).map((r) => r.uuid);
      expect(uuids).toEqual([needle.uuid]);
    });

    it('matches on mother_lodge', async () => {
      const needle = await createTaggedUser({ mother_lodge: 'Uniquemotherlodge' });
      const res = await request(app).get('/api/v1/members').query({ search: 'uniquemotherlodge' }).set(authHeaders(admin));
      const uuids = (res.body.rows as { uuid: string }[]).map((r) => r.uuid);
      expect(uuids).toEqual([needle.uuid]);
    });

    it('matches on any address street', async () => {
      const needle = await createTaggedUser();
      await prisma.addresses.create({
        data: {
          addressable_id: needle.id, addressable_type: 'User', street1: 'Uniquestreetname',
          created_at: new Date(), updated_at: new Date(),
        },
      });
      const res = await request(app).get('/api/v1/members').query({ search: 'uniquestreetname' }).set(authHeaders(admin));
      const uuids = (res.body.rows as { uuid: string }[]).map((r) => r.uuid);
      expect(uuids).toEqual([needle.uuid]);
    });

    it('matches on any address phone or mobile', async () => {
      const needle = await createTaggedUser();
      await prisma.addresses.create({
        data: {
          addressable_id: needle.id, addressable_type: 'User', mobile: '0170 9998877',
          created_at: new Date(), updated_at: new Date(),
        },
      });
      const res = await request(app).get('/api/v1/members').query({ search: '9998877' }).set(authHeaders(admin));
      const uuids = (res.body.rows as { uuid: string }[]).map((r) => r.uuid);
      expect(uuids).toEqual([needle.uuid]);
    });

    it('matches partially and case-insensitively', async () => {
      const needle = await createTaggedUser({ lastname: 'Mustermann' });
      const res = await request(app).get('/api/v1/members').query({ search: 'sterMA' }).set(authHeaders(admin));
      const uuids = (res.body.rows as { uuid: string }[]).map((r) => r.uuid);
      expect(uuids).toContain(needle.uuid);
    });
  });

  describe('GET /api/v1/members/next_matriculation_number', () => {
    it('401s without a token', async () => {
      const res = await request(app).get('/api/v1/members/next_matriculation_number');
      expect(res.status).toBe(401);
    });

    it('forbids a plain member (mirrors the create-class gate)', async () => {
      const res = await request(app).get('/api/v1/members/next_matriculation_number').set(authHeaders(member));
      expect(res.status).toBe(403);
    });

    it('returns 1 when there are no existing matriculation numbers', async () => {
      // member/admin/userAdmin fixtures created in beforeEach have no
      // matriculation_number set (createUser() leaves it null by default).
      const res = await request(app).get('/api/v1/members/next_matriculation_number').set(authHeaders(admin));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ next_matriculation_number: 1 });
    });

    it('returns max(matriculation_number) + 1 across all users, including soft-deleted ones', async () => {
      await createTaggedUser({ matriculation_number: 50 });
      await createTaggedUser({ matriculation_number: 120 });
      await createTaggedUser({ matriculation_number: 90, deleted: true });

      const res = await request(app).get('/api/v1/members/next_matriculation_number').set(authHeaders(admin));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ next_matriculation_number: 121 });
    });

    it('allows a UserAdmin (reaches user_admin_abilities, same as the create-class gate)', async () => {
      const res = await request(app).get('/api/v1/members/next_matriculation_number').set(authHeaders(userAdmin));
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/members', () => {
    const createParams = { firstname: 'New', lastname: 'Member', date_of_birth: '1990-01-01', matriculation_number: 9100, email: 'new-member@example.org' };

    it('forbids a plain member', async () => {
      const res = await request(app).post('/api/v1/members').set(authHeaders(member)).send(createParams);
      expect(res.status).toBe(403);
    });

    it('creates a member and assigns EnteredApprentice for an admin', async () => {
      const res = await request(app).post('/api/v1/members').set(authHeaders(admin)).send(createParams);

      expect(res.status).toBe(201);
      expect(roleDisplayNames(res.body)).toContain('Lehrling');
      // Regression: the create handler never called generateUniqueUuid (unlike
      // events/attachedFiles/announcements/seekers, which all port User's own
      // `before_create :generate_uuid`), so new users got uuid: null. This unit
      // test's own DB lookup below still "passed" against a null uuid (Prisma
      // treats `where: { uuid: null }` as `uuid IS NULL`, matching the very row
      // just created) - only express-openapi-validator's response check (not
      // wired into this router-only test harness, only into the full app.ts
      // integration path/e2e) caught the missing string, as "/response/uuid
      // must be string". Assert the actual shape here so this harness catches
      // it too.
      expect(res.body.uuid).toMatch(/^[0-9a-f-]{36}$/);
      const created = await prisma.users.findFirstOrThrow({ where: { uuid: res.body.uuid as string } });
      expect(created.firstname).toBe('New');
    });

    it('returns 422 with a detail message when required fields are missing', async () => {
      const res = await request(app).post('/api/v1/members').set(authHeaders(admin)).send({ firstname: 'Incomplete' });

      expect(res.status).toBe(422);
      expect(res.body.detail).toBeTruthy();
    });

    it('honors an explicit entered_apprentice_since and higher degrees supplied at creation', async () => {
      const res = await request(app)
        .post('/api/v1/members')
        .set(authHeaders(admin))
        .send({
          ...createParams,
          email: 'new-member-with-degrees@example.org',
          matriculation_number: 9102,
          entered_apprentice_since: '2005-01-01',
          fellow_craft_since: '2008-01-01',
          master_mason_since: '2011-01-01',
        });

      expect(res.status).toBe(201);
      expect(res.body.entered_apprentice_since).toBe('2005-01-01');
      expect(res.body.fellow_craft_since).toBe('2008-01-01');
      expect(res.body.master_mason_since).toBe('2011-01-01');
    });

    it('creates a member with the full field set for a UserAdmin who is not Admin/Secretary', async () => {
      // Regression coverage: UserAdmin is granted :create via
      // reachesUserAdminAbilities, but editable_fields must gate on
      // isUserAdmin (which includes UserAdmin), not just admin?/secretary? -
      // otherwise a UserAdmin-only caller authorizes the create but never
      // gets firstname/lastname/date_of_birth/matriculation_number
      // whitelisted, and the save always 422s.
      const res = await request(app)
        .post('/api/v1/members')
        .set(authHeaders(userAdmin))
        .send({ ...createParams, email: 'new-member-via-user-admin@example.org', matriculation_number: 9101 });

      expect(res.status).toBe(201);
      expect(res.body.firstname).toBe('New');
      expect(res.body.lastname).toBe('Member');
      expect(roleDisplayNames(res.body)).toContain('Lehrling');
    });

    it('rejects creating a member whose matriculation_number is already used by another member (denies the collision)', async () => {
      await createTaggedUser({ matriculation_number: 9500 });

      const res = await request(app)
        .post('/api/v1/members')
        .set(authHeaders(admin))
        .send({ ...createParams, email: 'colliding@example.org', matriculation_number: 9500 });

      expect(res.status).toBe(422);
      expect(res.body.detail).toContain('Matrikelnummer bereits vergeben.');
      const stillOne = await prisma.users.count({ where: { matriculation_number: 9500 } });
      expect(stillOne).toBe(1); // no silent reassignment happened
    });

    it('allows creating a member with a genuinely unique matriculation_number (allow-side pair for the collision-denial test above)', async () => {
      await createTaggedUser({ matriculation_number: 9500 });

      const res = await request(app)
        .post('/api/v1/members')
        .set(authHeaders(admin))
        .send({ ...createParams, email: 'unique-number@example.org', matriculation_number: 9600 });

      expect(res.status).toBe(201);
      const created = await prisma.users.findFirstOrThrow({ where: { uuid: res.body.uuid as string } });
      expect(created.matriculation_number).toBe(9600);
    });

    it('rejects a collision against a soft-deleted member too (global uniqueness scope)', async () => {
      await createTaggedUser({ matriculation_number: 9700, deleted: true });

      const res = await request(app)
        .post('/api/v1/members')
        .set(authHeaders(admin))
        .send({ ...createParams, email: 'colliding-with-deleted@example.org', matriculation_number: 9700 });

      expect(res.status).toBe(422);
      expect(res.body.detail).toContain('Matrikelnummer bereits vergeben.');
    });
  });

  describe('GET /api/v1/members/:uuid', () => {
    it('returns full detail including addresses, roles, and edit permissions', async () => {
      const now = new Date();
      await prisma.addresses.create({
        data: { addressable_id: member.id, addressable_type: 'User', type_of_address: 0, purpose: 'Privat', street1: 'Teststr. 1', deleted: false, created_at: now, updated_at: now },
      });

      const res = await request(app).get(`/api/v1/members/${member.uuid}`).set(authHeaders(member));

      expect(res.status).toBe(200);
      expect(res.body.addresses).toHaveLength(1);
      expect(roleDisplayNames(res.body)).toContain('Lehrling');
      expect(res.body.can_edit).toBe(true);
      expect(res.body.can_destroy).toBe(false);
      expect(res.body.editable_fields).toEqual(['job_title', 'addresses', 'email']);
    });

    it('splits roles into kind: "administrational" vs kind: "positions" (mirrors GET /api/v1/roles\'s ?scope=positions|administrational split)', async () => {
      const secretaryRole = await createRole('SecretaryPosition', { display_name: 'Schriftführer', administrational_role: false });
      await assignRole(member.id, secretaryRole.id);

      const res = await request(app).get(`/api/v1/members/${member.uuid}`).set(authHeaders(member));

      expect(res.status).toBe(200);
      const roles = res.body.roles as { display_name: string; kind: string }[];
      expect(roles).toContainEqual({ display_name: 'Lehrling', kind: 'administrational' });
      expect(roles).toContainEqual({ display_name: 'Schriftführer', kind: 'positions' });
    });

    it('reports an empty roles array (not a 500 or missing field) for a member with zero roles', async () => {
      const roleless = await createTaggedUser();
      await prisma.user_roles.deleteMany({ where: { user_id: roleless.id } });

      const res = await request(app).get(`/api/v1/members/${roleless.uuid}`).set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.roles).toEqual([]);
    });

    it('reports every held role as kind: "positions" when the member holds only office/position roles (none administrational)', async () => {
      const roleless = await createTaggedUser();
      await prisma.user_roles.deleteMany({ where: { user_id: roleless.id } });
      const secretaryRole = await createRole('SecretaryPosition2', { display_name: 'Schriftführer 2', administrational_role: false });
      await assignRole(roleless.id, secretaryRole.id);

      const res = await request(app).get(`/api/v1/members/${roleless.uuid}`).set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.roles).toEqual([{ display_name: 'Schriftführer 2', kind: 'positions' }]);
    });

    it('reports every held role as kind: "administrational" when the member holds only administrational roles (none positions)', async () => {
      const roleless = await createTaggedUser();
      await prisma.user_roles.deleteMany({ where: { user_id: roleless.id } });
      const netDelegateRole = await createRole('NetDelegate', { display_name: 'Netzdelegierter', administrational_role: true });
      await assignRole(roleless.id, netDelegateRole.id);

      const res = await request(app).get(`/api/v1/members/${roleless.uuid}`).set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.roles).toEqual([{ display_name: 'Netzdelegierter', kind: 'administrational' }]);
    });

    it('exposes the full AddressSummary field set (purpose/phone/fax/mobile/email), not just street/zip/city', async () => {
      const now = new Date();
      await prisma.addresses.create({
        data: {
          addressable_id: member.id, addressable_type: 'User', type_of_address: 1, purpose: null,
          street1: 'Teststr. 1', zip: '28203', city: 'Bremen', phone: '0421 111', fax: '0421 222',
          mobile: '0170 333', email: 'addr@example.org', deleted: false, created_at: now, updated_at: now,
        },
      });

      const res = await request(app).get(`/api/v1/members/${member.uuid}`).set(authHeaders(member));

      expect(res.status).toBe(200);
      expect(res.body.addresses).toHaveLength(1);
      const address = res.body.addresses[0];
      expect(address.type_of_address).toBe(1);
      expect(address.purpose).toBe('Geschäftlich');
      expect(address.phone).toBe('0421 111');
      expect(address.fax).toBe('0421 222');
      expect(address.mobile).toBe('0170 333');
      expect(address.email).toBe('addr@example.org');
    });

    it('reports an empty addresses array (not a 500) for a member with no addresses', async () => {
      const roleless = await createTaggedUser();

      const res = await request(app).get(`/api/v1/members/${roleless.uuid}`).set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.addresses).toEqual([]);
    });

    it('returns null (not the string "null") for an address whose optional fields are all blank', async () => {
      const now = new Date();
      const roleless = await createTaggedUser();
      await prisma.addresses.create({
        data: {
          addressable_id: roleless.id, addressable_type: 'User', type_of_address: 2, purpose: null,
          street1: null, zip: null, city: null, phone: null, fax: null, mobile: null, email: null,
          deleted: false, created_at: now, updated_at: now,
        },
      });

      const res = await request(app).get(`/api/v1/members/${roleless.uuid}`).set(authHeaders(admin));

      expect(res.status).toBe(200);
      const address = res.body.addresses[0];
      expect(address.zip).toBeNull();
      expect(address.city).toBeNull();
      expect(address.phone).toBeNull();
      expect(address.fax).toBeNull();
      expect(address.mobile).toBeNull();
      expect(address.email).toBeNull();
    });

    it('reports the full editable_fields set for an admin', async () => {
      const res = await request(app).get(`/api/v1/members/${member.uuid}`).set(authHeaders(admin));

      const fields = res.body.editable_fields as string[];
      expect(fields).toContain('email');
      expect(fields).toContain('matriculation_number');
      expect(fields).toContain('entered_apprentice_since');
      expect(fields).toContain('fellow_craft_since');
      expect(fields).toContain('master_mason_since');
    });

    it('returns the degree dates', async () => {
      const res = await request(app).get(`/api/v1/members/${member.uuid}`).set(authHeaders(admin));

      expect(res.body.entered_apprentice_since).toBe(formatDateOnly(memberEnteredApprenticeSince));
      expect(res.body.fellow_craft_since).toBeNull();
      expect(res.body.master_mason_since).toBeNull();
    });

    it('404s for an unknown uuid', async () => {
      const res = await request(app).get('/api/v1/members/does-not-exist').set(authHeaders(member));
      expect(res.status).toBe(404);
    });

    it('includes can_impersonate, computed per-row like can_edit/can_destroy', async () => {
      const memberRes = await request(app).get(`/api/v1/members/${member.uuid}`).set(authHeaders(admin));
      expect(memberRes.body.can_impersonate).toBe(true);

      const adminRes = await request(app).get(`/api/v1/members/${admin.uuid}`).set(authHeaders(admin));
      expect(adminRes.body.can_impersonate).toBe(false);
    });
  });

  describe('PATCH /api/v1/members/:uuid', () => {
    it('lets a plain member update their own job_title', async () => {
      const res = await request(app).patch(`/api/v1/members/${member.uuid}`).set(authHeaders(member)).send({ job_title: 'Handwerker' });

      expect(res.status).toBe(200);
      const reloaded = await prisma.users.findUniqueOrThrow({ where: { id: member.id } });
      expect(reloaded.job_title).toBe('Handwerker');
    });

    it('silently ignores admin-only fields when a plain member sends them', async () => {
      const originalMatriculationNumber = member.matriculation_number;

      const res = await request(app)
        .patch(`/api/v1/members/${member.uuid}`)
        .set(authHeaders(member))
        .send({ job_title: 'Handwerker', matriculation_number: 1 });

      expect(res.status).toBe(200);
      const reloaded = await prisma.users.findUniqueOrThrow({ where: { id: member.id } });
      expect(reloaded.matriculation_number).toBe(originalMatriculationNumber);
    });

    it('lets a plain member update their own email (self-service account editing added email to LIMITED_FIELDS)', async () => {
      const res = await request(app)
        .patch(`/api/v1/members/${member.uuid}`)
        .set(authHeaders(member))
        .send({ email: 'self-service@example.org' });

      expect(res.status).toBe(200);
      const reloaded = await prisma.users.findUniqueOrThrow({ where: { id: member.id } });
      expect(reloaded.email).toBe('self-service@example.org');
    });

    it('still forbids a plain member from setting matriculation_number (an ADMIN_FIELDS-only field) on themselves, even alongside a permitted email change', async () => {
      const originalMatriculationNumber = member.matriculation_number;

      const res = await request(app)
        .patch(`/api/v1/members/${member.uuid}`)
        .set(authHeaders(member))
        .send({ email: 'self-service-2@example.org', matriculation_number: 4242 });

      expect(res.status).toBe(200);
      const reloaded = await prisma.users.findUniqueOrThrow({ where: { id: member.id } });
      expect(reloaded.email).toBe('self-service-2@example.org');
      expect(reloaded.matriculation_number).toBe(originalMatriculationNumber);
    });

    it('is forbidden when a plain member targets another member', async () => {
      const other = await createApprentice();

      const res = await request(app).patch(`/api/v1/members/${other.uuid}`).set(authHeaders(member)).send({ job_title: 'Handwerker' });

      expect(res.status).toBe(403);
    });

    it('lets an admin update matriculation_number and email', async () => {
      const res = await request(app).patch(`/api/v1/members/${member.uuid}`).set(authHeaders(admin)).send({ email: 'updated@example.org', matriculation_number: 9200 });

      expect(res.status).toBe(200);
      const reloaded = await prisma.users.findUniqueOrThrow({ where: { id: member.id } });
      expect(reloaded.email).toBe('updated@example.org');
      expect(reloaded.matriculation_number).toBe(9200);
    });

    it("rejects updating a member's matriculation_number to one already used by someone else (denies the collision)", async () => {
      const other = await createTaggedUser({ matriculation_number: 8800 });

      const res = await request(app)
        .patch(`/api/v1/members/${member.uuid}`)
        .set(authHeaders(admin))
        .send({ matriculation_number: 8800 });

      expect(res.status).toBe(422);
      expect(res.body.detail).toContain('Matrikelnummer bereits vergeben.');
      const reloadedOther = await prisma.users.findUniqueOrThrow({ where: { id: other.id } });
      expect(reloadedOther.matriculation_number).toBe(8800); // untouched - no silent reassignment
    });

    it('allows updating a matriculation_number to a genuinely unique value (allow-side pair for the collision-denial test above)', async () => {
      await createTaggedUser({ matriculation_number: 8800 });

      const res = await request(app)
        .patch(`/api/v1/members/${member.uuid}`)
        .set(authHeaders(admin))
        .send({ matriculation_number: 8900 });

      expect(res.status).toBe(200);
      const reloaded = await prisma.users.findUniqueOrThrow({ where: { id: member.id } });
      expect(reloaded.matriculation_number).toBe(8900);
    });

    it('allows a member to keep their own existing matriculation_number unchanged (self-collision must not be rejected)', async () => {
      await prisma.users.update({ where: { id: member.id }, data: { matriculation_number: 8950 } });

      const res = await request(app)
        .patch(`/api/v1/members/${member.uuid}`)
        .set(authHeaders(admin))
        .send({ matriculation_number: 8950, job_title: 'Zimmermann' });

      expect(res.status).toBe(200);
      const reloaded = await prisma.users.findUniqueOrThrow({ where: { id: member.id } });
      expect(reloaded.matriculation_number).toBe(8950);
      expect(reloaded.job_title).toBe('Zimmermann');
    });

    it('lets an admin fix a member missing entered_apprentice_since (the reported bug)', async () => {
      // A member with zero roles - User#validate_roles (`on: :update`) 422s
      // ANY update while entered_apprentice_since is blank; prior to this
      // fix there was no field anywhere to supply it.
      const roleless = await createTaggedUser();

      const res = await request(app).patch(`/api/v1/members/${roleless.uuid}`).set(authHeaders(admin)).send({ entered_apprentice_since: '2010-05-01' });

      expect(res.status).toBe(200);
      expect(res.body.entered_apprentice_since).toBe('2010-05-01');
      expect(roleDisplayNames(res.body)).toContain('Lehrling');
    });

    it('returns 422, not a 500, when the referenced role does not exist in this environment', async () => {
      // Regression test: set_degree_by_name used to raise instead of failing
      // gracefully when the role lookup returned nil - reproducible in real
      // environments whose Role table is missing a degree role entirely.
      // Deleting the single canonical 'EnteredApprentice' row (created once
      // in beforeEach, never duplicated - see createApprentice's doc
      // comment) reproduces "role missing" directly, no stubbing needed.
      await prisma.roles.delete({ where: { id: apprenticeRole.id } });
      const roleless = await createTaggedUser();

      const res = await request(app).patch(`/api/v1/members/${roleless.uuid}`).set(authHeaders(admin)).send({ entered_apprentice_since: '2010-05-01' });

      expect(res.status).toBe(422);
      expect(res.body.detail).toBeTruthy();
      const rows = await prisma.user_roles.findMany({ where: { user_id: roleless.id } });
      expect(rows).toHaveLength(0);
    });

    it('sets all three degree dates in one request regardless of params order', async () => {
      const roleless = await createTaggedUser();

      // master_mason_since sent before entered_apprentice_since - relies on
      // apply_degree_dates' fixed assignment order, not request param order.
      const res = await request(app).patch(`/api/v1/members/${roleless.uuid}`).set(authHeaders(admin)).send({
        master_mason_since: '2020-01-01',
        fellow_craft_since: '2015-01-01',
        entered_apprentice_since: '2010-01-01',
      });

      expect(res.status).toBe(200);
      expect(res.body.entered_apprentice_since).toBe('2010-01-01');
      expect(res.body.fellow_craft_since).toBe('2015-01-01');
      expect(res.body.master_mason_since).toBe('2020-01-01');
    });

    it('does not let a plain member set their own degree dates', async () => {
      const res = await request(app)
        .patch(`/api/v1/members/${member.uuid}`)
        .set(authHeaders(member))
        .send({ job_title: 'Handwerker', entered_apprentice_since: '2099-01-01' });

      expect(res.status).toBe(200);
      expect(res.body.entered_apprentice_since).not.toBe('2099-01-01');
      expect(res.body.entered_apprentice_since).toBe(formatDateOnly(memberEnteredApprenticeSince));
    });

    it('lets an admin add a new address', async () => {
      const res = await request(app)
        .patch(`/api/v1/members/${member.uuid}`)
        .set(authHeaders(admin))
        .send({ addresses: [{ type_of_address: 0, purpose: 'Privat', street1: 'Teststr. 1', zip: '28203', city: 'Bremen', phone: '+49 (30) 1234567' }] });

      expect(res.status).toBe(200);
      const addresses = await prisma.addresses.findMany({ where: { addressable_id: member.id, addressable_type: 'User' } });
      expect(addresses).toHaveLength(1);
      expect(addresses[0]?.street1).toBe('Teststr. 1');
    });

    it('lets a plain member add and edit their own address (parity with the legacy self-service form)', async () => {
      const createRes = await request(app)
        .patch(`/api/v1/members/${member.uuid}`)
        .set(authHeaders(member))
        .send({ addresses: [{ type_of_address: 0, purpose: 'Privat', city: 'Bremen' }] });

      expect(createRes.status).toBe(200);
      const addressesAfterCreate = await prisma.addresses.findMany({ where: { addressable_id: member.id, addressable_type: 'User' } });
      expect(addressesAfterCreate).toHaveLength(1);
      const addressId = addressesAfterCreate[0]?.id;

      const editRes = await request(app)
        .patch(`/api/v1/members/${member.uuid}`)
        .set(authHeaders(member))
        .send({ addresses: [{ id: addressId, city: 'Bremerhaven' }] });

      expect(editRes.status).toBe(200);
      const addressesAfterEdit = await prisma.addresses.findMany({ where: { addressable_id: member.id, addressable_type: 'User' } });
      expect(addressesAfterEdit).toHaveLength(1);
      expect(addressesAfterEdit[0]?.city).toBe('Bremerhaven');
    });

    it('removes an address via _destroy', async () => {
      const now = new Date();
      const address = await prisma.addresses.create({
        data: { addressable_id: member.id, addressable_type: 'User', type_of_address: 2, purpose: 'Sonstiges', deleted: false, created_at: now, updated_at: now },
      });

      const res = await request(app)
        .patch(`/api/v1/members/${member.uuid}`)
        .set(authHeaders(admin))
        .send({ addresses: [{ id: address.id, _destroy: true }] });

      expect(res.status).toBe(200);
      const remaining = await prisma.addresses.findMany({ where: { addressable_id: member.id, addressable_type: 'User' } });
      expect(remaining).toHaveLength(0);
    });

    it('returns 422 when adding a second private address', async () => {
      const now = new Date();
      await prisma.addresses.create({
        data: { addressable_id: member.id, addressable_type: 'User', type_of_address: 0, purpose: 'Privat', deleted: false, created_at: now, updated_at: now },
      });

      const res = await request(app)
        .patch(`/api/v1/members/${member.uuid}`)
        .set(authHeaders(admin))
        .send({ addresses: [{ type_of_address: 0, purpose: 'Privat 2' }] });

      expect(res.status).toBe(422);
      expect(res.body.detail).toBeTruthy();
    });

    it("cannot edit another member's address by guessing its id", async () => {
      const other = await createApprentice();
      const now = new Date();
      const otherAddress = await prisma.addresses.create({
        data: { addressable_id: other.id, addressable_type: 'User', type_of_address: 2, purpose: 'Sonstiges', city: 'Original', deleted: false, created_at: now, updated_at: now },
      });

      const res = await request(app)
        .patch(`/api/v1/members/${member.uuid}`)
        .set(authHeaders(admin))
        .send({ addresses: [{ id: otherAddress.id, city: 'Hijacked' }] });

      // Rails' nested-attributes lookup is scoped through member.addresses,
      // so an id belonging to a DIFFERENT user's address raises
      // ActiveRecord::RecordNotFound -> 404, not a silent no-op.
      expect(res.status).toBe(404);
      const reloaded = await prisma.addresses.findUniqueOrThrow({ where: { id: otherAddress.id } });
      expect(reloaded.city).toBe('Original');
    });
  });

  describe('PATCH /api/v1/members/:uuid - mother_lodge/accepted_at', () => {
    it('updates both fields together for an admin', async () => {
      const res = await request(app)
        .patch(`/api/v1/members/${member.uuid}`)
        .set(authHeaders(admin))
        .send({ mother_lodge: 'Zur Linde', accepted_at: '2020-01-15' });

      expect(res.status).toBe(200);
      expect(res.body.mother_lodge).toBe('Zur Linde');
      expect(res.body.accepted_at).toBe('2020-01-15');
    });

    it('rejects setting only one of the two fields (both-or-neither validation)', async () => {
      const res = await request(app).patch(`/api/v1/members/${member.uuid}`).set(authHeaders(admin)).send({ mother_lodge: 'Zur Linde' });

      expect(res.status).toBe(422);
    });

    it('is not accepted from a limited (self-service) editor', async () => {
      const res = await request(app)
        .patch(`/api/v1/members/${member.uuid}`)
        .set(authHeaders(member))
        .send({ mother_lodge: 'Zur Linde', accepted_at: '2020-01-15' });

      expect(res.status).toBe(200);
      expect(res.body.mother_lodge).toBeNull();
    });
  });

  describe('PATCH /api/v1/members/:uuid - role_ids', () => {
    let worshipfulMasterRole: Awaited<ReturnType<typeof createRole>>;
    let secretaryPositionRole: Awaited<ReturnType<typeof createRole>>;

    beforeEach(async () => {
      worshipfulMasterRole = await createRole('WorshipfulMaster', { display_name: 'Meister vom Stuhl', administrational_role: false, group: false });
      secretaryPositionRole = await createRole('SecretaryPosition', { display_name: 'Schriftführer', administrational_role: false, group: false });
    });

    it('assigns a position role for an admin', async () => {
      const res = await request(app).patch(`/api/v1/members/${member.uuid}`).set(authHeaders(admin)).send({ role_ids: [worshipfulMasterRole.id] });

      expect(res.status).toBe(200);
      expect(res.body.role_ids).toContain(worshipfulMasterRole.id);
    });

    it('evicts the prior holder of a singular (non-group) role when reassigned', async () => {
      const otherMember = await createApprentice();
      await assignRole(otherMember.id, worshipfulMasterRole.id);

      const res = await request(app).patch(`/api/v1/members/${member.uuid}`).set(authHeaders(admin)).send({ role_ids: [worshipfulMasterRole.id] });

      expect(res.status).toBe(200);
      const otherMemberRoles = await prisma.user_roles.findMany({ where: { user_id: otherMember.id, role_id: worshipfulMasterRole.id } });
      expect(otherMemberRoles).toHaveLength(0);
    });

    it('rolls back a role reassignment when the accompanying member save fails validation (non-atomic write regression)', async () => {
      // Regression: apply_role_ids' writes commit immediately - UserRole's
      // after_save hook evicts the PRIOR holder of a non-group role the
      // instant the new row is created, independent of the member's own
      // save. Before wrapping both in one transaction, a validation failure
      // on the member save (here: mother_lodge without accepted_at) still
      // returned 422, but the role eviction against a completely unrelated
      // third party had ALREADY been committed with no rollback.
      const memberA = await createApprentice();
      await assignRole(memberA.id, worshipfulMasterRole.id);

      const res = await request(app)
        .patch(`/api/v1/members/${member.uuid}`)
        .set(authHeaders(admin))
        .send({ role_ids: [worshipfulMasterRole.id], mother_lodge: 'Zur Linde' });

      expect(res.status).toBe(422);
      expect(res.body.detail).toBeTruthy();

      // The reassignment must have been rolled back: memberA still holds
      // the role, and member must not have picked it up.
      const memberAStillHolds = await prisma.user_roles.findMany({ where: { user_id: memberA.id, role_id: worshipfulMasterRole.id } });
      expect(memberAStillHolds).toHaveLength(1);
      const memberDidNotGain = await prisma.user_roles.findMany({ where: { user_id: member.id, role_id: worshipfulMasterRole.id } });
      expect(memberDidNotGain).toHaveLength(0);
    });

    it('never touches degree roles even when role_ids omits them', async () => {
      const degreeRoleIds = [apprenticeRole.id];
      const before = await prisma.user_roles.findMany({ where: { user_id: member.id, role_id: { in: degreeRoleIds } } });
      expect(before.length).toBeGreaterThan(0);

      const res = await request(app).patch(`/api/v1/members/${member.uuid}`).set(authHeaders(admin)).send({ role_ids: [secretaryPositionRole.id] });

      expect(res.status).toBe(200);
      const after = await prisma.user_roles.findMany({ where: { user_id: member.id, role_id: { in: degreeRoleIds } } });
      expect(after.map((r) => r.role_id).sort()).toEqual(before.map((r) => r.role_id).sort());
    });

    it('is forbidden for a limited (self-service) editor', async () => {
      const res = await request(app).patch(`/api/v1/members/${member.uuid}`).set(authHeaders(member)).send({ role_ids: [worshipfulMasterRole.id] });

      // Not actually a 403 in Rails either: role_ids simply isn't in
      // editable_fields for a limited editor, so it's silently dropped
      // (the same way admin-only scalar fields are) - the update itself
      // still succeeds.
      expect(res.status).toBe(200);
      const rows = await prisma.user_roles.findMany({ where: { user_id: member.id, role_id: worshipfulMasterRole.id } });
      expect(rows).toHaveLength(0);
    });

    describe('privilege escalation via the Admin role id (security regression)', () => {
      it('denies a UserAdmin caller granting the Admin role id to a target, and does not persist it', async () => {
        // Bug: nonDegreeRoleIds() returns every non-degree role id, including
        // Admin's - the only gate on the role_ids write path was
        // ability.can('manage', 'UserRole'), which UserAdmin/Secretary/
        // NetDelegate all hold, none of them Admin themselves. That let a
        // UserAdmin grant Admin to anyone (including themselves).
        const res = await request(app)
          .patch(`/api/v1/members/${member.uuid}`)
          .set(authHeaders(userAdmin))
          .send({ role_ids: [adminRole.id] });

        expect(res.status).toBe(403);
        expect(res.body).toEqual({ error: 'forbidden' });

        const rows = await prisma.user_roles.findMany({ where: { user_id: member.id, role_id: adminRole.id } });
        expect(rows).toHaveLength(0);
      });

      it('denies a UserAdmin caller granting Admin to themselves', async () => {
        const res = await request(app)
          .patch(`/api/v1/members/${userAdmin.uuid}`)
          .set(authHeaders(userAdmin))
          .send({ role_ids: [adminRole.id] });

        expect(res.status).toBe(403);
        const rows = await prisma.user_roles.findMany({ where: { user_id: userAdmin.id, role_id: adminRole.id } });
        expect(rows).toHaveLength(0);
      });

      it('still allows an Admin caller to grant the Admin role', async () => {
        const res = await request(app).patch(`/api/v1/members/${member.uuid}`).set(authHeaders(admin)).send({ role_ids: [adminRole.id] });

        expect(res.status).toBe(200);
        const rows = await prisma.user_roles.findMany({ where: { user_id: member.id, role_id: adminRole.id } });
        expect(rows).toHaveLength(1);
      });

      it('still allows a UserAdmin caller to grant an ordinary (non-Admin) position role', async () => {
        const res = await request(app)
          .patch(`/api/v1/members/${member.uuid}`)
          .set(authHeaders(userAdmin))
          .send({ role_ids: [worshipfulMasterRole.id] });

        expect(res.status).toBe(200);
        const rows = await prisma.user_roles.findMany({ where: { user_id: member.id, role_id: worshipfulMasterRole.id } });
        expect(rows).toHaveLength(1);
      });
    });

    describe('officer-role MFA enforcement', () => {
      it('rejects granting a new non-degree role to an unenrolled user when enforcement is on', async () => {
        await appConfig.set('mfa_enforce_for_officers', true);
        const target = await createApprentice();

        const res = await request(app)
          .patch(`/api/v1/members/${target.uuid}`)
          .set(authHeaders(admin))
          .send({ role_ids: [secretaryPositionRole.id] });

        expect(res.status).toBe(422);
      });

      it('allows granting the role once the target has verified MFA', async () => {
        await appConfig.set('mfa_enforce_for_officers', true);
        const target = await createApprentice();
        await prisma.mfa_totp_credentials.create({
          data: { user_id: target.id, encrypted_secret: 'x', verified_at: new Date(), created_at: new Date(), updated_at: new Date() },
        });

        const res = await request(app)
          .patch(`/api/v1/members/${target.uuid}`)
          .set(authHeaders(admin))
          .send({ role_ids: [secretaryPositionRole.id] });

        expect(res.status).toBe(200);
      });

      it('never revokes an already-held role from an unenrolled existing officer', async () => {
        const target = await createApprentice();
        await assignRole(target.id, secretaryPositionRole.id);
        await appConfig.set('mfa_enforce_for_officers', true);

        // Re-submitting the same role set (no new grant) must succeed even though target has no MFA.
        const res = await request(app)
          .patch(`/api/v1/members/${target.uuid}`)
          .set(authHeaders(admin))
          .send({ role_ids: [secretaryPositionRole.id] });

        expect(res.status).toBe(200);
      });
    });
  });

  describe('DELETE /api/v1/members/:uuid', () => {
    it('is forbidden for a plain member', async () => {
      const res = await request(app).delete(`/api/v1/members/${member.uuid}`).set(authHeaders(member));
      expect(res.status).toBe(403);
    });

    it('soft-deletes and mangles the email for an admin', async () => {
      const target = await createApprentice();

      const res = await request(app).delete(`/api/v1/members/${target.uuid}`).set(authHeaders(admin));

      expect(res.status).toBe(204);
      const reloaded = await prisma.users.findUniqueOrThrow({ where: { id: target.id } });
      expect(reloaded.deleted).toBe(true);
      expect(reloaded.email).toMatch(/^deleted-/);
    });

    it('revokes every outstanding refresh token for the soft-deleted member (stale-cookie regression)', async () => {
      // Bug: soft-delete never revoked the target's refresh tokens - an
      // offboarded/expelled member's existing refresh cookie kept working
      // for up to 30 more days even though fresh logins are blocked
      // (email-mangled).
      const target = await createApprentice();
      const { rawToken } = await issueRefreshToken(target.id);

      const res = await request(app).delete(`/api/v1/members/${target.uuid}`).set(authHeaders(admin));

      expect(res.status).toBe(204);
      await expect(rotateRefreshToken(rawToken)).rejects.toThrow(RefreshTokenInvalidError);
    });

    it('returns 422, not a 500, when the soft-delete save fails validation', async () => {
      // A member with zero roles has no entered_apprentice_since, so
      // User#validate_roles (`on: :update`) fails - the soft-delete's
      // update runs in that same :update validation context.
      const roleless = await createTaggedUser();

      const res = await request(app).delete(`/api/v1/members/${roleless.uuid}`).set(authHeaders(admin));

      expect(res.status).toBe(422);
      expect(res.body.detail).toBeTruthy();
      const reloaded = await prisma.users.findUniqueOrThrow({ where: { id: roleless.id } });
      expect(reloaded.deleted).toBe(false);
    });
  });

  describe('POST /:uuid/mfa/reset', () => {
    it('wipes MFA, forces a password reset, and revokes refresh tokens', async () => {
      const localAdmin = await createAdminUser();
      const target = await createTaggedUser();
      await prisma.mfa_totp_credentials.create({
        data: { user_id: target.id, encrypted_secret: 'x', verified_at: new Date(), created_at: new Date(), updated_at: new Date() },
      });
      const { rawToken } = await issueRefreshToken(target.id);

      const res = await request(app)
        .post(`/api/v1/members/${target.uuid}/mfa/reset`)
        .set('Authorization', `Bearer ${issueAccessToken(localAdmin.id)}`)
        .send({});
      expect(res.status).toBe(204);

      expect(await prisma.mfa_totp_credentials.findUnique({ where: { user_id: target.id } })).toBeNull();
      const updatedUser = await prisma.users.findUniqueOrThrow({ where: { id: target.id } });
      expect(updatedUser.reset_password_token).not.toBeNull();

      const digest = createHash('sha256').update(rawToken).digest('hex');
      const tokenRow = await prisma.refresh_tokens.findUnique({ where: { token_digest: digest } });
      expect(tokenRow?.revoked_at).not.toBeNull();

      const auditRow = await prisma.mfa_reset_events.findFirstOrThrow({ where: { user_id: target.id } });
      expect(auditRow.admin_id).toBe(localAdmin.id);
    });

    it('preserves an existing officer role on reset', async () => {
      const localAdmin = await createAdminUser();
      const target = await createTaggedUser();
      // Not among the roles this file's beforeEach seeds (EnteredApprentice/
      // FellowCraft/MasterMason/Admin/UserAdmin) - minted locally rather than
      // assumed to already exist.
      const secretaryRole = await createRole('Secretary', { display_name: 'Secretary' });
      await prisma.user_roles.create({ data: { user_id: target.id, role_id: secretaryRole.id, created_at: new Date(), updated_at: new Date() } });

      await request(app).post(`/api/v1/members/${target.uuid}/mfa/reset`).set('Authorization', `Bearer ${issueAccessToken(localAdmin.id)}`).send({});

      const roleRows = await prisma.user_roles.findMany({ where: { user_id: target.id } });
      expect(roleRows.some((r) => r.role_id === secretaryRole.id)).toBe(true);
    });

    it('rejects a non-admin caller', async () => {
      const nonAdmin = await createUser();
      const target = await createTaggedUser();
      const res = await request(app)
        .post(`/api/v1/members/${target.uuid}/mfa/reset`)
        .set('Authorization', `Bearer ${issueAccessToken(nonAdmin.id)}`)
        .send({});
      expect(res.status).toBe(403);
    });

    // Regression test for the Task 11 bypass: default_user_abilities grants
    // every authenticated user `update` on their OWN User row unconditionally,
    // so a hijacked session token could otherwise call this route against its
    // own uuid with zero step-up proof, wipe its own MFA, then sail straight
    // through /mfa/setup/start's proof-of-control gate (which only triggers
    // when a verified method already exists). Covers both a plain member and
    // an Admin targeting themselves - the explicit self-guard must reject
    // both, even though an Admin's own MFA would otherwise also satisfy
    // canDestroyRow via applicationAdminAbilities' unconditional `manage`
    // grant on User.
    it('rejects a member targeting their own uuid, even with no admin role', async () => {
      const target = await createTaggedUser();
      const res = await request(app)
        .post(`/api/v1/members/${target.uuid}/mfa/reset`)
        .set('Authorization', `Bearer ${issueAccessToken(target.id)}`)
        .send({});
      expect(res.status).toBe(403);
    });

    it('rejects an admin targeting their own uuid', async () => {
      const localAdmin = await createAdminUser();
      const res = await request(app)
        .post(`/api/v1/members/${localAdmin.uuid}/mfa/reset`)
        .set('Authorization', `Bearer ${issueAccessToken(localAdmin.id)}`)
        .send({});
      expect(res.status).toBe(403);
    });

    // Regression test for the impersonation bypass of the self-target guard
    // above: req.currentUser reflects the impersonation token's `sub` (the
    // impersonated user), not the real actor, so a hijacked Admin session
    // (A) could impersonate a lesser-privileged-but-still-authorized account
    // (B) to get sub=B/act=A, then call this route against A's OWN uuid -
    // which no longer equals req.currentUser!.id (B), sailing past the
    // self-guard and wiping A's MFA with the audit row misattributed to B.
    //
    // The impersonated `sub` user is deliberately given a Secretary role
    // (mirroring the "preserves an existing officer role" fixture above),
    // not a plain member - a plain member's default_user_abilities never
    // grants `destroy` at all, so canDestroyRow would already 403 pre-fix
    // and the test wouldn't actually discriminate the new guard from the
    // pre-existing CASL check. With Secretary reach, canDestroyRow succeeds
    // against a non-admin target regardless of the show_admins config, so
    // pre-fix this request would wipe the target's MFA (204); only the new
    // `req.impersonatorId` guard makes it 403.
    it('rejects a request made via an impersonation token, even though the impersonated user could otherwise pass canDestroyRow', async () => {
      const localAdmin = await createAdminUser();
      const secretaryRole = await createRole('Secretary', { display_name: 'Schriftführer' });
      const impersonatedSecretary = await createTaggedUser();
      await assignRole(impersonatedSecretary.id, secretaryRole.id);
      const target = await createTaggedUser();

      const res = await request(app)
        .post(`/api/v1/members/${target.uuid}/mfa/reset`)
        .set('Authorization', `Bearer ${issueAccessToken(impersonatedSecretary.id, localAdmin.id)}`)
        .send({});

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
    });
  });
});
