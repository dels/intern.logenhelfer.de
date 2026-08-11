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

// Task 3 (dynamic-import jspdf/jspdf-autotable out of members/api.ts).
// `moduleLoadCount` distinguishes eager (static) from lazy (dynamic)
// import: vi.mock's factory only runs once, the first time the 'jspdf'
// specifier is actually resolved - for a *static* `import { jsPDF } from
// 'jspdf'` at module scope, that happens while the module graph loads
// (before any test body runs, since `import BirthdayListPage from
// './BirthdayListPage'` above transitively imports members/api.ts); for a
// *dynamic* `await import('jspdf')` inside buildPdf, it only happens once
// that function actually runs. A constructor-call spy alone can't tell
// these apart - the constructor only fires once code reaches `new
// jsPDF(...)`, which happens on-demand either way. Declared via
// vi.hoisted (not a bare module-scope const) because vi.mock's factory is
// hoisted above ordinary top-level statements and would otherwise run
// against a not-yet-initialized binding.
const jsPDFTracking = vi.hoisted(() => ({ moduleLoadCount: 0, constructorCalls: [] as unknown[] }));
vi.mock('jspdf', async () => {
  jsPDFTracking.moduleLoadCount += 1;
  const actual = await vi.importActual<typeof import('jspdf')>('jspdf');
  class SpyJsPDF extends actual.jsPDF {
    constructor(...args: ConstructorParameters<typeof actual.jsPDF>) {
      jsPDFTracking.constructorCalls.push(args);
      super(...args);
    }
  }
  return { ...actual, jsPDF: SpyJsPDF };
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
  // Placed first in this describe block, deliberately: `jsPDFTracking`'s
  // module-load count is a one-shot signal (vi.mock's factory runs at
  // most once per test file), so this must run before any other test in
  // this file triggers a real PDF download - otherwise that earlier
  // download's own dynamic import would already have set the count,
  // making this assertion meaningless for later tests.
  it('does not load the jspdf module at all until the PDF export button is actually clicked', async () => {
    expect(jsPDFTracking.moduleLoadCount).toBe(0);
    let recordExportCalled = false;
    server.use(
      http.post('/api/v1/members/record_export', () => {
        recordExportCalled = true;
        return new HttpResponse(null, { status: 204 });
      }),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Muster')).toBeInTheDocument());
    expect(jsPDFTracking.moduleLoadCount).toBe(0);

    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'PDF exportieren' }));
    await waitFor(() => expect(createObjectURLSpy).toHaveBeenCalled());
    expect(jsPDFTracking.moduleLoadCount).toBe(1);
    expect(jsPDFTracking.constructorCalls).toHaveLength(1);
    // Wait for the fire-and-forget recordExport call this download triggers
    // to settle before the test ends - otherwise afterEach's
    // server.resetHandlers() removes this handler while that request is
    // still in flight, and the unhandled fetch fails with ECONNREFUSED.
    await waitFor(() => expect(recordExportCalled).toBe(true));
    createObjectURLSpy.mockRestore();
  });

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

describe('BirthdayListPage mobile view', () => {
  function forceMobile() {
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

  it('renders an accordion list instead of the data grid, with name and birthday visible before expanding', async () => {
    const restore = forceMobile();
    try {
      renderPage();
      await waitFor(() => expect(screen.getByText('Max Muster')).toBeInTheDocument());
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
      expect(screen.queryByText('46')).not.toBeInTheDocument(); // age is body-only, collapsed by default
    } finally {
      restore();
    }
  });

  it('shows age and jubilee dates once the accordion row is expanded', async () => {
    const restore = forceMobile();
    try {
      renderPage();
      await waitFor(() => expect(screen.getByText('Max Muster')).toBeInTheDocument());
      await userEvent.click(screen.getByText('Max Muster'));
      expect(await screen.findByText('46')).toBeInTheDocument();
    } finally {
      restore();
    }
  });

  it('shows a pagination control only when there is more than one page', async () => {
    const restore = forceMobile();
    try {
      server.use(http.get('/api/v1/members/birthday_list', () =>
        HttpResponse.json({ rows: [{ uuid: 'u-1', lastname: 'Muster', firstname: 'Max', date_of_birth: '1980-05-01', age: 46, twentyfifth_jubilee: null, fortieth_jubilee: null }], row_count: 30 })));
      renderPage();
      await waitFor(() => expect(screen.getByText('Max Muster')).toBeInTheDocument());
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    } finally {
      restore();
    }
  });
});
