import type { external_event_ics_sources as IcsSourceRow } from '../generated/prisma/client.js';
import { Router } from 'express';

import { authenticateApiUser } from '../auth/middleware.js';
import { ApiError } from '../lib/errors.js';
import { buildListResponse, parsePageParams } from '../lib/pagination.js';
import { generateUniqueUuid } from '../lib/uuid.js';
import { syncExternalEventIcsSource } from '../lib/externalEventIcsSync.js';
import { assertSafeIcsUrl, fetchIcsUrlSafely } from '../lib/safeIcsFetch.js';
import { prisma } from '../db.js';

/**
 * Net-new admin surface for managing external ICS calendar URLs whose
 * events sync into external_events (see externalEventIcsSync.ts) - no
 * legacy Rails precedent (see this plan's header). Reuses the 'ExternalEvent'
 * CASL subject rather than introducing a new one - managing ICS sources is
 * treated as an aspect of managing external events, gated the same way.
 */

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.trim() === '');
}

const SORTABLE_COLUMNS = ['name', 'url', 'created_at'] as const;
type SortableColumn = (typeof SORTABLE_COLUMNS)[number];
const DEFAULT_SORT_FIELD: SortableColumn = 'name';

function isSortableColumn(value: string): value is SortableColumn {
  return (SORTABLE_COLUMNS as readonly string[]).includes(value);
}

function firstString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

/**
 * Same allowlisted-column sort pattern as events.ts's sortClause - a leading
 * '-' reverses direction, an unknown/missing sort falls back to name asc.
 * Only ever resolves to one of SORTABLE_COLUMNS, so no user-controlled
 * string reaches Prisma's orderBy as anything but a hardcoded literal.
 */
function sortClause(sortParam: unknown): { field: SortableColumn; direction: 'asc' | 'desc' } {
  const raw = firstString(sortParam) ?? '';
  const field = raw.replace(/^-/, '');
  const direction: 'asc' | 'desc' = raw.startsWith('-') ? 'desc' : 'asc';
  return { field: isSortableColumn(field) ? field : DEFAULT_SORT_FIELD, direction };
}

function sourceJson(source: IcsSourceRow): { uuid: string; name: string; url: string; created_at: string } {
  return { uuid: source.uuid, name: source.name, url: source.url, created_at: source.created_at.toISOString() };
}

export const externalEventIcsSourcesRouter = Router();

externalEventIcsSourcesRouter.use(authenticateApiUser);

