import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import EventsListPage from './EventsListPage';
import { toLocalDateString } from './api';
import { AuthProvider } from '../../auth/AuthProvider';
import '../../i18n';
import i18n from '../../i18n';

// The working-plan PDF export's window is `today` -> `today + 120 days`,
// computed the same way EventsListPage's api.ts does it internally
// (downloadInternalWorkingplanPdf). Used below to distinguish the export's
// GET /api/v1/events?...&to=... request from two OTHER unrelated
// /api/v1/events requests that also carry a `to` param and would otherwise
// be indistinguishable by shape alone: the page's own default list-view
// fetch (which sends its own from/to for the current month-page window, but
// never the export's exact 120-day-out `to`) and - now that the calendar is
// the default view - EventsCalendarView's background useEventsInRange fetch
// for the currently visible month (also from/to-shaped, but a much
// narrower, different range). Matching the exact 120-day-out `to` value
// rather than mere `to`/`from` presence keeps these tests correct
// regardless of which view is mounted.
function expectedWorkingplanTo(from: Date): string {
  const to = new Date(from);
  to.setDate(to.getDate() + 120);
  return toLocalDateString(to);
}

// Spied rather than left as a black box: without inspecting the actual
// autoTable() call args, a test that only asserts "a PDF downloaded and
// export was recorded" would still pass even if the code accidentally read
// public_description instead of private_description, or dropped the
// birthday second page entirely - both would be real regressions this task
// exists to prevent. Capturing the real module's calls (not replacing them)
// keeps doc.output()/addPage() behavior intact for the rest of the test.
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
    HttpResponse.json({ user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: { event: ['read', 'create', 'update', 'destroy'] } }),
  ),
  http.get('/api/v1/events', () => HttpResponse.json({ rows: [eventRow], row_count: 1 })),
  http.delete('/api/v1/events/e1', () => new HttpResponse(null, { status: 204 })),
  http.get('/api/v1/external_events', () => HttpResponse.json({ rows: [], row_count: 0 })),
  http.get('/api/v1/external_event_ics_sources/options', () => HttpResponse.json({ rows: [] })),
  http.get('/api/v1/members/birthday_list', () => HttpResponse.json({ rows: [], row_count: 0 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  // Failure-proof timer cleanup: an inline vi.useRealTimers() at the end of
  // a test body never runs if an assertion throws mid-test, which would
  // leak a frozen clock into whichever test runs next.
  vi.useRealTimers();
});
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/events']}>
          <Routes>
            <Route path="/events" element={<EventsListPage />} />
            <Route path="/events/:uuid/edit" element={<div>Edit event page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

// The page now defaults to the calendar view (see the "defaults to..." test
// below); most other tests here exercise list-view-specific UI (DataTable
// rows, row actions, column formatting) and don't care which view is shown
// first, so they switch to list view explicitly rather than asserting
// anything about the calendar's date-range-dependent chip rendering.
async function renderListPage() {
  renderPage();
  await userEvent.click(screen.getByRole('button', { name: 'Liste' }));
  await waitFor(() => expect(screen.getByRole('grid')).toBeInTheDocument());
}

describe('EventsListPage', () => {
  it('renders events returned by the API', async () => {
    await renderListPage();
    await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());
  });

  it('shows row-level edit/delete actions when abilities.event allows them', async () => {
    await renderListPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
  });

  it('hides row-level actions for a read-only member', async () => {
    server.use(http.get('/api/v1/me', () => HttpResponse.json({ user: { id: 2, email: 'c@d.de', firstname: 'A', lastname: 'B' }, abilities: { event: ['read'] } })));
    await renderListPage();
    await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Bearbeiten' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument();
  });

  it('navigates to the edit page without navigating to the detail page', async () => {
    await renderListPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    await waitFor(() => expect(screen.getByText('Edit event page')).toBeInTheDocument());
  });

  it('deletes the event after a second confirming click', async () => {
    let deleteCalled = false;
    server.use(http.delete('/api/v1/events/e1', () => { deleteCalled = true; return new HttpResponse(null, { status: 204 }); }));
    await renderListPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Löschen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Diesen Termin wirklich löschen?' }));
    await waitFor(() => expect(deleteCalled).toBe(true));
  });

  it('builds and downloads an internal working-plan PDF with a birthday-list page, and records the export', async () => {
    // The working-plan window is computed from `new Date()` (today ->
    // today+120), not passed in - pinning the clock makes the in-window /
    // out-of-window birthday fixtures below deterministic instead of
    // drifting (and potentially flipping which bucket they fall into) as
    // wall-clock time passes.
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
        // See expectedWorkingplanTo's comment above: only the export's
        // fetchWorkingplanEvents call sends this exact 120-day-out `to`.
        if (url.searchParams.get('to') !== workingplanTo) {
          return HttpResponse.json({ rows: [eventRow], row_count: 1 });
        }
        // The working-plan fetch always sends from/to (the hardcoded
        // 120-day window) - assert it did so, rather than branching on
        // presence/absence like the brief's illustrative test (which
        // returned identical bodies either way and so never actually
        // distinguished the two branches).
        expect(url.searchParams.get('from')).toBeTruthy();
        expect(url.searchParams.get('to')).toBeTruthy();
        return HttpResponse.json({
          rows: [{ uuid: 'e1', title: 'Loge', date: '2026-08-15', time: null, whole_day: true, location: 'Vereinshaus', public_description: 'Öffentlicher Text', private_description: 'Interne Sitzung' }],
          row_count: 1,
        });
      }),
      http.get('/api/v1/members/birthday_list', () => {
        birthdayListCalled = true;
        // With the clock pinned to 2026-07-15, the working-plan window is
        // ~2026-07-15 to ~2026-11-12. 'Muster' (08-15) falls inside it;
        // 'Ausserhalb' (01-01) falls well outside it and must be dropped by
        // filterBirthdaysInRange before reaching the second autoTable call.
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

    // Two autoTable calls: the events page (using private_description, NOT
    // public_description - this is the internal export) and the
    // birthday-list second page.
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
    // fetchWorkingplanEvents is a local, non-shared copy of the
    // pagination-accumulation pattern used elsewhere in the codebase (per
    // the duplication convention) - it has its own loop and its own
    // `page += 1` continuation branch, which the single-page test above
    // does not exercise (row_count: 1 with one row satisfies
    // `rows.length >= data.row_count` immediately after page 0). This test
    // forces a second page fetch and asserts all rows from both pages land
    // in the built PDF, guarding that branch directly.
    // Pinned (rather than the real wall clock) so expectedWorkingplanTo's
    // 120-day-out `to` is deterministic and known ahead of time - needed to
    // tell the export's request apart from EventsCalendarView's own
    // background fetch below.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-07-15T00:00:00'));
    const workingplanTo = expectedWorkingplanTo(new Date('2026-07-15T00:00:00'));
    autoTableCalls.length = 0;
    // See expectedWorkingplanTo's comment above: only the export's
    // fetchWorkingplanEvents call sends this exact 120-day-out `to`.
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

  it('defaults to the calendar view, and toggles to list view and back', async () => {
    // Pinned so the calendar's default (current-month) grid deterministically
    // includes eventRow's 2026-08-01 date, regardless of the real wall-clock
    // date the test happens to run on - only Date is faked (matching the
    // convention above), so userEvent's internal timers still work.
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-08-01T00:00:00'));
    renderPage();

    // Calendar is the default view: no DataTable grid...
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    // ...but the event still renders, as a calendar chip.
    await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Liste' }));
    await waitFor(() => expect(screen.getByRole('grid')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Kalender' }));
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());
  });

  it('formats the date column as a localized date instead of the raw YYYY-MM-DD string', async () => {
    await renderListPage();
    await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());
    const expected = new Date('2026-08-01T00:00:00').toLocaleString(i18n.language, { dateStyle: 'medium' });
    expect(screen.getByText(expected)).toBeInTheDocument();
    expect(screen.queryByText('2026-08-01')).not.toBeInTheDocument();
  });

  it('fetches the current month by default (`from` = today, `to` = end of the month, ascending sort)', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-07-20T00:00:00'));
    let capturedFrom: string | null = null;
    let capturedTo: string | null = null;
    let capturedSort: string | null = null;
    server.use(
      http.get('/api/v1/events', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('sort')) {
          capturedFrom = url.searchParams.get('from');
          capturedTo = url.searchParams.get('to');
          capturedSort = url.searchParams.get('sort');
        }
        return HttpResponse.json({ rows: [eventRow], row_count: 1 });
      }),
    );
    await renderListPage();
    await waitFor(() => expect(capturedFrom).toBe('2026-07-20'));
    expect(capturedTo).toBe('2026-07-31');
    expect(capturedSort).toBe('date');
  });

  it('paging to the previous month fetches that whole month, entirely before today', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-07-20T00:00:00'));
    const captured: { from: string | null; to: string | null }[] = [];
    server.use(
      http.get('/api/v1/events', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('sort')) {
          captured.push({ from: url.searchParams.get('from'), to: url.searchParams.get('to') });
        }
        return HttpResponse.json({ rows: [eventRow], row_count: 1 });
      }),
    );
    await renderListPage();
    await waitFor(() => expect(captured).toContainEqual({ from: '2026-07-20', to: '2026-07-31' }));

    await userEvent.click(screen.getByRole('button', { name: 'Vorheriger Monat' }));
    await waitFor(() => expect(captured).toContainEqual({ from: '2026-06-01', to: '2026-06-30' }));
  });

  it('paging to the next month fetches that whole month, entirely after today', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-07-20T00:00:00'));
    const captured: { from: string | null; to: string | null }[] = [];
    server.use(
      http.get('/api/v1/events', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('sort')) {
          captured.push({ from: url.searchParams.get('from'), to: url.searchParams.get('to') });
        }
        return HttpResponse.json({ rows: [eventRow], row_count: 1 });
      }),
    );
    await renderListPage();
    await waitFor(() => expect(captured).toContainEqual({ from: '2026-07-20', to: '2026-07-31' }));

    await userEvent.click(screen.getByRole('button', { name: 'Nächster Monat' }));
    await waitFor(() => expect(captured).toContainEqual({ from: '2026-08-01', to: '2026-08-31' }));
  });

  it('the Today button returns to the default current-month window after paging away', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-07-20T00:00:00'));
    const captured: { from: string | null; to: string | null }[] = [];
    server.use(
      http.get('/api/v1/events', ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('sort')) {
          captured.push({ from: url.searchParams.get('from'), to: url.searchParams.get('to') });
        }
        return HttpResponse.json({ rows: [eventRow], row_count: 1 });
      }),
    );
    await renderListPage();
    await waitFor(() => expect(captured).toContainEqual({ from: '2026-07-20', to: '2026-07-31' }));

    await userEvent.click(screen.getByRole('button', { name: 'Nächster Monat' }));
    await waitFor(() => expect(captured).toContainEqual({ from: '2026-08-01', to: '2026-08-31' }));

    await userEvent.click(screen.getByRole('button', { name: 'Heute' }));
    await waitFor(() => {
      const last = captured[captured.length - 1];
      expect(last).toEqual({ from: '2026-07-20', to: '2026-07-31' });
    });
  });
});
