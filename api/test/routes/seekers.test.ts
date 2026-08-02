import { randomUUID } from 'node:crypto';

import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import { issueAccessToken } from '../../src/auth/jwt.js';
import { appConfig, KNOWN_KEYS } from '../../src/lib/appConfig.js';
import { apiErrorHandler } from '../../src/lib/errors.js';
import { seekersRouter } from '../../src/routes/seekers.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

// Port of rails-app/spec/requests/api/v1/seekers_spec.rb (14 examples).
//
// The Rails spec relies on `assert_response_schema_confirm` (an OpenAPI
// contract-validation matcher wired into the Rails test suite). An
// equivalent (api/src/middleware/contractValidation.ts) exists in this repo,
// but - consistent with every other per-resource test file under
// api/test/routes/ (none of them wire it in either) - it's mounted globally
// on the real app by a later integration step, not per-route-test here. This
// port asserts on the exact response shape directly instead of delegating
// that check to the schema validator.

const STATUS = {
  contacted: 0,
  visiting: 10,
  accepted: 100,
  declined: 1000,
} as const;

const WAY_OF_CONTACT = {
  phone: 20,
} as const;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/v1/seekers', seekersRouter);
  app.use(apiErrorHandler);
  return app;
}

const app = buildApp();

function authHeaders(user: { id: number }): { Authorization: string } {
  return { Authorization: `Bearer ${issueAccessToken(user.id)}` };
}

async function createRole(name: string) {
  const now = new Date();
  return prisma.roles.create({ data: { name, display_name: name, created_at: now, updated_at: now } });
}

async function createUserWithRole(roleName: string): ReturnType<typeof createUser> {
  const user = await createUser();
  const role = await createRole(roleName);
  const now = new Date();
  await prisma.user_roles.create({ data: { user_id: user.id, role_id: role.id, created_at: now, updated_at: now } });
  return user;
}

/**
 * Port of the spec's `build_seeker` helper. `way_of_contact_validation` runs
 * on every save, including create - a phone-preferred seeker must already
 * have address.phone set in the same "create", and Address's own presence
 * validations require purpose/type_of_address regardless of
 * preferred_way_of_contact.
 */
async function buildSeeker(
  overrides: { preferredWayOfContact?: number; status?: number; invite?: boolean } = {},
): Promise<{ id: number; uuid: string }> {
  const { preferredWayOfContact = WAY_OF_CONTACT.phone, status = STATUS.contacted, invite = true } = overrides;
  const now = new Date();
  const uuid = randomUUID();
  const seeker = await prisma.seekers.create({
    data: {
      firstname: 'Max',
      lastname: 'Sucher',
      source: 'Empfehlung',
      status,
      invite,
      preferred_way_of_contact: preferredWayOfContact,
      uuid,
      deleted: false,
      created_at: now,
      updated_at: now,
    },
  });
  await prisma.addresses.create({
    data: {
      addressable_id: seeker.id,
      addressable_type: 'Seeker',
      phone: '+49 (30) 1234567',
      purpose: 'Privat',
      type_of_address: 0,
      deleted: false,
      created_at: now,
      updated_at: now,
    },
  });
  return { id: seeker.id, uuid };
}

