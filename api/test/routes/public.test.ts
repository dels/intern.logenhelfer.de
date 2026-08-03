import { randomUUID } from 'node:crypto';

import type { events } from '../../src/generated/prisma/client.js';
import express from 'express';
import request from 'supertest';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { issueAccessToken } from '../../src/auth/jwt.js';
import { prisma } from '../../src/db.js';
import { apiErrorHandler } from '../../src/lib/errors.js';
import { appConfig, KNOWN_KEYS } from '../../src/lib/appConfig.js';
import { DEMO_ACCOUNTS } from '../../src/lib/demoSeed.js';
import { ensureLogoSeeded } from '../../src/lib/logoStore.js';
import publicRouter from '../../src/routes/public.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

// Port of:
//   - rails-app/spec/requests/api/v1/public_landing_spec.rb (5 examples)
//   - rails-app/spec/requests/api/v1/public_impressum_spec.rb (4 examples)
//   - rails-app/spec/requests/api/v1/public_workingplan_spec.rb (7 examples)
// plus a small number of net-new security tests (see the bottom describe
// block).
//
// The Rails specs reset AppConfig keys in an `after` block since AppConfig
// caches records process-wide across examples. The shared `appConfig`
// service (../../src/lib/appConfig.js) ported here has the exact same
// process-wide cache (by design, to mirror Rails) - `resetDb()` truncates
// `app_config_adapters` but does NOT by itself invalidate that in-memory
// cache, and this file's `setAppConfig()` test helper writes rows directly
// via Prisma (bypassing `appConfig.set()`, which would run the `:integer`
// `cast_for_write` coercion and mangle shorthand values like `'1m'`). So
// `beforeEach` explicitly dirties every known key after truncating, the
// same "genuinely unconfigured slate" the Rails `after` blocks achieve.

const app = express();
app.use(express.json());
app.use('/api/v1/public', publicRouter);
app.use(apiErrorHandler);

function authHeaders(userId: number): { Authorization: string } {
  return { Authorization: `Bearer ${issueAccessToken(userId)}` };
}

/** Mirrors `AppConfig[key] = value` (rails-app/app/models/app_config.rb's `[]=`) closely enough for these tests: stores `value.to_s` under the env-prefixed key. */
async function setAppConfig(key: string, value: string | boolean): Promise<void> {
  const env = process.env.NODE_ENV ?? 'development';
  const stringValue = String(value);
  await prisma.app_config_adapters.upsert({
    where: { key: `${env}_${key}` },
    update: { value: stringValue },
    create: { key: `${env}_${key}`, value: stringValue },
  });
}

let eventCounter = 0;

async function createEvent(
  createdById: number,
  overrides: Partial<{ title: string; date: Date; time: Date | null; whole_day: boolean; location: string | null; public_description: string | null; deleted: boolean }> = {},
): Promise<events> {
  eventCounter += 1;
  const now = new Date();
  const wholeDay = overrides.whole_day ?? false;
  // `??` would swallow an explicit `public_description: null` override (the
  // "hidden" events in the workingplan/ics specs deliberately pass null to
  // exercise the blank?-exclusion filter) - `in` distinguishes "key absent"
  // from "key present but null".
  const publicDescription = 'public_description' in overrides ? (overrides.public_description ?? null) : 'Öffentliche Beschreibung';
  return prisma.events.create({
    data: {
      uuid: randomUUID(),
      title: overrides.title ?? `Event ${eventCounter}`,
      date: overrides.date ?? daysFromNowUtc(10),
      time: wholeDay ? null : (overrides.time ?? new Date(Date.UTC(1970, 0, 1, 19, 0))),
      whole_day: wholeDay,
      location: overrides.location ?? 'Logenhaus',
      public_description: publicDescription,
      deleted: overrides.deleted ?? false,
      created_by_id: createdById,
      created_at: now,
      updated_at: now,
    },
  });
}

function daysFromNowUtc(days: number): Date {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
}

function monthsFromNowUtc(months: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + months, now.getUTCDate()));
}

beforeEach(async () => {
  await resetDb();
  for (const key of Object.keys(KNOWN_KEYS)) appConfig.dirty(key);
});

// -- GET /api/v1/public/landing -------------------------------------------

