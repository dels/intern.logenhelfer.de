import { randomUUID } from 'node:crypto';

import type { events, users } from '../../src/generated/prisma/client.js';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { issueAccessToken } from '../../src/auth/jwt.js';
import { appConfig, KNOWN_KEYS } from '../../src/lib/appConfig.js';
import { prisma } from '../../src/db.js';
import { apiErrorHandler } from '../../src/lib/errors.js';
import eventsRouter from '../../src/routes/events.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

// GET /api/v1/events/workingplan.pdf's own tests below need to observe that
// resolveFooterLines/buildWorkingplanPdf were actually invoked (and with
// what arguments) - same vi.mock-wrap-two-exports pattern public.test.ts
// uses for the sibling public route's identical assertion need. Every other
// export (buildWorkingplanPdfDocument, pdfLabelsFor, etc.) stays the real,
// unmocked implementation.
vi.mock('../../src/lib/workingplanPdf.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/workingplanPdf.js')>();
  return { ...actual, resolveFooterLines: vi.fn(actual.resolveFooterLines), buildWorkingplanPdf: vi.fn(actual.buildWorkingplanPdf) };
});
import { resolveFooterLines, buildWorkingplanPdf } from '../../src/lib/workingplanPdf.js';

// Port of rails-app/spec/requests/api/v1/events_spec.rb (17 examples), plus a
// small number of net-new security tests (see the bottom describe block).
//
// The Rails suite runs with `use_transactional_fixtures = false` (per its own
// comment: "other examples' events are not rolled back"), so its assertions
// deliberately check "includes at least these uuids"/">= 3" rather than exact
// totals. This port's `resetDb()` beforeEach gives each test a genuinely
// empty table, so assertions here are tightened to exact contents where that
// makes the test strictly more precise without changing what's being proven.

const app = express();
app.use(express.json());
app.use('/api/v1/events', eventsRouter);
app.use(apiErrorHandler);

function authHeaders(user: users): { Authorization: string } {
  return { Authorization: `Bearer ${issueAccessToken(user.id)}` };
}

let roleCounter = 0;

async function createRole(name: string): Promise<{ id: number; name: string | null }> {
  roleCounter += 1;
  const now = new Date();
  return prisma.roles.create({
    data: { name, display_name: `${name} ${roleCounter}`, group: true, created_at: now, updated_at: now },
  });
}

async function assignRole(userId: number, roleId: number): Promise<void> {
  const now = new Date();
  await prisma.user_roles.create({ data: { user_id: userId, role_id: roleId, created_at: now, updated_at: now } });
}

/**
 * A bare `createUser()` has zero roles, and `buildAbility`'s
 * `default_user_abilities` (which includes Event :index/:show) is only
 * reached through a degree role's `*_abilities` method (EnteredApprentice
 * and friends) - every real member has one, so "plain member" fixtures here
 * hold that role too, matching the Rails spec's own `apprentice_role` setup
 * comment.
 *
 * `uuid` is set explicitly (a bare `createUser()` leaves it null - the
 * factory only sets the NOT NULL columns, see the comment on the
 * GET /api/v1/events/:uuid participants test above) so participant-route
 * assertions that compare a response's `user_uuid` against `member.uuid`
 * compare two real strings, not `''` against `null`.
 */
async function makeMember(): Promise<users> {
  const role = await createRole('EnteredApprentice');
  const user = await createUser({ uuid: randomUUID() });
  await assignRole(user.id, role.id);
  return user;
}

async function makeWorkingPlanAdmin(): Promise<users> {
  const role = await createRole('WorkingPlanAdmin');
  const user = await createUser({ uuid: randomUUID() });
  await assignRole(user.id, role.id);
  return user;
}

async function makeFileAdmin(): Promise<users> {
  const role = await createRole('FileAdmin');
  const user = await createUser();
  await assignRole(user.id, role.id);
  return user;
}

let eventCounter = 0;

