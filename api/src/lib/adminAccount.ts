import bcrypt from 'bcryptjs';

import { loadUserRoleNames } from '../authz/ability.js';
import { prisma } from '../db.js';

// Matches session.ts's/me.ts's/members.ts's own (unexported, deliberately
// duplicated per that file's boundary) BCRYPT_COST.
const BCRYPT_COST = 12;
const ADMIN_ROLE_NAME = 'Admin';

/**
 * Thrown for any misconfiguration of ADMIN_USER/ADMIN_PASSWORD - callers
 * (api/src/index.ts) let this crash the process at boot rather than catch
 * it, so a bad config is caught before the container ever reports healthy.
 */
export class AdminAccountConfigError extends Error {}

/**
 * Ensures a real `users` row exists for the environment's optional
 * ADMIN_USER/ADMIN_PASSWORD pair, holding the Admin role - see
 * docs/superpowers/specs/2026-07-30-admin-account-design.md for the full
 * rationale (a real row, not a virtual session, so every downstream
 * consumer of req.user - ability lookups, refresh tokens, impersonation,
 * audit logging - works unmodified).
 */
export async function syncAdminAccountFromEnv(): Promise<void> {
  const rawEmail = process.env.ADMIN_USER;
  const rawPassword = process.env.ADMIN_PASSWORD;

  if (!rawEmail && !rawPassword) {
    return;
  }
  if (!rawEmail || !rawPassword) {
    throw new AdminAccountConfigError('ADMIN_USER and ADMIN_PASSWORD must both be set, or both left unset');
  }

  const email = rawEmail.toLowerCase().trim();
  const encryptedPassword = await bcrypt.hash(rawPassword, BCRYPT_COST);

  const existing = await prisma.users.findUnique({ where: { email } });

  if (existing) {
    const roleNames = await loadUserRoleNames(existing.id);
    if (!roleNames.includes(ADMIN_ROLE_NAME)) {
      throw new AdminAccountConfigError(
        `ADMIN_USER (${email}) already belongs to an existing user without the Admin role - refusing to overwrite it`,
      );
    }
    await prisma.users.update({
      where: { id: existing.id },
      data: { encrypted_password: encryptedPassword, updated_at: new Date() },
    });
    return;
  }

  const adminRole = await prisma.roles.findFirst({ where: { name: ADMIN_ROLE_NAME } });
  if (!adminRole) {
    throw new AdminAccountConfigError("No 'Admin' role exists in this environment's database - refusing to boot");
  }

  const now = new Date();
  // Both writes happen in a single interactive transaction (callback form, not
  // the array form - user_roles.create needs the just-created user's id) so a
  // crash between them can't leave an orphaned, role-less users row - which
  // would otherwise permanently trip the "existing user without Admin role ->
  // refuse to boot" branch above on every subsequent boot.
  await prisma.$transaction(async (tx) => {
    const created = await tx.users.create({
      data: {
        email,
        encrypted_password: encryptedPassword,
        firstname: 'Admin',
        lastname: '',
        deleted: false,
        accepted_gdpr: true,
        created_at: now,
        updated_at: now,
      },
    });

    await tx.user_roles.create({
      data: { user_id: created.id, role_id: adminRole.id, created_at: now, updated_at: now },
    });

    return created;
  });
}
