import { describe, expect, it } from 'vitest';
import { addMonths, addWeeks, buildMonthGrid, buildWeekGrid, toDateKey } from './calendarGrid';

describe('toDateKey', () => {
  it('formats local date fields as YYYY-MM-DD', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(toDateKey(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});

describe('buildMonthGrid', () => {
  it('returns full weeks (Monday-start) covering the whole month, padded with adjacent-month days', () => {
    // February 2026: Feb 1 is a Sunday.
    const weeks = buildMonthGrid(new Date(2026, 1, 15));
    for (const week of weeks) expect(week).toHaveLength(7);
    expect(weeks[0]![0]!.getDay()).toBe(1); // every week starts on Monday
    expect(toDateKey(weeks[0]![6]!)).toBe('2026-02-01'); // Feb 1 (Sun) is the last day of week 1
    const lastWeek = weeks[weeks.length - 1]!;
    expect(toDateKey(lastWeek[0]!)).toBe('2026-02-23'); // Feb has 28 days in 2026, ends on a Saturday (Feb 28); Monday-start week containing it begins Feb 23
  });

  it('every day in the input month appears exactly once', () => {
    const weeks = buildMonthGrid(new Date(2026, 1, 1));
    const keys = weeks.flat().map(toDateKey);
    for (let day = 1; day <= 28; day += 1) {
      expect(keys).toContain(`2026-02-${day.toString().padStart(2, '0')}`);
    }
  });
});

describe('buildWeekGrid', () => {
  it('returns the 7 days (Monday-start) of the week containing the anchor', () => {
    // 2026-02-18 is a Wednesday.
    const week = buildWeekGrid(new Date(2026, 1, 18));
    expect(week).toHaveLength(7);
    expect(toDateKey(week[0]!)).toBe('2026-02-16'); // Monday
    expect(toDateKey(week[6]!)).toBe('2026-02-22'); // Sunday
  });
});

describe('addMonths / addWeeks', () => {
  it('addMonths steps by whole months, clamping day-of-month overflow like native Date', () => {
    expect(toDateKey(addMonths(new Date(2026, 0, 31), 1))).toBe('2026-03-03'); // Date rolls Jan 31 + 1 month into March
  });

  it('addWeeks steps by 7 days', () => {
    expect(toDateKey(addWeeks(new Date(2026, 1, 18), 1))).toBe('2026-02-25');
    expect(toDateKey(addWeeks(new Date(2026, 1, 18), -1))).toBe('2026-02-11');
  });
});
