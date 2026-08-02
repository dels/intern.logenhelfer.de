const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Formats a date-only string (`YYYY-MM-DD`), a full ISO datetime string, or
 * an already-constructed `Date` into a locale-aware, human-readable string.
 *
 * `locale` is required (not defaulted) so every call site states its intent
 * explicitly: UI components pass `i18n.language` (reactive to the app's
 * active language via react-i18next), while the PDF-export functions in
 * `features/members/api.ts` and `features/events/api.ts` pass the literal
 * `'de-DE'` to match those documents' already-established, deliberately
 * German content (see this plan's Global Constraints).
 *
 * A bare `YYYY-MM-DD` string is parsed as LOCAL midnight (by appending
 * `T00:00:00`), not UTC midnight - otherwise a timezone behind UTC would
 * roll the displayed date back by one day. This matches the local-midnight
 * parsing already used by `public-calendar/api.ts`'s `monthLabel` and
 * `events/api.ts`'s `localDate`.
 *
 * Returns `''` for `null`/`undefined`/an unparseable string, never
 * `"Invalid Date"` or a thrown error. Callers that want a placeholder for a
 * missing value (e.g. an em-dash) do `formatDate(x, locale) || '—'` at the
 * call site.
 */
export function formatDate(
  value: string | Date | null | undefined,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' },
): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(DATE_ONLY_RE.test(value) ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(locale, options);
}
