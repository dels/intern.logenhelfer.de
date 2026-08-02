import { useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { GridColDef, GridSortModel } from '@mui/x-data-grid';
import DataTable from '../../components/DataTable';
import { useCouncilList } from './api';
import type { CouncilRow } from '../../api/types';
import MembersNavTabs from './MembersNavTabs';
import { PhoneLink, EmailLink } from '../../components/ContactLinks';

/** Nulls-last string comparator, matching the backend's own sort convention - applied client-side since this whole (small, unpaginated) list is already loaded in one shot. */
function compareRows(a: CouncilRow, b: CouncilRow, field: keyof CouncilRow, desc: boolean): number {
  const av = a[field];
  const bv = b[field];
  let cmp: number;
  if (av === null || av === undefined) cmp = bv === null || bv === undefined ? 0 : 1;
  else if (bv === null || bv === undefined) cmp = -1;
  else cmp = av < bv ? -1 : av > bv ? 1 : 0;
  return desc ? -cmp : cmp;
}

export default function CouncilListPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useCouncilList();
  const [sortModel, setSortModel] = useState<GridSortModel>([]);

  const rows = useMemo(() => {
    const unsorted = data?.rows ?? [];
    const sort = sortModel[0];
    if (!sort) return unsorted;
    return [...unsorted].sort((a, b) => compareRows(a, b, sort.field as keyof CouncilRow, sort.sort === 'desc'));
  }, [data?.rows, sortModel]);

  const columns: GridColDef<CouncilRow>[] = [
    // `lodges.officers` ("Amtsträger"/"Officers") exists but names *people*
    // holding office - this column shows the office/role title itself
    // (role_display_name), so it borrows the wrong noun if reused across
    // feature namespaces. Using the new members.councilRole key instead,
    // per the brief's own fallback instruction.
    { field: 'role_display_name', headerName: t('members.councilRole'), flex: 1 },
    { field: 'role_email', headerName: t('members.roleEmail'), flex: 1, renderCell: (params) => (params.value ? <EmailLink email={params.value} /> : null) },
    { field: 'holder_fullname', headerName: t('members.holder'), flex: 1 },
    { field: 'holder_phone', headerName: t('seekers.addressFields.phone'), flex: 1, renderCell: (params) => (params.value ? <PhoneLink phone={params.value} /> : null) },
    { field: 'holder_mobile', headerName: t('seekers.addressFields.mobile'), flex: 1, renderCell: (params) => (params.value ? <PhoneLink phone={params.value} /> : null) },
  ];

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 2 }}>{t('members.councilListHeader')}</Typography>
      <MembersNavTabs />
      <DataTable<CouncilRow>
        columns={columns}
        rows={rows}
        rowCount={rows.length}
        loading={isLoading}
        // 50 is the largest of DataTable's fixed pageSizeOptions; this list
        // is bounded by the number of officer roles, well under that.
        paginationModel={{ page: 0, pageSize: 50 }}
        onPaginationModelChange={() => {}}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        // A role can have more than one holder, so role_display_name alone
        // isn't unique - it would collide and DataGrid silently drops rows
        // with a duplicate id.
        getRowId={(row) => `${row.role_display_name}-${row.holder_uuid}`}
      />
    </Box>
  );
}
