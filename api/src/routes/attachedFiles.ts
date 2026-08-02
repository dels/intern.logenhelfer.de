import { randomUUID } from 'node:crypto';

import type { attached_files as AttachedFileRow } from '../generated/prisma/client.js';
import express, { Router } from 'express';
import type { Request } from 'express';

import { authenticateApiUser } from '../auth/middleware.js';
import { canViewAttachedFile } from '../authz/ability.js';
import { appConfig } from '../lib/appConfig.js';
import { ApiError } from '../lib/errors.js';
import { extractBoundary, parseMultipart, type ParsedMultipart } from '../lib/multipart.js';
import { prisma } from '../db.js';

/**
 * Port of rails-app/app/controllers/api/v1/attached_files_controller.rb.
 *
 * Visibility model: ability.rb's `can [:index, :show, :download], AttachedFile,
 * ['attached_files.deleted = ?', false] do |f| [] != (f.roles & @user.roles) end`
 * is a role-overlap Ruby block, which authz/ability.ts deliberately does NOT
 * register as a CASL rule (see its `canViewAttachedFile` comment - CASL
 * conditions can't express a role-set-intersection check). Two consequences,
 * both replicated here rather than reached for `req.ability.can(...)` alone -
 * see categories.ts's file header for the identical, more fully-argued
 * version of this same reasoning (Category's block rule is the same shape):
 *
 *  - Per-instance visibility (show/download) is `req.ability.can(<action>,
 *    'AttachedFile') || canViewAttachedFile(userRoleIds, fileRoleIds)` - true
 *    unconditionally for anyone with an unconditional `can('manage',
 *    'AttachedFile')` grant (FileAdmin/Secretary/WorshipfulMaster/NetDelegate/
 *    Admin - see `fileAdminAbilities` in authz/ability.ts), otherwise only on
 *    an actual role overlap.
 *  - The :index action-level gate has no CASL equivalent to call at all
 *    (the block rule was never registered), so - matching categories.ts's/
 *    directories.ts's identical precedent - this route does not gate :index
 *    separately; enforcement happens per-row via the same isElevated/overlap
 *    check. The one theoretical divergence from Rails (a user with no
 *    base-tier role at all would see 200+[] here vs Rails' 403) is not
 *    reachable in practice and not exercised by any ported or net-new test.
 *
 * update/create/destroy are NOT part of that block rule - they're granted
 * only via `fileAdminAbilities`'s unconditional `can('manage', 'AttachedFile')`,
 * so those three actions are gated on a plain `req.ability.can(...)` check,
 * no role-overlap fallback.
 *
 * AppConfig[:max_db_mem_size] guard: this note is now STALE for new code (see
 * below) but is kept here describing why the existing `max_db_mem_size`
 * logic is duplicated locally rather than rewritten: at the time it was
 * written, no shared AppConfig service existed for this API port - the small
 * slice of `AppConfig[key]` read logic this resource needs (env-key-prefixed
 * lookup in `app_config_adapters`, falling back to the compiled-in default,
 * then the "K"/"M"/"G"-suffix + Ruby `to_i` casts `AttachedFile.memory_exceeded?`
 * relies on) was duplicated locally below rather than imported from
 * appConfig.ts. `../lib/appConfig.js` now fully exists and exports a working
 * `appConfig` singleton (already used by statistics.ts/me.ts) - the new
 * `max_upload_file_size` check below (POST handler) uses that shared
 * singleton directly rather than repeating this duplication pattern a second
 * time; the existing `max_db_mem_size` duplication itself is left untouched
 * (out of scope for that change).
 *
 * multipart/form-data body parsing: `POST /` is the one write in this whole
 * API port that receives a real file upload, and no multer/busboy/formidable
 * dependency is declared in api/package.json (this task's file boundary also
 * forbids adding one there) - so the raw multipart body (captured via
 * `express.raw()`, scoped to just this one route) is parsed by a small
 * hand-rolled parser below (`parseMultipart`/`extractBoundary`). It's
 * deliberately narrow: N plain text fields plus exactly one file part, which
 * is all `params.require(:file)` / `params[:role_ids]` /
 * `params.require(:directory_slug)` need on the Rails side - not a general
 * RFC 2046 implementation (no nested multipart, no RFC 2231/5987 `filename*`).
 *
 * `GET /:uuid/download` returns raw binary (`Content-Type` taken verbatim
 * from the stored, client-supplied `content_type`; body is the stored
 * `Bytes`/Buffer column), never JSON - whatever OpenAPI contract-validation
 * middleware eventually lands (none exists in this worktree yet - see
 * app.ts's note) MUST skip response-body validation for exactly this path;
 * flagging clearly for that later "Wire" step.
 */

