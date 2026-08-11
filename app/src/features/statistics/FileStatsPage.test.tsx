import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import FileStatsPage from './FileStatsPage';
import { AuthProvider } from '../../auth/AuthProvider';
import { setAccessToken } from '../../api/token';
import '../../i18n';

const server = setupServer(
  http.get('/api/v1/me', () => HttpResponse.json({ user: { id: 1 }, abilities: { statistic: ['file_stats'] } })),
  http.get('/api/v1/statistics/file_stats', () =>
    HttpResponse.json({ rows: [{ row_id: 'satzung.pdf::', filename: 'satzung.pdf', count: 5, attached_file_uuid: null }], row_count: 1 }),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
// AuthProvider's cold-boot bootstrap effect (Task 4's sub-fix (a)) refreshes
// the session before ever calling /me when there's no access token in
// memory - this file's /me mock is token-agnostic and there's no
// /session/refresh handler here, so a token must already be present for the
// mount to reach /me at all, same as a returning session in the same tab.
beforeEach(() => setAccessToken('test-token'));
afterEach(() => { server.resetHandlers(); setAccessToken(null); });
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/statistics/file-stats']}>
          <FileStatsPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('FileStatsPage', () => {
  it('renders a file with its download count', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('satzung.pdf')).toBeInTheDocument());
    expect(screen.getByText('5')).toBeInTheDocument();
  });
});
