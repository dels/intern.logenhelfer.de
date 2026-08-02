import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import LodgeForm from './LodgeForm';
import '../../i18n';

const server = setupServer(
  http.get('/api/v1/districts', () => HttpResponse.json({
    rows: [{ id: 1, name: 'Nordwest' }],
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
        <LodgeForm defaultValues={{ name: '', description: '' }} onSubmit={onSubmit} submitting={false} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return onSubmit;
}

describe('LodgeForm', () => {
  it('submits the entered name and description', async () => {
    const onSubmit = renderForm();
    await userEvent.type(screen.getByLabelText(/Name/), 'Neue Loge');
    // The district Autocomplete's TextField is HTML5 `required` (Lodge.district_id
    // is a non-null field on the server), so a district must be picked or the
    // native constraint validation blocks the form submit event entirely.
    await userEvent.click(screen.getByLabelText(/Distrikt/));
    await userEvent.click(await screen.findByRole('option', { name: 'Nordwest' }));
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ name: 'Neue Loge', district_id: 1 });
  });

  it('renders a Cancel button that does not submit the form', async () => {
    const onSubmit = renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
