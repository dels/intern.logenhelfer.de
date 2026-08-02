import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Box, Button, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import type { GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import { useTranslation } from 'react-i18next';
import DataTable from '../../components/DataTable';
import RowActions from '../../components/RowActions';
import { useCategories, useDeleteCategory } from './api';
import { useAuth } from '../../auth/AuthProvider';
import type { CategorySummary } from '../../api/types';

export default function CategoriesListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { abilities } = useAuth();
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'name', sort: 'asc' }]);
  const sortParam = sortModel[0] ? `${sortModel[0].sort === 'desc' ? '-' : ''}${sortModel[0].field}` : 'name';
  const { mutate: deleteCategory, isPending: deleting } = useDeleteCategory();

  const { data, isLoading } = useCategories(paginationModel.page, paginationModel.pageSize, sortParam);

  const canUpdate = abilities.category?.includes('update') ?? false;
  const canDestroy = abilities.category?.includes('destroy') ?? false;

  const columns: GridColDef<CategorySummary>[] = [
    { field: 'name', headerName: t('categories.name'), flex: 1 },
    { field: 'description', headerName: t('categories.description'), flex: 2 },
    {
      field: 'actions', headerName: '', width: 100, sortable: false, filterable: false, disableColumnMenu: true,
      renderCell: (params) => (
        <RowActions
          canEdit={canUpdate} canDelete={canDestroy} deleting={deleting}
          editLabel={t('categories.edit')} deleteLabel={t('categories.delete')} confirmLabel={t('categories.deleteConfirm')}
          onEdit={() => navigate(`/categories/${params.row.slug}/edit`)}
          onDelete={() => deleteCategory(params.row.slug)}
        />
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h1">{t('nav.categories')}</Typography>
        {abilities.category?.includes('create') && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/categories/new')}>
            {t('categories.create')}
          </Button>
        )}
      </Box>
      <DataTable<CategorySummary>
        columns={columns}
        rows={data?.rows ?? []}
        rowCount={data?.row_count ?? 0}
        loading={isLoading}
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        sortModel={sortModel}
        onSortModelChange={setSortModel}
        getRowId={(row) => row.slug}
        onRowClick={(row) => navigate(`/categories/${row.slug}`)}
      />
    </Box>
  );
}