describe('GET /api/v1/public/landing', () => {
  it('is reachable with no Authorization header at all', async () => {
    const res = await request(app).get('/api/v1/public/landing');
    expect(res.status).toBe(200);
  });

  it('is false when working_plan_as_start_page is off (default)', async () => {
    const res = await request(app).get('/api/v1/public/landing');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ calendar_as_landing_page: false, lodge: 'Logenhelfer', language: 'de' });
  });

  it('is true when both flags are on', async () => {
    await setAppConfig('working_plan_as_start_page', true);
    await setAppConfig('public_wp_available_to_anon_users', true);

    const res = await request(app).get('/api/v1/public/landing');
    expect(res.body).toEqual({ calendar_as_landing_page: true, lodge: 'Logenhelfer', language: 'de' });
  });

  it('is false when working_plan_as_start_page is on but anon access is off', async () => {
    await setAppConfig('working_plan_as_start_page', true);
    await setAppConfig('public_wp_available_to_anon_users', false);

    const res = await request(app).get('/api/v1/public/landing');
    expect(res.body).toEqual({ calendar_as_landing_page: false, lodge: 'Logenhelfer', language: 'de' });
  });

  it('is false when working_plan_as_start_page is off even if anon access is on', async () => {
    await setAppConfig('working_plan_as_start_page', false);
    await setAppConfig('public_wp_available_to_anon_users', true);

    const res = await request(app).get('/api/v1/public/landing');
    expect(res.body).toEqual({ calendar_as_landing_page: false, lodge: 'Logenhelfer', language: 'de' });
  });

  it('reflects a configured lodge name', async () => {
    await setAppConfig('lodge', 'Zur Morgenröte');

    const res = await request(app).get('/api/v1/public/landing');
    expect(res.body.lodge).toBe('Zur Morgenröte');
  });

  it('reflects a configured language', async () => {
    await setAppConfig('language', 'en');

    const res = await request(app).get('/api/v1/public/landing');
    expect(res.body.language).toBe('en');
  });
});

// -- GET /api/v1/public/impressum ------------------------------------------

describe('GET /api/v1/public/impressum', () => {
  it('is reachable with no Authorization header at all', async () => {
    const res = await request(app).get('/api/v1/public/impressum');
    expect(res.status).toBe(200);
  });

  it('shows a friendly placeholder when unconfigured', async () => {
    const res = await request(app).get('/api/v1/public/impressum');
    expect(res.status).toBe(200);
    expect(res.body.html).toContain('Impressum noch nicht konfiguriert');
  });

  it('substitutes plain :key tokens with the matching AppConfig value', async () => {
    await setAppConfig('lodge', 'Testloge');
    await setAppConfig('impressum', '<p>:lodge</p>');

    const res = await request(app).get('/api/v1/public/impressum');
    expect(res.body.html).toBe('<p>Testloge</p>');
  });

  it('renders the four email-field tokens as mailto links, not plain text', async () => {
    await setAppConfig('mvst_email', 'mvst@example.org');
    await setAppConfig('impressum', '<p>:mvst_email</p>');

    const res = await request(app).get('/api/v1/public/impressum');
    expect(res.body.html).toContain('<a href="mailto:mvst@example.org">mvst@example.org</a>');
  });
});

// -- GET /api/v1/public/help -------------------------------------------------

describe('GET /api/v1/public/help', () => {
  it('is reachable with no Authorization header at all', async () => {
    const res = await request(app).get('/api/v1/public/help');
    expect(res.status).toBe(200);
  });

  it('shows a friendly placeholder when unconfigured', async () => {
    const res = await request(app).get('/api/v1/public/help');
    expect(res.status).toBe(200);
    expect(res.body.html).toContain('Hilfe noch nicht konfiguriert');
  });

  it('returns the admin-configured HTML verbatim, with no token substitution', async () => {
    await setAppConfig('help', '<p>:lodge</p>');

    const res = await request(app).get('/api/v1/public/help');
    expect(res.body.html).toBe('<p>:lodge</p>');
  });
});

// -- GET /api/v1/public/workingplan -----------------------------------------

