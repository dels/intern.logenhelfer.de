import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import DemoBanner, { DEMO_BANNER_HEIGHT_PX } from './DemoBanner';
import '../i18n';

function bannerHeightCssVar() {
  return document.documentElement.style.getPropertyValue('--demo-banner-height');
}

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderBanner() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <DemoBanner />
    </QueryClientProvider>,
  );
}

describe('DemoBanner', () => {
  it('renders nothing when not in demo mode', async () => {
    server.use(http.get('/api/v1/health', () => HttpResponse.json({ status: 'ok', revision: null, demo: false })));
    renderBanner();

    await waitFor(() => expect(screen.queryByText(/Demo-Umgebung/)).not.toBeInTheDocument());
    expect(bannerHeightCssVar()).toBe('');
  });

  it('renders the banner and opens the account panel with every fetched account on click', async () => {
    server.use(
      http.get('/api/v1/health', () => HttpResponse.json({ status: 'ok', revision: null, demo: true })),
      http.get('/api/v1/public/demo-accounts', () =>
        HttpResponse.json({ accounts: [{ email: 'admin@logenhelfer.de', role: 'Admin' }, { email: 'lehrling@logenhelfer.de', role: 'EnteredApprentice' }] }),
      ),
    );
    renderBanner();

    await screen.findByText(/Demo-Umgebung/);
    expect(bannerHeightCssVar()).toBe(`${DEMO_BANNER_HEIGHT_PX}px`);

    await userEvent.click(screen.getByLabelText('Informationen zur Demo-Umgebung'));

    expect(await screen.findByText('admin@logenhelfer.de')).toBeInTheDocument();
    expect(await screen.findByText('lehrling@logenhelfer.de')).toBeInTheDocument();
  });

  it('sets --demo-banner-height on document.documentElement while mounted in demo mode, and clears it on unmount', async () => {
    server.use(http.get('/api/v1/health', () => HttpResponse.json({ status: 'ok', revision: null, demo: true })));
    const { unmount } = renderBanner();

    await screen.findByText(/Demo-Umgebung/);
    expect(bannerHeightCssVar()).toBe(`${DEMO_BANNER_HEIGHT_PX}px`);

    unmount();

    expect(bannerHeightCssVar()).toBe('');
  });

  it('clears --demo-banner-height when demo mode flips from true to false', async () => {
    server.use(http.get('/api/v1/health', () => HttpResponse.json({ status: 'ok', revision: null, demo: true })));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <DemoBanner />
      </QueryClientProvider>,
    );

    await screen.findByText(/Demo-Umgebung/);
    expect(bannerHeightCssVar()).toBe(`${DEMO_BANNER_HEIGHT_PX}px`);

    server.use(http.get('/api/v1/health', () => HttpResponse.json({ status: 'ok', revision: null, demo: false })));
    await client.refetchQueries({ queryKey: ['health'] });

    await waitFor(() => expect(screen.queryByText(/Demo-Umgebung/)).not.toBeInTheDocument());
    expect(bannerHeightCssVar()).toBe('');
  });
});