const router = Router();

router.use(authenticateApiUser);

// ---------------------------------------------------------------------------
// JSON shaping
// ---------------------------------------------------------------------------

function attachedFileSummaryJson(f: AttachedFileRow): {
  uuid: string | null;
  filename: string | null;
  content_type: string | null;
  content_length: number | null;
} {
  return { uuid: f.uuid, filename: f.filename, content_type: f.content_type, content_length: f.content_length };
}

function attachedFileJson(
  f: AttachedFileRow,
  roleIds: number[],
  directory: { slug: string | null; name: string | null; category_slug: string | null; category_name: string | null } | null,
  uploaderEmail: string | null,
  downloadCount: number,
): {
  uuid: string | null;
  filename: string | null;
  content_type: string | null;
  content_length: number | null;
  directory_slug: string | null;
  directory_name: string | null;
  category_slug: string | null;
  category_name: string | null;
  uploader_email: string | null;
  role_ids: number[];
  created_at: string;
  download_count: number;
} {
  return {
    ...attachedFileSummaryJson(f),
    directory_slug: directory?.slug ?? null,
    directory_name: directory?.name ?? null,
    category_slug: directory?.category_slug ?? null,
    category_name: directory?.category_name ?? null,
    uploader_email: uploaderEmail,
    role_ids: roleIds,
    created_at: f.created_at.toISOString(),
    download_count: downloadCount,
  };
}

// ---------------------------------------------------------------------------
// Role join-table helpers - mirror categories.ts's/directories.ts's identical
// has-many-through helpers, ported to attached_file_roles.
// ---------------------------------------------------------------------------

async function loadUserRoleIds(userId: number): Promise<number[]> {
  const rows = await prisma.user_roles.findMany({ where: { user_id: userId }, select: { role_id: true } });
  return rows.map((row) => row.role_id).filter((id): id is number => id !== null);
}

async function attachedFileRoleIds(attachedFileId: number): Promise<number[]> {
  const rows = await prisma.attached_file_roles.findMany({
    where: { attached_file_id: attachedFileId },
    orderBy: { id: 'asc' },
    select: { role_id: true },
  });
  return rows.map((row) => row.role_id).filter((id): id is number => id !== null);
}

/** Port of the has_many-through `role_ids=` setter AttachedFile gets from `has_many :roles, through: :attached_file_roles`. */
async function setAttachedFileRoleIds(attachedFileId: number, roleIds: number[]): Promise<void> {
  const now = new Date();
  const ids = [...new Set(roleIds.map((id) => Number(id)).filter((id) => Number.isInteger(id)))];
  await prisma.$transaction([
    prisma.attached_file_roles.deleteMany({ where: { attached_file_id: attachedFileId } }),
    ...(ids.length > 0
      ? [
          prisma.attached_file_roles.createMany({
            data: ids.map((roleId) => ({ attached_file_id: attachedFileId, role_id: roleId, created_at: now, updated_at: now })),
          }),
        ]
      : []),
  ]);
}

async function loadDirectorySummary(directoryId: number | null): Promise<{
  slug: string | null;
  name: string | null;
  category_slug: string | null;
  category_name: string | null;
} | null> {
  if (directoryId === null) {
    return null;
  }
  const directory = await prisma.directories.findFirst({ where: { id: directoryId }, select: { slug: true, name: true, category_id: true } });
  if (!directory) {
    return null;
  }
  const category =
    directory.category_id === null
      ? null
      : await prisma.categories.findFirst({ where: { id: directory.category_id }, select: { slug: true, name: true } });
  return { slug: directory.slug, name: directory.name, category_slug: category?.slug ?? null, category_name: category?.name ?? null };
}

