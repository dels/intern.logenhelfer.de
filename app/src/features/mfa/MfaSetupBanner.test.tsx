import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import MfaSetupBanner from './MfaSetupBanner';
import { ToastProvider } from '../../notifications/ToastProvider';
import '../../i18n';

const server = setupServer(
  http.get('/api/v1/mfa/status', () => HttpResponse.json({ methods: [], mode: 'optional', grace_period_ends_at: null })),
  http.get('/api/v1/health', () => HttpResponse.json({ demo: false })),
);
beforeAll(() => server.listen());
afterEach(() => { server.resetHandlers(); sessionStorage.clear(); });
afterAll(() => server.close());

function renderBanner() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter>
          <MfaSetupBanner />
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

// Real route table so a CTA click's navigate('/mfa/setup') can be asserted
// by what actually ends up on screen, matching LoginPage.test.tsx's pattern.
function renderBannerWithRoutes() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<MfaSetupBanner />} />
            <Route path="/mfa/setup" element={<div>mfa-setup-page</div>} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('MfaSetupBanner', () => {
  it('shows a dismissible CTA in optional mode', async () => {
    renderBanner();
    expect(await screen.findByText(/mfa|zwei-faktor/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/close/i)).toBeInTheDocument();
  });

  it('renders nothing once a method is enrolled', async () => {
    server.use(http.get('/api/v1/mfa/status', () => HttpResponse.json({ methods: ['totp'], mode: 'optional', grace_period_ends_at: null })));
    renderBanner();
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('shows a non-dismissible countdown banner during a mandatory grace period', async () => {
    const endsAt = new Date(Date.now() + 3 * 86_400_000).toISOString();
    server.use(http.get('/api/v1/mfa/status', () => HttpResponse.json({ methods: [], mode: 'mandatory', grace_period_ends_at: endsAt })));
    renderBanner();
    await screen.findByText(/3/);
    expect(screen.queryByLabelText(/close/i)).not.toBeInTheDocument();
  });

  // Deferred from Task 22's review: the `Math.max(0, ...)` clamp on
  // daysLeft is never exercised by the "3 days left" case above - a
  // grace_period_ends_at already in the past would render a negative number
  // without it. Proves the clamp is load-bearing, not dead code.
  it('clamps the countdown to 0 days when the grace period has already ended', async () => {
    const endsAt = new Date(Date.now() - 86_400_000).toISOString();
    server.use(http.get('/api/v1/mfa/status', () => HttpResponse.json({ methods: [], mode: 'mandatory', grace_period_ends_at: endsAt })));
    renderBanner();
    await screen.findByText(/0 Tage/);
    expect(screen.queryByText(/-\d/)).not.toBeInTheDocument();
  });

  it('shows the demo-restricted message on click in demo mode', async () => {
    server.use(http.get('/api/v1/health', () => HttpResponse.json({ demo: true })));
    renderBanner();
    await userEvent.click(await screen.findByRole('button', { name: /einrichten|set up/i }));
    expect(await screen.findByText(/demo/i)).toBeInTheDocument();
  });

  it('navigates to /mfa/setup when the CTA is clicked outside demo mode', async () => {
    renderBannerWithRoutes();
    await userEvent.click(await screen.findByRole('button', { name: /einrichten|set up/i }));
    expect(await screen.findByText('mfa-setup-page')).toBeInTheDocument();
  });

  it('hides the banner once dismissed and remembers the dismissal for the session', async () => {
    renderBanner();
    await userEvent.click(await screen.findByLabelText(/close/i));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(sessionStorage.getItem('mfa-setup-banner-dismissed')).toBe('true');
  });
});
