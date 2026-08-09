import { PrismaPg } from '@prisma/adapter-pg';

import { PrismaClient } from './generated/prisma/client.js';

function databaseUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error('DATABASE_URL is not set');
  }
  return value;
}

// Deliberately excludes the password even though this endpoint's caller
// already saw fit to expose host/port/username/database - see the CLAUDE.md
// "Public status endpoint" section for why those four are fine to publish
// behind the status token but the password never is.
export function databaseConnectionDetails(): {
  host: string | null;
  port: number | null;
  username: string | null;
  database: string | null;
} {
  try {
    const parsed = new URL(databaseUrl());
    return {
      host: parsed.hostname || null,
      port: parsed.port ? Number.parseInt(parsed.port, 10) : 5432,
      username: parsed.username || null,
      database: parsed.pathname.replace(/^\//, '') || null,
    };
  } catch {
    return { host: null, port: null, username: null, database: null };
  }
}

// Prisma v7's driver adapters take their pool defaults straight from `pg`,
// which (unlike Prisma v6's own built-in engine) waits forever for a free
// connection by default (`connectionTimeoutMillis: 0`) instead of erroring
// after 5s - a query queued behind a momentarily-exhausted pool hangs
// silently instead of failing loud. Matching v6's old defaults here per
// Prisma's own migration guide ("Connection pool" docs).
const adapter = new PrismaPg({
  connectionString: databaseUrl(),
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 300_000,
});

// Standard dev-hot-reload-safe singleton: `tsx watch` re-evaluates this
// module on every restart, which would otherwise create a fresh
// PrismaClient (and a fresh connection pool) each time and eventually
// exhaust Postgres connections. Stashing the instance on `globalThis`
// outside production lets watch-mode reuse the same client across reloads.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
