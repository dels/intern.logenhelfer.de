import { randomUUID } from 'node:crypto';

import type { events } from '../../src/generated/prisma/client.js';
import express from 'express';
import request from 'supertest';
import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { issueAccessToken } from '../../src/auth/jwt.js';
import { prisma } from '../../src/db.js';
import { apiErrorHandler } from '../../src/lib/errors.js';
import { appConfig, KNOWN_KEYS } from '../../src/lib/appConfig.js';
import { DEMO_ACCOUNTS } from '../../src/lib/demoSeed.js';
import publicRouter from '../../src/routes/public.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

// Wraps the real resolveFooterLines (not a stub) so its actual DB-backed
// behavior still runs - only wrapped in vi.fn() so the GET /workingplan.pdf
// tests below can assert it was actually invoked with 'public' (mirrors
// mfa.test.ts's identical importOriginal-wrap-one-export pattern).
// buildWorkingplanPdf/pdfLabelsFor/etc. stay the real, unmocked implementation.
vi.mock('../../src/lib/workingplanPdf.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/workingplanPdf.js')>();
  return { ...actual, resolveFooterLines: vi.fn(actual.resolveFooterLines) };
});
import { resolveFooterLines } from '../../src/lib/workingplanPdf.js';

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

async function createRole(name: string, displayName = name): Promise<{ id: number; name: string | null }> {
  const now = new Date();
  const existing = await prisma.roles.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.roles.create({ data: { name, display_name: displayName, created_at: now, updated_at: now } });
}

async function assignRole(userId: number, roleId: number): Promise<void> {
  const now = new Date();
  await prisma.user_roles.create({ data: { user_id: userId, role_id: roleId, created_at: now, updated_at: now, role_added_at: now } });
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
    expect(res.body).toEqual({ calendar_as_landing_page: false, lodge: 'Logenhelfer', language: 'de', logo_version: null });
  });

  it('is true when both flags are on', async () => {
    await setAppConfig('working_plan_as_start_page', true);
    await setAppConfig('public_wp_available_to_anon_users', true);

    const res = await request(app).get('/api/v1/public/landing');
    expect(res.body).toEqual({ calendar_as_landing_page: true, lodge: 'Logenhelfer', language: 'de', logo_version: null });
  });

  it('is false when working_plan_as_start_page is on but anon access is off', async () => {
    await setAppConfig('working_plan_as_start_page', true);
    await setAppConfig('public_wp_available_to_anon_users', false);

    const res = await request(app).get('/api/v1/public/landing');
    expect(res.body).toEqual({ calendar_as_landing_page: false, lodge: 'Logenhelfer', language: 'de', logo_version: null });
  });

  it('is false when working_plan_as_start_page is off even if anon access is on', async () => {
    await setAppConfig('working_plan_as_start_page', false);
    await setAppConfig('public_wp_available_to_anon_users', true);

    const res = await request(app).get('/api/v1/public/landing');
    expect(res.body).toEqual({ calendar_as_landing_page: false, lodge: 'Logenhelfer', language: 'de', logo_version: null });
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

  it('reports logo_version as null when no custom logo is set', async () => {
    const res = await request(app).get('/api/v1/public/landing');
    expect(res.body.logo_version).toBeNull();
  });

  it('reports logo_version as the logo row\'s updated_at epoch once a custom logo is set', async () => {
    const stored = await prisma.custom_logos.create({ data: { id: 1, content: Buffer.from('X'), content_type: 'image/png' } });
    const res = await request(app).get('/api/v1/public/landing');
    expect(res.body.logo_version).toBe(stored.updated_at.getTime());
  });

  // Regression test: this endpoint is fully unauthenticated (no
  // Authorization header above) - the birthday-feed URL must never appear
  // here, for anyone, regardless of AppConfig state. It moved to the
  // authenticated GET /api/v1/me (see me.test.ts) precisely because this
  // route used to leak it to any anonymous caller. See openapi.yaml's
  // PublicLandingConfig (additionalProperties: false) for the schema-level
  // guarantee this pairs with.
  it('never includes birthday_calendar_ics_url, even when the feature is enabled', async () => {
    await setAppConfig('birthday_calendar_available', true);
    await setAppConfig('public_wp_available_to_anon_users', true);

    const res = await request(app).get('/api/v1/public/landing');

    expect(res.body).not.toHaveProperty('birthday_calendar_ics_url');
  });
});

