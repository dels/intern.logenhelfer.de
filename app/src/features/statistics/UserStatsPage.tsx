import { useState } from 'react';
import { Alert, Box, Skeleton, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import DataTable from '../../components/DataTable';
import { useUserStats } from './api';
import { useAuth } from '../../auth/AuthProvider';
import type { UserStatsRow } from '../../api/types';
import StatisticsNavTabs from './StatisticsNavTabs';

export default function UserStatsPage() {
  const { t, i18n } = useTranslation();
  const { abilities } = useAuth();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'current_sign_in_at', sort: 'desc' }]);
  const sortParam = sortModel[0] ? `${sortModel[0].sort === 'desc' ? '-' : ''}${sortModel[0].field}` : '-current_sign_in_at';
  const { data, isLoading } = useUserStats(paginationModel.page, paginationModel.pageSize, sortParam);
  const showIp = abilities.user?.includes('destroy') ?? false;

  if (!abilities.statistic?.includes('user_stats')) {
    return <Alert severity="error">{t('statistics.forbidden')}</Alert>;
  }

  const columns: GridColDef<UserStatsRow>[] = [
    { field: 'matriculation_number', headerName: t('statistics.matriculationNumber'), flex: 1 },
    { field: 'lastname', headerName: t('statistics.lastname'), flex: 1 },
    { field: 'firstname', headerName: t('statistics.firstname'), flex: 1 },
    { field: 'sign_in_count', headerName: t('statistics.signInCount'), flex: 1 },
    {
      field: 'current_sign_in_at', headerName: t('statistics.lastSignIn'), flex: 1,
      valueFormatter: (value: string | null) => (value ? new Date(value).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }) : ''),
    },
    ...(showIp ? [{ field: 'current_sign_in_ip', headerName: t('statistics.signInIp'), flex: 1 } as GridColDef<UserStatsRow>] : []),
  ];

  return (
    <Box>
      <StatisticsNavTabs />
      <Typography variant="h1" sx={{ mb: 1 }}>{t('statistics.userStats')}</Typography>
      <Typography sx={{ mb: 2 }}>{t('statistics.avgAge')}: {isLoading ? <Skeleton variant="text" width={40} sx={{ display: 'inline-block' }} /> : (data?.avg_age ?? '-')}</Typography>
      <DataTable<UserStatsRow>
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
