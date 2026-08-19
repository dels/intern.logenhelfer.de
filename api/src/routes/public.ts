import { timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ical, { ICalEventTransparency } from 'ical-generator';
import { Router } from 'express';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

import { prisma, databaseConnectionDetails } from '../db.js';
import { ApiError } from '../lib/errors.js';
import { appConfig } from '../lib/appConfig.js';
import { DEMO_ACCOUNTS } from '../lib/demoSeed.js';
import { redisConfigured } from '../lib/mailQueue.js';
import { deriveLogoVariants, type LogoVariants } from '../lib/logoVariants.js';
import { statusRateLimiter } from '../middleware/rateLimit.js';

/**
 * Port of:
 *   - rails-app/app/controllers/api/v1/public_landing_controller.rb
 *   - rails-app/app/controllers/api/v1/public_impressum_controller.rb
 *   - rails-app/app/controllers/api/v1/public_workingplan_controller.rb
 *
 * All three are fully public (`skip_before_action :authenticate_api_user!`
 * in every one of them) - no `authenticateApiUser` middleware is applied
 * anywhere in this file, deliberately. The only gating is via AppConfig
 * flags, never identity/roles.
 *
 * All AppConfig reads go through the shared `appConfig` service
 * (`../lib/appConfig.js`), which already ports rails-app/app/models/app_config.rb's
 * per-environment key prefixing/defaults/cache and
 * rails-app/app/models/app_config/adapter.rb's `getter_*` coercions
 * (boolean casting, "6m"/"2w"/"10d" duration-string parsing for the two
 * workingplan-timespan keys) - no re-implementation of any of that here.
 */

const router = Router();

// -- AppConfig helpers --------------------------------------------------

/**
 * Reads an AppConfig key and coerces whatever the shared service resolves
 * (boolean/number/string) to its string representation, mirroring Ruby's
 * implicit `to_s` call on a `String#gsub` block's return value - the
 * mechanism `PublicImpressumController#rendered_impressum` relies on when a
 * template token happens to resolve to a non-string AppConfig value.
 * `null` (an unconfigured key with no default) stays `null`.
 */
async function getConfigString(key: string): Promise<string | null> {
  const value = await appConfig.get(key);
  return value === null ? null : String(value);
}

/**
 * Port of `ActiveModel::Type::Boolean.new.cast(AppConfig[...])` used by both
 * PublicLandingController and PublicWorkingplanController - the shared
 * service already applies the ActiveModel::Type::Boolean cast for
 * `boolean`-typed keys; `Boolean(...)` here just folds the `nil` case (no
 * row, no default) to `false`, matching every actual call site's use of the
 * result in a boolean context (`&&`/`unless`).
 */
async function getBoolean(key: string): Promise<boolean> {
  return Boolean(await appConfig.get(key));
}

/**
 * Port of `AppConfig::Adapter#getter_default_workingplan_timespan` as
 * exposed by the shared service (already parses "Nm"/"Nw"/"Nd" into a plain
 * day count) - falls back to Ruby's `4 * 30` only in the (currently
 * unreachable, since both timespan keys have compiled-in defaults) case
 * where the service has nothing to resolve.
 */
async function getTimespanDays(key: string): Promise<number> {
  const value = await appConfig.get(key);
  return typeof value === 'number' ? value : 4 * 30;
}

async function anonAccessEnabled(): Promise<boolean> {
  return getBoolean('public_wp_available_to_anon_users');
}

async function birthdayCalendarAvailable(): Promise<boolean> {
  return getBoolean('birthday_calendar_available');
}

/**
 * Constant-time comparison against STATUS_ENDPOINT_TOKEN (provisioned like
 * MFA_ENCRYPTION_KEY - see bin/init-env/bin/deploy-to). No AppConfig toggle
 * backs this route - the token is the entire access-control surface;
 * rotating it in .env.<env> is how monitoring access gets revoked.
 */
function statusEndpointTokenMatches(candidate: string): boolean {
  const expected = process.env.STATUS_ENDPOINT_TOKEN ?? '';
  if (expected.length === 0) {
    return false;
  }
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Looks up the feed's caller by their own per-user
 * `users.birthday_calendar_token` (DB-generated, unique - see
 * schema.prisma's comment on that column). Unlike the single shared
 * BIRTHDAY_CALENDAR_SECRET this replaced, this makes the feed link
 * per-person-revocable: offboarding a member (which sets `deleted`) breaks
 * *only* their own link, not everyone else's, without anyone having to
 * rotate a shared secret. A plain indexed-equality DB lookup (not a
 * constant-time compare) is the right tool here, same as every other
 * `:uuid`-keyed lookup in this codebase (events.ts's findVisibleEvent etc.)
 * - timingSafeEqual matters for a single fixed in-process secret string
 * compared byte-by-byte in JS, not for a keyed index lookup against a
 * random 128-bit value.
 *
 * Deliberately does NOT scope content to this specific user - the feed
 * itself is still the same org-wide, consent-filtered roster for every
 * caller. The per-user token is an access-control/revocation mechanism
 * only, not a content filter.
 */
async function findBirthdayCalendarTokenOwner(token: string): Promise<{ id: number } | null> {
  return prisma.users.findFirst({ where: { birthday_calendar_token: token, deleted: { not: true } }, select: { id: true } });
}

/**
 * Exported for me.ts: the ICS URL is only ever handed to an *authenticated*
 * caller now (via GET /api/v1/me, built from that caller's own token) - see
 * this file's own /landing handler's comment for why it must never be
 * surfaced on the fully-unauthenticated public/landing route.
 */
export async function birthdayCalendarIcsUrl(userToken: string): Promise<string | null> {
  if (!(await birthdayCalendarAvailable())) {
    return null;
  }
  return `/api/v1/public/birthdays/${userToken}/calendar.ics`;
}

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

interface BirthdayRow {
  uuid: string | null;
  firstname: string;
  lastname: string;
  date_of_birth: Date;
}

/** How many yearly occurrences to emit per member on every fetch (regenerated fresh, no RRULE - see the design spec for why). */
const BIRTHDAY_FEED_YEARS = 3;

function birthdayOccurrences(row: BirthdayRow, fromYear: number): Array<{ date: Date; age: number }> {
  const birthMonth = row.date_of_birth.getUTCMonth();
  const birthDay = row.date_of_birth.getUTCDate();
  const birthYear = row.date_of_birth.getUTCFullYear();
  // Date.UTC would otherwise silently roll Feb 29 over into March 1st in a
  // non-leap occurrence year (JS Date normalizes out-of-range day numbers) -
  // Feb 28 is the intended fallback per the design spec, so this is handled
  // explicitly rather than relying on that normalization.
  const isFeb29 = birthMonth === 1 && birthDay === 29;
  const occurrences: Array<{ date: Date; age: number }> = [];
  for (let i = 0; i < BIRTHDAY_FEED_YEARS; i += 1) {
    const year = fromYear + i;
    const day = isFeb29 && !isLeapYear(year) ? 28 : birthDay;
    occurrences.push({ date: new Date(Date.UTC(year, birthMonth, day)), age: year - birthYear });
  }
  return occurrences;
}

/** Initials only, never full names - e.g. "A. B.s 57. Geburtstag". */
function birthdaySummary(row: BirthdayRow, age: number): string {
  const firstInitial = row.firstname.trim().charAt(0).toUpperCase();
  const lastInitial = row.lastname.trim().charAt(0).toUpperCase();
  return `${firstInitial}. ${lastInitial}.s ${age}. Geburtstag`;
}

/**
 * Batch admin-detection for the blanket-consent-mode feed (see the route's
 * own comment on why only blanket mode needs this) - mirrors
 * ability.ts's `isAdmin`/`canViewUserInDirectory` (the same admin-hiding
 * rule the authenticated GET /api/v1/members/birthday_list roster already
 * applies via canSeeAdminAccount), reproduced narrowly here rather than
 * importing from members.ts's private helpers, since this route only needs
 * "is this user an Admin," not the full role-row shape members.ts's
 * memberDetailJson needs. Two queries regardless of how many userIds are
 * passed (no N+1) - same two-step user_roles-then-roles join pattern
 * members.ts's loadRoleRowsForUsers already uses, since user_roles/roles
 * have no Prisma relation defined between them.
 */
async function adminUserIds(userIds: number[]): Promise<Set<number>> {
  if (userIds.length === 0) return new Set();
  const adminRole = await prisma.roles.findFirst({ where: { name: 'Admin' } });
  if (!adminRole) return new Set();
  const rows = await prisma.user_roles.findMany({
    where: { user_id: { in: userIds }, role_id: adminRole.id },
    select: { user_id: true },
  });
  return new Set(rows.map((r) => r.user_id).filter((id): id is number => id !== null));
}

// -- logo / PWA icons -----------------------------------------------------

/**
 * The singleton `custom_logos` row's `updated_at` epoch, if a custom logo has
 * been uploaded (`POST /api/v1/logo`) - `null` if none has. Consumed both as
 * a cache-busting version token by the frontend's `<BijouLogo>` (via
 * `/landing`'s `logo_version`) and by this file's own manifest/icon routes
 * below, for the same purpose.
 */
async function currentLogoVersion(): Promise<number | null> {
  const row = await prisma.custom_logos.findUnique({ where: { id: 1 }, select: { updated_at: true } });
  return row ? row.updated_at.getTime() : null;
}

const DEFAULT_LOGO_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../assets/bijou-large.png');

/**
 * Derives every PWA icon variant on the fly from whichever image is
 * currently authoritative: the admin-uploaded `custom_logos` row if one
 * exists, otherwise the same bundled default crest the frontend's own
 * `<BijouLogo>` falls back to (`app/src/assets/bijou-large.png`, bundled
 * here as `api/assets/bijou-large.png` for visual consistency between the
 * in-app fallback and the installed PWA's icon) - see this route's own
 * comment for why there's no caching/storage of the derived bytes.
 */
async function currentLogoSource(): Promise<Buffer> {
  const row = await prisma.custom_logos.findUnique({ where: { id: 1 } });
  if (row) return Buffer.from(row.content);
  return readFile(DEFAULT_LOGO_PATH);
}

const LOGO_VARIANT_NAMES: Record<string, keyof LogoVariants> = {
  'icon-192.png': 'icon192',
  'icon-512.png': 'icon512',
  'icon-512-maskable.png': 'icon512Maskable',
  'apple-touch-icon.png': 'appleTouchIcon',
};

// -- date helpers -----------------------------------------------------------

/** UTC midnight for "today" - matches events.ts's date-only conventions (formatDateOnly/parseDateOnlyParam). */
function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addDaysUtc(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Formats a `@db.Time` column value back to "HH:MM", always reading UTC fields - matches events.ts's formatTime. */
function formatTime(value: Date | null): string | null {
  if (!value) return null;
  const hh = String(value.getUTCHours()).padStart(2, '0');
  const mm = String(value.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Port of ActiveSupport's Object#blank? for the public_description string check. */
function isBlank(value: string | null): boolean {
  return value === null || value.trim().length === 0;
}

// -- impressum ----------------------------------------------------------

const IMPRESSUM_PLACEHOLDER = '<h2>Impressum noch nicht konfiguriert</h2><br />Bitte in der Anwendungskonfiguration hinterlegen.';

/** The four AppConfig keys PublicImpressumController#MAIL_FIELDS special-cases into mailto links. */
const MAIL_FIELDS = new Set(['user_change_notification_email', 'default_from_email', 'technical_contact_email', 'mvst_email']);

function mailtoLink(address: string): string {
  return `<a href="mailto:${address}">${address}</a>`;
}

/**
 * Port of PublicImpressumController#rendered_impressum, generalized to any
 * AppConfig text key so the Datenschutzerklärung (below) can reuse the exact
 * same `:token` substitution instead of a second copy of this logic. Single
 * pass over the raw text (matching the Rails comment's rationale:
 * substituting a mail field introduces a literal ":" via "mailto:", so a
 * second generic pass would re-match and clobber it) - every `:token` found
 * is resolved via one batched set of AppConfig lookups first, then
 * substituted back in with a single non-async `String#replace`.
 */
async function renderTemplatedConfig(configKey: string, placeholder: string): Promise<string> {
  const raw = await getConfigString(configKey);
  if (raw === null || raw.trim().length === 0) {
    return placeholder;
  }

  const tokenPattern = /:(\w+)/g;
  const keys = new Set<string>();
  for (const match of raw.matchAll(tokenPattern)) {
    const key = match[1];
    if (key !== undefined) keys.add(key);
  }

  const resolved = new Map<string, string | null>();
  await Promise.all(
    [...keys].map(async (key) => {
      resolved.set(key, await getConfigString(key));
    }),
  );

  return raw.replace(tokenPattern, (_full, key: string) => {
    const value = resolved.get(key) ?? null;
    if (MAIL_FIELDS.has(key)) {
      return mailtoLink(value ?? '');
    }
    return value ?? '';
  });
}

async function renderImpressum(): Promise<string> {
  return renderTemplatedConfig('impressum', IMPRESSUM_PLACEHOLDER);
}

// -- datenschutz ----------------------------------------------------------

const DATENSCHUTZ_PLACEHOLDER = '<h2>Datenschutzerklärung noch nicht konfiguriert</h2><br />Bitte in der Anwendungskonfiguration hinterlegen.';

/** Same `:token`/mailto-link substitution as the Impressum - see renderTemplatedConfig above. */
async function renderDatenschutz(): Promise<string> {
  return renderTemplatedConfig('datenschutz', DATENSCHUTZ_PLACEHOLDER);
}

// -- help -----------------------------------------------------------------

const HELP_PLACEHOLDER = '<h2>Hilfe noch nicht konfiguriert</h2><br />Bitte in der Anwendungskonfiguration hinterlegen.';

/**
 * Simpler sibling of renderImpressum - Help has no mailto-token
 * substitution requirement, so this is a straight passthrough of the
 * admin-authored HTML once it's been configured.
 */
async function renderHelp(): Promise<string> {
  const raw = await getConfigString('help');
  if (raw === null || raw.trim().length === 0) {
    return HELP_PLACEHOLDER;
  }
  return raw;
}

// -- workingplan ----------------------------------------------------------

interface PublicEventRow {
  title: string | null;
  location: string | null;
  public_description: string | null;
  date: string;
  whole_day: boolean;
  time: string | null;
}

async function visiblePublicEvents(from: Date, to: Date) {
  const events = await prisma.events.findMany({
    where: { deleted: false, date: { gte: from, lte: to } },
    orderBy: [{ date: 'asc' }, { whole_day: 'asc' }, { time: 'asc' }],
  });
  return events.filter((event) => !isBlank(event.public_description));
}

function publicEventJson(event: { title: string | null; location: string | null; public_description: string | null; date: Date; whole_day: boolean | null; time: Date | null }): PublicEventRow {
  const wholeDay = event.whole_day === true;
  return {
    title: event.title,
    location: event.location,
    public_description: event.public_description,
    date: formatDateOnly(event.date),
    whole_day: wholeDay,
    time: wholeDay ? null : formatTime(event.time),
  };
}

// -- routes -----------------------------------------------------------------

// GET /api/v1/public/landing
router.get('/landing', async (_req, res, next) => {
  try {
    const [startPage, anonEnabled, lodge, language, logoVersion] = await Promise.all([
      getBoolean('working_plan_as_start_page'),
      getBoolean('public_wp_available_to_anon_users'),
      getConfigString('lodge'),
      getConfigString('language'),
      currentLogoVersion(),
    ]);

    res.status(200).json({
      calendar_as_landing_page: startPage && anonEnabled,
      lodge: lodge ?? '',
      language: language ?? 'de',
      logo_version: logoVersion,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/public/logo
router.get('/logo', async (_req, res, next) => {
  try {
    const row = await prisma.custom_logos.findUnique({ where: { id: 1 } });
    if (!row) {
      throw ApiError.notFound();
    }
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.status(200).type(row.content_type).send(Buffer.from(row.content));
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/public/impressum
router.get('/impressum', async (_req, res, next) => {
  try {
    res.status(200).json({ html: await renderImpressum() });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/public/datenschutz
router.get('/datenschutz', async (_req, res, next) => {
  try {
    res.status(200).json({ html: await renderDatenschutz() });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/public/help
router.get('/help', async (_req, res, next) => {
  try {
    res.status(200).json({ html: await renderHelp() });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/public/demo-accounts
router.get('/demo-accounts', (_req, res, next) => {
  try {
    if (process.env.DEMO_MODE !== 'true') {
      throw ApiError.notFound();
    }
    res.status(200).json({ accounts: DEMO_ACCOUNTS.map(({ email, role }) => ({ email, role })) });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/public/workingplan
router.get('/workingplan', async (_req, res, next) => {
  try {
    if (!(await anonAccessEnabled())) {
      throw ApiError.notFound();
    }

    const days = await getTimespanDays('public_workingplan_html_timespan');
    const from = todayUtc();
    const to = addDaysUtc(from, days);

    const events = await visiblePublicEvents(from, to);

    res.status(200).json({
      from: formatDateOnly(from),
      to: formatDateOnly(to),
      rows: events.map(publicEventJson),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/public/workingplan.ics
router.get('/workingplan.ics', async (_req, res, next) => {
  try {
    if (!(await anonAccessEnabled())) {
      throw ApiError.notFound();
    }

    const days = await getTimespanDays('public_workingplan_ics_timespan');
    const from = todayUtc();
    const to = addDaysUtc(from, days);
    const domain = (await getConfigString('domain')) ?? 'logenhelfer.de';

    const events = await visiblePublicEvents(from, to);

    const language = ((await getConfigString('language')) ?? 'de').toUpperCase();
    const lodge = (await getConfigString('lodge')) ?? 'Logenhelfer';
    const calendar = ical({ timezone: 'Europe/Berlin', prodId: { company: lodge, product: 'Arbeitsplan', language } });
    for (const event of events) {
      const wholeDay = event.whole_day === true;
      // Rails' Event#ical_event sets dtstart/beginning_of_day + dtend/end_of_day
      // for whole-day events rather than the iCal "VALUE=DATE, next-day
      // exclusive end" idiom; ical-generator's `allDay` flag is the more
      // conventional representation of the same intent and is used here
      // instead - a deliberate fidelity deviation, not tested by the ported
      // spec (which never sets whole_day: true), flagged rather than
      // silently guessing byte-for-byte VEVENT output.
      const time = event.time;
      const startDateTime = wholeDay
        ? event.date
        : new Date(Date.UTC(event.date.getUTCFullYear(), event.date.getUTCMonth(), event.date.getUTCDate(), time?.getUTCHours() ?? 0, time?.getUTCMinutes() ?? 0));
      const endDateTime = wholeDay
        ? addDaysUtc(event.date, 1)
        : new Date(startDateTime.getTime() + 60 * 60 * 1000);

      calendar.createEvent({
        id: `${event.uuid ?? ''}@${domain}`,
        start: startDateTime,
        end: endDateTime,
        allDay: wholeDay,
        summary: event.title ?? '',
        description: event.public_description ?? '',
        transparency: ICalEventTransparency.TRANSPARENT,
        stamp: event.created_at,
        ...(event.updated_at.getTime() !== event.created_at.getTime() ? { lastModified: event.updated_at } : {}),
      });
    }

    res.status(200).type('text/calendar').send(calendar.toString());
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/public/birthdays/:token/calendar.ics
//
// Net-new, no Rails precedent (unlike the rest of this file). Gated on two
// independent things, both required: birthday_calendar_available (an admin
// decision, like every other flag here) AND the token path segment matching
// some non-deleted user's own birthday_calendar_token - see
// findBirthdayCalendarTokenOwner's own comment for why this feed needs a
// per-user token and workingplan.ics doesn't.
router.get('/birthdays/:token/calendar.ics', async (req, res, next) => {
  try {
    if (!(await birthdayCalendarAvailable()) || !(await findBirthdayCalendarTokenOwner(req.params.token))) {
      throw ApiError.notFound();
    }

    const consentMode = (await getConfigString('birthday_calendar_consent_mode')) ?? 'individual';
    const allRows = await prisma.users.findMany({
      where: {
        deleted: { not: true },
        date_of_birth: { not: null },
        firstname: { not: null },
        lastname: { not: null },
        ...(consentMode === 'individual' ? { birthday_calendar_consent: true } : {}),
      },
      select: { id: true, uuid: true, firstname: true, lastname: true, date_of_birth: true },
    });

    // Blanket mode has no per-member opt-in to rely on (unlike individual
    // mode, where a member's own explicit consent already overrides this),
    // so it must not bypass the same admin-visibility rule the authenticated
    // birthday_list roster applies (ability.ts's canSeeAdminAccount /
    // canViewUserInDirectory). An anonymous caller here is never an admin
    // themselves, so that rule simplifies to: show_admins must be on, or
    // this user must not be an Admin.
    let rows = allRows;
    if (consentMode !== 'individual' && !(await getBoolean('show_admins'))) {
      const admins = await adminUserIds(allRows.map((u) => u.id));
      rows = allRows.filter((u) => !admins.has(u.id));
    }

    const domain = (await getConfigString('domain')) ?? 'logenhelfer.de';
    const language = ((await getConfigString('language')) ?? 'de').toUpperCase();
    const lodge = (await getConfigString('lodge')) ?? 'Logenhelfer';
    const calendar = ical({ timezone: 'Europe/Berlin', prodId: { company: lodge, product: 'Geburtstagskalender', language } });
    const fromYear = todayUtc().getUTCFullYear();

    for (const user of rows) {
      // Defensive re-check even though the Prisma `where` above already
      // filters null firstname/lastname/date_of_birth - TypeScript still
      // sees these as nullable coming back from Prisma, and an empty-string
      // firstname/lastname (not null, so not filtered above) would produce
      // an empty initial, which is skipped rather than emitted.
      if (!user.firstname?.trim() || !user.lastname?.trim() || !user.date_of_birth) {
        continue;
      }
      const row: BirthdayRow = { uuid: user.uuid, firstname: user.firstname, lastname: user.lastname, date_of_birth: user.date_of_birth };
      for (const occurrence of birthdayOccurrences(row, fromYear)) {
        calendar.createEvent({
          // One UID per person PER YEAR (not a single recurring UID) - each
          // occurrence's SUMMARY has a different age, so each needs its own
          // stable identity instead of sharing an RRULE'd UID.
          id: `birthday-${row.uuid ?? ''}-${occurrence.date.getUTCFullYear()}@${domain}`,
          start: occurrence.date,
          end: addDaysUtc(occurrence.date, 1),
          allDay: true,
          summary: birthdaySummary(row, occurrence.age),
          transparency: ICalEventTransparency.TRANSPARENT,
          stamp: new Date(),
        });
      }
    }

    res.status(200).type('text/calendar').send(calendar.toString());
  } catch (err) {
    next(err);
  }
});

interface PdfLabels {
  locale: string;
  weekday: string;
  date: string;
  time: string;
  description: string;
  allDay: string;
}

/** Static (non-user-authored) PDF chrome in both supported languages — the row content itself (title/description) is admin/member-authored and not translated. */
const PDF_LABELS: Record<string, PdfLabels> = {
  de: { locale: 'de-DE', weekday: 'Wochentag', date: 'Datum', time: 'Uhrzeit', description: 'Beschreibung', allDay: 'ganztags' },
  en: { locale: 'en-US', weekday: 'Weekday', date: 'Date', time: 'Time', description: 'Description', allDay: 'all day' },
};

/** Exported standalone so its selection logic is unit-testable without rendering a full PDF (jsPDF's output isn't practically assertable in a unit test). */
export function pdfLabelsFor(language: string): PdfLabels {
  return PDF_LABELS[language] ?? PDF_LABELS.de!;
}

function pdfMonthLabel(dateStr: string, labels: PdfLabels): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(labels.locale, { month: 'long', year: 'numeric' });
}

/** Server-side port of app/src/features/public-calendar/api.ts's downloadPublicWorkingplanPdf, so /arbeitsplan.pdf can be a stable, linkable URL instead of a client-side-only blob download. */
function buildWorkingplanPdf(rows: PublicEventRow[], language: string): Buffer {
  const labels = pdfLabelsFor(language);
  const doc = new jsPDF({ orientation: 'portrait', format: 'a4' });
  let lastMonth = '';
  let lastDate = '';
  const body: string[][] = [];
  for (const row of rows) {
    const month = pdfMonthLabel(row.date, labels);
    if (month !== lastMonth) {
      body.push([`— ${month} —`, '', '', '']);
      lastMonth = month;
      lastDate = '';
    }
    const weekday = new Date(`${row.date}T00:00:00`).toLocaleDateString(labels.locale, { weekday: 'long' });
    const dateCell = row.date === lastDate ? '' : new Date(`${row.date}T00:00:00`).toLocaleDateString(labels.locale);
    lastDate = row.date;
    const timeCell = row.whole_day ? labels.allDay : (row.time ?? '');
    body.push([weekday, dateCell, timeCell, row.public_description ?? '']);
  }
  autoTable(doc, {
    head: [[labels.weekday, labels.date, labels.time, labels.description]],
    body,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.5 },
    alternateRowStyles: { fillColor: [221, 221, 221] },
  });
  return Buffer.from(doc.output('arraybuffer'));
}

// GET /api/v1/public/workingplan.pdf
router.get('/workingplan.pdf', async (_req, res, next) => {
  try {
    if (!(await anonAccessEnabled())) {
      throw ApiError.notFound();
    }

    const days = await getTimespanDays('public_workingplan_html_timespan');
    const from = todayUtc();
    const to = addDaysUtc(from, days);

    const events = await visiblePublicEvents(from, to);
    const rows = events.map(publicEventJson);
    const language = (await getConfigString('language')) ?? 'de';
    const pdf = buildWorkingplanPdf(rows, language);

    res.status(200).type('application/pdf').send(pdf);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/public/manifest.webmanifest
router.get('/manifest.webmanifest', async (_req, res, next) => {
  try {
    const lodge = (await getConfigString('lodge')) ?? 'Logenhelfer';
    const lodgeShort = (await getConfigString('lodge_short')) ?? lodge;
    const language = (await getConfigString('language')) ?? 'de';
    const logoVersion = await currentLogoVersion();
    // Always resolve to a real, always-valid icon URL - a fixed '0' when no
    // custom_logos row exists yet (rather than omitting the version or
    // crashing), since the icon route itself always has a bundled default
    // to derive from regardless of whether a row exists.
    const version = logoVersion ?? 0;

    res.status(200).type('application/manifest+json').json({
      name: lodge,
      short_name: lodgeShort,
      lang: language,
      start_url: '/',
      display: 'standalone',
      theme_color: '#1E56B0',
      background_color: '#F7F8FA',
      icons: [
        { src: `/api/v1/public/logo/icon-192.png?v=${version}`, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: `/api/v1/public/logo/icon-512.png?v=${version}`, sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: `/api/v1/public/logo/icon-512-maskable.png?v=${version}`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/public/logo/:file
//
// Derives the requested PWA icon variant on the fly from whatever is
// currently authoritative (the uploaded custom_logos row, or the bundled
// default) on every request - no derived-variant caching/storage. Deliberate:
// small dev-scale traffic, and the long-lived immutable Cache-Control below
// (keyed by the manifest's own `?v=` cache-busting param) absorbs repeat
// requests client-side instead.
router.get('/logo/:file', async (req, res, next) => {
  try {
    const variant = LOGO_VARIANT_NAMES[req.params.file];
    if (!variant) {
      throw ApiError.notFound();
    }
    const source = await currentLogoSource();
    const variants = await deriveLogoVariants(source);
    res.set('Cache-Control', 'public, max-age=31536000, immutable');
    res.status(200).type('image/png').send(variants[variant]);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/public/status/:token
//
// Unauthenticated (no authenticateApiUser, same as every route in this
// file) but token-gated in the URL itself, for external uptime monitoring
// (Uptime Kuma-style). Deliberately has NO AppConfig toggle, unlike every
// other route in this file - the token is the only on/off switch (rotate
// STATUS_ENDPOINT_TOKEN in .env.<env> to revoke a previously-issued
// monitoring URL). Wrong/missing token -> uniform 404, same rationale as
// findBirthdayCalendarTokenOwner: this must not confirm the route even
// exists to an unauthenticated prober.
router.get<{ token: string }>('/status/:token', statusRateLimiter, async (req, res, next) => {
  try {
    if (!statusEndpointTokenMatches(req.params.token)) {
      throw ApiError.notFound();
    }

    let postgresOk = true;
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      postgresOk = false;
    }

    const { host, port, username, database } = databaseConnectionDetails();

    res.status(postgresOk ? 200 : 503).json({
      status: postgresOk ? 'ok' : 'error',
      revision: process.env.GIT_HASH ?? null,
      // Deploy-time PROXY, not a real deploy-timestamp mechanism: seconds
      // since THIS process started, not strictly "since the currently-active
      // slot was cut over" - they normally coincide in this blue/green setup,
      // but a bare process restart (crash, host reboot) also resets this.
      uptime_seconds: Math.floor(process.uptime()),
      checks: {
        postgres: { ok: postgresOk, host, port, username, database },
        // Whether the mail queue is routing through Redis vs. sending
        // inline (see mailQueue.ts's own doc comment) - not a live PING,
        // matching this field's name: "configured", not "ok". Connection
        // details are read straight off the same REDIS_* env vars
        // redisConfigured()/buildRedisConnection() use - protocol/host/port/
        // username, deliberately never the password, since this endpoint's
        // only access control is a single static token in the URL.
        redis: {
          configured: redisConfigured(),
          // `|| null`, not `?? null` - an empty string counts as unset here,
          // matching redisConfigured()'s own truthiness check, so a blanked
          // (e.g. test-gate's `-e REDIS_HOST=`) or merely-empty value reads
          // as null rather than as an empty string.
          protocol: process.env.REDIS_PROTOCOL || null,
          host: process.env.REDIS_HOST || null,
          port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : null,
          username: process.env.REDIS_USERNAME || null,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
