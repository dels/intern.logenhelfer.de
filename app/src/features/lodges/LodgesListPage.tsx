import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import DataTable from '../../components/DataTable';
import RowActions from '../../components/RowActions';
import { useLodges, useDeleteLodge } from './api';
import { useAuth } from '../../auth/AuthProvider';
import type { LodgeSummary } from '../../api/types';

export default function LodgesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { abilities } = useAuth();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'name', sort: 'asc' }]);
  const sortParam = sortModel[0] ? `${sortModel[0].sort === 'desc' ? '-' : ''}${sortModel[0].field}` : 'name';
  const { mutate: deleteLodge, isPending: deleting } = useDeleteLodge();

  const { data, isLoading } = useLodges(paginationModel.page, paginationModel.pageSize, sortParam);

  const canUpdate = abilities.lodge?.includes('update') ?? false;
  const canDestroy = abilities.lodge?.includes('destroy') ?? false;

  const columns: GridColDef<LodgeSummary>[] = [
    { field: 'name', headerName: t('lodges.name'), flex: 1 },
    { field: 'district_name', headerName: t('lodges.district'), flex: 1 },
    { field: 'description', headerName: t('lodges.description'), flex: 2 },
    {
      field: 'actions', headerName: '', width: 100, sortable: false, filterable: false, disableColumnMenu: true,
      renderCell: (params) => (
        <RowActions
          canEdit={canUpdate} canDelete={canDestroy} deleting={deleting}
          editLabel={t('lodges.edit')} deleteLabel={t('lodges.delete')} confirmLabel={t('lodges.deleteConfirm')}
          onEdit={() => navigate(`/lodges/${params.row.slug}/edit`)}
          onDelete={() => deleteLodge(params.row.slug)}
        />
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1">{t('nav.lodges')}</Typography>
        {abilities.lodge?.includes('create') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/lodges/new')}>
            {t('lodges.create')}
          </Button>
        )}
      </Box>
      <DataTable<LodgeSummary>
        columns={columns}
        rows={data?.rows ?? []}
        rowCount={data?.row_count ?? 0}
        loading={isLoading}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        getRowId={(row) => row.slug}
        onRowClick={(row) => navigate(`/lodges/${row.slug}`)}
      />
    </Box>
  );
}
