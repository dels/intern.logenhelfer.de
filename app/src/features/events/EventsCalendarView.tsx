import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { Box, Button, Chip, CircularProgress, IconButton, Paper, Skeleton, Stack, ToggleButton, ToggleButtonGroup, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CakeIcon from '@mui/icons-material/Cake';
import { useTranslation } from 'react-i18next';
import { addMonths, addWeeks, buildMonthGrid, buildWeekGrid, toDateKey } from './calendarGrid';
import { useCalendarBirthdays, useCalendarExternalEvents, useCalendarIcsSources, useEventsInRange, filterBirthdaysInRange, fetchEventsInRange, eventsRangeQueryKey } from './api';
import CalendarFilter from './CalendarFilter';
import BirthdayContactDialog from '../members/BirthdayContactDialog';
import { formatDate } from '../../utils/formatDate';

type ViewMode = 'month' | 'week';

/** Only exposed for tests, which need a deterministic "today" instead of the real current date - production callers never pass it. */
export interface EventsCalendarViewProps {
  anchorDateForTest?: Date;
}

export default function EventsCalendarView({ anchorDateForTest }: EventsCalendarViewProps = {}) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<ViewMode>('month');
  const [anchor, setAnchor] = useState<Date>(anchorDateForTest ?? new Date());
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set(['birthdays']));
  const [contactUuid, setContactUuid] = useState<string | null>(null);

  const grid = useMemo(() => (mode === 'month' ? buildMonthGrid(anchor) : [buildWeekGrid(anchor)]), [mode, anchor]);
  const rangeStart = grid[0]![0]!;
  const rangeEnd = grid[grid.length - 1]![6]!;
  const from = toDateKey(rangeStart);
  const to = toDateKey(rangeEnd);

  const { data: events, isLoading: eventsLoading } = useEventsInRange(from, to);
  const { data: externalEvents, isFetching: externalEventsFetching } = useCalendarExternalEvents(from, to);
  const { data: icsSourcesResult, isFetching: icsSourcesFetching } = useCalendarIcsSources();
  const icsSources = icsSourcesResult?.sources ?? [];
  const { data: birthdays, isLoading: birthdaysLoading } = useCalendarBirthdays();
  const isRangeLoading = eventsLoading || birthdaysLoading;

  // Prefetch the next 3 months' events once the current month has loaded, and
  // again on every navigation - keeps forward navigation feeling instant
  // without blocking the initial/current render on extra requests.
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
  const selectedSourceUuids = useMemo(
    () => new Set((icsSourcesResult?.sources ?? []).map((s) => s.uuid).filter((uuid) => selectedFilters.has(uuid))),
    [icsSourcesResult, selectedFilters],
  );

  const visibleBirthdays = useMemo(
    () => (showBirthdays ? filterBirthdaysInRange(birthdays ?? [], from, to) : []),
    [showBirthdays, birthdays, from, to],
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof events>();
    for (const e of events ?? []) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    return map;
  }, [events]);

  const externalEventsByDate = useMemo(() => {
    const map = new Map<string, typeof externalEvents>();
    for (const e of externalEvents ?? []) {
      // Events synced from a known ICS source are gated by that specific
      // source's own filter entry, independent of the blanket
      // "external-events" toggle - selecting just the source (as the
      // CalendarFilter's per-source checkboxes let you do) is enough.
      // Only manually-created external events (no ics_source_uuid) fall
      // back to the blanket toggle.
      if (e.ics_source_uuid) {
        if (!selectedSourceUuids.has(e.ics_source_uuid)) continue;
      } else if (!showExternalEvents) {
        continue;
      }
      map.set(e.date, [...(map.get(e.date) ?? []), e]);
    }
    return map;
  }, [externalEvents, showExternalEvents, selectedSourceUuids]);

  const birthdaysByDate = useMemo(() => {
    const map = new Map<string, typeof visibleBirthdays>();
    for (const b of visibleBirthdays) {
      if (!b.date_of_birth) continue;
      // Birthdays recur annually - key them by THIS grid's year + the birthday's month/day, not the stored birth year.
      const [, mm, dd] = b.date_of_birth.split('-');
      const yearsInGrid = new Set(grid.flat().map((d) => d.getFullYear()));
      for (const year of yearsInGrid) {
        const key = `${year}-${mm}-${dd}`;
        map.set(key, [...(map.get(key) ?? []), b]);
      }
    }
    return map;
  }, [visibleBirthdays, grid]);

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  interface CalendarListItem {
    key: string;
    date: Date;
    kind: 'event' | 'external-event' | 'birthday';
    label: string;
    location?: string | null;
    time?: string | null;
    onClick: () => void;
  }

  const mobileItems = useMemo(() => {
    if (isDesktop) return [];
    const items: CalendarListItem[] = [];
    for (const date of grid.flat()) {
      if (mode === 'month' && date.getMonth() !== anchor.getMonth()) continue;
      const key = toDateKey(date);
      for (const e of eventsByDate.get(key) ?? []) {
        items.push({
          key: `event-${e.uuid}`, date, kind: 'event', label: e.title,
          location: e.location, time: e.whole_day ? null : e.time,
          onClick: () => navigate(`/events/${e.uuid}`),
        });
      }
      for (const e of externalEventsByDate.get(key) ?? []) {
        items.push({
          key: `external-${e.uuid}`, date, kind: 'external-event', label: e.title,
          location: e.location, time: e.time,
          onClick: () => navigate(`/external-events/${e.uuid}`),
        });
      }
      for (const b of birthdaysByDate.get(key) ?? []) {
        items.push({ key: `birthday-${b.uuid}`, date, kind: 'birthday', label: `${b.firstname} ${b.lastname}`, onClick: () => setContactUuid(b.uuid) });
      }
    }
    return items;
  }, [isDesktop, grid, mode, anchor, eventsByDate, externalEventsByDate, birthdaysByDate, navigate]);

  const monthLabel = formatDate(anchor, i18n.language, { month: 'long', year: 'numeric' });
  const todayKey = toDateKey(new Date());

  const goPrev = () => setAnchor((a) => (mode === 'month' ? addMonths(a, -1) : addWeeks(a, -1)));
  const goNext = () => setAnchor((a) => (mode === 'month' ? addMonths(a, 1) : addWeeks(a, 1)));
  const goToday = () => setAnchor(new Date());

  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1 }}>
          <IconButton aria-label={t('events.calendar.previous')} onClick={goPrev}><ChevronLeftIcon /></IconButton>
          <Typography variant="h6" sx={{ minWidth: 180, textAlign: 'center' }}>{monthLabel}</Typography>
          <IconButton aria-label={t('events.calendar.next')} onClick={goNext}><ChevronRightIcon /></IconButton>
          <Button size="small" onClick={goToday}>{t('events.calendar.today')}</Button>
        </Stack>
        <Stack direction="row" sx={{ alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <CalendarFilter
            icsSources={icsSources}
            icsSourcesTruncated={icsSourcesResult?.truncated ?? false}
            selected={selectedFilters}
            onChange={setSelectedFilters}
          />
          {(externalEventsFetching || icsSourcesFetching) && (
            <CircularProgress size={18} data-testid="external-events-spinner" />
          )}
          <ToggleButtonGroup value={mode} exclusive onChange={(_e, value: ViewMode | null) => value && setMode(value)} size="small">
            <ToggleButton value="month">{t('events.calendar.month')}</ToggleButton>
            <ToggleButton value="week">{t('events.calendar.week')}</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Stack>

      {isRangeLoading ? (
        <Box data-testid="calendar-skeleton" sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
          {Array.from({ length: 28 }).map((_, i) => (
            <Skeleton key={i} variant="rounded" height={96} />
          ))}
        </Box>
      ) : isDesktop ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
          {[t('events.calendar.mon'), t('events.calendar.tue'), t('events.calendar.wed'), t('events.calendar.thu'), t('events.calendar.fri'), t('events.calendar.sat'), t('events.calendar.sun')].map((label) => (
            <Typography key={label} variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>{label}</Typography>
          ))}
          {grid.flat().map((date) => {
            const key = toDateKey(date);
            const isCurrentMonth = mode === 'week' || date.getMonth() === anchor.getMonth();
            const isPast = key < todayKey;
            const isToday = key === todayKey;
            // CSS opacity on this Box composites its whole subtree (date
            // number + chips) as one semi-transparent group - there is no
            // way for a descendant Chip's variant="outlined" to opt out of
            // that, so opacity must never be used to signal "past" (it would
            // dim chip label text below a safe contrast ratio regardless of
            // variant). Only out-of-month days get dimmed here; past-day
            // treatment is carried entirely by the bgcolor tint below plus
            // the outlined chip variant.
            const opacity = isCurrentMonth ? 1 : 0.4;
            return (
              // ponytail: day-chip-list cell, no hour-by-hour time grid - see this plan's Global Constraints.
              <Box
                key={key}
                sx={{
                  border: isToday ? 2 : 1,
                  borderColor: isToday ? 'primary.main' : 'divider',
                  borderRadius: 1,
                  p: 0.5,
                  minHeight: mode === 'week' ? 160 : 96,
                  opacity,
                  bgcolor: isPast && isCurrentMonth ? 'action.hover' : undefined,
                }}
              >
                <Typography variant="caption">{date.getDate()}</Typography>
                <Stack sx={{ gap: 0.5, mt: 0.5 }}>
                  {(eventsByDate.get(key) ?? []).map((e) => (
                    <Chip key={e.uuid} size="small" color="primary" variant={isPast ? 'outlined' : 'filled'} label={e.title} onClick={() => navigate(`/events/${e.uuid}`)} />
                  ))}
                  {(externalEventsByDate.get(key) ?? []).map((e) => (
                    <Chip key={e.uuid} size="small" color="default" variant={isPast ? 'outlined' : 'filled'} label={e.title} onClick={() => navigate(`/external-events/${e.uuid}`)} />
                  ))}
                  {(birthdaysByDate.get(key) ?? []).map((b) => (
                    <Chip key={b.uuid} size="small" color="secondary" variant={isPast ? 'outlined' : 'filled'} icon={<CakeIcon />} label={`${b.firstname} ${b.lastname}`} onClick={() => setContactUuid(b.uuid)} />
                  ))}
                </Stack>
              </Box>
            );
          })}
        </Box>
      ) : (
        <Stack spacing={1}>
          {mobileItems.length === 0 ? (
            <Typography color="text.secondary">{t('publicCalendar.noEvents')}</Typography>
          ) : (
            mobileItems.map((item) => {
              const dayLabel = item.date.toLocaleDateString(i18n.language, { day: 'numeric' });
              const monthLabel2 = item.date.toLocaleDateString(i18n.language, { month: 'short' }).replace('.', '');
              const isPast = toDateKey(item.date) < todayKey;
              return (
                <Paper key={item.key} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', bgcolor: isPast ? 'action.hover' : undefined }}>
                  <Box sx={{
                    flexShrink: 0, width: 56, height: 56, borderRadius: 1,
                    bgcolor: isPast ? 'action.disabledBackground' : 'primary.dark',
                    color: isPast ? 'text.secondary' : '#FFFFFF',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}
                  >
                    <Typography sx={{ fontSize: 20, fontWeight: 700, lineHeight: 1.1 }}>{dayLabel}</Typography>
                    <Typography sx={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{monthLabel2}</Typography>
                  </Box>
                  {item.kind === 'birthday' ? (
                    <Chip color="secondary" variant={isPast ? 'outlined' : 'filled'} icon={<CakeIcon />} label={item.label} onClick={item.onClick} />
                  ) : (
                    <Box sx={{ minWidth: 0 }}>
                      <Chip color={item.kind === 'event' ? 'primary' : 'default'} variant={isPast ? 'outlined' : 'filled'} label={item.label} onClick={item.onClick} />
                      {(item.time || item.location) && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {[item.time, item.location].filter(Boolean).join(' · ')}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Paper>
              );
            })
          )}
        </Stack>
      )}

      {contactUuid !== null && (
        <BirthdayContactDialog uuid={contactUuid} open onClose={() => setContactUuid(null)} />
      )}
    </Box>
  );
}
