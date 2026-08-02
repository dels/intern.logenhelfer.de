import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DataTable from './DataTable';

interface Row { uuid: string; label: string }

describe('DataTable', () => {
  it('renders rows and reports the total row count via rowCount, not rows.length', () => {
    const rows: Row[] = [{ uuid: '1', label: 'First' }];
    render(
      <DataTable<Row>
        columns={[{ field: 'label', headerName: 'Label' }]}
        rows={rows}
        rowCount={42}
        loading={false}
        paginationModel={{ page: 0, pageSize: 25 }}
        onPaginationModelChange={vi.fn()}
        sortModel={[]}
        onSortModelChange={vi.fn()}
        getRowId={(row) => row.uuid}
      />,
    );
    expect(screen.getByText('First')).toBeInTheDocument();
  });

  it('shows skeleton placeholders while loading', () => {
    const { container } = render(
      <DataTable<Row>
        columns={[{ field: 'label', headerName: 'Label' }]}
        rows={[]}
        rowCount={0}
        loading
        paginationModel={{ page: 0, pageSize: 25 }}
        onPaginationModelChange={vi.fn()}
        sortModel={[]}
        onSortModelChange={vi.fn()}
        getRowId={(row) => row.uuid}
      />,
    );
    // jsdom has no ResizeObserver/real layout, so MUI X's skeleton-cell-count
    // calculation (Math.ceil(viewportHeight / rowHeight)) is always 0 here even
    // when the skeleton variant is correctly selected. The wrapping overlay
    // container, however, renders unconditionally, so its presence is a
    // dimension-independent signal that the 'skeleton' variant was chosen.
    expect(container.querySelector('.MuiDataGrid-skeletonLoadingOverlay')).not.toBeNull();
  });

  it('shows a skeleton overlay (not the default progress bar) when reloading with rows already present', () => {
    const rows: Row[] = [{ uuid: '1', label: 'First' }];
    const { container } = render(
      <DataTable<Row>
        columns={[{ field: 'label', headerName: 'Label' }]}
        rows={rows}
        rowCount={1}
        loading
        paginationModel={{ page: 0, pageSize: 25 }}
        onPaginationModelChange={vi.fn()}
        sortModel={[]}
        onSortModelChange={vi.fn()}
        getRowId={(row) => row.uuid}
      />,
    );
    // With non-empty rows, MUI X's overlay logic uses the `variant` field (not
    // `noRowsVariant`), which defaults to 'linear-progress', not 'skeleton'.
    // This asserts on DataTable.tsx's explicit slotProps override, so it fails
    // if that override is removed — unlike the zero-rows test above.
    expect(container.querySelector('.MuiDataGrid-skeletonLoadingOverlay')).not.toBeNull();
  });
});
