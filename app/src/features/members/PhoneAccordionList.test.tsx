import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import PhoneAccordionList from './PhoneAccordionList';
import type { PhoneListRow } from '../../api/types';
import '../../i18n';

function row(overrides: Partial<PhoneListRow> = {}): PhoneListRow {
  return { uuid: 'u-1', lastname: 'Muster', firstname: 'Max', phone: '030-1', fax: '', mobile: '0170-9', ...overrides };
}

describe('PhoneAccordionList', () => {
  it('shows only the name in the collapsed accordion header', () => {
    render(<PhoneAccordionList rows={[row()]} />);
    expect(screen.getByText('Max Muster')).toBeInTheDocument();
    expect(screen.queryByText('030-1')).not.toBeInTheDocument();
  });

  it('shows phone and mobile as tel: links in the accordion body once expanded', async () => {
    render(<PhoneAccordionList rows={[row()]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Max Muster' }));
    expect(screen.getByRole('link', { name: '030-1' })).toHaveAttribute('href', 'tel:030-1');
    expect(screen.getByRole('link', { name: '0170-9' })).toHaveAttribute('href', 'tel:0170-9');
  });

  it('does not render a mobile link when the row has no mobile number', async () => {
    render(<PhoneAccordionList rows={[row({ mobile: '' })]} />);
    await userEvent.click(screen.getByRole('button', { name: 'Max Muster' }));
    expect(screen.getByRole('link', { name: '030-1' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: '0170-9' })).not.toBeInTheDocument();
  });

  it('renders one accordion row per member', () => {
    render(<PhoneAccordionList rows={[row(), row({ uuid: 'u-2', lastname: 'Zweite', firstname: 'Bea', phone: '1', mobile: '' })]} />);
    expect(screen.getByText('Max Muster')).toBeInTheDocument();
    expect(screen.getByText('Bea Zweite')).toBeInTheDocument();
  });
});
