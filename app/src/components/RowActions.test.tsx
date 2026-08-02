import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import RowActions from './RowActions';

describe('RowActions', () => {
  it('renders nothing when the caller can neither edit nor delete', () => {
    const { container } = render(
      <RowActions canEdit={false} canDelete={false} deleting={false}
        editLabel="Bearbeiten" deleteLabel="Löschen" confirmLabel="Wirklich löschen?"
        onEdit={vi.fn()} onDelete={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('calls onEdit when the edit button is clicked', () => {
    const onEdit = vi.fn();
    render(
      <RowActions canEdit canDelete={false} deleting={false}
        editLabel="Bearbeiten" deleteLabel="Löschen" confirmLabel="Wirklich löschen?"
        onEdit={onEdit} onDelete={vi.fn()} />,
    );
    fireEvent.click(screen.getByLabelText('Bearbeiten'));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it('requires a second click to confirm delete', () => {
    const onDelete = vi.fn();
    render(
      <RowActions canEdit={false} canDelete deleting={false}
        editLabel="Bearbeiten" deleteLabel="Löschen" confirmLabel="Wirklich löschen?"
        onEdit={vi.fn()} onDelete={onDelete} />,
    );
    fireEvent.click(screen.getByLabelText('Löschen'));
    expect(onDelete).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText('Wirklich löschen?'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('stops row-click propagation so clicking actions does not also navigate via the row', () => {
    const onRowClick = vi.fn();
    render(
      // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- stand-in for a real row click handler under test, not a UI element
      <div onClick={onRowClick}>
        <RowActions canEdit canDelete={false} deleting={false}
          editLabel="Bearbeiten" deleteLabel="Löschen" confirmLabel="Wirklich löschen?"
          onEdit={vi.fn()} onDelete={vi.fn()} />
      </div>,
    );
    fireEvent.click(screen.getByLabelText('Bearbeiten'));
    expect(onRowClick).not.toHaveBeenCalled();
  });
});
