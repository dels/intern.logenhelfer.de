import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import EventsCalendarView from './EventsCalendarView';
import i18n from '../../i18n';
import { addMonths, buildMonthGrid, toDateKey } from './calendarGrid';

/** Matches renderView's anchorDateForTest below - the fixed-anchor convention this file already uses for deterministic date assertions. */
const FIXED_ANCHOR = new Date(2026, 1, 15);

let memberFetchCount = 0;

const server = setupServer(
  http.get('/api/v1/events', () =>
    HttpResponse.json({ rows: [{ uuid: 'e1', title: 'Stiftungsfest', date: '2026-02-10', location: 'Saal', created_by_id: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }], row_count: 1 }),
  ),
  http.get('/api/v1/external_events', () =>
    HttpResponse.json({ rows: [{ uuid: 'x1', title: 'Nachbarbesuch', location: 'Anderswo', date: '2026-02-12', host: null, ics_source_id: 1, ics_source_uuid: 's1', created_by_id: 1, updated_by_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }], row_count: 1 }),
  ),
  http.get('/api/v1/external_event_ics_sources/options', () =>
    HttpResponse.json({ rows: [{ uuid: 's1', name: 'Nachbarloge' }] }),
  ),
  http.get('/api/v1/members/birthday_list', ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('page') === '0') {
      return HttpResponse.json({ rows: [{ uuid: 'u1', lastname: 'Muster', firstname: 'Max', date_of_birth: '1980-02-15', age: 46, twentyfifth_jubilee: null, fortieth_jubilee: null }], row_count: 1 });
    }
    return HttpResponse.json({ rows: [], row_count: 1 });
  }),
  http.get('/api/v1/members/:uuid', () => {
    memberFetchCount += 1;
    return HttpResponse.json({
      uuid: 'u1', email: 'max@example.test', firstname: 'Max', lastname: 'Muster',
      date_of_birth: '1980-02-15', created_at: '', updated_at: '', roles: [], can_edit: false, can_destroy: false,
      can_impersonate: false, editable_fields: [], mother_lodge: null, accepted_at: null, addresses: [],
    });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  memberFetchCount = 0;
  vi.useRealTimers();
});
afterAll(() => server.close());

function renderView() {
  const queryClient = new QueryClient();
  const view = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <EventsCalendarView anchorDateForTest={FIXED_ANCHOR} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...view, queryClient };
}

