import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { renderHook, waitFor, screen } from '@testing-library/react';
import { act, createElement, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  filterBirthdaysInRange,
  useEventsInRange,
  useCalendarExternalEvents,
  useCalendarIcsSources,
  useCalendarBirthdays,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  useRegisterEventParticipant,
  useRemoveEventParticipant,
} from './api';
import type { BirthdayListRow } from '../../api/types';
import { ToastProvider } from '../../notifications/ToastProvider';
import '../../i18n';

function row(uuid: string, date_of_birth: string | null): BirthdayListRow {
  return { uuid, lastname: 'L', firstname: 'F', date_of_birth, age: null, twentyfifth_jubilee: null, fortieth_jubilee: null };
}

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return createElement(QueryClientProvider, { client: queryClient }, children);
}

function toastWrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return createElement(QueryClientProvider, { client: queryClient }, createElement(ToastProvider, null, children));
}

describe('filterBirthdaysInRange', () => {
  it('includes a birthday whose month/day falls inside a normal (non-wraparound) window', () => {
    const rows = [row('u1', '1990-08-15')];
    expect(filterBirthdaysInRange(rows, '2026-08-01', '2026-11-10')).toEqual(rows);
  });

  it('excludes a birthday whose month/day falls outside the window', () => {
    const rows = [row('u1', '1990-05-01')];
    expect(filterBirthdaysInRange(rows, '2026-08-01', '2026-11-10')).toEqual([]);
  });

  it('handles a wraparound window: includes birthdays after `from` in December and before `to` in January/February, excludes ones in between', () => {
    const decemberBirthday = row('u1', '1975-12-20');
    const januaryBirthday = row('u2', '2001-01-15');
    const outOfRange = row('u3', '1988-06-01');
    const rows = [decemberBirthday, januaryBirthday, outOfRange];
    const result = filterBirthdaysInRange(rows, '2026-12-15', '2027-02-10');
    expect(result).toEqual([decemberBirthday, januaryBirthday]);
  });

  it('excludes a row with a null date_of_birth regardless of the window', () => {
    const rows = [row('u1', null)];
    expect(filterBirthdaysInRange(rows, '2026-01-01', '2026-12-31')).toEqual([]);
  });
});

describe('useEventsInRange', () => {
  it('fetches events for the given from/to range, all pages merged', async () => {
    server.use(
      http.get('/api/v1/events', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('from')).toBe('2026-02-01');
        expect(url.searchParams.get('to')).toBe('2026-02-28');
        return HttpResponse.json({ rows: [{ uuid: 'e1', title: 'Stiftungsfest', date: '2026-02-10', location: 'Saal', created_by_id: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }], row_count: 1 });
      }),
    );
    const { result } = renderHook(() => useEventsInRange('2026-02-01', '2026-02-28'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]!.title).toBe('Stiftungsfest');
  });
});

describe('useCalendarExternalEvents', () => {
  it('fetches external events for the given from/to range', async () => {
    server.use(
      http.get('/api/v1/external_events', ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get('from')).toBe('2026-02-01');
        expect(url.searchParams.get('to')).toBe('2026-02-28');
        return HttpResponse.json({ rows: [{ uuid: 'x1', title: 'Nachbarbesuch', location: 'Anderswo', date: '2026-02-12', host: null, ics_source_id: null, ics_source_uuid: null, created_by_id: 1, updated_by_id: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }], row_count: 1 });
      }),
    );
    const { result } = renderHook(() => useCalendarExternalEvents('2026-02-01', '2026-02-28'), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]!.ics_source_uuid).toBeNull();
  });
});

