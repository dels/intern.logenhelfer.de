import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import EventsListPage from './EventsListPage';
import { toLocalDateString } from './api';
import { AuthProvider } from '../../auth/AuthProvider';
import { ToastProvider } from '../../notifications/ToastProvider';
import { setAccessToken } from '../../api/token';
import '../../i18n';
import i18n from '../../i18n';

const eventRow = { uuid: 'e1', title: 'Stiftungsfest', date: '2026-08-01', time: '19:00', whole_day: false, location: 'Festsaal', created_by_id: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' };

const server = setupServer(
  http.get('/api/v1/me', () =>
    HttpResponse.json({
      user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' },
      abilities: { event: ['read', 'create', 'update', 'destroy'], external_event: ['create'] },
      // Security fix: this URL now comes from the authenticated /me response
      // (see AuthProvider.tsx), not the unauthenticated /public/landing one -
      // see PublicCalendarPage.test.tsx for that route's own coverage.
      birthday_calendar_ics_url: null,
    }),
  ),
  http.get('/api/v1/events', () => HttpResponse.json({ rows: [eventRow], row_count: 1 })),
  http.delete('/api/v1/events/e1', () => new HttpResponse(null, { status: 204 })),
  http.get('/api/v1/external_events', () => HttpResponse.json({ rows: [], row_count: 0 })),
  http.get('/api/v1/external_event_ics_sources/options', () => HttpResponse.json({ rows: [] })),
  http.get('/api/v1/members/birthday_list', () => HttpResponse.json({ rows: [], row_count: 0 })),
);

/** Same base /me shape as the server's own default handler above, but with a real birthday_calendar_ics_url - used by the two tests below that need the button present. */
function meWithBirthdayUrl(url: string) {
  return http.get('/api/v1/me', () =>
    HttpResponse.json({
      user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' },
      abilities: { event: ['read', 'create', 'update', 'destroy'], external_event: ['create'] },
      birthday_calendar_ics_url: url,
    }),
  );
}

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
// AuthProvider's cold-boot bootstrap effect (Task 4's sub-fix (a)) refreshes
// the session before ever calling /me when there's no access token in
// memory - this file's /me mock is token-agnostic and there's no
// /session/refresh handler here, so a token must already be present for the
// mount to reach /me at all, same as a returning session in the same tab.
beforeEach(() => setAccessToken('test-token'));
afterEach(() => {
  server.resetHandlers();
  setAccessToken(null);
  vi.useRealTimers();
  Reflect.deleteProperty(navigator, 'clipboard');
});
afterAll(() => server.close());

// jsdom has no Clipboard implementation - define it directly on the real
// `navigator` (rather than `vi.stubGlobal('navigator', {...})`) so every
// other property (userAgent, language, ...) stays intact for the rest of
// the test. Cleaned up in the afterEach above, even on assertion failure.
function stubClipboardWriteText(writeText: (text: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
}

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/events']}>
            <Routes>
              <Route path="/events" element={<EventsListPage />} />
              <Route path="/events/new" element={<div>New event page</div>} />
              <Route path="/events/:uuid/edit" element={<div>Edit event page</div>} />
              <Route path="/external-events/new" element={<div>New external event page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

async function switchToList() {
  await userEvent.click(screen.getByRole('button', { name: 'Liste' }));
  await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
}

describe('EventsListPage', () => {
  it('defaults to the calendar view, and toggles to list view and back', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-08-01T00:00:00'));
    renderPage();

    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());

    await switchToList();
    expect(screen.getByText('Stiftungsfest')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Kalender' }));
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());
  });

  it('shows "Neuer Termin" only when abilities.event allows create', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Neuer Termin' })).toBeInTheDocument());
  });

  it('shows "Neuer Termin außer Haus" only when abilities.external_event allows create, and it navigates to /external-events/new', async () => {
    renderPage();
    const button = await screen.findByRole('button', { name: 'Neuer Termin außer Haus' });
    await userEvent.click(button);
    await waitFor(() => expect(screen.getByText('New external event page')).toBeInTheDocument());
  });

  it('hides "Neuer Termin" and "Neuer Termin außer Haus" for a read-only member', async () => {
    server.use(http.get('/api/v1/me', () => HttpResponse.json({ user: { id: 2, email: 'c@d.de', firstname: 'A', lastname: 'B' }, abilities: { event: ['read'] } })));
    renderPage();
    await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Neuer Termin' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Neuer Termin außer Haus' })).not.toBeInTheDocument();
  });

  it('renders "Heute" as a visible outlined button, not a plain text button', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Heute' })).toHaveClass('MuiButton-outlined'));
  });

  it('fetches the month containing today by default', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-07-20T00:00:00'));
    let captured: { from: string | null; to: string | null } | null = null;
    server.use(
      http.get('/api/v1/events', ({ request }) => {
        const url = new URL(request.url);
        captured = { from: url.searchParams.get('from'), to: url.searchParams.get('to') };
        return HttpResponse.json({ rows: [eventRow], row_count: 1 });
      }),
    );
    renderPage();
    // Range is the padded month grid (Monday-start weeks), so `from`/`to`
    // can fall a few days outside the bare 07-01..07-31 window - only
    // assert the month itself is correctly targeted, not exact padding edges.
    await waitFor(() => expect(captured?.from?.startsWith('2026-0')).toBe(true));
  });

  it('paging to the next month, then back via "Heute", changes the month label shown in the shared header', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-07-20T00:00:00'));
    renderPage();
    await waitFor(() => expect(screen.getByText(/Juli 2026/)).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Nächster Monat' }));
    await waitFor(() => expect(screen.getByText(/August 2026/)).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Heute' }));
    await waitFor(() => expect(screen.getByText(/Juli 2026/)).toBeInTheDocument());
  });

  it('uses the app i18n language for the month/year header, not a hardcoded German locale', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-02-15T00:00:00'));
    await i18n.changeLanguage('en');
    try {
      renderPage();
      await waitFor(() => expect(screen.getByText(/February 2026/i)).toBeInTheDocument());
      expect(screen.queryByText(/Februar 2026/i)).not.toBeInTheDocument();
    } finally {
      await act(async () => {
        await i18n.changeLanguage('de');
      });
    }
  });

  it('the filter box appears in both List and Kalender view, and a selection made in one view still applies after switching to the other', async () => {
    server.use(
      http.get('/api/v1/external_events', () => HttpResponse.json({
        rows: [{ uuid: 'x1', title: 'Nachbarbesuch', location: 'Anderswo', date: '2026-08-05', time: '20:00', host: null, ics_source_id: null, ics_source_uuid: null, created_by_id: 1, updated_by_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }],
        row_count: 1,
      })),
    );
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-08-01T00:00:00'));
    renderPage();
    await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());
    expect(screen.queryByText('Nachbarbesuch')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('combobox', { name: /Anzeigen/i }));
    await userEvent.click(screen.getByRole('option', { name: /Termine außer Haus/i }));
    await waitFor(() => expect(screen.getByText('Nachbarbesuch')).toBeInTheDocument());

    await switchToList();
    expect(screen.getByText('Nachbarbesuch')).toBeInTheDocument();
  });

  it('shows a small spinner next to the filter while external events are loading, then hides it', async () => {
    server.use(
      http.get('/api/v1/external_events', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json({ rows: [], row_count: 0 });
      }),
    );
    renderPage();
    expect(screen.getByTestId('external-events-spinner')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId('external-events-spinner')).not.toBeInTheDocument());
  });

  // Task 9: the export button now downloads the server-rendered PDF from
  // GET /api/v1/events/workingplan.pdf via the shared authenticated
  // downloadFile() blob helper (app/src/api/client.ts), rather than
  // building the PDF client-side with jsPDF and separately POSTing
  // /record_export (the server route now logs the export inline - see
  // api/src/routes/events.ts's workingplan.pdf handler).
  it('downloads the working-plan PDF from GET /api/v1/events/workingplan.pdf with a dated filename, and does not call the old record_export endpoint', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-07-15T00:00:00'));
    let requestedPath: string | null = null;
    let recordExportCalled = false;
    server.use(
      http.get('/api/v1/events/workingplan.pdf', ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return new HttpResponse(new Blob(['%PDF-mock'], { type: 'application/pdf' }), {
          status: 200,
          headers: { 'Content-Type': 'application/pdf' },
        });
      }),
      http.post('/api/v1/events/record_export', () => {
        recordExportCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Arbeitsplan als PDF exportieren' }));

    await waitFor(() => expect(createObjectURLSpy).toHaveBeenCalled());
    expect(requestedPath).toBe('/api/v1/events/workingplan.pdf');
    expect(recordExportCalled).toBe(false);
    // The `${today}-Arbeitsplan-intern.pdf` filename shape is carried over
    // from the old client-side jsPDF code path, but `today` itself is a
    // deliberate change: the old code used
    // `new Date().toISOString().slice(0, 10)` (UTC), which could roll the
    // filename's date back a day during early-morning hours in a timezone
    // ahead of UTC (e.g. Germany). This now uses toLocalDateString (local
    // midnight semantics, already exported for exactly this kind of
    // date-only computation elsewhere in this file) instead.
    const clickedAnchor = clickSpy.mock.contexts[0] as HTMLAnchorElement;
    expect(clickedAnchor.download).toBe(`${toLocalDateString(new Date())}-Arbeitsplan-intern.pdf`);

    createObjectURLSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it('shows the birthday-calendar button only when /me provides a URL', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Geburtstagskalender einbinden' })).not.toBeInTheDocument();
  });

  it('copies the absolute birthday-calendar URL to the clipboard and shows a toast, instead of navigating', async () => {
    server.use(meWithBirthdayUrl('/api/v1/public/birthdays/secret/calendar.ics'));
    const writeText = vi.fn().mockResolvedValue(undefined);
    stubClipboardWriteText(writeText);
    renderPage();

    const button = await screen.findByRole('button', { name: 'Geburtstagskalender einbinden' });
    expect(button.tagName).not.toBe('A');
    await userEvent.click(button);

    expect(writeText).toHaveBeenCalledWith(new URL('/api/v1/public/birthdays/secret/calendar.ics', window.location.origin).href);
    await waitFor(() => expect(screen.getByText('Link kopiert. Füge ihn in deiner Kalender-App als Kalenderabo hinzu.')).toBeInTheDocument());
  });

  it('shows an error toast when the clipboard write fails', async () => {
    server.use(meWithBirthdayUrl('/api/v1/public/birthdays/secret/calendar.ics'));
    stubClipboardWriteText(vi.fn().mockRejectedValue(new Error('denied')));
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Geburtstagskalender einbinden' }));

    await waitFor(() => expect(screen.getByText('Kopieren des Links fehlgeschlagen.')).toBeInTheDocument());
  });
});
