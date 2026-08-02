import type { districts as DistrictRow } from '../generated/prisma/client.js';
import { Router } from 'express';

import { authenticateApiUser } from '../auth/middleware.js';
import { ApiError } from '../lib/errors.js';
import { prisma } from '../db.js';

/**
 * Port of rails-app/app/controllers/api/v1/districts_controller.rb.
 *
 * District has no `show` action/route (see openapi.yaml: only GET/POST on
 * the collection and PATCH/DELETE on /districts/{id}) - index returns the
 * full small reference list instead, matching District#index's
 * `District.undeleted.map`.
 */

const router = Router();

router.use(authenticateApiUser);

function districtJson(district: DistrictRow): { id: number; name: string | null } {
  return { id: district.id, name: district.name };
}

/** Ruby's `String#blank?` for the field types this controller deals with. */
function isBlank(value: unknown): boolean {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  return false;
}

/**
 * Port of ActiveRecord::Errors#full_messages' attribute-name humanization
 * (strips a trailing `_id`, capitalizes the first letter, underscores
 * become spaces) - just enough of it for the field names these three
 * controllers validate.
 */
function humanizeField(field: string): string {
  const stripped = field.endsWith('_id') ? field.slice(0, -3) : field;
  return stripped.charAt(0).toUpperCase() + stripped.slice(1).replace(/_/g, ' ');
}

/**
 * Port of the `validates_presence_of` + `rescue_from ActiveRecord::RecordInvalid`
 * combination every write action here goes through: any blank field named in
 * `fields` becomes a "<Field> can't be blank" message, joined the same way
 * `errors.full_messages.join(', ')` does, then raised as a 422.
 */
function requirePresence(fields: Record<string, unknown>): void {
  const messages = Object.entries(fields)
    .filter(([, value]) => isBlank(value))
    .map(([key]) => `${humanizeField(key)} can't be blank`);
  if (messages.length > 0) {
    throw ApiError.unprocessable(messages.join(', '));
  }
}

/**
 * Port of Rails' loose integer typecasting of a `find(params[:id])` route
 * param (a non-numeric id like "abc" typecasts to 0 rather than raising, so
 * it simply misses and 404s) - `Number.parseInt` mirrors the "parse a
 * leading run of digits, else NaN" behavior closely enough for that same
 * "never found" outcome.
 */
function parseIdParam(raw: string): number | undefined {
  const id = Number.parseInt(raw, 10);
  return Number.isNaN(id) ? undefined : id;
}

// GET /api/v1/districts
router.get('/', async (req, res, next) => {
  try {
    // Gated on Lodge-create ability, not District read/manage - see
    // DistrictsController#index ("Lodge-create gate" in districts_spec.rb).
    if (!req.ability?.can('create', 'Lodge')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const districts = await prisma.districts.findMany({
      where: { deleted: false },
      orderBy: { name: 'asc' },
    });
    res.status(200).json({ rows: districts.map(districtJson) });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/districts
router.post('/', async (req, res, next) => {
  try {
    if (!req.ability?.can('manage', 'District')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const body = (req.body ?? {}) as { name?: unknown };
    requirePresence({ name: body.name });

    const now = new Date();
    const created = await prisma.districts.create({
      data: { name: body.name as string, deleted: false, created_at: now, updated_at: now },
    });
    res.status(201).json(districtJson(created));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/districts/:id
router.patch('/:id', async (req, res, next) => {
  try {
    // Ability check runs BEFORE the lookup here (unlike Lodge/Officer's
    // before_action-driven show/update/destroy) - DistrictsController#update
    // checks `ability.can?(:manage, District)` first, then `District.find`,
    // so an unpermitted caller gets 403 even for a nonexistent id.
    if (!req.ability?.can('manage', 'District')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const id = parseIdParam(req.params.id);
    const existing = id === undefined ? null : await prisma.districts.findFirst({ where: { id, deleted: false } });
    if (!existing) {
      throw ApiError.notFound();
    }

    const body = (req.body ?? {}) as { name?: unknown };
    const nextName = 'name' in body ? body.name : existing.name;
    requirePresence({ name: nextName });

    const updated = await prisma.districts.update({ where: { id: existing.id }, data: { name: nextName as string } });
    res.status(200).json(districtJson(updated));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/districts/:id
router.delete('/:id', async (req, res, next) => {
  try {
    // Same "ability first, lookup second" ordering as update above.
    if (!req.ability?.can('manage', 'District')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const id = parseIdParam(req.params.id);
    const existing = id === undefined ? null : await prisma.districts.findFirst({ where: { id, deleted: false } });
    if (!existing) {
      throw ApiError.notFound();
    }

    // Cascading soft-delete: District#after_save marks every one of its
    // (still-undeleted) Lodges deleted via a real `lodge.save!`, which in
    // turn runs Lodge's OWN after_save and marks every one of ITS
    // (still-undeleted) Officers deleted too - a two-hop cascade, not just
    // one. Replicated here in a single transaction across all three tables.
    await prisma.$transaction(async (tx) => {
      const lodges = await tx.lodges.findMany({ where: { district_id: existing.id, deleted: false } });
      await tx.districts.update({ where: { id: existing.id }, data: { deleted: true } });

      if (lodges.length > 0) {
        const lodgeIds = lodges.map((lodge) => lodge.id);
        await tx.lodges.updateMany({ where: { id: { in: lodgeIds } }, data: { deleted: true } });
        await tx.officers.updateMany({ where: { lodge_id: { in: lodgeIds }, deleted: false }, data: { deleted: true } });
      }
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