/**
 * Ability.rb's role-overlap block rule for AttachedFile only ever checked
 * `attached_files.deleted = false` on the file's own row - it never
 * cascaded to the parent directory/category's own `deleted` flag, and
 * neither directories.ts's nor categories.ts's own DELETE handlers cascade
 * a soft-delete down into their attached_files rows either (see this file's
 * header and directories.ts's/categories.ts's own DELETE-handler comments).
 * Net effect: once a caller has (or ever had) a file's UUID, soft-deleting
 * its containing directory or category from the admin UI does NOT revoke
 * direct show/download access to that file - it stays fetchable forever.
 * Checked here, at read time, rather than by adding a cascade to the
 * delete handlers, since a cascade would only protect files deleted after
 * this fix ships, not ones whose parent was already soft-deleted before it.
 */
async function isCategoryDeleted(categoryId: number | null): Promise<boolean> {
  if (categoryId === null) {
    return false;
  }
  const category = await prisma.categories.findFirst({ where: { id: categoryId }, select: { deleted: true } });
  return !category || category.deleted === true;
}

async function isAncestorDeleted(directoryId: number | null): Promise<boolean> {
  if (directoryId === null) {
    return false;
  }
  const directory = await prisma.directories.findFirst({ where: { id: directoryId }, select: { deleted: true, category_id: true } });
  if (!directory || directory.deleted) {
    return true;
  }
  return isCategoryDeleted(directory.category_id);
}

async function loadDownloadCount(attachedFileId: number): Promise<number> {
  return prisma.file_downloads.count({ where: { attached_file_id: attachedFileId, deleted: false } });
}

async function loadUploaderEmail(uploaderId: number | null): Promise<string | null> {
  if (uploaderId === null) {
    return null;
  }
  const uploader = await prisma.users.findFirst({ where: { id: uploaderId }, select: { email: true } });
  return uploader?.email ?? null;
}

// ---------------------------------------------------------------------------
// AppConfig[:max_db_mem_size] guard - see this file's header for why this is
// a local, partial duplicate of appConfig.ts's `readRaw` rather than a shared
// import.
// ---------------------------------------------------------------------------

const MAX_DB_MEM_SIZE_DEFAULT = String(1024 * 1024 * 100);

function envKeyPrefix(): string {
  return process.env.NODE_ENV ?? 'development';
}

/** Port of Ruby's String#to_i, as used by AttachedFile::memory_exceeded?'s `AppConfig[:max_db_mem_size].to_i`. */
function rubyToI(value: unknown): number {
  if (typeof value === 'number') {
    return Math.trunc(value);
  }
  const match = /^\s*[-+]?\d+/.exec(String(value));
  return match ? Number.parseInt(match[0], 10) : 0;
}

/** Port of `AppConfig::Adapter#getter_max_db_mem_size` - see appConfig.ts's identical helper. */
function parseMaxDbMemSize(raw: string): string | number {
  let match = /(\d+)K/i.exec(raw);
  if (match?.[1] !== undefined) {
    return Number.parseInt(match[1], 10) * 1024;
  }
  match = /(\d+)M/i.exec(raw);
  if (match?.[1] !== undefined) {
    return Number.parseInt(match[1], 10) * 1024 * 1024;
  }
  match = /(\d+)G/i.exec(raw);
  if (match?.[1] !== undefined) {
    return Number.parseInt(match[1], 10) * 1024 * 1024 * 1024;
  }
  return raw;
}

async function maxDbMemSizeBytes(): Promise<number> {
  const key = `${envKeyPrefix()}_max_db_mem_size`;
  const row = await prisma.app_config_adapters.findFirst({ where: { key } });
  const raw = row?.value ?? MAX_DB_MEM_SIZE_DEFAULT;
  return rubyToI(parseMaxDbMemSize(raw));
}

