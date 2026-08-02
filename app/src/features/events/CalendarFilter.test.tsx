import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CalendarFilter from './CalendarFilter';
import '../../i18n';

const icsSources = [
  { uuid: 's1', name: 'Nachbarloge', url: 'https://example.test/a.ics', created_at: '2026-01-01T00:00:00Z' },
  { uuid: 's2', name: 'Bezirksloge', url: 'https://example.test/b.ics', created_at: '2026-01-01T00:00:00Z' },
];

describe('CalendarFilter', () => {
  it('renders one option for birthdays, one for external events, and one per ICS source', async () => {
    const onChange = vi.fn();
    render(<CalendarFilter icsSources={icsSources} selected={new Set(['birthdays'])} onChange={onChange} />);
    await userEvent.click(screen.getByRole('combobox'));
    expect(screen.getByRole('option', { name: /Geburtstage/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Externe Termine/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Nachbarloge' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Bezirksloge' })).toBeInTheDocument();
  });

  it('is searchable: typing filters the option list', async () => {
    render(<CalendarFilter icsSources={icsSources} selected={new Set()} onChange={vi.fn()} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.type(screen.getByRole('combobox'), 'Bezirk');
    expect(screen.getByRole('option', { name: 'Bezirksloge' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Nachbarloge' })).not.toBeInTheDocument();
  });

  it('calls onChange with the source uuid added when an ICS source option is picked', async () => {
    const onChange = vi.fn();
    render(<CalendarFilter icsSources={icsSources} selected={new Set(['birthdays'])} onChange={onChange} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Nachbarloge' }));
    expect(onChange).toHaveBeenCalledWith(new Set(['birthdays', 's1']));
  });

  it('calls onChange with a key removed when an already-selected option is picked again', async () => {
    const onChange = vi.fn();
    render(<CalendarFilter icsSources={icsSources} selected={new Set(['birthdays', 's1'])} onChange={onChange} />);
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Nachbarloge' }));
    expect(onChange).toHaveBeenCalledWith(new Set(['birthdays']));
  });

  it('shows a truncation message when icsSourcesTruncated is true', () => {
    render(<CalendarFilter icsSources={icsSources} icsSourcesTruncated selected={new Set()} onChange={vi.fn()} />);
    expect(screen.getByText(/1000/)).toBeInTheDocument();
  });

  it('shows no truncation message when icsSourcesTruncated is false or unset', () => {
    render(<CalendarFilter icsSources={icsSources} selected={new Set()} onChange={vi.fn()} />);
    expect(screen.queryByText(/1000/)).not.toBeInTheDocument();
  });
});