describe('GET /api/v1/public/workingplan', () => {
  it('is reachable with no Authorization header at all', async () => {
    const user = await createUser();
    await createEvent(user.id);

    const res = await request(app).get('/api/v1/public/workingplan');
    expect(res.status).toBe(200);
  });

  it('returns only events within the configured html window, with public-safe fields only', async () => {
    const user = await createUser();
    await createEvent(user.id, { title: 'Loge im Juli', location: 'Logenhaus', public_description: 'Öffentliche Beschreibung', date: daysFromNowUtc(10) });
    await createEvent(user.id, { title: 'Interna', public_description: null, date: daysFromNowUtc(11) });
    await createEvent(user.id, { title: 'Zu weit weg', public_description: 'x', date: monthsFromNowUtc(8) });
    await createEvent(user.id, { title: 'Nur Leerzeichen', public_description: '   ', date: daysFromNowUtc(12) });

    const res = await request(app).get('/api/v1/public/workingplan');
    expect(res.status).toBe(200);
    const titles = res.body.rows.map((r: { title: string }) => r.title);
    expect(titles).toContain('Loge im Juli');
    expect(titles).not.toContain('Zu weit weg');
    expect(titles).not.toContain('Interna');
    expect(titles).not.toContain('Nur Leerzeichen');
    const row = res.body.rows.find((r: { title: string }) => r.title === 'Loge im Juli');
    expect(Object.keys(row).sort()).toEqual(['title', 'location', 'public_description', 'date', 'whole_day', 'time'].sort());
  });

  it('404s when the anon-availability config is disabled', async () => {
    await setAppConfig('public_wp_available_to_anon_users', false);

    const res = await request(app).get('/api/v1/public/workingplan');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'not_found' });
  });

  it('respects a configured html timespan', async () => {
    const user = await createUser();
    await createEvent(user.id, { title: 'Zu weit weg', public_description: 'x', date: monthsFromNowUtc(8) });
    await setAppConfig('public_workingplan_html_timespan', '1m');

    const res = await request(app).get('/api/v1/public/workingplan');
    const titles = res.body.rows.map((r: { title: string }) => r.title);
    expect(titles).not.toContain('Zu weit weg');
  });
});

// -- GET /api/v1/public/workingplan.ics -------------------------------------

describe('GET /api/v1/public/workingplan.ics', () => {
  it('is reachable with no Authorization header and returns a calendar body', async () => {
    const user = await createUser();
    await createEvent(user.id, { title: 'Loge im Juli', public_description: 'Öffentliche Beschreibung', date: daysFromNowUtc(10) });
    await createEvent(user.id, { title: 'Interna', public_description: null, date: daysFromNowUtc(11) });

    const res = await request(app).get('/api/v1/public/workingplan.ics');
    expect(res.status).toBe(200);
    expect(res.text).toContain('BEGIN:VCALENDAR');
    expect(res.text).toContain('Loge im Juli');
    expect(res.text).not.toContain('Interna');
  });

  it('sets the PRODID language tag from the configured language', async () => {
    const user = await createUser();
    await createEvent(user.id, { title: 'Loge im Juli', public_description: 'Öffentliche Beschreibung', date: daysFromNowUtc(10) });
    await setAppConfig('language', 'en');

    const res = await request(app).get('/api/v1/public/workingplan.ics');
    expect(res.text).toMatch(/PRODID:.*EN/);
  });

  it('defaults the PRODID language tag to DE', async () => {
    const user = await createUser();
    await createEvent(user.id, { title: 'Loge im Juli', public_description: 'Öffentliche Beschreibung', date: daysFromNowUtc(10) });

    const res = await request(app).get('/api/v1/public/workingplan.ics');
    expect(res.text).toMatch(/PRODID:.*DE/);
  });

  it('excludes events whose public_description is whitespace-only', async () => {
    const user = await createUser();
    await createEvent(user.id, { title: 'Nur Leerzeichen', public_description: '   ', date: daysFromNowUtc(12) });

    const res = await request(app).get('/api/v1/public/workingplan.ics');
    expect(res.text).not.toContain('Nur Leerzeichen');
  });

  it('404s when the anon-availability config is disabled', async () => {
    await setAppConfig('public_wp_available_to_anon_users', false);

    const res = await request(app).get('/api/v1/public/workingplan.ics');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'not_found' });
  });
});

// -- GET /api/v1/public/workingplan.pdf -------------------------------------

describe('GET /api/v1/public/workingplan.pdf', () => {
  it('is reachable with no Authorization header and returns a PDF body', async () => {
    const user = await createUser();
    await createEvent(user.id, { title: 'Loge im Juli', public_description: 'Öffentliche Beschreibung', date: daysFromNowUtc(10) });

    const res = await request(app).get('/api/v1/public/workingplan.pdf');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.body.slice(0, 5).toString('latin1')).toBe('%PDF-');
  });

  it('still returns a valid PDF when language is configured to "en"', async () => {
    const user = await createUser();
    await createEvent(user.id, { title: 'Loge im Juli', public_description: 'Öffentliche Beschreibung', date: daysFromNowUtc(10) });
    await setAppConfig('language', 'en');

    const res = await request(app).get('/api/v1/public/workingplan.pdf');
    expect(res.status).toBe(200);
    expect(res.body.slice(0, 5).toString('latin1')).toBe('%PDF-');
  });

  it('404s when the anon-availability config is disabled', async () => {
    await setAppConfig('public_wp_available_to_anon_users', false);

    const res = await request(app).get('/api/v1/public/workingplan.pdf');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'not_found' });
  });
});

