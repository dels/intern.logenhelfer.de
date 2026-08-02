import { randomUUID } from 'node:crypto';

import type { events as EventRow } from '../generated/prisma/client.js';
import { Router } from 'express';

import { authenticateApiUser } from '../auth/middleware.js';
import { prisma } from '../db.js';
import { appConfig } from '../lib/appConfig.js';
import { ApiError } from '../lib/errors.js';
import { buildListResponse, parsePageParams } from '../lib/pagination.js';

/**
 * Port of rails-app/app/controllers/api/v1/events_controller.rb.
 */

const SORTABLE_COLUMNS = ['date', 'title', 'location'] as const;
type SortableColumn = (typeof SORTABLE_COLUMNS)[number];
const DEFAULT_SORT_FIELD: SortableColumn = 'date';

function isSortableColumn(value: string): value is SortableColumn {
  return (SORTABLE_COLUMNS as readonly string[]).includes(value);
}

function firstString(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && typeof value[0] === 'string') return value[0];
  return undefined;
}

/**
 * Port of EventsController#sort_clause (events_controller.rb) - an unknown or
 * missing `sort` falls back to DEFAULT_SORT ('date'), a leading '-' reverses
 * direction. Only ever resolves to one of SORTABLE_COLUMNS, so an arbitrary
 * string here (including SQL metacharacters) can never reach Prisma as
 * anything but one of those three literal, hardcoded field names.
 */
function sortClause(sortParam: unknown): { field: SortableColumn; direction: 'asc' | 'desc' } {
  const raw = firstString(sortParam) ?? '';
  const field = raw.replace(/^-/, '');
  const direction: 'asc' | 'desc' = raw.startsWith('-') ? 'desc' : 'asc';
  return { field: isSortableColumn(field) ? field : DEFAULT_SORT_FIELD, direction };
}

/**
 * Strict YYYY-MM-DD parsing for the `from`/`to` filters and the `date` field.
 * An unparseable value is treated as absent rather than handed to
 * Prisma/Postgres as a raw string (which - unlike Rails, which interpolates
 * the param directly into `where('date >= ?', ...)` and would let Postgres
 * raise a 500 on a bad cast - would either error or, worse, be coerced by
 * JS's permissive `Date` parsing into a date nobody asked for). Deliberate
 * deviation from Rails' behavior here, flagged in the PR description: safer,
 * and no ported spec exercises a malformed from/to value.
 */
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

/**
 * Parses a `time` input field (e.g. "19:00" or "19:00:00") into a UTC-epoch
 * `Date` suitable for the `@db.Time` column. Distinguishes three cases the
 * PATCH merge logic below depends on:
 *   - key absent from the request body -> `undefined` (keep existing value)
 *   - explicit `null`, empty string, or unparseable value -> `null` (clear it)
 *   - a valid "HH:MM[:SS]" string -> the parsed `Date`
 */
function parseTimeInput(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string' || value.trim() === '') return null;
  const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
  if (!match) return null;
  const [, hh, mm, ss] = match;
  return new Date(Date.UTC(1970, 0, 1, Number(hh), Number(mm), ss ? Number(ss) : 0));
}

