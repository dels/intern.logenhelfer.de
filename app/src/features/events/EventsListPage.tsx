import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Button, CircularProgress, IconButton, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useTranslation } from 'react-i18next';
import { useDeleteEvent, downloadInternalWorkingplanPdf } from './api';
import { addMonths } from './calendarGrid';
import { useCalendarRangeData } from './useCalendarRangeData';
import EventsCalendarView from './EventsCalendarView';
import EventsListTable from './EventsListTable';
import CalendarFilter from './CalendarFilter';
import { useAuth } from '../../auth/AuthProvider';
import { formatDate } from '../../utils/formatDate';

type ViewMode = 'list' | 'calendar';

export default function EventsListPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { abilities } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [selectedFilters, setSelectedFilters] = useState<Set<string>>(new Set(['birthdays']));
  const { mutate: deleteEvent, isPending: deleting } = useDeleteEvent();

  const range = useCalendarRangeData(anchor, selectedFilters);
  const monthLabel = formatDate(anchor, i18n.language, { month: 'long', year: 'numeric' });

  const goPrev = () => setAnchor((a) => addMonths(a, -1));
  const goNext = () => setAnchor((a) => addMonths(a, 1));
  const goToday = () => setAnchor(new Date());

  const canUpdate = abilities.event?.includes('update') ?? false;
  const canDestroy = abilities.event?.includes('destroy') ?? false;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h1">{t('nav.events')}</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button onClick={() => void downloadInternalWorkingplanPdf()}>{t('events.exportWorkingplanPdf')}</Button>
          {abilities.event?.includes('create') && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/events/new')}>
              {t('events.create')}
            </Button>
          )}
          {abilities.external_event?.includes('create') && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/external-events/new')}>
              {t('events.createExternal')}
            </Button>
          )}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <ToggleButtonGroup value={viewMode} exclusive onChange={(_e, value: ViewMode | null) => value && setViewMode(value)} size="small">
            <ToggleButton value="list">{t('events.calendar.viewList')}</ToggleButton>
            <ToggleButton value="calendar">{t('events.calendar.viewCalendar')}</ToggleButton>
          </ToggleButtonGroup>
          <CalendarFilter
            icsSources={range.icsSources}
            icsSourcesTruncated={range.icsSourcesTruncated}
            selected={selectedFilters}
            onChange={setSelectedFilters}
          />
          {(range.externalEventsFetching || range.icsSourcesFetching) && (
            <CircularProgress size={18} data-testid="external-events-spinner" />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton aria-label={t('events.calendar.previous')} onClick={goPrev}><ChevronLeftIcon /></IconButton>
          <Typography sx={{ minWidth: 140, textAlign: 'center' }}>{monthLabel}</Typography>
          <IconButton aria-label={t('events.calendar.next')} onClick={goNext}><ChevronRightIcon /></IconButton>
          <Button variant="outlined" size="small" onClick={goToday}>{t('events.calendar.today')}</Button>
        </Box>
      </Box>
      {viewMode === 'calendar' ? (
        <EventsCalendarView
          anchor={anchor}
          events={range.events}
          externalEvents={range.externalEvents}
          birthdays={range.visibleBirthdays}
          isRangeLoading={range.isRangeLoading}
        />
      ) : (
        <EventsListTable
          events={range.events}
          externalEvents={range.externalEvents}
          birthdays={range.visibleBirthdays}
          from={range.from}
          to={range.to}
          isLoading={range.isRangeLoading}
          canUpdate={canUpdate}
          canDestroy={canDestroy}
          deleting={deleting}
          onDeleteEvent={deleteEvent}
        />
      )}
    </Box>
  );
}
