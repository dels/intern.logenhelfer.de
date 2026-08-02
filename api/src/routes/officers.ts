import type { officers as OfficerRow, Prisma } from '../generated/prisma/client.js';
import { Router } from 'express';

import { authenticateApiUser } from '../auth/middleware.js';
import { ApiError } from '../lib/errors.js';
import { buildListResponse, parsePageParams } from '../lib/pagination.js';
import { generateUniqueUuid } from '../lib/uuid.js';
import { prisma } from '../db.js';

/** Port of rails-app/app/controllers/api/v1/officers_controller.rb. */

const router = Router();

router.use(authenticateApiUser);

interface OfficerJoins {
  roleDisplayName: string | null;
  lodgeSlug: string | null;
  lodgeName: string | null;
}

function officerSummaryJson(
  officer: OfficerRow,
  roleDisplayName: string | null,
): { uuid: string | null; firstname: string | null; lastname: string | null; role_display_name: string | null } {
  return { uuid: officer.uuid, firstname: officer.firstname, lastname: officer.lastname, role_display_name: roleDisplayName };
}

function officerJson(officer: OfficerRow, joins: OfficerJoins): Record<string, unknown> {
  return {
    ...officerSummaryJson(officer, joins.roleDisplayName),
    role_id: officer.role_id,
    role_email: officer.role_email,
    lodge_slug: joins.lodgeSlug,
    lodge_name: joins.lodgeName,
  };
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
 * Port of `params.require(:lodge_slug)` - Rails' `require` raises
 * ActionController::ParameterMissing (-> 400 bad_request) both when the key
 * is absent AND when its value is blank, not just when it's literally
 * missing from the payload.
 */
function requireLodgeSlug(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw ApiError.badRequest('param is missing or the value is empty: lodge_slug');
  }
  return value;
}

async function findUndeletedLodgeBySlug(slug: string): Promise<{ id: number; slug: string | null; name: string | null }> {
  const lodge = await prisma.lodges.findFirst({ where: { slug, deleted: false } });
  if (!lodge) {
    throw ApiError.notFound();
  }
  return lodge;
}

async function loadRoleDisplayName(roleId: number | null): Promise<string | null> {
  if (roleId === null) {
    return null;
  }
  const role = await prisma.roles.findFirst({ where: { id: roleId } });
  return role?.display_name ?? null;
}

/**
 * Generates a UUID for a new officer, via the shared UuidHelper-equivalent
 * helper (see lib/uuid.ts) - port of Officer's `UuidHelper#generate_uuid`.
 */
async function generateUniqueOfficerUuid(): Promise<string> {
  return generateUniqueUuid(async (candidate) => (await prisma.officers.findFirst({ where: { uuid: candidate } })) !== null);
}

