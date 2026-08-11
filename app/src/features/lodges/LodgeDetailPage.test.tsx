import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import LodgeDetailPage from './LodgeDetailPage';
import { AuthProvider } from '../../auth/AuthProvider';
import { setAccessToken } from '../../api/token';
import '../../i18n';

function lodgeFixture(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    slug: 'zur-linde', name: 'Zur Linde', description: 'Am Marktplatz', district_id: 1, district_name: 'Nordwest',
    ...overrides,
  };
}

const server = setupServer(
  http.get('/api/v1/me', () =>
    HttpResponse.json({ user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: { lodge: ['read', 'create', 'update', 'destroy'] } }),
  ),
  http.get('/api/v1/lodges/zur-linde', () => HttpResponse.json(lodgeFixture())),
  http.get('/api/v1/officers', () =>
    HttpResponse.json({ rows: [{ uuid: 'off-1', firstname: 'Karl', lastname: 'Meister', role_display_name: 'Meister vom Stuhl' }], row_count: 1 }),
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
        <MemoryRouter initialEntries={['/lodges/zur-linde']}>
          <Routes>
            <Route path="/lodges/:slug" element={<LodgeDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('LodgeDetailPage', () => {
  it('renders the lodge name, district, and description', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Zur Linde')).toBeInTheDocument());
    expect(screen.getByText('Nordwest')).toBeInTheDocument();
    expect(screen.getByText('Am Marktplatz')).toBeInTheDocument();
  });

  it('renders the officer list for the lodge', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Meister, Karl')).toBeInTheDocument());
    expect(screen.getByText('Meister vom Stuhl')).toBeInTheDocument();
  });

  it('shows edit/delete controls when abilities.lodge allows them', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
  });

  it('hides edit/delete controls for a read-only council member', async () => {
    server.use(
      http.get('/api/v1/me', () =>
        HttpResponse.json({ user: { id: 2, email: 'c@d.de', firstname: 'A', lastname: 'B' }, abilities: { lodge: ['read'] } }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Zur Linde')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Bearbeiten' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument();
  });
});
