import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LogoUploadWidget from './LogoUploadWidget';
import '../../i18n';

const server = setupServer(
  http.post('/api/v1/app_logo', () => HttpResponse.json({ updated_at: '2026-08-03T00:00:00.000Z' }, { status: 200 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderWidget() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <LogoUploadWidget />
    </QueryClientProvider>,
  );
}

describe('LogoUploadWidget', () => {
  it('renders the upload button', () => {
    renderWidget();
    expect(screen.getByRole('button', { name: 'Logo hochladen' })).toBeInTheDocument();
  });

  it('uploads the selected file with no error shown', async () => {
    renderWidget();
    const file = new File(['contents'], 'logo.png', { type: 'image/png' });

    await userEvent.upload(screen.getByLabelText('Logo hochladen'), file);

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });

  it('shows the error message when the upload is rejected', async () => {
    server.use(
      http.post('/api/v1/app_logo', () =>
        HttpResponse.json({ error: 'unprocessable', detail: 'uploaded file is not a valid image' }, { status: 422 })),
    );
    renderWidget();
    const file = new File(['not an image'], 'logo.png', { type: 'image/png' });

    await userEvent.upload(screen.getByLabelText('Logo hochladen'), file);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('uploaded file is not a valid image'));
  });
});
