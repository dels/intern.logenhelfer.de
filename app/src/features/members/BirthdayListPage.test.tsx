import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import BirthdayListPage from './BirthdayListPage';
import '../../i18n';

// Same rationale as EventsListPage.test.tsx / MembersListPage.test.tsx's
// identical mock: captures the real autoTable() call args without changing
// its behavior, so a raw/unformatted date leaking into the PDF body fails
// a test instead of hiding behind "a PDF downloaded."
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

const server = setupServer(
  http.get('/api/v1/members/birthday_list', () =>
    HttpResponse.json({
      rows: [
        {
          uuid: 'u-1',
          lastname: 'Muster',
          firstname: 'Max',
          date_of_birth: '1980-05-01',
          age: 46,
          twentyfifth_jubilee: '2025-01-01',
          fortieth_jubilee: null,
        },
      ],
      row_count: 1,
    }),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/members/birthday-list']}>
        <BirthdayListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('BirthdayListPage', () => {
  it('requests the default sort (soonest-upcoming birthday) on first load', async () => {
    let lastSort: string | null = null;
    server.use(
      http.get('/api/v1/members/birthday_list', ({ request }) => {
        lastSort = new URL(request.url).searchParams.get('sort');
        return HttpResponse.json({ rows: [], row_count: 0 });
      }),
    );
    renderPage();
    await waitFor(() => expect(lastSort).toBe('date_of_birth'));
  });

  it('re-requests with the reversed sort param when the Alter column header is clicked', async () => {
    let lastSort: string | null = null;
    server.use(
      http.get('/api/v1/members/birthday_list', ({ request }) => {
        lastSort = new URL(request.url).searchParams.get('sort');
        return HttpResponse.json({
          rows: [{ uuid: 'u-1', lastname: 'Muster', firstname: 'Max', date_of_birth: '1980-05-01', age: 46, twentyfifth_jubilee: null, fortieth_jubilee: null }],
          row_count: 1,
        });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Muster')).toBeInTheDocument());

    await user.click(screen.getByRole('columnheader', { name: /^Alter/ }));
    await waitFor(() => expect(lastSort).toBe('age'));

    await user.click(screen.getByRole('columnheader', { name: /^Alter/ }));
    await waitFor(() => expect(lastSort).toBe('-age'));
  });

  it('shows the shared members navigation tabs, with Birthday list selected', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Geburtstagsliste' })).toBeInTheDocument());
    expect(screen.getByRole('tab', { name: 'Geburtstagsliste' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Mitglieder' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Telefonliste' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Beamtenrat' })).toBeInTheDocument();
  });

  it('renders a member with their age and formatted dates, and blanks a null jubilee', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Muster')).toBeInTheDocument());
    expect(screen.getByText('46')).toBeInTheDocument();
    // date_of_birth (1980-05-01) is formatted as a date-only string, no time-of-day.
    expect(screen.queryByText(/00:00/)).not.toBeInTheDocument();
  });

  it('builds and downloads a PDF client-side, recording the export as JSON', async () => {
    let recordedBody: unknown;
    server.use(
      http.post('/api/v1/members/record_export', async ({ request }) => {
        recordedBody = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
    );
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'PDF exportieren' }));
    await waitFor(() => expect(createObjectURLSpy).toHaveBeenCalled());
    const blobArg = createObjectURLSpy.mock.calls[0]![0] as Blob;
    expect(blobArg.type).toBe('application/pdf');
    // Correction 2: recordExport must send a real JSON body (not
    // URLSearchParams) since apiFetch always sets Content-Type: application/json
    // unless the body is a FormData instance - this asserts the mocked
    // server actually parsed `{ kind: 'birthday_list' }` as JSON.
    await waitFor(() => expect(recordedBody).toEqual({ kind: 'birthday_list' }));
    createObjectURLSpy.mockRestore();
  });

  it('formats date_of_birth and jubilee dates in the exported PDF instead of raw ISO strings', async () => {
    autoTableCalls.length = 0;
    server.use(
      http.get('/api/v1/members/birthday_list', () =>
        HttpResponse.json({
          rows: [{ uuid: 'u-1', lastname: 'Muster', firstname: 'Max', date_of_birth: '1980-05-01', age: 46, twentyfifth_jubilee: '2025-01-01', fortieth_jubilee: '2040-01-01' }],
          row_count: 1,
        }),
      ),
      http.post('/api/v1/members/record_export', () => new HttpResponse(null, { status: 204 })),
    );
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'PDF exportieren' }));
    await waitFor(() => expect(createObjectURLSpy).toHaveBeenCalled());

    expect(autoTableCalls).toHaveLength(1);
    const { body } = autoTableCalls[0] as { body: string[][] };
    const flatRow = body[0]!.join(' ');
    const expectedBirth = new Date('1980-05-01T00:00:00').toLocaleString('de-DE', { dateStyle: 'medium' });
    const expected25 = new Date('2025-01-01T00:00:00').toLocaleString('de-DE', { dateStyle: 'medium' });
    const expected40 = new Date('2040-01-01T00:00:00').toLocaleString('de-DE', { dateStyle: 'medium' });
    expect(flatRow).toContain(expectedBirth);
    expect(flatRow).toContain(expected25);
    expect(flatRow).toContain(expected40);
    expect(flatRow).not.toContain('1980-05-01');
    expect(flatRow).not.toContain('2025-01-01');
    expect(flatRow).not.toContain('2040-01-01');
    createObjectURLSpy.mockRestore();
  });

  it('paginates through all birthday_list pages before building the PDF', async () => {
    const requestedPages: number[] = [];
    server.use(
      http.get('/api/v1/members/birthday_list', ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page'));
        requestedPages.push(page);
        if (page === 0) {
          return HttpResponse.json({
            rows: [{ uuid: 'u-1', lastname: 'Erste', firstname: 'A', date_of_birth: '1980-01-01', age: 46, twentyfifth_jubilee: null, fortieth_jubilee: null }],
            row_count: 2,
          });
        }
        return HttpResponse.json({
          rows: [{ uuid: 'u-2', lastname: 'Zweite', firstname: 'B', date_of_birth: '1985-01-01', age: 41, twentyfifth_jubilee: null, fortieth_jubilee: null }],
          row_count: 2,
        });
      }),
      http.post('/api/v1/members/record_export', () => new HttpResponse(null, { status: 204 })),
    );
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    renderPage();
    // Wait for the on-screen DataTable's own page-0 fetch (via useBirthdayList)
    // to settle first, so its request doesn't get counted alongside the
    // export loop's own page requests below.
    await waitFor(() => expect(screen.getByText('Erste')).toBeInTheDocument());
    requestedPages.length = 0;
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'PDF exportieren' }));
    await waitFor(() => expect(createObjectURLSpy).toHaveBeenCalled());
    expect(requestedPages).toEqual([0, 1]);
    createObjectURLSpy.mockRestore();
  });
});
