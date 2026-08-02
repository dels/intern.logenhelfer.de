import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Button, IconButton, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import DataTable from '../../components/DataTable';
import RowActions from '../../components/RowActions';
import { useEvents, useDeleteEvent, downloadInternalWorkingplanPdf, toLocalDateString } from './api';
import { addMonths } from './calendarGrid';
import EventsCalendarView from './EventsCalendarView';
import { useAuth } from '../../auth/AuthProvider';
import type { Event } from '../../api/types';
import { formatDate } from '../../utils/formatDate';

type ViewMode = 'list' | 'calendar';

export default function EventsListPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { abilities } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'date', sort: 'asc' }]);
  // The list view shows one month at a time, anchored on today by default.
  // Paging with goPrev/goNext (see below) is the only way to reach a month
  // that includes past events - see the from/to computation below.
  const [anchor, setAnchor] = useState<Date>(new Date());
  const { mutate: deleteEvent, isPending: deleting } = useDeleteEvent();

  const sortParam = sortModel[0] ? `${sortModel[0].sort === 'desc' ? '-' : ''}${sortModel[0].field}` : 'date';
  const today = new Date();
  const isCurrentMonth = anchor.getFullYear() === today.getFullYear() && anchor.getMonth() === today.getMonth();
  const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  // The current month is clamped to `from`=today, so its own past days stay
  // hidden by default; any other month (reached via goPrev/goNext) is shown
  // in full, since it's then either entirely past or entirely future.
  const from = toLocalDateString(isCurrentMonth ? today : monthStart);
  const to = toLocalDateString(monthEnd);
  const monthLabel = formatDate(anchor, i18n.language, { month: 'long', year: 'numeric' });
  const { data, isLoading } = useEvents(paginationModel.page, paginationModel.pageSize, sortParam, from, to);

  const goToMonth = (next: Date) => {
    setAnchor(next);
    // Paging changes the result set - stay on a page that exists rather
    // than potentially landing on an empty page.
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };
  const goPrev = () => goToMonth(addMonths(anchor, -1));
  const goNext = () => goToMonth(addMonths(anchor, 1));
  const goToday = () => goToMonth(new Date());

  const canUpdate = abilities.event?.includes('update') ?? false;
  const canDestroy = abilities.event?.includes('destroy') ?? false;

  const columns: GridColDef<Event>[] = [
    {
      field: 'date', headerName: t('events.date'), width: 120,
      valueFormatter: (value: string) => formatDate(value, i18n.language),
    },
    { field: 'time', headerName: t('events.time'), width: 100 },
    { field: 'title', headerName: t('events.title'), flex: 1 },
    { field: 'location', headerName: t('events.location'), flex: 1 },
    {
      field: 'actions', headerName: '', width: 100, sortable: false, filterable: false, disableColumnMenu: true,
      renderCell: (params) => (
        <RowActions
          canEdit={canUpdate} canDelete={canDestroy} deleting={deleting}
          editLabel={t('events.edit')} deleteLabel={t('events.delete')} confirmLabel={t('events.deleteConfirm')}
          onEdit={() => navigate(`/events/${params.row.uuid}/edit`)}
          onDelete={() => deleteEvent(params.row.uuid)}
        />
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h1">{t('nav.events')}</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {viewMode === 'list' && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton aria-label={t('events.calendar.previous')} onClick={goPrev}><ChevronLeftIcon /></IconButton>
              <Typography sx={{ minWidth: 140, textAlign: 'center' }}>{monthLabel}</Typography>
              <IconButton aria-label={t('events.calendar.next')} onClick={goNext}><ChevronRightIcon /></IconButton>
              <Button size="small" onClick={goToday}>{t('events.calendar.today')}</Button>
            </Box>
          )}
          <ToggleButtonGroup value={viewMode} exclusive onChange={(_e, value: ViewMode | null) => value && setViewMode(value)} size="small">
            <ToggleButton value="list">{t('events.calendar.viewList')}</ToggleButton>
            <ToggleButton value="calendar">{t('events.calendar.viewCalendar')}</ToggleButton>
          </ToggleButtonGroup>
          <Button onClick={() => void downloadInternalWorkingplanPdf()}>{t('events.exportWorkingplanPdf')}</Button>
          {abilities.event?.includes('create') && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/events/new')}>
              {t('events.create')}
            </Button>
          )}
        </Box>
      </Box>
      {viewMode === 'calendar' ? (
        <EventsCalendarView />
      ) : (
        <DataTable<Event>
          columns={columns}
          rows={data?.rows ?? []}
          rowCount={data?.row_count ?? 0}
          loading={isLoading}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          getRowId={(row) => row.uuid}
          onRowClick={(row) => navigate(`/events/${row.uuid}`)}
        />
      )}
    </Box>
  );
}
