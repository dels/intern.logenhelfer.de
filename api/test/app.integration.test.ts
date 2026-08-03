import { randomUUID } from 'node:crypto';

import bcrypt from 'bcryptjs';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticator } from 'otplib';
import sharp from 'sharp';

// The external-event-ICS-source create route validates its URL via
// assertSafeIcsUrl (SSRF guard - see safeIcsFetch.ts), which resolves the
// hostname through node:dns/promises' lookup. The fixture URL below uses the
// RFC 2606 example.test domain, which doesn't resolve in real DNS - mock
// `lookup` so this contract-validation test (which cares about request/
// response schema shape, not SSRF behavior) stays deterministic and
// offline-safe rather than depending on real network access.
vi.mock('node:dns/promises', () => ({ lookup: vi.fn().mockResolvedValue([{ address: '93.184.216.34', family: 4 }]) }));

import { app } from '../src/app.js';
import { issueAccessToken, issueMfaPendingToken } from '../src/auth/jwt.js';
import { prisma } from '../src/db.js';
import { syncAdminAccountFromEnv } from '../src/lib/adminAccount.js';
import { appConfig } from '../src/lib/appConfig.js';
import { encryptSecret } from '../src/lib/mfaEncryption.js';
import { resetDb } from './helpers/db.js';
import { createUser } from './helpers/factories.js';

// Integration coverage for app.ts itself - the thing every test/routes/*.ts
// file deliberately does NOT exercise (each builds its own standalone
// `express()` app around a single router, per that file's own top-of-file
// comment). None of those 300+ green tests would notice a router mounted at
// the wrong base path, contract-validation misbehaving globally, or the
// attached_files download exclusion regressing - only a test that goes
// through the real, fully-wired `app` can catch that class of bug. This file
// caught two real integration bugs on its first run (see git history):
//  - session.ts/me.ts are written to be mounted at bare `/api/v1` (their
//    routes already start with `/session`/`/me`); app.ts was mounting them at
//    `/api/v1/session`/`/api/v1/me`, double-prefixing every real path
//    (`/api/v1/session/session`, `/api/v1/me/me/password`, ...) and 404-ing.
//  - openapi/openapi.yaml's ExportRow schema used `nullable: true` on an
//    `allOf`-only property with no `type` alongside it, which crashes AJV
//    ("nullable cannot be used without type") the moment
//    createContractValidationMiddleware compiles the spec - taking down
//    *every* /api/v1 request, not just export endpoints, with a 500.