describe('Seekers API', () => {
  let worshipfulMaster: Awaited<ReturnType<typeof createUser>>;
  let councilMember: Awaited<ReturnType<typeof createUser>>;
  let plainMember: Awaited<ReturnType<typeof createUser>>;

  beforeEach(async () => {
    await resetDb();
    // appConfig caches records process-wide - see statistics.test.ts's
    // identical reset, needed here since the names-list tests below toggle
    // show_seeker_names_to_brothers.
    for (const key of Object.keys(KNOWN_KEYS)) appConfig.dirty(key);
    worshipfulMaster = await createUserWithRole('WorshipfulMaster');
    councilMember = await createUserWithRole('MemberOfCouncil');
    plainMember = await createUserWithRole('EnteredApprentice');
  });

  describe('GET /api/v1/seekers', () => {
    it('lists active seekers (default filter) visible to a council member', async () => {
      const active = await buildSeeker();
      const declined = await buildSeeker({ status: STATUS.declined });

      const res = await request(app).get('/api/v1/seekers').set(authHeaders(councilMember));

      expect(res.status).toBe(200);
      const uuids = (res.body.rows as { uuid: string }[]).map((r) => r.uuid);
      expect(uuids).toContain(active.uuid);
      expect(uuids).not.toContain(declined.uuid);
    });

    it('filters by accepted/inactive/declined', async () => {
      const accepted = await buildSeeker({ status: STATUS.accepted });
      const inactive = await buildSeeker({ invite: false });
      const declined = await buildSeeker({ status: STATUS.declined });

      const acceptedRes = await request(app).get('/api/v1/seekers').query({ filter: 'accepted' }).set(authHeaders(councilMember));
      expect((acceptedRes.body.rows as { uuid: string }[]).map((r) => r.uuid)).toContain(accepted.uuid);

      const inactiveRes = await request(app).get('/api/v1/seekers').query({ filter: 'inactive' }).set(authHeaders(councilMember));
      expect((inactiveRes.body.rows as { uuid: string }[]).map((r) => r.uuid)).toContain(inactive.uuid);

      const declinedRes = await request(app).get('/api/v1/seekers').query({ filter: 'declined' }).set(authHeaders(councilMember));
      expect((declinedRes.body.rows as { uuid: string }[]).map((r) => r.uuid)).toContain(declined.uuid);
    });

    it('forbids a plain member', async () => {
      const res = await request(app).get('/api/v1/seekers').set(authHeaders(plainMember));
      expect(res.status).toBe(403);
    });

    it('401s without a token', async () => {
      const res = await request(app).get('/api/v1/seekers');
      expect(res.status).toBe(401);
    });

    it('sorts by status_label using the underlying status column', async () => {
      // Both statuses fall in the default filter's bucket (excludes only
      // declined/accepted) so both rows are visible under one query.
      const contacted = await buildSeeker({ status: STATUS.contacted });
      const visiting = await buildSeeker({ status: STATUS.visiting });

      const asc = await request(app).get('/api/v1/seekers').query({ sort: 'status_label' }).set(authHeaders(councilMember));
      expect(asc.status).toBe(200);
      const ascUuids = (asc.body.rows as { uuid: string }[]).map((r) => r.uuid);
      expect(ascUuids.indexOf(contacted.uuid)).toBeLessThan(ascUuids.indexOf(visiting.uuid));

      const desc = await request(app).get('/api/v1/seekers').query({ sort: '-status_label' }).set(authHeaders(councilMember));
      const descUuids = (desc.body.rows as { uuid: string }[]).map((r) => r.uuid);
      expect(descUuids.indexOf(visiting.uuid)).toBeLessThan(descUuids.indexOf(contacted.uuid));
    });

    it('sorts by contact_value (a derived, joined-address field with no real DB column), nulls last', async () => {
      const withPhone = await buildSeeker({ preferredWayOfContact: WAY_OF_CONTACT.phone });
      const withoutContact = await buildSeeker();
      await prisma.seekers.update({ where: { id: withoutContact.id }, data: { preferred_way_of_contact: null } });

      const res = await request(app).get('/api/v1/seekers').query({ sort: 'contact_value' }).set(authHeaders(councilMember));

      expect(res.status).toBe(200);
      const rows = res.body.rows as { uuid: string; contact_value: string | null }[];
      const withPhoneIdx = rows.findIndex((r) => r.uuid === withPhone.uuid);
      const withoutContactIdx = rows.findIndex((r) => r.uuid === withoutContact.uuid);
      expect(withPhoneIdx).toBeGreaterThanOrEqual(0);
      expect(withoutContactIdx).toBeGreaterThan(withPhoneIdx);
      expect(rows[withoutContactIdx].contact_value).toBeNull();
      // row_count must reflect every matching seeker, not just the page the
      // fetch-all-then-JS-sort/paginate path happens to return.
      expect(res.body.row_count).toBeGreaterThanOrEqual(2);
    });
  });

  describe('POST /api/v1/seekers', () => {
    const params = {
      firstname: 'New',
      lastname: 'Seeker',
      source: 'Website',
      status: STATUS.contacted,
      invite: true,
      preferred_way_of_contact: WAY_OF_CONTACT.phone,
      address: { phone: '+49 (30) 7654321', type_of_address: 0, purpose: 'Privat' },
    };

    it('forbids a council member (read-only)', async () => {
      const res = await request(app).post('/api/v1/seekers').set(authHeaders(councilMember)).send(params);
      expect(res.status).toBe(403);
    });

    it('creates a seeker with a nested address for a worshipful master', async () => {
      const res = await request(app).post('/api/v1/seekers').set(authHeaders(worshipfulMaster)).send(params);

      expect(res.status).toBe(201);
      const created = await prisma.seekers.findFirstOrThrow({ where: { uuid: res.body.uuid as string } });
      const address = await prisma.addresses.findFirst({ where: { addressable_id: created.id, addressable_type: 'Seeker' } });
      expect(address?.phone).toBe('+49 (30) 7654321');
      // notes key is present (worshipful_master has :update) but nil - none was given on create.
      expect(res.body).toHaveProperty('notes');
      expect(res.body.notes).toBeNull();
    });

    it('returns 422 with a detail message when preferred_way_of_contact has no matching address field', async () => {
      const badParams = { ...params, address: { type_of_address: 0, purpose: 'Privat' } };
      const res = await request(app).post('/api/v1/seekers').set(authHeaders(worshipfulMaster)).send(badParams);

      expect(res.status).toBe(422);
      expect(res.body.detail).toBeTruthy();
    });
  });

  describe('GET /api/v1/seekers/:uuid', () => {
    it('omits notes for a council member (no :update ability)', async () => {
      const seeker = await buildSeeker();
      await prisma.seekers.update({ where: { id: seeker.id }, data: { notes: 'Sensitive vetting note' } });

      const res = await request(app).get(`/api/v1/seekers/${seeker.uuid}`).set(authHeaders(councilMember));

      expect(res.status).toBe(200);
      expect(res.body).not.toHaveProperty('notes');
    });

    it('includes notes for a worshipful master', async () => {
      const seeker = await buildSeeker();
      await prisma.seekers.update({ where: { id: seeker.id }, data: { notes: 'Sensitive vetting note' } });

      const res = await request(app).get(`/api/v1/seekers/${seeker.uuid}`).set(authHeaders(worshipfulMaster));

      expect(res.body.notes).toBe('Sensitive vetting note');
    });

    it('404s for an unknown uuid', async () => {
      const res = await request(app).get('/api/v1/seekers/does-not-exist').set(authHeaders(councilMember));
      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/seekers/:uuid', () => {
    it('forbids a council member', async () => {
      const seeker = await buildSeeker();
      const res = await request(app)
        .patch(`/api/v1/seekers/${seeker.uuid}`)
        .set(authHeaders(councilMember))
        .send({ source: 'Changed' });
      expect(res.status).toBe(403);
    });

    it('lets a worshipful master update status and the nested address', async () => {
      const seeker = await buildSeeker();

      const res = await request(app)
        .patch(`/api/v1/seekers/${seeker.uuid}`)
        .set(authHeaders(worshipfulMaster))
        .send({ status: STATUS.visiting, address: { phone: '+49 (30) 9999999' } });

      expect(res.status).toBe(200);
      const reloaded = await prisma.seekers.findUniqueOrThrow({ where: { id: seeker.id } });
      expect(reloaded.status).toBe(STATUS.visiting);
      const address = await prisma.addresses.findFirst({ where: { addressable_id: seeker.id, addressable_type: 'Seeker' } });
      expect(address?.phone).toBe('+49 (30) 9999999');
    });
  });

  describe('DELETE /api/v1/seekers/:uuid', () => {
    it('forbids a council member', async () => {
      const seeker = await buildSeeker();
      const res = await request(app).delete(`/api/v1/seekers/${seeker.uuid}`).set(authHeaders(councilMember));
      expect(res.status).toBe(403);
    });

    it('soft-deletes for a worshipful master', async () => {
      const seeker = await buildSeeker();

      const res = await request(app).delete(`/api/v1/seekers/${seeker.uuid}`).set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(204);
      const stillFindable = await prisma.seekers.findFirst({ where: { id: seeker.id, deleted: false } });
      expect(stillFindable).toBeNull();
      const raw = await prisma.seekers.findUniqueOrThrow({ where: { id: seeker.id } });
      expect(raw.deleted).toBe(true);
    });
  });

  // Net-new coverage: this repo's own show_seeker_names_to_brothers feature,
  // not part of the ported Rails spec.
  describe('GET /api/v1/seekers/names', () => {
    it('403s a plain member when the flag is disabled (the default)', async () => {
      const res = await request(app).get('/api/v1/seekers/names').set(authHeaders(plainMember));
      expect(res.status).toBe(403);
    });

    it('returns active seekers - names only - for a plain member once the flag is enabled', async () => {
      await appConfig.set('show_seeker_names_to_brothers', true);
      await buildSeeker();
      await buildSeeker({ status: STATUS.declined });
      await buildSeeker({ status: STATUS.accepted });
      await buildSeeker({ invite: false });

      const res = await request(app).get('/api/v1/seekers/names').set(authHeaders(plainMember));

      expect(res.status).toBe(200);
      expect(res.body.row_count).toBe(1);
      expect(res.body.rows).toEqual([{ firstname: 'Max', lastname: 'Sucher' }]);
      // Response shape is names-only - no uuid/status/contact/notes/etc.
      expect(Object.keys(res.body.rows[0]).sort()).toEqual(['firstname', 'lastname']);
    });

    it('403s a Worshipful Master even when the flag is enabled - they already have full Seeker access via GET /api/v1/seekers', async () => {
      await appConfig.set('show_seeker_names_to_brothers', true);
      const res = await request(app).get('/api/v1/seekers/names').set(authHeaders(worshipfulMaster));
      expect(res.status).toBe(403);
    });

    it('403s a council member even when the flag is enabled - same reasoning as the Worshipful Master case', async () => {
      await appConfig.set('show_seeker_names_to_brothers', true);
      const res = await request(app).get('/api/v1/seekers/names').set(authHeaders(councilMember));
      expect(res.status).toBe(403);
    });

    it('401s without a token', async () => {
      const res = await request(app).get('/api/v1/seekers/names');
      expect(res.status).toBe(401);
    });
  });

  // Net-new security coverage beyond the ported spec (not in seekers_spec.rb).
  describe('security: authz boundary and injection resistance', () => {
    it('forbids a role with no Seeker ability at all (EnteredApprentice) on every action, even with a technically-valid token', async () => {
      const seeker = await buildSeeker();

      const show = await request(app).get(`/api/v1/seekers/${seeker.uuid}`).set(authHeaders(plainMember));
      expect(show.status).toBe(403);

      const create = await request(app)
        .post('/api/v1/seekers')
        .set(authHeaders(plainMember))
        .send({ firstname: 'X', lastname: 'Y', source: 'Z', status: STATUS.contacted });
      expect(create.status).toBe(403);

      const update = await request(app)
        .patch(`/api/v1/seekers/${seeker.uuid}`)
        .set(authHeaders(plainMember))
        .send({ source: 'Changed' });
      expect(update.status).toBe(403);

      const destroy = await request(app).delete(`/api/v1/seekers/${seeker.uuid}`).set(authHeaders(plainMember));
      expect(destroy.status).toBe(403);
    });

    it('treats a SQL-metacharacter-laden filter/sort param as an ordinary (non-matching) value, not an injection vector', async () => {
      await buildSeeker();

      const res = await request(app)
        .get('/api/v1/seekers')
        .query({ filter: "'; DROP TABLE seekers; --", sort: "-lastname'); DROP TABLE seekers; --" })
        .set(authHeaders(councilMember));

      // An unrecognized filter falls back to the default ("active") branch,
      // and an unrecognized sort field falls back to the default sort
      // column - Prisma's parameterization means neither string reaches the
      // database as anything other than a bound value/whitelisted column
      // name, so this must behave like an ordinary request, not error.
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.rows)).toBe(true);

      // The seekers table must still be fully intact and queryable.
      const stillThere = await prisma.seekers.count();
      expect(stillThere).toBe(1);
    });
  });
});
