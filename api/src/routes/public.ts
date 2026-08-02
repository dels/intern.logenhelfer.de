import ical, { ICalEventTransparency } from 'ical-generator';
import { Router } from 'express';
import { jsPDF } from 'jspdf';
import { autoTable } from 'jspdf-autotable';

import { prisma } from '../db.js';
import { ApiError } from '../lib/errors.js';
import { appConfig } from '../lib/appConfig.js';
import { DEMO_ACCOUNTS } from '../lib/demoSeed.js';

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

/**
 * The singleton `custom_logos` row's `updated_at` epoch, if a custom logo has
 * been uploaded (Task 3's `POST`/`DELETE /api/v1/logo`) - `null` if none has.
 * Consumed as a cache-busting version token by the frontend's `<BijouLogo>`
 * (Task 5), not rendered directly.
 */
async function currentLogoVersion(): Promise<number | null> {
  const row = await prisma.custom_logos.findUnique({ where: { id: 1 }, select: { updated_at: true } });
  return row ? row.updated_at.getTime() : null;
}

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
 * Port of PublicImpressumController#rendered_impressum. Single pass over the
 * raw text (matching the Rails comment's rationale: substituting a mail
 * field introduces a literal ":" via "mailto:", so a second generic pass
 * would re-match and clobber it) - every `:token` found is resolved via one
 * batched set of AppConfig lookups first, then substituted back in with a
 * single non-async `String#replace`.
 */
async function renderImpressum(): Promise<string> {
  const raw = await getConfigString('impressum');
  if (raw === null || raw.trim().length === 0) {
    return IMPRESSUM_PLACEHOLDER;
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

export default router;
