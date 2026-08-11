import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import MemStatsPage from './MemStatsPage';
import { AuthProvider } from '../../auth/AuthProvider';
import { setAccessToken } from '../../api/token';
import '../../i18n';

const statsFixture = {
  user_count: 12, event_count: 5, memory_used_bytes: 1024,
  max_db_mem_size_bytes: 4096, memory_used_incl_archived_bytes: 2048,
};

const server = setupServer(
  http.get('/api/v1/me', () =>
    HttpResponse.json({ user: { id: 1 }, abilities: { statistic: ['mem_stats'] } }),
  ),
  http.get('/api/v1/statistics/mem_stats', () => HttpResponse.json(statsFixture)),
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
        <MemoryRouter initialEntries={['/statistics/mem-stats']}>
          <MemStatsPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('MemStatsPage', () => {
  it('shows skeleton placeholders while loading, not just a spinner', async () => {
    server.use(http.get('/api/v1/statistics/mem_stats', () => new Promise(() => {})));
    const { container } = renderPage();
    await screen.findByRole('heading');
    expect(container.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
  });

  it('renders user count, event count, and formatted storage figures', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/12/)).toBeInTheDocument());
    expect(screen.getByText(/5/)).toBeInTheDocument();
    expect(screen.getByText(/1.0 KB/)).toBeInTheDocument();
  });

  it('mounts the persistent statistics tab bar with the Meta tab active', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/12/)).toBeInTheDocument());

    const metaTab = screen.getByRole('tab', { name: 'Meta' });
    expect(metaTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('link', { name: 'Speichernutzung' })).toBeInTheDocument();
  });
});
