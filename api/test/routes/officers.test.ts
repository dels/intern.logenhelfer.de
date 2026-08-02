import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import type { users } from '../../src/generated/prisma/client.js';

import { issueAccessToken } from '../../src/auth/jwt.js';
import { apiErrorHandler } from '../../src/lib/errors.js';
import officersRouter from '../../src/routes/officers.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

// Port of rails-app/spec/requests/api/v1/officers_spec.rb (5 examples), plus
// a small number of net-new security tests (see the bottom describe block).

const app = express();
app.use(express.json());
app.use('/api/v1/officers', officersRouter);
app.use(apiErrorHandler);

function authHeaders(user: users): { Authorization: string } {
  return { Authorization: `Bearer ${issueAccessToken(user.id)}` };
}

let roleCounter = 0;

async function createRole(name: string, overrides: Partial<{ display_name: string; administrational_role: boolean }> = {}) {
  roleCounter += 1;
  const now = new Date();
  const existing = await prisma.roles.findFirst({ where: { name } });
  if (existing) {
    return existing;
  }
  return prisma.roles.create({
    data: {
      name,
      display_name: overrides.display_name ?? name,
      administrational_role: overrides.administrational_role,
      created_at: now,
      updated_at: now,
    },
  });
}

async function assignRole(userId: number, roleId: number): Promise<void> {
  const now = new Date();
  await prisma.user_roles.create({
    data: { user_id: userId, role_id: roleId, created_at: now, updated_at: now, role_added_at: now },
  });
}

async function createDistrict(name: string) {
  const now = new Date();
  return prisma.districts.create({ data: { name, deleted: false, created_at: now, updated_at: now } });
}

let lodgeCounter = 0;
async function createLodge(name: string, districtId: number) {
  lodgeCounter += 1;
  const now = new Date();
  return prisma.lodges.create({
    data: { name, slug: `lodge-${lodgeCounter}`, district_id: districtId, deleted: false, created_at: now, updated_at: now },
  });
}

let officerCounter = 0;
async function createOfficer(lodgeId: number, roleId: number, overrides: Partial<{ firstname: string; lastname: string; role_email: string }> = {}) {
  officerCounter += 1;
  const now = new Date();
  return prisma.officers.create({
    data: {
      uuid: `officer-uuid-${officerCounter}`,
      lodge_id: lodgeId,
      firstname: overrides.firstname ?? 'Max',
      lastname: overrides.lastname ?? 'Mustermann',
      role_id: roleId,
      role_email: overrides.role_email ?? 'redner@example.org',
      deleted: false,
      created_at: now,
      updated_at: now,
    },
  });
}

