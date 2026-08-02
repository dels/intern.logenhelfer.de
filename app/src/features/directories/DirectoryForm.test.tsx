import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import DirectoryForm from './DirectoryForm';
import '../../i18n';

const server = setupServer(
  http.get('/api/v1/roles', () => HttpResponse.json({
    rows: [{ id: 1, name: 'EnteredApprentice', display_name: 'Lehrling' }],
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
        <DirectoryForm defaultValues={{ name: '', description: '', category_slug: 'finanzen', role_ids: [] }} onSubmit={onSubmit} submitting={false} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return onSubmit;
}

describe('DirectoryForm', () => {
  it('submits the entered name and description', async () => {
    const onSubmit = renderForm();
    await userEvent.type(screen.getByLabelText(/Name/), 'Neuer Ordner');
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({ name: 'Neuer Ordner' });
  });

  it('renders a Cancel button that does not submit the form', async () => {
    const onSubmit = renderForm();
    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
