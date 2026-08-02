import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Alert, Box, Button, Tab, Tabs, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import DataTable from '../../components/DataTable';
import RowActions from '../../components/RowActions';
import { useSeekers, useDeleteSeeker, type SeekerFilter } from './api';
import { useAuth } from '../../auth/AuthProvider';
import { apiErrorMessage } from '../../api/client';
import { formatDate } from '../../utils/formatDate';
import type { SeekerSummary } from '../../api/types';

const FILTERS: SeekerFilter[] = ['active', 'accepted', 'inactive', 'declined'];

export default function SeekersListPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { abilities } = useAuth();
  const [filter, setFilter] = useState<SeekerFilter>('active');
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'lastname', sort: 'asc' }]);
  const { mutate: deleteSeeker, isPending: deleting } = useDeleteSeeker();

  const sortParam = sortModel[0] ? `${sortModel[0].sort === 'desc' ? '-' : ''}${sortModel[0].field}` : 'lastname';
  const { data, isLoading, isError, error } = useSeekers(paginationModel.page, paginationModel.pageSize, sortParam, filter);

  const canUpdate = abilities.seeker?.includes('update') ?? false;
  const canDestroy = abilities.seeker?.includes('destroy') ?? false;

  if (!abilities.seeker?.includes('read')) {
    return <Alert severity="error">{t('seekers.forbidden')}</Alert>;
  }

  const columns: GridColDef<SeekerSummary>[] = [
    { field: 'lastname', headerName: t('seekers.lastname'), flex: 1, valueGetter: (_v, row) => `${row.lastname}, ${row.firstname}` },
    { field: 'source', headerName: t('seekers.source'), flex: 1 },
    { field: 'contact_value', headerName: t('seekers.contact'), flex: 1 },
    { field: 'status_label', headerName: t('seekers.status'), width: 180 },
    {
      field: 'updated_at', headerName: t('seekers.updatedAt'), width: 140,
      valueFormatter: (value: string) => formatDate(value, i18n.language, { dateStyle: 'medium', timeStyle: 'short' }),
    },
    {
      field: 'actions', headerName: '', width: 100, sortable: false, filterable: false, disableColumnMenu: true,
      renderCell: (params) => (
        <RowActions
          canEdit={canUpdate} canDelete={canDestroy} deleting={deleting}
          editLabel={t('seekers.edit')} deleteLabel={t('seekers.delete')} confirmLabel={t('seekers.deleteConfirm')}
          onEdit={() => navigate(`/seekers/${params.row.uuid}/edit`)}
          onDelete={() => deleteSeeker(params.row.uuid)}
        />
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1">{t('nav.seekers')}</Typography>
        {abilities.seeker?.includes('create') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/seekers/new')}>
            {t('seekers.create')}
          </Button>
        )}
      </Box>
      <Tabs value={filter} onChange={(_e, value: SeekerFilter) => setFilter(value)} sx={{ mb: 2 }}>
        {FILTERS.map((f) => (
          <Tab key={f} value={f} label={t(`seekers.filter.${f}`)} />
        ))}
      </Tabs>
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t('seekers.loadError')}
          {apiErrorMessage(error) ? ` (${apiErrorMessage(error)})` : ''}
        </Alert>
      )}
      <DataTable<SeekerSummary>
        columns={columns}
        rows={data?.rows ?? []}
        rowCount={data?.row_count ?? 0}
        loading={isLoading}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        getRowId={(row) => row.uuid}
        onRowClick={(row) => navigate(`/seekers/${row.uuid}`)}
      />
    </Box>
  );
}
