import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import AnnouncementsListPage from './AnnouncementsListPage';
import { AuthProvider } from '../../auth/AuthProvider';
import '../../i18n';

function meFixture(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster', subscribed_to_announcements: false, ...overrides },
    abilities: { announcement: ['read', 'create', 'update', 'destroy'] },
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
  http.patch('/api/v1/me/announcement_subscription', () => HttpResponse.json(meFixture({ subscribed_to_announcements: true }))),
  http.delete('/api/v1/announcements/ann-1', () => new HttpResponse(null, { status: 204 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/announcements']}>
          <Routes>
            <Route path="/announcements" element={<AnnouncementsListPage />} />
            <Route path="/announcements/:uuid/edit" element={<div>Edit announcement page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('AnnouncementsListPage', () => {
  it('renders announcements returned by the API', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Willkommen')).toBeInTheDocument());
  });

  it('requests the default sort (newest first) on first load', async () => {
    let lastSort: string | null = null;
    server.use(
      http.get('/api/v1/announcements', ({ request }) => {
        lastSort = new URL(request.url).searchParams.get('sort');
        return HttpResponse.json({ rows: [{ uuid: 'ann-1', title: 'Willkommen', created_at: '2026-07-01T00:00:00.000Z' }], row_count: 1 });
      }),
    );
    renderPage();
    await waitFor(() => expect(lastSort).toBe('-created_at'));
  });

  it('re-requests with the reversed sort param when the Titel column header is clicked', async () => {
    let lastSort: string | null = null;
    server.use(
      http.get('/api/v1/announcements', ({ request }) => {
        lastSort = new URL(request.url).searchParams.get('sort');
        return HttpResponse.json({ rows: [{ uuid: 'ann-1', title: 'Willkommen', created_at: '2026-07-01T00:00:00.000Z' }], row_count: 1 });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Willkommen')).toBeInTheDocument());

    await user.click(screen.getByRole('columnheader', { name: /^Titel/ }));
    await waitFor(() => expect(lastSort).toBe('title'));

    await user.click(screen.getByRole('columnheader', { name: /^Titel/ }));
    await waitFor(() => expect(lastSort).toBe('-title'));
  });

  it('renders a localized date, not the raw ISO timestamp, for created_at', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Willkommen')).toBeInTheDocument());
    expect(screen.queryByText('2026-07-01T00:00:00.000Z')).not.toBeInTheDocument();
    expect(screen.getByText(/2026/)).toBeInTheDocument();
  });

  it('toggling the subscribe switch updates the checked state', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Willkommen')).toBeInTheDocument());

    const toggle = screen.getByRole('switch', { name: 'Per E-Mail benachrichtigen bei neuen Ankündigungen' });
    expect(toggle).not.toBeChecked();

    await userEvent.click(toggle);

    await waitFor(() => expect(toggle).toBeChecked());
  });

  it('shows row-level edit/delete actions when abilities.announcement allows them', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
  });

  it('hides row-level actions for a read-only member', async () => {
    server.use(http.get('/api/v1/me', () => HttpResponse.json({ user: { id: 2, email: 'c@d.de', firstname: 'A', lastname: 'B' }, abilities: { announcement: ['read'] } })));
    renderPage();
    await waitFor(() => expect(screen.getByText('Willkommen')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Bearbeiten' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument();
  });

  it('navigates to the edit page without navigating to the detail page', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    await waitFor(() => expect(screen.getByText('Edit announcement page')).toBeInTheDocument());
  });

  it('deletes the announcement after a second confirming click', async () => {
    let deleteCalled = false;
    server.use(http.delete('/api/v1/announcements/ann-1', () => { deleteCalled = true; return new HttpResponse(null, { status: 204 }); }));
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Löschen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Wirklich löschen?' }));
    await waitFor(() => expect(deleteCalled).toBe(true));
  });
});
