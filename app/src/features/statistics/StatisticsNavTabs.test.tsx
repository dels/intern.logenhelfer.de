import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, useLocation } from 'react-router';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import StatisticsNavTabs from './StatisticsNavTabs';
import { AuthProvider, useAuth } from '../../auth/AuthProvider';
import '../../i18n';

function meFixture(statistic: string[]) {
  return { user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: { statistic } };
}

const server = setupServer(
  http.get('/api/v1/me', () =>
    HttpResponse.json(meFixture(['index', 'user_stats', 'downloads', 'file_stats', 'user_file_stats', 'mem_stats'])),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function mockAbilities(statistic: string[]) {
  server.use(http.get('/api/v1/me', () => HttpResponse.json(meFixture(statistic))));
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="current-path">{location.pathname}</div>;
}

function AuthStatusProbe() {
  const { status } = useAuth();
  return <div data-testid="auth-status">{status}</div>;
}

function renderNavTabs(initialPath: string) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <LocationProbe />
          <AuthStatusProbe />
          <StatisticsNavTabs />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('StatisticsNavTabs', () => {
  it('renders a Meta tab containing the Speichernutzung link when mem_stats is granted', async () => {
    const user = userEvent.setup();
    renderNavTabs('/statistics');

    expect(await screen.findByRole('tab', { name: 'Mitglieder' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Dateien' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Meta' })).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: 'Meta' }));

    expect(await screen.findByRole('link', { name: 'Speichernutzung' })).toBeInTheDocument();
  });

  it('no longer lists Speichernutzung under the Mitglieder tab', async () => {
    renderNavTabs('/statistics');

    await screen.findByRole('tab', { name: 'Mitglieder' });
    expect(screen.getByRole('link', { name: 'Anmeldeaktivität' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Speichernutzung' })).not.toBeInTheDocument();
  });

  it('defaults the active tab to the category owning the current route', async () => {
    renderNavTabs('/statistics/downloads');

    const filesTab = await screen.findByRole('tab', { name: 'Dateien' });
    expect(filesTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('link', { name: 'Downloads' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Downloads pro Datei' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Anmeldeaktivität' })).not.toBeInTheDocument();
  });

  it('defaults to the Meta tab when landing directly on the mem-stats route', async () => {
    renderNavTabs('/statistics/mem-stats');

    const metaTab = await screen.findByRole('tab', { name: 'Meta' });
    expect(metaTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('link', { name: 'Speichernutzung' })).toBeInTheDocument();
  });

  it('switches the visible links when clicking a different tab, without navigating away from the current report', async () => {
    const user = userEvent.setup();
    renderNavTabs('/statistics/mem-stats');

    await screen.findByRole('link', { name: 'Speichernutzung' });
    expect(screen.getByTestId('current-path')).toHaveTextContent('/statistics/mem-stats');

    await user.click(screen.getByRole('tab', { name: 'Mitglieder' }));

    expect(await screen.findByRole('link', { name: 'Anmeldeaktivität' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Downloads pro Mitglied' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Speichernutzung' })).not.toBeInTheDocument();
    // Clicking a tab only changes which category's links are shown - it
    // must not navigate away from the report page the user is currently
    // on, which is the whole point of this component: the bar stays put.
    expect(screen.getByTestId('current-path')).toHaveTextContent('/statistics/mem-stats');
  });

  it('does not render a tab whose category has no granted pages', async () => {
    mockAbilities(['index', 'downloads', 'file_stats']);
    renderNavTabs('/statistics');

    await screen.findByRole('tab', { name: 'Dateien' });
    expect(screen.queryByRole('tab', { name: 'Mitglieder' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Meta' })).not.toBeInTheDocument();
  });

  it('renders nothing when the caller has no statistic abilities at all', async () => {
    mockAbilities([]);
    renderNavTabs('/statistics');

    await screen.findByText('authenticated');
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
  });
});
