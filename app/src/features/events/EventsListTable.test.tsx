import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import EventsListTable, { type EventsListTableProps } from './EventsListTable';
import '../../i18n';

const eventRow = { uuid: 'e1', title: 'Stiftungsfest', date: '2026-08-01', time: '19:00', whole_day: false, location: 'Festsaal', created_by_id: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' };
const externalEventRow = { uuid: 'x1', title: 'Nachbarbesuch', location: 'Anderswo', date: '2026-08-05', time: '20:00', host: null, ics_source_id: null, ics_source_uuid: null, created_by_id: 1, updated_by_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' };
const birthdayRow = { uuid: 'u1', lastname: 'Muster', firstname: 'Max', date_of_birth: '1980-08-03', age: 46, twentyfifth_jubilee: null, fortieth_jubilee: null };

const server = setupServer(
  http.get('/api/v1/members/:uuid', () => HttpResponse.json({
    uuid: 'u1', email: 'max@example.test', firstname: 'Max', lastname: 'Muster',
    date_of_birth: '1980-08-03', created_at: '', updated_at: '', roles: [], can_edit: false, can_destroy: false,
    can_impersonate: false, editable_fields: [], mother_lodge: null, accepted_at: null, addresses: [],
  })),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderTable(props: Partial<EventsListTableProps> = {}) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/events']}>
        <Routes>
          <Route
            path="/events"
            element={(
              <EventsListTable
                events={[]}
                externalEvents={[]}
                birthdays={[]}
                from="2026-08-01"
                to="2026-08-31"
                isLoading={false}
                canUpdate={false}
                canDestroy={false}
                deleting={false}
                onDeleteEvent={vi.fn()}
                {...props}
              />
            )}
          />
          <Route path="/events/:uuid" element={<div>Event detail page</div>} />
          <Route path="/events/:uuid/edit" element={<div>Edit event page</div>} />
          <Route path="/external-events/:uuid" element={<div>External event detail page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EventsListTable', () => {
  it('renders internal, external, and birthday rows sorted by date', () => {
    renderTable({ events: [eventRow], externalEvents: [externalEventRow], birthdays: [birthdayRow] });
    const rows = screen.getAllByRole('row').slice(1); // drop the header row
    const titles = rows.map((r) => r.textContent);
    expect(titles[0]).toContain('Stiftungsfest'); // 2026-08-01
    expect(titles[1]).toContain('Max Muster'); // resolved to 2026-08-03
    expect(titles[2]).toContain('Nachbarbesuch'); // 2026-08-05
  });

  it('shows an empty state when there are no rows', () => {
    renderTable();
    expect(screen.getByText('Aktuell keine Termine.')).toBeInTheDocument();
  });

  it('navigates to the event detail page when an internal event row is clicked', async () => {
    renderTable({ events: [eventRow] });
    await userEvent.click(screen.getByText('Stiftungsfest'));
    expect(await screen.findByText('Event detail page')).toBeInTheDocument();
  });

  it('navigates to the external event detail page when an external event row is clicked', async () => {
    renderTable({ externalEvents: [externalEventRow] });
    await userEvent.click(screen.getByText('Nachbarbesuch'));
    expect(await screen.findByText('External event detail page')).toBeInTheDocument();
  });

  it('opens the birthday contact dialog when a birthday row is clicked, without navigating away', async () => {
    renderTable({ birthdays: [birthdayRow] });
    await userEvent.click(screen.getByText('Max Muster'));
    expect(await screen.findByText('max@example.test')).toBeInTheDocument();
    // Scoped to the row's own <td> (rather than a bare screen.getByText,
    // which would now ambiguously match both the still-present row and the
    // dialog's own <h2> title) - this is what actually proves the row
    // survived the click, i.e. that no navigation happened. Can't scope via
    // getByRole('table') instead: MUI's Dialog marks the rest of the page
    // aria-hidden while open, which role-based queries respect but
    // getByText/selector queries don't.
    expect(screen.getByText('Max Muster', { selector: 'td' })).toBeInTheDocument();
  });

  it('shows row-level edit/delete actions on internal-event rows only, when abilities allow it', () => {
    renderTable({ events: [eventRow], externalEvents: [externalEventRow], canUpdate: true, canDestroy: true });
    expect(screen.getAllByRole('button', { name: 'Bearbeiten' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Löschen' })).toHaveLength(1);
  });

  it('hides row-level actions for a read-only caller', () => {
    renderTable({ events: [eventRow], canUpdate: false, canDestroy: false });
    expect(screen.queryByRole('button', { name: 'Bearbeiten' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument();
  });

  it('navigates to the edit page (not the detail page) when the edit action is clicked, without triggering the row click', async () => {
    renderTable({ events: [eventRow], canUpdate: true });
    await userEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    expect(await screen.findByText('Edit event page')).toBeInTheDocument();
  });

  it('calls onDeleteEvent after a second confirming click, without navigating', async () => {
    const onDeleteEvent = vi.fn();
    renderTable({ events: [eventRow], canDestroy: true, onDeleteEvent });
    await userEvent.click(screen.getByRole('button', { name: 'Löschen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Diesen Termin wirklich löschen?' }));
    expect(onDeleteEvent).toHaveBeenCalledWith('e1');
    expect(screen.queryByText('Edit event page')).not.toBeInTheDocument();
    expect(screen.queryByText('Event detail page')).not.toBeInTheDocument();
  });
});
