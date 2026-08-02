import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import type { users } from '../../src/generated/prisma/client.js';

import { issueAccessToken } from '../../src/auth/jwt.js';
import { apiErrorHandler } from '../../src/lib/errors.js';
import categoriesRouter from '../../src/routes/categories.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

// Port of rails-app/spec/requests/api/v1/categories_spec.rb (7 examples),
// plus a small number of net-new security tests (see the bottom describe
// block).

const app = express();
app.use(express.json());
app.use('/api/v1/categories', categoriesRouter);
app.use(apiErrorHandler);

function authHeaders(user: users): { Authorization: string } {
  return { Authorization: `Bearer ${issueAccessToken(user.id)}` };
}

async function createRole(name: string, displayName: string): Promise<{ id: number; name: string | null }> {
  const existing = await prisma.roles.findFirst({ where: { name } });
  if (existing) {
    return existing;
  }
  const now = new Date();
  return prisma.roles.create({ data: { name, display_name: displayName, created_at: now, updated_at: now } });
}

async function assignRole(userId: number, roleId: number): Promise<void> {
  const now = new Date();
  await prisma.user_roles.create({ data: { user_id: userId, role_id: roleId, created_at: now, updated_at: now, role_added_at: now } });
}

async function attachRoleToCategory(categoryId: number, roleId: number): Promise<void> {
  const now = new Date();
  await prisma.category_roles.create({ data: { category_id: categoryId, role_id: roleId, created_at: now, updated_at: now } });
}

async function createCategory(name: string, description = 'x'): Promise<{ id: number; slug: string; name: string | null }> {
  const now = new Date();
  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')}-${now.getTime()}`;
  const category = await prisma.categories.create({ data: { name, description, slug, deleted: false, created_at: now, updated_at: now } });
  return { id: category.id, slug, name: category.name };
}

