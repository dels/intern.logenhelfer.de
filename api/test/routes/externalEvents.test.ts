import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { users } from '../../src/generated/prisma/client.js';

import { issueAccessToken } from '../../src/auth/jwt.js';
import { apiErrorHandler } from '../../src/lib/errors.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

vi.mock('../../src/lib/mail.js', () => ({ sendMail: vi.fn().mockResolvedValue(undefined) }));
const externalEventsRouter = (await import('../../src/routes/externalEvents.js')).default;

const app = express();
app.use(express.json());
app.use('/api/v1/external_events', externalEventsRouter);
app.use(apiErrorHandler);

function authHeaders(user: users): { Authorization: string } {
  return { Authorization: `Bearer ${issueAccessToken(user.id)}` };
}

let roleCounter = 0;

async function createRole(name: string): Promise<{ id: number; name: string | null }> {
  roleCounter += 1;
  const now = new Date();
  const existing = await prisma.roles.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.roles.create({ data: { name, display_name: name, created_at: now, updated_at: now } });
}

async function assignRole(userId: number, roleId: number): Promise<void> {
  const now = new Date();
  await prisma.user_roles.create({ data: { user_id: userId, role_id: roleId, created_at: now, updated_at: now, role_added_at: now } });
}

// createUser() from helpers/factories.ts leaves `uuid` unset (nullable
// column, no DB default) - fine for the pre-existing tests above, which
// never compare on a user uuid, but the participant routes below use
// `currentUser.uuid` for the self vs. on-behalf-of check, so these two
// helpers pass an explicit uuid.
async function makeMember(): Promise<users> {
  const role = await createRole('EnteredApprentice');
  const user = await createUser({ uuid: crypto.randomUUID() });
  await assignRole(user.id, role.id);
  return user;
}

async function makeSecretary(): Promise<users> {
  const role = await createRole('Secretary');
  const user = await createUser({ uuid: crypto.randomUUID() });
  await assignRole(user.id, role.id);
  return user;
}

async function createExternalEvent(overrides: Partial<{ title: string; host: string; location: string; created_by_id: number; deleted: boolean; date: Date; ics_source_id: number }> = {}) {
  const now = new Date();
  return prisma.external_events.create({
    data: {
      uuid: crypto.randomUUID(),
      title: 'Besuch bei Loge X',
      host: 'Loge X',
      location: 'Musterstadt',
      description: null,
      date: new Date(Date.UTC(2026, 7, 1)),
      time: new Date(Date.UTC(1970, 0, 1, 19, 0, 0)),
      created_by_id: overrides.created_by_id ?? 1,
      deleted: false,
      created_at: now,
      updated_at: now,
      ...overrides,
    },
  });
}

beforeEach(async () => {
  await resetDb();
});

describe('GET /api/v1/external_events', () => {
  it('lists undeleted events for any authenticated member', async () => {
    const member = await makeMember();
    await createExternalEvent({ created_by_id: member.id });
    const res = await request(app).get('/api/v1/external_events').set(authHeaders(member));
    expect(res.status).toBe(200);
    expect(res.body.row_count).toBe(1);
    expect(res.body.rows[0].title).toBe('Besuch bei Loge X');
  });

  it('excludes soft-deleted events', async () => {
    const member = await makeMember();
    await createExternalEvent({ created_by_id: member.id, deleted: true });
    const res = await request(app).get('/api/v1/external_events').set(authHeaders(member));
    expect(res.body.row_count).toBe(0);
  });

  it('401s when unauthenticated', async () => {
    const res = await request(app).get('/api/v1/external_events');
    expect(res.status).toBe(401);
  });

  it('filters by from/to date range', async () => {
    const member = await makeMember();
    await createExternalEvent({ created_by_id: member.id, date: new Date(Date.UTC(2026, 0, 15)) });
    await createExternalEvent({ created_by_id: member.id, date: new Date(Date.UTC(2026, 5, 15)) });
    const res = await request(app)
      .get('/api/v1/external_events?from=2026-01-01&to=2026-01-31')
      .set(authHeaders(member));
    expect(res.status).toBe(200);
    expect(res.body.row_count).toBe(1);
    expect(res.body.rows[0].date).toBe('2026-01-15');
  });

  it('an explicit from before yesterday still returns past events (unlike the no-params default)', async () => {
    const member = await makeMember();
    await createExternalEvent({ created_by_id: member.id, date: new Date(Date.UTC(2020, 0, 1)) });
    const res = await request(app)
      .get('/api/v1/external_events?from=2019-12-01&to=2020-12-31')
      .set(authHeaders(member));
    expect(res.status).toBe(200);
    expect(res.body.row_count).toBe(1);
  });

  it('exposes ics_source_uuid resolved from the internal ics_source_id', async () => {
    const member = await makeMember();
    const now = new Date();
    const source = await prisma.external_event_ics_sources.create({
      data: { uuid: crypto.randomUUID(), name: 'Nachbarloge', url: 'https://example.test/a.ics', created_by_id: member.id, deleted: false, created_at: now, updated_at: now },
    });
    await createExternalEvent({ created_by_id: member.id, ics_source_id: source.id });
    const res = await request(app).get('/api/v1/external_events').set(authHeaders(member));
    expect(res.status).toBe(200);
    expect(res.body.rows[0].ics_source_uuid).toBe(source.uuid);
  });

  it('ics_source_uuid is null for a manually-created event', async () => {
    const member = await makeMember();
    await createExternalEvent({ created_by_id: member.id });
    const res = await request(app).get('/api/v1/external_events').set(authHeaders(member));
    expect(res.status).toBe(200);
    expect(res.body.rows[0].ics_source_uuid).toBeNull();
  });
});

