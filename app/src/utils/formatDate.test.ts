import { describe, expect, it } from 'vitest';
import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('formats a date-only string in the given locale with the default medium dateStyle', () => {
    const expected = new Date('2026-07-17T00:00:00').toLocaleString('de-DE', { dateStyle: 'medium' });
    expect(formatDate('2026-07-17', 'de-DE')).toBe(expected);
  });

  it('parses a date-only string as LOCAL midnight, not UTC, so the calendar day never shifts', () => {
    // Computed the same local-midnight way formatDate does internally, so
    // this assertion holds in any CI timezone rather than assuming a
    // specific UTC offset.
    const expected = new Date('2026-01-01T00:00:00').toLocaleString('de-DE', { dateStyle: 'medium' });
    expect(formatDate('2026-01-01', 'de-DE')).toBe(expected);
  });

  it('formats a full ISO datetime string with an explicit dateStyle+timeStyle option', () => {
    const expected = new Date('2026-07-17T10:23:45.000Z').toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' });
    expect(formatDate('2026-07-17T10:23:45.000Z', 'de-DE', { dateStyle: 'medium', timeStyle: 'short' })).toBe(expected);
  });

  it('formats a Date object directly, for callers that already hold a Date (e.g. a calendar view anchor)', () => {
    const anchor = new Date(2026, 6, 1); // July 2026 (month is 0-indexed), local time
    const expected = anchor.toLocaleString('de-DE', { month: 'long', year: 'numeric' });
    expect(formatDate(anchor, 'de-DE', { month: 'long', year: 'numeric' })).toBe(expected);
  });

  it('returns an empty string for null', () => {
    expect(formatDate(null, 'de-DE')).toBe('');
  });

  it('returns an empty string for undefined', () => {
    expect(formatDate(undefined, 'de-DE')).toBe('');
  });

  it('returns an empty string for an unparseable date string, never "Invalid Date"', () => {
    expect(formatDate('not-a-date', 'de-DE')).toBe('');
  });

  it('honors a different locale for the same input, proving locale is not hardcoded', () => {
    const expectedEn = new Date('2026-07-17T00:00:00').toLocaleString('en', { dateStyle: 'medium' });
    const expectedDe = new Date('2026-07-17T00:00:00').toLocaleString('de-DE', { dateStyle: 'medium' });
    expect(formatDate('2026-07-17', 'en')).toBe(expectedEn);
    // Sanity check: the two locales must actually render differently for
    // this input, or the assertion above wouldn't be testing anything.
    expect(expectedEn).not.toBe(expectedDe);
  });
});
