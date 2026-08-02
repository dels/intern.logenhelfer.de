import type { roles as RoleRow } from '../generated/prisma/client.js';
import { Router } from 'express';

import { authenticateApiUser } from '../auth/middleware.js';
import { ApiError } from '../lib/errors.js';
import { prisma } from '../db.js';

/**
 * Port of rails-app/app/controllers/api/v1/roles_controller.rb.
 *
 * Role names that are always excluded from both the `positions` and
 * `administrational` scopes - see Role#positions / Role#administrational_roles
 * (rails-app/app/models/role.rb L12-21), which each subtract
 * `Role.where(name: DEGREE_NAMES)` from their base where() clause.
 */
const DEGREE_ROLE_NAMES = ['EnteredApprentice', 'FellowCraft', 'MasterMason'];

const router = Router();

router.use(authenticateApiUser);

function roleJson(role: RoleRow): { id: number; name: string | null; display_name: string | null; email: string | null } {
  return { id: role.id, name: role.name, display_name: role.display_name, email: role.email };
}

/**
 * Byte-wise string comparison, matching Ruby's default String#<=> (used by
 * the Rails controller's `roles.sort_by(&:display_name)`) closer than
 * locale-aware comparison would. `null`/missing display_name (nullable in
 * the DB, though Role validates its presence) sorts as if empty.
 */
function compareDisplayName(a: RoleRow, b: RoleRow): number {
  const left = a.display_name ?? '';
  const right = b.display_name ?? '';
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

// GET /api/v1/roles(?scope=positions|administrational)
router.get('/', async (req, res, next) => {
  try {
    const ability = req.ability;
    if (
      !ability ||
      !(
        ability.can('create', 'Category') ||
        ability.can('create', 'Directory') ||
        ability.can('create', 'Officer') ||
        ability.can('manage', 'UserRole')
      )
    ) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const scope = req.query.scope;
    let roles: RoleRow[];
    if (scope === 'positions') {
      roles = await prisma.roles.findMany({
        where: { administrational_role: false, name: { notIn: DEGREE_ROLE_NAMES } },
      });
    } else if (scope === 'administrational') {
      roles = await prisma.roles.findMany({
        where: { administrational_role: true, name: { notIn: DEGREE_ROLE_NAMES } },
      });
    } else {
      roles = await prisma.roles.findMany({ orderBy: { display_name: 'asc' } });
    }

    const sorted = [...roles].sort(compareDisplayName);
    res.status(200).json({ rows: sorted.map(roleJson) });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/roles/:id
router.patch('/:id', async (req, res, next) => {
  try {
    if (!req.ability?.can('manage', 'Role')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      throw ApiError.notFound();
    }

    const existing = await prisma.roles.findUnique({ where: { id } });
    if (!existing) {
      throw ApiError.notFound();
    }

    const email = (req.body as { email?: string | null } | undefined)?.email ?? null;
    const updated = await prisma.roles.update({ where: { id }, data: { email } });

    res.status(200).json(roleJson(updated));
  } catch (err) {
    next(err);
  }
});

export default router;
