import type { categories as CategoryRow } from '../generated/prisma/client.js';
import { Router } from 'express';

import { authenticateApiUser } from '../auth/middleware.js';
import { canViewCategory } from '../authz/ability.js';
import { appConfig } from '../lib/appConfig.js';
import { ApiError } from '../lib/errors.js';
import { buildListResponse, parsePageParams } from '../lib/pagination.js';
import { generateUniqueSlug } from '../lib/slug.js';
import { prisma } from '../db.js';

/**
 * Port of rails-app/app/controllers/api/v1/categories_controller.rb.
 *
 * Category visibility (index filtering + the per-instance `show` gate) is
 * ability.rb's `can [:index, :show], Category do |c| [] != (c.roles &
 * @user.roles) end` block - a Ruby block CanCan evaluates per-instance, which
 * ability.ts deliberately does NOT register as a CASL rule at all (see its
 * comment at `canViewCategory`) since CASL conditions can't express a
 * role-set-intersection check. Two consequences follow, both replicated
 * here rather than reached for `req.ability.can(...)`:
 *
 *  - The per-instance visibility check is `req.ability.can('show',
 *    'Category') || canViewCategory(userRoleIds, categoryRoleIds)` - true
 *    unconditionally for anyone holding an unconditional `can('manage',
 *    'Category')` grant (FileAdmin/Secretary/WorshipfulMaster/NetDelegate/
 *    Admin/ApplicationAdmin - matches categories_spec.rb's "returns every
 *    category for a Secretary, regardless of role overlap"), and otherwise
 *    only for an actual role overlap (matches categories_spec.rb's "is
 *    forbidden for a member with no role overlap").
 *  - The :index action-level gate (`ability.can?(:index, Category)` in
 *    Rails) has no CASL equivalent to call at all here, since the block rule
 *    was never registered. In Rails, CanCan's class-level `can?` check on a
 *    block-conditioned rule can't evaluate the block without an instance and
 *    so optimistically returns true whenever the rule is merely *present* -
 *    which it is for every EnteredApprentice/FellowCraft/MasterMason-tier
 *    member (i.e. every real user of this system; see default_user_abilities
 *    in ability.rb). The practical effect is "any authenticated member may
 *    attempt :index", with the real enforcement happening per-row below -
 *    exactly what categories_spec.rb's "only returns categories that share a
 *    role with the plain member" example expects (200 + filtered rows, not
 *    403). This route reproduces that by not gating :index at all. The one
 *    theoretical divergence: a user holding a functional role that grants no
 *    Category access at all and no base membership tier (e.g. WorkingPlanAdmin
 *    only, never assigned EnteredApprentice/FellowCraft/MasterMason) would
 *    see 200+empty-rows here vs. Rails' 403 - not reachable in practice since
 *    every member of this system is initiated at one of the three base tiers,
 *    and not exercised by any ported or net-new test.
 */

const router = Router();

router.use(authenticateApiUser);

function categorySummaryJson(category: CategoryRow): { slug: string | null; name: string | null; description: string | null } {
  return { slug: category.slug, name: category.name, description: category.description };
}