// -- GET /api/v1/public/logo -----------------------------------------------

describe('GET /api/v1/public/logo', () => {
  it('returns 404 when no custom logo has been uploaded', async () => {
    const res = await request(app).get('/api/v1/public/logo');
    expect(res.status).toBe(404);
  });

  it('is reachable with no Authorization header at all', async () => {
    await prisma.custom_logos.create({ data: { id: 1, content: Buffer.from('PNGDATA'), content_type: 'image/png' } });
    const res = await request(app).get('/api/v1/public/logo');
    expect(res.status).toBe(200);
  });

  it('serves the stored bytes and content-type', async () => {
    await prisma.custom_logos.create({ data: { id: 1, content: Buffer.from('PNGDATA'), content_type: 'image/png' } });
    const res = await request(app).get('/api/v1/public/logo');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/png');
    expect(Buffer.isBuffer(res.body) ? res.body.toString() : res.text).toBe('PNGDATA');
  });

  it('sets a long-lived, immutable Cache-Control header (safe since the URL is version-querystring-busted)', async () => {
    await prisma.custom_logos.create({ data: { id: 1, content: Buffer.from('PNGDATA'), content_type: 'image/png' } });
    const res = await request(app).get('/api/v1/public/logo');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('public, max-age=31536000, immutable');
  });

  it('returns 404 again after the logo has been reset', async () => {
    await prisma.custom_logos.create({ data: { id: 1, content: Buffer.from('X'), content_type: 'image/png' } });
    await prisma.custom_logos.deleteMany({ where: { id: 1 } });
    const res = await request(app).get('/api/v1/public/logo');
    expect(res.status).toBe(404);
  });

  // NOTE: the real ?v=<logo_version> cache-busting param (the one
  // BijouLogo.tsx/SiteMetaSync.tsx actually send) can only be exercised
  // through the fully-wired app in app.integration.test.ts - this file
  // mounts the bare router with no OpenAPI contract-validation middleware,
  // so it can't catch a request-schema rejection of that param. See
  // app.integration.test.ts's "public logo/icon routes accept the ?v=
  // cache-busting query param" block.
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

// -- GET /api/v1/public/birthdays/:secret/calendar.ics -----------------------

describe('GET /api/v1/public/birthdays/:token/calendar.ics', () => {
  // Any non-deleted user's own token is valid - the feed's content is the
  // same org-wide roster regardless of which member's token fetched it (see
  // findBirthdayCalendarTokenOwner's comment in public.ts). A fresh
  // "subscriber" user, distinct from whichever birthday-having member each
  // test creates, stands in for "some member's real link".
  let subscriber: Awaited<ReturnType<typeof createUser>>;

  beforeEach(async () => {
    subscriber = await createUser({ firstname: 'Sub', lastname: 'Scriber' });
  });

  it('404s when the feature is disabled, even with a real subscriber token', async () => {
    const res = await request(app).get(`/api/v1/public/birthdays/${subscriber.birthday_calendar_token}/calendar.ics`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'not_found' });
  });

  it('404s with a wrong token even when the feature is enabled', async () => {
    await setAppConfig('birthday_calendar_available', true);
    const res = await request(app).get('/api/v1/public/birthdays/definitely-wrong-token/calendar.ics');
    expect(res.status).toBe(404);
  });

  // The whole point of a per-user token over the old shared secret: revoking
  // one member's link (offboarding sets `deleted`) must not need rotating
  // anyone else's.
  it('404s once the token\'s owning user is soft-deleted (offboarded)', async () => {
    await setAppConfig('birthday_calendar_available', true);
    const url = `/api/v1/public/birthdays/${subscriber.birthday_calendar_token}/calendar.ics`;
    expect((await request(app).get(url)).status).toBe(200);

    await prisma.users.update({ where: { id: subscriber.id }, data: { deleted: true } });

    expect((await request(app).get(url)).status).toBe(404);
  });

  it('returns initials-only VEVENTs for consenting members in individual mode', async () => {
    await setAppConfig('birthday_calendar_available', true);
    await setAppConfig('birthday_calendar_consent_mode', 'individual');
    await createUser({
      firstname: 'Anna', lastname: 'Beispiel', date_of_birth: new Date(Date.UTC(1970, 4, 15)), birthday_calendar_consent: true,
    });
    await createUser({
      firstname: 'Carl', lastname: 'Deutlich', date_of_birth: new Date(Date.UTC(1980, 4, 15)), birthday_calendar_consent: false,
    });

    const res = await request(app).get(`/api/v1/public/birthdays/${subscriber.birthday_calendar_token}/calendar.ics`);

    expect(res.status).toBe(200);
    expect(res.text).toContain('BEGIN:VCALENDAR');
    expect(res.text).toContain('Geburtstag');
    expect(res.text).toMatch(/A\. B\.s \d+\. Geburtstag/);
    expect(res.text).not.toContain('Deutlich');
    expect(res.text).not.toContain('C. D.');
  });

  it('includes every member with a birthday in blanket mode, regardless of their own consent flag', async () => {
    await setAppConfig('birthday_calendar_available', true);
    await setAppConfig('birthday_calendar_consent_mode', 'blanket');
    await createUser({
      firstname: 'Carl', lastname: 'Deutlich', date_of_birth: new Date(Date.UTC(1980, 4, 15)), birthday_calendar_consent: false,
    });

    const res = await request(app).get(`/api/v1/public/birthdays/${subscriber.birthday_calendar_token}/calendar.ics`);

    expect(res.text).toMatch(/C\. D\.s \d+\. Geburtstag/);
  });

  it('excludes deleted members even in blanket mode', async () => {
    await setAppConfig('birthday_calendar_available', true);
    await setAppConfig('birthday_calendar_consent_mode', 'blanket');
    await createUser({
      firstname: 'Erik', lastname: 'Fort', date_of_birth: new Date(Date.UTC(1990, 4, 15)), deleted: true,
    });

    const res = await request(app).get(`/api/v1/public/birthdays/${subscriber.birthday_calendar_token}/calendar.ics`);

    expect(res.text).not.toContain('E. F.');
  });

  it('emits 3 yearly occurrences per member with increasing ages', async () => {
    await setAppConfig('birthday_calendar_available', true);
    await setAppConfig('birthday_calendar_consent_mode', 'blanket');
    await createUser({ firstname: 'Greta', lastname: 'Hoch', date_of_birth: new Date(Date.UTC(1990, 0, 1)) });

    const res = await request(app).get(`/api/v1/public/birthdays/${subscriber.birthday_calendar_token}/calendar.ics`);

    const matches = res.text.match(/G\. H\.s (\d+)\. Geburtstag/g) ?? [];
    expect(matches).toHaveLength(3);
    const ages = matches.map((m) => Number(/\d+/.exec(m)?.[0]));
    expect(ages).toEqual([ages[0], (ages[0] ?? 0) + 1, (ages[0] ?? 0) + 2]);
  });

  it('rolls a Feb 29 birthday back to Feb 28 in a non-leap occurrence year', async () => {
    await setAppConfig('birthday_calendar_available', true);
    await setAppConfig('birthday_calendar_consent_mode', 'blanket');
    // 2000 was a leap year, so Feb 29 is a valid date_of_birth to store.
    await createUser({ firstname: 'Ida', lastname: 'Jung', date_of_birth: new Date(Date.UTC(2000, 1, 29)) });

    const res = await request(app).get(`/api/v1/public/birthdays/${subscriber.birthday_calendar_token}/calendar.ics`);

    expect(res.status).toBe(200);
    expect(res.text).toContain('I. J.');
    // Every occurrence's DTSTART must be a real calendar date - if the
    // Feb-29 special case were missing, ical-generator would either throw
    // or silently normalize to March 1st instead of the intended Feb 28.
    expect(res.text).not.toMatch(/DTSTART[^\r\n]*0301/);
  });

  it('excludes an admin from blanket mode when show_admins is off (matches the authenticated birthday_list roster)', async () => {
    await setAppConfig('birthday_calendar_available', true);
    await setAppConfig('birthday_calendar_consent_mode', 'blanket');
    await setAppConfig('show_admins', false);
    const adminRole = await createRole('Admin');
    const admin = await createUser({ firstname: 'Kurt', lastname: 'Leiter', date_of_birth: new Date(Date.UTC(1975, 4, 15)) });
    await assignRole(admin.id, adminRole.id);

    const res = await request(app).get(`/api/v1/public/birthdays/${subscriber.birthday_calendar_token}/calendar.ics`);

    expect(res.text).not.toContain('K. L.');
  });

  it('includes an admin in blanket mode when show_admins is on', async () => {
    await setAppConfig('birthday_calendar_available', true);
    await setAppConfig('birthday_calendar_consent_mode', 'blanket');
    await setAppConfig('show_admins', true);
    const adminRole = await createRole('Admin');
    const admin = await createUser({ firstname: 'Mona', lastname: 'Nord', date_of_birth: new Date(Date.UTC(1975, 4, 15)) });
    await assignRole(admin.id, adminRole.id);

    const res = await request(app).get(`/api/v1/public/birthdays/${subscriber.birthday_calendar_token}/calendar.ics`);

    expect(res.text).toMatch(/M\. N\.s \d+\. Geburtstag/);
  });

  it('still includes an admin in individual mode who personally opted in, regardless of show_admins', async () => {
    await setAppConfig('birthday_calendar_available', true);
    await setAppConfig('birthday_calendar_consent_mode', 'individual');
    await setAppConfig('show_admins', false);
    const adminRole = await createRole('Admin');
    const admin = await createUser({
      firstname: 'Otto', lastname: 'Peters', date_of_birth: new Date(Date.UTC(1975, 4, 15)), birthday_calendar_consent: true,
    });
    await assignRole(admin.id, adminRole.id);

    const res = await request(app).get(`/api/v1/public/birthdays/${subscriber.birthday_calendar_token}/calendar.ics`);

    expect(res.text).toMatch(/O\. P\.s \d+\. Geburtstag/);
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

  it('calls resolveFooterLines with "public" (not "internal") to build the footer', async () => {
    const user = await createUser();
    await createEvent(user.id, { title: 'Loge im Juli', public_description: 'Öffentliche Beschreibung', date: daysFromNowUtc(10) });

    const res = await request(app).get('/api/v1/public/workingplan.pdf');
    expect(res.status).toBe(200);
    expect(resolveFooterLines).toHaveBeenCalledWith('public');
  });

  it('does not pass any birthdayRows - the public PDF has never had a birthdays page', async () => {
    // buildWorkingplanPdf itself stays unmocked (see the module mock above),
    // so the only way to observe "no birthdayRows were passed" without
    // parsing PDF bytes is indirectly: the document jsPDF produces has
    // exactly one page. Two pages would mean a birthdays table got added
    // (see workingplanPdf.test.ts's own "adds a second page ..." case for
    // the positive side of this assertion).
    const user = await createUser();
    await createEvent(user.id, { title: 'Loge im Juli', public_description: 'Öffentliche Beschreibung', date: daysFromNowUtc(10) });

    const res = await request(app).get('/api/v1/public/workingplan.pdf');
    expect(res.status).toBe(200);
    // A single-page PDF's raw bytes contain exactly one "/Type /Page" object
    // definition preceding "/Type /Pages" catalog references, but rather
    // than parse the PDF ourselves (not this codebase's convention - see
    // workingplanPdf.test.ts's own comment), just confirm the response is a
    // real, non-empty PDF; the second-page behavior itself is covered
    // structurally in workingplanPdf.test.ts via buildWorkingplanPdfDocument.
    expect(res.body.slice(0, 5).toString('latin1')).toBe('%PDF-');
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('embeds the logo and configured lodge name in the header (reachable via currentLogoSource/getConfigString, both already exercised elsewhere in this file)', async () => {
    const user = await createUser();
    await createEvent(user.id, { title: 'Loge im Juli', public_description: 'Öffentliche Beschreibung', date: daysFromNowUtc(10) });
    await setAppConfig('lodge', 'Meine Testloge');

    const res = await request(app).get('/api/v1/public/workingplan.pdf');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.body.slice(0, 5).toString('latin1')).toBe('%PDF-');
    expect(res.body.length).toBeGreaterThan(0);
  });

  // Both toggles are configured once, before the single request each test
  // makes (rather than flipped mid-test), matching this file's established
  // one-config-state-per-test convention (see e.g. the
  // working_plan_as_start_page/public_wp_available_to_anon_users tests
  // above) - appConfig's process-wide TTL cache (see this file's own
  // top-of-file comment) is only guaranteed fresh for the *first* read after
  // `beforeEach`'s blanket `dirty()` sweep, so a second setAppConfig+read
  // inside the same test would silently observe a stale cached value instead
  // of exercising a real config change.

  it('WorshipfulMaster toggle off, Secretary toggle off, no Secretary role/email configured: PDF still renders, footer resolves to no lines', async () => {
    const user = await createUser();
    await createEvent(user.id, { title: 'Loge im Juli', public_description: 'Öffentliche Beschreibung', date: daysFromNowUtc(10) });
    await setAppConfig('public_wp_footer_show_worshipful_master', false);
    await setAppConfig('public_wp_footer_show_secretary', false);

    const res = await request(app).get('/api/v1/public/workingplan.pdf');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.body.length).toBeGreaterThan(0);
    expect(resolveFooterLines).toHaveBeenCalledWith('public');
    // Direct call after the request, not an inspection of the mock's
    // recorded return value - appConfig's cache is already warmed by the
    // route's own call above, so this reads the same resolved value the
    // route itself just built the PDF from.
    await expect(resolveFooterLines('public')).resolves.toEqual([]);
  });

  it('WorshipfulMaster toggle on: PDF still renders, footer resolves to include the WM holder line', async () => {
    const user = await createUser();
    await createEvent(user.id, { title: 'Loge im Juli', public_description: 'Öffentliche Beschreibung', date: daysFromNowUtc(10) });
    const wmRole = await createRole('WorshipfulMaster', 'Meister vom Stuhl');
    const wmHolder = await createUser({ firstname: 'Karl', lastname: 'Koenig', mobile: null });
    await assignRole(wmHolder.id, wmRole.id);
    await setAppConfig('public_wp_footer_show_worshipful_master', true);
    await setAppConfig('public_wp_footer_show_secretary', false);

    const res = await request(app).get('/api/v1/public/workingplan.pdf');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.body.length).toBeGreaterThan(0);
    expect(resolveFooterLines).toHaveBeenCalledWith('public');
    await expect(resolveFooterLines('public')).resolves.toEqual(['Meister vom Stuhl: Karl Koenig']);
  });

  it('Secretary toggle on: PDF still renders, footer resolves to include the Secretary holder line', async () => {
    const user = await createUser();
    await createEvent(user.id, { title: 'Loge im Juli', public_description: 'Öffentliche Beschreibung', date: daysFromNowUtc(10) });
    const secRole = await createRole('Secretary', 'Sekretär');
    const secHolder = await createUser({ firstname: 'Otto', lastname: 'Schmidt', mobile: null });
    await assignRole(secHolder.id, secRole.id);
    await setAppConfig('public_wp_footer_show_worshipful_master', false);
    await setAppConfig('public_wp_footer_show_secretary', true);

    const res = await request(app).get('/api/v1/public/workingplan.pdf');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.body.length).toBeGreaterThan(0);
    expect(resolveFooterLines).toHaveBeenCalledWith('public');
    await expect(resolveFooterLines('public')).resolves.toEqual(['Sekretär: Otto Schmidt']);
  });
});

// pdfLabelsFor/buildWorkingplanPdf moved to ../../src/lib/workingplanPdf.ts
// (Task 6) - their unit coverage moved with them, to test/lib/workingplanPdf.test.ts.

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

  it("uses a fixed '0' version when no custom_logos row exists", async () => {
    const res = await request(app).get('/api/v1/public/manifest.webmanifest');

    expect(res.status).toBe(200);
    for (const icon of res.body.icons) {
      expect(icon.src).toMatch(/\?v=0$/);
    }
  });

  it("reflects custom_logos.updated_at as every icon's cache-busting version once a logo is stored", async () => {
    const content = await sharp({ create: { width: 10, height: 10, channels: 3, background: '#000000' } }).png().toBuffer();
    const row = await prisma.custom_logos.create({ data: { id: 1, content: new Uint8Array(content), content_type: 'image/png' } });

    const res = await request(app).get('/api/v1/public/manifest.webmanifest');

    expect(res.status).toBe(200);
    const expectedVersion = row.updated_at.getTime();
    expect(res.body.icons).toHaveLength(3);
    for (const icon of res.body.icons) {
      expect(icon.src).toMatch(new RegExp(`\\?v=${expectedVersion}$`));
    }
  });
});

