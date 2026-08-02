import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { syncAllActiveIcsSources, syncExternalEventIcsSource } from '../../src/lib/externalEventIcsSync.js';

const SAMPLE_ICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:event-1@example.test
SUMMARY:Sommerfest
LOCATION:Musterstadt
DTSTART:20260901T180000Z
DESCRIPTION:Ein Fest
END:VEVENT
BEGIN:VEVENT
UID:event-2@example.test
SUMMARY:Herbstfest
LOCATION:Anderestadt
DTSTART:20261001T170000Z
END:VEVENT
END:VCALENDAR`;

const UPDATED_ICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:event-1@example.test
SUMMARY:Sommerfest (verschoben)
LOCATION:Musterstadt
DTSTART:20260902T180000Z
END:VEVENT
END:VCALENDAR`;

async function makeSourceUser(): Promise<number> {
  const now = new Date();
  const user = await prisma.users.create({ data: { email: `ics-${Date.now()}@example.test`, created_at: now, updated_at: now } });
  return user.id;
}

beforeEach(async () => {
  await resetDb();
});

describe('syncExternalEventIcsSource', () => {
  it('creates one external_events row per VEVENT', async () => {
    const createdById = await makeSourceUser();
    const source = await prisma.external_event_ics_sources.create({
      data: { uuid: crypto.randomUUID(), name: 'Nachbarloge', url: 'https://example.test/cal.ics', created_by_id: createdById, deleted: false, created_at: new Date(), updated_at: new Date() },
    });

    const result = await syncExternalEventIcsSource(source, async () => SAMPLE_ICS);
    expect(result).toEqual({ created: 2, updated: 0, removed: 0 });

    const rows = await prisma.external_events.findMany({ where: { ics_source_id: source.id }, orderBy: { ics_uid: 'asc' } });
    expect(rows).toHaveLength(2);
    expect(rows[0].title).toBe('Sommerfest');
    expect(rows[0].created_by_id).toBe(createdById);
    expect(rows[0].deleted).toBe(false);
  });

  it('is idempotent on a second run with the same feed', async () => {
    const createdById = await makeSourceUser();
    const source = await prisma.external_event_ics_sources.create({
      data: { uuid: crypto.randomUUID(), name: 'Nachbarloge', url: 'https://example.test/cal.ics', created_by_id: createdById, deleted: false, created_at: new Date(), updated_at: new Date() },
    });
    await syncExternalEventIcsSource(source, async () => SAMPLE_ICS);
    const result = await syncExternalEventIcsSource(source, async () => SAMPLE_ICS);
    expect(result).toEqual({ created: 0, updated: 2, removed: 0 });
    const rows = await prisma.external_events.findMany({ where: { ics_source_id: source.id } });
    expect(rows).toHaveLength(2);
  });

  it('updates fields when the feed changes and soft-deletes events that disappear', async () => {
    const createdById = await makeSourceUser();
    const source = await prisma.external_event_ics_sources.create({
      data: { uuid: crypto.randomUUID(), name: 'Nachbarloge', url: 'https://example.test/cal.ics', created_by_id: createdById, deleted: false, created_at: new Date(), updated_at: new Date() },
    });
    await syncExternalEventIcsSource(source, async () => SAMPLE_ICS);
    const result = await syncExternalEventIcsSource(source, async () => UPDATED_ICS);
    expect(result).toEqual({ created: 0, updated: 1, removed: 1 });

    const remaining = await prisma.external_events.findMany({ where: { ics_source_id: source.id, deleted: false } });
    expect(remaining).toHaveLength(1);
    expect(remaining[0].title).toBe('Sommerfest (verschoben)');

    const deleted = await prisma.external_events.findFirst({ where: { ics_source_id: source.id, ics_uid: 'event-2@example.test' } });
    expect(deleted?.deleted).toBe(true);
  });

  describe('all-day event date handling (timezone-sensitive)', () => {
    // This regression only reproduces the original bug (toDateOnly reading
    // an all-day Date with unconditional UTC getters) under a host timezone
    // with a *positive* UTC offset. node-ical parses a DATE-only DTSTART
    // into a Date representing *local* midnight of that calendar day. Under
    // TZ=UTC (this repo's CI default - no TZ is pinned anywhere else) local
    // midnight and UTC midnight are numerically identical, so the buggy and
    // fixed code produce the same result and the test would pass either
    // way. A negative-offset zone (e.g. America/New_York, UTC-4/5) also
    // fails to expose it: local midnight there maps to the *same* UTC
    // calendar day, not the previous one. Only a positive-offset zone makes
    // local midnight fall on the previous UTC day, which is the exact
    // condition that shifts the date backward under the bug. Asia/Tokyo
    // (UTC+9, no DST) is used for a stable, non-DST-affected offset.
    // TZ is scoped to just this describe block via beforeEach/afterEach so
    // the other tests above (which don't inspect date/time fields) keep
    // running under the ambient/CI timezone.
    const ORIGINAL_TZ = process.env.TZ;

    beforeEach(() => {
      process.env.TZ = 'Asia/Tokyo';
    });

    afterEach(() => {
      if (ORIGINAL_TZ === undefined) delete process.env.TZ;
      else process.env.TZ = ORIGINAL_TZ;
    });

    it('maps an all-day VEVENT (DATE-only DTSTART) to the correct calendar date and midnight time', async () => {
      // DTSTART;VALUE=DATE (no time/zone) is how all-day events appear in the
      // wild (e.g. a lodge's "ganztägig" feast day) - node-ical parses this
      // into a Date representing *local* midnight, which is easy to
      // mis-read as a UTC instant and shift by a day (see toDateOnly's
      // comment in the implementation). SUMMARY;LANGUAGE=de:... also exercises
      // node-ical's parameterized-value object form ({ val, params }), rather
      // than the plain-string form the other fixtures use.
      const ALL_DAY_ICS = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:allday-1@example.test
SUMMARY;LANGUAGE=de:Ganztägig
LOCATION:Musterstadt
DTSTART;VALUE=DATE:20260701
END:VEVENT
END:VCALENDAR`;

      const createdById = await makeSourceUser();
      const source = await prisma.external_event_ics_sources.create({
        data: { uuid: crypto.randomUUID(), name: 'Nachbarloge', url: 'https://example.test/cal.ics', created_by_id: createdById, deleted: false, created_at: new Date(), updated_at: new Date() },
      });

      const result = await syncExternalEventIcsSource(source, async () => ALL_DAY_ICS);
      expect(result).toEqual({ created: 1, updated: 0, removed: 0 });

      const row = await prisma.external_events.findFirst({ where: { ics_source_id: source.id, ics_uid: 'allday-1@example.test' } });
      expect(row?.title).toBe('Ganztägig');
      expect(row?.date.toISOString().slice(0, 10)).toBe('2026-07-01');
      expect(row?.time.toISOString().slice(11, 19)).toBe('00:00:00');
    });
  });
});

describe('syncAllActiveIcsSources', () => {
  async function makeIcsSource(name: string, createdById: number) {
    const now = new Date();
    return prisma.external_event_ics_sources.create({
      data: {
        uuid: crypto.randomUUID(),
        name,
        url: `https://example.test/${encodeURIComponent(name)}.ics`,
        created_by_id: createdById,
        deleted: false,
        created_at: now,
        updated_at: now,
      },
    });
  }

  it('syncs every active source and skips soft-deleted ones', async () => {
    const createdById = await makeSourceUser();
    const sourceA = await makeIcsSource('Loge A', createdById);
    const sourceB = await makeIcsSource('Loge B', createdById);
    const deletedSource = await makeIcsSource('Gelöschte Loge', createdById);
    await prisma.external_event_ics_sources.update({ where: { id: deletedSource.id }, data: { deleted: true } });

    const fetchedIds: number[] = [];
    const outcomes = await syncAllActiveIcsSources(async (source) => {
      fetchedIds.push(source.id);
      return SAMPLE_ICS;
    });

    expect(fetchedIds.sort()).toEqual([sourceA.id, sourceB.id].sort());
    expect(outcomes).toHaveLength(2);
    expect(outcomes.every((o) => o.result && !o.error)).toBe(true);
  });

  it('isolates one source\'s fetch failure: its outcome carries the error, the others still sync', async () => {
    const createdById = await makeSourceUser();
    const sourceA = await makeIcsSource('Loge A', createdById);
    const sourceB = await makeIcsSource('Loge B (broken feed)', createdById);

    const outcomes = await syncAllActiveIcsSources(async (source) => {
      if (source.id === sourceB.id) throw new Error('feed unreachable');
      return SAMPLE_ICS;
    });

    const outcomeA = outcomes.find((o) => o.source.id === sourceA.id);
    const outcomeB = outcomes.find((o) => o.source.id === sourceB.id);
    expect(outcomeA?.result).toEqual({ created: 2, updated: 0, removed: 0 });
    expect(outcomeA?.error).toBeUndefined();
    expect(outcomeB?.result).toBeUndefined();
    expect(outcomeB?.error).toBeInstanceOf(Error);
  });
});
