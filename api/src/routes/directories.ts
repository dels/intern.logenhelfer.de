import type { directories as DirectoryRow } from '../generated/prisma/client.js';
import { Router } from 'express';

import { authenticateApiUser } from '../auth/middleware.js';
import { canViewDirectory } from '../authz/ability.js';
import { appConfig } from '../lib/appConfig.js';
import { ApiError } from '../lib/errors.js';
import { buildListResponse, parsePageParams } from '../lib/pagination.js';
import { generateUniqueSlug } from '../lib/slug.js';
import { prisma } from '../db.js';

/**
 * Port of rails-app/app/controllers/api/v1/directories_controller.rb.
 *
 * See categories.ts's file header for the full rationale behind this
 * resource's visibility model - Directory's role-overlap visibility rule
 * (`can [:index, :show], Directory do |d| [] != (d.roles & @user.roles) end`,
 * ability.rb) is the exact same shape as Category's, just ported via
 * `canViewDirectory` instead of `canViewCategory`, and the same reasoning
 * applies to why :index isn't gated by `ability.can?` here.
 */

const router = Router();

router.use(authenticateApiUser);

function directorySummaryJson(directory: DirectoryRow): { slug: string | null; name: string | null; description: string | null } {
  return { slug: directory.slug, name: directory.name, description: directory.description };
}

function directoryJson(
  directory: DirectoryRow,
  roleIds: number[],
  category: { slug: string | null; name: string | null },
): {
  slug: string | null;
  name: string | null;
  description: string | null;
  category_slug: string | null;
  category_name: string | null;
  role_ids: number[];
} {
  return { ...directorySummaryJson(directory), category_slug: category.slug, category_name: category.name, role_ids: roleIds };
}

function isBlank(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  return false;
}

/** Port of `params.require(:category_slug)` - see officers.ts's `lodge_slug` analogue. */
function requireCategorySlug(raw: unknown): string {
  if (typeof raw !== 'string' || raw.length === 0) {
    throw ApiError.badRequest('param is missing or the value is empty: category_slug');
  }
  return raw;
}

async function findUndeletedCategoryBySlug(slug: string): Promise<{ id: number; slug: string | null; name: string | null } | null> {
  return prisma.categories.findFirst({ where: { slug, deleted: false }, select: { id: true, slug: true, name: true } });
}

/**
 * Port of `AppConfig[:archive]` - see categories.ts's identical helper.
 */
async function isArchiveMode(): Promise<boolean> {
  return (await appConfig.get('archive')) === true;
}

/** See categories.ts's identical helper. */
async function loadUserRoleIds(userId: number): Promise<number[]> {
  const rows = await prisma.user_roles.findMany({ where: { user_id: userId }, select: { role_id: true } });
  return rows.map((row) => row.role_id).filter((id): id is number => id !== null);
}

async function directoryRoleIds(directoryId: number): Promise<number[]> {
  const rows = await prisma.directory_roles.findMany({ where: { directory_id: directoryId }, orderBy: { id: 'asc' }, select: { role_id: true } });
  return rows.map((row) => row.role_id).filter((id): id is number => id !== null);
}

/** Port of the has_many-through `role_ids=` setter Directory gets from `has_many :roles, through: :directory_roles`. */
async function setDirectoryRoleIds(directoryId: number, roleIds: number[]): Promise<void> {
  const now = new Date();
  const ids = [...new Set(roleIds.map((id) => Number(id)).filter((id) => Number.isInteger(id)))];
  await prisma.$transaction([
    prisma.directory_roles.deleteMany({ where: { directory_id: directoryId } }),
    ...(ids.length > 0
      ? [
          prisma.directory_roles.createMany({
            data: ids.map((roleId) => ({ directory_id: directoryId, role_id: roleId, created_at: now, updated_at: now })),
          }),
        ]
      : []),
  ]);
}