/** Formats a `@db.Time` column value back to "HH:MM", always reading UTC fields. */
function formatTime(value: Date | null): string | null {
  if (!value) return null;
  const hh = String(value.getUTCHours()).padStart(2, '0');
  const mm = String(value.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function toNullableString(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string') return value;
  return String(value);
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

export interface EventValidationFields {
  title?: unknown;
  date?: unknown;
  whole_day?: unknown;
  time?: unknown;
  end_time?: unknown;
  created_by_id?: unknown;
}

/**
 * Port of Event's ActiveRecord validations (rails-app/app/models/event.rb):
 *   validates_presence_of :date, :title, :created_by_id
 *   validates_presence_of :time,                          unless: :whole_day?
 * Plus a net-new (no Rails precedent) ordering check: when both `time` and
 * `end_time` are present and it's not whole_day, end_time must be strictly
 * after time. Returns Rails-style `full_messages` fragments; callers join
 * them with ', ' exactly like `event.errors.full_messages.join(', ')`.
 */
export function validateEvent(fields: EventValidationFields): string[] {
  const errors: string[] = [];
  if (isBlank(fields.title)) errors.push("Title can't be blank");
  if (isBlank(fields.date)) errors.push("Date can't be blank");
  if (isBlank(fields.created_by_id)) errors.push("Created by can't be blank");
  if (fields.whole_day !== true && isBlank(fields.time)) errors.push("Time can't be blank");
  if (
    fields.whole_day !== true &&
    fields.time instanceof Date &&
    fields.end_time instanceof Date &&
    fields.end_time.getTime() <= fields.time.getTime()
  ) {
    errors.push('End time must be after time');
  }
  return errors;
}

async function generateUniqueUuid(): Promise<string> {
  let uuid = randomUUID();
  // Mirrors UuidHelper#generate_uuid's `begin ... end while self.class.exists?(uuid: ...)`.
  while (await prisma.events.findFirst({ where: { uuid } })) {
    uuid = randomUUID();
  }
  return uuid;
}

function fullname(user: { firstname: string | null; lastname: string | null }): string {
  return [user.firstname, user.lastname].filter((part): part is string => part !== null && part !== undefined).join(' ');
}

export async function findVisibleEvent(uuid: string): Promise<EventRow | null> {
  return prisma.events.findFirst({ where: { uuid, deleted: false } });
}

interface EventParticipantJson {
  uuid: string;
  fullname: string;
}

interface EventJson {
  uuid: string;
  title: string;
  date: string;
  time: string | null;
  end_time: string | null;
  whole_day: boolean;
  location: string | null;
  public_description: string | null;
  private_description: string | null;
  created_by_id: number;
  updated_by_id: number | null;
  created_at: string;
  updated_at: string;
  participants?: EventParticipantJson[];
}

function eventJson(event: EventRow, participants?: EventParticipantJson[]): EventJson {
  const wholeDay = event.whole_day === true;
  const json: EventJson = {
    uuid: event.uuid ?? '',
    title: event.title ?? '',
    date: formatDateOnly(event.date),
    time: wholeDay ? null : formatTime(event.time),
    end_time: wholeDay ? null : formatTime(event.end_time),
    whole_day: wholeDay,
    location: event.location,
    public_description: event.public_description,
    private_description: event.private_description,
    created_by_id: event.created_by_id ?? 0,
    updated_by_id: event.updated_by_id,
    created_at: event.created_at.toISOString(),
    updated_at: event.updated_at.toISOString(),
  };
  if (participants) {
    json.participants = participants;
  }
  return json;
}

const router = Router();

router.use(authenticateApiUser);

// GET /api/v1/events
router.get('/', async (req, res, next) => {
  try {
    const ability = req.ability;
    // Unlike show/create/update/destroy, Rails' index action never renders
    // forbidden: it calls `Event.accessible_by(ability, :index)`, and the
    // only :index rule on Event is the unconditional grant in
    // default_user_abilities. A user with literally zero roles (so zero
    // abilities at all) gets CanCan's empty relation - a 200 with no rows -
    // not a 403. Mirror that: no ability gate on this response's status.
    const canIndex = Boolean(ability?.can('index', 'Event'));
    if (!canIndex) {
      res.status(200).json(buildListResponse([], 0));
      return;
    }

    const { field, direction } = sortClause(req.query.sort);
    const { page, perPage } = parsePageParams(req.query as Record<string, unknown>);
    const fromDate = parseDateOnlyParam(req.query.from);
    const toDate = parseDateOnlyParam(req.query.to);

    const dateFilter: { gte?: Date; lte?: Date } = {};
    if (fromDate) dateFilter.gte = fromDate;
    if (toDate) dateFilter.lte = toDate;

    const where = {
      deleted: false,
      ...(fromDate || toDate ? { date: dateFilter } : {}),
    };

    const [rows, rowCount] = await Promise.all([
      prisma.events.findMany({
        where,
        orderBy: { [field]: direction },
        skip: page * perPage,
        take: perPage,
      }),
      prisma.events.count({ where }),
    ]);

    res.status(200).json(buildListResponse(rows.map((event) => eventJson(event)), rowCount));
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/events
router.post('/', async (req, res, next) => {
  try {
    if (!req.ability?.can('create', 'Event')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    const currentUser = req.currentUser;
    if (!currentUser) {
      throw ApiError.unauthorized();
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const title = toNullableString(body.title);
    const location = toNullableString(body.location);
    const publicDescription = toNullableString(body.public_description);
    const privateDescription = toNullableString(body.private_description);
    const wholeDay = body.whole_day === true;
    const date = parseDateOnlyParam(body.date);
    const time = parseTimeInput(body.time) ?? null;
    const endTime = parseTimeInput(body.end_time) ?? null;

    const errors = validateEvent({ title, date, whole_day: wholeDay, time, end_time: endTime, created_by_id: currentUser.id });
    if (errors.length > 0) {
      res.status(422).json({ error: 'unprocessable', detail: errors.join(', ') });
      return;
    }
    if (date === undefined) {
      // Unreachable given the validation above (a blank date is already
      // rejected there) - narrows the type without an unsound cast.
      res.status(422).json({ error: 'unprocessable', detail: "Date can't be blank" });
      return;
    }

    const now = new Date();
    const created = await prisma.events.create({
      data: {
        uuid: await generateUniqueUuid(),
        title,
        date,
        time,
        end_time: endTime,
        whole_day: wholeDay,
        location,
        public_description: publicDescription,
        private_description: privateDescription,
        created_by_id: currentUser.id,
        created_at: now,
        updated_at: now,
      },
    });

    res.status(201).json(eventJson(created));
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/events/record_export
// Registered before the /:uuid routes purely for readability (Express
// dispatches by method+path, and no /:uuid route below handles POST, so
// there's no actual routing ambiguity either way).
const RECORD_EXPORT_KINDS: Record<string, { ability: 'internal_workingplan'; filename: string }> = {
  workingplan_internal: { ability: 'internal_workingplan', filename: 'Arbeitsplan (intern)' },
};

router.post('/record_export', async (req, res, next) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const kind = typeof body.kind === 'string' ? body.kind : undefined;
    const config = kind ? RECORD_EXPORT_KINDS[kind] : undefined;
    if (!config) {
      res.status(400).json({ error: 'bad_request', detail: 'unknown kind' });
      return;
    }
    if (!req.ability?.can(config.ability, 'Event')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    const currentUser = req.currentUser;
    if (!currentUser) {
      throw ApiError.unauthorized();
    }

    const now = new Date();
    await prisma.file_downloads.create({
      data: {
        user_id: currentUser.id,
        attached_file_id: null,
        filename: config.filename,
        remote_ip: currentUser.current_sign_in_ip,
        created_at: now,
        updated_at: now,
      },
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/events/defaults - creation-time defaults (location, duration)
// for the event form. Reads straight from the shared appConfig singleton -
// not the admin-only GET /api/v1/app_config - since any event creator, not
// just Admin, needs these two values to seed a new event.
router.get('/defaults', async (req, res, next) => {
  try {
    if (!req.ability?.can('create', 'Event')) {
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

// GET /api/v1/events/:uuid
router.get('/:uuid', async (req, res, next) => {
  try {
    const event = await prisma.events.findFirst({ where: { uuid: req.params.uuid, deleted: false } });
    if (!event) {
      throw ApiError.notFound();
    }
    if (!req.ability?.can('show', 'Event')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const participantRows = await prisma.event_participants.findMany({
      where: { event_id: event.id },
      orderBy: { id: 'asc' },
      select: { user_id: true },
    });
    const userIds = participantRows.map((p) => p.user_id).filter((id): id is number => id !== null);
    const users = userIds.length > 0 ? await prisma.users.findMany({ where: { id: { in: userIds } } }) : [];
    const usersById = new Map(users.map((u) => [u.id, u]));
    const participants: EventParticipantJson[] = userIds.flatMap((id) => {
      const user = usersById.get(id);
      return user ? [{ uuid: user.uuid ?? '', fullname: fullname(user) }] : [];
    });

    res.status(200).json(eventJson(event, participants));
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/events/:uuid
router.patch('/:uuid', async (req, res, next) => {
  try {
    const existing = await prisma.events.findFirst({ where: { uuid: req.params.uuid, deleted: false } });
    if (!existing) {
      throw ApiError.notFound();
    }
    if (!req.ability?.can('update', 'Event')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    const currentUser = req.currentUser;
    if (!currentUser) {
      throw ApiError.unauthorized();
    }

    const body = (req.body ?? {}) as Record<string, unknown>;
    const has = (key: string): boolean => Object.prototype.hasOwnProperty.call(body, key);

    const title = has('title') ? toNullableString(body.title) : existing.title;
    const location = has('location') ? toNullableString(body.location) : existing.location;
    const publicDescription = has('public_description') ? toNullableString(body.public_description) : existing.public_description;
    const privateDescription = has('private_description') ? toNullableString(body.private_description) : existing.private_description;
    const wholeDay = has('whole_day') ? body.whole_day === true : existing.whole_day === true;
    const date = has('date') ? parseDateOnlyParam(body.date) : existing.date;
    const timeChange = has('time') ? parseTimeInput(body.time) : undefined;
    const time = timeChange === undefined ? existing.time : timeChange;
    const endTimeChange = has('end_time') ? parseTimeInput(body.end_time) : undefined;
    const endTime = endTimeChange === undefined ? existing.end_time : endTimeChange;

    const errors = validateEvent({ title, date, whole_day: wholeDay, time, end_time: endTime, created_by_id: existing.created_by_id });
    if (errors.length > 0) {
      res.status(422).json({ error: 'unprocessable', detail: errors.join(', ') });
      return;
    }
    if (date === undefined) {
      // Unreachable given the validation above - narrows the type without an unsound cast.
      res.status(422).json({ error: 'unprocessable', detail: "Date can't be blank" });
      return;
    }

    const updated = await prisma.events.update({
      where: { id: existing.id },
      data: {
        title,
        location,
        public_description: publicDescription,
        private_description: privateDescription,
        whole_day: wholeDay,
        date,
        time,
        end_time: endTime,
        updated_by_id: currentUser.id,
        updated_at: new Date(),
      },
    });

    res.status(200).json(eventJson(updated));
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/events/:uuid
router.delete('/:uuid', async (req, res, next) => {
  try {
    const existing = await prisma.events.findFirst({ where: { uuid: req.params.uuid, deleted: false } });
    if (!existing) {
      throw ApiError.notFound();
    }
    if (!req.ability?.can('destroy', 'Event')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    await prisma.events.update({ where: { id: existing.id }, data: { deleted: true } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/events/:uuid/participants - self-registration, or (only for
// an admin holding `manage EventParticipant`) registration of another
// member via `user_uuid` in the body. Mirrors externalEvents.ts's
// equivalent route exactly, including leaving self-service ungated by
// CASL - any authenticated member managing their own RSVP is a baseline
// feature, not a permission.
router.post('/:uuid/participants', async (req, res, next) => {
  try {
    const event = await findVisibleEvent(req.params.uuid);
    if (!event) throw ApiError.notFound();
    const currentUser = req.currentUser;
    if (!currentUser) throw ApiError.unauthorized();

    const body = (req.body ?? {}) as { user_uuid?: unknown; festive_board?: unknown };
    const targetUuid = typeof body.user_uuid === 'string' && body.user_uuid.length > 0 ? body.user_uuid : currentUser.uuid;
    const actingOnBehalfOf = targetUuid !== currentUser.uuid;

    if (actingOnBehalfOf && !req.ability?.can('manage', 'EventParticipant')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const targetUser = actingOnBehalfOf ? await prisma.users.findFirst({ where: { uuid: targetUuid } }) : currentUser;
    if (!targetUser) throw ApiError.notFound();

    const existing = await prisma.event_participants.findFirst({ where: { event_id: event.id, user_id: targetUser.id } });
    if (existing) {
      res.status(422).json({ error: 'unprocessable', detail: 'Bereits angemeldet' });
      return;
    }

    const now = new Date();
    const created = await prisma.event_participants.create({
      data: {
        user_id: targetUser.id,
        event_id: event.id,
        festive_board: body.festive_board === true,
        created_at: now,
        updated_at: now,
      },
    });

    res.status(201).json({
      user_uuid: targetUser.uuid ?? '',
      fullname: fullname(targetUser),
      festive_board: created.festive_board === true,
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/events/:uuid/participants/:userUuid - self de-registration,
// or (admin-only) removing another member. Mirrors externalEvents.ts's
// equivalent DELETE route.
router.delete('/:uuid/participants/:userUuid', async (req, res, next) => {
  try {
    const event = await findVisibleEvent(req.params.uuid);
    if (!event) throw ApiError.notFound();
    const currentUser = req.currentUser;
    if (!currentUser) throw ApiError.unauthorized();

    const actingOnBehalfOf = req.params.userUuid !== currentUser.uuid;
    if (actingOnBehalfOf && !req.ability?.can('manage', 'EventParticipant')) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const targetUser = await prisma.users.findFirst({ where: { uuid: req.params.userUuid } });
    if (!targetUser) throw ApiError.notFound();

    const participant = await prisma.event_participants.findFirst({ where: { event_id: event.id, user_id: targetUser.id } });
    if (!participant) throw ApiError.notFound();

    await prisma.event_participants.delete({ where: { id: participant.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
