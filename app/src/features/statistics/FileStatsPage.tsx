import { useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import DataTable from '../../components/DataTable';
import { useFileStats } from './api';
import { useAuth } from '../../auth/AuthProvider';
import type { FileStatsRow } from '../../api/types';
import StatisticsNavTabs from './StatisticsNavTabs';

export default function FileStatsPage() {
  const { t } = useTranslation();
  const { abilities } = useAuth();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'count', sort: 'desc' }]);
  const sortParam = sortModel[0] ? `${sortModel[0].sort === 'desc' ? '-' : ''}${sortModel[0].field}` : '-count';
  const { data, isLoading } = useFileStats(paginationModel.page, paginationModel.pageSize, sortParam);

  if (!abilities.statistic?.includes('file_stats')) {
    return <Alert severity="error">{t('statistics.forbidden')}</Alert>;
  }

  const columns: GridColDef<FileStatsRow>[] = [
    { field: 'filename', headerName: t('statistics.filename'), flex: 1 },
    { field: 'count', headerName: t('statistics.downloadCount'), flex: 1 },
  ];

  return (
    <Box>
      <StatisticsNavTabs />
      <Typography variant="h1" sx={{ mb: 2 }}>{t('statistics.fileStats')}</Typography>
      <DataTable<FileStatsRow>
        columns={columns}
        rows={data?.rows ?? []}
        rowCount={data?.row_count ?? 0}
        loading={isLoading}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        getRowId={(row) => row.row_id}
      />
    </Box>
  );
}
