import type { external_events as ExternalEventRow } from '../generated/prisma/client.js';
import { Router } from 'express';

import { authenticateApiUser } from '../auth/middleware.js';
import { ApiError } from '../lib/errors.js';
import { appConfig } from '../lib/appConfig.js';
import { buildListResponse, parsePageParams } from '../lib/pagination.js';
import { generateUniqueUuid } from '../lib/uuid.js';
import { prisma } from '../db.js';

/**
 * Net-new port of rails-app/app/controllers/external_events_controller.rb -
 * that controller never had a JSON API in Rails (HTML-only), so this is a
 * fresh implementation following this API's existing conventions (events.ts,
 * announcements.ts), not a line-for-line port.
 */

function firstString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

function parseDateOnlyParam(value: unknown): Date | undefined {
  const str = firstString(value)?.trim();
  if (!str) return undefined;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
  if (!match) return undefined;
  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseTimeInput(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) return null;
  const [, hh, mm, ss] = match;
  return new Date(Date.UTC(1970, 0, 1, Number(hh), Number(mm), ss ? Number(ss) : 0));
}

function formatTime(value: Date | null): string | null {
  if (!value) return null;
  const hh = String(value.getUTCHours()).padStart(2, '0');
  const mm = String(value.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function toNullableString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  return typeof value === 'string' ? value : String(value);
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

export interface ExternalEventValidationFields {
  title?: unknown;
  host?: unknown;
  location?: unknown;
  date?: unknown;
  time?: unknown;
  end_time?: unknown;
}

/**
 * Validates every field the legacy Rails model validated (title, host,
 * time, date) PLUS `location` - the legacy app required `location` at the
 * DB level (NOT NULL) but never validated it in the model, a documented
 * inconsistency (see this plan's header). Deliberately closing that gap
 * here rather than reproducing it - PLUS a net-new end_time ordering check:
 * when both time and end_time are present, end_time must be strictly after
 * time.
 */
export function validateExternalEvent(fields: ExternalEventValidationFields): string[] {
  const errors: string[] = [];
  if (isBlank(fields.title)) errors.push('Titel muss ausgefüllt werden');
  if (isBlank(fields.host)) errors.push('Loge muss ausgefüllt werden');
  if (isBlank(fields.location)) errors.push('Ort muss ausgefüllt werden');
  if (isBlank(fields.date)) errors.push('Datum muss ausgefüllt werden');
  if (isBlank(fields.time)) errors.push('Uhrzeit muss ausgefüllt werden');
  if (fields.time instanceof Date && fields.end_time instanceof Date && fields.end_time.getTime() <= fields.time.getTime()) {
    errors.push('Endzeit muss nach der Uhrzeit liegen');
  }
  return errors;
}

export function findVisibleExternalEvent(uuid: string): Promise<ExternalEventRow | null> {
  return prisma.external_events.findFirst({ where: { uuid, deleted: false } });
}

export interface ExternalEventParticipantJson {
  user_uuid: string;
  fullname: string;
  festive_board: boolean;
  subscription_confirmed: boolean;
}

export interface ExternalEventJson {
  uuid: string;
  title: string;
  host: string | null;
  location: string;
  description: string | null;
  date: string;
  time: string | null;
  end_time: string | null;
  ics_source_id: number | null;
  ics_source_uuid: string | null;
  created_by_id: number;
  updated_by_id: number | null;
  created_at: string;
  updated_at: string;
  participants?: ExternalEventParticipantJson[];
}

export function externalEventJson(
  event: ExternalEventRow,
  participants?: ExternalEventParticipantJson[],
  icsSourceUuidById?: Map<number, string>,
): ExternalEventJson {
  const json: ExternalEventJson = {
    uuid: event.uuid ?? '',
    title: event.title,
    host: event.host,
    location: event.location,
    description: event.description,
    date: formatDateOnly(event.date),
    time: formatTime(event.time),
    end_time: formatTime(event.end_time),
    ics_source_id: event.ics_source_id,
    ics_source_uuid: event.ics_source_id ? (icsSourceUuidById?.get(event.ics_source_id) ?? null) : null,
    created_by_id: event.created_by_id,
    updated_by_id: event.updated_by_id,
    created_at: event.created_at.toISOString(),
    updated_at: event.updated_at.toISOString(),
  };
  if (participants) json.participants = participants;
  return json;
}

/** Loads an id->uuid map for every ics source referenced by the given events - one query regardless of row count, mirroring the loadRoleRowsForUsers-style batch-lookup convention used elsewhere in this API (e.g. members.ts). */
async function loadIcsSourceUuidsById(events: ExternalEventRow[]): Promise<Map<number, string>> {
  const ids = [...new Set(events.map((e) => e.ics_source_id).filter((id): id is number => id !== null))];
  if (ids.length === 0) return new Map();
  const sources = await prisma.external_event_ics_sources.findMany({ where: { id: { in: ids } }, select: { id: true, uuid: true } });
  return new Map(sources.map((s) => [s.id, s.uuid]));
}

export const externalEventsRouter = Router();

externalEventsRouter.use(authenticateApiUser);

// GET /api/v1/external_events - defaults to "from yesterday onward" (the
// legacy index view's `where('date >= ?', Date.today - 1.day)`) unless an
// explicit `from` is given, in which case that's the real lower bound
// instead (the calendar view needs to page into past months, which the
// yesterday floor would otherwise always hide).
externalEventsRouter.get('/', async (req, res, next) => {
  try {
    if (!req.ability?.can('index', 'ExternalEvent')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const { page, perPage } = parsePageParams(req.query as Record<string, unknown>);
    const fromParam = parseDateOnlyParam(req.query.from);
    const toParam = parseDateOnlyParam(req.query.to);
    let fromDate = fromParam;
    if (!fromDate) {
      fromDate = new Date();
      fromDate.setUTCDate(fromDate.getUTCDate() - 1);
      fromDate.setUTCHours(0, 0, 0, 0);
    }

    const dateFilter: { gte: Date; lte?: Date } = { gte: fromDate };
    if (toParam) dateFilter.lte = toParam;

    const where = { deleted: false, date: dateFilter };
    const [rows, rowCount] = await Promise.all([
      prisma.external_events.findMany({ where, orderBy: [{ date: 'asc' }, { time: 'asc' }], skip: page * perPage, take: perPage }),
      prisma.external_events.count({ where }),
    ]);
    const icsSourceUuidById = await loadIcsSourceUuidsById(rows);

    res.status(200).json(buildListResponse(rows.map((e) => externalEventJson(e, undefined, icsSourceUuidById)), rowCount));
  } catch (err) {
    next(err);
  }
});

externalEventsRouter.post('/', async (req, res, next) => {
  try {
    if (!req.ability?.can('create', 'ExternalEvent')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    const currentUser = req.currentUser;
    if (!currentUser) throw ApiError.unauthorized();

    const body = (req.body ?? {}) as Record<string, unknown>;
    const title = toNullableString(body.title);
    const host = toNullableString(body.host);
    const location = toNullableString(body.location);
    const description = toNullableString(body.description);
    const date = parseDateOnlyParam(body.date);
    const time = parseTimeInput(body.time) ?? null;
    const endTime = parseTimeInput(body.end_time) ?? null;

    const errors = validateExternalEvent({ title, host, location, date, time, end_time: endTime });
    if (errors.length > 0) {
      res.status(422).json({ error: 'unprocessable', detail: errors.join(', ') });
      return;
    }

    const now = new Date();
    const created = await prisma.external_events.create({
      data: {
        uuid: await generateUniqueUuid((candidate) => prisma.external_events.findFirst({ where: { uuid: candidate } }).then(Boolean)),
        title: title as string,
        host,
        location: location as string,
        description,
        date: date as Date,
        time: time as Date,
        end_time: endTime,
        created_by_id: currentUser.id,
        deleted: false,
        created_at: now,
        updated_at: now,
      },
    });

    res.status(201).json(externalEventJson(created));
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/external_events/defaults - same rationale as events.ts's
// equivalent route: any external-event creator, not just Admin, needs
// these two values, so this reads the shared appConfig singleton directly
// rather than the admin-only GET /api/v1/app_config.
externalEventsRouter.get('/defaults', async (req, res, next) => {
  try {
    if (!req.ability?.can('create', 'ExternalEvent')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    const [location, durationMinutes] = await Promise.all([
      appConfig.get('default_event_location'),
      appConfig.get('default_event_duration_minutes'),
    ]);
    res.status(200).json({
      location: typeof location === 'string' ? location : null,
      duration_minutes: typeof durationMinutes === 'number' ? durationMinutes : 60,
    });
  } catch (err) {
    next(err);
  }
});

externalEventsRouter.get('/:uuid', async (req, res, next) => {
  try {
    const event = await findVisibleExternalEvent(req.params.uuid);
    if (!event) throw ApiError.notFound();
    if (!req.ability?.can('show', 'ExternalEvent')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const participants = await loadParticipants(event.id);
    const icsSourceUuidById = await loadIcsSourceUuidsById([event]);
    res.status(200).json(externalEventJson(event, participants, icsSourceUuidById));
  } catch (err) {
    next(err);
  }
});

externalEventsRouter.patch('/:uuid', async (req, res, next) => {
  try {
    const existing = await findVisibleExternalEvent(req.params.uuid);
    if (!existing) throw ApiError.notFound();
    if (!req.ability?.can('update', 'ExternalEvent')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    if (existing.ics_source_id !== null) {
      res.status(422).json({ error: 'unprocessable', detail: 'ICS-importierte Termine können nicht bearbeitet werden' });
      return;
    }
    const currentUser = req.currentUser;
    if (!currentUser) throw ApiError.unauthorized();

    const body = (req.body ?? {}) as Record<string, unknown>;
    const has = (key: string): boolean => Object.prototype.hasOwnProperty.call(body, key);

    const title = has('title') ? toNullableString(body.title) : existing.title;
    const host = has('host') ? toNullableString(body.host) : existing.host;
    const location = has('location') ? toNullableString(body.location) : existing.location;
    const description = has('description') ? toNullableString(body.description) : existing.description;
    const date = has('date') ? parseDateOnlyParam(body.date) : existing.date;
    const timeChange = has('time') ? parseTimeInput(body.time) : undefined;
    const time = timeChange === undefined ? existing.time : timeChange;
    const endTimeChange = has('end_time') ? parseTimeInput(body.end_time) : undefined;
    const endTime = endTimeChange === undefined ? existing.end_time : endTimeChange;

    const errors = validateExternalEvent({ title, host, location, date, time, end_time: endTime });
    if (errors.length > 0) {
      res.status(422).json({ error: 'unprocessable', detail: errors.join(', ') });
      return;
    }

    const updated = await prisma.external_events.update({
      where: { id: existing.id },
      data: { title: title as string, host, location: location as string, description, date: date as Date, time: time as Date, end_time: endTime, updated_by_id: currentUser.id, updated_at: new Date() },
    });

    res.status(200).json(externalEventJson(updated));
  } catch (err) {
    next(err);
  }
});

externalEventsRouter.delete('/:uuid', async (req, res, next) => {
  try {
    const existing = await findVisibleExternalEvent(req.params.uuid);
    if (!existing) throw ApiError.notFound();
    if (!req.ability?.can('destroy', 'ExternalEvent')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    if (existing.ics_source_id !== null) {
      res.status(422).json({ error: 'unprocessable', detail: 'ICS-importierte Termine können nicht gelöscht werden' });
      return;
    }

    await prisma.external_events.update({ where: { id: existing.id }, data: { deleted: true } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

/** Exported for Task 3's participant sub-routes, appended to this same router. */
export async function loadParticipants(eventId: number): Promise<ExternalEventParticipantJson[]> {
  const rows = await prisma.external_event_participants.findMany({ where: { external_event_id: eventId }, orderBy: { id: 'asc' } });
  const userIds = rows.map((r) => r.user_id).filter((id): id is number => id !== null);
  const users = userIds.length > 0 ? await prisma.users.findMany({ where: { id: { in: userIds } } }) : [];
  const usersById = new Map(users.map((u) => [u.id, u]));
  return rows.flatMap((row) => {
    const user = row.user_id !== null ? usersById.get(row.user_id) : undefined;
    if (!user) return [];
    const fullname = [user.firstname, user.lastname].filter((p): p is string => !!p).join(' ');
    return [{ user_uuid: user.uuid ?? '', fullname, festive_board: row.festive_board === true, subscription_confirmed: row.subscription_confirmed === true }];
  });
}

function fullname(user: { firstname: string | null; lastname: string | null }): string {
  return [user.firstname, user.lastname].filter((p): p is string => !!p).join(' ');
}

// POST /api/v1/external_events/:uuid/participants - self-registration, or
// (only for an admin - Secretary/WorshipfulMaster/Admin) registration of
// another member via `user_uuid` in the body. Self-service is intentionally
// NOT gated through a CASL check here: any authenticated member managing
// their own RSVP is a baseline feature, not a permission - the on-behalf-of
// path below is what actually needs an ability check.
externalEventsRouter.post('/:uuid/participants', async (req, res, next) => {
  try {
    const event = await findVisibleExternalEvent(req.params.uuid);
    if (!event) throw ApiError.notFound();
    const currentUser = req.currentUser;
    if (!currentUser) throw ApiError.unauthorized();

    const body = (req.body ?? {}) as { user_uuid?: unknown; festive_board?: unknown };
    const targetUuid = typeof body.user_uuid === 'string' && body.user_uuid.length > 0 ? body.user_uuid : currentUser.uuid;
    const actingOnBehalfOf = targetUuid !== currentUser.uuid;

    if (actingOnBehalfOf && !req.ability?.can('manage', 'ExternalEventParticipant')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const targetUser = actingOnBehalfOf ? await prisma.users.findFirst({ where: { uuid: targetUuid } }) : currentUser;
    if (!targetUser) throw ApiError.notFound();

    const existing = await prisma.external_event_participants.findFirst({ where: { external_event_id: event.id, user_id: targetUser.id } });
    if (existing) {
      res.status(422).json({ error: 'unprocessable', detail: 'Bereits angemeldet' });
      return;
    }

    const now = new Date();
    const created = await prisma.external_event_participants.create({
      data: {
        user_id: targetUser.id,
        external_event_id: event.id,
        festive_board: body.festive_board === true,
        subscription_confirmed: false,
        created_at: now,
        updated_at: now,
      },
    });

    res.status(201).json({
      user_uuid: targetUser.uuid ?? '',
      fullname: fullname(targetUser),
      festive_board: created.festive_board === true,
      subscription_confirmed: false,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/external_events/:uuid/participants/:userUuid - self
// de-registration, or (admin-only) removing another member.
externalEventsRouter.delete('/:uuid/participants/:userUuid', async (req, res, next) => {
  try {
    const event = await findVisibleExternalEvent(req.params.uuid);
    if (!event) throw ApiError.notFound();
    const currentUser = req.currentUser;
    if (!currentUser) throw ApiError.unauthorized();

    const actingOnBehalfOf = req.params.userUuid !== currentUser.uuid;
    if (actingOnBehalfOf && !req.ability?.can('manage', 'ExternalEventParticipant')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const targetUser = await prisma.users.findFirst({ where: { uuid: req.params.userUuid } });
    if (!targetUser) throw ApiError.notFound();

    const participant = await prisma.external_event_participants.findFirst({ where: { external_event_id: event.id, user_id: targetUser.id } });
    if (!participant) throw ApiError.notFound();

    await prisma.external_event_participants.delete({ where: { id: participant.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/external_events/:uuid/participants/:userUuid/confirm -
// admin-only ("the host lodge confirmed this brother is on their list").
// Gated on the unconditioned admin `manage` rule specifically (not the
// self-scoped 'update' rule every member also holds on their own
// participant row) so a member can never confirm their own subscription.
externalEventsRouter.post('/:uuid/participants/:userUuid/confirm', async (req, res, next) => {
  try {
    const event = await findVisibleExternalEvent(req.params.uuid);
    if (!event) throw ApiError.notFound();
    if (!req.ability?.can('manage', 'ExternalEventParticipant')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const targetUser = await prisma.users.findFirst({ where: { uuid: req.params.userUuid } });
    if (!targetUser) throw ApiError.notFound();

    const participant = await prisma.external_event_participants.findFirst({ where: { external_event_id: event.id, user_id: targetUser.id } });
    if (!participant) throw ApiError.notFound();

    const updated = await prisma.external_event_participants.update({ where: { id: participant.id }, data: { subscription_confirmed: true, updated_at: new Date() } });

    res.status(200).json({
      user_uuid: targetUser.uuid ?? '',
      fullname: fullname(targetUser),
      festive_board: updated.festive_board === true,
      subscription_confirmed: true,
    });
  } catch (err) {
    next(err);
  }
});

export default externalEventsRouter;
