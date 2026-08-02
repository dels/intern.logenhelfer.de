import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import DashboardPage from './DashboardPage';
import { AuthProvider } from '../auth/AuthProvider';
import '../i18n';

function meFixture(overrides: Partial<Record<string, unknown>> = {}, abilities: Record<string, string[]> = { announcement: ['read'] }) {
  return {
    user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster', subscribed_to_announcements: false, gdpr_accepted: true, ...overrides },
    abilities,
  };
}

const server = setupServer(
  http.get('/api/v1/me', () => HttpResponse.json(meFixture())),
  http.get('/api/v1/announcements', () =>
    HttpResponse.json({
      rows: [{ uuid: 'ann-1', title: 'Willkommen', created_at: '2026-07-01T00:00:00.000Z' }],
      row_count: 1,
    }),
  ),
  http.get('/api/v1/members', () => HttpResponse.json({ rows: [], row_count: 48 })),
  http.get('/api/v1/events', () => HttpResponse.json({ rows: [], row_count: 0 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter>
          <DashboardPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('DashboardPage', () => {
  it('always renders the heading', async () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Übersicht' })).toBeInTheDocument();
  });

  it('renders a welcome message with the current user\'s name', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Willkommen Br. Max Muster')).toBeInTheDocument());
  });

  it('renders the recent announcements list unconditionally - GDPR gating is now AppShell.tsx\'s responsibility, not DashboardPage\'s (see components/GdprGate.test.tsx and layouts/AppShell.test.tsx\'s "AppShell gdpr gate" cases)', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Willkommen')).toBeInTheDocument());
  });

  it('shows a skeleton on the members stat card while loading, not a bogus "0"', async () => {
    server.use(http.get('/api/v1/members', () => new Promise(() => {})));
    const { container } = renderPage();
    await screen.findByText('Mitglieder');
    expect(container.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders the members stat card with the count from GET /api/v1/members', async () => {
    server.use(http.get('/api/v1/members', () => HttpResponse.json({ rows: [], row_count: 48 })));
    renderPage();
    await waitFor(() => expect(screen.getByText('48')).toBeInTheDocument());
    expect(screen.getByText('Mitglieder')).toBeInTheDocument();
  });

  it('renders an explicit "see all members" link on the stat card, linking to the members page', async () => {
    server.use(http.get('/api/v1/members', () => HttpResponse.json({ rows: [], row_count: 48 })));
    renderPage();
    await waitFor(() => expect(screen.getByText('48')).toBeInTheDocument());
    const link = screen.getByRole('link', { name: 'Alle Mitglieder ansehen →' });
    expect(link).toHaveAttribute('href', '/members');
  });

  it('does not wrap the whole members stat card in a link (regression: invisible whole-card link)', async () => {
    server.use(http.get('/api/v1/members', () => HttpResponse.json({ rows: [], row_count: 48 })));
    renderPage();
    await waitFor(() => expect(screen.getByText('48')).toBeInTheDocument());
    // Exactly one link should exist for the members card - the explicit one.
    // If the whole-card wrapper were still present too, this would find two
    // matches and getByRole would throw.
    expect(screen.getByRole('link', { name: /Mitglieder/ })).toBeInTheDocument();
  });

  it('renders the "Nächste Termine" list from GET /api/v1/events', async () => {
    server.use(
      http.get('/api/v1/events', () =>
        HttpResponse.json({
          rows: [
            {
              uuid: 'ev-1', title: 'Tempelarbeit im I. Grad', date: '2026-07-09', time: '19:30',
              whole_day: false, location: 'Logenhaus, Große Str. 12',
            },
          ],
          row_count: 12,
        }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('09.07.2026 · Tempelarbeit im I. Grad')).toBeInTheDocument());
    expect(screen.getByText('19:30 · Logenhaus, Große Str. 12')).toBeInTheDocument();
  });

  it('renders "Ganztägig" instead of a time for a whole-day event', async () => {
    server.use(
      http.get('/api/v1/events', () =>
        HttpResponse.json({
          rows: [
            {
              uuid: 'ev-2', title: 'Lodge-Ausflug', date: '2026-07-11', time: null,
              whole_day: true, location: 'Waldhaus',
            },
          ],
          row_count: 1,
        }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Ganztägig · Waldhaus')).toBeInTheDocument());
  });

  it('renders the "no upcoming events" text when there are zero upcoming events', async () => {
    server.use(http.get('/api/v1/events', () => HttpResponse.json({ rows: [], row_count: 0 })));
    renderPage();
    await waitFor(() => expect(screen.getByText('Keine anstehenden Termine.')).toBeInTheDocument());
  });

  it('shows a skeleton on the seekers stat card while loading, not a bogus "0"', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json(meFixture({}, { announcement: ['read'], seeker: ['read'] }))),
      http.get('/api/v1/seekers', () => new Promise(() => {})),
    );
    const { container } = renderPage();
    await screen.findByText('Suchende');
    expect(container.querySelectorAll('.MuiSkeleton-root').length).toBeGreaterThan(0);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('renders the seekers stat card when the user has the seeker read ability, linking to the full list', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json(meFixture({}, { announcement: ['read'], seeker: ['read'] }))),
      http.get('/api/v1/seekers', () => HttpResponse.json({ rows: [], row_count: 3 })),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('3')).toBeInTheDocument());
    expect(screen.getByText('Suchende')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Alle Suchende ansehen →' });
    expect(link).toHaveAttribute('href', '/seekers');
  });

  it('does not render the seekers stat card when the user lacks the seeker read/names_list ability', async () => {
    server.use(http.get('/api/v1/me', () => HttpResponse.json(meFixture({}, { announcement: ['read'] }))));
    renderPage();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Übersicht' })).toBeInTheDocument());
    expect(screen.queryByText('Suchende')).not.toBeInTheDocument();
  });

  it('renders the seekers stat card via the names-only endpoint when the user only has names_list, linking to the names page', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json(meFixture({}, { announcement: ['read'], seeker: ['names_list'] }))),
      http.get('/api/v1/seekers/names', () => HttpResponse.json({ rows: [], row_count: 5 })),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('5')).toBeInTheDocument());
    expect(screen.getByText('Suchende')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Alle Suchende ansehen →' });
    expect(link).toHaveAttribute('href', '/seekers/names');
  });

  it('renders the storage usage banner when the user has the attached_file manage ability (admins/file admins)', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json(meFixture({}, { announcement: ['read'], attached_file: ['manage'] }))),
      http.get('/api/v1/statistics/mem_stats', () =>
        HttpResponse.json({
          user_count: 48,
          event_count: 12,
          memory_used_bytes: 124 * 1024 * 1024,
          memory_used_incl_archived_bytes: 130 * 1024 * 1024,
          max_db_mem_size_bytes: 200 * 1024 * 1024,
        }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('62% belegt (124.0 MB von 200.0 MB).')).toBeInTheDocument());
  });

  it('does not render the storage usage banner when the user lacks the attached_file manage ability', async () => {
    server.use(http.get('/api/v1/me', () => HttpResponse.json(meFixture({}, { announcement: ['read'] }))));
    renderPage();
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Übersicht' })).toBeInTheDocument());
    expect(screen.queryByText(/belegt/)).not.toBeInTheDocument();
  });

  it('renders the four boxes in the order Announcements, Events, Members, Seekers', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json(meFixture({}, { announcement: ['read'], seeker: ['read'] }))),
      http.get('/api/v1/seekers', () => HttpResponse.json({ rows: [], row_count: 3 })),
    );
    const { container } = renderPage();
    await waitFor(() => expect(screen.getByText('Mitglieder')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('Suchende')).toBeInTheDocument());
    const text = container.textContent ?? '';
    const iAnnouncements = text.indexOf('Neuste Ankündigungen');
    const iEvents = text.indexOf('Nächste Termine');
    const iMembers = text.indexOf('Mitglieder');
    const iSeekers = text.indexOf('Suchende');
    expect(iAnnouncements).toBeGreaterThan(-1);
    expect(iEvents).toBeGreaterThan(iAnnouncements);
    expect(iMembers).toBeGreaterThan(iEvents);
    expect(iSeekers).toBeGreaterThan(iMembers);
  });
});
