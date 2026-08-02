import express from 'express';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { users } from '../../src/generated/prisma/client.js';

import { issueAccessToken } from '../../src/auth/jwt.js';
import { apiErrorHandler } from '../../src/lib/errors.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

vi.mock('../../src/lib/externalEventIcsSync.js', () => ({
  syncExternalEventIcsSource: vi.fn().mockResolvedValue({ created: 1, updated: 0, removed: 0 }),
}));
// assertSafeIcsUrl (called from the POST / create handler) resolves the
// URL's hostname via node:dns/promises' lookup - the fixture URLs below use
// the RFC 2606 example.test domain, which doesn't resolve in real DNS (and
// this test suite shouldn't depend on network access either way). Mock
// `lookup` to return a normal public-looking address by default, so the
// existing happy-path tests keep passing without a real DNS round trip; the
// SSRF-rejection test below overrides this per-call to a private address.
const dnsLookupMock = vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
vi.mock('node:dns/promises', () => ({ lookup: dnsLookupMock }));
const { syncExternalEventIcsSource } = await import('../../src/lib/externalEventIcsSync.js');
const icsSourcesRouter = (await import('../../src/routes/externalEventIcsSources.js')).default;

const app = express();
app.use(express.json());
app.use('/api/v1/external_event_ics_sources', icsSourcesRouter);
app.use(apiErrorHandler);

function authHeaders(user: users): { Authorization: string } {
  return { Authorization: `Bearer ${issueAccessToken(user.id)}` };
}

async function makeSecretary(): Promise<users> {
  const now = new Date();
  const role = await prisma.roles.create({ data: { name: 'Secretary', display_name: 'Secretary', created_at: now, updated_at: now } });
  const user = await createUser();
  await prisma.user_roles.create({ data: { user_id: user.id, role_id: role.id, created_at: now, updated_at: now, role_added_at: now } });
  return user;
}

async function makeMember(): Promise<users> {
  const now = new Date();
  const role = await prisma.roles.create({ data: { name: 'EnteredApprentice', display_name: 'EnteredApprentice', created_at: now, updated_at: now } });
  const user = await createUser();
  await prisma.user_roles.create({ data: { user_id: user.id, role_id: role.id, created_at: now, updated_at: now, role_added_at: now } });
  return user;
}

beforeEach(async () => {
  await resetDb();
  vi.mocked(syncExternalEventIcsSource).mockClear();
  dnsLookupMock.mockClear();
  dnsLookupMock.mockResolvedValue([{ address: '93.184.216.34', family: 4 }]);
});

