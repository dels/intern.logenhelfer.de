import type { users } from '../../src/generated/prisma/client.js';

import { prisma } from '../../src/db.js';

let counter = 0;

/**
 * Creates a minimal, valid `users` row directly via Prisma (no Rails/FactoryBot
 * involved - this API doesn't run the Rails app). email/created_at/updated_at
 * are the only NOT NULL columns without a usable default.
 */
export async function createUser(overrides: Partial<Parameters<typeof prisma.users.create>[0]['data']> = {}): Promise<users> {
  counter += 1;
  const now = new Date();

  return prisma.users.create({
    data: {
      email: `test-user-${Date.now()}-${counter}@example.test`,
      created_at: now,
      updated_at: now,
      ...overrides,
    },
  });
}
