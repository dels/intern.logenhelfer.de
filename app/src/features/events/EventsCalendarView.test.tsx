import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import EventsCalendarView, { type EventsCalendarViewProps } from './EventsCalendarView';
import '../../i18n';

/** Every test anchors on this fixed month so day-of-week/adjacent-month math is deterministic. */
const FIXED_ANCHOR = new Date(2026, 1, 15); // February 2026

let memberFetchCount = 0;

const server = setupServer(
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

const eventRow = { uuid: 'e1', title: 'Stiftungsfest', date: '2026-02-10', time: null, whole_day: false, location: 'Saal', created_by_id: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' };
const externalEventRow = { uuid: 'x1', title: 'Nachbarbesuch', location: 'Anderswo', date: '2026-02-12', time: null, host: null, ics_source_id: 1, ics_source_uuid: 's1', created_by_id: 1, updated_by_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' };
const birthdayRow = { uuid: 'u1', lastname: 'Muster', firstname: 'Max', date_of_birth: '1980-02-15', age: 46, twentyfifth_jubilee: null, fortieth_jubilee: null };

function renderView(props: Partial<EventsCalendarViewProps> = {}) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/events']}>
        <Routes>
          <Route
            path="/events"
            element={(
              <EventsCalendarView
                anchor={FIXED_ANCHOR}
                events={[]}
                externalEvents={[]}
                birthdays={[]}
                isRangeLoading={false}
                {...props}
              />
            )}
          />
          <Route path="/events/:uuid" element={<div>Event detail page</div>} />
          <Route path="/external-events/:uuid" element={<div>External event detail page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

/** Same fake-desktop-matchMedia pattern this file already used, extracted since Step 3 needs it in several tests. */
function mockMobileViewport() {
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
  return () => { window.matchMedia = originalMatchMedia; };
}

describe('EventsCalendarView', () => {
  it('shows a skeleton while isRangeLoading is true', () => {
    renderView({ isRangeLoading: true });
    expect(screen.getByTestId('calendar-skeleton')).toBeInTheDocument();
  });

  it('renders exactly the event/external-event/birthday chips it is given', () => {
    renderView({ events: [eventRow], externalEvents: [externalEventRow], birthdays: [birthdayRow] });
    expect(screen.getByText('Stiftungsfest')).toBeInTheDocument();
    expect(screen.getByText('Nachbarbesuch')).toBeInTheDocument();
    expect(screen.getByText(/Max Muster/)).toBeInTheDocument();
  });

  it('navigates to the event detail page when an event chip is clicked', async () => {
    renderView({ events: [eventRow] });
    await userEvent.click(screen.getByText('Stiftungsfest'));
    expect(await screen.findByText('Event detail page')).toBeInTheDocument();
  });

  it('navigates to the external event detail page when an external-event chip is clicked', async () => {
    renderView({ externalEvents: [externalEventRow] });
    await userEvent.click(screen.getByText('Nachbarbesuch'));
    expect(await screen.findByText('External event detail page')).toBeInTheDocument();
  });

  it('opens the birthday contact dialog with the member\'s info when its chip is clicked, without fetching member data before that', async () => {
    renderView({ birthdays: [birthdayRow] });
    expect(memberFetchCount).toBe(0);
    await userEvent.click(screen.getByRole('button', { name: /Max Muster/i }));
    expect(await screen.findByText('max@example.test')).toBeInTheDocument();
    expect(memberFetchCount).toBe(1);
  });

  it('still shows the 7-column grid at desktop widths (default in tests)', () => {
    renderView({ events: [eventRow] });
    expect(screen.getByText('Mo')).toBeInTheDocument();
  });

  it('renders a flat event+birthday list instead of the grid at mobile widths', () => {
    const restore = mockMobileViewport();
    try {
      renderView({ events: [eventRow], birthdays: [birthdayRow] });
      expect(screen.getByText(/Max Muster/)).toBeInTheDocument();
      expect(screen.getByText('Saal')).toBeInTheDocument();
      expect(screen.queryByText('Mo')).not.toBeInTheDocument();
    } finally {
      restore();
    }
  });

  it('navigates to the event detail page when clicking the mobile row outside the chip (day badge/location text), not just the chip itself', async () => {
    // Regression: the row's onClick used to live only on the inner Chip, so
    // clicking the surrounding box (day-number badge, time/location text)
    // did nothing - only the chip's own pixels were clickable.
    const restore = mockMobileViewport();
    try {
      renderView({ events: [eventRow] });
      // 'Saal' is the location text rendered next to the chip, not inside it.
      await userEvent.click(screen.getByText('Saal'));
      expect(await screen.findByText('Event detail page')).toBeInTheDocument();
    } finally {
      restore();
    }
  });

  it('opens the birthday contact dialog from the mobile list, same as from the grid chip', async () => {
    const restore = mockMobileViewport();
    try {
      renderView({ birthdays: [birthdayRow] });
      await userEvent.click(screen.getByRole('button', { name: /Max Muster/i }));
      expect(await screen.findByText('max@example.test')).toBeInTheDocument();
    } finally {
      restore();
    }
  });

  it('excludes adjacent-month days from the mobile agenda, even though they still appear (dimmed) on the desktop grid', () => {
    // 2026-02-01 is a Sunday - the Feb month grid's first Monday-start week
    // begins in January, so this January day is adjacent-month padding.
    const adjacentMonthEvent = { ...eventRow, uuid: 'e0', title: 'Vormonatstermin', date: '2026-01-30' };
    renderView({ events: [eventRow, adjacentMonthEvent] });
    expect(screen.getByText('Vormonatstermin')).toBeInTheDocument();

    cleanup();
    const restore = mockMobileViewport();
    try {
      renderView({ events: [eventRow, adjacentMonthEvent] });
      expect(screen.queryByText('Vormonatstermin')).not.toBeInTheDocument();
    } finally {
      restore();
    }
  });

  it('dims a past day\'s cell and outlines its chips, while highlighting today\'s cell', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-02-10T00:00:00'));
    const pastEvent = { ...eventRow, uuid: 'e2', title: 'Altes Treffen', date: '2026-02-05' };
    renderView({ events: [eventRow, pastEvent] });

    const pastChip = screen.getByText('Altes Treffen').closest('.MuiChip-root');
    expect(pastChip).toHaveClass('MuiChip-outlined');
    const pastCell = screen.getByText('5').closest('div');
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

  it('outlines a past day\'s chip in the mobile agenda too, same as the desktop grid', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-02-10T00:00:00'));
    const restore = mockMobileViewport();
    try {
      const pastEvent = { ...eventRow, uuid: 'e2', title: 'Altes Treffen', date: '2026-02-05' };
      renderView({ events: [eventRow, pastEvent] });

      const pastChip = screen.getByText('Altes Treffen').closest('.MuiChip-root');
      expect(pastChip).toHaveClass('MuiChip-outlined');
      const todayChip = screen.getByText('Stiftungsfest').closest('.MuiChip-root');
      expect(todayChip).toHaveClass('MuiChip-filled');
    } finally {
      restore();
    }
  });
});
