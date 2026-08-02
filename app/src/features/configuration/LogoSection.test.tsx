import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LogoSection from './LogoSection';
import { ToastProvider } from '../../notifications/ToastProvider';
import '../../i18n';

let logoVersion: number | null = null;
let deleteCalls = 0;

const server = setupServer(
  http.get('/api/v1/public/landing', () =>
    HttpResponse.json({ calendar_as_landing_page: false, lodge: '', language: 'de', logo_version: logoVersion }),
  ),
  http.post('/api/v1/logo', () => {
    logoVersion = Date.now();
    return HttpResponse.json({ content_type: 'image/png', updated_at: new Date().toISOString() }, { status: 201 });
  }),
  http.delete('/api/v1/logo', () => {
    deleteCalls += 1;
    logoVersion = null;
    return new HttpResponse(null, { status: 204 });
  }),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  logoVersion = null;
  deleteCalls = 0;
});
afterAll(() => server.close());

function renderSection() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <LogoSection />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('LogoSection', () => {
  it('disables the reset button when no custom logo is configured', async () => {
    renderSection();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Auf Standard zurücksetzen' })).toBeDisabled());
  });

  it('uploads a file via the hidden file input and enables reset afterwards', async () => {
    renderSection();
    const input = screen.getByLabelText('Logo hochladen', { selector: 'input' }) as HTMLInputElement;
    const file = new File(['PNGBYTES'], 'logo.png', { type: 'image/png' });
    await userEvent.upload(input, file);

    await waitFor(() => expect(screen.getByRole('button', { name: 'Auf Standard zurücksetzen' })).toBeEnabled());
  });

  it('shows an error alert and keeps reset disabled when the upload fails', async () => {
    // The file itself has an accepted extension/MIME type (so the browser's own
    // `accept` filter on the hidden input lets it through). The server only
    // validates the multipart part's declared Content-Type - it does not sniff
    // the actual bytes - so this is a pure frontend test: it mocks a 422
    // response to verify the upload UI surfaces the server's rejection
    // (error shown, reset stays disabled), not a real server-side rejection
    // of this specific file.
    server.use(
      http.post('/api/v1/logo', () =>
        HttpResponse.json({ error: 'unprocessable', detail: 'Die Datei ist kein gültiges Bild.' }, { status: 422 }),
      ),
    );
    renderSection();
    const input = screen.getByLabelText('Logo hochladen', { selector: 'input' }) as HTMLInputElement;
    const file = new File(['NOT ACTUALLY A PNG'], 'logo.png', { type: 'image/png' });
    await userEvent.upload(input, file);

    await waitFor(() => expect(screen.getByText('Die Datei ist kein gültiges Bild.')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Auf Standard zurücksetzen' })).toBeDisabled();
  });

  it('calls DELETE /api/v1/logo when the reset button is clicked', async () => {
    logoVersion = 1;
    renderSection();
    const resetButton = await screen.findByRole('button', { name: 'Auf Standard zurücksetzen' });
    await waitFor(() => expect(resetButton).toBeEnabled());
    await userEvent.click(resetButton);

    await waitFor(() => expect(deleteCalls).toBe(1));
  });
});
