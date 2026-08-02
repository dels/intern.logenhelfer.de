import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import ExternalEventsListPage from './ExternalEventsListPage';
import { AuthProvider } from '../../auth/AuthProvider';
import '../../i18n';
import i18n from '../../i18n';

const externalEventRow = {
  uuid: 'e1',
  title: 'Sommerfest',
  host: 'Loge X',
  location: 'Musterstadt',
  date: '2026-09-01',
  time: '18:00',
};

const server = setupServer(
  http.get('/api/v1/me', () =>
    HttpResponse.json({ user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: { external_event: ['read', 'create', 'update', 'destroy'] } }),
  ),
  http.get('/api/v1/external_events', () => HttpResponse.json({ rows: [externalEventRow], row_count: 1 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/external-events']}>
          <Routes>
            <Route path="/external-events" element={<ExternalEventsListPage />} />
            <Route path="/external-events/new" element={<div>New external event page</div>} />
            <Route path="/external-events/:uuid" element={<div>External event detail page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('ExternalEventsListPage', () => {
  it('renders external events returned by the API', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Sommerfest')).toBeInTheDocument());
    expect(screen.getByText('Loge X')).toBeInTheDocument();
    expect(screen.getByText('Musterstadt')).toBeInTheDocument();
  });

  it('shows a create button for a member with the create ability', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('link', { name: /Neue/i })).toBeInTheDocument());
  });

  it('hides the create button for a plain member', async () => {
    server.use(http.get('/api/v1/me', () =>
      HttpResponse.json({ user: { id: 2, email: 'c@d.de', firstname: 'A', lastname: 'B' }, abilities: { external_event: ['read'] } }),
    ));
    renderPage();
    await waitFor(() => expect(screen.getByText('Sommerfest')).toBeInTheDocument());
    expect(screen.queryByRole('link', { name: /Neue/i })).not.toBeInTheDocument();
  });

  it('links each row to its external event detail page', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Sommerfest')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Sommerfest' })).toHaveAttribute('href', '/external-events/e1');
  });

  it('navigates to the detail page when clicking anywhere in the row', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Loge X')).toBeInTheDocument());
    await user.click(screen.getByText('Loge X'));
    await waitFor(() => expect(screen.getByText('External event detail page')).toBeInTheDocument());
  });

  it('shows an empty state when there are no external events', async () => {
    server.use(http.get('/api/v1/external_events', () => HttpResponse.json({ rows: [], row_count: 0 })));
    renderPage();
    await waitFor(() => expect(screen.getByText('Keine externen Termine vorhanden.')).toBeInTheDocument());
  });

  it('formats the date cell as a localized date instead of the raw YYYY-MM-DD string', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Sommerfest')).toBeInTheDocument());
    const expectedDate = new Date('2026-09-01T00:00:00').toLocaleString(i18n.language, { dateStyle: 'medium' });
    expect(screen.getByText(`${expectedDate} 18:00`)).toBeInTheDocument();
  });
});