describe('Officers API', () => {
  beforeEach(async () => {
    await resetDb();
  });

  async function makeMember(): Promise<users> {
    const apprenticeRole = await createRole('EnteredApprentice', { display_name: 'Lehrling' });
    const user = await createUser();
    await assignRole(user.id, apprenticeRole.id);
    return user;
  }

  async function makeWorshipfulMaster(): Promise<users> {
    const role = await createRole('WorshipfulMaster', { display_name: 'Meister vom Stuhl' });
    const user = await createUser();
    await assignRole(user.id, role.id);
    return user;
  }

  describe('GET /api/v1/officers', () => {
    it('is forbidden for a plain member', async () => {
      const district = await createDistrict('Nordwest');
      const lodge = await createLodge('Zur Standhaftigkeit', district.id);
      const member = await makeMember();

      const res = await request(app).get('/api/v1/officers').query({ lodge_slug: lodge.slug }).set(authHeaders(member));

      expect(res.status).toBe(403);
    });

    it('lists officers for the given lodge for a WorshipfulMaster', async () => {
      const district = await createDistrict('Nordwest');
      const lodge = await createLodge('Zur Standhaftigkeit', district.id);
      const role = await createRole('Speaker', { display_name: 'Redner', administrational_role: false });
      await createOfficer(lodge.id, role.id);
      const worshipfulMaster = await makeWorshipfulMaster();

      const res = await request(app).get('/api/v1/officers').query({ lodge_slug: lodge.slug }).set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(200);
      const names = res.body.rows.map((o: { lastname: string }) => o.lastname);
      expect(names).toContain('Mustermann');
    });
  });

  describe('POST /api/v1/officers', () => {
    it('creates an officer under the given lodge', async () => {
      const district = await createDistrict('Nordwest');
      const lodge = await createLodge('Zur Standhaftigkeit', district.id);
      const role = await createRole('Speaker', { display_name: 'Redner', administrational_role: false });
      const worshipfulMaster = await makeWorshipfulMaster();

      const res = await request(app)
        .post('/api/v1/officers')
        .send({ lodge_slug: lodge.slug, firstname: 'Erika', lastname: 'Musterfrau', role_id: role.id, role_email: 'erika@example.org' })
        .set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(201);
      const created = await prisma.officers.findFirstOrThrow({ where: { lastname: 'Musterfrau' } });
      expect(created.lodge_id).toBe(lodge.id);
    });
  });

  describe('PATCH /api/v1/officers/:uuid', () => {
    it('cannot move an officer to a different lodge', async () => {
      const district = await createDistrict('Nordwest');
      const lodge = await createLodge('Zur Standhaftigkeit', district.id);
      const otherLodge = await createLodge('Zur Einigkeit', district.id);
      const role = await createRole('Speaker', { display_name: 'Redner', administrational_role: false });
      const officer = await createOfficer(lodge.id, role.id);
      const worshipfulMaster = await makeWorshipfulMaster();

      const res = await request(app)
        .patch(`/api/v1/officers/${officer.uuid}`)
        .send({ lodge_slug: otherLodge.slug, lastname: 'Umbenannt' })
        .set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(200);
      const reloaded = await prisma.officers.findUniqueOrThrow({ where: { id: officer.id } });
      expect(reloaded.lastname).toBe('Umbenannt');
      expect(reloaded.lodge_id).toBe(lodge.id);
    });
  });

  describe('DELETE /api/v1/officers/:uuid', () => {
    it('soft-deletes the officer', async () => {
      const district = await createDistrict('Nordwest');
      const lodge = await createLodge('Zur Standhaftigkeit', district.id);
      const role = await createRole('Speaker', { display_name: 'Redner', administrational_role: false });
      const officer = await createOfficer(lodge.id, role.id);
      const worshipfulMaster = await makeWorshipfulMaster();

      const res = await request(app).delete(`/api/v1/officers/${officer.uuid}`).set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(204);
      const reloaded = await prisma.officers.findUniqueOrThrow({ where: { id: officer.id } });
      expect(reloaded.deleted).toBe(true);
    });
  });

  // Net-new tests (not in the Rails spec) covering GET /api/v1/officers/:uuid
  // (show) and the lodge_slug bad-request/not-found paths - the Rails
  // controller has these behaviors but officers_spec.rb never exercises them
  // directly.
  describe('GET /api/v1/officers/:uuid (show)', () => {
    it('returns the officer detail, including lodge_slug/lodge_name, for a WorshipfulMaster', async () => {
      const district = await createDistrict('Nordwest');
      const lodge = await createLodge('Zur Standhaftigkeit', district.id);
      const role = await createRole('Speaker', { display_name: 'Redner', administrational_role: false });
      const officer = await createOfficer(lodge.id, role.id);
      const worshipfulMaster = await makeWorshipfulMaster();

      const res = await request(app).get(`/api/v1/officers/${officer.uuid}`).set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        uuid: officer.uuid,
        lodge_slug: lodge.slug,
        lodge_name: 'Zur Standhaftigkeit',
        role_display_name: 'Redner',
      });
    });
  });

  describe('GET /api/v1/officers (lodge_slug edge cases)', () => {
    it('returns 400 bad_request when lodge_slug is missing', async () => {
      const worshipfulMaster = await makeWorshipfulMaster();

      const res = await request(app).get('/api/v1/officers').set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('bad_request');
    });

    it('returns 404 when lodge_slug matches no lodge', async () => {
      const worshipfulMaster = await makeWorshipfulMaster();

      const res = await request(app).get('/api/v1/officers').query({ lodge_slug: 'does-not-exist' }).set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(404);
    });
  });

  // Net-new security tests (not in the Rails spec).
  describe('security', () => {
    it('authz boundary: a technically-valid token for a plain member gets 403 on every mutating action', async () => {
      const district = await createDistrict('Nordwest');
      const lodge = await createLodge('Zur Standhaftigkeit', district.id);
      const role = await createRole('Speaker', { display_name: 'Redner', administrational_role: false });
      const officer = await createOfficer(lodge.id, role.id);
      const member = await makeMember();

      const createRes = await request(app)
        .post('/api/v1/officers')
        .send({ lodge_slug: lodge.slug, firstname: 'X', lastname: 'Y', role_id: role.id, role_email: 'x@example.org' })
        .set(authHeaders(member));
      const updateRes = await request(app)
        .patch(`/api/v1/officers/${officer.uuid}`)
        .send({ lastname: 'Hacked' })
        .set(authHeaders(member));
      const deleteRes = await request(app).delete(`/api/v1/officers/${officer.uuid}`).set(authHeaders(member));

      expect(createRes.status).toBe(403);
      expect(updateRes.status).toBe(403);
      expect(deleteRes.status).toBe(403);
      const reloaded = await prisma.officers.findUniqueOrThrow({ where: { id: officer.id } });
      expect(reloaded.lastname).toBe('Mustermann');
      expect(reloaded.deleted).toBe(false);
    });

    it('is not vulnerable to SQL-metacharacter injection via the lodge_slug query param', async () => {
      const district = await createDistrict('Nordwest');
      const lodge = await createLodge('Zur Standhaftigkeit', district.id);
      const role = await createRole('Speaker', { display_name: 'Redner', administrational_role: false });
      await createOfficer(lodge.id, role.id);
      const worshipfulMaster = await makeWorshipfulMaster();

      const res = await request(app)
        .get('/api/v1/officers')
        .query({ lodge_slug: "' OR '1'='1" })
        .set(authHeaders(worshipfulMaster));

      // Prisma's parameterization means a metacharacter-laden lodge_slug
      // simply matches no lodge (404), rather than erroring or leaking every
      // officer across every lodge.
      expect(res.status).toBe(404);
    });

    it('is not vulnerable to a % wildcard payload via the lodge_slug query param', async () => {
      const district = await createDistrict('Nordwest');
      const lodge = await createLodge('Zur Standhaftigkeit', district.id);
      const role = await createRole('Speaker', { display_name: 'Redner', administrational_role: false });
      await createOfficer(lodge.id, role.id);
      const worshipfulMaster = await makeWorshipfulMaster();

      const res = await request(app).get('/api/v1/officers').query({ lodge_slug: '%' }).set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(404);
    });
  });
});
