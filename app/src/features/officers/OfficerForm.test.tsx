import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import OfficerForm from './OfficerForm';
import '../../i18n';

const server = setupServer(
  http.get('/api/v1/roles', () => HttpResponse.json({
    rows: [{ id: 1, name: 'WorshipfulMaster', display_name: 'Meister vom Stuhl' }],
  })),
);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderForm(onSubmit = vi.fn()) {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <OfficerForm defaultValues={{ firstname: '', lastname: '' }} onSubmit={onSubmit} submitting={false} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return onSubmit;
}

describe('OfficerForm', () => {
  it('submits the entered firstname, lastname, and role', async () => {
    const onSubmit = renderForm();
    await userEvent.type(screen.getByLabelText(/Vorname/), 'Karl');
    await userEvent.type(screen.getByLabelText(/Nachname/), 'Meister');
    // The role Autocomplete's TextField is HTML5 `required` (Officer.role_id
    // is a non-null field on the server), so a role must be picked or the
    // native constraint validation blocks the form submit event entirely.
    await userEvent.click(screen.getByLabelText('Amt *'));
    await userEvent.click(await screen.findByRole('option', { name: 'Meister vom Stuhl' }));
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ firstname: 'Karl', lastname: 'Meister', role_id: 1 });
  });

  it('renders a Cancel button that does not submit the form', async () => {
    const onSubmit = renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
