import { useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import DataTable from '../../components/DataTable';
import { useUserFileStats } from './api';
import { useAuth } from '../../auth/AuthProvider';
import type { UserFileStatsRow } from '../../api/types';
import StatisticsNavTabs from './StatisticsNavTabs';

export default function UserFileStatsPage() {
  const { t } = useTranslation();
  const { abilities } = useAuth();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'count', sort: 'desc' }]);
  const sortParam = sortModel[0] ? `${sortModel[0].sort === 'desc' ? '-' : ''}${sortModel[0].field}` : '-count';
  const { data, isLoading } = useUserFileStats(paginationModel.page, paginationModel.pageSize, sortParam);

  if (!abilities.statistic?.includes('user_file_stats')) {
    return <Alert severity="error">{t('statistics.forbidden')}</Alert>;
  }

  const columns: GridColDef<UserFileStatsRow>[] = [
    { field: 'matriculation_number', headerName: t('statistics.matriculationNumber'), flex: 1 },
    { field: 'lastname', headerName: t('statistics.lastname'), flex: 1 },
    { field: 'firstname', headerName: t('statistics.firstname'), flex: 1 },
    { field: 'count', headerName: t('statistics.downloadCount'), flex: 1 },
  ];

  return (
    <Box>
      <StatisticsNavTabs />
      <Typography variant="h1" sx={{ mb: 2 }}>{t('statistics.userFileStats')}</Typography>
      <DataTable<UserFileStatsRow>
        columns={columns}
        rows={data?.rows ?? []}
        rowCount={data?.row_count ?? 0}
        loading={isLoading}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        getRowId={(row) => row.uuid ?? ''}
      />
    </Box>
  );
}
