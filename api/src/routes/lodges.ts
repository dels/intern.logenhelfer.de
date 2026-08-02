import type { lodges as LodgeRow, Prisma } from '../generated/prisma/client.js';
import { Router } from 'express';

import { authenticateApiUser } from '../auth/middleware.js';
import { ApiError } from '../lib/errors.js';
import { buildListResponse, parsePageParams } from '../lib/pagination.js';
import { generateUniqueSlug } from '../lib/slug.js';
import { prisma } from '../db.js';

/** Port of rails-app/app/controllers/api/v1/lodges_controller.rb. */

const router = Router();

router.use(authenticateApiUser);

function lodgeSummaryJson(
  lodge: LodgeRow,
  districtName: string | null,
): { slug: string | null; name: string | null; description: string | null; district_name: string | null } {
  return { slug: lodge.slug, name: lodge.name, description: lodge.description, district_name: districtName };
}

function lodgeJson(
  lodge: LodgeRow,
  districtName: string | null,
): { slug: string | null; name: string | null; description: string | null; district_name: string | null; district_id: number | null } {
  return { ...lodgeSummaryJson(lodge, districtName), district_id: lodge.district_id };
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

/** See districts.ts's identical helper for the full rationale. */
function humanizeField(field: string): string {
  const stripped = field.endsWith('_id') ? field.slice(0, -3) : field;
  return stripped.charAt(0).toUpperCase() + stripped.slice(1).replace(/_/g, ' ');
}

function requirePresence(fields: Record<string, unknown>): void {
  const messages = Object.entries(fields)
    .filter(([, value]) => isBlank(value))
    .map(([key]) => `${humanizeField(key)} can't be blank`);
  if (messages.length > 0) {
    throw ApiError.unprocessable(messages.join(', '));
  }
}

/**
 * Port of Lodge's `friendly_id :name, use: :slugged` slug generation, via the
 * shared FriendlyId-equivalent helper (see lib/slug.ts). Uniqueness is
 * checked unscoped by `deleted` - FriendlyId's slug index has no notion of
 * soft deletion - matching that helper's documented contract.
 */
async function uniqueLodgeSlug(name: string): Promise<string> {
  return generateUniqueSlug(name, async (candidate) => (await prisma.lodges.findFirst({ where: { slug: candidate } })) !== null);
}

async function findDistrictName(districtId: number | null): Promise<string | null> {
  if (districtId === null) {
    return null;
  }
  const district = await prisma.districts.findFirst({ where: { id: districtId } });
  return district?.name ?? null;
}

const SORTABLE_COLUMNS = ['name', 'description', 'district_name'] as const;
type SortableColumn = (typeof SORTABLE_COLUMNS)[number];
const DEFAULT_SORT_FIELD: SortableColumn = 'name';

function isSortableColumn(value: unknown): value is SortableColumn {
  return typeof value === 'string' && (SORTABLE_COLUMNS as readonly string[]).includes(value);
}

/**
 * Same allowlisted-column/nulls-last/desc-flip pattern used across this
 * codebase's other in-memory list sorts. `district_name` isn't a real
 * `lodges` column (no Prisma relation is declared to `districts`, just a
 * plain `district_id` looked up separately below) - a DB-level orderBy
 * can't reach it, so this sorts the already-joined summary rows in JS
 * instead of pushing the whole index route into Prisma's `skip`/`take`.
 */
function lodgeSortComparator(
  sortParam: unknown,
): (a: { name: string | null; description: string | null; district_name: string | null }, b: { name: string | null; description: string | null; district_name: string | null }) => number {
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

// GET /api/v1/lodges
router.get('/', async (req, res, next) => {
  try {
    if (!req.ability?.can('index', 'Lodge')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const where: Prisma.lodgesWhereInput = { deleted: false };
    const lodges = await prisma.lodges.findMany({ where });

    const districtIds = [...new Set(lodges.map((lodge) => lodge.district_id).filter((id): id is number => id !== null))];
    const districts = districtIds.length > 0 ? await prisma.districts.findMany({ where: { id: { in: districtIds } } }) : [];
    const districtNameById = new Map(districts.map((district) => [district.id, district.name]));

    const rows = lodges
      .map((lodge) => lodgeSummaryJson(lodge, districtNameById.get(lodge.district_id ?? -1) ?? null))
      .sort(lodgeSortComparator(req.query.sort));

    const { page, perPage } = parsePageParams(req.query as Record<string, unknown>);
    const paged = rows.slice(page * perPage, page * perPage + perPage);

    res.status(200).json(buildListResponse(paged, rows.length));
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/lodges
router.post('/', async (req, res, next) => {
  try {
    if (!req.ability?.can('create', 'Lodge')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const body = (req.body ?? {}) as { name?: unknown; description?: unknown; district_id?: unknown };
    requirePresence({ name: body.name, district_id: body.district_id });

    const districtId = Number(body.district_id);
    const district = Number.isNaN(districtId) ? null : await prisma.districts.findFirst({ where: { id: districtId, deleted: false } });
    if (!district) {
      // Rails has no DB foreign key here and no `belongs_to_required_by_default`
      // (see rails-app/config/application.rb - load_defaults is commented out),
      // so `Lodge.new(district_id: <nonexistent>).save` would actually succeed
      // in Rails and only blow up later rendering `lodge.district.name` - a
      // latent bug there, not a behavior worth reproducing. This 422 is a
      // deliberate improvement over the Rails source; see this task's report.
      throw ApiError.unprocessable('District must exist');
    }

    const slug = await uniqueLodgeSlug(body.name as string);
    const now = new Date();
    const created = await prisma.lodges.create({
      data: {
        name: body.name as string,
        slug,
        description: (body.description as string | null | undefined) ?? null,
        district_id: districtId,
        deleted: false,
        created_at: now,
        updated_at: now,
      },
    });

    res.status(201).json(lodgeJson(created, district.name));
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/lodges/:slug
router.get('/:slug', async (req, res, next) => {
  try {
    const existing = await prisma.lodges.findFirst({ where: { slug: req.params.slug, deleted: false } });
    if (!existing) {
      throw ApiError.notFound();
    }

    if (!req.ability?.can('show', 'Lodge')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const districtName = await findDistrictName(existing.district_id);
    res.status(200).json(lodgeJson(existing, districtName));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/lodges/:slug
router.patch('/:slug', async (req, res, next) => {
  try {
    // Lookup runs BEFORE the ability check, per LodgesController's
    // `before_action :set_lodge, only: %i[show update destroy]`.
    const existing = await prisma.lodges.findFirst({ where: { slug: req.params.slug, deleted: false } });
    if (!existing) {
      throw ApiError.notFound();
    }

    if (!req.ability?.can('update', 'Lodge')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const body = (req.body ?? {}) as { name?: unknown; description?: unknown; district_id?: unknown };
    const nextName = 'name' in body ? body.name : existing.name;
    const nextDistrictId = 'district_id' in body ? body.district_id : existing.district_id;
    requirePresence({ name: nextName, district_id: nextDistrictId });

    let district: { name: string | null } | null;
    let districtIdToPersist = existing.district_id;
    if ('district_id' in body) {
      const districtId = Number(nextDistrictId);
      district = Number.isNaN(districtId) ? null : await prisma.districts.findFirst({ where: { id: districtId, deleted: false } });
      if (!district) {
        throw ApiError.unprocessable('District must exist');
      }
      districtIdToPersist = districtId;
    } else {
      district = { name: await findDistrictName(existing.district_id) };
    }

    const updated = await prisma.lodges.update({
      where: { id: existing.id },
      data: {
        name: nextName as string,
        description: 'description' in body ? ((body.description as string | null | undefined) ?? null) : existing.description,
        district_id: districtIdToPersist,
      },
    });

    res.status(200).json(lodgeJson(updated, district.name));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/lodges/:slug
router.delete('/:slug', async (req, res, next) => {
  try {
    const existing = await prisma.lodges.findFirst({ where: { slug: req.params.slug, deleted: false } });
    if (!existing) {
      throw ApiError.notFound();
    }

    if (!req.ability?.can('destroy', 'Lodge')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    // Cascading soft-delete to this lodge's own officers, via Lodge's
    // after_save callback in Rails - replicated as one transaction here.
    await prisma.$transaction(async (tx) => {
      await tx.lodges.update({ where: { id: existing.id }, data: { deleted: true } });
      await tx.officers.updateMany({ where: { lodge_id: existing.id, deleted: false }, data: { deleted: true } });
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
