// Pure date-math for the month/week calendar grid - no calendar library
// dependency (see this plan's Global Constraints). Every week starts on
// Monday (ISO-ish, matching de-DE convention this app already targets
// elsewhere, e.g. events/api.ts's toLocaleDateString('de-DE', ...) calls).

/** YYYY-MM-DD from a Date's LOCAL fields (not toISOString, which is UTC) - same rationale as events/api.ts's toLocalDateString. */
export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Start of the Monday-based week containing `date` (local midnight). */
function startOfWeek(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay(); // 0=Sunday..6=Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diffToMonday);
  return result;
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, date.getDate());
}

export function addWeeks(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + delta * 7);
}

/** The 7 Monday-start days of the week containing `anchor`. */
export function buildWeekGrid(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

/** Full Monday-start weeks covering the whole month containing `anchor`, padded with adjacent-month days so every week has exactly 7 entries. */
export function buildMonthGrid(anchor: Date): Date[][] {
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = startOfWeek(monthEnd);
  gridEnd.setDate(gridEnd.getDate() + 6);

  const weeks: Date[][] = [];
  let cursor = gridStart;
  while (cursor <= gridEnd) {
    const week = Array.from({ length: 7 }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + i));
    weeks.push(week);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7);
  }
  return weeks;
}
