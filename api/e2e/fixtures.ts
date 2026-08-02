/**
 * Fixed, well-known e2e seed data - the single source of truth shared by
 * `global-setup.ts` (which creates these rows directly via Prisma before the
 * suite runs) and every `*.spec.ts` file (which logs in as these users over
 * real HTTP; a genuine e2e run never has access to app internals like
 * `issueAccessToken`, only to what a real client could do - POST
 * /api/v1/session with a known email/password).
 *
 * Conceptually mirrors rails-app/lib/tasks/e2e.rake's fixed-email seed users,
 * scaled down to exactly what these API-level specs need: one plain member,
 * one Admin (satisfies every admin-gated ability check in src/authz/ability.ts
 * - see adminAbilities()), and one UserAdmin (narrower - only `manage
 * UserRole` - included so the seed shape mirrors "a member, an admin, and a
 * user-admin" even though the current specs don't yet assert anything
 * UserAdmin-specific beyond "not a full Admin").
 */

export const SEED_PASSWORD = 'e2e-Passw0rd!1';

export interface SeedUser {
  email: string;
  password: string;
  roleName: string;
}

export const SEED_USERS = {
  member: {
    email: 'e2e-member@example.test',
    password: SEED_PASSWORD,
    roleName: 'EnteredApprentice',
  },
  admin: {
    email: 'e2e-admin@example.test',
    password: SEED_PASSWORD,
    roleName: 'Admin',
  },
  userAdmin: {
    email: 'e2e-useradmin@example.test',
    password: SEED_PASSWORD,
    roleName: 'UserAdmin',
  },
} as const satisfies Record<string, SeedUser>;
