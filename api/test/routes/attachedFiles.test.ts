import { randomUUID } from 'node:crypto';

import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import type { users } from '../../src/generated/prisma/client.js';

import { issueAccessToken } from '../../src/auth/jwt.js';
import { appConfig } from '../../src/lib/appConfig.js';
import { apiErrorHandler } from '../../src/lib/errors.js';
import attachedFilesRouter from '../../src/routes/attachedFiles.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

// Port of rails-app/spec/requests/api/v1/attached_files_spec.rb (13 examples),
// plus a small number of net-new security tests (see the bottom describe
// block).

const app = express();
app.use(express.json());
app.use('/api/v1/attached_files', attachedFilesRouter);
app.use(apiErrorHandler);

function authHeaders(user: users): { Authorization: string } {
  return { Authorization: `Bearer ${issueAccessToken(user.id)}` };
}

async function createRole(name: string, displayName = name): Promise<{ id: number; name: string | null }> {
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

async function createCategory(name: string): Promise<{ id: number; slug: string | null; name: string | null }> {
  const now = new Date();
  return prisma.categories.create({ data: { name, slug: slugify(name), deleted: false, created_at: now, updated_at: now } });
}

async function createDirectory(categoryId: number, name: string): Promise<{ id: number; slug: string | null; name: string | null }> {
  const now = new Date();
  return prisma.directories.create({
    data: { name, category_id: categoryId, slug: slugify(name), deleted: false, created_at: now, updated_at: now },
  });
}

async function createAttachedFile(options: {
  directoryId: number;
  uploaderId: number;
  filename: string;
  contentType?: string;
  content?: string;
}): Promise<{ id: number; uuid: string | null; filename: string | null }> {
  const now = new Date();
  return prisma.attached_files.create({
    data: {
      uuid: randomUUID(),
      filename: options.filename,
      content_type: options.contentType ?? 'application/pdf',
      content: Buffer.from(options.content ?? 'PDF-BYTES'),
      content_length: Buffer.byteLength(options.content ?? 'PDF-BYTES'),
      directory_id: options.directoryId,
      uploader_id: options.uploaderId,
      deleted: false,
      created_at: now,
      updated_at: now,
    },
  });
}

async function attachRoleToFile(attachedFileId: number, roleId: number): Promise<void> {
  const now = new Date();
  await prisma.attached_file_roles.create({ data: { attached_file_id: attachedFileId, role_id: roleId, created_at: now, updated_at: now } });
}

function envKeyPrefix(): string {
  return process.env.NODE_ENV ?? 'development';
}

async function setMaxDbMemSize(value: string): Promise<void> {
  const key = `${envKeyPrefix()}_max_db_mem_size`;
  await prisma.app_config_adapters.upsert({ where: { key }, update: { value }, create: { key, value } });
}

// Unlike setMaxDbMemSize above (a plain DB upsert, fine for that key since
// attachedFiles.ts's own memoryExceeded() reads max_db_mem_size straight from
// the DB every time, uncached), max_upload_file_size is read through the
// shared appConfig singleton (lib/appConfig.ts), which caches for up to 5
// minutes outside NODE_ENV=development. A raw DB upsert here would leave a
// stale cached value in place for the rest of this test file's run - go
// through appConfig.set() instead, which writes the row AND invalidates that
// key's cache entry.
async function setMaxUploadFileSize(bytes: number): Promise<void> {
  await appConfig.set('max_upload_file_size', String(bytes));
}

describe('AttachedFiles API', () => {
  let secretaryRole: { id: number; name: string | null };
  let apprenticeRole: { id: number; name: string | null };
  let visibleRole: { id: number; name: string | null };
  let otherRole: { id: number; name: string | null };

  let admin: users;
  let viewer: users;
  let outsider: users;

  let category: { id: number; slug: string | null; name: string | null };
  let directory: { id: number; slug: string | null; name: string | null };
  let satzungFilename: string;
  let visibleFile: { id: number; uuid: string | null; filename: string | null };

  beforeEach(async () => {
    await resetDb();

    secretaryRole = await createRole('Secretary', 'Sekretär');
    // EnteredApprentice is the role that maps to default_user_abilities (via
    // buildAbility's ROLE_ABILITY_BUILDERS) - the only place the AttachedFile
    // [:index, :show, :download] role-intersection rule lives. Without a role
    // that resolves to an *_abilities builder, a user gets zero AttachedFile
    // abilities at all, regardless of which role the file itself carries -
    // see directories.test.ts's `member` for the same pattern.
    apprenticeRole = await createRole('EnteredApprentice', 'Lehrling');
    visibleRole = await createRole(`ViewerRole${Math.random().toString(36).slice(2)}`, 'Sichtbar');
    otherRole = await createRole(`OtherRole${Math.random().toString(36).slice(2)}`, 'Andere');

    admin = await createUser();
    await assignRole(admin.id, secretaryRole.id);

    viewer = await createUser();
    await assignRole(viewer.id, apprenticeRole.id);
    await assignRole(viewer.id, visibleRole.id);

    outsider = await createUser();
    await assignRole(outsider.id, apprenticeRole.id);
    await assignRole(outsider.id, otherRole.id);

    category = await createCategory(`E2E Kategorie ${Date.now()}`);
    directory = await createDirectory(category.id, `E2E Ordner ${Date.now()}-${Math.random()}`);

    satzungFilename = `satzung-${Math.random().toString(36).slice(2)}.pdf`;
    visibleFile = await createAttachedFile({ directoryId: directory.id, uploaderId: admin.id, filename: satzungFilename });
    await attachRoleToFile(visibleFile.id, visibleRole.id);
  });

  describe('GET /api/v1/attached_files', () => {
    it('lists a file visible to a user whose roles intersect the file roles', async () => {
      const res = await request(app).get('/api/v1/attached_files').query({ directory_slug: directory.slug }).set(authHeaders(viewer));

      expect(res.status).toBe(200);
      expect(res.body.rows.map((r: { uuid: string }) => r.uuid)).toContain(visibleFile.uuid);
    });

    it('hides a file from a user whose roles do not intersect', async () => {
      const res = await request(app).get('/api/v1/attached_files').query({ directory_slug: directory.slug }).set(authHeaders(outsider));

      expect(res.status).toBe(200);
      expect(res.body.rows.map((r: { uuid: string }) => r.uuid)).not.toContain(visibleFile.uuid);
    });
  });

  describe('POST /api/v1/attached_files', () => {
    it('forbids a plain viewer (not a file admin)', async () => {
      const res = await request(app)
        .post('/api/v1/attached_files')
        .set(authHeaders(viewer))
        .field('directory_slug', directory.slug!)
        .attach('file', Buffer.from('sample file contents'), 'sample.txt');

      expect(res.status).toBe(403);
    });

    it('uploads a file for a file admin', async () => {
      const uploadFilename = `sample-${Math.random().toString(36).slice(2)}.txt`;

      const res = await request(app)
        .post('/api/v1/attached_files')
        .set(authHeaders(admin))
        .field('directory_slug', directory.slug!)
        .field('role_ids', [visibleRole.id])
        .attach('file', Buffer.from('sample file contents'), uploadFilename);

      expect(res.status).toBe(201);
      expect(res.body.filename).toBe(uploadFilename);
      expect(res.body.content_type).toBe('text/plain');
      expect(res.body.role_ids).toEqual([visibleRole.id]);
    });

    it('rejects an upload when the DB memory guard is exceeded', async () => {
      await setMaxDbMemSize('1');

      const res = await request(app)
        .post('/api/v1/attached_files')
        .set(authHeaders(admin))
        .field('directory_slug', directory.slug!)
        .attach('file', Buffer.from('sample file contents'), 'sample.txt');

      expect(res.status).toBe(422);
      expect(res.body.error).toBe('unprocessable');
    });

    it('rejects an upload exceeding the configured max_upload_file_size with a 413 payload_too_large', async () => {
      await setMaxUploadFileSize(5 * 1024 * 1024);
      const oversized = Buffer.alloc(5 * 1024 * 1024 + 1, 'a');

      const res = await request(app)
        .post('/api/v1/attached_files')
        .set(authHeaders(admin))
        .field('directory_slug', directory.slug!)
        .attach('file', oversized, 'toobig.bin');

      expect(res.status).toBe(413);
      expect(res.body.error).toBe('payload_too_large');
    });

    it('accepts an upload at or under the configured max_upload_file_size', async () => {
      await setMaxUploadFileSize(5 * 1024 * 1024);
      const atLimit = Buffer.alloc(5 * 1024 * 1024, 'a');

      const res = await request(app)
        .post('/api/v1/attached_files')
        .set(authHeaders(admin))
        .field('directory_slug', directory.slug!)
        .attach('file', atLimit, 'justfits.bin');

      expect(res.status).toBe(201);
      expect(res.body.filename).toBe('justfits.bin');
    });
  });

  describe('GET /api/v1/attached_files/:uuid', () => {
    it('shows a file visible to the caller', async () => {
      const res = await request(app).get(`/api/v1/attached_files/${visibleFile.uuid}`).set(authHeaders(viewer));

      expect(res.status).toBe(200);
      expect(res.body.directory_slug).toBe(directory.slug);
      expect(res.body.uploader_email).toBe(admin.email);
    });

    it('includes the parent category and a zero download_count for a never-downloaded file', async () => {
      const res = await request(app).get(`/api/v1/attached_files/${visibleFile.uuid}`).set(authHeaders(viewer));

      expect(res.status).toBe(200);
      expect(res.body.category_slug).toBe(category.slug);
      expect(res.body.category_name).toBe(category.name);
      expect(res.body.download_count).toBe(0);
    });

    it('reflects prior downloads in download_count', async () => {
      await request(app).get(`/api/v1/attached_files/${visibleFile.uuid}/download`).set(authHeaders(viewer));
      await request(app).get(`/api/v1/attached_files/${visibleFile.uuid}/download`).set(authHeaders(viewer));

      const res = await request(app).get(`/api/v1/attached_files/${visibleFile.uuid}`).set(authHeaders(viewer));

      expect(res.status).toBe(200);
      expect(res.body.download_count).toBe(2);
    });

    it('forbids a file not visible to the caller', async () => {
      const res = await request(app).get(`/api/v1/attached_files/${visibleFile.uuid}`).set(authHeaders(outsider));

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/attached_files/:uuid', () => {
    it('updates filename and role_ids for a file admin', async () => {
      const res = await request(app)
        .patch(`/api/v1/attached_files/${visibleFile.uuid}`)
        .send({ filename: 'renamed.pdf', role_ids: [otherRole.id] })
        .set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body.filename).toBe('renamed.pdf');
      expect(res.body.role_ids).toEqual([otherRole.id]);
    });

    it('forbids a plain viewer', async () => {
      const res = await request(app)
        .patch(`/api/v1/attached_files/${visibleFile.uuid}`)
        .send({ filename: 'x.pdf' })
        .set(authHeaders(viewer));

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/attached_files/:uuid', () => {
    it('soft-deletes for a file admin', async () => {
      const res = await request(app).delete(`/api/v1/attached_files/${visibleFile.uuid}`).set(authHeaders(admin));

      expect(res.status).toBe(204);
      const reloaded = await prisma.attached_files.findUniqueOrThrow({ where: { id: visibleFile.id } });
      expect(reloaded.deleted).toBe(true);
    });

    it('forbids a plain viewer', async () => {
      const res = await request(app).delete(`/api/v1/attached_files/${visibleFile.uuid}`).set(authHeaders(viewer));

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/attached_files/:uuid/download', () => {
    it('streams the file bytes and logs a FileDownload', async () => {
      const res = await request(app).get(`/api/v1/attached_files/${visibleFile.uuid}/download`).set(authHeaders(viewer));

      expect(res.status).toBe(200);
      expect(Buffer.isBuffer(res.body) ? res.body.toString() : res.text).toBe('PDF-BYTES');

      const download = await prisma.file_downloads.findFirstOrThrow({ orderBy: { id: 'desc' } });
      expect(download.attached_file_id).toBe(visibleFile.id);
      expect(download.user_id).toBe(viewer.id);
      expect(download.filename).toBe(satzungFilename);
    });

    it('forbids a user without visibility', async () => {
      const res = await request(app).get(`/api/v1/attached_files/${visibleFile.uuid}/download`).set(authHeaders(outsider));

      expect(res.status).toBe(403);
    });
  });

  // Net-new security tests (not in the Rails spec).
  describe('security', () => {
    it('authz boundary: a role with no file-admin grant and no base-tier role (WorkingPlanAdmin) gets 403 accessing a file, even with a technically-valid token', async () => {
      const workingPlanAdminRole = await createRole('WorkingPlanAdmin', 'Terminverwalter');
      const workingPlanAdmin = await createUser();
      await assignRole(workingPlanAdmin.id, workingPlanAdminRole.id);

      const res = await request(app).get(`/api/v1/attached_files/${visibleFile.uuid}`).set(authHeaders(workingPlanAdmin));

      expect(res.status).toBe(403);
    });

    it('is not vulnerable to SQL-metacharacter injection via the directory_slug query param', async () => {
      const res = await request(app)
        .get('/api/v1/attached_files')
        .query({ directory_slug: "' OR '1'='1" })
        .set(authHeaders(viewer));

      // Prisma's parameterization means a metacharacter-laden directory_slug
      // is treated as a literal string to match against, not SQL - it
      // matches nothing (a real slug never contains a quote), so this 404s
      // rather than erroring or returning every directory's attached files.
      expect(res.status).toBe(404);
    });

    it('is not vulnerable to a % wildcard payload via the directory_slug query param', async () => {
      const res = await request(app).get('/api/v1/attached_files').query({ directory_slug: '%' }).set(authHeaders(viewer));

      expect(res.status).toBe(404);
    });

    it('rejects requests with no Authorization header at all', async () => {
      const res = await request(app).get('/api/v1/attached_files').query({ directory_slug: directory.slug });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'unauthorized' });
    });

    it('denies show/download of a file whose parent directory has been soft-deleted', async () => {
      await prisma.directories.update({ where: { id: directory.id }, data: { deleted: true } });

      const showRes = await request(app).get(`/api/v1/attached_files/${visibleFile.uuid}`).set(authHeaders(viewer));
      expect(showRes.status).toBe(404);

      const downloadRes = await request(app).get(`/api/v1/attached_files/${visibleFile.uuid}/download`).set(authHeaders(viewer));
      expect(downloadRes.status).toBe(404);
    });

    it('denies show/download of a file whose parent category has been soft-deleted', async () => {
      await prisma.categories.update({ where: { id: category.id }, data: { deleted: true } });

      const showRes = await request(app).get(`/api/v1/attached_files/${visibleFile.uuid}`).set(authHeaders(viewer));
      expect(showRes.status).toBe(404);

      const downloadRes = await request(app).get(`/api/v1/attached_files/${visibleFile.uuid}/download`).set(authHeaders(viewer));
      expect(downloadRes.status).toBe(404);
    });

    it('excludes a directory listing from the index when only its parent category is soft-deleted (directory itself untouched)', async () => {
      // Simulates a category deleted by a path that doesn't cascade to its
      // directories (e.g. direct DB edit, or data soft-deleted before this
      // fix shipped) - the normal DELETE /categories/:slug handler already
      // cascades to its directories, so this wouldn't otherwise occur via
      // the API alone, but the index route must not rely on that cascade
      // having run.
      await prisma.categories.update({ where: { id: category.id }, data: { deleted: true } });

      const res = await request(app).get('/api/v1/attached_files').query({ directory_slug: directory.slug }).set(authHeaders(viewer));

      expect(res.status).toBe(404);
    });
  });
});
