import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TopNav from './TopNav';
import { AuthProvider } from '../auth/AuthProvider';
import '../i18n';

const server = setupServer(
  http.get('/api/v1/me', () => new HttpResponse(null, { status: 401 })),
  http.get('/api/v1/public/landing', () => HttpResponse.json({ calendar_as_landing_page: false, lodge: 'Zur Morgenröte' })),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderTopNav(variant: 'authenticated' | 'public', onMenuClick?: () => void) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter>
          <TopNav variant={variant} onMenuClick={onMenuClick} />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('TopNav', () => {
  it('public variant shows Kalender, Impressum, Hilfe, Anmelden and no burger button', async () => {
    renderTopNav('public');
    expect(await screen.findByRole('link', { name: 'Öffentlicher Terminplan' })).toHaveAttribute('href', '/calendar');
    expect(screen.getByRole('link', { name: 'Impressum' })).toHaveAttribute('href', '/impressum');
    expect(screen.getByRole('link', { name: 'Hilfe' })).toHaveAttribute('href', '/help');
    expect(screen.getByRole('link', { name: 'Anmelden' })).toHaveAttribute('href', '/login');
    expect(screen.queryByRole('button', { name: 'Menü öffnen' })).not.toBeInTheDocument();
  });

  it('authenticated variant shows Impressum, Hilfe, Mein Konto, Abmelden and no Kalender/Anmelden', async () => {
    renderTopNav('authenticated');
    expect(await screen.findByRole('link', { name: 'Impressum' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Hilfe' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mein Konto' })).toHaveAttribute('href', '/account');
    expect(screen.getByRole('button', { name: 'Abmelden' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Anmelden' })).not.toBeInTheDocument();
  });

  it('shows a burger button only when onMenuClick is provided, and calls it on click', async () => {
    const onMenuClick = vi.fn();
    renderTopNav('authenticated', onMenuClick);
    const burger = await screen.findByRole('button', { name: 'Menü öffnen' });
    await userEvent.click(burger);
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('shows the configured lodge name instead of the literal "Logenhelfer"', async () => {
    renderTopNav('public');
    expect(await screen.findByText('Zur Morgenröte')).toBeInTheDocument();
    expect(screen.queryByText('Logenhelfer')).not.toBeInTheDocument();
  });

  it('falls back to "Logenhelfer" while the lodge name has not loaded yet', () => {
    server.use(http.get('/api/v1/public/landing', () => new Promise(() => {})));
    renderTopNav('public');
    expect(screen.getByText('Logenhelfer')).toBeInTheDocument();
  });

  it('falls back to "Logenhelfer" when the config request fails', async () => {
    server.use(http.get('/api/v1/public/landing', () => new HttpResponse(null, { status: 500 })));
    renderTopNav('public');
    expect(await screen.findByText('Logenhelfer')).toBeInTheDocument();
  });

  it('renders the custom logo when one is configured', async () => {
    server.use(
      http.get('/api/v1/public/landing', () =>
        HttpResponse.json({ calendar_as_landing_page: false, lodge: 'Zur Morgenröte', logo_version: 99 }),
      ),
    );
    const { container } = renderTopNav('public');
    await waitFor(() =>
      expect(container.querySelector('img')).toHaveAttribute('src', '/api/v1/public/logo?v=99'),
    );
  });
});
