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
import '../../i18n';
import i18n from '../../i18n';

// The working-plan PDF export's window is `today` -> `today + 120 days`,
// computed the same way EventsListPage's api.ts does it internally
// (downloadInternalWorkingplanPdf). Used below to distinguish the export's
// GET /api/v1/events?...&to=... request from the page's own background
// month-range fetch (useCalendarRangeData), which never sends this exact
// 120-day-out `to`.
function expectedWorkingplanTo(from: Date): string {
  const to = new Date(from);
  to.setDate(to.getDate() + 120);
  return toLocalDateString(to);
}

const autoTableCalls: unknown[] = [];
vi.mock('jspdf-autotable', async () => {
  const actual = await vi.importActual<typeof import('jspdf-autotable')>('jspdf-autotable');
  return {
    ...actual,
    autoTable: (doc: unknown, options: unknown) => {
      autoTableCalls.push(options);
      return actual.autoTable(doc as never, options as never);
    },
  };
});

const eventRow = { uuid: 'e1', title: 'Stiftungsfest', date: '2026-08-01', time: '19:00', whole_day: false, location: 'Festsaal', created_by_id: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' };

const server = setupServer(
  http.get('/api/v1/me', () =>
    HttpResponse.json({ user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: { event: ['read', 'create', 'update', 'destroy'], external_event: ['create'] } }),
  ),
  http.get('/api/v1/events', () => HttpResponse.json({ rows: [eventRow], row_count: 1 })),
  http.delete('/api/v1/events/e1', () => new HttpResponse(null, { status: 204 })),
  http.get('/api/v1/external_events', () => HttpResponse.json({ rows: [], row_count: 0 })),
  http.get('/api/v1/external_event_ics_sources/options', () => HttpResponse.json({ rows: [] })),
  http.get('/api/v1/members/birthday_list', () => HttpResponse.json({ rows: [], row_count: 0 })),
  http.get('/api/v1/public/landing', () => HttpResponse.json({ birthday_calendar_ics_url: null })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
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

  it('builds and downloads an internal working-plan PDF with a birthday-list page, and records the export', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-07-15T00:00:00'));
    const workingplanTo = expectedWorkingplanTo(new Date('2026-07-15T00:00:00'));
    let recordExportCalled = false;
    let recordExportBody: unknown;
    let birthdayListCalled = false;
    autoTableCalls.length = 0;
    server.use(
      http.get('/api/v1/events', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('to') !== workingplanTo) {
          return HttpResponse.json({ rows: [eventRow], row_count: 1 });
        }
        expect(url.searchParams.get('from')).toBeTruthy();
        expect(url.searchParams.get('to')).toBeTruthy();
        return HttpResponse.json({
          rows: [{ uuid: 'e1', title: 'Loge', date: '2026-08-15', time: null, whole_day: true, location: 'Vereinshaus', public_description: 'Öffentlicher Text', private_description: 'Interne Sitzung' }],
          row_count: 1,
        });
      }),
      http.get('/api/v1/members/birthday_list', () => {
        birthdayListCalled = true;
        return HttpResponse.json({
          rows: [
            { uuid: 'u1', lastname: 'Muster', firstname: 'Max', date_of_birth: '1980-08-15', age: 46, twentyfifth_jubilee: null, fortieth_jubilee: null },
            { uuid: 'u2', lastname: 'Ausserhalb', firstname: 'Anna', date_of_birth: '1980-01-01', age: 46, twentyfifth_jubilee: null, fortieth_jubilee: null },
          ],
          row_count: 2,
        });
      }),
      http.post('/api/v1/events/record_export', async ({ request }) => {
        recordExportCalled = true;
        recordExportBody = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Arbeitsplan als PDF exportieren' }));
    await waitFor(() => expect(createObjectURLSpy).toHaveBeenCalled());
    await waitFor(() => expect(recordExportCalled).toBe(true));
    expect(recordExportBody).toEqual({ kind: 'workingplan_internal' });
    expect(birthdayListCalled).toBe(true);

    expect(autoTableCalls).toHaveLength(2);
    const eventsTable = autoTableCalls[0] as { body: string[][] };
    const flatEventRow = eventsTable.body.flat().join(' ');
    expect(flatEventRow).toContain('Interne Sitzung');
    expect(flatEventRow).not.toContain('Öffentlicher Text');
    const birthdayTable = autoTableCalls[1] as { head: string[][]; body: string[][] };
    expect(birthdayTable.head[0]).toEqual(['Nachname', 'Vorname', 'Geburtstag', 'Alter']);
    const flatBirthdayRows = birthdayTable.body.flat().join(' ');
    expect(flatBirthdayRows).toContain('Muster');
    expect(flatBirthdayRows).not.toContain('Ausserhalb');
    const expectedBirthDate = new Date('1980-08-15T00:00:00').toLocaleString('de-DE', { dateStyle: 'medium' });
    expect(flatBirthdayRows).toContain(expectedBirthDate);
    expect(flatBirthdayRows).not.toContain('1980-08-15');

    createObjectURLSpy.mockRestore();
  });

  it('accumulates the working-plan PDF across multiple pages of events', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-07-15T00:00:00'));
    const workingplanTo = expectedWorkingplanTo(new Date('2026-07-15T00:00:00'));
    autoTableCalls.length = 0;
    const requestedPages: number[] = [];
    server.use(
      http.get('/api/v1/events', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('to') !== workingplanTo) {
          return HttpResponse.json({ rows: [eventRow], row_count: 1 });
        }
        const page = Number(url.searchParams.get('page'));
        requestedPages.push(page);
        if (page === 0) {
          const rows = Array.from({ length: 100 }, (_, i) => ({
            uuid: `e${i}`, title: `Termin ${i}`, date: '2026-08-15', time: null, whole_day: true,
            location: 'Vereinshaus', private_description: `Beschreibung ${i}`,
          }));
          return HttpResponse.json({ rows, row_count: 150 });
        }
        const rows = Array.from({ length: 50 }, (_, i) => ({
          uuid: `e${100 + i}`, title: `Termin ${100 + i}`, date: '2026-08-16', time: null, whole_day: true,
          location: 'Vereinshaus', private_description: `Beschreibung ${100 + i}`,
        }));
        return HttpResponse.json({ rows, row_count: 150 });
      }),
      http.get('/api/v1/members/birthday_list', () => HttpResponse.json({ rows: [], row_count: 0 })),
      http.post('/api/v1/events/record_export', () => new HttpResponse(null, { status: 204 })),
    );
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'Arbeitsplan als PDF exportieren' }));
    await waitFor(() => expect(createObjectURLSpy).toHaveBeenCalled());
    await waitFor(() => expect(requestedPages).toEqual([0, 1]));

    const eventsTable = autoTableCalls[0] as { body: string[][] };
    const flatEventRows = eventsTable.body.flat().join(' ');
    expect(flatEventRows).toContain('Beschreibung 0');
    expect(flatEventRows).toContain('Beschreibung 99');
    expect(flatEventRows).toContain('Beschreibung 149');

    createObjectURLSpy.mockRestore();
  });

  it('shows the birthday-calendar button only when the public landing config provides a URL', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Geburtstagskalender einbinden' })).not.toBeInTheDocument();
  });

  it('copies the absolute birthday-calendar URL to the clipboard and shows a toast, instead of navigating', async () => {
    server.use(http.get('/api/v1/public/landing', () => HttpResponse.json({ birthday_calendar_ics_url: '/api/v1/public/birthdays/secret/calendar.ics' })));
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
    server.use(http.get('/api/v1/public/landing', () => HttpResponse.json({ birthday_calendar_ics_url: '/api/v1/public/birthdays/secret/calendar.ics' })));
    stubClipboardWriteText(vi.fn().mockRejectedValue(new Error('denied')));
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Geburtstagskalender einbinden' }));

    await waitFor(() => expect(screen.getByText('Kopieren des Links fehlgeschlagen.')).toBeInTheDocument());
  });
});
