import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from 'dotenv';

// api has no .env of its own - it shares the repo-root .env (see CLAUDE.md /
// the task's DATABASE_URL & JWT_SECRET notes). Load it explicitly here,
// before any test file (and therefore before src/db.ts constructs its
// PrismaClient) runs, since nothing else in this workspace loads it.
const rootEnvPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env');

config({ path: rootEnvPath });

// DATABASE_URL isn't itself a key in .env - deriving it here from the same
// POSTGRES_* vars docker-compose.yml already builds the container's
// DATABASE_URL from means .env only has to state the Postgres credentials
// once. 127.0.0.1/POSTGRES_PORT (not the container-internal postgres-db:5432)
// because this process runs on the host, outside Docker's network. An
// explicit DATABASE_URL in .env still wins, for pointing tests at some other
// Postgres entirely.
if (!process.env.DATABASE_URL) {
  const { POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_PORT = '55432' } = process.env;
  process.env.DATABASE_URL = `postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:${POSTGRES_PORT}/${POSTGRES_DB}`;
}
