import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import ExternalEventDetailPage from './ExternalEventDetailPage';
import { AuthProvider } from '../../auth/AuthProvider';
import type { ExternalEventParticipant, ExternalEventWithParticipants, MeUser } from '../../api/types';
import i18n from '../../i18n';

function meFixture(overrides: Partial<MeUser> = {}): MeUser {
  return {
    id: 1,
    uuid: 'self',
    email: 'a@b.de',
    firstname: 'Max',
    lastname: 'Mitglied',
    subscribed_to_announcements: false,
    gdpr_accepted: true,
    ...overrides,
  };
}

function participantFixture(overrides: Partial<ExternalEventParticipant> = {}): ExternalEventParticipant {
  return {
    user_uuid: 'other',
    fullname: 'Erika Mustermann',
    festive_board: false,
    subscription_confirmed: false,
    ...overrides,
  };
}

function eventFixture(overrides: Partial<ExternalEventWithParticipants> = {}): ExternalEventWithParticipants {
  return {
    uuid: 'e1',
    title: 'Sommerfest',
    host: 'Loge X',
    location: 'Musterstadt',
    description: null,
    date: '2026-09-01',
    time: '18:00',
    ics_source_id: null,
    ics_source_uuid: null,
    created_by_id: 1,
    updated_by_id: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    participants: [],
    ...overrides,
  };
}

let registerRequests: unknown[] = [];

