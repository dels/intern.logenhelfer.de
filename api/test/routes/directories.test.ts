import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import type { users } from '../../src/generated/prisma/client.js';

import { issueAccessToken } from '../../src/auth/jwt.js';
import { apiErrorHandler } from '../../src/lib/errors.js';
import directoriesRouter from '../../src/routes/directories.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

// Port of rails-app/spec/requests/api/v1/directories_spec.rb (5 examples),
// plus a small number of net-new security tests (see the bottom describe
// block).

const app = express();
app.use(express.json());
app.use('/api/v1/directories', directoriesRouter);
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

function slugify(name: string): string {
  return `${name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function createCategory(name: string): Promise<{ id: number; slug: string; name: string | null }> {
  const now = new Date();
  const slug = slugify(name);
  const category = await prisma.categories.create({ data: { name, slug, deleted: false, created_at: now, updated_at: now } });
  return { id: category.id, slug, name: category.name };
}

async function createDirectory(categoryId: number, name: string): Promise<{ id: number; slug: string; name: string | null }> {
  const now = new Date();
  const slug = slugify(name);
  const directory = await prisma.directories.create({
    data: { name, category_id: categoryId, slug, deleted: false, created_at: now, updated_at: now },
  });
  return { id: directory.id, slug, name: directory.name };
}

async function attachRoleToDirectory(directoryId: number, roleId: number): Promise<void> {
  const now = new Date();
  await prisma.directory_roles.create({ data: { directory_id: directoryId, role_id: roleId, created_at: now, updated_at: now } });
}

describe('Directories API', () => {
  let apprenticeRole: { id: number; name: string | null };
  let fellowCraftRole: { id: number; name: string | null };
  let secretaryRole: { id: number; name: string | null };
  let member: users;
  let secretary: users;
  let category: { id: number; slug: string; name: string | null };
  let visibleDirectory: { id: number; slug: string; name: string | null };
  let hiddenDirectory: { id: number; slug: string; name: string | null };

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

    category = await createCategory(`Ordner ${Date.now()}`);

    visibleDirectory = await createDirectory(category.id, `Sichtbar ${Date.now()}-${Math.random()}`);
    await attachRoleToDirectory(visibleDirectory.id, apprenticeRole.id);

    hiddenDirectory = await createDirectory(category.id, `Unsichtbar ${Date.now()}-${Math.random()}`);
    await attachRoleToDirectory(hiddenDirectory.id, fellowCraftRole.id);
  });

  describe('GET /api/v1/directories', () => {
    it('only returns directories in the given category that share a role with the caller', async () => {
      const res = await request(app).get('/api/v1/directories').query({ category_slug: category.slug }).set(authHeaders(member));

      expect(res.status).toBe(200);
      const names = res.body.rows.map((d: { name: string }) => d.name);
      expect(names).toContain(visibleDirectory.name);
      expect(names).not.toContain(hiddenDirectory.name);
    });

    it('requires category_slug', async () => {
      const res = await request(app).get('/api/v1/directories').set(authHeaders(member));

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/directories', () => {
    it('creates a directory under the given category for a Secretary', async () => {
      const res = await request(app)
        .post('/api/v1/directories')
        .send({ category_slug: category.slug, name: 'Neu', role_ids: [apprenticeRole.id] })
        .set(authHeaders(secretary));

      expect(res.status).toBe(201);
      const created = await prisma.directories.findFirstOrThrow({ where: { name: 'Neu' } });
      expect(created.category_id).toBe(category.id);
    });

    it('is forbidden for a plain member', async () => {
      const res = await request(app)
        .post('/api/v1/directories')
        .send({ category_slug: category.slug, name: 'Neu' })
        .set(authHeaders(member));

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/directories/:slug', () => {
    it('cannot move a directory to a different category', async () => {
      const otherCategory = await createCategory('Anderer Ordner');

      const res = await request(app)
        .patch(`/api/v1/directories/${visibleDirectory.slug}`)
        .send({ category_slug: otherCategory.slug, name: 'Umbenannt' })
        .set(authHeaders(secretary));

      expect(res.status).toBe(200);
      const reloaded = await prisma.directories.findUniqueOrThrow({ where: { id: visibleDirectory.id } });
      expect(reloaded.name).toBe('Umbenannt');
      expect(reloaded.category_id).toBe(category.id);
    });
  });

  // Net-new security tests (not in the Rails spec).
  describe('security', () => {
    it('authz boundary: a role with no file-admin grant (WorkingPlanAdmin) gets 403 on create, not just plain members', async () => {
      const workingPlanAdminRole = await createRole('WorkingPlanAdmin', 'Terminverwalter');
      const workingPlanAdmin = await createUser();
      await assignRole(workingPlanAdmin.id, workingPlanAdminRole.id);

      const res = await request(app)
        .post('/api/v1/directories')
        .send({ category_slug: category.slug, name: 'Sollte nicht klappen' })
        .set(authHeaders(workingPlanAdmin));

      expect(res.status).toBe(403);
      const found = await prisma.directories.findFirst({ where: { name: 'Sollte nicht klappen' } });
      expect(found).toBeNull();
    });

    it('is not vulnerable to SQL-metacharacter injection via the category_slug query param', async () => {
      const res = await request(app)
        .get('/api/v1/directories')
        .query({ category_slug: "' OR '1'='1" })
        .set(authHeaders(member));

      // Prisma's parameterization means a metacharacter-laden category_slug
      // is treated as a literal string to match against, not SQL - it
      // matches nothing (a real slug never contains a quote), so this 404s
      // rather than erroring or returning every category's directories.
      expect(res.status).toBe(404);
    });

    it('is not vulnerable to a % wildcard payload via the category_slug query param', async () => {
      const res = await request(app).get('/api/v1/directories').query({ category_slug: '%' }).set(authHeaders(member));

      expect(res.status).toBe(404);
    });

    it('rejects requests with no Authorization header at all', async () => {
      const res = await request(app).get('/api/v1/directories').query({ category_slug: category.slug });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'unauthorized' });
    });
  });
});
