import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { apiFetch } from '../../api/client';
import { useToast } from '../../notifications/useToast';
import type { BirthdayList, BirthdayListRow, Event, EventInput, EventList, EventWithParticipants, ExternalEvent, ExternalEventList } from '../../api/types';

export function useEvents(page: number, pageSize: number, sort: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ['events', page, pageSize, sort, from, to],
    queryFn: () =>
      apiFetch<EventList>(
        `/api/v1/events?page=${page}&per_page=${pageSize}&sort=${encodeURIComponent(sort)}${from ? `&from=${from}` : ''}${to ? `&to=${to}` : ''}`,
      ),
  });
}

export function useEvent(uuid: string) {
  return useQuery({
    queryKey: ['events', uuid],
    queryFn: () => apiFetch<EventWithParticipants>(`/api/v1/events/${uuid}`),
  });
}

export interface EventDefaults {
  location: string | null;
  duration_minutes: number;
}

export function useEventDefaults() {
  return useQuery({
    queryKey: ['events', 'defaults'],
    queryFn: () => apiFetch<EventDefaults>('/api/v1/events/defaults'),
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: EventInput) => apiFetch<Event>('/api/v1/events', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success(t('common.toast.created'));
    },
  });
}

export function useUpdateEvent(uuid: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: EventInput) => apiFetch<Event>(`/api/v1/events/${uuid}`, { method: 'PATCH', body: JSON.stringify(input) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success(t('common.toast.updated'));
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (uuid: string) => apiFetch<void>(`/api/v1/events/${uuid}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast.success(t('common.toast.deleted'));
    },
  });
}

export function useRegisterEventParticipant(uuid: string, eventTitle: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (input: { user_uuid?: string; festive_board?: boolean }) =>
      apiFetch<{ user_uuid: string; fullname: string; festive_board: boolean }>(`/api/v1/events/${uuid}/participants`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', uuid] });
      toast.success(t('events.registeredToast', { name: eventTitle }));
    },
  });
}

export function useRemoveEventParticipant(uuid: string) {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { t } = useTranslation();
  return useMutation({
    mutationFn: (userUuid: string) => apiFetch<void>(`/api/v1/events/${uuid}/participants/${userUuid}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', uuid] });
      toast.success(t('common.toast.deleted'));
    },
  });
}

/** The exact query key shape useEventsInRange uses - extracted so prefetchQuery (EventsCalendarView's month-ahead prefetch) can target the same cache entries. */
export function eventsRangeQueryKey(from: string, to: string) {
  return ['events', 'range', from, to] as const;
}

/** The exact fetch logic useEventsInRange runs, extracted so prefetchQuery can reuse it without a hook. */
export async function fetchEventsInRange(from: string, to: string): Promise<Event[]> {
  const rows: Event[] = [];
  let page = 0;
  const perPage = 100;
  for (;;) {
    const data = await apiFetch<EventList>(`/api/v1/events?from=${from}&to=${to}&page=${page}&per_page=${perPage}`);
    rows.push(...data.rows);
    if (rows.length >= data.row_count || data.rows.length === 0) break;
    page += 1;
  }
  return rows;
}

/** All events in [from, to], all pages merged - the calendar view's visible range is always small (a month or a week), so a full-page fetch loop is simpler than teaching DataTable-style pagination to a calendar grid. */
export function useEventsInRange(from: string, to: string) {
  return useQuery({
    queryKey: eventsRangeQueryKey(from, to),
    queryFn: () => fetchEventsInRange(from, to),
  });
}

/** External events in [from, to], all pages merged - same rationale as useEventsInRange. Local fetcher against the API directly (not importing externalEvents/api.ts) - see this plan's Global Constraints on the no-cross-feature-import convention. */
export function useCalendarExternalEvents(from: string, to: string) {
  return useQuery({
    queryKey: ['external-events', 'range', from, to],
    queryFn: async () => {
      const rows: ExternalEvent[] = [];
      let page = 0;
      const perPage = 100;
      for (;;) {
        const data = await apiFetch<ExternalEventList>(`/api/v1/external_events?from=${from}&to=${to}&page=${page}&per_page=${perPage}`);
        rows.push(...data.rows);
        if (rows.length >= data.row_count || data.rows.length === 0) break;
        page += 1;
      }
      return rows;
    },
  });
}

