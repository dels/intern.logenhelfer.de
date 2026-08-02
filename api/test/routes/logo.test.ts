import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import type { users } from '../../src/generated/prisma/client.js';

import { issueAccessToken } from '../../src/auth/jwt.js';
import { apiErrorHandler } from '../../src/lib/errors.js';
import logoRouter from '../../src/routes/logo.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

const app = express();
app.use(express.json());
app.use('/api/v1/logo', logoRouter);
app.use(apiErrorHandler);

function authHeaders(user: users): { Authorization: string } {
  return { Authorization: `Bearer ${issueAccessToken(user.id)}` };
}

async function createRole(name: string, displayName = name): Promise<{ id: number; name: string | null }> {
  const existing = await prisma.roles.findFirst({ where: { name } });
  if (existing) return existing;
  const now = new Date();
  return prisma.roles.create({ data: { name, display_name: displayName, created_at: now, updated_at: now } });
}

async function assignRole(userId: number, roleId: number): Promise<void> {
  const now = new Date();
  await prisma.user_roles.create({ data: { user_id: userId, role_id: roleId, created_at: now, updated_at: now, role_added_at: now } });
}

async function makeApplicationAdmin(): Promise<users> {
  const role = await createRole('ApplicationAdmin', 'Kann Anwendung konfigurieren');
  const user = await createUser();
  await assignRole(user.id, role.id);
  return user;
}

async function makeMember(): Promise<users> {
  const role = await createRole('EnteredApprentice', 'Lehrling');
  const user = await createUser();
  await assignRole(user.id, role.id);
  return user;
}

describe('Logo API', () => {
  beforeEach(async () => {
    await resetDb();
  });

  describe('POST /api/v1/logo', () => {
    it('uploads a PNG logo for an application admin', async () => {
      const admin = await makeApplicationAdmin();
      const res = await request(app)
        .post('/api/v1/logo')
        .set(authHeaders(admin))
        .attach('file', Buffer.from('PNGBYTES'), { filename: 'logo.png', contentType: 'image/png' });

      expect(res.status).toBe(201);
      expect(res.body.content_type).toBe('image/png');

      const stored = await prisma.custom_logos.findUnique({ where: { id: 1 } });
      expect(stored?.content_type).toBe('image/png');
      expect(Buffer.from(stored!.content).toString()).toBe('PNGBYTES');
    });

    it('uploads a JPG logo for an application admin', async () => {
      const admin = await makeApplicationAdmin();
      const res = await request(app)
        .post('/api/v1/logo')
        .set(authHeaders(admin))
        .attach('file', Buffer.from('JPGBYTES'), { filename: 'logo.jpg', contentType: 'image/jpeg' });

      expect(res.status).toBe(201);
      expect(res.body.content_type).toBe('image/jpeg');
    });

    it('sanitizes an SVG logo before storing it', async () => {
      const admin = await makeApplicationAdmin();
      const maliciousSvg = '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><circle r="5" /></svg>';
      const res = await request(app)
        .post('/api/v1/logo')
        .set(authHeaders(admin))
        .attach('file', Buffer.from(maliciousSvg), { filename: 'logo.svg', contentType: 'image/svg+xml' });

      expect(res.status).toBe(201);
      const stored = await prisma.custom_logos.findUnique({ where: { id: 1 } });
      const storedText = Buffer.from(stored!.content).toString();
      expect(storedText).not.toContain('<script');
      expect(storedText).toContain('<circle');
    });

    it('replaces an existing logo on a second upload (upsert, not a second row)', async () => {
      const admin = await makeApplicationAdmin();
      await request(app).post('/api/v1/logo').set(authHeaders(admin)).attach('file', Buffer.from('FIRST'), { filename: 'a.png', contentType: 'image/png' });
      await request(app).post('/api/v1/logo').set(authHeaders(admin)).attach('file', Buffer.from('SECOND'), { filename: 'b.png', contentType: 'image/png' });

      const rows = await prisma.custom_logos.findMany();
      expect(rows).toHaveLength(1);
      expect(Buffer.from(rows[0]!.content).toString()).toBe('SECOND');
    });

    it('rejects an unsupported content type with 422', async () => {
      const admin = await makeApplicationAdmin();
      const res = await request(app)
        .post('/api/v1/logo')
        .set(authHeaders(admin))
        .attach('file', Buffer.from('not-an-image'), { filename: 'logo.gif', contentType: 'image/gif' });

      expect(res.status).toBe(422);
    });

    it('rejects a file over 5MB with 413', async () => {
      const admin = await makeApplicationAdmin();
      const oversized = Buffer.alloc(5 * 1024 * 1024 + 1, 'a');
      const res = await request(app)
        .post('/api/v1/logo')
        .set(authHeaders(admin))
        .attach('file', oversized, { filename: 'big.png', contentType: 'image/png' });

      expect(res.status).toBe(413);
    });

    it('accepts a file at exactly 5MB', async () => {
      const admin = await makeApplicationAdmin();
      const atLimit = Buffer.alloc(5 * 1024 * 1024, 'a');
      const res = await request(app)
        .post('/api/v1/logo')
        .set(authHeaders(admin))
        .attach('file', atLimit, { filename: 'exact.png', contentType: 'image/png' });

      expect(res.status).toBe(201);
    });

    it('forbids a plain member (not an application admin)', async () => {
      const member = await makeMember();
      const res = await request(app)
        .post('/api/v1/logo')
        .set(authHeaders(member))
        .attach('file', Buffer.from('PNGBYTES'), { filename: 'logo.png', contentType: 'image/png' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/logo', () => {
    it('resets an existing logo for an application admin', async () => {
      const admin = await makeApplicationAdmin();
      await prisma.custom_logos.create({ data: { id: 1, content: Buffer.from('X'), content_type: 'image/png' } });

      const res = await request(app).delete('/api/v1/logo').set(authHeaders(admin));

      expect(res.status).toBe(204);
      expect(await prisma.custom_logos.findUnique({ where: { id: 1 } })).toBeNull();
    });

    it('is a no-op (still 204) when no logo is set', async () => {
      const admin = await makeApplicationAdmin();
      const res = await request(app).delete('/api/v1/logo').set(authHeaders(admin));
      expect(res.status).toBe(204);
    });

    it('forbids a plain member (not an application admin)', async () => {
      const member = await makeMember();
      const res = await request(app).delete('/api/v1/logo').set(authHeaders(member));
      expect(res.status).toBe(403);
    });
  });
});
