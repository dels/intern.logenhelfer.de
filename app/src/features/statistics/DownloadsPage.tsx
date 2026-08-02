import { useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import DataTable from '../../components/DataTable';
import { useDownloads } from './api';
import { useAuth } from '../../auth/AuthProvider';
import type { DownloadRow } from '../../api/types';
import StatisticsNavTabs from './StatisticsNavTabs';

export default function DownloadsPage() {
  const { t, i18n } = useTranslation();
  const { abilities } = useAuth();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'created_at', sort: 'desc' }]);
  const sortParam = sortModel[0] ? `${sortModel[0].sort === 'desc' ? '-' : ''}${sortModel[0].field}` : '-created_at';
  const { data, isLoading } = useDownloads(paginationModel.page, paginationModel.pageSize, sortParam);

  if (!abilities.statistic?.includes('downloads')) {
    return <Alert severity="error">{t('statistics.forbidden')}</Alert>;
  }

  const columns: GridColDef<DownloadRow>[] = [
    { field: 'filename', headerName: t('statistics.filename'), flex: 1 },
    { field: 'user_fullname', headerName: t('statistics.downloadedBy'), flex: 1 },
    { field: 'remote_ip', headerName: t('statistics.remoteIp'), flex: 1 },
    {
      field: 'created_at', headerName: t('statistics.downloadedAt'), flex: 1,
      valueFormatter: (value: string) => new Date(value).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }),
    },
  ];

  return (
    <Box>
      <StatisticsNavTabs />
      <Typography variant="h1" sx={{ mb: 2 }}>{t('statistics.downloads')}</Typography>
      <DataTable<DownloadRow>
        columns={columns}
        rows={data?.rows ?? []}
        rowCount={data?.row_count ?? 0}
        loading={isLoading}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        getRowId={(row) => String(row.id)}
      />
    </Box>
  );
}
