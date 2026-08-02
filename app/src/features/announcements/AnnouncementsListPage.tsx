import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Button, FormControlLabel, Switch, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import DataTable from '../../components/DataTable';
import RowActions from '../../components/RowActions';
import { useAnnouncements, useUpdateAnnouncementSubscription, useDeleteAnnouncement } from './api';
import { useAuth } from '../../auth/AuthProvider';
import type { AnnouncementSummary } from '../../api/types';

export default function AnnouncementsListPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { abilities, user } = useAuth();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'created_at', sort: 'desc' }]);
  const sortParam = sortModel[0] ? `${sortModel[0].sort === 'desc' ? '-' : ''}${sortModel[0].field}` : '-created_at';

  const { data, isLoading } = useAnnouncements(paginationModel.page, paginationModel.pageSize, sortParam);
  const { mutate: updateSubscription, isPending: updatingSubscription } = useUpdateAnnouncementSubscription();
  const { mutate: deleteAnnouncement, isPending: deleting } = useDeleteAnnouncement();

  const canUpdate = abilities.announcement?.includes('update') ?? false;
  const canDestroy = abilities.announcement?.includes('destroy') ?? false;

  const columns: GridColDef<AnnouncementSummary>[] = [
    { field: 'title', headerName: t('announcements.title'), flex: 1 },
    {
      field: 'created_at',
      headerName: t('announcements.createdAt'),
      flex: 1,
      valueFormatter: (value: string) => new Date(value).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }),
    },
    {
      field: 'actions', headerName: '', width: 100, sortable: false, filterable: false, disableColumnMenu: true,
      renderCell: (params) => (
        <RowActions
          canEdit={canUpdate} canDelete={canDestroy} deleting={deleting}
          editLabel={t('announcements.edit')} deleteLabel={t('announcements.delete')} confirmLabel={t('announcements.deleteConfirm')}
          onEdit={() => navigate(`/announcements/${params.row.uuid}/edit`)}
          onDelete={() => deleteAnnouncement(params.row.uuid)}
        />
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1">{t('nav.announcements')}</Typography>
        {abilities.announcement?.includes('create') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/announcements/new')}>
            {t('announcements.create')}
          </Button>
        )}
      </Box>
      <FormControlLabel
        sx={{ mb: 2 }}
        control={
          <Switch
            checked={user?.subscribed_to_announcements ?? false}
            disabled={updatingSubscription}
            onChange={(_e, checked) => updateSubscription(checked)}
          />
        }
        label={t('announcements.subscribe')}
      />
      <DataTable<AnnouncementSummary>
        columns={columns}
        rows={data?.rows ?? []}
        rowCount={data?.row_count ?? 0}
        loading={isLoading}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        getRowId={(row) => row.uuid}
        onRowClick={(row) => navigate(`/announcements/${row.uuid}`)}
      />
    </Box>
  );
}
