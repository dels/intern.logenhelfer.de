import { useState } from 'react';
import { Box, Button, Pagination, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useTranslation } from 'react-i18next';
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import DataTable from '../../components/DataTable';
import PhoneAccordionList from './PhoneAccordionList';
import { usePhoneList, downloadPhoneListPdf } from './api';
import type { PhoneListRow } from '../../api/types';
import MembersNavTabs from './MembersNavTabs';
import { PhoneLink } from '../../components/ContactLinks';

export default function PhoneListPage() {
  const { t } = useTranslation();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'lastname', sort: 'asc' }]);
  const sortParam = sortModel[0] ? `${sortModel[0].sort === 'desc' ? '-' : ''}${sortModel[0].field}` : 'lastname';
  const { data, isLoading } = usePhoneList(paginationModel.page, paginationModel.pageSize, sortParam);

  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const pageCount = Math.ceil((data?.row_count ?? 0) / paginationModel.pageSize);

  const columns: GridColDef<PhoneListRow>[] = [
    { field: 'lastname', headerName: t('members.lastname'), flex: 1 },
    { field: 'firstname', headerName: t('members.firstname'), flex: 1 },
    { field: 'phone', headerName: t('seekers.addressFields.phone'), flex: 1, renderCell: (params) => (params.value ? <PhoneLink phone={params.value} /> : null) },
    { field: 'mobile', headerName: t('seekers.addressFields.mobile'), flex: 1, renderCell: (params) => (params.value ? <PhoneLink phone={params.value} /> : null) },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h1">{t('members.phoneListHeader')}</Typography>
        <Button onClick={() => void downloadPhoneListPdf()}>{t('members.exportPdf')}</Button>
      </Box>
      <MembersNavTabs />
      {isDesktop ? (
        <DataTable<PhoneListRow>
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
      ) : (
        <>
          <PhoneAccordionList rows={data?.rows ?? []} />
          {pageCount > 1 && (
            <Pagination
              sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}
              count={pageCount}
              page={paginationModel.page + 1}
              onChange={(_e, page) => setPaginationModel((m) => ({ ...m, page: page - 1 }))}
            />
          )}
        </>
      )}
    </Box>
  );
}