/** Mirrors FactoryBot's `factory :event` (rails-app/spec/factories.rb L29-35). */
async function createEvent(
  createdById: number,
  overrides: Partial<{
    title: string;
    date: Date;
    time: Date | null;
    whole_day: boolean;
    location: string | null;
    deleted: boolean;
    private_description: string | null;
    public_description: string | null;
  }> = {},
): Promise<events> {
  eventCounter += 1;
  const now = new Date();
  const wholeDay = overrides.whole_day ?? false;
  return prisma.events.create({
    data: {
      uuid: randomUUID(),
      title: overrides.title ?? `Regelmäßige Arbeit ${eventCounter}`,
      date: overrides.date ?? tomorrow(),
      time: wholeDay ? null : (overrides.time ?? new Date(Date.UTC(1970, 0, 1, 19, 0))),
      whole_day: wholeDay,
      location: overrides.location ?? 'Logenhaus',
      deleted: overrides.deleted ?? false,
      private_description: 'private_description' in overrides ? (overrides.private_description ?? null) : null,
      public_description: 'public_description' in overrides ? (overrides.public_description ?? null) : null,
      created_by_id: createdById,
      created_at: now,
      updated_at: now,
    },
  });
}

function tomorrow(): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function utcDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

function daysFromNowUtc(days: number): Date {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
}

/** A date_of_birth whose month/day falls `daysFromToday` from now (birth year arbitrary/in the past) - mirrors membersLists.test.ts's identically-named helper, for exercising the internal PDF's birthdays-window filter. */
function dobForUpcomingDays(daysFromToday: number, birthYearsAgo = 30): Date {
  const now = new Date();
  const target = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysFromToday));
  return new Date(Date.UTC(target.getUTCFullYear() - birthYearsAgo, target.getUTCMonth(), target.getUTCDate()));
}

/** Mirrors `AppConfig[key] = value` closely enough for these tests - same helper as public.test.ts/membersLists.test.ts. */
async function setAppConfig(key: string, value: string | number | boolean): Promise<void> {
  const env = process.env.NODE_ENV ?? 'development';
  const stringValue = String(value);
  await prisma.app_config_adapters.upsert({
    where: { key: `${env}_${key}` },
    update: { value: stringValue },
    create: { key: `${env}_${key}`, value: stringValue },
  });
}