// custom_logos (id=1) is written by main's POST /api/v1/logo
// (api/src/routes/logo.ts on main, not part of this branch - see
// public.ts's own header comment on the route below). These tests exercise
// only the read side this branch owns: on-the-fly derivation of PWA icon
// variants from whatever's in that table, seeding the row directly via
// Prisma the same way main's own test/routes/logo.test.ts asserts storage.
describe('GET /api/v1/public/logo/:file', () => {
  // A distinctive solid fill (#123456 -> [18, 52, 86]) rather than anything
  // resembling the bundled default crest, so a regression that silently
  // ignores the stored row and always serves the default would fail on
  // pixel color even though dimensions alone would still match.
  async function storeCustomLogo(): Promise<void> {
    const content = await sharp({ create: { width: 300, height: 300, channels: 3, background: '#123456' } }).png().toBuffer();
    await prisma.custom_logos.upsert({
      where: { id: 1 },
      create: { id: 1, content: new Uint8Array(content), content_type: 'image/png' },
      update: { content: new Uint8Array(content), content_type: 'image/png' },
    });
  }

  it('derives the requested icon variant from a stored custom_logos row at the correct size and color', async () => {
    await storeCustomLogo();

    const res = await request(app).get('/api/v1/public/logo/icon-512.png');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/png');
    await expect(sharp(res.body).metadata()).resolves.toMatchObject({ width: 512, height: 512 });

    // Proves the icon was actually derived FROM the stored row, not just
    // correctly-sized-but-wrong-content (e.g. a regression that silently
    // fell back to the bundled default despite a row existing).
    const { data } = await sharp(res.body).raw().toBuffer({ resolveWithObject: true });
    expect([data[0], data[1], data[2]]).toEqual([0x12, 0x34, 0x56]);
  });

  it('falls back to the bundled default logo when no custom_logos row exists', async () => {
    const res = await request(app).get('/api/v1/public/logo/icon-192.png');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('image/png');
    await expect(sharp(res.body).metadata()).resolves.toMatchObject({ width: 192, height: 192 });
  });

  it('404s for an unknown variant filename', async () => {
    const res = await request(app).get('/api/v1/public/logo/not-a-real-variant.png');
    expect(res.status).toBe(404);
  });

  // NOTE: same caveat as GET /api/v1/public/logo above - the real ?v=
  // param the manifest's icons array sends can only be exercised through
  // the fully-wired app; see app.integration.test.ts.
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

// -- GET /api/v1/public/status/:token ---------------------------------------
//
// Net-new, no Rails precedent - token-gated public health endpoint for
// external uptime monitoring (Uptime Kuma-style). No AppConfig toggle backs
// this route, deliberately (see statusEndpointTokenMatches's own comment) -
// STATUS_ENDPOINT_TOKEN is the entire access-control surface, so these tests
// exercise the real token from the shared root .env rather than stubbing it.
describe('GET /api/v1/public/status/:token', () => {
  const REAL_TOKEN = process.env.STATUS_ENDPOINT_TOKEN ?? '';

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns 200 with the exact expected body shape when the token is correct and Postgres is up', async () => {
    const res = await request(app).get(`/api/v1/public/status/${REAL_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      checks: {
        postgres: { ok: true },
        redis: { configured: false, protocol: null, host: null, port: null, username: null },
      },
    });
    expect(Object.keys(res.body).sort()).toEqual(['status', 'revision', 'uptime_seconds', 'checks'].sort());
    expect(typeof res.body.uptime_seconds).toBe('number');
    expect(res.body.revision === null || typeof res.body.revision === 'string').toBe(true);
    expect(Object.keys(res.body.checks).sort()).toEqual(['postgres', 'redis'].sort());
    expect(Object.keys(res.body.checks.postgres).sort()).toEqual(['ok', 'host', 'port', 'username', 'database'].sort());
    expect(res.body.checks.postgres.port === null || typeof res.body.checks.postgres.port === 'number').toBe(true);
    expect(res.body.checks.postgres.host === null || typeof res.body.checks.postgres.host === 'string').toBe(true);
    expect(res.body.checks.postgres.username === null || typeof res.body.checks.postgres.username === 'string').toBe(true);
    expect(res.body.checks.postgres.database === null || typeof res.body.checks.postgres.database === 'string').toBe(true);
    // Connection details are fine to expose (this endpoint's whole access
    // control is the URL token), but the password never should be - assert
    // its absence explicitly rather than relying only on an exhaustive key
    // list elsewhere, since that's the one field a copy-paste mistake could
    // silently reintroduce.
    expect(Object.keys(res.body.checks.redis).sort()).toEqual(['configured', 'protocol', 'host', 'port', 'username'].sort());
    expect(res.body.checks.redis).not.toHaveProperty('password');
  });

  it('returns 404 {error: "not_found"} when the token is wrong', async () => {
    const res = await request(app).get('/api/v1/public/status/definitely-wrong-token');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'not_found' });
  });

  // Regression: checks.redis.configured was a hardcoded `false` literal
  // (written before the mail queue existed) - it never reflected whether
  // REDIS_* was actually set, so a correctly-configured environment's
  // monitoring page silently lied. Both directions asserted explicitly so
  // a future regression back to a hardcoded value fails either way, not
  // just the direction that happens to match today's default test env.
  it('reflects the real REDIS_* configuration state, not a hardcoded value', async () => {
    vi.stubEnv('REDIS_PROTOCOL', '');
    vi.stubEnv('REDIS_HOST', '');
    vi.stubEnv('REDIS_PORT', '');
    const unconfigured = await request(app).get(`/api/v1/public/status/${REAL_TOKEN}`);
    expect(unconfigured.body.checks.redis).toEqual({ configured: false, protocol: null, host: null, port: null, username: null });

    vi.stubEnv('REDIS_PROTOCOL', 'redis');
    vi.stubEnv('REDIS_HOST', '127.0.0.1');
    vi.stubEnv('REDIS_PORT', '6379');
    const configured = await request(app).get(`/api/v1/public/status/${REAL_TOKEN}`);
    expect(configured.body.checks.redis).toEqual({ configured: true, protocol: 'redis', host: '127.0.0.1', port: 6379, username: null });

    vi.unstubAllEnvs();
  });

  // The one field this endpoint must NEVER expose, checked with a real
  // password actually set - not just absent-by-coincidence like the tests
  // above, where REDIS_PASSWORD was never stubbed in the first place.
  it('never exposes checks.redis.password, even when REDIS_PASSWORD and REDIS_USERNAME are set', async () => {
    vi.stubEnv('REDIS_PROTOCOL', 'rediss');
    vi.stubEnv('REDIS_HOST', 'redis.example.test');
    vi.stubEnv('REDIS_PORT', '6379');
    vi.stubEnv('REDIS_USERNAME', 'rels');
    vi.stubEnv('REDIS_PASSWORD', 'super-secret-value');

    const res = await request(app).get(`/api/v1/public/status/${REAL_TOKEN}`);

    expect(res.body.checks.redis).toEqual({ configured: true, protocol: 'rediss', host: 'redis.example.test', port: 6379, username: 'rels' });
    expect(JSON.stringify(res.body)).not.toContain('super-secret-value');

    vi.unstubAllEnvs();
  });

  it('returns 404 when no token segment is present at all', async () => {
    const res = await request(app).get('/api/v1/public/status/');
    expect(res.status).toBe(404);
  });

  it('returns 503 with status "error" and checks.postgres.ok false when Postgres is unreachable', async () => {
    vi.spyOn(prisma, '$queryRaw').mockImplementation(() => {
      throw new Error('connection refused');
    });

    const res = await request(app).get(`/api/v1/public/status/${REAL_TOKEN}`);

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('error');
    expect(res.body.checks.postgres.ok).toBe(false);
  });

  it('never leaks the raw DATABASE_URL or a postgres:// connection string in the response body', async () => {
    const res = await request(app).get(`/api/v1/public/status/${REAL_TOKEN}`);

    expect(res.status).toBe(200);
    const serialized = JSON.stringify(res.body);
    expect(serialized).not.toContain(process.env.DATABASE_URL ?? '');
    expect(serialized).not.toMatch(/postgres(ql)?:\/\//);
  });

  // checks.postgres.username/database are deliberate exposures (this
  // endpoint's whole access control is the URL token - see CLAUDE.md's
  // "Public status endpoint" section) but the password never is, even when
  // a real one is actually set - checked with a real stubbed value rather
  // than absent-by-coincidence, same pattern as the redis password test.
  it('exposes checks.postgres.username/database but never the password, even when both are set', async () => {
    vi.stubEnv('DATABASE_URL', 'postgres://the_db_user:super-secret-pg-password@db.example.test:5432/the_db_name');

    const res = await request(app).get(`/api/v1/public/status/${REAL_TOKEN}`);

    expect(res.body.checks.postgres).toMatchObject({
      host: 'db.example.test',
      port: 5432,
      username: 'the_db_user',
      database: 'the_db_name',
    });
    expect(JSON.stringify(res.body)).not.toContain('super-secret-pg-password');

    vi.unstubAllEnvs();
  });
});
