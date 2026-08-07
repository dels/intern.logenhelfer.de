import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import BirthdayAccordionList from './BirthdayAccordionList';
import type { BirthdayListRow } from '../../api/types';
import '../../i18n';

function row(overrides: Partial<BirthdayListRow> = {}): BirthdayListRow {
  return {
    uuid: 'u-1', lastname: 'Muster', firstname: 'Max',
    date_of_birth: '1980-05-01', age: 46,
    twentyfifth_jubilee: '2025-01-01', fortieth_jubilee: null,
    ...overrides,
  };
}

const formatDate = (value: string | null) => (value ? new Date(value).toLocaleDateString('de-DE', { dateStyle: 'medium' }) : '');

describe('BirthdayAccordionList', () => {
  it('shows the name and formatted birthday in the collapsed accordion header', () => {
    render(<BirthdayAccordionList rows={[row()]} formatDate={formatDate} />);
    expect(screen.getByText('Max Muster')).toBeInTheDocument();
    expect(screen.getByText(formatDate('1980-05-01'))).toBeInTheDocument();
  });

  it('does not show age or jubilee dates until the accordion is expanded', () => {
    render(<BirthdayAccordionList rows={[row()]} formatDate={formatDate} />);
    expect(screen.queryByText('46')).not.toBeInTheDocument();
    expect(screen.queryByText(formatDate('2025-01-01'))).not.toBeInTheDocument();
  });

  it('shows age and jubilee dates in the accordion body once expanded, blanking a null jubilee', async () => {
    render(<BirthdayAccordionList rows={[row()]} formatDate={formatDate} />);
    await userEvent.click(screen.getByRole('button', { name: `Max Muster ${formatDate('1980-05-01')}` }));
    expect(screen.getByText('46')).toBeInTheDocument();
    expect(screen.getByText(formatDate('2025-01-01'))).toBeInTheDocument();
    expect(screen.queryByText(/00:00/)).not.toBeInTheDocument();
  });

  it('renders one accordion row per member', () => {
    render(<BirthdayAccordionList rows={[row(), row({ uuid: 'u-2', lastname: 'Zweite', firstname: 'Bea', date_of_birth: '1985-01-01', age: 41 })]} formatDate={formatDate} />);
    expect(screen.getByText('Max Muster')).toBeInTheDocument();
    expect(screen.getByText('Bea Zweite')).toBeInTheDocument();
  });
});
