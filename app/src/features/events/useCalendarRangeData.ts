import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  eventsRangeQueryKey,
  fetchEventsInRange,
  filterBirthdaysInRange,
  useCalendarBirthdays,
  useCalendarExternalEvents,
  useCalendarIcsSources,
  useEventsInRange,
  type ExternalEventIcsSourceOption,
} from './api';
import { addMonths, buildMonthGrid, toDateKey } from './calendarGrid';
import type { BirthdayListRow, Event, ExternalEvent } from '../../api/types';

export interface CalendarRangeData {
  from: string;
  to: string;
  events: Event[];
  /** Already filtered: manually-created rows respect the blanket "external-events" toggle; ICS-synced rows respect their own per-source toggle instead - same rule EventsCalendarView applied inline before this hook existed. */
  externalEvents: ExternalEvent[];
  /** Already filtered to the visible range and to whether "birthdays" is selected. */
  visibleBirthdays: BirthdayListRow[];
  icsSources: ExternalEventIcsSourceOption[];
  icsSourcesTruncated: boolean;
  isRangeLoading: boolean;
  externalEventsFetching: boolean;
  icsSourcesFetching: boolean;
}

/**
 * Fetches and filters everything both the calendar grid and the list view
 * need for the month containing `anchor`, applying `selectedFilters`
 * identically for both - this is the single source of truth for "what's
 * visible" so the two views can never disagree with each other. The range
 * is the full Monday-start month grid (buildMonthGrid), including a few
 * adjacent-month padding days - both views share this exact range, so
 * toggling between them never changes the visible item set, except on
 * mobile, where EventsCalendarView's agenda skips adjacent-month padding
 * days that EventsListTable still renders.
 */
export function useCalendarRangeData(anchor: Date, selectedFilters: Set<string>): CalendarRangeData {
  const grid = useMemo(() => buildMonthGrid(anchor), [anchor]);
  const rangeStart = grid[0]![0]!;
  const rangeEnd = grid[grid.length - 1]![6]!;
  const from = toDateKey(rangeStart);
  const to = toDateKey(rangeEnd);

  const { data: events, isLoading: eventsLoading } = useEventsInRange(from, to);
  const { data: externalEventsRaw, isFetching: externalEventsFetching } = useCalendarExternalEvents(from, to);
  const { data: icsSourcesResult, isFetching: icsSourcesFetching } = useCalendarIcsSources();
  const { data: birthdays, isLoading: birthdaysLoading } = useCalendarBirthdays();
  const isRangeLoading = eventsLoading || birthdaysLoading;

  // Prefetch the next 3 months' events once the current month has loaded, and
  // again on every navigation - keeps forward navigation feeling instant
  // without blocking the initial/current render on extra requests. Anchor is
  // shared between both views now, so this benefits whichever is showing.
  const queryClient = useQueryClient();
  useEffect(() => {
    if (isRangeLoading) return;
    for (let i = 1; i <= 3; i++) {
      const futureGrid = buildMonthGrid(addMonths(anchor, i));
      const futureFrom = toDateKey(futureGrid[0]![0]!);
      const futureTo = toDateKey(futureGrid[futureGrid.length - 1]![6]!);
      queryClient.prefetchQuery({
        queryKey: eventsRangeQueryKey(futureFrom, futureTo),
        queryFn: () => fetchEventsInRange(futureFrom, futureTo),
      });
    }
  }, [anchor, isRangeLoading, queryClient]);

  const showBirthdays = selectedFilters.has('birthdays');
  const showExternalEvents = selectedFilters.has('external-events');
  const icsSources = useMemo(() => icsSourcesResult?.sources ?? [], [icsSourcesResult]);
  const selectedSourceUuids = useMemo(
    () => new Set(icsSources.map((s) => s.uuid).filter((uuid) => selectedFilters.has(uuid))),
    [icsSources, selectedFilters],
  );

  const externalEvents = useMemo(
    () => (externalEventsRaw ?? []).filter((e) => (e.ics_source_uuid ? selectedSourceUuids.has(e.ics_source_uuid) : showExternalEvents)),
    [externalEventsRaw, showExternalEvents, selectedSourceUuids],
  );

  const visibleBirthdays = useMemo(
    () => (showBirthdays ? filterBirthdaysInRange(birthdays ?? [], from, to) : []),
    [showBirthdays, birthdays, from, to],
  );

  return {
    from,
    to,
    events: events ?? [],
    externalEvents,
    visibleBirthdays,
    icsSources,
    icsSourcesTruncated: icsSourcesResult?.truncated ?? false,
    isRangeLoading,
    externalEventsFetching,
    icsSourcesFetching,
  };
}
