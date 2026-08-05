import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Chip, Paper, Skeleton, Stack, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CakeIcon from '@mui/icons-material/Cake';
import { useTranslation } from 'react-i18next';
import { buildMonthGrid, toDateKey } from './calendarGrid';
import BirthdayContactDialog from '../members/BirthdayContactDialog';
import type { BirthdayListRow, Event, ExternalEvent } from '../../api/types';

export interface EventsCalendarViewProps {
  anchor: Date;
  events: Event[];
  externalEvents: ExternalEvent[];
  birthdays: BirthdayListRow[];
  isRangeLoading: boolean;
}

export default function EventsCalendarView({ anchor, events, externalEvents, birthdays, isRangeLoading }: EventsCalendarViewProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [contactUuid, setContactUuid] = useState<string | null>(null);

  const grid = useMemo(() => buildMonthGrid(anchor), [anchor]);

  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const e of events) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    return map;
  }, [events]);

  const externalEventsByDate = useMemo(() => {
    const map = new Map<string, ExternalEvent[]>();
    for (const e of externalEvents) map.set(e.date, [...(map.get(e.date) ?? []), e]);
    return map;
  }, [externalEvents]);

  const birthdaysByDate = useMemo(() => {
    const map = new Map<string, BirthdayListRow[]>();
    for (const b of birthdays) {
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
  }, [birthdays, grid]);

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
      if (date.getMonth() !== anchor.getMonth()) continue;
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
  }, [isDesktop, grid, anchor, eventsByDate, externalEventsByDate, birthdaysByDate, navigate]);

  const todayKey = toDateKey(new Date());

  return (
    <Box>
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
            const isCurrentMonth = date.getMonth() === anchor.getMonth();
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
                  minHeight: 96,
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