describe('POST /api/v1/external_events', () => {
  it('lets a Secretary create an event', async () => {
    const secretary = await makeSecretary();
    const res = await request(app)
      .post('/api/v1/external_events')
      .set(authHeaders(secretary))
      .send({ title: 'Fest', host: 'Loge Y', location: 'Berlin', date: '2026-09-01', time: '18:30' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Fest');
    expect(res.body.host).toBe('Loge Y');
  });

  it('403s for a plain member', async () => {
    const member = await makeMember();
    const res = await request(app)
      .post('/api/v1/external_events')
      .set(authHeaders(member))
      .send({ title: 'Fest', host: 'Loge Y', location: 'Berlin', date: '2026-09-01', time: '18:30' });
    expect(res.status).toBe(403);
  });

  it('422s when title is blank', async () => {
    const secretary = await makeSecretary();
    const res = await request(app)
      .post('/api/v1/external_events')
      .set(authHeaders(secretary))
      .send({ title: '', host: 'Loge Y', location: 'Berlin', date: '2026-09-01', time: '18:30' });
    expect(res.status).toBe(422);
    expect(res.body.detail).toContain('Titel');
  });

  it('creates an external event with an end_time and returns it', async () => {
    const secretary = await makeSecretary();

    const res = await request(app)
      .post('/api/v1/external_events')
      .send({ title: 'Besuch', host: 'Nachbarloge', location: 'Gastlogenhaus', date: '2026-09-01', time: '19:00', end_time: '22:00' })
      .set(authHeaders(secretary));

    expect(res.status).toBe(201);
    expect(res.body.time).toBe('19:00');
    expect(res.body.end_time).toBe('22:00');
  });

  it('rejects an end_time before time with a 422', async () => {
    const secretary = await makeSecretary();

    const res = await request(app)
      .post('/api/v1/external_events')
      .send({ title: 'Besuch', host: 'Nachbarloge', location: 'Gastlogenhaus', date: '2026-09-01', time: '19:00', end_time: '18:00' })
      .set(authHeaders(secretary));

    expect(res.status).toBe(422);
    expect(res.body.detail).toContain('Endzeit muss nach der Uhrzeit liegen');
  });
});

describe('GET /api/v1/external_events/defaults', () => {
  it('returns the configured location and duration for a user who can create external events', async () => {
    const secretary = await makeSecretary();

    const res = await request(app).get('/api/v1/external_events/defaults').set(authHeaders(secretary));

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ location: null, duration_minutes: 60 });
  });

  it('403s for a plain member with no create ability', async () => {
    const member = await makeMember();

    const res = await request(app).get('/api/v1/external_events/defaults').set(authHeaders(member));

    expect(res.status).toBe(403);
  });
});

describe('GET /api/v1/external_events/:uuid', () => {
  it('404s for an unknown uuid', async () => {
    const member = await makeMember();
    const res = await request(app).get('/api/v1/external_events/does-not-exist').set(authHeaders(member));
    expect(res.status).toBe(404);
  });

  it('resolves ics_source_uuid for an ICS-imported event', async () => {
    const member = await makeMember();
    const now = new Date();
    const source = await prisma.external_event_ics_sources.create({
      data: { uuid: crypto.randomUUID(), name: 'Nachbarloge', url: 'https://example.test/b.ics', created_by_id: member.id, deleted: false, created_at: now, updated_at: now },
    });
    const event = await createExternalEvent({ created_by_id: member.id, ics_source_id: source.id });
    const res = await request(app).get(`/api/v1/external_events/${event.uuid}`).set(authHeaders(member));
    expect(res.status).toBe(200);
    expect(res.body.ics_source_uuid).toBe(source.uuid);
  });

  it('returns the event with an empty participants list', async () => {
    const member = await makeMember();
    const event = await createExternalEvent({ created_by_id: member.id });
    const res = await request(app).get(`/api/v1/external_events/${event.uuid}`).set(authHeaders(member));
    expect(res.status).toBe(200);
    expect(res.body.participants).toEqual([]);
  });
});

