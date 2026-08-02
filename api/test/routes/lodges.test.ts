import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import type { users } from '../../src/generated/prisma/client.js';

import { issueAccessToken } from '../../src/auth/jwt.js';
import { apiErrorHandler } from '../../src/lib/errors.js';
import lodgesRouter from '../../src/routes/lodges.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

// Port of rails-app/spec/requests/api/v1/lodges_spec.rb (6 examples), plus a
// small number of net-new security tests (see the bottom describe block).

const app = express();
app.use(express.json());
app.use('/api/v1/lodges', lodgesRouter);
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

describe('Lodges API', () => {
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

  describe('GET /api/v1/lodges', () => {
    it('is forbidden for a plain member', async () => {
      const member = await makeMember();

      const res = await request(app).get('/api/v1/lodges').set(authHeaders(member));

      expect(res.status).toBe(403);
    });

    it('lists lodges with their district name for a WorshipfulMaster', async () => {
      const district = await createDistrict('Nordwest');
      const now = new Date();
      const lodge = await prisma.lodges.create({
        data: { name: 'Zur Standhaftigkeit', slug: 'zur-standhaftigkeit', district_id: district.id, deleted: false, created_at: now, updated_at: now },
      });
      const worshipfulMaster = await makeWorshipfulMaster();

      // per_page: 100 (the endpoint's max) - this suite's shared DB
      // accumulates Lodge rows across the whole run; default per_page: 25,
      // alphabetically sorted, could push this example's own lodge off the
      // first page once enough other lodges exist.
      const res = await request(app).get('/api/v1/lodges').query({ per_page: 100 }).set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(200);
      const row = res.body.rows.find((r: { slug: string }) => r.slug === lodge.slug);
      expect(row.district_name).toBe('Nordwest');
    });

    it('defaults to sorting by name ascending', async () => {
      const district = await createDistrict('Nordwest');
      const now = new Date();
      const zeta = await prisma.lodges.create({ data: { name: 'Zeta-Loge', slug: `zeta-${now.getTime()}`, district_id: district.id, deleted: false, created_at: now, updated_at: now } });
      const alpha = await prisma.lodges.create({ data: { name: 'Alpha-Loge', slug: `alpha-${now.getTime()}`, district_id: district.id, deleted: false, created_at: now, updated_at: now } });
      const worshipfulMaster = await makeWorshipfulMaster();

      const res = await request(app).get('/api/v1/lodges').query({ per_page: 100 }).set(authHeaders(worshipfulMaster));
      const slugs = (res.body.rows as Array<{ slug: string }>).map((r) => r.slug);
      expect(slugs.indexOf(alpha.slug)).toBeLessThan(slugs.indexOf(zeta.slug));
    });

    it('sorts by district_name, a joined field with no Prisma relation, ascending/descending via ?sort=', async () => {
      const districtA = await createDistrict('Alpha-Distrikt');
      const districtZ = await createDistrict('Zeta-Distrikt');
      const now = new Date();
      const lodgeInZ = await prisma.lodges.create({ data: { name: 'Loge Z', slug: `loge-z-${now.getTime()}`, district_id: districtZ.id, deleted: false, created_at: now, updated_at: now } });
      const lodgeInA = await prisma.lodges.create({ data: { name: 'Loge A', slug: `loge-a-${now.getTime()}`, district_id: districtA.id, deleted: false, created_at: now, updated_at: now } });
      const worshipfulMaster = await makeWorshipfulMaster();

      const asc = await request(app).get('/api/v1/lodges').query({ per_page: 100, sort: 'district_name' }).set(authHeaders(worshipfulMaster));
      const ascSlugs = (asc.body.rows as Array<{ slug: string }>).map((r) => r.slug);
      expect(ascSlugs.indexOf(lodgeInA.slug)).toBeLessThan(ascSlugs.indexOf(lodgeInZ.slug));

      const desc = await request(app).get('/api/v1/lodges').query({ per_page: 100, sort: '-district_name' }).set(authHeaders(worshipfulMaster));
      const descSlugs = (desc.body.rows as Array<{ slug: string }>).map((r) => r.slug);
      expect(descSlugs.indexOf(lodgeInZ.slug)).toBeLessThan(descSlugs.indexOf(lodgeInA.slug));
    });

    it('falls back to the default sort for an unknown/malicious ?sort= value, without erroring', async () => {
      const worshipfulMaster = await makeWorshipfulMaster();
      const res = await request(app).get('/api/v1/lodges').query({ sort: 'deleted;DROP TABLE users;--' }).set(authHeaders(worshipfulMaster));
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/lodges', () => {
    it('creates a lodge for a WorshipfulMaster', async () => {
      const district = await createDistrict('Nordwest');
      const worshipfulMaster = await makeWorshipfulMaster();

      const res = await request(app)
        .post('/api/v1/lodges')
        .send({ name: 'Zur Einigkeit', district_id: district.id })
        .set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(201);
      const created = await prisma.lodges.findFirstOrThrow({ where: { slug: res.body.slug } });
      expect(created.district_id).toBe(district.id);
    });

    it('returns 422 when district_id is missing', async () => {
      const worshipfulMaster = await makeWorshipfulMaster();

      const res = await request(app).post('/api/v1/lodges').send({ name: 'Ohne Distrikt' }).set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(422);
      expect(res.body.detail).toBeTruthy();
    });
  });

  describe('PATCH /api/v1/lodges/:slug', () => {
    it('can move a lodge to a different district (district_id is NOT immutable, unlike Directory#category_slug)', async () => {
      const district = await createDistrict('Nordwest');
      const otherDistrict = await createDistrict('Nordost');
      const now = new Date();
      const lodge = await prisma.lodges.create({
        data: { name: 'Zur Standhaftigkeit', slug: 'zur-standhaftigkeit-move', district_id: district.id, deleted: false, created_at: now, updated_at: now },
      });
      const worshipfulMaster = await makeWorshipfulMaster();

      const res = await request(app)
        .patch(`/api/v1/lodges/${lodge.slug}`)
        .send({ district_id: otherDistrict.id })
        .set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(200);
      const reloaded = await prisma.lodges.findUniqueOrThrow({ where: { id: lodge.id } });
      expect(reloaded.district_id).toBe(otherDistrict.id);
    });
  });

  describe('DELETE /api/v1/lodges/:slug', () => {
    it("cascades the soft-delete to the lodge's own officers via the model's after_save callback", async () => {
      const district = await createDistrict('Nordwest');
      const now = new Date();
      const lodge = await prisma.lodges.create({
        data: { name: 'Zur Standhaftigkeit', slug: 'zur-standhaftigkeit-cascade', district_id: district.id, deleted: false, created_at: now, updated_at: now },
      });
      const role = await createRole('Speaker', { display_name: 'Redner', administrational_role: false });
      const officer = await prisma.officers.create({
        data: {
          uuid: 'lodge-cascade-uuid',
          lodge_id: lodge.id,
          firstname: 'Max',
          lastname: 'Mustermann',
          role_id: role.id,
          role_email: 'redner@example.org',
          deleted: false,
          created_at: now,
          updated_at: now,
        },
      });
      const worshipfulMaster = await makeWorshipfulMaster();

      const res = await request(app).delete(`/api/v1/lodges/${lodge.slug}`).set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(204);
      const reloadedLodge = await prisma.lodges.findUniqueOrThrow({ where: { id: lodge.id } });
      expect(reloadedLodge.deleted).toBe(true);
      const reloadedOfficer = await prisma.officers.findUniqueOrThrow({ where: { id: officer.id } });
      expect(reloadedOfficer.deleted).toBe(true);
    });
  });

  // Net-new tests (not in the Rails spec) covering GET /api/v1/lodges/:slug
  // (show) - the Rails controller has a #show action but lodges_spec.rb
  // never exercises it directly.
  describe('GET /api/v1/lodges/:slug (show)', () => {
    it('returns the lodge detail, including district_id, for a WorshipfulMaster', async () => {
      const district = await createDistrict('Nordwest');
      const now = new Date();
      const lodge = await prisma.lodges.create({
        data: { name: 'Zur Standhaftigkeit', slug: 'zur-standhaftigkeit-show', district_id: district.id, deleted: false, created_at: now, updated_at: now },
      });
      const worshipfulMaster = await makeWorshipfulMaster();

      const res = await request(app).get(`/api/v1/lodges/${lodge.slug}`).set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ slug: lodge.slug, name: 'Zur Standhaftigkeit', district_id: district.id, district_name: 'Nordwest' });
    });

    it('404s for an unknown slug', async () => {
      const worshipfulMaster = await makeWorshipfulMaster();

      const res = await request(app).get('/api/v1/lodges/does-not-exist').set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'not_found' });
    });
  });

  // Net-new security tests (not in the Rails spec).
  describe('security', () => {
    it('authz boundary: a technically-valid token for a plain member gets 403 on every mutating action', async () => {
      const district = await createDistrict('Nordwest');
      const now = new Date();
      const lodge = await prisma.lodges.create({
        data: { name: 'Zur Standhaftigkeit', slug: 'zur-standhaftigkeit-boundary', district_id: district.id, deleted: false, created_at: now, updated_at: now },
      });
      const member = await makeMember();

      const createRes = await request(app)
        .post('/api/v1/lodges')
        .send({ name: 'Sollte nicht klappen', district_id: district.id })
        .set(authHeaders(member));
      const updateRes = await request(app).patch(`/api/v1/lodges/${lodge.slug}`).send({ name: 'Hacked' }).set(authHeaders(member));
      const deleteRes = await request(app).delete(`/api/v1/lodges/${lodge.slug}`).set(authHeaders(member));

      expect(createRes.status).toBe(403);
      expect(updateRes.status).toBe(403);
      expect(deleteRes.status).toBe(403);
      const reloaded = await prisma.lodges.findUniqueOrThrow({ where: { id: lodge.id } });
      expect(reloaded.name).toBe('Zur Standhaftigkeit');
      expect(reloaded.deleted).toBe(false);
    });

    it('is not vulnerable to SQL-metacharacter injection via the :slug path param', async () => {
      const district = await createDistrict('Nordwest');
      const now = new Date();
      await prisma.lodges.create({
        data: { name: 'Zur Standhaftigkeit', slug: 'zur-standhaftigkeit-inject', district_id: district.id, deleted: false, created_at: now, updated_at: now },
      });
      const worshipfulMaster = await makeWorshipfulMaster();

      const res = await request(app)
        .get(`/api/v1/lodges/${encodeURIComponent("' OR '1'='1")}`)
        .set(authHeaders(worshipfulMaster));

      // Prisma's parameterization means a metacharacter-laden slug simply
      // matches nothing, rather than erroring or returning every lodge.
      expect(res.status).toBe(404);
    });
  });
});
