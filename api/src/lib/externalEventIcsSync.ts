import ical from 'node-ical';
import type { ParameterValue } from 'node-ical';

import { prisma } from '../db.js';
import { generateUniqueUuid } from './uuid.js';

/**
 * Net-new feature - the legacy Rails app never imported external ICS feeds
 * (it only ever exported its own internal events as ICS, via the
 * `icalendar` gem). No port to follow here.
 */

export interface ParsedIcsEvent {
  uid: string;
  title: string;
  location: string;
  description: string | null;
  date: Date;
  time: Date;
}

/**
 * node-ical represents SUMMARY/LOCATION/DESCRIPTION as a plain string when
 * the property has no iCalendar parameters, or as `{ val, params }` when it
 * does (e.g. `SUMMARY;LANGUAGE=de:Foo`). Unwrap to the plain string either
 * way - this app has no use for the parameters.
 */
function unwrapParam(value: ParameterValue<string> | undefined): string | undefined {
  if (value === undefined) return undefined;
  return typeof value === 'string' ? value : value.val;
}

function toDateOnly(d: Date, isAllDay: boolean): Date {
  // node-ical parses a DATE-only DTSTART (e.g. `DTSTART;VALUE=DATE:20260701`)
  // into a Date representing *local* midnight of that calendar day, not a
  // UTC instant (it also sets `dateOnly: true` on the Date object) - reading
  // it back with getUTC*() shifts the calendar date by the host's UTC
  // offset (e.g. one day back under UTC+2). Local getters recover the
  // intended calendar day regardless of host timezone. Timed events (with a
  // `Z`/offset suffix) are genuine UTC instants, so those still use the UTC
  // getters.
  if (isAllDay) return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function toTimeOnly(d: Date, isAllDay: boolean): Date {
  if (isAllDay) return new Date(Date.UTC(1970, 0, 1, 0, 0, 0));
  return new Date(Date.UTC(1970, 0, 1, d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()));
}

/**
 * Parses raw ICS text into the fields this app stores. Only VEVENT entries
 * with both a UID and a DTSTART are usable - anything else is skipped
 * (malformed/partial entries some feeds emit for cancelled occurrences).
 */
export function parseIcsEvents(icsText: string): ParsedIcsEvent[] {
  const parsed = ical.sync.parseICS(icsText);
  const events: ParsedIcsEvent[] = [];
  for (const component of Object.values(parsed)) {
    if (!component || component.type !== 'VEVENT') continue;
    const uid = component.uid;
    const start = component.start;
    if (!uid || !start) continue;
    // node-ical marks date-only (all-day) VEVENTs with datetype 'date'
    // rather than 'date-time' - no specific time to preserve for those.
    const isAllDay = component.datetype === 'date';
    events.push({
      uid,
      title: unwrapParam(component.summary) ?? 'Ohne Titel',
      location: unwrapParam(component.location) ?? '',
      description: unwrapParam(component.description) ?? null,
      date: toDateOnly(start, isAllDay),
      time: toTimeOnly(start, isAllDay),
    });
  }
  return events;
}

export interface IcsSyncResult {
  created: number;
  updated: number;
  removed: number;
}

/**
 * Fetches and syncs one ICS source: upserts every VEVENT by (source, uid),
 * then soft-deletes any previously-imported event whose uid no longer
 * appears in the feed. `fetchIcs` is injected (rather than calling `fetch`
 * directly) so tests can supply fixed ICS text without a network call.
 */
export async function syncExternalEventIcsSource(
  source: { id: number; created_by_id: number },
  fetchIcs: (sourceId: number) => Promise<string>,
): Promise<IcsSyncResult> {
  const icsText = await fetchIcs(source.id);
  const parsedEvents = parseIcsEvents(icsText);

  let created = 0;
  let updated = 0;
  const seenUids: string[] = [];

  // Sequential: each upsert's existence check depends on prior writes in the
  // same source not racing each other; feed sizes here are small (single
  // lodge calendars), so a loop is simpler than Promise.all and safer.
  for (const parsedEvent of parsedEvents) {
    seenUids.push(parsedEvent.uid);
    // eslint-disable-next-line no-await-in-loop
    const existing = await prisma.external_events.findFirst({ where: { ics_source_id: source.id, ics_uid: parsedEvent.uid } });
    if (existing) {
      // eslint-disable-next-line no-await-in-loop
      await prisma.external_events.update({
        where: { id: existing.id },
        data: {
          title: parsedEvent.title,
          location: parsedEvent.location,
          description: parsedEvent.description,
          date: parsedEvent.date,
          time: parsedEvent.time,
          deleted: false,
          updated_at: new Date(),
        },
      });
      updated += 1;
    } else {
      const now = new Date();
      // eslint-disable-next-line no-await-in-loop
      const uuid = await generateUniqueUuid((candidate) => prisma.external_events.findFirst({ where: { uuid: candidate } }).then(Boolean));
      // eslint-disable-next-line no-await-in-loop
      await prisma.external_events.create({
        data: {
          uuid,
          title: parsedEvent.title,
          host: null,
          location: parsedEvent.location,
          description: parsedEvent.description,
          date: parsedEvent.date,
          time: parsedEvent.time,
          created_by_id: source.created_by_id,
          deleted: false,
          created_at: now,
          updated_at: now,
          ics_source_id: source.id,
          ics_uid: parsedEvent.uid,
        },
      });
      created += 1;
    }
  }

  const stale = await prisma.external_events.findMany({
    where: { ics_source_id: source.id, deleted: false, ics_uid: seenUids.length > 0 ? { notIn: seenUids } : undefined },
  });
  if (stale.length > 0) {
    await prisma.external_events.updateMany({ where: { id: { in: stale.map((e) => e.id) } }, data: { deleted: true } });
  }

  return { created, updated, removed: stale.length };
}

export interface IcsSourceSyncOutcome {
  source: { id: number; name: string };
  result?: IcsSyncResult;
  error?: unknown;
}

/**
 * Syncs every active (non-deleted) ICS source, isolating one source's
 * failure from the rest - shared by both the nightly cron script
 * (eventsNightly.ts) and the in-process auto-sync scheduler
 * (icsSyncScheduler.ts), so the error-isolation behaviour is defined and
 * tested once. Deliberately doesn't log anything itself - logging is the
 * caller's job, so this stays a pure, easily-testable function.
 */
export async function syncAllActiveIcsSources(
  fetchIcs: (source: { id: number; created_by_id: number; url: string }) => Promise<string>,
): Promise<IcsSourceSyncOutcome[]> {
  const sources = await prisma.external_event_ics_sources.findMany({ where: { deleted: false } });
  const outcomes: IcsSourceSyncOutcome[] = [];

  // Sequential for the same reason as syncExternalEventIcsSource's own loop:
  // simpler and safer than Promise.all for this small-feed-count workload.
  for (const source of sources) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const result = await syncExternalEventIcsSource(source, () => fetchIcs(source));
      outcomes.push({ source: { id: source.id, name: source.name }, result });
    } catch (error) {
      outcomes.push({ source: { id: source.id, name: source.name }, error });
    }
  }

  return outcomes;
}