// GET /api/v1/officers?lodge_slug=...
router.get('/', async (req, res, next) => {
  try {
    if (!req.ability?.can('index', 'Officer')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const lodgeSlug = requireLodgeSlug(req.query.lodge_slug);
    const lodge = await findUndeletedLodgeBySlug(lodgeSlug);

    const { page, perPage } = parsePageParams(req.query as Record<string, unknown>);
    const where: Prisma.officersWhereInput = { lodge_id: lodge.id, deleted: false };

    const [rowCount, officers] = await Promise.all([
      prisma.officers.count({ where }),
      prisma.officers.findMany({ where, orderBy: { lastname: 'asc' }, skip: page * perPage, take: perPage }),
    ]);

    const roleIds = [...new Set(officers.map((officer) => officer.role_id).filter((id): id is number => id !== null))];
    const roles = roleIds.length > 0 ? await prisma.roles.findMany({ where: { id: { in: roleIds } } }) : [];
    const roleNameById = new Map(roles.map((role) => [role.id, role.display_name]));

    const rows = officers.map((officer) => officerSummaryJson(officer, roleNameById.get(officer.role_id ?? -1) ?? null));
    res.status(200).json(buildListResponse(rows, rowCount));
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/officers
router.post('/', async (req, res, next) => {
  try {
    if (!req.ability?.can('create', 'Officer')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const body = (req.body ?? {}) as {
      lodge_slug?: unknown;
      firstname?: unknown;
      lastname?: unknown;
      role_id?: unknown;
      role_email?: unknown;
    };

    const lodgeSlug = requireLodgeSlug(body.lodge_slug);
    const lodge = await findUndeletedLodgeBySlug(lodgeSlug);

    requirePresence({ firstname: body.firstname, lastname: body.lastname, role_id: body.role_id, role_email: body.role_email });

    const roleId = Number(body.role_id);
    const role = Number.isNaN(roleId) ? null : await prisma.roles.findFirst({ where: { id: roleId } });
    if (!role) {
      // Same "Rails would let this through then crash rendering role.display_name"
      // situation as Lodge#district_id - see lodges.ts's POST handler comment.
      throw ApiError.unprocessable('Role must exist');
    }

    const uuid = await generateUniqueOfficerUuid();
    const now = new Date();
    const created = await prisma.officers.create({
      data: {
        uuid,
        lodge_id: lodge.id,
        firstname: body.firstname as string,
        lastname: body.lastname as string,
        role_id: roleId,
        role_email: body.role_email as string,
        deleted: false,
        created_at: now,
        updated_at: now,
      },
    });

    res.status(201).json(officerJson(created, { roleDisplayName: role.display_name, lodgeSlug: lodge.slug, lodgeName: lodge.name }));
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/officers/:uuid
router.get('/:uuid', async (req, res, next) => {
  try {
    const existing = await prisma.officers.findFirst({ where: { uuid: req.params.uuid, deleted: false } });
    if (!existing) {
      throw ApiError.notFound();
    }

    if (!req.ability?.can('show', 'Officer')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const [roleDisplayName, lodge] = await Promise.all([
      loadRoleDisplayName(existing.role_id),
      existing.lodge_id === null ? Promise.resolve(null) : prisma.lodges.findFirst({ where: { id: existing.lodge_id } }),
    ]);

    res.status(200).json(officerJson(existing, { roleDisplayName, lodgeSlug: lodge?.slug ?? null, lodgeName: lodge?.name ?? null }));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/officers/:uuid
router.patch('/:uuid', async (req, res, next) => {
  try {
    // Lookup runs BEFORE the ability check, per OfficersController's
    // `before_action :set_officer, only: %i[show update destroy]`.
    const existing = await prisma.officers.findFirst({ where: { uuid: req.params.uuid, deleted: false } });
    if (!existing) {
      throw ApiError.notFound();
    }

    if (!req.ability?.can('update', 'Officer')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    // officer_params never permits lodge_slug - an officer's lodge is fixed
    // at creation, so any lodge_slug in the body is silently ignored here,
    // exactly like Rails.
    const body = (req.body ?? {}) as {
      firstname?: unknown;
      lastname?: unknown;
      role_id?: unknown;
      role_email?: unknown;
    };

    const nextFirstname = 'firstname' in body ? body.firstname : existing.firstname;
    const nextLastname = 'lastname' in body ? body.lastname : existing.lastname;
    const nextRoleId = 'role_id' in body ? body.role_id : existing.role_id;
    const nextRoleEmail = 'role_email' in body ? body.role_email : existing.role_email;
    requirePresence({ firstname: nextFirstname, lastname: nextLastname, role_id: nextRoleId, role_email: nextRoleEmail });

    let role: { display_name: string | null } | null;
    let roleIdToPersist = existing.role_id;
    if ('role_id' in body) {
      const roleId = Number(nextRoleId);
      role = Number.isNaN(roleId) ? null : await prisma.roles.findFirst({ where: { id: roleId } });
      if (!role) {
        throw ApiError.unprocessable('Role must exist');
      }
      roleIdToPersist = roleId;
    } else {
      role = { display_name: await loadRoleDisplayName(existing.role_id) };
    }

    const updated = await prisma.officers.update({
      where: { id: existing.id },
      data: {
        firstname: nextFirstname as string,
        lastname: nextLastname as string,
        role_id: roleIdToPersist,
        role_email: nextRoleEmail as string,
      },
    });

    const lodge = existing.lodge_id === null ? null : await prisma.lodges.findFirst({ where: { id: existing.lodge_id } });
    res.status(200).json(
      officerJson(updated, { roleDisplayName: role.display_name, lodgeSlug: lodge?.slug ?? null, lodgeName: lodge?.name ?? null }),
    );
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/officers/:uuid
router.delete('/:uuid', async (req, res, next) => {
  try {
    const existing = await prisma.officers.findFirst({ where: { uuid: req.params.uuid, deleted: false } });
    if (!existing) {
      throw ApiError.notFound();
    }

    if (!req.ability?.can('destroy', 'Officer')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    await prisma.officers.update({ where: { id: existing.id }, data: { deleted: true } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
