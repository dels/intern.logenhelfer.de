import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import DataTable from '../../components/DataTable';
import { useBirthdayList, downloadBirthdayListPdf } from './api';
import type { BirthdayListRow } from '../../api/types';
import MembersNavTabs from './MembersNavTabs';

export default function BirthdayListPage() {
  const { t, i18n } = useTranslation();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'date_of_birth', sort: 'asc' }]);
  const sortParam = sortModel[0] ? `${sortModel[0].sort === 'desc' ? '-' : ''}${sortModel[0].field}` : 'date_of_birth';
  const { data, isLoading } = useBirthdayList(paginationModel.page, paginationModel.pageSize, sortParam);

  // date_of_birth and both jubilee fields are pure dates (no time-of-day
  // component), unlike UserStatsPage's current_sign_in_at which is a
  // datetime - so this formats with dateStyle only (no timeStyle), rather
  // than copying UserStatsPage's formatter verbatim, to avoid rendering a
  // spurious "00:00" time. All three are nullable per the schema, so the
  // same null-safe formatter is reused for all of them.
  const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString(i18n.language, { dateStyle: 'medium' }) : '');

  const columns: GridColDef<BirthdayListRow>[] = [
    { field: 'lastname', headerName: t('members.lastname'), flex: 1 },
    { field: 'firstname', headerName: t('members.firstname'), flex: 1 },
    {
      field: 'date_of_birth', headerName: t('members.dateOfBirth'), flex: 1,
      valueFormatter: formatDate,
    },
    { field: 'age', headerName: t('members.age'), flex: 1 },
    {
      field: 'twentyfifth_jubilee', headerName: t('members.jubilee25'), flex: 1,
      valueFormatter: formatDate,
    },
    {
      field: 'fortieth_jubilee', headerName: t('members.jubilee40'), flex: 1,
      valueFormatter: formatDate,
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h1">{t('members.birthdayListHeader')}</Typography>
        <Button onClick={() => void downloadBirthdayListPdf()}>{t('members.exportPdf')}</Button>
      </Box>
      <MembersNavTabs />
      <DataTable<BirthdayListRow>
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
