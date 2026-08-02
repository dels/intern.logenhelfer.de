import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import AnnouncementDetailPage from './AnnouncementDetailPage';
import { AuthProvider } from '../../auth/AuthProvider';
import { BreadcrumbProvider } from '../../layouts/BreadcrumbContext';
import Breadcrumbs from '../../layouts/Breadcrumbs';
import '../../i18n';

function announcementFixture(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    uuid: 'ann-1',
    title: 'Willkommen',
    message_body: 'Hallo zusammen',
    created_by_name: 'Max Muster',
    updated_by_name: null,
    created_at: '2026-07-01T00:00:00.000Z',
    updated_at: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

const server = setupServer(
  http.get('/api/v1/me', () =>
    HttpResponse.json({
      user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster', subscribed_to_announcements: false },
      abilities: { announcement: ['read', 'create', 'update', 'destroy'] },
    }),
  ),
  http.get('/api/v1/announcements/ann-1', () => HttpResponse.json(announcementFixture())),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/announcements/ann-1']}>
          <BreadcrumbProvider>
            <Breadcrumbs />
            <Routes>
              <Route path="/announcements/:uuid" element={<AnnouncementDetailPage />} />
            </Routes>
          </BreadcrumbProvider>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('AnnouncementDetailPage', () => {
  it('renders the title and message body', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Willkommen')).toBeInTheDocument());
    expect(screen.getByText('Hallo zusammen')).toBeInTheDocument();
  });

  it('renders the author and a localized creation date, with no "updated by" line when never updated', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText(/Erstellt von Max Muster am/)).toBeInTheDocument());
    expect(screen.queryByText(/Zuletzt bearbeitet von/)).not.toBeInTheDocument();
  });

  it('renders an "updated by" line when the announcement has been edited', async () => {
    server.use(
      http.get('/api/v1/announcements/ann-1', () =>
        HttpResponse.json(announcementFixture({ updated_by_name: 'Erika Musterfrau', updated_at: '2026-07-02T00:00:00.000Z' })),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText(/Zuletzt bearbeitet von Erika Musterfrau am/)).toBeInTheDocument());
  });

  it('shows edit/delete controls when abilities.announcement allows them', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
  });

  it('hides edit/delete controls for a read-only member', async () => {
    server.use(
      http.get('/api/v1/me', () =>
        HttpResponse.json({
          user: { id: 2, email: 'c@d.de', firstname: 'A', lastname: 'B', subscribed_to_announcements: false },
          abilities: { announcement: ['read'] },
        }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Willkommen')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Bearbeiten' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument();
  });

  it('registers the correct breadcrumb trail', async () => {
    renderPage();
    const breadcrumbNav = await screen.findByLabelText('breadcrumb');
    const breadcrumbLinks = within(breadcrumbNav);
    await waitFor(() => expect(breadcrumbLinks.getByText('Willkommen')).toBeInTheDocument());
    expect(breadcrumbLinks.getByRole('link', { name: 'Aktuelles' })).toHaveAttribute('href', '/announcements');
    expect(breadcrumbLinks.queryByText('Übersicht')).not.toBeInTheDocument();
  });
});
