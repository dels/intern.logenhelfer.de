import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import '../../i18n';
import FileForm from './FileForm';
import type { FileFormProps } from './FileForm';

const server = setupServer(
  http.get('/api/v1/roles', () => HttpResponse.json({ rows: [{ id: 1, name: 'Secretary', display_name: 'Sekretär' }] })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderForm(props: FileFormProps) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <FileForm {...props} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('FileForm', () => {
  it('renders the filename field and submits filename/role_ids', async () => {
    const onSubmit = vi.fn();
    renderForm({ defaultValues: { filename: 'a.pdf', role_ids: [] }, onSubmit, submitting: false });

    const user = userEvent.setup();
    await user.clear(screen.getByLabelText(/Dateiname/));
    await user.type(screen.getByLabelText(/Dateiname/), 'b.pdf');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ filename: 'b.pdf' }));
  });

  it('renders a Cancel button that does not submit the form', async () => {
    const onSubmit = vi.fn();
    renderForm({ defaultValues: { filename: 'a.pdf', role_ids: [] }, onSubmit, submitting: false });

    await userEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
