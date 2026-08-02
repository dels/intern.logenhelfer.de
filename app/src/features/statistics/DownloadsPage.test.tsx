import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import DownloadsPage from './DownloadsPage';
import { AuthProvider } from '../../auth/AuthProvider';
import '../../i18n';

const server = setupServer(
  http.get('/api/v1/me', () => HttpResponse.json({ user: { id: 1 }, abilities: { statistic: ['downloads'] } })),
  http.get('/api/v1/statistics/downloads', () =>
    HttpResponse.json({
      rows: [{ id: 1, filename: 'satzung.pdf', user_fullname: 'Max Muster', remote_ip: '127.0.0.1', created_at: '2026-07-01T00:00:00.000Z' }],
      row_count: 1,
    }),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/statistics/downloads']}>
          <DownloadsPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('DownloadsPage', () => {
  it('renders a download row', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('satzung.pdf')).toBeInTheDocument());
    expect(screen.getByText('Max Muster')).toBeInTheDocument();
  });
});
