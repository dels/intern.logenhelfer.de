import { DataGrid, type GridColDef, type GridPaginationModel, type GridSortModel, type GridValidRowModel } from '@mui/x-data-grid';
import { deDE } from '@mui/x-data-grid/locales';

export interface DataTableProps<T extends GridValidRowModel> {
  columns: GridColDef<T>[];
  rows: T[];
  rowCount: number;
  loading: boolean;
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  sortModel: GridSortModel;
  onSortModelChange: (model: GridSortModel) => void;
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
}

export default function DataTable<T extends GridValidRowModel>({
  columns,
  rows,
  rowCount,
  loading,
  paginationModel,
  onPaginationModelChange,
  sortModel,
  onSortModelChange,
  getRowId,
  onRowClick,
}: DataTableProps<T>) {
  return (
    <DataGrid
      getRowId={getRowId}
      columns={columns}
      rows={rows}
      rowCount={rowCount}
      loading={loading}
      paginationMode="server"
      sortingMode="server"
      paginationModel={paginationModel}
      onPaginationModelChange={onPaginationModelChange}
      sortModel={sortModel}
      onSortModelChange={onSortModelChange}
      onRowClick={onRowClick ? (params) => onRowClick(params.row) : undefined}
      pageSizeOptions={[10, 25, 50]}
      disableColumnMenu
      disableRowSelectionOnClick
      localeText={deDE.components.MuiDataGrid.defaultProps.localeText}
      slotProps={{ loadingOverlay: { variant: 'skeleton', noRowsVariant: 'skeleton' } }}
    />
  );
}