describe('app.ts integration', () => {
  beforeEach(async () => {
    await resetDb();
  });

  describe('resource router mounting', () => {
    // One *authenticated* smoke request per mounted resource, hit through the
    // real `app` at exactly the path openapi/openapi.yaml declares. Deliberately
    // NOT an unauthenticated request: openapi.yaml's security scheme makes
    // createContractValidationMiddleware itself reject a missing/malformed
    // Authorization header before the request ever reaches Express's routing,
    // which would make an unauthenticated 401 pass regardless of whether the
    // router is mounted correctly underneath - the exact false-negative this
    // suite must not have (a genuinely mis-mounted or double-prefixed route
    // must fall through to Express's own unstyled, non-JSON 404, which a
    // valid token doesn't stop from happening).
    async function authHeader(): Promise<{ Authorization: string }> {
      const user = await createUser();
      return { Authorization: `Bearer ${issueAccessToken(user.id)}` };
    }

    const cases: Array<{ name: string; method: 'get' | 'post' | 'delete'; path: string }> = [
      { name: 'me', method: 'get', path: '/api/v1/me' },
      { name: 'events', method: 'get', path: '/api/v1/events' },
      { name: 'seekers', method: 'get', path: '/api/v1/seekers' },
      { name: 'roles', method: 'get', path: '/api/v1/roles' },
      { name: 'categories', method: 'get', path: '/api/v1/categories' },
      { name: 'directories', method: 'get', path: '/api/v1/directories' },
      { name: 'attached_files', method: 'get', path: '/api/v1/attached_files' },
      { name: 'districts', method: 'get', path: '/api/v1/districts' },
      { name: 'academic_titles', method: 'get', path: '/api/v1/academic_titles' },
      { name: 'lodges', method: 'get', path: '/api/v1/lodges' },
      { name: 'officers', method: 'get', path: '/api/v1/officers' },
      { name: 'announcements', method: 'get', path: '/api/v1/announcements' },
      { name: 'statistics user_stats', method: 'get', path: '/api/v1/statistics/user_stats' },
      { name: 'app_config', method: 'get', path: '/api/v1/app_config' },
    ];

    it.each(cases)('$name is routed (not a raw Express 404) at $path', async ({ method, path }) => {
      const res = await request(app)[method](path).set(await authHeader());

      // A correctly-routed request lands in the resource's own handler,
      // which always answers in JSON (200 on success, or a 403/422/etc our
      // own authz/validation code produces) - never Express's bare
      // "Cannot GET/POST ..." text/html 404, which is what a missing or
      // mis-prefixed mount produces instead.
      expect(res.status).not.toBe(404);
      expect(res.headers['content-type']).toMatch(/json/);
    });

    // session.ts/public.ts intentionally skip auth (`security: []` in
    // openapi.yaml) - they can't use the authenticated-smoke-test shape
    // above, so each gets a request shaped to satisfy contract validation on
    // its own terms (a valid request body where one's required) and checked
    // directly.
    it('POST /api/v1/session (login) is routed, not double-prefixed', async () => {
      const res = await request(app).post('/api/v1/session').send({ email: 'nobody@example.test', password: 'wrong' });

      // Wrong credentials against a real, reachable handler still means
      // "routed" - the discriminating failure mode here is a raw 404, which
      // is what `/api/v1/session/session` (the double-prefixed path) would
      // 404 as instead.
      expect(res.status).not.toBe(404);
      expect(res.headers['content-type']).toMatch(/json/);
    });

    it('POST /api/v1/session/refresh is routed, not double-prefixed', async () => {
      const res = await request(app).post('/api/v1/session/refresh');

      expect(res.status).not.toBe(404);
      expect(res.headers['content-type']).toMatch(/json/);
    });

    it('DELETE /api/v1/session (logout) is routed, not double-prefixed', async () => {
      const res = await request(app).delete('/api/v1/session');

      expect(res.status).not.toBe(404);
    });

    it('public landing is routed at /api/v1/public/landing', async () => {
      const res = await request(app).get('/api/v1/public/landing');

      expect(res.status).not.toBe(404);
      expect(res.headers['content-type']).toMatch(/json/);
    });
  });

  describe('global contract validation on /api/v1', () => {
    // updateRole requires ability.can('manage', 'Role'), granted only via
    // ApplicationAdmin (see src/authz/ability.ts) - needed so the
    // "schema-valid request" case actually reaches the handler (200) instead
    // of getting stopped earlier by an authz 403, which would leave the
    // contract-validation-passthrough behavior unverified.
    async function adminAuthHeader(): Promise<{ Authorization: string }> {
      const now = new Date();
      const adminRole = await prisma.roles.create({
        data: { name: 'ApplicationAdmin', display_name: 'Admin', created_at: now, updated_at: now },
      });
      const user = await createUser();
      await prisma.user_roles.create({ data: { user_id: user.id, role_id: adminRole.id, created_at: now, updated_at: now, role_added_at: now } });
      return { Authorization: `Bearer ${issueAccessToken(user.id)}` };
    }

    it('rejects a request body with properties the schema does not allow, as a 400 (not a masked 500)', async () => {
      const now = new Date();
      const role = await prisma.roles.create({ data: { name: 'Secretary', display_name: 'Sekretär', created_at: now, updated_at: now } });

      const res = await request(app)
        .patch(`/api/v1/roles/${role.id}`)
        .set(await adminAuthHeader())
        .send({ email: 'x@example.com', bogus_extra_field: 'nope' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('bad_request');
    });

    it('lets a schema-valid request through unaffected', async () => {
      const now = new Date();
      const role = await prisma.roles.create({ data: { name: 'Secretary', display_name: 'Sekretär', created_at: now, updated_at: now } });

      const res = await request(app)
        .patch(`/api/v1/roles/${role.id}`)
        .set(await adminAuthHeader())
        .send({ email: 'x@example.com' });

      expect(res.status).toBe(200);
    });

    // Regression guard: express-openapi-validator rejects ANY query
    // parameter sent as an empty string (e.g. `?search=`) with a 400 unless
    // that parameter is explicitly marked `allowEmptyValue: true` in
    // openapi.yaml. The Members list page (app/src/features/members/api.ts'
    // useMembers) always sends `search=<encodeURIComponent(search)>` even
    // when the search box is empty, so every initial page load 400'd. Only
    // catchable through the real, fully-wired `app` (test/routes/
    // members.test.ts mounts membersRouter standalone, bypassing
    // createContractValidationMiddleware entirely - it never saw this).
    it('lets GET /api/v1/members?search= (empty string) through unaffected, not a 400', async () => {
      const user = await createUser();

      const res = await request(app)
        .get('/api/v1/members')
        .query({ search: '' })
        .set({ Authorization: `Bearer ${issueAccessToken(user.id)}` });

      expect(res.status).not.toBe(400);
      expect(res.status).toBe(200);
    });

    // Regression guard for a bug the standalone externalEvents.test.ts (which
    // mounts only the router, bypassing createContractValidationMiddleware
    // entirely) could not have caught: ExternalEventInput previously declared
    // `required: [title, host, location, date, time]` in openapi.yaml, a
    // schema shared by both POST and PATCH. Since PATCH's own handler
    // correctly implements partial-update semantics, that `required` list
    // meant a single-field PATCH body was rejected by the openapi validator
    // before ever reaching the handler - only visible when going through the
    // real, fully-wired `app`.
    it('lets a single-field PATCH body through /api/v1/external_events/{uuid} unaffected by contract validation', async () => {
      const now = new Date();
      const role = await prisma.roles.create({ data: { name: 'Secretary', display_name: 'Sekretär', created_at: now, updated_at: now } });
      const user = await createUser();
      await prisma.user_roles.create({ data: { user_id: user.id, role_id: role.id, created_at: now, updated_at: now, role_added_at: now } });
      const event = await prisma.external_events.create({
        data: {
          uuid: randomUUID(),
          title: 'Besuch bei Loge X',
          host: 'Loge X',
          location: 'Musterstadt',
          description: null,
          date: new Date(Date.UTC(2026, 7, 1)),
          time: new Date(Date.UTC(1970, 0, 1, 19, 0, 0)),
          created_by_id: user.id,
          deleted: false,
          created_at: now,
          updated_at: now,
        },
      });

      const res = await request(app)
        .patch(`/api/v1/external_events/${event.uuid}`)
        .set({ Authorization: `Bearer ${issueAccessToken(user.id)}` })
        .send({ title: 'x' });

      // The point of this assertion is narrowly "not a contract-validation
      // 400" - a 401/403/404 from this route's own authz/lookup logic would
      // be fine too, but a 400 here means the openapi schema is still too
      // strict for PATCH's partial-update semantics.
      expect(res.status).not.toBe(400);
      expect(res.status).toBe(200);
    });
  });

  // Task 3's participant-registration routes are otherwise only exercised
  // against a standalone `express()` app in externalEvents.test.ts (26/26
  // passing), never through the real, fully-wired `app` -
  // createContractValidationMiddleware sees additionalProperties: false /
  // required: [...] on both the request body (registerExternalEventParticipant)
  // and the ExternalEventParticipant response schema; a router-only test
  // can't catch a mismatch there. Modeled on the single-field-PATCH
  // regression guard above - same class of bug, different route family.
  describe('participant registration routes contract validation', () => {
    async function createExternalEvent(createdById: number) {
      const now = new Date();
      return prisma.external_events.create({
        data: {
          uuid: randomUUID(),
          title: 'Besuch bei Loge X',
          host: 'Loge X',
          location: 'Musterstadt',
          description: null,
          date: new Date(Date.UTC(2026, 7, 1)),
          time: new Date(Date.UTC(1970, 0, 1, 19, 0, 0)),
          created_by_id: createdById,
          deleted: false,
          created_at: now,
          updated_at: now,
        },
      });
    }

    it('POST /api/v1/external_events/{uuid}/participants (self-registration) passes contract validation and returns 201', async () => {
      const member = await createUser({ uuid: randomUUID() });
      const event = await createExternalEvent(member.id);

      const res = await request(app)
        .post(`/api/v1/external_events/${event.uuid}/participants`)
        .set({ Authorization: `Bearer ${issueAccessToken(member.id)}` })
        .send({});

      // A schema-validation failure on either the request body or the
      // ExternalEventParticipant response would surface as a 400 from
      // express-openapi-validator, not from this route's own handler - the
      // narrow thing this test guards against.
      expect(res.status).not.toBe(400);
      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        user_uuid: member.uuid,
        fullname: '',
        festive_board: false,
        subscription_confirmed: false,
      });
    });

    it('POST /api/v1/external_events/{uuid}/participants/{userUuid}/confirm (admin) passes contract validation and returns 200', async () => {
      const now = new Date();
      const secretaryRole = await prisma.roles.create({
        data: { name: 'Secretary', display_name: 'Sekretär', created_at: now, updated_at: now },
      });
      const secretary = await createUser({ uuid: randomUUID() });
      await prisma.user_roles.create({ data: { user_id: secretary.id, role_id: secretaryRole.id, created_at: now, updated_at: now, role_added_at: now } });

      const member = await createUser({ uuid: randomUUID() });
      const event = await createExternalEvent(secretary.id);
      await prisma.external_event_participants.create({
        data: { user_id: member.id, external_event_id: event.id, created_at: now, updated_at: now },
      });

      const res = await request(app)
        .post(`/api/v1/external_events/${event.uuid}/participants/${member.uuid}/confirm`)
        .set({ Authorization: `Bearer ${issueAccessToken(secretary.id)}` });

      expect(res.status).not.toBe(400);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        user_uuid: member.uuid,
        fullname: '',
        festive_board: false,
        subscription_confirmed: true,
      });
    });

    it('DELETE /api/v1/external_events/{uuid}/participants/{userUuid} (self-unregister) passes contract validation and returns 204', async () => {
      const member = await createUser({ uuid: randomUUID() });
      const event = await createExternalEvent(member.id);
      const now = new Date();
      await prisma.external_event_participants.create({
        data: { user_id: member.id, external_event_id: event.id, created_at: now, updated_at: now },
      });

      const res = await request(app)
        .delete(`/api/v1/external_events/${event.uuid}/participants/${member.uuid}`)
        .set({ Authorization: `Bearer ${issueAccessToken(member.id)}` });

      expect(res.status).not.toBe(400);
      expect(res.status).toBe(204);
    });
  });

  // Task 2's internal-event participant-registration routes, same
  // regression-guard shape as the external-events block above: a
  // router-only test (events.test.ts) can't catch a mismatch between the
  // route's actual response and openapi.yaml's EventParticipant schema /
  // registerEventParticipant request-body schema.
  describe('internal event participant registration routes contract validation', () => {
    async function createInternalEvent(createdById: number) {
      const now = new Date();
      return prisma.events.create({
        data: {
          uuid: randomUUID(),
          title: 'Loge',
          date: new Date(Date.UTC(2026, 7, 1)),
          time: new Date(Date.UTC(1970, 0, 1, 19, 0, 0)),
          whole_day: false,
          created_by_id: createdById,
          created_at: now,
          updated_at: now,
        },
      });
    }

    it('POST /api/v1/events/{uuid}/participants (self-registration) passes contract validation and returns 201', async () => {
      const member = await createUser({ uuid: randomUUID() });
      const event = await createInternalEvent(member.id);

      const res = await request(app)
        .post(`/api/v1/events/${event.uuid}/participants`)
        .set({ Authorization: `Bearer ${issueAccessToken(member.id)}` })
        .send({});

      // A schema-validation failure on either the request body or the
      // EventParticipant response would surface as a 400 from
      // express-openapi-validator, not from this route's own handler - the
      // narrow thing this test guards against.
      expect(res.status).not.toBe(400);
      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        user_uuid: member.uuid,
        fullname: '',
        festive_board: false,
      });
    });

    it('DELETE /api/v1/events/{uuid}/participants/{userUuid} (self-unregister) passes contract validation and returns 204', async () => {
      const member = await createUser({ uuid: randomUUID() });
      const event = await createInternalEvent(member.id);
      const now = new Date();
      await prisma.event_participants.create({
        data: { user_id: member.id, event_id: event.id, created_at: now, updated_at: now },
      });

      const res = await request(app)
        .delete(`/api/v1/events/${event.uuid}/participants/${member.uuid}`)
        .set({ Authorization: `Bearer ${issueAccessToken(member.id)}` });

      expect(res.status).not.toBe(400);
      expect(res.status).toBe(204);
    });
  });

  // Task 5's admin CRUD for ICS source URLs is otherwise only exercised
  // against a standalone `express()` app in externalEventIcsSources.test.ts -
  // never through the real, fully-wired `app`. Modeled on the same
  // regression-guard shape as the participant-registration block above:
  // createContractValidationMiddleware sees additionalProperties: false /
  // required: [name, url] on the request body
  // (ExternalEventIcsSourceInput) and on the ExternalEventIcsSource response
  // schema; a router-only test can't catch a mismatch there. The route
  // handler itself never calls the network - `syncExternalEventIcsSource`
  // (and the `fetch` it's handed) is only reached via the separate
  // POST /:uuid/sync route, not exercised here, so no fetch mocking is
  // needed for this create-only case.
  describe('external event ICS sources contract validation', () => {
    async function secretaryAuthHeader(): Promise<{ Authorization: string }> {
      const now = new Date();
      const role = await prisma.roles.create({ data: { name: 'Secretary', display_name: 'Sekretär', created_at: now, updated_at: now } });
      const user = await createUser();
      await prisma.user_roles.create({ data: { user_id: user.id, role_id: role.id, created_at: now, updated_at: now, role_added_at: now } });
      return { Authorization: `Bearer ${issueAccessToken(user.id)}` };
    }

    it('POST /api/v1/external_event_ics_sources passes contract validation and returns 201', async () => {
      const res = await request(app)
        .post('/api/v1/external_event_ics_sources')
        .set(await secretaryAuthHeader())
        .send({ name: 'Nachbarloge', url: 'https://example.test/cal.ics' });

      // A schema-validation failure on either the request body or the
      // ExternalEventIcsSource response would surface as a 400 from
      // express-openapi-validator, not from this route's own handler - the
      // narrow thing this test guards against.
      expect(res.status).not.toBe(400);
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: 'Nachbarloge', url: 'https://example.test/cal.ics' });
    });

    it('rejects a request body missing both name and url as a 400 (not a masked 500)', async () => {
      const res = await request(app)
        .post('/api/v1/external_event_ics_sources')
        .set(await secretaryAuthHeader())
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('bad_request');
    });
  });

  describe('attached_files download exclusion', () => {
    it('streams binary bytes through the real app without response-contract validation rejecting them', async () => {
      const now = new Date();
      const role = await prisma.roles.create({
        data: { name: 'EnteredApprentice', display_name: 'Lehrling', created_at: now, updated_at: now },
      });
      const user = await createUser();
      await prisma.user_roles.create({ data: { user_id: user.id, role_id: role.id, created_at: now, updated_at: now, role_added_at: now } });

      const category = await prisma.categories.create({
        data: { name: 'Cat', slug: `cat-${randomUUID()}`, deleted: false, created_at: now, updated_at: now },
      });
      const directory = await prisma.directories.create({
        data: { name: 'Dir', category_id: category.id, slug: `dir-${randomUUID()}`, deleted: false, created_at: now, updated_at: now },
      });
      const file = await prisma.attached_files.create({
        data: {
          uuid: randomUUID(),
          filename: 'x.pdf',
          // The stored content_type (application/pdf) deliberately does not
          // match openapi.yaml's declared application/octet-stream response
          // for this endpoint - that mismatch is exactly what the exclusion
          // must tolerate; without it, express-openapi-validator's response
          // validator would reject this as a schema violation.
          content_type: 'application/pdf',
          content: Buffer.from('PDF-BYTES'),
          content_length: 9,
          directory_id: directory.id,
          uploader_id: user.id,
          deleted: false,
          created_at: now,
          updated_at: now,
        },
      });
      await prisma.attached_file_roles.create({ data: { attached_file_id: file.id, role_id: role.id, created_at: now, updated_at: now } });

      const res = await request(app)
        .get(`/api/v1/attached_files/${file.uuid}/download`)
        .set('Authorization', `Bearer ${issueAccessToken(user.id)}`);

      expect(res.status).toBe(200);
      expect(Buffer.isBuffer(res.body) ? res.body.toString() : res.text).toBe('PDF-BYTES');
    });
  });

  // Regression guard: express-openapi-validator's own default when no
  // `fileUploader` option is passed at all is `{}` (see
  // openapi.validator.js's constructor), which flows into
  // `multer(options.multerOpts)` with no `limits` object - multer/busboy's
  // own unconfigured default is `fileSize: Infinity`, i.e. NO size limit.
  // Confirmed empirically: before contractValidation.ts's fileUploader
  // option existed, a 22MB multipart upload through this exact route
  // returned 201 (fully buffered and persisted) instead of being rejected.
  // Only reachable through the real, fully-wired `app` - attachedFiles.
  // test.ts mounts attachedFilesRouter standalone with no
  // express-openapi-validator in front, so it can never exercise this
  // multer-level limit at all.
  describe('multipart upload size limit (contract validation)', () => {
    async function fileAdminAuthHeader(): Promise<{ Authorization: string }> {
      const now = new Date();
      const role = await prisma.roles.create({ data: { name: 'Secretary', display_name: 'Sekretär', created_at: now, updated_at: now } });
      const user = await createUser();
      await prisma.user_roles.create({ data: { user_id: user.id, role_id: role.id, created_at: now, updated_at: now, role_added_at: now } });
      return { Authorization: `Bearer ${issueAccessToken(user.id)}` };
    }

    async function createDirectory(): Promise<{ slug: string | null }> {
      const now = new Date();
      const category = await prisma.categories.create({
        data: { name: 'Cat', slug: `cat-${randomUUID()}`, deleted: false, created_at: now, updated_at: now },
      });
      return prisma.directories.create({
        data: { name: 'Dir', category_id: category.id, slug: `dir-${randomUUID()}`, deleted: false, created_at: now, updated_at: now },
      });
    }

    it('rejects a multipart file upload over the configured limit with 413, not a buffered 201', async () => {
      const directory = await createDirectory();
      const oversizedFile = Buffer.alloc(21 * 1024 * 1024, 'a'); // 21MB > MULTIPART_FILE_SIZE_LIMIT_BYTES (20MB)

      const res = await request(app)
        .post('/api/v1/attached_files')
        .set(await fileAdminAuthHeader())
        .field('directory_slug', directory.slug!)
        .attach('file', oversizedFile, 'big.bin');

      expect(res.status).toBe(413);
      expect(res.body).toEqual({ error: 'payload_too_large', detail: expect.any(String) });
    });

    it('still accepts a multipart file upload at/under the configured limit', async () => {
      const directory = await createDirectory();

      const res = await request(app)
        .post('/api/v1/attached_files')
        .set(await fileAdminAuthHeader())
        .field('directory_slug', directory.slug!)
        .attach('file', Buffer.from('small file contents'), 'small.txt');

      expect(res.status).toBe(201);
      expect(res.body.filename).toBe('small.txt');
    });
  });

  // Regression guard: FileCreatePage's real upload (app/src/features/files/api.ts)
  // sends selected roles as repeated `role_ids[]` multipart fields, not a
  // single JSON-encoded `role_ids` field. Only a test going through the real
  // `app` (with express-openapi-validator's multipart handling in front, not
  // attachedFiles.test.ts's standalone router mount) can see this: EOV's
  // openapi.request.validator.js `multipartNested` step JSON.parses any
  // multipart field whose schema type is array/object. multer (via
  // append-field) turns exactly one `role_ids[]` occurrence into a
  // *one-element array* (`['5']`); `JSON.parse` coerces that array to a
  // string first (`String(['5']) === '5'`), then parses `'5'` as the
  // *number* 5, silently replacing the array with a scalar - so the ajv
  // schema check `role_ids: { type: array }` then fails with "must be
  // array". Two-or-more roles happen to survive by accident (the
  // comma-joined string, e.g. '5,6', isn't valid JSON, so JSON.parse throws
  // and the original array is left alone) - which is why this only reproduces
  // with exactly one role selected.
  describe('multipart role_ids[] (contract validation)', () => {
    async function fileAdminAuthHeader(): Promise<{ Authorization: string }> {
      const now = new Date();
      const role = await prisma.roles.create({ data: { name: 'Secretary', display_name: 'Sekretär', created_at: now, updated_at: now } });
      const user = await createUser();
      await prisma.user_roles.create({ data: { user_id: user.id, role_id: role.id, created_at: now, updated_at: now, role_added_at: now } });
      return { Authorization: `Bearer ${issueAccessToken(user.id)}` };
    }

    async function createDirectory(): Promise<{ slug: string | null }> {
      const now = new Date();
      const category = await prisma.categories.create({
        data: { name: 'Cat', slug: `cat-${randomUUID()}`, deleted: false, created_at: now, updated_at: now },
      });
      return prisma.directories.create({
        data: { name: 'Dir', category_id: category.id, slug: `dir-${randomUUID()}`, deleted: false, created_at: now, updated_at: now },
      });
    }

    it('accepts a file upload with exactly one role_ids[] field, matching the real frontend request shape', async () => {
      const directory = await createDirectory();
      const now = new Date();
      const assignableRole = await prisma.roles.create({ data: { name: 'NetDelegate', display_name: 'Netzwart', created_at: now, updated_at: now } });

      const res = await request(app)
        .post('/api/v1/attached_files')
        .set(await fileAdminAuthHeader())
        .field('directory_slug', directory.slug!)
        .field('role_ids[]', String(assignableRole.id))
        .attach('file', Buffer.from('one role selected'), 'one-role.txt');

      expect(res.status).toBe(201);
      expect(res.body.role_ids).toEqual([assignableRole.id]);
    });

    it('accepts a file upload with two role_ids[] fields, matching the real frontend request shape', async () => {
      const directory = await createDirectory();
      const now = new Date();
      const roleA = await prisma.roles.create({ data: { name: 'NetDelegate', display_name: 'Netzwart', created_at: now, updated_at: now } });
      const roleB = await prisma.roles.create({ data: { name: 'UserAdmin', display_name: 'Nutzerverwaltung', created_at: now, updated_at: now } });

      const res = await request(app)
        .post('/api/v1/attached_files')
        .set(await fileAdminAuthHeader())
        .field('directory_slug', directory.slug!)
        .field('role_ids[]', [String(roleA.id), String(roleB.id)])
        .attach('file', Buffer.from('two roles selected'), 'two-roles.txt');

      expect(res.status).toBe(201);
      expect(res.body.role_ids.sort()).toEqual([roleA.id, roleB.id].sort());
    });
  });

  // custom_logos (id=1) is written by main's POST /api/v1/logo
  // (api/src/routes/logo.ts on main) - not part of this branch (see
  // public.ts's own header comment). This branch owns only the read side:
  // deriving PWA icon variants from whatever row is there. So this
  // integration test seeds the row directly via Prisma (mirroring how
  // test/routes/logo.test.ts on main asserts storage - `prisma.custom_logos`
  // - rather than going through a POST /api/v1/logo this worktree doesn't
  // have) and confirms the real, fully-wired `app` derives and serves the
  // correct icon variant from it end-to-end.
  describe('public icon derivation reflects a stored custom_logos row (contract validation)', () => {
    // A distinctive solid fill, not anything resembling the bundled default
    // crest - so a regression that silently ignores the stored row and
    // always serves the default would fail on pixel color even though a
    // dimensions-only assertion would still pass.
    async function sampleLogo(): Promise<Buffer> {
      return sharp({ create: { width: 300, height: 300, channels: 3, background: '#123456' } }).png().toBuffer();
    }

    it('derives and serves the correct icon variant for the currently stored logo', async () => {
      const content = await sampleLogo();
      await prisma.custom_logos.upsert({
        where: { id: 1 },
        create: { id: 1, content: new Uint8Array(content), content_type: 'image/png' },
        update: { content: new Uint8Array(content), content_type: 'image/png' },
      });

      const icon = await request(app).get('/api/v1/public/logo/icon-512.png');
      expect(icon.status).toBe(200);
      expect(icon.headers['content-type']).toContain('image/png');
      await expect(sharp(icon.body).metadata()).resolves.toMatchObject({ width: 512, height: 512 });

      // Proves the icon was actually derived FROM the stored row, not just
      // correctly-sized-but-wrong-content.
      const { data } = await sharp(icon.body).raw().toBuffer({ resolveWithObject: true });
      expect([data[0], data[1], data[2]]).toEqual([0x12, 0x34, 0x56]);
    });
  });

  // Regression guard for a security-audit finding: app.ts never called
  // `app.set('trust proxy', ...)`. This app sits behind exactly three
  // reverse-proxy hops in production (host nginx -> edge -> app-container
  // nginx -> this container), all of which forward `X-Forwarded-For`. Without
  // `trust proxy` configured, Express's own req.ip
  // resolution (see node_modules/express/lib/request.js's `ip` getter, backed
  // by the `proxyaddr` package) ignores `X-Forwarded-For` entirely and always
  // returns `req.socket.remoteAddress` - the *proxy's* address, identical for
  // every caller - so express-rate-limit's default keyGenerator (which keys
  // solely on `request.ip`) buckets every real client behind the shared
  // proxy into one single per-IP rate-limit bucket. (express-rate-limit v8
  // does notice the mismatch - `validations.xForwardedForHeader` in
  // node_modules/express-rate-limit/dist/index.cjs detects an
  // `X-Forwarded-For` header with `trust proxy` still `false` - but only
  // logs a console.error, it does not throw/abort the request, so this
  // doesn't surface as a 500; it silently collapses rate-limit buckets
  // instead, exactly the "one attacker locks out every user" finding.) Only
  // reachable through the real, fully-wired `app` (loginRateLimiter is
  // exercised via the mounted session router; session.test.ts's own
  // standalone app never mounts app.ts, so it can't catch this class of bug).
  describe('csv_export_data contract validation with a null member name', () => {
    it('returns 200 (not a 500) when a member has null firstname/lastname', async () => {
      const now = new Date();
      const councilRole = await prisma.roles.create({
        data: { name: 'MemberOfCouncil', display_name: 'Beamtenrat', created_at: now, updated_at: now },
      });
      const caller = await createUser({ uuid: randomUUID() });
      await prisma.user_roles.create({
        data: { user_id: caller.id, role_id: councilRole.id, created_at: now, updated_at: now, role_added_at: now },
      });
      // createUser() leaves firstname/lastname at their schema default (null,
      // since neither column has a Prisma @default) - exactly the condition
      // that previously made openapi.yaml's CsvExportRow schema (lastname/
      // firstname both declared as non-nullable `string`) reject the real
      // response with a 500, since response validation is enabled for this
      // path (see contractValidation.ts's excludeResponseValidationPaths,
      // which does not list this route). uuid is overridden here (unlike the
      // caller above) only to isolate that null-name failure from a second,
      // unrelated one: `uuid` is also nullable with no Prisma @default, so an
      // unoverridden createUser() fails contract validation on `uuid` first
      // (AJV reports only the first property violation per object, in
      // schema-property order - uuid before lastname/firstname), which would
      // mask the bug this test targets.
      await createUser({ uuid: randomUUID() });

      const res = await request(app)
        .get('/api/v1/members/csv_export_data')
        .set({ Authorization: `Bearer ${issueAccessToken(caller.id)}` });

      expect(res.status).toBe(200);
      const rows = res.body.rows as Array<Record<string, unknown>>;
      expect(rows.some((r) => r.lastname === null && r.firstname === null)).toBe(true);
    });
  });

  describe('GET /api/v1/me contract validation with the names_list synthetic ability', () => {
    it('returns 200 (not a 500) when show_seeker_names_to_brothers exposes names_list on abilities.seeker', async () => {
      // Reproduces a real prod incident: me.ts's meJson() appends the
      // synthetic 'names_list' string to abilities.seeker (see that
      // function's own comment) whenever seekerNamesListAllowedForCaller()
      // is true - which it is for any plain member once the
      // show_seeker_names_to_brothers AppConfig flag is on, the default
      // shape for most callers. openapi.yaml's abilities.* response schema
      // enum never included 'names_list', so response validation (enabled
      // for this path) 500'd on every GET /api/v1/me for every such caller -
      // i.e. on every login/page load for most members, unrelated to and
      // outliving any particular deploy. me.test.ts's own 'exposes
      // names_list...' test doesn't catch this: it builds a bare express()
      // app around meRouter alone, without the real openapi contract
      // validation middleware - only a request through the real `app` does.
      await appConfig.set('show_seeker_names_to_brothers', true);
      // firstname/lastname set explicitly to isolate this test to the
      // names_list ability - see the next describe block for the separate
      // null-firstname/lastname bug this would otherwise also trip.
      const caller = await createUser({ uuid: randomUUID(), firstname: 'Max', lastname: 'Muster' });

      const res = await request(app).get('/api/v1/me').set({ Authorization: `Bearer ${issueAccessToken(caller.id)}` });

      expect(res.status).toBe(200);
      expect(res.body.abilities.seeker).toContain('names_list');
    });
  });

  describe('me/session contract validation with a null firstname/lastname', () => {
    it('GET /api/v1/me returns 200 (not a 500) when the caller has no firstname/lastname on file', async () => {
      // Same class of bug as the 'member detail'/'members list' null-field
      // tests below: createUser() leaves firstname/lastname at their schema
      // default (null - both are nullable Prisma columns with no @default),
      // but openapi.yaml's MeUser schema declared both as non-nullable
      // `string`, so response validation 500'd on GET /api/v1/me (and every
      // other me.ts route) for any such caller - found while isolating the
      // names_list test above, which otherwise triggers this same 500 first.
      const caller = await createUser({ uuid: randomUUID() });

      const res = await request(app).get('/api/v1/me').set({ Authorization: `Bearer ${issueAccessToken(caller.id)}` });

      expect(res.status).toBe(200);
      expect(res.body.user.firstname).toBeNull();
      expect(res.body.user.lastname).toBeNull();
    });

    it('POST /api/v1/session (login) returns 200 (not a 500) when the caller has no firstname/lastname on file', async () => {
      // Same underlying schema bug (openapi.yaml's `User` schema, used by
      // SessionPayload.user/session.ts's login response) - login itself
      // would 500 for any such user, not just GET /api/v1/me.
      const password = 'foobar123';
      const caller = await createUser({ encrypted_password: bcrypt.hashSync(password, 4) });

      const res = await request(app).post('/api/v1/session').send({ email: caller.email, password });

      expect(res.status).toBe(200);
      expect(res.body.user.firstname).toBeNull();
      expect(res.body.user.lastname).toBeNull();
    });
  });

  describe('member detail contract validation with a null matriculation_number', () => {
    it('returns 200 (not a 500) when the caller has no matriculation_number on file', async () => {
      // createUser() leaves matriculation_number at its schema default
      // (null, since the column has no Prisma @default and is nullable -
      // see api/prisma/schema.prisma's `matriculation_number Int?`) -
      // exactly the condition that previously made openapi.yaml's Member
      // schema (matriculation_number declared as non-nullable `integer`)
      // reject the real response with a 500, since response validation is
      // enabled for this path. A caller viewing their own profile is
      // authorized (ability.ts grants `show` on 'User' for { id: user.id }),
      // but only once they hold an active role - a roleless user is treated
      // as not a real member (see routes/members.test.ts's fixture setup,
      // which always assigns EnteredApprentice before exercising GET /:uuid).
      const now = new Date();
      const apprenticeRole = await prisma.roles.create({
        data: { name: 'EnteredApprentice', display_name: 'Lehrling', created_at: now, updated_at: now },
      });
      // firstname/lastname are set explicitly (unlike matriculation_number)
      // to isolate this test to the one field it targets - both are also
      // nullable at the DB level with no Prisma @default, and this schema's
      // firstname/lastname are (separately, still) declared non-nullable
      // `string` - a real, adjacent latent bug, but not this test's target.
      const caller = await createUser({ uuid: randomUUID(), firstname: 'Max', lastname: 'Muster' });
      await prisma.user_roles.create({
        data: { user_id: caller.id, role_id: apprenticeRole.id, created_at: now, updated_at: now, role_added_at: now },
      });

      const res = await request(app)
        .get(`/api/v1/members/${caller.uuid}`)
        .set({ Authorization: `Bearer ${issueAccessToken(caller.id)}` });

      expect(res.status).toBe(200);
      expect(res.body.matriculation_number).toBeNull();
    });
  });

  describe('members list contract validation with a null uuid/firstname/lastname', () => {
    it('returns 200 (not a 500) when a listed member has no uuid, firstname, or lastname on file', async () => {
      // Same class of bug as the two tests above: uuid/firstname/lastname are
      // all nullable at the DB level (no Prisma @default - see
      // api/prisma/schema.prisma's `users.uuid`/`firstname`/`lastname`, all
      // `String?`) - but openapi.yaml's MemberSummary schema (the shape GET
      // /api/v1/members returns per row) previously declared all three as
      // non-nullable `string`. Legacy rows without a uuid do exist (this is
      // exactly why the csv_export_data test above has to override `uuid`
      // for its OTHER fixture user to isolate the null-name case from this
      // one) - this test targets that row showing up in the members LIST
      // itself, not just the export.
      //
      // Unlike csv_export_data (a blanket `can('csv_export', 'User')` grant,
      // no per-row filtering), GET /api/v1/members filters every row through
      // canShowRow, which requires the caller to actually reach
      // defaultUserAbilities (only granted via holding a degree role, not
      // MemberOfCouncil alone) - so the caller here needs a real
      // EnteredApprentice role, matching routes/members.test.ts's own
      // 'lists undeleted members visible to the caller' precedent.
      const now = new Date();
      const apprenticeRole = await prisma.roles.create({
        data: { name: 'EnteredApprentice', display_name: 'Lehrling', created_at: now, updated_at: now },
      });
      const caller = await createUser({ uuid: randomUUID(), firstname: 'Max', lastname: 'Muster' });
      await prisma.user_roles.create({
        data: { user_id: caller.id, role_id: apprenticeRole.id, created_at: now, updated_at: now, role_added_at: now },
      });
      await createUser();

      const res = await request(app)
        .get('/api/v1/members')
        .set({ Authorization: `Bearer ${issueAccessToken(caller.id)}` });

      expect(res.status).toBe(200);
      const rows = res.body.rows as Array<Record<string, unknown>>;
      expect(rows.some((r) => r.uuid === null && r.firstname === null && r.lastname === null)).toBe(true);
    });
  });

  describe('trust proxy (login rate limiter req.ip handling)', () => {
    it("separates the login rate limiter's per-IP bucket by the real client's X-Forwarded-For entry, not either proxy hop's own address", async () => {
      // Two comma-separated entries model the two-hop chain: the leftmost is
      // what the host nginx recorded as the real client; the rightmost is
      // what the app-container nginx appended for its own hop to the api
      // container (see api/src/app.ts's `trust proxy` comment). The
      // rightmost is held IDENTICAL across all three requests and only the
      // leftmost (real client) varies - this is what makes the test
      // actually discriminate `trust proxy: 2` from `1`: with `1`, Express
      // would key every request off that shared rightmost hop instead and
      // this assertion would fail to distinguish `first` from
      // `differentClient` at all.
      const first = await request(app)
        .post('/api/v1/session')
        .set('X-Forwarded-For', '203.0.113.20, 10.0.0.5')
        .send({ email: 'nobody@example.test', password: 'wrong' });
      const sameClientAgain = await request(app)
        .post('/api/v1/session')
        .set('X-Forwarded-For', '203.0.113.20, 10.0.0.5')
        .send({ email: 'nobody@example.test', password: 'wrong' });
      const differentClient = await request(app)
        .post('/api/v1/session')
        .set('X-Forwarded-For', '203.0.113.30, 10.0.0.5')
        .send({ email: 'nobody@example.test', password: 'wrong' });

      const remaining = (res: request.Response) => Number(res.headers['ratelimit-remaining']);

      // Same forwarded client IP consumes the same bucket (remaining count
      // keeps dropping)...
      expect(remaining(sameClientAgain)).toBe(remaining(first) - 1);
      // ...but a distinct client IP gets its own, fresh bucket - if
      // `trust proxy` were unset, collapsed to `1`, or otherwise
      // miscounted, every caller behind the shared intermediate hop would
      // instead share (and exhaust) first's bucket.
      expect(remaining(differentClient)).toBe(remaining(first));
    });

    it("separates the login rate limiter's per-IP bucket by the real client's X-Forwarded-For entry across the current three-hop chain, not any proxy hop's own address", async () => {
      // Three comma-separated entries model the current production chain
      // (host nginx -> edge -> app-container nginx -> api - see
      // api/src/app.ts's `trust proxy` comment): the leftmost is what the
      // host nginx recorded as the real client, the middle is what `edge`
      // appended for its hop, and the rightmost is what the app-container
      // nginx appended for its hop to the api container. Both non-leftmost
      // entries are held IDENTICAL across all three requests and only the
      // leftmost (real client) varies - this is what makes the test
      // actually discriminate `trust proxy: 3` from `2`: with `2`, Express
      // would key every request off the middle (`edge`) hop instead of the
      // real leftmost client, and this assertion would fail to distinguish
      // `first` from `differentClient` at all. Distinct IPs from the
      // 2-hop test above, so the two tests' rate-limit buckets (shared
      // module-level state - see this describe block's own comment) can't
      // interfere with each other.
      const first = await request(app)
        .post('/api/v1/session')
        .set('X-Forwarded-For', '203.0.113.40, 10.0.0.6, 10.0.0.7')
        .send({ email: 'nobody@example.test', password: 'wrong' });
      const sameClientAgain = await request(app)
        .post('/api/v1/session')
        .set('X-Forwarded-For', '203.0.113.40, 10.0.0.6, 10.0.0.7')
        .send({ email: 'nobody@example.test', password: 'wrong' });
      const differentClient = await request(app)
        .post('/api/v1/session')
        .set('X-Forwarded-For', '203.0.113.50, 10.0.0.6, 10.0.0.7')
        .send({ email: 'nobody@example.test', password: 'wrong' });

      const remaining = (res: request.Response) => Number(res.headers['ratelimit-remaining']);

      // Same forwarded client IP consumes the same bucket (remaining count
      // keeps dropping)...
      expect(remaining(sameClientAgain)).toBe(remaining(first) - 1);
      // ...but a distinct client IP gets its own, fresh bucket - if
      // `trust proxy` were still `2` (or otherwise miscounted for a
      // three-hop chain), every caller behind the shared `edge` hop would
      // instead share (and exhaust) first's bucket.
      expect(remaining(differentClient)).toBe(remaining(first));
    });
  });

  describe('GET /api/v1/mfa/challenge/methods contract validation (regression)', () => {
    // Found live-broken on `next` 2026-08-01: this handler only ever
    // returned `{ methods }`, but components/schemas/MfaMethodsList
    // (openapi/openapi.yaml) requires [methods, mode, grace_period_ends_at]
    // - express-openapi-validator's *response* validator rejected every
    // real call with a 500 ("must have required property 'mode'"),
    // completely blocking MFA login for every user. mfaChallenge.test.ts's
    // own route-level unit tests mount the router on a bare Express app
    // with no contract-validation middleware at all, so they could never
    // have caught this - only a test through the real, fully-wired `app`
    // (this file's whole reason to exist, per its own top-of-file comment)
    // does.
    it('returns a schema-valid response (methods, mode, grace_period_ends_at)', async () => {
      const user = await createUser();
      const token = issueMfaPendingToken(user.id);
      const res = await request(app).get('/api/v1/mfa/challenge/methods').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        methods: [],
        mode: 'optional',
        grace_period_ends_at: null,
      });
    });
  });

  describe('GET /api/v1/mfa/passkeys contract validation', () => {
    it('returns a schema-valid response for a user with no passkeys', async () => {
      const user = await createUser();
      const token = issueAccessToken(user.id);
      const res = await request(app).get('/api/v1/mfa/passkeys').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ credentials: [] });
    });

    it('returns a schema-valid response for a user with one passkey', async () => {
      const user = await createUser();
      const now = new Date();
      await prisma.mfa_passkey_credentials.create({
        data: { user_id: user.id, credential_id: 'cred-x', public_key: 'pk-x', name: 'My Key', created_at: now, updated_at: now },
      });
      const token = issueAccessToken(user.id);
      const res = await request(app).get('/api/v1/mfa/passkeys').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.credentials).toHaveLength(1);
      expect(res.body.credentials[0]).toEqual({
        credential_id: 'cred-x',
        name: 'My Key',
        created_at: now.toISOString(),
        last_used_at: null,
      });
    });
  });

  describe('DELETE /api/v1/mfa/methods/:type contract validation', () => {
    it('returns 404 (schema-valid) when there is nothing to remove', async () => {
      const user = await createUser();
      const token = issueAccessToken(user.id);
      const res = await request(app)
        .delete('/api/v1/mfa/methods/totp')
        .set('Authorization', `Bearer ${token}`)
        .send({ proof: { method: 'totp', code: '000000' } });
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: expect.any(String) });
    });
  });

  describe('DELETE /api/v1/mfa/methods/passkey/:credentialId contract validation', () => {
    beforeEach(() => {
      process.env.MFA_ENCRYPTION_KEY = 'a'.repeat(64);
    });

    it('returns 404 (schema-valid) for an unknown credential id', async () => {
      const user = await createUser();
      const secret = authenticator.generateSecret();
      const now = new Date();

      // Create a verified TOTP credential so the proof gate will pass
      await prisma.mfa_totp_credentials.create({
        data: {
          user_id: user.id,
          encrypted_secret: encryptSecret(secret),
          verified_at: now,
          created_at: now,
          updated_at: now,
        },
      });

      const token = issueAccessToken(user.id);
      const validCode = authenticator.generate(secret);

      const res = await request(app)
        .delete('/api/v1/mfa/methods/passkey/does-not-exist')
        .set('Authorization', `Bearer ${token}`)
        .send({ proof: { method: 'totp', code: validCode } });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: expect.any(String) });
    });
  });

  describe('login-to-statistics integration (regression: sign-in tracking)', () => {
    // Regression test for a bug reported directly against this repo:
    // statistics.ts's user_stats sub-report never showed real logins because
    // session.ts's POST /session handler never wrote sign_in_count/
    // current_sign_in_at/current_sign_in_ip (Devise's update_tracked_fields!
    // was never ported - see session.ts's recordSuccessfulSignIn). Exercises
    // the real, fully-wired app end to end - a real password login through
    // the real three-hop trust-proxy config, then a real Admin reading
    // user_stats - so a regression here can't hide behind either router's
    // own isolated test file mocking the other side away.
    const PASSWORD = 'foobar123';
    const TEST_BCRYPT_COST = 4;

    async function makeAdminAuthHeader(): Promise<{ Authorization: string }> {
      const now = new Date();
      const adminRole = await prisma.roles.create({
        data: { name: 'Admin', display_name: 'Administrator', created_at: now, updated_at: now },
      });
      const admin = await createUser({ date_of_birth: new Date('1980-01-01'), uuid: randomUUID(), firstname: 'Ad', lastname: 'Min', matriculation_number: 1 });
      await prisma.user_roles.create({ data: { user_id: admin.id, role_id: adminRole.id, created_at: now, updated_at: now, role_added_at: now } });
      return { Authorization: `Bearer ${issueAccessToken(admin.id)}` };
    }

    it('reflects a real login in the user_stats sub-report an Admin reads', async () => {
      const member = await createUser({
        encrypted_password: bcrypt.hashSync(PASSWORD, TEST_BCRYPT_COST),
        date_of_birth: new Date('1990-01-01'),
        uuid: randomUUID(),
        firstname: 'Mem',
        lastname: 'Ber',
        matriculation_number: 2,
      });

      const loginRes = await request(app)
        .post('/api/v1/session')
        .set('X-Forwarded-For', '203.0.113.55, 10.0.0.5')
        .send({ email: member.email, password: PASSWORD });
      expect(loginRes.status).toBe(200);

      const statsRes = await request(app).get('/api/v1/statistics/user_stats').set(await makeAdminAuthHeader());

      expect(statsRes.status).toBe(200);
      const row = statsRes.body.rows.find((r: { uuid: string }) => r.uuid === member.uuid);
      expect(row).toBeTruthy();
      expect(row.sign_in_count).toBe(1);
      expect(row.current_sign_in_at).toBeTruthy();
      expect(row.current_sign_in_ip).toBe('203.0.113.55');
    });
  });

  describe('admin account (ADMIN_USER/ADMIN_PASSWORD)', () => {
    const ORIGINAL_USER = process.env.ADMIN_USER;
    const ORIGINAL_PASSWORD = process.env.ADMIN_PASSWORD;

    afterEach(() => {
      if (ORIGINAL_USER === undefined) delete process.env.ADMIN_USER;
      else process.env.ADMIN_USER = ORIGINAL_USER;
      if (ORIGINAL_PASSWORD === undefined) delete process.env.ADMIN_PASSWORD;
      else process.env.ADMIN_PASSWORD = ORIGINAL_PASSWORD;
    });

    it('logs in as Admin after syncAdminAccountFromEnv provisions the account', async () => {
      const now = new Date();
      await prisma.roles.create({ data: { name: 'Admin', display_name: 'Admin', created_at: now, updated_at: now } });
      process.env.ADMIN_USER = 'admin@example.test';
      process.env.ADMIN_PASSWORD = 'super-secret';

      await syncAdminAccountFromEnv();

      const res = await request(app).post('/api/v1/session').send({ email: 'admin@example.test', password: 'super-secret' });
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('admin@example.test');

      // POST /api/v1/session's response carries only { access_token, user } -
      // no abilities - so login returning 200 alone would still pass even if
      // the role assignment pointed at the wrong role. Follow the same
      // pattern as the 'GET /api/v1/me contract validation with the
      // names_list synthetic ability' describe block above: use the issued
      // access_token against GET /api/v1/me and assert on res.body.abilities.
      // 'AppConfig' is only granted (via 'manage', which expands to every
      // CRUD_ACTIONS entry) by applicationAdminAbilities, itself only reached
      // through Admin or ApplicationAdmin - see ability.ts's
      // applicationAdminAbilities/adminAbilities - so a full CRUD set here is
      // a reliable Admin-scoped signal, not just "logged in successfully".
      const meRes = await request(app).get('/api/v1/me').set({ Authorization: `Bearer ${res.body.access_token}` });
      expect(meRes.status).toBe(200);
      expect(meRes.body.abilities.app_config).toEqual(['read', 'create', 'update', 'destroy']);
    });
  });

  describe('GET /api/v1/health', () => {
    const ORIGINAL_DEMO_MODE = process.env.DEMO_MODE;
    afterEach(() => {
      if (ORIGINAL_DEMO_MODE === undefined) delete process.env.DEMO_MODE;
      else process.env.DEMO_MODE = ORIGINAL_DEMO_MODE;
    });

    it('reports demo: false when DEMO_MODE is unset', async () => {
      delete process.env.DEMO_MODE;
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.demo).toBe(false);
    });

    it('reports demo: true when DEMO_MODE=true', async () => {
      process.env.DEMO_MODE = 'true';
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.demo).toBe(true);
    });
  });

  // Regression coverage for the final-whole-branch-review finding: the
  // getPublicDemoAccounts operation's 404 in openapi.yaml used to be a bare
  // `description` with no `content`, meaning the spec claimed this 404 has no
  // body. The real handler (public.ts) throws ApiError.notFound(), which the
  // shared error handler turns into a 404 WITH a `{error}` JSON body - and
  // since this route isn't in app.ts's excludeResponseValidationPaths list,
  // contractValidation's response-side AJV check flagged that body as
  // unexpected and rewrote the response into a 500, on every real request to
  // this endpoint outside demo mode (i.e. on every non-demo environment).
  // Only a test that goes through the real, fully-wired app (not the bare
  // express() app in test/routes/public.test.ts, which has no contract
  // validation middleware at all) can catch this class of bug.
  describe('GET /api/v1/public/demo-accounts (contract validation)', () => {
    const ORIGINAL_DEMO_MODE = process.env.DEMO_MODE;
    afterEach(() => {
      if (ORIGINAL_DEMO_MODE === undefined) delete process.env.DEMO_MODE;
      else process.env.DEMO_MODE = ORIGINAL_DEMO_MODE;
    });

    it('returns a real 404 (not a contract-validation-rewritten 500) when DEMO_MODE is unset', async () => {
      delete process.env.DEMO_MODE;
      const res = await request(app).get('/api/v1/public/demo-accounts');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('not_found');
    });

    it('returns 200 with the expected accounts shape when DEMO_MODE=true', async () => {
      process.env.DEMO_MODE = 'true';
      const res = await request(app).get('/api/v1/public/demo-accounts');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.accounts)).toBe(true);
      expect(res.body.accounts.length).toBeGreaterThan(0);
      expect(res.body.accounts[0]).toEqual({ email: expect.any(String), role: expect.any(String) });
    });
  });
});