/** Port of `AttachedFile.memory_used` - `AttachedFile.sum('content_length')`, respecting the non-archive default_scope (`deleted = false`). */
async function memoryUsedBytes(): Promise<number> {
  const aggregate = await prisma.attached_files.aggregate({ where: { deleted: false }, _sum: { content_length: true } });
  return aggregate._sum.content_length ?? 0;
}

/** Port of `AttachedFile.memory_exceeded?`. */
async function memoryExceeded(): Promise<boolean> {
  const [used, max] = await Promise.all([memoryUsedBytes(), maxDbMemSizeBytes()]);
  return used >= max;
}

// ---------------------------------------------------------------------------
// AttachedFile#slug_name / UuidHelper#generate_uuid ports
// ---------------------------------------------------------------------------

/**
 * Port of `AttachedFile#slug_name`'s `o_name.gsub(/^(.*?)\.(.*?)$/, "\\1
 * (#{i}).\\2")`. Found bug in the Rails source, deliberately NOT reproduced:
 * Ruby's `gsub` returns the string completely UNCHANGED when the filename has
 * no "." at all (the regex never matches), which on a real collision spins
 * Rails' own `begin ... end while self.class.exists?(...)` loop forever (the
 * candidate filename never changes, so the collision check never turns
 * false). This port instead appends " (i)" directly to the whole name when
 * there's no extension to split, so a collision on an extension-less
 * filename resolves after a bounded number of attempts instead of hanging.
 */
function renameForCollision(original: string, attempt: number): string {
  const match = /^(.*?)\.(.*?)$/.exec(original);
  if (!match || match[1] === undefined || match[2] === undefined) {
    return `${original} (${attempt})`;
  }
  return `${match[1]} (${attempt}).${match[2]}`;
}

/** Port of `AttachedFile#slug_name` (before_create callback). */
async function uniqueFilename(original: string): Promise<string> {
  let candidate = original;
  let attempt = 2;
  // eslint-disable-next-line no-await-in-loop -- sequential by nature: each candidate depends on the previous check, mirrors uniqueCategorySlug/uniqueDirectorySlug.
  while (await prisma.attached_files.findFirst({ where: { filename: candidate, deleted: false } })) {
    candidate = renameForCollision(original, attempt);
    attempt += 1;
  }
  return candidate;
}

/** Port of `UuidHelper#generate_uuid` (before_create callback). */
async function generateUniqueUuid(): Promise<string> {
  let candidate = randomUUID();
  // eslint-disable-next-line no-await-in-loop -- collision retry loop; astronomically unlikely to iterate more than once for a v4 UUID.
  while (await prisma.attached_files.findFirst({ where: { uuid: candidate } })) {
    candidate = randomUUID();
  }
  return candidate;
}

function requireMultipartField(fields: Record<string, string[]>, name: string): string {
  const value = fields[name]?.[0];
  if (value === undefined || value.length === 0) {
    throw ApiError.badRequest(`param is missing or the value is empty: ${name}`);
  }
  return value;
}

function requireDirectorySlug(raw: unknown): string {
  if (typeof raw !== 'string' || raw.length === 0) {
    throw ApiError.badRequest('param is missing or the value is empty: directory_slug');
  }
  return raw;
}

