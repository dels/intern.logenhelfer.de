import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import SeekerForm from './SeekerForm';
import '../../i18n';

const emptyValues = {
  firstname: '', lastname: '', source: '', invite: true, status: 0,
  preferred_way_of_contact: undefined, notes: '',
  address: { type_of_address: 0, purpose: 'Privat', phone: '' },
};

describe('SeekerForm', () => {
  it('renders the core fields and submits them', async () => {
    const onSubmit = vi.fn();
    render(
      <MemoryRouter>
        <SeekerForm defaultValues={emptyValues} onSubmit={onSubmit} submitting={false} />
      </MemoryRouter>,
    );

    await userEvent.type(screen.getByLabelText(/Vorname/), 'Max');
    await userEvent.type(screen.getByLabelText(/Name/), 'Sucher');
    await userEvent.type(screen.getByLabelText(/Telefon/), '+49 (30) 1234567');
    fireEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ firstname: 'Max', lastname: 'Sucher' });
  });

  it('renders a Cancel button that does not submit the form', async () => {
    const onSubmit = vi.fn();
    render(
      <MemoryRouter>
        <SeekerForm defaultValues={emptyValues} onSubmit={onSubmit} submitting={false} />
      </MemoryRouter>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