describe('PATCH /api/v1/external_events/:uuid', () => {
  it('lets a Secretary update an event', async () => {
    const secretary = await makeSecretary();
    const event = await createExternalEvent({ created_by_id: secretary.id });
    const res = await request(app)
      .patch(`/api/v1/external_events/${event.uuid}`)
      .set(authHeaders(secretary))
      .send({ title: 'Neuer Titel' });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Neuer Titel');
  });

  it('403s for a plain member', async () => {
    const member = await makeMember();
    const event = await createExternalEvent({ created_by_id: member.id });
    const res = await request(app).patch(`/api/v1/external_events/${event.uuid}`).set(authHeaders(member)).send({ title: 'x' });
    expect(res.status).toBe(403);
  });

  it('422s when an ICS-imported event is edited directly', async () => {
    const secretary = await makeSecretary();
    const source = await prisma.external_event_ics_sources.create({
      data: { uuid: crypto.randomUUID(), name: 'Nachbarloge', url: 'https://example.test/cal.ics', created_by_id: secretary.id, deleted: false, created_at: new Date(), updated_at: new Date() },
    });
    const event = await createExternalEvent({ created_by_id: secretary.id });
    await prisma.external_events.update({ where: { id: event.id }, data: { ics_source_id: source.id, ics_uid: 'abc' } });
    const res = await request(app).patch(`/api/v1/external_events/${event.uuid}`).set(authHeaders(secretary)).send({ title: 'x' });
    expect(res.status).toBe(422);
  });
});

describe('DELETE /api/v1/external_events/:uuid', () => {
  it('soft-deletes for a Secretary', async () => {
    const secretary = await makeSecretary();
    const event = await createExternalEvent({ created_by_id: secretary.id });
    const res = await request(app).delete(`/api/v1/external_events/${event.uuid}`).set(authHeaders(secretary));
    expect(res.status).toBe(204);
    const reloaded = await prisma.external_events.findUnique({ where: { id: event.id } });
    expect(reloaded?.deleted).toBe(true);
  });

  it('403s for a plain member', async () => {
    const member = await makeMember();
    const event = await createExternalEvent({ created_by_id: member.id });
    const res = await request(app).delete(`/api/v1/external_events/${event.uuid}`).set(authHeaders(member));
    expect(res.status).toBe(403);
  });

  it('422s when an ICS-imported event is deleted directly', async () => {
    const secretary = await makeSecretary();
    const source = await prisma.external_event_ics_sources.create({
      data: { uuid: crypto.randomUUID(), name: 'Nachbarloge', url: 'https://example.test/cal.ics', created_by_id: secretary.id, deleted: false, created_at: new Date(), updated_at: new Date() },
    });
    const event = await createExternalEvent({ created_by_id: secretary.id });
    await prisma.external_events.update({ where: { id: event.id }, data: { ics_source_id: source.id, ics_uid: 'abc' } });
    const res = await request(app).delete(`/api/v1/external_events/${event.uuid}`).set(authHeaders(secretary));
    expect(res.status).toBe(422);
    const reloaded = await prisma.external_events.findUnique({ where: { id: event.id } });
    expect(reloaded?.deleted).toBe(false);
  });
});