describe('Categories API', () => {
  let apprenticeRole: { id: number; name: string | null };
  let fellowCraftRole: { id: number; name: string | null };
  let secretaryRole: { id: number; name: string | null };
  let member: users;
  let secretary: users;
  let visibleCategory: { id: number; slug: string; name: string | null };
  let hiddenCategory: { id: number; slug: string; name: string | null };

  beforeEach(async () => {
    await resetDb();

    apprenticeRole = await createRole('EnteredApprentice', 'Lehrling');
    fellowCraftRole = await createRole('FellowCraft', 'Geselle');
    secretaryRole = await createRole('Secretary', 'Korrespondierender Schriftführer');

    member = await createUser();
    await assignRole(member.id, apprenticeRole.id);

    secretary = await createUser();
    await assignRole(secretary.id, apprenticeRole.id);
    await assignRole(secretary.id, secretaryRole.id);

    visibleCategory = await createCategory(`Sichtbar ${Date.now()}-${Math.random()}`);
    await attachRoleToCategory(visibleCategory.id, apprenticeRole.id);

    hiddenCategory = await createCategory(`Unsichtbar ${Date.now()}-${Math.random()}`, 'y');
    await attachRoleToCategory(hiddenCategory.id, fellowCraftRole.id);
  });

  describe('GET /api/v1/categories', () => {
    it('only returns categories that share a role with the plain member', async () => {
      const res = await request(app).get('/api/v1/categories').query({ per_page: 100 }).set(authHeaders(member));

      expect(res.status).toBe(200);
      const names = res.body.rows.map((c: { name: string }) => c.name);
      expect(names).toContain(visibleCategory.name);
      expect(names).not.toContain(hiddenCategory.name);
    });

    it('returns every category for a Secretary, regardless of role overlap', async () => {
      const res = await request(app).get('/api/v1/categories').query({ per_page: 100 }).set(authHeaders(secretary));

      expect(res.status).toBe(200);
      const names = res.body.rows.map((c: { name: string }) => c.name);
      expect(names).toContain(visibleCategory.name);
      expect(names).toContain(hiddenCategory.name);
    });

    it('defaults to sorting by name ascending', async () => {
      const res = await request(app).get('/api/v1/categories').query({ per_page: 100 }).set(authHeaders(secretary));
      const names = res.body.rows.map((c: { name: string }) => c.name);
      const sorted = [...names].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      expect(names).toEqual(sorted);
    });

    it('sorts by description ascending/descending via ?sort=', async () => {
      const asc = await request(app).get('/api/v1/categories').query({ per_page: 100, sort: 'description' }).set(authHeaders(secretary));
      const ascDescriptions = asc.body.rows.map((c: { description: string }) => c.description);
      const sortedAsc = [...ascDescriptions].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
      expect(ascDescriptions).toEqual(sortedAsc);

      const desc = await request(app).get('/api/v1/categories').query({ per_page: 100, sort: '-description' }).set(authHeaders(secretary));
      const descDescriptions = desc.body.rows.map((c: { description: string }) => c.description);
      expect(descDescriptions).toEqual([...ascDescriptions].reverse());
    });

    it('falls back to the default sort for an unknown/malicious ?sort= value, without erroring', async () => {
      const res = await request(app).get('/api/v1/categories').query({ per_page: 100, sort: 'deleted;DROP TABLE users;--' }).set(authHeaders(secretary));
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/categories/:slug', () => {
    it('is forbidden for a member with no role overlap', async () => {
      const res = await request(app).get(`/api/v1/categories/${hiddenCategory.slug}`).set(authHeaders(member));

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/categories', () => {
    it('is forbidden for a plain member', async () => {
      const res = await request(app).post('/api/v1/categories').send({ name: 'Neu' }).set(authHeaders(member));

      expect(res.status).toBe(403);
    });

    it('creates a category with role_ids for a Secretary', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .send({ name: 'Neu', description: 'desc', role_ids: [apprenticeRole.id] })
        .set(authHeaders(secretary));

      expect(res.status).toBe(201);
      const created = await prisma.categories.findFirstOrThrow({ where: { name: 'Neu' } });
      const roleIds = await prisma.category_roles.findMany({ where: { category_id: created.id } });
      expect(roleIds.map((r) => r.role_id)).toEqual([apprenticeRole.id]);
    });

    it('returns 422 for a duplicate name', async () => {
      const res = await request(app)
        .post('/api/v1/categories')
        .send({ name: visibleCategory.name })
        .set(authHeaders(secretary));

      expect(res.status).toBe(422);
      expect(res.body.detail).toBeTruthy();
    });
  });

  describe('DELETE /api/v1/categories/:slug', () => {
    it("cascades the soft-delete to the category's own directories", async () => {
      const now = new Date();
      const directory = await prisma.directories.create({
        data: {
          name: 'Unterordner',
          category_id: visibleCategory.id,
          slug: `unterordner-${now.getTime()}`,
          deleted: false,
          created_at: now,
          updated_at: now,
        },
      });

      const res = await request(app).delete(`/api/v1/categories/${visibleCategory.slug}`).set(authHeaders(secretary));

      expect(res.status).toBe(204);
      const reloadedCategory = await prisma.categories.findUniqueOrThrow({ where: { id: visibleCategory.id } });
      expect(reloadedCategory.deleted).toBe(true);
      const reloadedDirectory = await prisma.directories.findUniqueOrThrow({ where: { id: directory.id } });
      expect(reloadedDirectory.deleted).toBe(true);
    });
  });

  // Net-new security tests (not in the Rails spec).
  describe('security', () => {
    it('authz boundary: a role with no file-admin grant (WorkingPlanAdmin) gets 403 on create/delete, not just plain members', async () => {
      const workingPlanAdminRole = await createRole('WorkingPlanAdmin', 'Terminverwalter');
      const workingPlanAdmin = await createUser();
      await assignRole(workingPlanAdmin.id, workingPlanAdminRole.id);

      const createRes = await request(app).post('/api/v1/categories').send({ name: 'Sollte nicht klappen' }).set(authHeaders(workingPlanAdmin));
      const deleteRes = await request(app).delete(`/api/v1/categories/${visibleCategory.slug}`).set(authHeaders(workingPlanAdmin));

      expect(createRes.status).toBe(403);
      expect(deleteRes.status).toBe(403);
      const reloaded = await prisma.categories.findUniqueOrThrow({ where: { id: visibleCategory.id } });
      expect(reloaded.deleted).toBe(false);
    });

    it('rejects requests with no Authorization header at all', async () => {
      const res = await request(app).get('/api/v1/categories');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'unauthorized' });
    });
  });
});