// GET /api/v1/directories?category_slug=...
router.get('/', async (req, res, next) => {
  try {
    const categorySlug = requireCategorySlug(req.query.category_slug);
    const category = await findUndeletedCategoryBySlug(categorySlug);
    if (!category) {
      throw ApiError.notFound();
    }

    const directories = await prisma.directories.findMany({ where: { category_id: category.id, deleted: false }, orderBy: { name: 'asc' } });

    const directoryIds = directories.map((directory) => directory.id);
    const roleRows =
      directoryIds.length > 0 ? await prisma.directory_roles.findMany({ where: { directory_id: { in: directoryIds } } }) : [];
    const roleIdsByDirectory = new Map<number, number[]>();
    for (const row of roleRows) {
      if (row.directory_id === null || row.role_id === null) continue;
      const ids = roleIdsByDirectory.get(row.directory_id) ?? [];
      ids.push(row.role_id);
      roleIdsByDirectory.set(row.directory_id, ids);
    }

    const userRoleIds = await loadUserRoleIds(req.currentUser!.id);
    const isElevated = req.ability?.can('show', 'Directory') ?? false;
    const visible = directories.filter(
      (directory) => isElevated || canViewDirectory(userRoleIds, roleIdsByDirectory.get(directory.id) ?? []),
    );

    const { page, perPage } = parsePageParams(req.query as Record<string, unknown>);
    const paged = visible.slice(page * perPage, page * perPage + perPage);

    res.status(200).json(buildListResponse(paged.map((directory) => directorySummaryJson(directory)), visible.length));
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/directories
router.post('/', async (req, res, next) => {
  try {
    // Ability check runs BEFORE reading category_slug/name - matches
    // DirectoriesController#create's `return render_forbidden unless
    // ability.can?(:create, Directory)` preceding `params.require(:category_slug)`.
    if (!req.ability?.can('create', 'Directory')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const body = (req.body ?? {}) as { category_slug?: unknown; name?: unknown; description?: unknown; role_ids?: unknown };
    const categorySlug = requireCategorySlug(body.category_slug);
    const category = await findUndeletedCategoryBySlug(categorySlug);
    if (!category) {
      throw ApiError.notFound();
    }

    const errors: string[] = [];
    if (isBlank(body.name)) {
      errors.push("Name can't be blank");
    } else {
      const duplicate = await prisma.directories.findFirst({ where: { name: body.name as string, deleted: false } });
      if (duplicate) {
        errors.push('Name has already been taken');
      }
    }
    if (errors.length > 0) {
      res.status(422).json({ error: 'unprocessable', detail: errors.join(', ') });
      return;
    }

    const now = new Date();
    const slug = await generateUniqueSlug(
      body.name as string,
      async (candidate) => (await prisma.directories.findFirst({ where: { slug: candidate } })) !== null,
    );
    const created = await prisma.directories.create({
      data: {
        name: body.name as string,
        description: (body.description as string | null | undefined) ?? null,
        category_id: category.id,
        slug,
        deleted: false,
        created_at: now,
        updated_at: now,
      },
    });

    if (Array.isArray(body.role_ids)) {
      await setDirectoryRoleIds(created.id, body.role_ids as number[]);
    }
    const roleIds = await directoryRoleIds(created.id);

    res.status(201).json(directoryJson(created, roleIds, category));
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/directories/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const existing = await prisma.directories.findFirst({ where: { slug: req.params.slug, deleted: false } });
    if (!existing) {
      throw ApiError.notFound();
    }

    const roleIds = await directoryRoleIds(existing.id);
    const userRoleIds = await loadUserRoleIds(req.currentUser!.id);
    const canSee = (req.ability?.can('show', 'Directory') ?? false) || canViewDirectory(userRoleIds, roleIds);
    if (!canSee) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const category = existing.category_id === null ? null : await prisma.categories.findFirst({ where: { id: existing.category_id } });
    res.status(200).json(directoryJson(existing, roleIds, { slug: category?.slug ?? null, name: category?.name ?? null }));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/directories/:slug
router.patch('/:slug', async (req, res, next) => {
  try {
    // Lookup runs BEFORE the ability check, per DirectoriesController's
    // `before_action :set_directory, only: %i[show update destroy]`.
    const existing = await prisma.directories.findFirst({ where: { slug: req.params.slug, deleted: false } });
    if (!existing) {
      throw ApiError.notFound();
    }

    if (!req.ability?.can('update', 'Directory')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    // category_slug is deliberately never read here - directory_params in
    // Rails never permits it on update, so a directory's category is fixed
    // at creation (see DirectoriesController#update's comment).
    const body = (req.body ?? {}) as { name?: unknown; description?: unknown; role_ids?: unknown };
    const nextName = 'name' in body ? body.name : existing.name;

    const errors: string[] = [];
    if (isBlank(nextName)) {
      errors.push("Name can't be blank");
    } else if (nextName !== existing.name) {
      const duplicate = await prisma.directories.findFirst({
        where: { name: nextName as string, deleted: false, NOT: { id: existing.id } },
      });
      if (duplicate) {
        errors.push('Name has already been taken');
      }
    }
    if (errors.length > 0) {
      res.status(422).json({ error: 'unprocessable', detail: errors.join(', ') });
      return;
    }

    const updated = await prisma.directories.update({
      where: { id: existing.id },
      data: {
        name: nextName as string,
        description: 'description' in body ? ((body.description as string | null | undefined) ?? null) : existing.description,
        updated_at: new Date(),
      },
    });

    if (Array.isArray(body.role_ids)) {
      await setDirectoryRoleIds(existing.id, body.role_ids as number[]);
    }
    const roleIds = await directoryRoleIds(existing.id);
    const category = existing.category_id === null ? null : await prisma.categories.findFirst({ where: { id: existing.category_id } });

    res.status(200).json(directoryJson(updated, roleIds, { slug: category?.slug ?? null, name: category?.name ?? null }));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/directories/:slug
router.delete('/:slug', async (req, res, next) => {
  try {
    const existing = await prisma.directories.findFirst({ where: { slug: req.params.slug, deleted: false } });
    if (!existing) {
      throw ApiError.notFound();
    }

    if (!req.ability?.can('destroy', 'Directory')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    if (await isArchiveMode()) {
      // Directory#delete's archive-mode branch re-marks the directory
      // visible (a no-op in its already-`deleted: false` state) and cascades
      // a delete call back UP to its category (which, itself in archive
      // mode, is likewise a no-op re-save - see Category#delete). Only
      // reachable when AppConfig[:archive] is set, which no ported or
      // net-new test exercises; kept for parity.
      await prisma.$transaction([
        prisma.directories.update({ where: { id: existing.id }, data: { updated_at: new Date() } }),
        ...(existing.category_id !== null
          ? [prisma.categories.update({ where: { id: existing.category_id }, data: { updated_at: new Date() } })]
          : []),
      ]);
    } else {
      // Directory#delete's non-archive branch also cascades further down
      // into its attached_files (`self.attached_files.all.each {|f|
      // f.delete}`) - out of scope here, owned by the attached_files
      // resource (see categories.ts's DELETE handler for the identical note
      // on the Category -> Directory leg).
      await prisma.directories.update({ where: { id: existing.id }, data: { deleted: true, updated_at: new Date() } });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