describe('useCalendarIcsSources', () => {
  it('calls the members-readable /options endpoint, not the admin-only /external_event_ics_sources', async () => {
    let requestedPath: string | undefined;
    server.use(
      http.get('/api/v1/external_event_ics_sources/options', ({ request }) => {
        requestedPath = new URL(request.url).pathname;
        return HttpResponse.json({ rows: [] });
      }),
    );
    const { result } = renderHook(() => useCalendarIcsSources(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(requestedPath).toBe('/api/v1/external_event_ics_sources/options');
  });

  it('fetches all ics sources (uuid+name only, no url/created_at)', async () => {
    server.use(
      http.get('/api/v1/external_event_ics_sources/options', () =>
        HttpResponse.json({ rows: [{ uuid: 's1', name: 'Nachbarloge' }] }),
      ),
    );
    const { result } = renderHook(() => useCalendarIcsSources(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.sources).toEqual([{ uuid: 's1', name: 'Nachbarloge' }]);
    expect(result.current.data?.truncated).toBe(false);
  });

  it('caps at 1000 sources and reports truncated when more exist', async () => {
    server.use(
      http.get('/api/v1/external_event_ics_sources/options', () => {
        const rows = Array.from({ length: 1001 }, (_, i) => ({ uuid: `s${i}`, name: `Source ${i}` }));
        return HttpResponse.json({ rows });
      }),
    );
    const { result } = renderHook(() => useCalendarIcsSources(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.sources).toHaveLength(1000);
    expect(result.current.data?.truncated).toBe(true);
  });

  it('does not report truncated when there are exactly 1000 sources', async () => {
    server.use(
      http.get('/api/v1/external_event_ics_sources/options', () => {
        const rows = Array.from({ length: 1000 }, (_, i) => ({ uuid: `s${i}`, name: `Source ${i}` }));
        return HttpResponse.json({ rows });
      }),
    );
    const { result } = renderHook(() => useCalendarIcsSources(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.sources).toHaveLength(1000);
    expect(result.current.data?.truncated).toBe(false);
  });
});

describe('events api toasts', () => {
  it('shows a success toast after creating an event', async () => {
    server.use(
      http.post('/api/v1/events', () =>
        HttpResponse.json({ uuid: 'e1', title: 'Stiftungsfest', date: '2026-02-10', location: 'Saal', created_by_id: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }),
      ),
    );
    const { result } = renderHook(() => useCreateEvent(), { wrapper: toastWrapper });
    act(() => {
      result.current.mutate({ title: 'Stiftungsfest', date: '2026-02-10', location: 'Saal' });
    });
    expect(await screen.findByText('Erstellt.')).toBeInTheDocument();
  });

  it('shows a success toast after updating an event', async () => {
    server.use(
      http.patch('/api/v1/events/:uuid', () =>
        HttpResponse.json({ uuid: 'e1', title: 'Stiftungsfest', date: '2026-02-10', location: 'Saal', created_by_id: 1, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' }),
      ),
    );
    const { result } = renderHook(() => useUpdateEvent('e1'), { wrapper: toastWrapper });
    act(() => {
      result.current.mutate({ title: 'Stiftungsfest', date: '2026-02-10', location: 'Saal' });
    });
    expect(await screen.findByText('Gespeichert.')).toBeInTheDocument();
  });

  it('shows a success toast after deleting an event', async () => {
    server.use(http.delete('/api/v1/events/:uuid', () => new HttpResponse(null, { status: 204 })));
    const { result } = renderHook(() => useDeleteEvent(), { wrapper: toastWrapper });
    act(() => {
      result.current.mutate('e1');
    });
    expect(await screen.findByText('Gelöscht.')).toBeInTheDocument();
  });

  it('shows a success toast naming the event after registering a participant', async () => {
    server.use(
      http.post('/api/v1/events/:uuid/participants', () =>
        HttpResponse.json({ user_uuid: 'u1', fullname: 'Max Muster', festive_board: false }),
      ),
    );
    const { result } = renderHook(() => useRegisterEventParticipant('e1', 'Stiftungsfest'), { wrapper: toastWrapper });
    act(() => {
      result.current.mutate({ user_uuid: 'u1' });
    });
    expect(await screen.findByText('Zur Veranstaltung Stiftungsfest angemeldet.')).toBeInTheDocument();
  });

  it('shows a success toast after removing an event participant', async () => {
    server.use(http.delete('/api/v1/events/:uuid/participants/:userUuid', () => new HttpResponse(null, { status: 204 })));
    const { result } = renderHook(() => useRemoveEventParticipant('e1'), { wrapper: toastWrapper });
    act(() => {
      result.current.mutate('u1');
    });
    expect(await screen.findByText('Gelöscht.')).toBeInTheDocument();
  });
});

describe('useCalendarBirthdays', () => {
  it('fetches all birthday-list rows across pages', async () => {
    server.use(
      http.get('/api/v1/members/birthday_list', ({ request }) => {
        const url = new URL(request.url);
        const page = url.searchParams.get('page');
        if (page === '0') {
          return HttpResponse.json({ rows: [{ uuid: 'u1', lastname: 'Muster', firstname: 'Max', date_of_birth: '1980-02-10', age: 46, twentyfifth_jubilee: null, fortieth_jubilee: null }], row_count: 1 });
        }
        return HttpResponse.json({ rows: [], row_count: 1 });
      }),
    );
    const { result } = renderHook(() => useCalendarBirthdays(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]!.firstname).toBe('Max');
  });
});
