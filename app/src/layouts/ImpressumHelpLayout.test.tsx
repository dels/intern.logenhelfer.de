import { render, screen } from '@testing-library/react';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import ImpressumHelpLayout from './ImpressumHelpLayout';
import { AuthProvider } from '../auth/AuthProvider';
import { setAccessToken } from '../api/token';
import '../i18n';

const server = setupServer(
  http.get('/api/v1/public/landing', () => HttpResponse.json({ calendar_as_landing_page: false, lodge: 'Logenhelfer' })),
  http.get('/api/v1/announcements', () => HttpResponse.json({ rows: [], row_count: 0 })),
  http.get('/api/v1/categories', () => HttpResponse.json({ rows: [], row_count: 0 })),
  http.get('/api/v1/directories', () => HttpResponse.json({ rows: [], row_count: 0 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
// AuthProvider's cold-boot bootstrap effect (Task 4's sub-fix (a)) refreshes
// the session before ever calling /me when there's no access token in
// memory - this file has no /me mock at all (ImpressumHelpLayout doesn't
// depend on it) and no /session/refresh mock either. A pre-set token routes
// the mount straight to the (still unmocked, still failing) /me call,
// restoring the original direct-/me-call path instead of adding a second
// unmocked request in front of it. (Exact pre-fix failure timing was not
// individually diagnosed - this restores the code path, not a measured
// number.)
beforeEach(() => setAccessToken('test-token'));
afterEach(() => { server.resetHandlers(); setAccessToken(null); });
afterAll(() => server.close());

function renderImpressum() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/impressum']}>
          <Routes>
            <Route element={<ImpressumHelpLayout />}>
              <Route path="/impressum" element={<div>Impressum content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('ImpressumHelpLayout', () => {
  it('renders the page inside the public layout (Login link, no sidebar) when anonymous', async () => {
    server.use(http.get('/api/v1/me', () => new HttpResponse(null, { status: 401 })));
    renderImpressum();
    expect(await screen.findByText('Impressum content')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Anmelden' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Mitglieder' })).not.toBeInTheDocument();
  });

  it('renders the page inside the full authenticated app shell (sidebar intact, no Login link) when already logged in', async () => {
    server.use(http.get('/api/v1/me', () => HttpResponse.json({ user: { id: 1, gdpr_accepted: true }, abilities: {} })));
    renderImpressum();
    expect(await screen.findByText('Impressum content')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Anmelden' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Abmelden' })).toBeInTheDocument();
    // "Mitglieder" only ever appears in AppShell's sidebar - Breadcrumbs falls
    // back to a bare "Übersicht" link for a path with no SECTIONS entry, so
    // this is an unambiguous signal the real sidebar (not just a nav-bar tweak) mounted.
    expect(screen.getByRole('link', { name: 'Mitglieder' })).toBeInTheDocument();
  });
});