function categoryJson(
  category: CategoryRow,
  roleIds: number[],
): { slug: string | null; name: string | null; description: string | null; role_ids: number[] } {
  return { ...categorySummaryJson(category), role_ids: roleIds };
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

const SORTABLE_COLUMNS = ['name', 'description'] as const;
type SortableColumn = (typeof SORTABLE_COLUMNS)[number];
const DEFAULT_SORT_FIELD: SortableColumn = 'name';

function isSortableColumn(value: unknown): value is SortableColumn {
  return typeof value === 'string' && (SORTABLE_COLUMNS as readonly string[]).includes(value);
}

/** Same allowlisted-column/nulls-last/desc-flip comparator pattern as members.ts's sortComparator - visibility filtering here already forces an in-memory array (see the index route below), so sorting in JS alongside it is the natural fit rather than a second Prisma round trip. */
function categorySortComparator(sortParam: unknown): (a: CategoryRow, b: CategoryRow) => number {
  const raw = String(sortParam ?? '');
  const field = raw.replace(/^-/, '');
  const column: SortableColumn = isSortableColumn(field) ? field : DEFAULT_SORT_FIELD;
  const desc = raw.startsWith('-');

  return (a, b) => {
    const av = a[column];
    const bv = b[column];
    let cmp: number;
    if (av === null || av === undefined) cmp = bv === null || bv === undefined ? 0 : 1;
    else if (bv === null || bv === undefined) cmp = -1;
    else cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return desc ? -cmp : cmp;
  };
}

/**
 * Fetches the role ids a user currently holds. Mirrors
 * `authz/ability.ts#loadUserRoleNames`, but returning ids (as `canViewCategory`
 * needs) rather than names.
 */
async function loadUserRoleIds(userId: number): Promise<number[]> {
  const rows = await prisma.user_roles.findMany({ where: { user_id: userId }, select: { role_id: true } });
  return rows.map((row) => row.role_id).filter((id): id is number => id !== null);
}

async function categoryRoleIds(categoryId: number): Promise<number[]> {
  const rows = await prisma.category_roles.findMany({ where: { category_id: categoryId }, orderBy: { id: 'asc' }, select: { role_id: true } });
  return rows.map((row) => row.role_id).filter((id): id is number => id !== null);
}

/** Port of the has_many-through `role_ids=` setter Category gets from `has_many :roles, through: :category_roles`. */
async function setCategoryRoleIds(categoryId: number, roleIds: number[]): Promise<void> {
  const now = new Date();
  const ids = [...new Set(roleIds.map((id) => Number(id)).filter((id) => Number.isInteger(id)))];
  await prisma.$transaction([
    prisma.category_roles.deleteMany({ where: { category_id: categoryId } }),
    ...(ids.length > 0
      ? [prisma.category_roles.createMany({ data: ids.map((roleId) => ({ category_id: categoryId, role_id: roleId, created_at: now, updated_at: now })) })]
      : []),
  ]);
}

/**
 * Port of `AppConfig[:archive]` - defaults to falsy ("0") and is only ever
 * flipped on in this app's dedicated `archive`/`archive_dev` Rails
 * environments, never in normal development/test/production use.
 */
async function isArchiveMode(): Promise<boolean> {
  return (await appConfig.get('archive')) === true;
}

// GET /api/v1/categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.categories.findMany({ where: { deleted: false }, orderBy: { name: 'asc' } });

    const categoryIds = categories.map((category) => category.id);
    const roleRows =
      categoryIds.length > 0 ? await prisma.category_roles.findMany({ where: { category_id: { in: categoryIds } } }) : [];
    const roleIdsByCategory = new Map<number, number[]>();
    for (const row of roleRows) {
      if (row.category_id === null || row.role_id === null) continue;
      const ids = roleIdsByCategory.get(row.category_id) ?? [];
      ids.push(row.role_id);
      roleIdsByCategory.set(row.category_id, ids);
    }

    const userRoleIds = await loadUserRoleIds(req.currentUser!.id);
    const isElevated = req.ability?.can('show', 'Category') ?? false;
    const visible = categories
      .filter((category) => isElevated || canViewCategory(userRoleIds, roleIdsByCategory.get(category.id) ?? []))
      .sort(categorySortComparator(req.query.sort));

    const { page, perPage } = parsePageParams(req.query as Record<string, unknown>);
    const paged = visible.slice(page * perPage, page * perPage + perPage);

    res.status(200).json(buildListResponse(paged.map((category) => categorySummaryJson(category)), visible.length));
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/categories
router.post('/', async (req, res, next) => {
  try {
    if (!req.ability?.can('create', 'Category')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const body = (req.body ?? {}) as { name?: unknown; description?: unknown; role_ids?: unknown };
    const errors: string[] = [];
    if (isBlank(body.name)) {
      errors.push("Name can't be blank");
    } else {
      const duplicate = await prisma.categories.findFirst({ where: { name: body.name as string, deleted: false } });
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
      async (candidate) => (await prisma.categories.findFirst({ where: { slug: candidate } })) !== null,
    );
    const created = await prisma.categories.create({
      data: {
        name: body.name as string,
        description: (body.description as string | null | undefined) ?? null,
        slug,
        deleted: false,
        created_at: now,
        updated_at: now,
      },
    });

    if (Array.isArray(body.role_ids)) {
      await setCategoryRoleIds(created.id, body.role_ids as number[]);
    }
    const roleIds = await categoryRoleIds(created.id);

    res.status(201).json(categoryJson(created, roleIds));
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/categories/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const existing = await prisma.categories.findFirst({ where: { slug: req.params.slug, deleted: false } });
    if (!existing) {
      throw ApiError.notFound();
    }

    const roleIds = await categoryRoleIds(existing.id);
    const userRoleIds = await loadUserRoleIds(req.currentUser!.id);
    const canSee = (req.ability?.can('show', 'Category') ?? false) || canViewCategory(userRoleIds, roleIds);
    if (!canSee) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    res.status(200).json(categoryJson(existing, roleIds));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/categories/:slug
router.patch('/:slug', async (req, res, next) => {
  try {
    // Lookup runs BEFORE the ability check, per CategoriesController's
    // `before_action :set_category, only: %i[show update destroy]`.
    const existing = await prisma.categories.findFirst({ where: { slug: req.params.slug, deleted: false } });
    if (!existing) {
      throw ApiError.notFound();
    }

    if (!req.ability?.can('update', 'Category')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const body = (req.body ?? {}) as { name?: unknown; description?: unknown; role_ids?: unknown };
    const nextName = 'name' in body ? body.name : existing.name;

    const errors: string[] = [];
    if (isBlank(nextName)) {
      errors.push("Name can't be blank");
    } else if (nextName !== existing.name) {
      const duplicate = await prisma.categories.findFirst({
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

    const updated = await prisma.categories.update({
      where: { id: existing.id },
      data: {
        name: nextName as string,
        description: 'description' in body ? ((body.description as string | null | undefined) ?? null) : existing.description,
        updated_at: new Date(),
      },
    });

    if (Array.isArray(body.role_ids)) {
      await setCategoryRoleIds(existing.id, body.role_ids as number[]);
    }
    const roleIds = await categoryRoleIds(existing.id);

    res.status(200).json(categoryJson(updated, roleIds));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/categories/:slug
router.delete('/:slug', async (req, res, next) => {
  try {
    const existing = await prisma.categories.findFirst({ where: { slug: req.params.slug, deleted: false } });
    if (!existing) {
      throw ApiError.notFound();
    }

    if (!req.ability?.can('destroy', 'Category')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    if (await isArchiveMode()) {
      // Rails' archive-mode branch merely re-saves with `deleted = false`
      // (a no-op in the row's visible state) and does NOT cascade - see
      // Category#delete. Only reachable when AppConfig[:archive] is set,
      // which no ported or net-new test exercises; kept for parity.
      await prisma.categories.update({ where: { id: existing.id }, data: { updated_at: new Date() } });
    } else {
      // Cascading soft-delete to this category's own (not-yet-deleted)
      // directories, via Category#delete's `self.directories.all.each
      // {|dir| dir.delete}`. Further cascading from those directories down
      // into their attached_files is Directory#delete's job in Rails - out
      // of scope here (see this route's file header / this task's report):
      // that leg is owned by the attached_files resource, not this one.
      await prisma.$transaction([
        prisma.categories.update({ where: { id: existing.id }, data: { deleted: true, updated_at: new Date() } }),
        prisma.directories.updateMany({ where: { category_id: existing.id, deleted: false }, data: { deleted: true, updated_at: new Date() } }),
      ]);
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
