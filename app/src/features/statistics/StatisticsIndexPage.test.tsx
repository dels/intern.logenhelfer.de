import { render, screen } from '@testing-library/react';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import StatisticsIndexPage from './StatisticsIndexPage';
import { AuthProvider } from '../../auth/AuthProvider';
import { setAccessToken } from '../../api/token';
import '../../i18n';

function meFixture(statistic: string[]) {
  return { user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: { statistic } };
}

const server = setupServer(
  http.get('/api/v1/me', () => HttpResponse.json(meFixture(['index', 'downloads', 'file_stats', 'mem_stats']))),
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
        <MemoryRouter initialEntries={['/statistics']}>
          <StatisticsIndexPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('StatisticsIndexPage', () => {
  it('renders the page heading and delegates the tab bar to StatisticsNavTabs', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { name: 'Statistiken' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Dateien' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Meta' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Downloads' })).toBeInTheDocument();
  });

  it('renders no tabs at all when the caller has no granted statistic pages', async () => {
    server.use(http.get('/api/v1/me', () => HttpResponse.json(meFixture([]))));
    renderPage();

    await screen.findByRole('heading', { name: 'Statistiken' });
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });
});