describe('Events API', () => {
  beforeEach(async () => {
    await resetDb();
    // appConfig caches records process-wide - resetDb() truncates
    // app_config_adapters but doesn't itself invalidate that in-memory
    // cache, so every known key is explicitly dirtied to force a fresh
    // (post-truncate, default) read. Same pattern as public.test.ts/
    // membersLists.test.ts; only load-bearing for the workingplan.pdf tests
    // below, harmless for every other test in this file.
    for (const key of Object.keys(KNOWN_KEYS)) appConfig.dirty(key);
  });

  describe('GET /api/v1/events', () => {
    it('returns a paginated list any authenticated member can read', async () => {
      const member = await makeMember();
      const events = await Promise.all([1, 2, 3].map(() => createEvent(member.id)));

      const res = await request(app).get('/api/v1/events').set(authHeaders(member));

      expect(res.status).toBe(200);
      const uuids = res.body.rows.map((r: { uuid: string }) => r.uuid);
      expect(uuids).toEqual(expect.arrayContaining(events.map((e) => e.uuid)));
      expect(res.body.row_count).toBeGreaterThanOrEqual(3);
    });

    it('sorts by the requested column, not just the model default_scope order', async () => {
      const member = await makeMember();
      await Promise.all([1, 2, 3].map(() => createEvent(member.id)));
      await createEvent(member.id, { title: 'Zebra', date: tomorrow() });
      await createEvent(member.id, { title: 'Anton', date: tomorrow() });

      const res = await request(app).get('/api/v1/events').query({ sort: 'title', per_page: 100 }).set(authHeaders(member));

      const titles = res.body.rows.map((r: { title: string }) => r.title);
      expect(titles).toEqual([...titles].sort());
    });

    it('401s without a token', async () => {
      const res = await request(app).get('/api/v1/events');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'unauthorized' });
    });
  });

  describe('POST /api/v1/events', () => {
    const params = () => ({ title: 'Stiftungsfest', date: '2026-08-01', time: '19:00', location: 'Festsaal' });

    it('forbids a plain member', async () => {
      const member = await makeMember();

      const res = await request(app).post('/api/v1/events').send(params()).set(authHeaders(member));

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
    });

    it('lets a WorkingPlanAdmin create an event', async () => {
      const admin = await makeWorkingPlanAdmin();

      const res = await request(app).post('/api/v1/events').send(params()).set(authHeaders(admin));

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Stiftungsfest');
      const created = await prisma.events.findFirstOrThrow({ where: { uuid: res.body.uuid } });
      expect(created.created_by_id).toBe(admin.id);
    });

    it('returns 422 on a missing required field', async () => {
      const admin = await makeWorkingPlanAdmin();

      const res = await request(app).post('/api/v1/events').send({ location: 'Festsaal' }).set(authHeaders(admin));

      expect(res.status).toBe(422);
      expect(res.body.error).toBe('unprocessable');
      expect(res.body.detail).toEqual(expect.any(String));
    });

    it('creates an event with an end_time and returns it', async () => {
      const admin = await makeWorkingPlanAdmin();

      const res = await request(app)
        .post('/api/v1/events')
        .send({ title: 'Feierliche Tafel', date: '2026-09-01', time: '19:00', end_time: '22:00', whole_day: false })
        .set(authHeaders(admin));

      expect(res.status).toBe(201);
      expect(res.body.time).toBe('19:00');
      expect(res.body.end_time).toBe('22:00');
    });

    it('rejects an end_time before time with a 422', async () => {
      const admin = await makeWorkingPlanAdmin();

      const res = await request(app)
        .post('/api/v1/events')
        .send({ title: 'Feierliche Tafel', date: '2026-09-01', time: '19:00', end_time: '18:00', whole_day: false })
        .set(authHeaders(admin));

      expect(res.status).toBe(422);
      expect(res.body.detail).toContain('End time must be after time');
    });

    it('ignores end_time ordering when whole_day is true', async () => {
      const admin = await makeWorkingPlanAdmin();

      const res = await request(app)
        .post('/api/v1/events')
        .send({ title: 'Ganztägig', date: '2026-09-01', whole_day: true, time: '19:00', end_time: '01:00' })
        .set(authHeaders(admin));

      expect(res.status).toBe(201);
    });
  });

  describe('GET /api/v1/events/:uuid', () => {
    it('includes participants', async () => {
      const member = await makeMember();
      const event = await createEvent(member.id);
      // createUser() alone leaves uuid null (the factory only sets the NOT
      // NULL columns) - the response always echoes a string uuid (falling
      // back to '' if null), so give the participant a real one here or the
      // assertion below compares '' against null instead of a real uuid.
      const participant = await createUser({ uuid: randomUUID() });
      const now = new Date();
      await prisma.event_participants.create({
        data: { user_id: participant.id, event_id: event.id, created_at: now, updated_at: now },
      });

      const res = await request(app).get(`/api/v1/events/${event.uuid}`).set(authHeaders(member));

      expect(res.status).toBe(200);
      expect(res.body.participants.map((p: { uuid: string }) => p.uuid)).toEqual([participant.uuid]);
    });

    it('404s for an unknown uuid', async () => {
      const member = await makeMember();

      const res = await request(app).get('/api/v1/events/does-not-exist').set(authHeaders(member));

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'not_found' });
    });
  });

  describe('PATCH /api/v1/events/:uuid', () => {
    it('forbids a plain member', async () => {
      const member = await makeMember();
      const event = await createEvent(member.id);

      const res = await request(app).patch(`/api/v1/events/${event.uuid}`).send({ title: 'Renamed' }).set(authHeaders(member));

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
    });

    it('lets a WorkingPlanAdmin update and records updated_by', async () => {
      const admin = await makeWorkingPlanAdmin();
      const event = await createEvent(admin.id);

      const res = await request(app).patch(`/api/v1/events/${event.uuid}`).send({ title: 'Renamed' }).set(authHeaders(admin));

      expect(res.status).toBe(200);
      const reloaded = await prisma.events.findUniqueOrThrow({ where: { id: event.id } });
      expect(reloaded.title).toBe('Renamed');
      expect(reloaded.updated_by_id).toBe(admin.id);
    });

    it('lets a whole-day event be saved with a blank time, matching its own validation rule', async () => {
      // Event validates_presence_of :time, unless: :whole_day? - so a
      // whole-day event with no time is intentionally valid. See the Rails
      // spec's own comment: the `events.time` column previously carried a
      // stale NOT NULL DB constraint that rejected this exact value at the
      // SQL layer regardless, causing a 500 instead of the normal
      // validation-driven 422/200 response - our schema mirror reflects the
      // already-relaxed constraint, so this exercises only the app-layer rule.
      const admin = await makeWorkingPlanAdmin();
      const event = await createEvent(admin.id);

      const res = await request(app)
        .patch(`/api/v1/events/${event.uuid}`)
        .send({ whole_day: true, time: null })
        .set(authHeaders(admin));

      expect(res.status).toBe(200);
      const reloaded = await prisma.events.findUniqueOrThrow({ where: { id: event.id } });
      expect(reloaded.whole_day).toBe(true);
      expect(reloaded.time).toBeNull();
    });
  });

  describe('DELETE /api/v1/events/:uuid', () => {
    it('forbids a plain member', async () => {
      const member = await makeMember();
      const event = await createEvent(member.id);

      const res = await request(app).delete(`/api/v1/events/${event.uuid}`).set(authHeaders(member));

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
    });

    it('soft-deletes for a WorkingPlanAdmin, disappearing from the default scope', async () => {
      const admin = await makeWorkingPlanAdmin();
      const event = await createEvent(admin.id);

      const res = await request(app).delete(`/api/v1/events/${event.uuid}`).set(authHeaders(admin));

      expect(res.status).toBe(204);
      const getRes = await request(app).get(`/api/v1/events/${event.uuid}`).set(authHeaders(admin));
      expect(getRes.status).toBe(404);
      const raw = await prisma.events.findUniqueOrThrow({ where: { id: event.id } });
      expect(raw.deleted).toBe(true);
    });
  });

  describe('GET /api/v1/events with from/to date filtering', () => {
    it('filters to events within the given date range, inclusive', async () => {
      const member = await makeMember();
      const inRange = await createEvent(member.id, { date: utcDate(2026, 8, 15) });
      const beforeRange = await createEvent(member.id, { date: utcDate(2026, 7, 1) });
      const afterRange = await createEvent(member.id, { date: utcDate(2026, 9, 1) });

      const res = await request(app)
        .get('/api/v1/events')
        .query({ from: '2026-08-01', to: '2026-08-31', per_page: 100 })
        .set(authHeaders(member));

      expect(res.status).toBe(200);
      const uuids = res.body.rows.map((r: { uuid: string }) => r.uuid);
      expect(uuids).toContain(inRange.uuid);
      expect(uuids).not.toContain(beforeRange.uuid);
      expect(uuids).not.toContain(afterRange.uuid);
    });

    it('returns all events (existing behavior) when from/to are omitted', async () => {
      const member = await makeMember();
      const event = await createEvent(member.id, { date: utcDate(2026, 8, 15) });

      const res = await request(app).get('/api/v1/events').query({ per_page: 100 }).set(authHeaders(member));

      expect(res.status).toBe(200);
      expect(res.body.rows.map((r: { uuid: string }) => r.uuid)).toContain(event.uuid);
    });
  });

  describe('POST /api/v1/events/record_export', () => {
    it('creates a FileDownload row for workingplan_internal', async () => {
      const member = await makeMember();
      const before = await prisma.file_downloads.count();

      const res = await request(app)
        .post('/api/v1/events/record_export')
        .send({ kind: 'workingplan_internal' })
        .set(authHeaders(member));

      expect(res.status).toBe(204);
      const after = await prisma.file_downloads.count();
      expect(after).toBe(before + 1);
      const fd = await prisma.file_downloads.findFirstOrThrow({ orderBy: { id: 'desc' } });
      expect(fd.user_id).toBe(member.id);
      expect(fd.filename).toBe('Arbeitsplan (intern)');
      expect(fd.attached_file_id).toBeNull();
    });

    it('rejects an unknown kind', async () => {
      const member = await makeMember();

      const res = await request(app).post('/api/v1/events/record_export').send({ kind: 'bogus' }).set(authHeaders(member));

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('bad_request');
    });
  });

  describe('GET /api/v1/events/workingplan.pdf', () => {
    it('401s without a token', async () => {
      const res = await request(app).get('/api/v1/events/workingplan.pdf');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'unauthorized' });
    });

    it('403s a caller without the internal_workingplan ability', async () => {
      const fileAdmin = await makeFileAdmin();

      const res = await request(app).get('/api/v1/events/workingplan.pdf').set(authHeaders(fileAdmin));

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
    });

    it('200s for an authorized member, returns a real PDF body, and records the export the same way record_export does', async () => {
      const member = await makeMember();
      await createEvent(member.id, { title: 'Loge im Juli', private_description: 'Interne Beschreibung', date: daysFromNowUtc(10) });
      const before = await prisma.file_downloads.count();

      const res = await request(app).get('/api/v1/events/workingplan.pdf').set(authHeaders(member));

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      expect(res.body.slice(0, 5).toString('latin1')).toBe('%PDF-');
      expect(res.body.length).toBeGreaterThan(0);

      const after = await prisma.file_downloads.count();
      expect(after).toBe(before + 1);
      const fd = await prisma.file_downloads.findFirstOrThrow({ orderBy: { id: 'desc' } });
      expect(fd.user_id).toBe(member.id);
      expect(fd.filename).toBe('Arbeitsplan (intern)');
      expect(fd.attached_file_id).toBeNull();
    });

    it('uses private_description (not public_description) for the event rows - this is the internal, authenticated PDF', async () => {
      const member = await makeMember();
      await createEvent(member.id, {
        title: 'Loge im Juli',
        private_description: 'Interne Beschreibung',
        public_description: 'Öffentliche Beschreibung',
        date: daysFromNowUtc(10),
      });

      const res = await request(app).get('/api/v1/events/workingplan.pdf').set(authHeaders(member));

      expect(res.status).toBe(200);
      expect(buildWorkingplanPdf).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ description: 'Interne Beschreibung' })]),
        'de',
        expect.anything(),
      );
    });

    it('calls resolveFooterLines with "internal" (not "public") to build the footer', async () => {
      const member = await makeMember();

      const res = await request(app).get('/api/v1/events/workingplan.pdf').set(authHeaders(member));

      expect(res.status).toBe(200);
      expect(resolveFooterLines).toHaveBeenCalledWith('internal');
    });

    it('includes a birthday inside the default timespan window, excludes one far outside it', async () => {
      const member = await makeMember();
      await createUser({ lastname: 'Bald', firstname: 'Geburtstag', date_of_birth: dobForUpcomingDays(10) });
      await createUser({ lastname: 'Spaet', firstname: 'Geburtstag', date_of_birth: dobForUpcomingDays(200) });

      const res = await request(app).get('/api/v1/events/workingplan.pdf').set(authHeaders(member));

      expect(res.status).toBe(200);
      const call = vi.mocked(buildWorkingplanPdf).mock.calls.at(-1);
      const options = call?.[2] as { birthdayRows?: Array<{ lastname: string }> };
      const lastnames = (options.birthdayRows ?? []).map((r) => r.lastname);
      expect(lastnames).toContain('Bald');
      expect(lastnames).not.toContain('Spaet');
    });

    it('includes every birthday when the configured timespan spans a full year or more (no month/day-wrap exclusion)', async () => {
      await setAppConfig('default_workingplan_timespan', 400);
      const member = await makeMember();
      await createUser({ lastname: 'Irgendwann', firstname: 'Geburtstag', date_of_birth: dobForUpcomingDays(200) });

      const res = await request(app).get('/api/v1/events/workingplan.pdf').set(authHeaders(member));

      expect(res.status).toBe(200);
      const call = vi.mocked(buildWorkingplanPdf).mock.calls.at(-1);
      const options = call?.[2] as { birthdayRows?: Array<{ lastname: string }> };
      const lastnames = (options.birthdayRows ?? []).map((r) => r.lastname);
      expect(lastnames).toContain('Irgendwann');
    });

    it('does not include a soft-deleted event in the range', async () => {
      const member = await makeMember();
      await createEvent(member.id, { title: 'Geloescht', private_description: 'Sollte fehlen', date: daysFromNowUtc(10), deleted: true });

      const res = await request(app).get('/api/v1/events/workingplan.pdf').set(authHeaders(member));

      expect(res.status).toBe(200);
      expect(buildWorkingplanPdf).toHaveBeenCalledWith(
        expect.not.arrayContaining([expect.objectContaining({ description: 'Sollte fehlen' })]),
        expect.anything(),
        expect.anything(),
      );
    });
  });

  describe('POST /api/v1/events/:uuid/participants (Anmelden)', () => {
    it('lets a member register themselves', async () => {
      const member = await makeMember();
      const event = await createEvent(member.id);

      const res = await request(app).post(`/api/v1/events/${event.uuid}/participants`).set(authHeaders(member)).send({});

      expect(res.status).toBe(201);
      expect(res.body.user_uuid).toBe(member.uuid);
    });

    it('supports registering with festive_board', async () => {
      const member = await makeMember();
      const event = await createEvent(member.id);

      const res = await request(app)
        .post(`/api/v1/events/${event.uuid}/participants`)
        .set(authHeaders(member))
        .send({ festive_board: true });

      expect(res.status).toBe(201);
      expect(res.body.festive_board).toBe(true);
    });

    it('422s on a duplicate self-registration', async () => {
      const member = await makeMember();
      const event = await createEvent(member.id);

      await request(app).post(`/api/v1/events/${event.uuid}/participants`).set(authHeaders(member)).send({});
      const res = await request(app).post(`/api/v1/events/${event.uuid}/participants`).set(authHeaders(member)).send({});

      expect(res.status).toBe(422);
    });

    it('403s a plain member trying to register someone else', async () => {
      const member = await makeMember();
      const other = await makeMember();
      const event = await createEvent(member.id);

      const res = await request(app)
        .post(`/api/v1/events/${event.uuid}/participants`)
        .set(authHeaders(member))
        .send({ user_uuid: other.uuid });

      expect(res.status).toBe(403);
    });

    it('lets a WorkingPlanAdmin register another member on their behalf', async () => {
      const admin = await makeWorkingPlanAdmin();
      const other = await makeMember();
      const event = await createEvent(admin.id);

      const res = await request(app)
        .post(`/api/v1/events/${event.uuid}/participants`)
        .set(authHeaders(admin))
        .send({ user_uuid: other.uuid });

      expect(res.status).toBe(201);
      expect(res.body.user_uuid).toBe(other.uuid);
    });

    it('404s for an unknown event', async () => {
      const member = await makeMember();

      const res = await request(app).post(`/api/v1/events/${randomUUID()}/participants`).set(authHeaders(member)).send({});

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/events/:uuid/participants/:userUuid (Abmelden)', () => {
    it('lets a member remove their own registration', async () => {
      const member = await makeMember();
      const event = await createEvent(member.id);
      await request(app).post(`/api/v1/events/${event.uuid}/participants`).set(authHeaders(member)).send({});

      const res = await request(app).delete(`/api/v1/events/${event.uuid}/participants/${member.uuid}`).set(authHeaders(member));

      expect(res.status).toBe(204);
    });

    it('403s a plain member trying to remove someone else', async () => {
      const member = await makeMember();
      const other = await makeMember();
      const event = await createEvent(member.id);
      const now = new Date();
      await prisma.event_participants.create({ data: { user_id: other.id, event_id: event.id, created_at: now, updated_at: now } });

      const res = await request(app).delete(`/api/v1/events/${event.uuid}/participants/${other.uuid}`).set(authHeaders(member));

      expect(res.status).toBe(403);
    });

    it('404s when the participant row does not exist', async () => {
      const member = await makeMember();
      const event = await createEvent(member.id);

      const res = await request(app).delete(`/api/v1/events/${event.uuid}/participants/${member.uuid}`).set(authHeaders(member));

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/v1/events/defaults', () => {
    it('returns the configured location and duration for a user who can create events', async () => {
      const admin = await makeWorkingPlanAdmin();

      const res = await request(app).get('/api/v1/events/defaults').set(authHeaders(admin));

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ location: null, duration_minutes: 60 });
    });

    it('403s for a plain member with no create ability', async () => {
      const member = await makeMember();

      const res = await request(app).get('/api/v1/events/defaults').set(authHeaders(member));

      expect(res.status).toBe(403);
    });
  });

  // Net-new security tests (not in the Rails spec).
  describe('security', () => {
    it('authz boundary: a technically-valid token for a role that cannot manage Event gets 403 on create', async () => {
      // FileAdmin grants manage on Category/Directory/AttachedFile only - no
      // working_plan_admin_abilities, so it must not be able to create events.
      const fileAdmin = await makeFileAdmin();

      const res = await request(app)
        .post('/api/v1/events')
        .send({ title: 'Sneaky', date: '2026-08-01', time: '19:00' })
        .set(authHeaders(fileAdmin));

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'forbidden' });
      const created = await prisma.events.findFirst({ where: { title: 'Sneaky' } });
      expect(created).toBeNull();
    });

    it('is not vulnerable to SQL-metacharacter injection via the sort query param', async () => {
      const member = await makeMember();
      await createEvent(member.id, { title: 'Anton' });
      await createEvent(member.id, { title: 'Zebra' });

      const res = await request(app)
        .get('/api/v1/events')
        .query({ sort: "title'); DROP TABLE events; --", per_page: 100 })
        .set(authHeaders(member));

      // sort_clause only ever resolves to one of the three hardcoded
      // SORTABLE_COLUMNS - an unrecognized value falls back to the default
      // ('date' ascending) rather than erroring or reaching Prisma as raw
      // SQL, so this proves the value is never interpolated.
      expect(res.status).toBe(200);
      expect(res.body.row_count).toBeGreaterThanOrEqual(2);
      const stillThere = await prisma.events.count();
      expect(stillThere).toBeGreaterThanOrEqual(2);
    });
  });
});
