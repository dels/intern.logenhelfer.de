/**
 * Adds `deltaMinutes` to an "HH:MM" time string, wrapping at midnight.
 * ponytail: day-of-week/date rollover isn't tracked here - a shift that
 * crosses midnight only changes the clock time, never the date. Add
 * date-aware rollover if a future feature needs it.
 */
export function shiftTime(time: string, deltaMinutes: number): string {
  const [hours, minutes] = time.split(':').map(Number) as [number, number];
  const totalMinutes = (((hours * 60 + minutes + deltaMinutes) % 1440) + 1440) % 1440;
  const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const mm = String(totalMinutes % 60).padStart(2, '0');
  return `${hh}:${mm}`;
}

/** Minutes from `from` to `to`, both "HH:MM" - positive if `to` is later in the day. */
export function minutesBetween(from: string, to: string): number {
  const [fromHours, fromMinutes] = from.split(':').map(Number) as [number, number];
  const [toHours, toMinutes] = to.split(':').map(Number) as [number, number];
  return (toHours * 60 + toMinutes) - (fromHours * 60 + fromMinutes);
}