// -- pdfLabelsFor (pure label-selection logic, not exercised via the PDF route since jsPDF's binary output isn't practically assertable) --

describe('pdfLabelsFor', () => {
  it('returns German labels for "de"', async () => {
    const { pdfLabelsFor } = await import('../../src/routes/public.js');
    expect(pdfLabelsFor('de')).toMatchObject({ weekday: 'Wochentag', allDay: 'ganztags' });
  });

  it('returns English labels for "en"', async () => {
    const { pdfLabelsFor } = await import('../../src/routes/public.js');
    expect(pdfLabelsFor('en')).toMatchObject({ weekday: 'Weekday', allDay: 'all day' });
  });

  it('falls back to German labels for an unrecognized language', async () => {
    const { pdfLabelsFor } = await import('../../src/routes/public.js');
    expect(pdfLabelsFor('fr')).toMatchObject({ weekday: 'Wochentag' });
  });
});

// -- GET /api/v1/public/demo-accounts ---------------------------------------

describe('GET /api/v1/public/demo-accounts', () => {
  const ORIGINAL_DEMO_MODE = process.env.DEMO_MODE;
  afterEach(() => {
    if (ORIGINAL_DEMO_MODE === undefined) delete process.env.DEMO_MODE;
    else process.env.DEMO_MODE = ORIGINAL_DEMO_MODE;
  });

  it('404s when DEMO_MODE is unset', async () => {
    delete process.env.DEMO_MODE;
    const res = await request(app).get('/api/v1/public/demo-accounts');
    expect(res.status).toBe(404);
  });

  it('returns every demo account when DEMO_MODE=true', async () => {
    process.env.DEMO_MODE = 'true';
    const res = await request(app).get('/api/v1/public/demo-accounts');
    expect(res.status).toBe(200);
    expect(res.body.accounts).toEqual(DEMO_ACCOUNTS.map(({ email, role }) => ({ email, role })));
  });
});

describe('GET /api/v1/public/manifest.webmanifest', () => {
  it('reflects the current lodge/lodge_short/language AppConfig values', async () => {
    await setAppConfig('lodge', 'Zur Morgenröte');
    await setAppConfig('lodge_short', 'ZM');
    await setAppConfig('language', 'en');

    const res = await request(app).get('/api/v1/public/manifest.webmanifest');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      name: 'Zur Morgenröte',
      short_name: 'ZM',
      lang: 'en',
      start_url: '/',
      display: 'standalone',
    });
    expect(res.body.icons).toHaveLength(3);
  });
});

describe('GET /api/v1/public/logo/:file', () => {
  beforeEach(async () => {
    await ensureLogoSeeded();
  });

  it('serves the requested icon variant as a PNG at the correct size', async () => {
    const res = await request(app).get('/api/v1/public/logo/icon-512.png');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/png');
    await expect(sharp(res.body).metadata()).resolves.toMatchObject({ width: 512, height: 512 });
  });

  it('404s for an unknown variant filename', async () => {
    const res = await request(app).get('/api/v1/public/logo/not-a-real-variant.png');
    expect(res.status).toBe(404);
  });
});

// -- security ----------------------------------------------------------
//
// All three controllers ported here (`PublicLandingController`,
// `PublicImpressumController`, `PublicWorkingplanController`) call
// `skip_before_action :authenticate_api_user!` and never touch
// `req.ability`/CASL at all - by design, there is no role that should ever
// see a 403 from these endpoints; they are meant to be reachable by
// literally anyone, authenticated or not. So the meaningful boundary to
// prove here isn't "role X gets 403" (no such case exists for this
// resource) but the two things that boundary collapses to for a
// config-gated-only public resource:
//   1. a garbage/malformed Authorization header never leaks into a 401 -
//      proving auth is genuinely bypassed rather than silently still
//      required underneath, and
//   2. an authenticated request (even from a real user, with a real, valid
//      token) cannot bypass the actual access gate here - the
//      `public_wp_available_to_anon_users` AppConfig flag - it still 404s
//      exactly like an anonymous request would.
// No search/filter/sort query param that touches the DB exists on any of
// these three routes, so no SQL-injection-attempt test is included here -
// there is no user-controlled value that ever reaches a Prisma `where`
// clause on this resource.
describe('security', () => {
  it('never 401s on a garbage Authorization header - these routes are genuinely public', async () => {
    const res = await request(app).get('/api/v1/public/landing').set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(200);
  });

  it('a valid, authenticated token does not bypass the anon-availability gate', async () => {
    const user = await createUser();
    await setAppConfig('public_wp_available_to_anon_users', false);

    const res = await request(app).get('/api/v1/public/workingplan').set(authHeaders(user.id));
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'not_found' });
  });
});
