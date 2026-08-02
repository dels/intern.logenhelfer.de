import type { academic_titles as AcademicTitleRow } from '../generated/prisma/client.js';
import { Router } from 'express';

import { authenticateApiUser } from '../auth/middleware.js';
import { ApiError } from '../lib/errors.js';
import { prisma } from '../db.js';

/**
 * Port of rails-app/app/controllers/api/v1/academic_titles_controller.rb.
 *
 * Every action (index/create/update/destroy) is gated on
 * `ability.can?(:manage, AcademicTitle)`, which only `application_admin_abilities`
 * grants (rails-app/app/models/ability.rb L140-142) - reachable solely via the
 * Admin role's `admin_abilities` chain. Everyone else (including the
 * `can [:show], AcademicTitle` grant every authenticated user gets - L11)
 * fails this `:manage` gate, so this whole resource is effectively admin-only
 * even though a narrower `:show` ability technically exists on the model.
 */

const router = Router();

router.use(authenticateApiUser);

function academicTitleJson(title: AcademicTitleRow): { id: number; short: string | null } {
  return { id: title.id, short: title.short };
}

/** Ruby's `String#blank?` for the field type this controller deals with. */
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

// German attribute-name/message text below matches config/application.rb's
// `config.i18n.default_locale = :de` plus config/locales/de.yml's
// `activerecord.attributes.academic_title.short: Kurzform`,
// `activerecord.errors.messages.blank: muss ausgefüllt werden`, and
// `.../taken: ist bereits vergeben` - i.e. exactly what
// `title.errors.full_messages.join(', ')` would render for this model in the
// real app (neither of the 10 ported spec examples assert this exact text,
// but nothing else in the repo established a different convention for this
// resource, so this is the most faithful choice available).
const BLANK_SHORT_MESSAGE = 'Kurzform muss ausgefüllt werden';
const TAKEN_SHORT_MESSAGE = 'Kurzform ist bereits vergeben';

// GET /api/v1/academic_titles
router.get('/', async (req, res, next) => {
  try {
    if (!req.ability?.can('manage', 'AcademicTitle')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    // Port of AcademicTitle.undeleted.map(...) - undeleted scope
    // (where(deleted: false)) plus the model's default_scope
    // (order('short ASC')), which still applies on top of the named scope.
    const titles = await prisma.academic_titles.findMany({
      where: { deleted: false },
      orderBy: { short: 'asc' },
    });
    res.status(200).json({ rows: titles.map(academicTitleJson) });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/academic_titles
router.post('/', async (req, res, next) => {
  try {
    if (!req.ability?.can('manage', 'AcademicTitle')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const body = (req.body ?? {}) as { short?: unknown };
    if (isBlank(body.short)) {
      throw ApiError.unprocessable(BLANK_SHORT_MESSAGE);
    }
    const short = body.short as string;

    // Port of `validates_uniqueness_of :short` (unscoped - no `WHERE deleted
    // = false`, matching the DB's own unique index, which a soft-deleted
    // title's short still occupies). This is an app-level pre-check exactly
    // like Rails' own validation (both have the same benign TOCTOU race
    // under concurrent writes - not a gap introduced by this port).
    const conflict = await prisma.academic_titles.findFirst({ where: { short } });
    if (conflict) {
      throw ApiError.unprocessable(TAKEN_SHORT_MESSAGE);
    }

    const now = new Date();
    const created = await prisma.academic_titles.create({
      data: { short, deleted: false, created_at: now, updated_at: now },
    });
    res.status(201).json(academicTitleJson(created));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/academic_titles/:id
router.patch('/:id', async (req, res, next) => {
  try {
    if (!req.ability?.can('manage', 'AcademicTitle')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    // Port of `AcademicTitle.find(params[:id])` - unlike `index`'s
    // `.undeleted` scope, update has no deleted filter, so a soft-deleted
    // title is still a valid update target (matches the Rails controller
    // exactly - not obviously intentional, but not this port's place to
    // "fix").
    const id = parseIdParam(req.params.id);
    const existing = id === undefined ? null : await prisma.academic_titles.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound();
    }

    const body = (req.body ?? {}) as { short?: unknown };
    const nextShort = 'short' in body ? body.short : existing.short;
    if (isBlank(nextShort)) {
      throw ApiError.unprocessable(BLANK_SHORT_MESSAGE);
    }

    if (nextShort !== existing.short) {
      const conflict = await prisma.academic_titles.findFirst({
        where: { short: nextShort as string, id: { not: existing.id } },
      });
      if (conflict) {
        throw ApiError.unprocessable(TAKEN_SHORT_MESSAGE);
      }
    }

    const updated = await prisma.academic_titles.update({
      where: { id: existing.id },
      data: { short: nextShort as string },
    });
    res.status(200).json(academicTitleJson(updated));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/academic_titles/:id
router.delete('/:id', async (req, res, next) => {
  try {
    if (!req.ability?.can('manage', 'AcademicTitle')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    // Same "no deleted filter" lookup as update above.
    const id = parseIdParam(req.params.id);
    const existing = id === undefined ? null : await prisma.academic_titles.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound();
    }

    // Port of `title.users.count.zero?` - refuse the soft-delete while any
    // user still references this title.
    const userCount = await prisma.users.count({ where: { academic_title_id: existing.id } });
    if (userCount > 0) {
      throw ApiError.unprocessable('Titel wird noch von Mitgliedern verwendet');
    }

    await prisma.academic_titles.update({ where: { id: existing.id }, data: { deleted: true } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
