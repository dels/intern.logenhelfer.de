import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { prisma } from '../db.js';

/**
 * Moved out of `routes/public.ts` (which owned it alone until now) so both
 * the public `GET /api/v1/public/workingplan.pdf` route and the
 * authenticated `GET /api/v1/events/workingplan.pdf` route can share one
 * implementation instead of forking it - importing `public.ts` itself into
 * `events.ts` would also drag `ical-generator`/`demoSeed`/the status rate
 * limiter into every test that only needs to mount `eventsRouter`. Resolves
 * to the same `api/assets/bijou-large.png` file as before: this module also
 * lives one directory below `api/src/`, so the relative
 * `../../assets/bijou-large.png` path is unchanged.
 */
const DEFAULT_LOGO_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../assets/bijou-large.png');

/**
 * Derives the currently authoritative logo source: the admin-uploaded
 * `custom_logos` row if one exists, otherwise the same bundled default
 * crest the frontend's own `<BijouLogo>` falls back to. No caching/storage
 * of the derived bytes - callers that need to avoid re-reading on every
 * request already have their own reasons to cache (none currently do).
 */
export async function currentLogoSource(): Promise<Buffer> {
  const row = await prisma.custom_logos.findUnique({ where: { id: 1 } });
  if (row) return Buffer.from(row.content);
  return readFile(DEFAULT_LOGO_PATH);
}
