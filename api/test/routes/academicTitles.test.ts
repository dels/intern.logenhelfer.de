import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import type { users } from '../../src/generated/prisma/client.js';

import { issueAccessToken } from '../../src/auth/jwt.js';
import { apiErrorHandler } from '../../src/lib/errors.js';
import academicTitlesRouter from '../../src/routes/academicTitles.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

// Port of rails-app/spec/requests/api/v1/academic_titles_spec.rb (10
// examples), plus a small number of net-new security tests (see the bottom
// describe block). This resource has no search/filter/sort query param, so
// no SQL-injection-attempt test applies here (nothing touches the DB via a
// caller-controlled query param).

const app = express();
app.use(express.json());
app.use('/api/v1/academic_titles', academicTitlesRouter);
app.use(apiErrorHandler);

function authHeaders(user: users): { Authorization: string } {
  return { Authorization: `Bearer ${issueAccessToken(user.id)}` };
}

let roleCounter = 0;

async function createRole(
  name: string,
  overrides: Partial<{ display_name: string }> = {},
): Promise<{ id: number; name: string | null }> {
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

function randomShort(prefix = 'Dr.'): string {
  return `${prefix} ${Math.random().toString(36).slice(2, 10)}`;
}

describe('Academic Titles API', () => {
  beforeEach(async () => {
    await resetDb();
  });

  async function makeAdmin(): Promise<users> {
    const adminRole = await createRole('Admin', { display_name: 'Administrator' });
    const user = await createUser();
    await assignRole(user.id, adminRole.id);
    return user;
  }

  async function makeMember(): Promise<users> {
    const apprenticeRole = await createRole('EnteredApprentice', { display_name: 'Lehrling' });
    const user = await createUser();
    await assignRole(user.id, apprenticeRole.id);
    return user;
  }

  /** Can manage UserRole (passes some other resources' gates) but NOT AcademicTitle. */
  async function makeUserAdminOnly(): Promise<users> {
    const userAdminRole = await createRole('UserAdmin', { display_name: 'Mitgliederverwaltung' });
    const user = await createUser();
    await assignRole(user.id, userAdminRole.id);
    return user;
  }

  async function createTitle(short = randomShort()): Promise<{ id: number; short: string | null }> {
    const now = new Date();
    return prisma.academic_titles.create({
      data: { short, deleted: false, created_at: now, updated_at: now },
    });
  }

  describe('GET /api/v1/academic_titles', () => {
    it('lists academic titles for an admin', async () => {
      const admin = await makeAdmin();
      const title = await createTitle();

      const res = await request(app).get('/api/v1/academic_titles').set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.rows.map((r: { short: string }) => r.short)).toContain(title.short);
    });

    it('forbids a plain member', async () => {
      const member = await makeMember();

      const res = await request(app).get('/api/v1/academic_titles').set(authHeaders(member));

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
    });
  });

  describe('POST /api/v1/academic_titles', () => {
    it('creates an academic title for an admin', async () => {
      const admin = await makeAdmin();

      const res = await request(app)
        .post('/api/v1/academic_titles')
        .send({ short: randomShort('Prof.') })
        .set(authHeaders(admin));

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ id: expect.any(Number), short: expect.any(String) });
    });

    it('forbids a plain member', async () => {
      const member = await makeMember();

      const res = await request(app).post('/api/v1/academic_titles').send({ short: 'X' }).set(authHeaders(member));

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
    });

    it('returns 422 (not a raw DB error) when creating a duplicate short', async () => {
      const admin = await makeAdmin();
      const title = await createTitle();

      const res = await request(app).post('/api/v1/academic_titles').send({ short: title.short }).set(authHeaders(admin));

      expect(res.status).toBe(422);
      expect(res.body.error).toBe('unprocessable');
      expect(typeof res.body.detail).toBe('string');
    });

    it('returns 422 (not a raw DB error) when recreating a previously soft-deleted short', async () => {
      // academic_titles.short has a DB-level unique index with no
      // WHERE deleted = false clause - a soft-deleted title still occupies
      // its name, so this is a distinct regression case from the plain
      // duplicate-of-an-active-title case above.
      const admin = await makeAdmin();
      const title = await createTitle();

      const deleteRes = await request(app).delete(`/api/v1/academic_titles/${title.id}`).set(authHeaders(admin));
      expect(deleteRes.status).toBe(204);

      const res = await request(app).post('/api/v1/academic_titles').send({ short: title.short }).set(authHeaders(admin));

      expect(res.status).toBe(422);
      expect(res.body.error).toBe('unprocessable');
      expect(typeof res.body.detail).toBe('string');
    });
  });

  describe('PATCH /api/v1/academic_titles/:id', () => {
    it('renames an academic title for an admin', async () => {
      const admin = await makeAdmin();
      const title = await createTitle();
      const newShort = randomShort('Renamed');

      const res = await request(app)
        .patch(`/api/v1/academic_titles/${title.id}`)
        .send({ short: newShort })
        .set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.short).toBe(newShort);
    });
  });

  describe('DELETE /api/v1/academic_titles/:id', () => {
    it('deletes an unused academic title for an admin', async () => {
      const admin = await makeAdmin();
      const title = await createTitle();

      const res = await request(app).delete(`/api/v1/academic_titles/${title.id}`).set(authHeaders(admin));

      expect(res.status).toBe(204);
    });

    it('refuses to delete a title still assigned to a user', async () => {
      const admin = await makeAdmin();
      const member = await makeMember();
      const title = await createTitle();
      await prisma.users.update({ where: { id: member.id }, data: { academic_title_id: title.id } });

      const res = await request(app).delete(`/api/v1/academic_titles/${title.id}`).set(authHeaders(admin));

      expect(res.status).toBe(422);
      const stillThere = await prisma.academic_titles.findUnique({ where: { id: title.id } });
      expect(stillThere).not.toBeNull();
      expect(stillThere?.deleted).toBe(false);
    });

    it('forbids a plain member', async () => {
      const member = await makeMember();
      const title = await createTitle();

      const res = await request(app).delete(`/api/v1/academic_titles/${title.id}`).set(authHeaders(member));

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
    });
  });

  // Net-new security tests (not in the Rails spec).
  describe('security', () => {
    it('authz boundary: a technically-valid token for a role that cannot manage AcademicTitle gets 403, even one that manages UserRole', async () => {
      // UserAdmin can manage UserRole (passes other resources' gates
      // entirely, see roles.ts) but does NOT hold `can('manage',
      // 'AcademicTitle')` - only application_admin_abilities (Admin-only)
      // grants that, so every action here must still be forbidden.
      const userAdminOnly = await makeUserAdminOnly();
      const title = await createTitle();

      const getRes = await request(app).get('/api/v1/academic_titles').set(authHeaders(userAdminOnly));
      expect(getRes.status).toBe(403);
      expect(getRes.body).toEqual({ error: 'forbidden' });

      const postRes = await request(app)
        .post('/api/v1/academic_titles')
        .send({ short: randomShort('Boundary') })
        .set(authHeaders(userAdminOnly));
      expect(postRes.status).toBe(403);

      const patchRes = await request(app)
        .patch(`/api/v1/academic_titles/${title.id}`)
        .send({ short: randomShort('Boundary2') })
        .set(authHeaders(userAdminOnly));
      expect(patchRes.status).toBe(403);

      const deleteRes = await request(app).delete(`/api/v1/academic_titles/${title.id}`).set(authHeaders(userAdminOnly));
      expect(deleteRes.status).toBe(403);

      const reloaded = await prisma.academic_titles.findUniqueOrThrow({ where: { id: title.id } });
      expect(reloaded.short).toBe(title.short);
      expect(reloaded.deleted).toBe(false);
    });

    it('is forbidden without authentication', async () => {
      const res = await request(app).get('/api/v1/academic_titles');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'unauthorized' });
    });
  });
});
