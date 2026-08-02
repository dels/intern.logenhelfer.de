import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import type { users } from '../../src/generated/prisma/client.js';

import { issueAccessToken } from '../../src/auth/jwt.js';
import { apiErrorHandler } from '../../src/lib/errors.js';
import rolesRouter from '../../src/routes/roles.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

// Port of rails-app/spec/requests/api/v1/roles_spec.rb (9 examples), plus a
// small number of net-new security tests (see the bottom describe block).

const app = express();
app.use(express.json());
app.use('/api/v1/roles', rolesRouter);
app.use(apiErrorHandler);

function authHeaders(user: users): { Authorization: string } {
  return { Authorization: `Bearer ${issueAccessToken(user.id)}` };
}

let roleCounter = 0;

/** Mirrors the spec's `Role.find_or_create_by!(name: ...) { |r| r.display_name = ... }`. */
async function createRole(
  name: string,
  overrides: Partial<{ display_name: string; administrational_role: boolean }> = {},
): Promise<{ id: number; name: string | null; display_name: string | null }> {
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

describe('Roles API', () => {
  beforeEach(async () => {
    await resetDb();
  });

  async function makeMember(): Promise<users> {
    const apprenticeRole = await createRole('EnteredApprentice', { display_name: 'Lehrling' });
    const user = await createUser();
    await assignRole(user.id, apprenticeRole.id);
    return user;
  }

  async function makeAdmin(): Promise<users> {
    const adminRole = await createRole('Admin', { display_name: 'Administrator' });
    const user = await createUser();
    await assignRole(user.id, adminRole.id);
    return user;
  }

  async function makeSecretaryWithoutDegreeRole(): Promise<users> {
    const secretaryRole = await createRole('Secretary', { display_name: 'Korrespondierender Schriftfuehrer' });
    const user = await createUser();
    await assignRole(user.id, secretaryRole.id);
    return user;
  }

  async function makeWorshipfulMasterWithoutDegreeRole(): Promise<users> {
    const lodgesAdminRole = await createRole('WorshipfulMaster', { display_name: 'Meister vom Stuhl' });
    const user = await createUser();
    await assignRole(user.id, lodgesAdminRole.id);
    return user;
  }

  async function makeUserAdminOnly(): Promise<users> {
    const userAdminRole = await createRole('UserAdmin', { display_name: 'Mitgliederverwaltung' });
    const user = await createUser();
    await assignRole(user.id, userAdminRole.id);
    return user;
  }

  describe('GET /api/v1/roles', () => {
    it('lists all roles for a Secretary, even one holding no degree role', async () => {
      await createRole('EnteredApprentice', { display_name: 'Lehrling' });
      const secretaryWithoutDegreeRole = await makeSecretaryWithoutDegreeRole();

      const res = await request(app).get('/api/v1/roles').set(authHeaders(secretaryWithoutDegreeRole));

      expect(res.status).toBe(200);
      const names = res.body.rows.map((r: { name: string }) => r.name);
      expect(names).toContain('EnteredApprentice');
      expect(names).toContain('Secretary');
    });

    it('is forbidden for a plain member who cannot manage Category or Directory', async () => {
      const member = await makeMember();

      const res = await request(app).get('/api/v1/roles').set(authHeaders(member));

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
    });

    it('is forbidden without authentication', async () => {
      const res = await request(app).get('/api/v1/roles');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'unauthorized' });
    });
  });

  describe('GET /api/v1/roles (broadened gate)', () => {
    it('lists roles for a WorshipfulMaster (lodges_admin_abilites), even one holding no Category/Directory-granting role', async () => {
      const worshipfulMasterWithoutDegreeRole = await makeWorshipfulMasterWithoutDegreeRole();

      const res = await request(app).get('/api/v1/roles').set(authHeaders(worshipfulMasterWithoutDegreeRole));

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.rows)).toBe(true);
    });
  });

  describe('GET /api/v1/roles?scope=positions', () => {
    it('excludes degree roles (EnteredApprentice/FellowCraft/MasterMason) and administrational roles', async () => {
      await createRole('EnteredApprentice', { display_name: 'Lehrling' });
      await createRole('Speaker', { display_name: 'Redner', administrational_role: false });
      const worshipfulMasterWithoutDegreeRole = await makeWorshipfulMasterWithoutDegreeRole();

      const res = await request(app)
        .get('/api/v1/roles')
        .query({ scope: 'positions' })
        .set(authHeaders(worshipfulMasterWithoutDegreeRole));

      expect(res.status).toBe(200);
      const names = res.body.rows.map((r: { name: string }) => r.name);
      expect(names).toContain('Speaker');
      expect(names).not.toContain('EnteredApprentice');
    });

    it('is not forbidden for a UserAdmin-only holder (can manage UserRole but not Category/Directory/Officer)', async () => {
      const userAdminOnly = await makeUserAdminOnly();

      const res = await request(app)
        .get('/api/v1/roles')
        .query({ scope: 'positions' })
        .set(authHeaders(userAdminOnly));

      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/v1/roles?scope=administrational', () => {
    it('returns only administrational roles', async () => {
      const admin = await makeAdmin();
      const adminScopeRole = await createRole(`AdminScope${roleCounter}`, {
        display_name: 'Admin Rolle',
        administrational_role: true,
      });
      const positionScopeRole = await createRole(`PosScope${roleCounter}`, {
        display_name: 'Positions Rolle',
        administrational_role: false,
      });

      const res = await request(app).get('/api/v1/roles').query({ scope: 'administrational' }).set(authHeaders(admin));

      expect(res.status).toBe(200);
      const ids = res.body.rows.map((r: { id: number }) => r.id);
      expect(ids).toContain(adminScopeRole.id);
      expect(ids).not.toContain(positionScopeRole.id);
    });
  });

  describe('PATCH /api/v1/roles/:id', () => {
    it('updates only the email for an admin', async () => {
      const admin = await makeAdmin();
      const role = await createRole(`TestRole${roleCounter}`, { display_name: 'Test' });

      const res = await request(app)
        .patch(`/api/v1/roles/${role.id}`)
        .send({ email: 'new@example.org' })
        .set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('new@example.org');
      const reloaded = await prisma.roles.findUniqueOrThrow({ where: { id: role.id } });
      expect(reloaded.email).toBe('new@example.org');
    });

    it('forbids a plain member', async () => {
      const member = await makeMember();
      const role = await createRole(`TestRole2${roleCounter}`, { display_name: 'Test2' });

      const res = await request(app).patch(`/api/v1/roles/${role.id}`).send({ email: 'x@example.org' }).set(authHeaders(member));

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
    });
  });

  // Net-new security tests (not in the Rails spec).
  describe('security', () => {
    it('authz boundary: a technically-valid token for a role that cannot manage Role gets 403 on PATCH, even for its own role assignment', async () => {
      // A UserAdmin-only user passes the GET gate (can manage UserRole) but
      // does NOT hold `can('manage', 'Role')` - the PATCH gate is strictly
      // narrower than the GET gate, so this must still be forbidden.
      const userAdminOnly = await makeUserAdminOnly();
      const role = await createRole(`SecBoundary${roleCounter}`, { display_name: 'Sec Boundary' });

      const res = await request(app)
        .patch(`/api/v1/roles/${role.id}`)
        .send({ email: 'boundary@example.org' })
        .set(authHeaders(userAdminOnly));

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
      const reloaded = await prisma.roles.findUniqueOrThrow({ where: { id: role.id } });
      expect(reloaded.email).not.toBe('boundary@example.org');
    });

    it('is not vulnerable to SQL-metacharacter injection via the scope query param', async () => {
      const admin = await makeAdmin();
      const injSafeRoleName = `InjSafe${roleCounter}`;
      await createRole(injSafeRoleName, { display_name: 'Inj Safe', administrational_role: true });

      const res = await request(app)
        .get('/api/v1/roles')
        .query({ scope: "administrational'; DROP TABLE roles; --" })
        .set(authHeaders(admin));

      // An unrecognized scope value falls through to the unscoped "all
      // roles, ordered by display_name" branch (same as Rails' `case`
      // `else`) rather than erroring or matching nothing - proving the
      // value is never interpolated into SQL.
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.rows)).toBe(true);
      expect(res.body.rows.length).toBeGreaterThan(0);
      const stillThere = await prisma.roles.findFirst({ where: { name: injSafeRoleName } });
      expect(stillThere).not.toBeNull();
    });
  });
});