const server = setupServer(
  http.get('/api/v1/me', () => HttpResponse.json({ user: meFixture(), abilities: { external_event: [] } })),
  http.get('/api/v1/external_events/e1', () => HttpResponse.json(eventFixture())),
  http.post('/api/v1/external_events/e1/participants', async ({ request }) => {
    registerRequests.push(await request.json());
    return HttpResponse.json(participantFixture({ user_uuid: 'self' }), { status: 201 });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  registerRequests = [];
});
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/external-events/e1']}>
          <Routes>
            <Route path="/external-events/:uuid" element={<ExternalEventDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('ExternalEventDetailPage', () => {
  it('shows an Anmelden button for a member not yet registered, and registers on click', async () => {
    const user = userEvent.setup();
    renderPage();

    const registerButton = await screen.findByRole('button', { name: /^Anmelden$/i });
    await user.click(registerButton);
    await waitFor(() => expect(registerRequests).toHaveLength(1));
  });

  it('shows Abmelden instead, for a member already registered', async () => {
    server.use(
      http.get('/api/v1/external_events/e1', () =>
        HttpResponse.json(eventFixture({ participants: [participantFixture({ user_uuid: 'self', fullname: 'Max Mitglied' })] })),
      ),
    );
    renderPage();

    await screen.findByRole('button', { name: /Abmelden/i });
    expect(screen.queryByRole('button', { name: /^Anmelden$/i })).not.toBeInTheDocument();
  });

  it('shows a confirm button for admins next to an unconfirmed participant', async () => {
    server.use(
      http.get('/api/v1/me', () =>
        HttpResponse.json({
          user: meFixture({ uuid: 'admin' }),
          abilities: { external_event: ['update', 'destroy'], external_event_participant: ['update', 'destroy'] },
        }),
      ),
      http.get('/api/v1/external_events/e1', () =>
        HttpResponse.json(eventFixture({ participants: [participantFixture({ user_uuid: 'other', subscription_confirmed: false })] })),
      ),
    );
    renderPage();

    await screen.findByRole('button', { name: /Bestätigen/i });
  });

  it('hides the confirm button next to an already-confirmed participant', async () => {
    server.use(
      http.get('/api/v1/me', () =>
        HttpResponse.json({
          user: meFixture({ uuid: 'admin' }),
          abilities: { external_event: ['update', 'destroy'], external_event_participant: ['update', 'destroy'] },
        }),
      ),
      http.get('/api/v1/external_events/e1', () =>
        HttpResponse.json(eventFixture({ participants: [participantFixture({ user_uuid: 'other', subscription_confirmed: true })] })),
      ),
    );
    renderPage();

    await waitFor(() => expect(screen.getByText('Sommerfest')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Bestätigen/i })).not.toBeInTheDocument();
  });

  it('hides the confirm button for a plain member, even next to an unconfirmed participant', async () => {
    server.use(
      http.get('/api/v1/external_events/e1', () =>
        HttpResponse.json(eventFixture({ participants: [participantFixture({ user_uuid: 'other', subscription_confirmed: false })] })),
      ),
    );
    renderPage();

    await waitFor(() => expect(screen.getByText('Sommerfest')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Bestätigen/i })).not.toBeInTheDocument();
  });

  it('hides the confirm button for an ExternalEvent-admin who lacks the ExternalEventParticipant bundle (the Finding 1 regression scenario)', async () => {
    // Mirrors an applicationAdmin-only user: `manage ExternalEvent` (so
    // `external_event` includes update/destroy) without `manage
    // ExternalEventParticipant`. Before the fix, the confirm button was gated
    // on `external_event` alone, so it would incorrectly show here even
    // though the backend confirm route would 403 it.
    server.use(
      http.get('/api/v1/me', () =>
        HttpResponse.json({
          user: meFixture({ uuid: 'admin' }),
          abilities: { external_event: ['update', 'destroy'], external_event_participant: [] },
        }),
      ),
      http.get('/api/v1/external_events/e1', () =>
        HttpResponse.json(eventFixture({ participants: [participantFixture({ user_uuid: 'other', subscription_confirmed: false })] })),
      ),
    );
    renderPage();

    await waitFor(() => expect(screen.getByText('Sommerfest')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: /Bestätigen/i })).not.toBeInTheDocument();
  });

  it('shows an error alert when confirming a participant fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/v1/me', () =>
        HttpResponse.json({
          user: meFixture({ uuid: 'admin' }),
          abilities: { external_event: ['update', 'destroy'], external_event_participant: ['update', 'destroy'] },
        }),
      ),
      http.get('/api/v1/external_events/e1', () =>
        HttpResponse.json(eventFixture({ participants: [participantFixture({ user_uuid: 'other', subscription_confirmed: false })] })),
      ),
      http.post('/api/v1/external_events/e1/participants/other/confirm', () =>
        HttpResponse.json({ error: 'forbidden' }, { status: 403 }),
      ),
    );
    renderPage();

    const confirmButton = await screen.findByRole('button', { name: /Bestätigen/i });
    await user.click(confirmButton);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('shows an error alert when unregistering fails', async () => {
    const user = userEvent.setup();
    server.use(
      http.get('/api/v1/external_events/e1', () =>
        HttpResponse.json(eventFixture({ participants: [participantFixture({ user_uuid: 'self', fullname: 'Max Mitglied' })] })),
      ),
      http.delete('/api/v1/external_events/e1/participants/self', () =>
        HttpResponse.json({ error: 'unprocessable' }, { status: 422 }),
      ),
    );
    renderPage();

    const unregisterButton = await screen.findByRole('button', { name: /Abmelden/i });
    await user.click(unregisterButton);

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('shows Anmelden (not Abmelden) when a different participant is registered but the current user is not', async () => {
    server.use(
      http.get('/api/v1/external_events/e1', () =>
        HttpResponse.json(eventFixture({ participants: [participantFixture({ user_uuid: 'other' })] })),
      ),
    );
    renderPage();

    await screen.findByRole('button', { name: /^Anmelden$/i });
    expect(screen.queryByRole('button', { name: /Abmelden/i })).not.toBeInTheDocument();
  });

  it('shows edit/delete controls for an admin', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json({ user: meFixture({ uuid: 'admin' }), abilities: { external_event: ['update', 'destroy'] } })),
    );
    renderPage();

    await screen.findByRole('button', { name: 'Bearbeiten' });
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
  });

  it('hides edit/delete controls for a plain member', async () => {
    renderPage();

    await waitFor(() => expect(screen.getByText('Sommerfest')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Bearbeiten' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument();
  });

  it('hides edit/delete controls for an admin when the event is ICS-imported', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json({ user: meFixture({ uuid: 'admin' }), abilities: { external_event: ['update', 'destroy'] } })),
      http.get('/api/v1/external_events/e1', () => HttpResponse.json(eventFixture({ ics_source_id: 42 }))),
    );
    renderPage();

    await waitFor(() => expect(screen.getByText('Sommerfest')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Bearbeiten' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument();
  });

  it('formats the event date as a localized date instead of the raw YYYY-MM-DD string', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Sommerfest')).toBeInTheDocument());
    const expectedDate = new Date('2026-09-01T00:00:00').toLocaleString(i18n.language, { dateStyle: 'medium' });
    expect(screen.getByText(`${expectedDate} 18:00`)).toBeInTheDocument();
  });
});