externalEventIcsSourcesRouter.get('/', async (req, res, next) => {
  try {
    if (!req.ability?.can('manage', 'ExternalEvent')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const { page, perPage } = parsePageParams(req.query as Record<string, unknown>);
    const { field, direction } = sortClause(req.query.sort);
    const where = { deleted: false };
    const [rows, rowCount] = await Promise.all([
      prisma.external_event_ics_sources.findMany({ where, orderBy: { [field]: direction }, skip: page * perPage, take: perPage }),
      prisma.external_event_ics_sources.count({ where }),
    ]);
    res.status(200).json(buildListResponse(rows.map(sourceJson), rowCount));
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/external_event_ics_sources/options - members-readable
// {uuid, name} list for the calendar filter dropdown. Deliberately NOT
// gated on `manage ExternalEvent` like every other route on this router
// (that would 403 every non-admin member, which is the exact bug this
// endpoint exists to fix) - gated on `index ExternalEvent` instead, which
// defaultUserAbilities already grants everyone, since this only exposes
// non-sensitive metadata (no url) about sources whose synced events any
// member can already see on the calendar.
externalEventIcsSourcesRouter.get('/options', async (req, res, next) => {
  try {
    if (!req.ability?.can('index', 'ExternalEvent')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    const rows = await prisma.external_event_ics_sources.findMany({
      where: { deleted: false },
      orderBy: { name: 'asc' },
      select: { uuid: true, name: true },
    });
    res.status(200).json({ rows });
  } catch (err) {
    next(err);
  }
});

externalEventIcsSourcesRouter.post('/', async (req, res, next) => {
  try {
    if (!req.ability?.can('manage', 'ExternalEvent')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    const currentUser = req.currentUser;
    if (!currentUser) throw ApiError.unauthorized();

    const body = (req.body ?? {}) as { name?: unknown; url?: unknown };
    const errors: string[] = [];
    if (isBlank(body.name)) errors.push('Name muss ausgefüllt werden');
    if (isBlank(body.url)) errors.push('URL muss ausgefüllt werden');
    if (errors.length > 0) {
      res.status(422).json({ error: 'unprocessable', detail: errors.join(', ') });
      return;
    }

    // Fast admin feedback at creation time - the real enforcement boundary
    // is fetchIcsUrlSafely at sync time, since DNS can change afterwards.
    try {
      await assertSafeIcsUrl(body.url as string);
    } catch {
      res.status(422).json({ error: 'unprocessable', detail: 'URL zeigt auf eine nicht erlaubte Adresse' });
      return;
    }

    const now = new Date();
    const created = await prisma.external_event_ics_sources.create({
      data: {
        uuid: await generateUniqueUuid((candidate) => prisma.external_event_ics_sources.findFirst({ where: { uuid: candidate } }).then(Boolean)),
        name: body.name as string,
        url: body.url as string,
        created_by_id: currentUser.id,
        deleted: false,
        created_at: now,
        updated_at: now,
      },
    });
    res.status(201).json(sourceJson(created));
  } catch (err) {
    next(err);
  }
});

externalEventIcsSourcesRouter.delete('/:uuid', async (req, res, next) => {
  try {
    const existing = await prisma.external_event_ics_sources.findFirst({ where: { uuid: req.params.uuid, deleted: false } });
    if (!existing) throw ApiError.notFound();
    if (!req.ability?.can('manage', 'ExternalEvent')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    await prisma.external_event_ics_sources.update({ where: { id: existing.id }, data: { deleted: true, updated_at: new Date() } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

externalEventIcsSourcesRouter.patch('/:uuid', async (req, res, next) => {
  try {
    const existing = await prisma.external_event_ics_sources.findFirst({ where: { uuid: req.params.uuid, deleted: false } });
    if (!existing) throw ApiError.notFound();
    if (!req.ability?.can('manage', 'ExternalEvent')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const body = (req.body ?? {}) as { name?: unknown; url?: unknown };
    const errors: string[] = [];
    if ('name' in body && isBlank(body.name)) errors.push('Name muss ausgefüllt werden');
    if ('url' in body && isBlank(body.url)) errors.push('URL muss ausgefüllt werden');
    if (errors.length > 0) {
      res.status(422).json({ error: 'unprocessable', detail: errors.join(', ') });
      return;
    }

    const nextUrl = typeof body.url === 'string' ? body.url : existing.url;
    if (nextUrl !== existing.url) {
      // Same SSRF guard as creation - a URL edit is a fresh admin-supplied
      // address just like POST's, not a re-validation of something already
      // trusted.
      try {
        await assertSafeIcsUrl(nextUrl);
      } catch {
        res.status(422).json({ error: 'unprocessable', detail: 'URL zeigt auf eine nicht erlaubte Adresse' });
        return;
      }
    }

    const updated = await prisma.external_event_ics_sources.update({
      where: { id: existing.id },
      data: {
        name: typeof body.name === 'string' ? body.name : existing.name,
        url: nextUrl,
        updated_at: new Date(),
      },
    });
    res.status(200).json(sourceJson(updated));
  } catch (err) {
    next(err);
  }
});

externalEventIcsSourcesRouter.post('/:uuid/sync', async (req, res, next) => {
  try {
    const existing = await prisma.external_event_ics_sources.findFirst({ where: { uuid: req.params.uuid, deleted: false } });
    if (!existing) throw ApiError.notFound();
    if (!req.ability?.can('manage', 'ExternalEvent')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const result = await syncExternalEventIcsSource(existing, () => fetchIcsUrlSafely(existing.url));
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

export default externalEventIcsSourcesRouter;