describe('EventsCalendarView', () => {
  it('shows a skeleton while events/birthdays are loading for the visible month, then the real grid once both resolve', async () => {
    renderView();
    expect(screen.getByTestId('calendar-skeleton')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());
    expect(screen.queryByTestId('calendar-skeleton')).not.toBeInTheDocument();
  });

  it('renders an event chip, a birthday chip (default on), but not the external event chip (default off) or its source', async () => {
    renderView();
    await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());
    expect(screen.getByText(/Max Muster/)).toBeInTheDocument();
    expect(screen.queryByText('Nachbarbesuch')).not.toBeInTheDocument();
  });

  it('shows the external event chip once its ICS source is selected in the filter', async () => {
    renderView();
    await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: 'Nachbarloge' }));
    await waitFor(() => expect(screen.getByText('Nachbarbesuch')).toBeInTheDocument());
  });

  it('hides birthdays once deselected in the filter', async () => {
    renderView();
    await waitFor(() => expect(screen.getByText(/Max Muster/)).toBeInTheDocument());
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('option', { name: /Geburtstage/i }));
    await waitFor(() => expect(screen.queryByText(/Max Muster/)).not.toBeInTheDocument());
  });

  it('switches to week view and still shows the same-week event', async () => {
    renderView();
    await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Woche/i }));
    expect(screen.getByText('Stiftungsfest')).toBeInTheDocument();
  });

  it('next/prev navigation changes the visible month label', async () => {
    renderView();
    await waitFor(() => expect(screen.getByText(/Februar 2026/i)).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Nächster Monat/i }));
    expect(screen.getByText(/März 2026/i)).toBeInTheDocument();
  });

  it('uses the app i18n language for the month/year header, not a hardcoded German locale - regression test for a locale-consistency bug', async () => {
    await i18n.changeLanguage('en');
    try {
      renderView();
      await waitFor(() => expect(screen.getByText(/February 2026/i)).toBeInTheDocument());
      expect(screen.queryByText(/Februar 2026/i)).not.toBeInTheDocument();
    } finally {
      // Component tree is still mounted here (cleanup runs later, in
      // afterEach) - changeLanguage's languageChanged event re-renders it
      // via useTranslation, so it must be act()-wrapped like any other
      // state-updating call made against a mounted tree.
      await act(async () => {
        await i18n.changeLanguage('de');
      });
    }
  });

  it('opens the birthday contact dialog with the member\'s info when its chip is clicked, without fetching member data before that', async () => {
    renderView();
    await waitFor(() => expect(screen.getByText(/Max Muster/)).toBeInTheDocument());
    expect(memberFetchCount).toBe(0);

    await userEvent.click(screen.getByRole('button', { name: /Max Muster/i }));
    expect(await screen.findByText('max@example.test')).toBeInTheDocument();
    expect(memberFetchCount).toBe(1);
  });

  it('still shows the 7-column grid at desktop widths (default in tests)', async () => {
    renderView();
    await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());
    expect(screen.getByText('Mo')).toBeInTheDocument();
  });

  it('renders a flat event+birthday list instead of the grid at mobile widths', async () => {
    const originalMatchMedia = window.matchMedia;
    // Force the mobile branch - see AppShell.test.tsx for the identical
    // pattern this codebase already uses to fake `useMediaQuery` results.
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;

    try {
      renderView();
      await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());
      expect(screen.getByText(/Max Muster/)).toBeInTheDocument();
      // Mobile rows show a location/time line under the title, unlike the
      // desktop grid's chip-only cells.
      expect(screen.getByText('Saal')).toBeInTheDocument();
      // The 7-column grid's weekday header row is gone in the mobile branch.
      expect(screen.queryByText('Mo')).not.toBeInTheDocument();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('opens the birthday contact dialog from the mobile list, same as from the grid chip', async () => {
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;

    try {
      renderView();
      await waitFor(() => expect(screen.getByText(/Max Muster/)).toBeInTheDocument());
      await userEvent.click(screen.getByRole('button', { name: /Max Muster/i }));
      expect(await screen.findByText('max@example.test')).toBeInTheDocument();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('excludes adjacent-month days from the mobile agenda, even though they still appear (dimmed) on the desktop grid', async () => {
    server.use(
      http.get('/api/v1/events', () =>
        HttpResponse.json({
          rows: [
            { uuid: 'e1', title: 'Stiftungsfest', date: '2026-02-10', location: 'Saal', created_by_id: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
            // 2026-02-01 is a Sunday - the Feb month grid's first Monday-start
            // week begins in January, so this January day is adjacent-month
            // padding for the February grid built by anchorDateForTest below.
            { uuid: 'e0', title: 'Vormonatstermin', date: '2026-01-30', location: 'Saal', created_by_id: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
          ],
          row_count: 2,
        }),
      ),
    );
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;

    try {
      renderView();
      await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());
      expect(screen.queryByText('Vormonatstermin')).not.toBeInTheDocument();
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('dims a past day\'s cell and outlines its chips, while highlighting today\'s cell', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-02-10T00:00:00'));
    server.use(
      http.get('/api/v1/events', () =>
        HttpResponse.json({
          rows: [
            { uuid: 'e1', title: 'Stiftungsfest', date: '2026-02-10', location: 'Saal', created_by_id: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
            { uuid: 'e2', title: 'Altes Treffen', date: '2026-02-05', location: 'Saal', created_by_id: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
          ],
          row_count: 2,
        }),
      ),
    );
    renderView();
    await waitFor(() => expect(screen.getByText('Altes Treffen')).toBeInTheDocument());

    const pastChip = screen.getByText('Altes Treffen').closest('.MuiChip-root');
    expect(pastChip).toHaveClass('MuiChip-outlined');
    const pastCell = screen.getByText('5').closest('div');
    // Past-day treatment must not dim the whole cell (opacity would
    // composite the chip text below it into the same semi-transparent
    // group, defeating the outlined variant's contrast). Instead only a
    // background tint (theme's default action.hover) is applied.
    expect(pastCell).toHaveStyle({ backgroundColor: 'rgba(0, 0, 0, 0.04)' });
    expect(pastCell).toHaveStyle({ opacity: '1' });

    const todayChip = screen.getByText('Stiftungsfest').closest('.MuiChip-root');
    expect(todayChip).toHaveClass('MuiChip-filled');
    const todayCell = screen.getByText('10').closest('div');
    expect(todayCell).toHaveStyle({ borderWidth: '2px' });

    const futureCell = screen.getByText('20').closest('div');
    expect(futureCell).toHaveStyle({ opacity: '1' });
    expect(futureCell).not.toHaveStyle({ borderWidth: '2px' });
    expect(futureCell).not.toHaveStyle({ backgroundColor: 'rgba(0, 0, 0, 0.04)' });
  });

  it('outlines a past day\'s chip in the mobile agenda too, same as the desktop grid - regression test for a bug where mobile never marked past days', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-02-10T00:00:00'));
    server.use(
      http.get('/api/v1/events', () =>
        HttpResponse.json({
          rows: [
            { uuid: 'e1', title: 'Stiftungsfest', date: '2026-02-10', location: 'Saal', created_by_id: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
            { uuid: 'e2', title: 'Altes Treffen', date: '2026-02-05', location: 'Saal', created_by_id: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
          ],
          row_count: 2,
        }),
      ),
    );
    const originalMatchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    })) as typeof window.matchMedia;

    try {
      renderView();
      await waitFor(() => expect(screen.getByText('Altes Treffen')).toBeInTheDocument());

      const pastChip = screen.getByText('Altes Treffen').closest('.MuiChip-root');
      expect(pastChip).toHaveClass('MuiChip-outlined');

      const todayChip = screen.getByText('Stiftungsfest').closest('.MuiChip-root');
      expect(todayChip).toHaveClass('MuiChip-filled');
    } finally {
      window.matchMedia = originalMatchMedia;
    }
  });

  it('prefetches the next 3 months of events once the current month has loaded', async () => {
    const { queryClient } = renderView();
    await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());
    for (let i = 1; i <= 3; i++) {
      const futureGrid = buildMonthGrid(addMonths(FIXED_ANCHOR, i));
      const from = toDateKey(futureGrid[0]![0]!);
      const to = toDateKey(futureGrid[futureGrid.length - 1]![6]!);
      await waitFor(() => expect(queryClient.getQueryState(['events', 'range', from, to])?.status).toBe('success'));
    }
  });

  it('prefetches 3 months ahead of wherever you navigate to, not just the initial month', async () => {
    const { queryClient } = renderView();
    await waitFor(() => expect(screen.getByText('Stiftungsfest')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Nächster Monat/i }));
    const nextAnchor = addMonths(FIXED_ANCHOR, 1);
    const futureGrid = buildMonthGrid(addMonths(nextAnchor, 3));
    const from = toDateKey(futureGrid[0]![0]!);
    const to = toDateKey(futureGrid[futureGrid.length - 1]![6]!);
    await waitFor(() => expect(queryClient.getQueryState(['events', 'range', from, to])?.status).toBe('success'));
  });

  it('shows a small spinner next to the filter while external events are loading, then hides it', async () => {
    server.use(
      http.get('/api/v1/external_events', async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return HttpResponse.json({ rows: [], row_count: 0 });
      }),
    );
    renderView();
    expect(screen.getByTestId('external-events-spinner')).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByTestId('external-events-spinner')).not.toBeInTheDocument());
  });
});