describe('external event ICS sources', () => {
  it('lets a Secretary create a source', async () => {
    const secretary = await makeSecretary();
    const res = await request(app)
      .post('/api/v1/external_event_ics_sources')
      .set(authHeaders(secretary))
      .send({ name: 'Nachbarloge', url: 'https://example.test/cal.ics' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Nachbarloge');
  });

  it('422s creating a source whose URL resolves to a private address (SSRF guard)', async () => {
    dnsLookupMock.mockResolvedValueOnce([{ address: '10.0.0.5', family: 4 }]);
    const secretary = await makeSecretary();
    const res = await request(app)
      .post('/api/v1/external_event_ics_sources')
      .set(authHeaders(secretary))
      .send({ name: 'Böse Quelle', url: 'https://internal.example.test/cal.ics' });
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('unprocessable');
    const created = await prisma.external_event_ics_sources.findFirst({ where: { name: 'Böse Quelle' } });
    expect(created).toBeNull();
  });

  it('403s a plain member creating a source', async () => {
    const member = await makeMember();
    const res = await request(app)
      .post('/api/v1/external_event_ics_sources')
      .set(authHeaders(member))
      .send({ name: 'x', url: 'https://example.test/cal.ics' });
    expect(res.status).toBe(403);
  });

  it('lists sources for a Secretary', async () => {
    const secretary = await makeSecretary();
    await request(app).post('/api/v1/external_event_ics_sources').set(authHeaders(secretary)).send({ name: 'A', url: 'https://example.test/a.ics' });
    const res = await request(app).get('/api/v1/external_event_ics_sources').set(authHeaders(secretary));
    expect(res.status).toBe(200);
    expect(res.body.row_count).toBe(1);
  });

  it('defaults to sorting by name ascending', async () => {
    const secretary = await makeSecretary();
    await request(app).post('/api/v1/external_event_ics_sources').set(authHeaders(secretary)).send({ name: 'Zeta', url: 'https://example.test/z.ics' });
    await request(app).post('/api/v1/external_event_ics_sources').set(authHeaders(secretary)).send({ name: 'Alpha', url: 'https://example.test/a.ics' });
    const res = await request(app).get('/api/v1/external_event_ics_sources').set(authHeaders(secretary));
    expect(res.body.rows.map((r: { name: string }) => r.name)).toEqual(['Alpha', 'Zeta']);
  });

  it('sorts by url, ascending or descending, via ?sort=', async () => {
    const secretary = await makeSecretary();
    await request(app).post('/api/v1/external_event_ics_sources').set(authHeaders(secretary)).send({ name: 'Zeta', url: 'https://example.test/z.ics' });
    await request(app).post('/api/v1/external_event_ics_sources').set(authHeaders(secretary)).send({ name: 'Alpha', url: 'https://example.test/a.ics' });

    const asc = await request(app).get('/api/v1/external_event_ics_sources?sort=url').set(authHeaders(secretary));
    expect(asc.body.rows.map((r: { url: string }) => r.url)).toEqual(['https://example.test/a.ics', 'https://example.test/z.ics']);

    const desc = await request(app).get('/api/v1/external_event_ics_sources?sort=-url').set(authHeaders(secretary));
    expect(desc.body.rows.map((r: { url: string }) => r.url)).toEqual(['https://example.test/z.ics', 'https://example.test/a.ics']);
  });

  it('falls back to the default sort for an unknown/malicious ?sort= value, without erroring', async () => {
    const secretary = await makeSecretary();
    await request(app).post('/api/v1/external_event_ics_sources').set(authHeaders(secretary)).send({ name: 'Zeta', url: 'https://example.test/z.ics' });
    await request(app).post('/api/v1/external_event_ics_sources').set(authHeaders(secretary)).send({ name: 'Alpha', url: 'https://example.test/a.ics' });

    const res = await request(app).get('/api/v1/external_event_ics_sources?sort=deleted;DROP TABLE users;--').set(authHeaders(secretary));
    expect(res.status).toBe(200);
    expect(res.body.rows.map((r: { name: string }) => r.name)).toEqual(['Alpha', 'Zeta']);
  });

  it('deletes (soft) a source', async () => {
    const secretary = await makeSecretary();
    const created = await request(app).post('/api/v1/external_event_ics_sources').set(authHeaders(secretary)).send({ name: 'A', url: 'https://example.test/a.ics' });
    const res = await request(app).delete(`/api/v1/external_event_ics_sources/${created.body.uuid}`).set(authHeaders(secretary));
    expect(res.status).toBe(204);
  });

  it('triggers a manual sync', async () => {
    const secretary = await makeSecretary();
    const created = await request(app).post('/api/v1/external_event_ics_sources').set(authHeaders(secretary)).send({ name: 'A', url: 'https://example.test/a.ics' });
    const res = await request(app).post(`/api/v1/external_event_ics_sources/${created.body.uuid}/sync`).set(authHeaders(secretary));
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ created: 1, updated: 0, removed: 0 });
    expect(syncExternalEventIcsSource).toHaveBeenCalledTimes(1);
  });

  it('lets a Secretary edit a source\'s name and url', async () => {
    const secretary = await makeSecretary();
    const created = await request(app).post('/api/v1/external_event_ics_sources').set(authHeaders(secretary)).send({ name: 'A', url: 'https://example.test/a.ics' });
    const res = await request(app)
      .patch(`/api/v1/external_event_ics_sources/${created.body.uuid}`)
      .set(authHeaders(secretary))
      .send({ name: 'A (umbenannt)', url: 'https://example.test/a-neu.ics' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('A (umbenannt)');
    expect(res.body.url).toBe('https://example.test/a-neu.ics');

    const persisted = await prisma.external_event_ics_sources.findFirst({ where: { uuid: created.body.uuid } });
    expect(persisted?.name).toBe('A (umbenannt)');
    expect(persisted?.url).toBe('https://example.test/a-neu.ics');
  });

  it('403s a plain member editing a source', async () => {
    const secretary = await makeSecretary();
    const member = await makeMember();
    const created = await request(app).post('/api/v1/external_event_ics_sources').set(authHeaders(secretary)).send({ name: 'A', url: 'https://example.test/a.ics' });
    const res = await request(app)
      .patch(`/api/v1/external_event_ics_sources/${created.body.uuid}`)
      .set(authHeaders(member))
      .send({ name: 'B' });
    expect(res.status).toBe(403);
    const persisted = await prisma.external_event_ics_sources.findFirst({ where: { uuid: created.body.uuid } });
    expect(persisted?.name).toBe('A');
  });

  it('422s editing a source to a URL that resolves to a private address (SSRF guard)', async () => {
    const secretary = await makeSecretary();
    const created = await request(app).post('/api/v1/external_event_ics_sources').set(authHeaders(secretary)).send({ name: 'A', url: 'https://example.test/a.ics' });
    dnsLookupMock.mockResolvedValueOnce([{ address: '10.0.0.5', family: 4 }]);
    const res = await request(app)
      .patch(`/api/v1/external_event_ics_sources/${created.body.uuid}`)
      .set(authHeaders(secretary))
      .send({ url: 'https://internal.example.test/cal.ics' });
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('unprocessable');

    const persisted = await prisma.external_event_ics_sources.findFirst({ where: { uuid: created.body.uuid } });
    expect(persisted?.name).toBe('A');
    expect(persisted?.url).toBe('https://example.test/a.ics');
  });

  it('404s editing a nonexistent source', async () => {
    const secretary = await makeSecretary();
    const res = await request(app)
      .patch('/api/v1/external_event_ics_sources/00000000-0000-0000-0000-000000000000')
      .set(authHeaders(secretary))
      .send({ name: 'B' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/external_event_ics_sources/options', () => {
  // Uses makeMember() (assigns EnteredApprentice), not a bare createUser() -
  // buildAbility's defaultUserAbilities (which grants `index ExternalEvent`)
  // is only reached through a degree role's *_abilities method, and every
  // real member has one (see events.test.ts's makeMember() doc comment for
  // the same convention). A bare createUser() has zero roles and would 403
  // here regardless of this endpoint's own gate.
  it('lets a plain member list source uuid+name without url', async () => {
    const member = await makeMember();
    const now = new Date();
    await prisma.external_event_ics_sources.create({
      data: { uuid: randomUUID(), name: 'Loge Konkordia', url: 'https://example.test/cal.ics', created_by_id: 1, created_at: now, updated_at: now },
    });
    const res = await request(app).get('/api/v1/external_event_ics_sources/options').set(authHeaders(member));
    expect(res.status).toBe(200);
    expect(res.body.rows).toEqual([{ uuid: expect.any(String), name: 'Loge Konkordia' }]);
    expect(res.body.rows[0].url).toBeUndefined();
  });

  it('excludes deleted sources', async () => {
    const member = await makeMember();
    const now = new Date();
    await prisma.external_event_ics_sources.create({
      data: { uuid: randomUUID(), name: 'Gelöscht', url: 'https://example.test/cal.ics', created_by_id: 1, deleted: true, created_at: now, updated_at: now },
    });
    const res = await request(app).get('/api/v1/external_event_ics_sources/options').set(authHeaders(member));
    expect(res.status).toBe(200);
    expect(res.body.rows).toEqual([]);
  });
});
