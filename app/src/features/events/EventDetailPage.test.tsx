import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import EventDetailPage from './EventDetailPage';
import { AuthProvider } from '../../auth/AuthProvider';
import { BreadcrumbProvider } from '../../layouts/BreadcrumbContext';
import Breadcrumbs from '../../layouts/Breadcrumbs';
import i18n from '../../i18n';

// user id 1 (`self`) is the currently-authenticated member in every test's
// baseline `/api/v1/me` handler below - register/unregister tests match
// `p.uuid === user?.uuid` against this uuid.
let registerRequests: unknown[] = [];
let unregisterRequests: string[] = [];

const server = setupServer(
  http.get('/api/v1/me', () =>
    HttpResponse.json({
      user: { id: 1, uuid: 'self', email: 'a@b.de', firstname: 'Max', lastname: 'Muster', subscribed_to_announcements: false, gdpr_accepted: true },
      abilities: { event: ['read', 'create', 'update', 'destroy'] },
    }),
  ),
  http.get('/api/v1/events/e1', () =>
    HttpResponse.json({
      uuid: 'e1', title: 'Stiftungsfest', date: '2026-08-01', time: '19:00', whole_day: false,
      location: 'Festsaal', created_by_id: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
      participants: [{ uuid: 'u1', fullname: 'Max Mustermann' }],
    }),
  ),
  http.post('/api/v1/events/e1/participants', async ({ request }) => {
    registerRequests.push(await request.json());
    return HttpResponse.json({ user_uuid: 'self', fullname: 'Max Muster', festive_board: false }, { status: 201 });
  }),
  http.delete('/api/v1/events/e1/participants/self', () => {
    unregisterRequests.push('self');
    return new HttpResponse(null, { status: 204 });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  registerRequests = [];
  unregisterRequests = [];
});
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/events/e1']}>
          <BreadcrumbProvider>
            <Breadcrumbs />
            <Routes>
              <Route path="/events/:uuid" element={<EventDetailPage />} />
            </Routes>
          </BreadcrumbProvider>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('EventDetailPage', () => {
  it('renders the event and its participants', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());
    expect(screen.getByText('Max Mustermann')).toBeInTheDocument();
  });

  it('shows the edit/delete controls when the user can manage events', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
  });

  it('hides the edit/delete controls for a plain member', async () => {
    server.use(
      http.get('/api/v1/me', () =>
        HttpResponse.json({
          user: { id: 2, uuid: 'other-member', email: 'c@d.de', firstname: 'A', lastname: 'B', subscribed_to_announcements: false, gdpr_accepted: true },
          abilities: { event: ['read'] },
        }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Bearbeiten' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument();
  });

  it('registers on click (calling POST), then flips to Abmelden and unregisters on click (calling DELETE)', async () => {
    let registered = false;
    server.use(
      http.get('/api/v1/events/e1', () =>
        HttpResponse.json({
          uuid: 'e1', title: 'Stiftungsfest', date: '2026-08-01', time: '19:00', whole_day: false,
          location: 'Festsaal', created_by_id: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
          participants: registered ? [{ uuid: 'self', fullname: 'Max Muster' }] : [{ uuid: 'u1', fullname: 'Max Mustermann' }],
        }),
      ),
      http.post('/api/v1/events/e1/participants', async ({ request }) => {
        registerRequests.push(await request.json());
        registered = true;
        return HttpResponse.json({ user_uuid: 'self', fullname: 'Max Muster', festive_board: false }, { status: 201 });
      }),
      http.delete('/api/v1/events/e1/participants/self', () => {
        unregisterRequests.push('self');
        registered = false;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const user = userEvent.setup();
    renderPage();

    const registerButton = await screen.findByRole('button', { name: /^Anmelden$/i });
    await user.click(registerButton);
    await waitFor(() => expect(registerRequests).toHaveLength(1));

    const unregisterButton = await screen.findByRole('button', { name: /Abmelden/i });
    expect(screen.queryByRole('button', { name: /^Anmelden$/i })).not.toBeInTheDocument();
    await user.click(unregisterButton);
    await waitFor(() => expect(unregisterRequests).toHaveLength(1));

    await screen.findByRole('button', { name: /^Anmelden$/i });
  });

  it('shows Abmelden (not Anmelden) when the current user is already registered', async () => {
    server.use(
      http.get('/api/v1/events/e1', () =>
        HttpResponse.json({
          uuid: 'e1', title: 'Stiftungsfest', date: '2026-08-01', time: '19:00', whole_day: false,
          location: 'Festsaal', created_by_id: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
          participants: [{ uuid: 'self', fullname: 'Max Muster' }],
        }),
      ),
    );
    renderPage();

    await screen.findByRole('button', { name: /Abmelden/i });
    expect(screen.queryByRole('button', { name: /^Anmelden$/i })).not.toBeInTheDocument();
  });

  it('shows Anmelden (not Abmelden) when a different participant is registered but the current user is not', async () => {
    renderPage();

    await screen.findByRole('button', { name: /^Anmelden$/i });
    expect(screen.queryByRole('button', { name: /Abmelden/i })).not.toBeInTheDocument();
  });

  it('formats the event date as a localized date instead of the raw YYYY-MM-DD string', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());
    const expectedDate = new Date('2026-08-01T00:00:00').toLocaleString(i18n.language, { dateStyle: 'medium' });
    expect(screen.getByText(`${expectedDate} 19:00`)).toBeInTheDocument();
  });

  it('shows an error alert when registering fails', async () => {
    server.use(
      http.post('/api/v1/events/e1/participants', () => HttpResponse.json({ error: 'unprocessable' }, { status: 422 })),
    );
    const user = userEvent.setup();
    renderPage();

    const registerButton = await screen.findByRole('button', { name: /^Anmelden$/i });
    await user.click(registerButton);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('shows an error alert when unregistering fails', async () => {
    server.use(
      http.get('/api/v1/events/e1', () =>
        HttpResponse.json({
          uuid: 'e1', title: 'Stiftungsfest', date: '2026-08-01', time: '19:00', whole_day: false,
          location: 'Festsaal', created_by_id: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
          participants: [{ uuid: 'self', fullname: 'Max Muster' }],
        }),
      ),
      http.delete('/api/v1/events/e1/participants/self', () => HttpResponse.json({ error: 'unprocessable' }, { status: 422 })),
    );
    const user = userEvent.setup();
    renderPage();

    const unregisterButton = await screen.findByRole('button', { name: /Abmelden/i });
    await user.click(unregisterButton);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('registers the correct breadcrumb trail', async () => {
    renderPage();
    const breadcrumbNav = await screen.findByLabelText('breadcrumb');
    const breadcrumbLinks = within(breadcrumbNav);
    await waitFor(() => expect(breadcrumbLinks.getByText('Stiftungsfest')).toBeInTheDocument());
    expect(breadcrumbLinks.getByRole('link', { name: 'Arbeitsplan' })).toHaveAttribute('href', '/events');
    expect(breadcrumbLinks.queryByText('Übersicht')).not.toBeInTheDocument();
  });
});
