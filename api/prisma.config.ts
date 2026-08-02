import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadDotenv } from 'dotenv';
import { defineConfig } from 'prisma/config';

// api has no .env of its own - it shares the repo-root .env, same convention
// as test/setup.ts / e2e/global-setup.ts. Prisma v7 no longer auto-loads
// .env files once a prisma.config.ts exists, so this has to happen here
// explicitly. No-ops (rather than throwing) when the file doesn't exist -
// true in every Docker context, where DATABASE_URL is already a real
// container env var instead.
loadDotenv({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // Deliberately process.env, not prisma/config's `env()` helper: `env()`
    // throws if the var is unset, but `prisma generate` (unlike `migrate`)
    // doesn't need a real connection - and api/Dockerfile's build stage runs
    // `prisma generate` before DATABASE_URL is ever set (that only happens
    // at container-run time). Falling back to '' keeps generate working
    // there while migrate/db commands still get the real value everywhere
    // else. See Prisma's own "Handling optional environment variables" docs.
    url: process.env.DATABASE_URL ?? '',
  },
});
