import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import UserStatsPage from './UserStatsPage';
import { AuthProvider } from '../../auth/AuthProvider';
import { setAccessToken } from '../../api/token';
import '../../i18n';

const server = setupServer(
  http.get('/api/v1/me', () => HttpResponse.json({ user: { id: 1 }, abilities: { user: ['destroy'], statistic: ['user_stats'] } })),
  http.get('/api/v1/statistics/user_stats', () =>
    HttpResponse.json({
      avg_age: 42,
      rows: [{ uuid: 'u-1', matriculation_number: 7, lastname: 'Muster', firstname: 'Max', sign_in_count: 3, current_sign_in_at: '2026-07-01T00:00:00.000Z', current_sign_in_ip: '127.0.0.1' }],
      row_count: 1,
    }),
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
        <MemoryRouter initialEntries={['/statistics/user-stats']}>
          <UserStatsPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('UserStatsPage', () => {
  it('renders the average age and the login-activity row', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Muster')).toBeInTheDocument());
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  it('shows a skeleton for avg_age instead of a bare dash while loading (regression)', async () => {
    server.use(http.get('/api/v1/statistics/user_stats', () => new Promise(() => {})));
    const { container } = renderPage();
    await waitFor(() => expect(container.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0));
    expect(screen.queryByText('-', { exact: true })).not.toBeInTheDocument();
  });

  it('mounts the persistent statistics tab bar with the Mitglieder tab active', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Muster')).toBeInTheDocument());

    const membersTab = screen.getByRole('tab', { name: 'Mitglieder' });
    expect(membersTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('link', { name: 'Anmeldeaktivität' })).toBeInTheDocument();
  });

  it('shows the sign-in IP column when the viewer has User destroy ability', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Muster')).toBeInTheDocument());
    expect(screen.getByText('127.0.0.1')).toBeInTheDocument();
  });

  it('requests the default sort (newest sign-in first) on first load', async () => {
    let lastSort: string | null = null;
    server.use(
      http.get('/api/v1/statistics/user_stats', ({ request }) => {
        lastSort = new URL(request.url).searchParams.get('sort');
        return HttpResponse.json({ avg_age: 42, rows: [], row_count: 0 });
      }),
    );
    renderPage();
    await waitFor(() => expect(lastSort).toBe('-current_sign_in_at'));
  });

  it('re-requests with the reversed sort param when the Anmeldungen column header is clicked', async () => {
    let lastSort: string | null = null;
    server.use(
      http.get('/api/v1/statistics/user_stats', ({ request }) => {
        lastSort = new URL(request.url).searchParams.get('sort');
        return HttpResponse.json({
          avg_age: 42,
          rows: [{ uuid: 'u-1', matriculation_number: 7, lastname: 'Muster', firstname: 'Max', sign_in_count: 3, current_sign_in_at: '2026-07-01T00:00:00.000Z', current_sign_in_ip: '127.0.0.1' }],
          row_count: 1,
        });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Muster')).toBeInTheDocument());

    await user.click(screen.getByRole('columnheader', { name: /^Anmeldungen/ }));
    await waitFor(() => expect(lastSort).toBe('sign_in_count'));

    await user.click(screen.getByRole('columnheader', { name: /^Anmeldungen/ }));
    await waitFor(() => expect(lastSort).toBe('-sign_in_count'));
  });

  it('re-requests with the reversed sort param when the IP-Adresse column header is clicked (viewer has User destroy ability)', async () => {
    let lastSort: string | null = null;
    server.use(
      http.get('/api/v1/statistics/user_stats', ({ request }) => {
        lastSort = new URL(request.url).searchParams.get('sort');
        return HttpResponse.json({
          avg_age: 42,
          rows: [{ uuid: 'u-1', matriculation_number: 7, lastname: 'Muster', firstname: 'Max', sign_in_count: 3, current_sign_in_at: '2026-07-01T00:00:00.000Z', current_sign_in_ip: '127.0.0.1' }],
          row_count: 1,
        });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Muster')).toBeInTheDocument());

    await user.click(screen.getByRole('columnheader', { name: /^IP-Adresse/ }));
    await waitFor(() => expect(lastSort).toBe('current_sign_in_ip'));
  });

  it('does not render (and so cannot sort by) the IP column for a viewer without User destroy ability', async () => {
    server.use(http.get('/api/v1/me', () => HttpResponse.json({ user: { id: 1 }, abilities: { user: [], statistic: ['user_stats'] } })));
    renderPage();
    await waitFor(() => expect(screen.getByText('Muster')).toBeInTheDocument());
    expect(screen.queryByRole('columnheader', { name: /^IP-Adresse/ })).not.toBeInTheDocument();
    expect(screen.queryByText('127.0.0.1')).not.toBeInTheDocument();
  });

  it('shows a forbidden message instead of the table when the viewer lacks the user_stats ability', async () => {
    server.use(http.get('/api/v1/me', () => HttpResponse.json({ user: { id: 1 }, abilities: {} })));
    renderPage();
    await waitFor(() => expect(screen.getByText('Sie haben keine Berechtigung, diese Statistik einzusehen.')).toBeInTheDocument());
    expect(screen.queryByText('Muster')).not.toBeInTheDocument();
  });
});