describe('POST /api/v1/external_events/:uuid/participants (Anmelden)', () => {
  it('lets a member register themselves', async () => {
    const member = await makeMember();
    const event = await createExternalEvent({ created_by_id: 1 });
    const res = await request(app).post(`/api/v1/external_events/${event.uuid}/participants`).set(authHeaders(member)).send({});
    expect(res.status).toBe(201);
    expect(res.body.user_uuid).toBe(member.uuid);
    expect(res.body.subscription_confirmed).toBe(false);
  });

  it('supports registering with festive_board', async () => {
    const member = await makeMember();
    const event = await createExternalEvent({ created_by_id: 1 });
    const res = await request(app).post(`/api/v1/external_events/${event.uuid}/participants`).set(authHeaders(member)).send({ festive_board: true });
    expect(res.status).toBe(201);
    expect(res.body.festive_board).toBe(true);
  });

  it('422s on a duplicate self-registration', async () => {
    const member = await makeMember();
    const event = await createExternalEvent({ created_by_id: 1 });
    await request(app).post(`/api/v1/external_events/${event.uuid}/participants`).set(authHeaders(member)).send({});
    const res = await request(app).post(`/api/v1/external_events/${event.uuid}/participants`).set(authHeaders(member)).send({});
    expect(res.status).toBe(422);
  });

  it('403s a plain member trying to register someone else', async () => {
    const member = await makeMember();
    const other = await makeMember();
    const event = await createExternalEvent({ created_by_id: 1 });
    const res = await request(app)
      .post(`/api/v1/external_events/${event.uuid}/participants`)
      .set(authHeaders(member))
      .send({ user_uuid: other.uuid });
    expect(res.status).toBe(403);
  });

  it('lets a Secretary register another member on their behalf', async () => {
    const secretary = await makeSecretary();
    const other = await makeMember();
    const event = await createExternalEvent({ created_by_id: 1 });
    const res = await request(app)
      .post(`/api/v1/external_events/${event.uuid}/participants`)
      .set(authHeaders(secretary))
      .send({ user_uuid: other.uuid });
    expect(res.status).toBe(201);
    expect(res.body.user_uuid).toBe(other.uuid);
  });

  it('404s for an unknown event uuid', async () => {
    const member = await makeMember();
    const res = await request(app).post('/api/v1/external_events/nope/participants').set(authHeaders(member)).send({});
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/v1/external_events/:uuid/participants/:userUuid (Abmelden)', () => {
  it('lets a member remove their own registration', async () => {
    const member = await makeMember();
    const event = await createExternalEvent({ created_by_id: 1 });
    await request(app).post(`/api/v1/external_events/${event.uuid}/participants`).set(authHeaders(member)).send({});
    const res = await request(app).delete(`/api/v1/external_events/${event.uuid}/participants/${member.uuid}`).set(authHeaders(member));
    expect(res.status).toBe(204);
  });

  it('403s a plain member trying to remove someone else', async () => {
    const member = await makeMember();
    const other = await makeMember();
    const event = await createExternalEvent({ created_by_id: 1 });
    await prisma.external_event_participants.create({ data: { user_id: other.id, external_event_id: event.id, created_at: new Date(), updated_at: new Date() } });
    const res = await request(app).delete(`/api/v1/external_events/${event.uuid}/participants/${other.uuid}`).set(authHeaders(member));
    expect(res.status).toBe(403);
  });

  it('lets a Secretary remove another member', async () => {
    const secretary = await makeSecretary();
    const other = await makeMember();
    const event = await createExternalEvent({ created_by_id: 1 });
    await prisma.external_event_participants.create({ data: { user_id: other.id, external_event_id: event.id, created_at: new Date(), updated_at: new Date() } });
    const res = await request(app).delete(`/api/v1/external_events/${event.uuid}/participants/${other.uuid}`).set(authHeaders(secretary));
    expect(res.status).toBe(204);
  });

  it('404s when the participant row does not exist', async () => {
    const member = await makeMember();
    const event = await createExternalEvent({ created_by_id: 1 });
    const res = await request(app).delete(`/api/v1/external_events/${event.uuid}/participants/${member.uuid}`).set(authHeaders(member));
    expect(res.status).toBe(404);
  });
});

describe('POST /api/v1/external_events/:uuid/participants/:userUuid/confirm', () => {
  it('lets a Secretary confirm a registration', async () => {
    const secretary = await makeSecretary();
    const member = await makeMember();
    const event = await createExternalEvent({ created_by_id: 1 });
    await prisma.external_event_participants.create({ data: { user_id: member.id, external_event_id: event.id, created_at: new Date(), updated_at: new Date() } });
    const res = await request(app).post(`/api/v1/external_events/${event.uuid}/participants/${member.uuid}/confirm`).set(authHeaders(secretary));
    expect(res.status).toBe(200);
    expect(res.body.subscription_confirmed).toBe(true);
  });

  it('403s a member confirming their own registration', async () => {
    const member = await makeMember();
    const event = await createExternalEvent({ created_by_id: 1 });
    await prisma.external_event_participants.create({ data: { user_id: member.id, external_event_id: event.id, created_at: new Date(), updated_at: new Date() } });
    const res = await request(app).post(`/api/v1/external_events/${event.uuid}/participants/${member.uuid}/confirm`).set(authHeaders(member));
    expect(res.status).toBe(403);
  });
});