const ICS_SOURCES_FETCH_CAP = 1000;

/** Slim {uuid, name} shape from the members-readable GET .../options endpoint - deliberately not the admin ExternalEventIcsSource type (which also carries `url`, gated on `manage ExternalEvent`), since this is what every calendar viewer (not just admins) is allowed to see. */
export interface ExternalEventIcsSourceOption {
  uuid: string;
  name: string;
}

export interface CalendarIcsSourcesResult {
  sources: ExternalEventIcsSourceOption[];
  truncated: boolean;
}

/**
 * All ICS sources, for the calendar's per-source filter labels, up to
 * ICS_SOURCES_FETCH_CAP. Calls GET /api/v1/external_event_ics_sources/options
 * (members-readable, gated on `index ExternalEvent`) rather than the
 * admin-only GET /api/v1/external_event_ics_sources (gated on `manage
 * ExternalEvent`) - the latter 403s for every plain member, which silently
 * left this filter's checkboxes empty for non-admin users. /options returns
 * every undeleted source in one unpaginated response (no page/per_page), so
 * this no longer needs the page-looping the admin-list version used -
 * `truncated` is still computed client-side against ICS_SOURCES_FETCH_CAP so
 * CalendarFilter's truncation helper text keeps working unchanged.
 */
export function useCalendarIcsSources() {
  return useQuery({
    queryKey: ['external-event-ics-sources', 'options'],
    queryFn: async (): Promise<CalendarIcsSourcesResult> => {
      const data = await apiFetch<{ rows: ExternalEventIcsSourceOption[] }>('/api/v1/external_event_ics_sources/options');
      const truncated = data.rows.length > ICS_SOURCES_FETCH_CAP;
      return { sources: data.rows.slice(0, ICS_SOURCES_FETCH_CAP), truncated };
    },
  });
}

/** All birthday-list rows, all pages merged - the endpoint has no from/to param (see filterBirthdaysInRange below, which the calendar view applies client-side to this data). Local fetcher, mirrors members/api.ts's own private fetchAllBirthdayListRows per this plan's Global Constraints. */
export function useCalendarBirthdays() {
  return useQuery({
    queryKey: ['members', 'birthday-list', 'all'],
    queryFn: async () => {
      const rows: BirthdayListRow[] = [];
      let page = 0;
      const perPage = 100;
      for (;;) {
        const data = await apiFetch<BirthdayList>(`/api/v1/members/birthday_list?page=${page}&per_page=${perPage}`);
        rows.push(...data.rows);
        if (rows.length >= data.row_count || data.rows.length === 0) break;
        page += 1;
      }
      return rows;
    },
  });
}

// Mirrors rails-app/app/models/user.rb's `upcoming_birthdays` scope
// (lines ~273-291): a pure month/day comparison against `from`/`to`,
// ignoring year (birthdays recur annually), with the same wraparound
// handling for a window that crosses a year boundary (e.g. `from` in
// December, `to` in the following January/February). The Ruby scope's
// empty-`to` branch (bare equality match) is not ported - this call site
// always has both `from` and `to` populated (the same 120-day window
// computed for the events fetch), so that branch would be dead code here.
function monthDay(dateStr: string): string {
  return dateStr.slice(5, 7) + dateStr.slice(8, 10);
}

export function filterBirthdaysInRange(rows: BirthdayListRow[], from: string, to: string): BirthdayListRow[] {
  const fromMMDD = monthDay(from);
  const toMMDD = monthDay(to);
  const wraps = toMMDD < fromMMDD;
  return rows.filter((r) => {
    if (!r.date_of_birth) return false;
    const mmdd = monthDay(r.date_of_birth);
    return wraps ? (mmdd <= toMMDD || mmdd >= fromMMDD) : (mmdd >= fromMMDD && mmdd <= toMMDD);
  });
}

// YYYY-MM-DD from a Date's LOCAL fields, not toISOString() (which is UTC).
// Germany is ahead of UTC, so toISOString().slice(0, 10) during early local
// morning hours would compute "today" as the previous UTC day - a one-day
// skew in the from/to window at exactly the boundary this function is used
// for. Exported so EventsListPage.tsx can compute "today" (for its default
// upcoming-events `from` filter, and the internal working-plan PDF's
// dated filename) with the same local-midnight semantics, rather than
// duplicating this logic.
export function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}
