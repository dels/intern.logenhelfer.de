import bcrypt from 'bcryptjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';
import { AdminAccountConfigError, syncAdminAccountFromEnv } from '../../src/lib/adminAccount.js';

const ORIGINAL_USER = process.env.ADMIN_USER;
const ORIGINAL_PASSWORD = process.env.ADMIN_PASSWORD;

function setEnv(email: string | undefined, password: string | undefined): void {
  if (email === undefined) delete process.env.ADMIN_USER;
  else process.env.ADMIN_USER = email;
  if (password === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = password;
}

async function createAdminRole(): Promise<{ id: number }> {
  const now = new Date();
  return prisma.roles.create({
    data: { name: 'Admin', display_name: 'Admin', created_at: now, updated_at: now },
  });
}

beforeEach(async () => {
  await resetDb();
});

afterEach(() => {
  setEnv(ORIGINAL_USER, ORIGINAL_PASSWORD);
  vi.restoreAllMocks();
});

describe('syncAdminAccountFromEnv', () => {
  it('is a no-op when neither env var is set', async () => {
    setEnv(undefined, undefined);

    // Spy on Prisma methods to ensure zero database calls occur in the no-op path
    const usersFindUniqueSpy = vi.spyOn(prisma.users, 'findUnique');
    const rolesFindFirstSpy = vi.spyOn(prisma.roles, 'findFirst');
    const usersUpdateSpy = vi.spyOn(prisma.users, 'update');
    const usersCreateSpy = vi.spyOn(prisma.users, 'create');
    const userRolesCreateSpy = vi.spyOn(prisma.user_roles, 'create');

    await syncAdminAccountFromEnv();

    expect(usersFindUniqueSpy).not.toHaveBeenCalled();
    expect(rolesFindFirstSpy).not.toHaveBeenCalled();
    expect(usersUpdateSpy).not.toHaveBeenCalled();
    expect(usersCreateSpy).not.toHaveBeenCalled();
    expect(userRolesCreateSpy).not.toHaveBeenCalled();
    expect(await prisma.users.count()).toBe(0);
  });

  it('throws when only ADMIN_USER is set', async () => {
    setEnv('admin@example.test', undefined);
    await expect(syncAdminAccountFromEnv()).rejects.toThrow(AdminAccountConfigError);
    expect(await prisma.users.count()).toBe(0);
  });

  it('throws when only ADMIN_PASSWORD is set', async () => {
    setEnv(undefined, 'super-secret');
    await expect(syncAdminAccountFromEnv()).rejects.toThrow(AdminAccountConfigError);
    expect(await prisma.users.count()).toBe(0);
  });

  it('throws when no Admin role exists in this database', async () => {
    setEnv('admin@example.test', 'super-secret');
    await expect(syncAdminAccountFromEnv()).rejects.toThrow(AdminAccountConfigError);
    expect(await prisma.users.count()).toBe(0);
  });

  it('creates a new user with the Admin role on first boot', async () => {
    await createAdminRole();
    setEnv('admin@example.test', 'super-secret');

    await syncAdminAccountFromEnv();

    const user = await prisma.users.findUnique({ where: { email: 'admin@example.test' } });
    expect(user).not.toBeNull();
    expect(await bcrypt.compare('super-secret', user!.encrypted_password)).toBe(true);

    const userRoles = await prisma.user_roles.findMany({ where: { user_id: user!.id } });
    expect(userRoles).toHaveLength(1);
  });

  it('normalizes ADMIN_USER the same way login does (lowercase, trimmed)', async () => {
    await createAdminRole();
    setEnv('  Admin@Example.TEST  ', 'super-secret');

    await syncAdminAccountFromEnv();

    const user = await prisma.users.findUnique({ where: { email: 'admin@example.test' } });
    expect(user).not.toBeNull();
  });

  it('refreshes the password hash on a second boot without duplicating the role assignment', async () => {
    await createAdminRole();
    setEnv('admin@example.test', 'first-password');
    await syncAdminAccountFromEnv();

    setEnv('admin@example.test', 'second-password');
    await syncAdminAccountFromEnv();

    const user = await prisma.users.findUnique({ where: { email: 'admin@example.test' } });
    expect(await bcrypt.compare('second-password', user!.encrypted_password)).toBe(true);
    expect(await bcrypt.compare('first-password', user!.encrypted_password)).toBe(false);

    const userRoles = await prisma.user_roles.findMany({ where: { user_id: user!.id } });
    expect(userRoles).toHaveLength(1);
  });

  it('refuses to touch an existing user that does not already hold the Admin role', async () => {
    await createAdminRole();
    const existing = await createUser({ email: 'brother@example.test', encrypted_password: 'original-hash' });
    setEnv('brother@example.test', 'super-secret');

    await expect(syncAdminAccountFromEnv()).rejects.toThrow(AdminAccountConfigError);

    const unchanged = await prisma.users.findUnique({ where: { id: existing.id } });
    expect(unchanged!.encrypted_password).toBe('original-hash');
    expect(await prisma.user_roles.count({ where: { user_id: existing.id } })).toBe(0);
  });
});
