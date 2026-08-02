import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import type { users } from '../../src/generated/prisma/client.js';

import { issueAccessToken } from '../../src/auth/jwt.js';
import { apiErrorHandler } from '../../src/lib/errors.js';
import districtsRouter from '../../src/routes/districts.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

// Port of rails-app/spec/requests/api/v1/districts_spec.rb (6 examples),
// plus a small number of net-new security tests (see the bottom describe
// block).

const app = express();
app.use(express.json());
app.use('/api/v1/districts', districtsRouter);
app.use(apiErrorHandler);

function authHeaders(user: users): { Authorization: string } {
  return { Authorization: `Bearer ${issueAccessToken(user.id)}` };
}

let roleCounter = 0;

async function createRole(name: string, overrides: Partial<{ display_name: string }> = {}): Promise<{ id: number; name: string | null }> {
  roleCounter += 1;
  const now = new Date();
  const existing = await prisma.roles.findFirst({ where: { name } });
  if (existing) {
    return existing;
  }
  return prisma.roles.create({
    data: { name, display_name: overrides.display_name ?? name, created_at: now, updated_at: now },
  });
}

async function assignRole(userId: number, roleId: number): Promise<void> {
  const now = new Date();
  await prisma.user_roles.create({
    data: { user_id: userId, role_id: roleId, created_at: now, updated_at: now, role_added_at: now },
  });
}

describe('Districts API', () => {
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

  async function makeApplicationAdmin(): Promise<users> {
    const role = await createRole('ApplicationAdmin', { display_name: 'Kann Anwendung konfigurieren' });
    const user = await createUser();
    await assignRole(user.id, role.id);
    return user;
  }

  async function createDistrict(name: string): Promise<{ id: number; name: string | null; deleted: boolean | null }> {
    const now = new Date();
    return prisma.districts.create({ data: { name, deleted: false, created_at: now, updated_at: now } });
  }

  describe('GET /api/v1/districts', () => {
    it('lists districts for a WorshipfulMaster', async () => {
      await createDistrict('Nordwest');
      const worshipfulMaster = await makeWorshipfulMaster();

      const res = await request(app).get('/api/v1/districts').set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(200);
      const names = res.body.rows.map((d: { name: string }) => d.name);
      expect(names).toContain('Nordwest');
    });

    it('is forbidden for a plain member', async () => {
      await createDistrict('Nordwest');
      const member = await makeMember();

      const res = await request(app).get('/api/v1/districts').set(authHeaders(member));

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
    });
  });

  describe('POST /api/v1/districts', () => {
    it('creates a district for an application admin', async () => {
      const applicationAdmin = await makeApplicationAdmin();

      const res = await request(app).post('/api/v1/districts').send({ name: 'Neuer Distrikt' }).set(authHeaders(applicationAdmin));

      expect(res.status).toBe(201);
      const found = await prisma.districts.findFirst({ where: { name: 'Neuer Distrikt' } });
      expect(found).not.toBeNull();
    });

    it('is forbidden for a user who can only read districts (Lodge-create gate)', async () => {
      const worshipfulMaster = await makeWorshipfulMaster();

      const res = await request(app).post('/api/v1/districts').send({ name: 'x' }).set(authHeaders(worshipfulMaster));

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/districts/:id', () => {
    it('updates the name', async () => {
      const district = await createDistrict('Alt');
      const applicationAdmin = await makeApplicationAdmin();

      const res = await request(app)
        .patch(`/api/v1/districts/${district.id}`)
        .send({ name: 'Neu' })
        .set(authHeaders(applicationAdmin));

      expect(res.status).toBe(200);
      const reloaded = await prisma.districts.findUniqueOrThrow({ where: { id: district.id } });
      expect(reloaded.name).toBe('Neu');
    });
  });

  describe('DELETE /api/v1/districts/:id', () => {
    it('soft-deletes the district and cascades to its lodges', async () => {
      const district = await createDistrict('Zu Löschen');
      const now = new Date();
      const lodge = await prisma.lodges.create({
        data: { name: 'Betroffene Loge', slug: 'betroffene-loge', district_id: district.id, deleted: false, created_at: now, updated_at: now },
      });
      const applicationAdmin = await makeApplicationAdmin();

      const res = await request(app).delete(`/api/v1/districts/${district.id}`).set(authHeaders(applicationAdmin));

      expect(res.status).toBe(204);
      const reloadedDistrict = await prisma.districts.findUniqueOrThrow({ where: { id: district.id } });
      expect(reloadedDistrict.deleted).toBe(true);
      const reloadedLodge = await prisma.lodges.findUniqueOrThrow({ where: { id: lodge.id } });
      expect(reloadedLodge.deleted).toBe(true);
    });

    it('cascades the soft-delete all the way down to officers of its lodges', async () => {
      const district = await createDistrict('Kaskade');
      const now = new Date();
      const lodge = await prisma.lodges.create({
        data: { name: 'Kaskaden Loge', slug: 'kaskaden-loge', district_id: district.id, deleted: false, created_at: now, updated_at: now },
      });
      const role = await createRole('Speaker', { display_name: 'Redner' });
      const officer = await prisma.officers.create({
        data: {
          uuid: 'district-cascade-uuid',
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
      const applicationAdmin = await makeApplicationAdmin();

      const res = await request(app).delete(`/api/v1/districts/${district.id}`).set(authHeaders(applicationAdmin));

      expect(res.status).toBe(204);
      const reloadedOfficer = await prisma.officers.findUniqueOrThrow({ where: { id: officer.id } });
      expect(reloadedOfficer.deleted).toBe(true);
    });
  });

  // Net-new security tests (not in the Rails spec).
  describe('security', () => {
    it('authz boundary: a technically-valid token for a plain member gets 403 on PATCH/DELETE too, not just GET/POST', async () => {
      const district = await createDistrict('Boundary');
      const member = await makeMember();

      const patchRes = await request(app).patch(`/api/v1/districts/${district.id}`).send({ name: 'Hacked' }).set(authHeaders(member));
      const deleteRes = await request(app).delete(`/api/v1/districts/${district.id}`).set(authHeaders(member));

      expect(patchRes.status).toBe(403);
      expect(deleteRes.status).toBe(403);
      const reloaded = await prisma.districts.findUniqueOrThrow({ where: { id: district.id } });
      expect(reloaded.name).toBe('Boundary');
      expect(reloaded.deleted).toBe(false);
    });

    it('rejects requests with no Authorization header at all', async () => {
      const res = await request(app).get('/api/v1/districts');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'unauthorized' });
    });
  });
});