async function findUndeletedDirectoryBySlug(
  slug: string,
): Promise<{ id: number; slug: string | null; name: string | null; category_id: number | null } | null> {
  return prisma.directories.findFirst({ where: { slug, deleted: false }, select: { id: true, slug: true, name: true, category_id: true } });
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

// GET /api/v1/attached_files?directory_slug=...
router.get('/', async (req, res, next) => {
  try {
    const directorySlug = requireDirectorySlug(req.query.directory_slug);
    const directory = await findUndeletedDirectoryBySlug(directorySlug);
    if (!directory || (await isCategoryDeleted(directory.category_id))) {
      throw ApiError.notFound();
    }

    const files = await prisma.attached_files.findMany({ where: { directory_id: directory.id, deleted: false }, orderBy: { id: 'asc' } });

    const fileIds = files.map((f) => f.id);
    const roleRows = fileIds.length > 0 ? await prisma.attached_file_roles.findMany({ where: { attached_file_id: { in: fileIds } } }) : [];
    const roleIdsByFile = new Map<number, number[]>();
    for (const row of roleRows) {
      if (row.attached_file_id === null || row.role_id === null) continue;
      const ids = roleIdsByFile.get(row.attached_file_id) ?? [];
      ids.push(row.role_id);
      roleIdsByFile.set(row.attached_file_id, ids);
    }

    const userRoleIds = await loadUserRoleIds(req.currentUser!.id);
    const isElevated = req.ability?.can('show', 'AttachedFile') ?? false;
    const visible = files.filter((f) => isElevated || canViewAttachedFile(userRoleIds, roleIdsByFile.get(f.id) ?? []));

    res.status(200).json({ rows: visible.map((f) => attachedFileSummaryJson(f)), row_count: visible.length });
  } catch (err) {
    next(err);
  }
});

interface MulterFile {
  fieldname: string;
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

/**
 * Request/file extraction for the multipart create route, tried in this
 * order:
 *
 *  1. `req.files` (an array): express-openapi-validator's own multer
 *     instance (mounted globally ahead of this router - see app.ts's
 *     createContractValidationMiddleware - for every operation whose spec
 *     declares a `format: binary` property) already parsed the request
 *     stream by the time this handler runs, populating `req.body` (text
 *     fields) and `req.files` (uploaded parts) itself. Falling through to
 *     this file's own manual parser below would read from an
 *     already-drained stream and 400 with "multipart/form-data request
 *     required" - the exact symptom this branch fixes.
 *  2. The manual parser (extractBoundary/parseMultipart below): this file's
 *     own test harness (attachedFiles.test.ts) mounts the router directly,
 *     with no express-openapi-validator in front, so `req.files` is never
 *     set there and the raw multipart body is still intact for
 *     `express.raw()` to hand off.
 */
function extractMultipartRequest(req: Request): { directorySlug: string | undefined; file: ParsedMultipart['file']; roleIdValues: string[] } {
  if (Array.isArray(req.files)) {
    const body = req.body as Record<string, string | string[] | undefined>;
    const firstOf = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);
    const uploaded = (req.files as MulterFile[]).find((f) => f.fieldname === 'file');
    const roleIdsRaw = body['role_ids[]'] ?? body.role_ids;
    return {
      directorySlug: firstOf(body.directory_slug),
      file: uploaded ? { filename: uploaded.originalname, contentType: uploaded.mimetype, content: uploaded.buffer } : undefined,
      roleIdValues: Array.isArray(roleIdsRaw) ? roleIdsRaw : roleIdsRaw !== undefined ? [roleIdsRaw] : [],
    };
  }

  const contentType = req.headers['content-type'] ?? '';
  const boundary = extractBoundary(contentType);
  if (!Buffer.isBuffer(req.body) || !boundary) {
    throw ApiError.badRequest('multipart/form-data request required');
  }
  const parsed = parseMultipart(req.body, boundary);
  return { directorySlug: parsed.fields.directory_slug?.[0], file: parsed.file, roleIdValues: parsed.fields.role_ids ?? parsed.fields['role_ids[]'] ?? [] };
}

// POST /api/v1/attached_files (multipart/form-data)
router.post('/', express.raw({ type: 'multipart/form-data', limit: '20mb' }), async (req, res, next) => {
  try {
    if (!req.ability?.can('create', 'AttachedFile')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    // Memory-guard check runs before even parsing directory_slug/file,
    // matching AttachedFilesController#create's ordering.
    if (await memoryExceeded()) {
      res.status(422).json({ error: 'unprocessable', detail: 'Kein Speicherplatz mehr verfügbar' });
      return;
    }

    const { directorySlug: directorySlugRaw, file, roleIdValues } = extractMultipartRequest(req);

    const directorySlug = requireMultipartField(directorySlugRaw !== undefined ? { directory_slug: [directorySlugRaw] } : {}, 'directory_slug');
    const directory = await findUndeletedDirectoryBySlug(directorySlug);
    if (!directory) {
      throw ApiError.notFound();
    }

    if (!file) {
      throw ApiError.badRequest('param is missing or the value is empty: file');
    }

    // Soft, admin-editable upload-size limit (AppConfig `max_upload_file_size`,
    // default 20MB - see lib/appConfig.ts) - distinct from the hard
    // MULTIPART_FILE_SIZE_LIMIT_BYTES ceiling enforced further upstream by
    // express-openapi-validator's multer instance (contractValidation.ts),
    // which this check runs strictly after: a request that already cleared
    // that ceiling can still be rejected here if it exceeds the (lower,
    // admin-configured) soft limit. Detail is in English, like every other
    // ApiError.*(...) call in this file - unlike the memoryExceeded 422
    // below, this isn't user-facing UI copy, just a technical `detail` field.
    const maxUploadFileSize = Number(await appConfig.get('max_upload_file_size'));
    if (Number.isFinite(maxUploadFileSize) && maxUploadFileSize > 0 && file.content.length > maxUploadFileSize) {
      throw ApiError.payloadTooLarge(`file exceeds maximum allowed size of ${maxUploadFileSize} bytes`);
    }

    const roleIds = roleIdValues
      .map((value) => Number.parseInt(value, 10))
      .filter((id) => Number.isInteger(id));

    const filename = await uniqueFilename(file.filename);
    const uuid = await generateUniqueUuid();
    const now = new Date();

    // AttachedFile has no `validates` calls in rails-app/app/models/attached_file.rb
    // - the controller's "if attached_file.save ... else render 422" branch
    // is therefore dead code on the Rails side too (nothing can make #save
    // return false short of a DB-level constraint violation), so there is no
    // validation-failure 422 path to port here beyond the memory guard above.
    const created = await prisma.attached_files.create({
      data: {
        uuid,
        filename,
        content_type: file.contentType,
        // Prisma's generated `Bytes` field type is `Uint8Array<ArrayBuffer>`,
        // while `Buffer` is typed `Buffer<ArrayBufferLike>` (its backing
        // buffer can be a `SharedArrayBuffer`) - a plain `Uint8Array` copy
        // narrows that back to a real `ArrayBuffer` so this type-checks.
        content: new Uint8Array(file.content),
        content_length: file.content.length,
        directory_id: directory.id,
        uploader_id: req.currentUser!.id,
        deleted: false,
        created_at: now,
        updated_at: now,
      },
    });

    if (roleIds.length > 0) {
      await setAttachedFileRoleIds(created.id, roleIds);
    }
    const finalRoleIds = await attachedFileRoleIds(created.id);

    res.status(201).json(attachedFileJson(created, finalRoleIds, await loadDirectorySummary(directory.id), await loadUploaderEmail(created.uploader_id), 0));
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/attached_files/:uuid
router.get('/:uuid', async (req, res, next) => {
  try {
    const existing = await prisma.attached_files.findFirst({ where: { uuid: req.params.uuid, deleted: false } });
    if (!existing || (await isAncestorDeleted(existing.directory_id))) {
      throw ApiError.notFound();
    }

    const roleIds = await attachedFileRoleIds(existing.id);
    const userRoleIds = await loadUserRoleIds(req.currentUser!.id);
    const canSee = (req.ability?.can('show', 'AttachedFile') ?? false) || canViewAttachedFile(userRoleIds, roleIds);
    if (!canSee) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const directory = await loadDirectorySummary(existing.directory_id);
    const uploaderEmail = await loadUploaderEmail(existing.uploader_id);
    const downloadCount = await loadDownloadCount(existing.id);
    res.status(200).json(attachedFileJson(existing, roleIds, directory, uploaderEmail, downloadCount));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/attached_files/:uuid
router.patch('/:uuid', async (req, res, next) => {
  try {
    // Lookup runs BEFORE the ability check, per AttachedFilesController's
    // `before_action :set_attached_file, only: %i[show update destroy download]`.
    const existing = await prisma.attached_files.findFirst({ where: { uuid: req.params.uuid, deleted: false } });
    if (!existing) {
      throw ApiError.notFound();
    }

    if (!req.ability?.can('update', 'AttachedFile')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    // directory_slug is deliberately never read here - attached_file_params
    // (`params.permit(:filename, role_ids: [])`) never permits it, matching
    // Category/Directory's own immutable-parent convention (see
    // directories.ts's identical comment).
    const body = (req.body ?? {}) as { filename?: unknown; role_ids?: unknown };
    const nextFilename = 'filename' in body ? ((body.filename as string | null | undefined) ?? existing.filename) : existing.filename;

    const updated = await prisma.attached_files.update({
      where: { id: existing.id },
      data: { filename: nextFilename, updated_at: new Date() },
    });

    if (Array.isArray(body.role_ids)) {
      await setAttachedFileRoleIds(existing.id, body.role_ids as number[]);
    }
    const roleIds = await attachedFileRoleIds(existing.id);
    const directory = await loadDirectorySummary(existing.directory_id);
    const uploaderEmail = await loadUploaderEmail(existing.uploader_id);
    const downloadCount = await loadDownloadCount(existing.id);

    res.status(200).json(attachedFileJson(updated, roleIds, directory, uploaderEmail, downloadCount));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/attached_files/:uuid
router.delete('/:uuid', async (req, res, next) => {
  try {
    const existing = await prisma.attached_files.findFirst({ where: { uuid: req.params.uuid, deleted: false } });
    if (!existing) {
      throw ApiError.notFound();
    }

    if (!req.ability?.can('destroy', 'AttachedFile')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    // AttachedFile#delete's non-archive branch sets deleted = true (a plain
    // soft-delete, not a real DB delete despite the Ruby method being named
    // `delete`). The archive-mode branch (deleted = false + cascade up into
    // the parent directory) is out of scope, matching categories.ts's/
    // directories.ts's `isArchiveMode` convention (always false; no shared
    // AppConfig service exists yet - see this file's header). Directory's own
    // cascading soft-delete DOWN into its attached_files
    // (`self.attached_files.all.each {|f| f.delete}`, Directory#delete) is
    // also out of scope here - directories.ts's DELETE handler already flags
    // that gap as belonging to this resource, but this task's file boundary
    // forbids editing directories.ts to wire the call, so the cross-resource
    // cascade remains unimplemented anywhere. Flagged in this task's report.
    await prisma.attached_files.update({ where: { id: existing.id }, data: { deleted: true, updated_at: new Date() } });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/attached_files/:uuid/download
router.get('/:uuid/download', async (req, res, next) => {
  try {
    const existing = await prisma.attached_files.findFirst({ where: { uuid: req.params.uuid, deleted: false } });
    if (!existing || (await isAncestorDeleted(existing.directory_id))) {
      throw ApiError.notFound();
    }

    const roleIds = await attachedFileRoleIds(existing.id);
    const userRoleIds = await loadUserRoleIds(req.currentUser!.id);
    const canSee = (req.ability?.can('download', 'AttachedFile') ?? false) || canViewAttachedFile(userRoleIds, roleIds);
    if (!canSee) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const now = new Date();
    await prisma.file_downloads.create({
      data: {
        attached_file_id: existing.id,
        user_id: req.currentUser!.id,
        filename: existing.filename,
        remote_ip: req.currentUser!.current_sign_in_ip,
        deleted: false,
        created_at: now,
        updated_at: now,
      },
    });

    // `res.attachment()` sets Content-Disposition to 'attachment' (never
    // 'inline') via Express's own contentDisposition helper - this is the
    // deliberate XSS mitigation noted in the Rails controller: content_type
    // is attacker-controlled (whatever the uploading browser claimed), so a
    // browser must never be told to render this content inline regardless of
    // what that content_type says. The explicit `res.set('Content-Type', ...)`
    // below runs AFTER `res.attachment()` so it isn't clobbered by
    // `res.attachment()`'s own extension-based content-type guess.
    res.attachment(existing.filename ?? 'download');
    res.set('Content-Type', existing.content_type ?? 'application/octet-stream');
    res.send(existing.content ?? Buffer.alloc(0));
  } catch (err) {
    next(err);
  }
});

export default router;
