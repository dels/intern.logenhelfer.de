import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { users } from './generated/prisma/client.js';

import { app } from './app.js';
import { issueAccessToken } from './auth/jwt.js';
import { prisma } from './db.js';
import { resetDb } from '../test/helpers/db.js';
import { createUser } from '../test/helpers/factories.js';

describe('GET /healthz', () => {
  it('responds 200 "ok" when the DB is reachable', async () => {
    const res = await request(app).get('/healthz');

    expect(res.status).toBe(200);
    expect(res.text).toBe('ok');
  });

  it('responds 503 "db unavailable" when the DB query fails', async () => {
    const queryRawSpy = vi.spyOn(prisma, '$queryRaw').mockRejectedValueOnce(new Error('connection refused'));

    const res = await request(app).get('/healthz');

    expect(res.status).toBe(503);
    expect(res.text).toBe('db unavailable');

    queryRawSpy.mockRestore();
  });
});

describe('GET /api/v1/health', () => {
  afterEach(() => {
    delete process.env.GIT_HASH;
  });

  it('responds with status ok and a null revision when GIT_HASH is unset', async () => {
    delete process.env.GIT_HASH;

    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', revision: null, demo: false });
  });

  it('echoes GIT_HASH as the revision when it is set', async () => {
    process.env.GIT_HASH = 'abc1234';

    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', revision: 'abc1234', demo: false });
  });
});

describe('unknown routes', () => {
  it('respond 404', async () => {
    const res = await request(app).get('/does-not-exist');

    expect(res.status).toBe(404);
  });
});

// The tests above only cover /healthz and /api/v1/health, and every
// individual resource router's own test file (test/routes/*.test.ts)
// mounts its router into a bare, standalone `express()` app - not the real
// `app` exported from this file. That means none of those 330 tests ever
// exercise the ACTUAL integration this file is responsible for: the real
// `/api/v1` mount paths, helmet + cookie-parser sitting in front of them,
// and - most importantly - the globally-wired contract-validation
// middleware from middleware/contractValidation.ts, which only runs when a
// request goes through this file's `app.use('/api/v1', ...)` call. A
// misconfigured or overly strict/loose contractValidation setup would still
// show a fully green suite without a test like this one driving a real
// resource end-to-end through the real `app`.
describe('full app stack integration (real app.ts mounts + contract validation)', () => {
  beforeEach(async () => {
    await resetDb();
  });

  async function makeApplicationAdmin(): Promise<users> {
    const now = new Date();
    const role = await prisma.roles.create({
      data: { name: 'ApplicationAdmin', display_name: 'Kann Anwendung konfigurieren', created_at: now, updated_at: now },
    });
    const user = await createUser();
    await prisma.user_roles.create({
      data: { user_id: user.id, role_id: role.id, created_at: now, updated_at: now, role_added_at: now },
    });
    return user;
  }

  function authHeaders(user: users): { Authorization: string } {
    return { Authorization: `Bearer ${issueAccessToken(user.id)}` };
  }

  it('routes an authenticated request to the real districts router mounted at /api/v1/districts, through helmet + contract validation, and validates the response against the OpenAPI schema', async () => {
    const admin = await makeApplicationAdmin();

    const res = await request(app).get('/api/v1/districts').set(authHeaders(admin));

    // A schema mismatch here would surface as a 500 from the contract
    // validation middleware's response-validation chain, not a 200 with a
    // wrong body - so this assertion alone proves the middleware accepted a
    // real, valid response from a real mounted router.
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ rows: [] });
  });

  it('rejects an unauthenticated request to a real mounted resource route with 401, proving auth is wired at the app level (not just inside isolated router tests)', async () => {
    const res = await request(app).get('/api/v1/districts');

    // Caught here by the contract-validation middleware's own security-scheme
    // enforcement (openapi.yaml declares bearerAuth on this operation), which
    // fires before the request ever reaches districtsRouter's own
    // authenticateApiUser check - so this also confirms the OpenAPI security
    // requirement and the route-level auth middleware agree with each other
    // (both 401, same {error: 'unauthorized'} shape via apiErrorHandler's
    // openapi-validation-error mapping), just via two different code paths.
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ error: 'unauthorized' });
  });

  it('rejects a request body that violates the OpenAPI contract (wrong type) with 400 before it ever reaches the route handler', async () => {
    const admin = await makeApplicationAdmin();

    const res = await request(app)
      .post('/api/v1/districts')
      .set(authHeaders(admin))
      .send({ name: 12345 });

    // DistrictInput requires `name` to be a string; express-openapi-validator
    // should 400 this at the middleware layer. If the middleware were
    // missing or misconfigured (e.g. not actually applied to this path),
    // the request would instead reach the handler and either 201 or 422 -
    // not 400 - and this test would catch that regression.
    expect(res.status).toBe(400);

    const created = await prisma.districts.findFirst({ where: { name: '12345' } });
    expect(created).toBeNull();
  });

  it('creates a district end-to-end with a contract-valid request and response', async () => {
    const admin = await makeApplicationAdmin();

    const res = await request(app).post('/api/v1/districts').set(authHeaders(admin)).send({ name: 'Nordbezirk' });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(Number), name: 'Nordbezirk' });
  });
});
