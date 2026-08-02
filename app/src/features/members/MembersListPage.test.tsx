import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import MembersListPage from './MembersListPage';
import { AuthProvider } from '../../auth/AuthProvider';
import '../../i18n';

// Spied rather than left as a black box - same rationale as
// EventsListPage.test.tsx's identical mock: without inspecting the real
// autoTable() call args, a raw ISO date string leaking into the PDF body
// would still pass a test that only checks "a PDF downloaded." Calling
// through to the real autoTable keeps doc.output()/encryptPDF's behavior
// intact for the other tests in this file.
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

function memberRow(overrides: Partial<Record<string, unknown>> = {}) {
  return { uuid: 'm1', email: 'mm@example.org', firstname: 'Max', lastname: 'Mitglied', matriculation_number: 42, job_title: 'Zimmermann', mobile: '0170 1234567', can_edit: true, can_destroy: true, ...overrides };
}

const server = setupServer(
  http.get('/api/v1/me', () =>
    HttpResponse.json({ user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: { user: ['read', 'create', 'update', 'destroy'] } }),
  ),
  http.get('/api/v1/members', () => HttpResponse.json({ rows: [memberRow()], row_count: 1 })),
  http.delete('/api/v1/members/m1', () => new HttpResponse(null, { status: 204 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  // retry: false - without it, the fetch-error regression test below would
  // need to wait through React Query's default 3-retry backoff before
  // isError ever settles, several seconds past findByText's default timeout.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/members']}>
          <Routes>
            <Route path="/members" element={<MembersListPage />} />
            <Route path="/members/:uuid/edit" element={<div>Edit member page</div>} />
            <Route path="/members/phone-list" element={<div>Phone list page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('MembersListPage', () => {
  it('renders members returned by the API', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Max Mitglied')).toBeInTheDocument());
  });

  it('renders columns in the order Matrikelnummer, Name, Mobil, E-Mail, with no Beruf column', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Max Mitglied')).toBeInTheDocument());
    const headers = screen.getAllByRole('columnheader').map((el) => el.textContent);
    // Trailing '' is the unlabeled actions column.
    expect(headers).toEqual(['Matrikelnummer', 'Name', 'Mobil', 'E-Mail', '']);
  });

  it('renders the full name as "firstname lastname" (not "lastname, firstname") under the renamed Name column', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Max Mitglied')).toBeInTheDocument());
    expect(screen.queryByText('Mitglied, Max')).not.toBeInTheDocument();
  });

  it('shows the mobile number derived server-side in the Mobile column', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('0170 1234567')).toBeInTheDocument());
  });

  it('renders a blank Mobile cell (not an error) when the API reports no mobile number for a row', async () => {
    server.use(http.get('/api/v1/members', () => HttpResponse.json({ rows: [memberRow({ mobile: '' })], row_count: 1 })));
    renderPage();
    await waitFor(() => expect(screen.getByText('Max Mitglied')).toBeInTheDocument());
    expect(screen.queryByText('0170 1234567')).not.toBeInTheDocument();
  });

  it('renders mobile/email cells as tel:/mailto: links that do not trigger row navigation when clicked', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Max Mitglied')).toBeInTheDocument());
    const emailLink = screen.getByRole('link', { name: 'mm@example.org' });
    const phoneLink = screen.getByRole('link', { name: '0170 1234567' });
    expect(emailLink).toHaveAttribute('href', 'mailto:mm@example.org');
    expect(phoneLink).toHaveAttribute('href', 'tel:01701234567');
    await userEvent.click(phoneLink);
    expect(screen.getByText('Max Mitglied')).toBeInTheDocument(); // still on the list, did not navigate to the detail page
  });

  it('shows row-level edit/delete actions when the row reports can_edit/can_destroy true', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
  });

  it('surfaces a visible error instead of silently rendering an empty list when the members fetch fails', async () => {
    // Regression test: MembersListPage used to destructure only
    // `{ data, isLoading }` from useMembers, discarding useQuery's
    // error/isError - a failed fetch (e.g. the express-openapi-validator
    // 400 for `search=` regression fixed alongside this test) rendered as
    // an ordinary, silent "no rows" empty grid instead of surfacing that
    // the request actually failed.
    server.use(http.get('/api/v1/members', () => HttpResponse.json({ error: 'bad_request', detail: "Empty value found for query parameter 'search'" }, { status: 400 })));
    renderPage();
    expect(await screen.findByText(/Die Mitgliederliste konnte nicht geladen werden\./)).toBeInTheDocument();
  });

  it('hides row-level actions when the row reports can_edit/can_destroy false, even if class-level abilities allow it', async () => {
    server.use(http.get('/api/v1/members', () => HttpResponse.json({ rows: [memberRow({ can_edit: false, can_destroy: false })], row_count: 1 })));
    renderPage();
    await waitFor(() => expect(screen.getByText('Max Mitglied')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Bearbeiten' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument();
  });

  it('navigates to the edit page without navigating to the detail page', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    await waitFor(() => expect(screen.getByText('Edit member page')).toBeInTheDocument());
  });

  it('shows the shared members navigation tabs, with Members selected, and navigates via the phone list tab', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Mitglieder' })).toBeInTheDocument());
    expect(screen.getByRole('tab', { name: 'Mitglieder' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Telefonliste' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Geburtstagsliste' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Beamtenrat' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Telefonliste' }));
    await waitFor(() => expect(screen.getByText('Phone list page')).toBeInTheDocument());
  });

  it('deletes the member after a second confirming click', async () => {
    let deleteCalled = false;
    server.use(http.delete('/api/v1/members/m1', () => { deleteCalled = true; return new HttpResponse(null, { status: 204 }); }));
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Löschen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Dieses Mitglied wirklich löschen?' }));
    await waitFor(() => expect(deleteCalled).toBe(true));
  });

  it('shows CSV and vCard export buttons, builds and downloads a CSV client-side', async () => {
    server.use(
      http.get('/api/v1/members/csv_export_data', () =>
        HttpResponse.json({
          rows: [{ uuid: 'u-1', lastname: 'Muster', firstname: 'Max', fullname: 'Max Muster', email: 'max@example.org', date_of_birth: null, addresses: [] }],
          row_count: 1,
        }),
      ),
    );
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'CSV exportieren' }));
    await waitFor(() => expect(createObjectURLSpy).toHaveBeenCalled());
    const blobArg = createObjectURLSpy.mock.calls[0]![0] as Blob;
    expect(blobArg.type).toContain('csv');
    // Exact leading segment, not just substring presence - locks the
    // lastname/firstname/email column separators to the legacy CSV
    // format (semicolon-delimited), so a missing separator regresses loudly.
    expect(await blobArg.text()).toContain('Muster; Max;max@example.org;');
    createObjectURLSpy.mockRestore();
  });

  it('builds and downloads a vCard client-side, including address/phone details', async () => {
    server.use(
      http.get('/api/v1/members/csv_export_data', () =>
        HttpResponse.json({
          rows: [{
            uuid: 'u-1', lastname: 'Muster', firstname: 'Max', fullname: 'Max Muster', email: 'max@example.org', date_of_birth: '1980-01-01',
            addresses: [{
              type_of_address: 0, vcf_type: 'HOME', street1: 'Musterstr. 1', street2: null, street3: null, street: 'Musterstr. 1',
              zip: '12345', city: 'Musterstadt', phone: '0123456', fax: null, mobile: '0170123456', email: 'max@example.org', remarks: null,
            }],
          }],
          row_count: 1,
        }),
      ),
    );
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'vCard exportieren' }));
    await waitFor(() => expect(createObjectURLSpy).toHaveBeenCalled());
    const blobArg = createObjectURLSpy.mock.calls[0]![0] as Blob;
    expect(blobArg.type).toContain('vcard');
    const text = await blobArg.text();
    expect(text).toContain('BEGIN:VCARD');
    expect(text).toContain('FN:Max Muster');
    expect(text).toContain('TEL;TYPE=voice,HOME:0123456');
    expect(text).toContain('ADR;TYPE=postal,parcel,HOME:;;Musterstr. 1;Musterstadt;;12345;');
    expect(text).toContain('END:VCARD');
    createObjectURLSpy.mockRestore();
  });

  it('paginates through all csv_export_data pages before building the export', async () => {
    const requestedPages: number[] = [];
    server.use(
      http.get('/api/v1/members/csv_export_data', ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page'));
        requestedPages.push(page);
        if (page === 0) {
          return HttpResponse.json({
            rows: [{ uuid: 'u-1', lastname: 'Erste', firstname: 'A', fullname: 'A Erste', email: 'a@example.org', date_of_birth: null, addresses: [] }],
            row_count: 2,
          });
        }
        return HttpResponse.json({
          rows: [{ uuid: 'u-2', lastname: 'Zweite', firstname: 'B', fullname: 'B Zweite', email: 'b@example.org', date_of_birth: null, addresses: [] }],
          row_count: 2,
        });
      }),
    );
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'CSV exportieren' }));
    await waitFor(() => expect(createObjectURLSpy).toHaveBeenCalled());
    expect(requestedPages).toEqual([0, 1]);
    const text = await (createObjectURLSpy.mock.calls[0]![0] as Blob).text();
    expect(text).toContain('Erste');
    expect(text).toContain('Zweite');
    createObjectURLSpy.mockRestore();
  });

  it('prompts for a password, rejects a short one, then builds and downloads an encrypted PDF', async () => {
    server.use(
      http.get('/api/v1/members/export_data', () =>
        HttpResponse.json({
          rows: [{ uuid: 'u-1', matriculation_number: 1, fullname_with_title: 'Max Muster', job_title: '', num_degree: 1, entered_apprentice_since: null, accepted_at: null, date_of_birth: null, business_address: null, private_address: null, positions: [] }],
          row_count: 1,
        }),
      ),
      http.post('/api/v1/members/record_export', () => new HttpResponse(null, { status: 204 })),
    );
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'PDF exportieren' }));
    await user.type(await screen.findByLabelText('Passwort'), 'ab');
    await user.click(screen.getByRole('button', { name: 'PDF erzeugen' }));
    expect(await screen.findByText('Das Passwort muss mindestens 5 Zeichen lang sein')).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Passwort'));
    await user.type(screen.getByLabelText('Passwort'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'PDF erzeugen' }));
    await waitFor(() => expect(createObjectURLSpy).toHaveBeenCalled(), { timeout: 5000 });
    // Verify encryptPDF actually ran against real PDF bytes, not just that
    // a download was triggered - a silently-failing encryption call (e.g.
    // returning the input unmodified, or empty bytes) would still satisfy
    // the createObjectURL assertion above.
    const blob = createObjectURLSpy.mock.calls[0]![0] as Blob;
    const text = await blob.text();
    expect(text).toContain('%PDF');
    expect(text).toContain('/Encrypt');
    createObjectURLSpy.mockRestore();
  });

  it('surfaces a visible error when record_export fails, without hiding that the download succeeded', async () => {
    // Regression test (whole-branch review finding): downloadMembersListPdf
    // used to call recordExport fire-and-forget after triggerDownload - a
    // failed audit-log call (e.g. a network blip) left the user with an
    // already-downloaded, decrypted-viewable PDF but no FileDownload row,
    // completely silently (the button's onClick is `() => void
    // handleGeneratePdf()`). Assert BOTH that the new error message becomes
    // visible AND that the download still happened - the fix must surface
    // the failure without blocking or hiding the fact that the file
    // downloaded successfully.
    server.use(
      http.get('/api/v1/members/export_data', () =>
        HttpResponse.json({
          rows: [{ uuid: 'u-1', matriculation_number: 1, fullname_with_title: 'Max Muster', job_title: '', num_degree: 1, entered_apprentice_since: null, accepted_at: null, date_of_birth: null, business_address: null, private_address: null, positions: [] }],
          row_count: 1,
        }),
      ),
      http.post('/api/v1/members/record_export', () => new HttpResponse(null, { status: 500 })),
    );
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole('button', { name: 'PDF exportieren' }));
    await user.type(await screen.findByLabelText('Passwort'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'PDF erzeugen' }));

    expect(await screen.findByText(
      'Die PDF-Datei wurde heruntergeladen, aber die Protokollierung ist fehlgeschlagen. Bitte informieren Sie einen Administrator.',
    )).toBeInTheDocument();
    expect(createObjectURLSpy).toHaveBeenCalled();
    createObjectURLSpy.mockRestore();
  });

  it('formats degree/accepted/birth dates in the exported PDF instead of raw ISO strings', async () => {
    autoTableCalls.length = 0;
    server.use(
      http.get('/api/v1/members/export_data', () =>
        HttpResponse.json({
          rows: [{
            uuid: 'u-1', matriculation_number: 1, fullname_with_title: 'Max Muster', job_title: '', num_degree: 3,
            entered_apprentice_since: '2010-11-20', accepted_at: '2015-03-01', date_of_birth: '1980-01-01',
            business_address: null, private_address: null, positions: [],
          }],
          row_count: 1,
        }),
      ),
      http.post('/api/v1/members/record_export', () => new HttpResponse(null, { status: 204 })),
    );
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    renderPage();
    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'PDF exportieren' }));
    await user.type(await screen.findByLabelText('Passwort'), 'secret123');
    await user.click(screen.getByRole('button', { name: 'PDF erzeugen' }));
    await waitFor(() => expect(createObjectURLSpy).toHaveBeenCalled(), { timeout: 5000 });

    expect(autoTableCalls).toHaveLength(1);
    const { body } = autoTableCalls[0] as { body: string[][] };
    const flatRow = body[0]!.join(' ');
    const expectedEntered = new Date('2010-11-20T00:00:00').toLocaleString('de-DE', { dateStyle: 'medium' });
    const expectedAccepted = new Date('2015-03-01T00:00:00').toLocaleString('de-DE', { dateStyle: 'medium' });
    const expectedBirth = new Date('1980-01-01T00:00:00').toLocaleString('de-DE', { dateStyle: 'medium' });
    expect(flatRow).toContain(expectedEntered);
    expect(flatRow).toContain(expectedAccepted);
    expect(flatRow).toContain(expectedBirth);
    expect(flatRow).not.toContain('2010-11-20');
    expect(flatRow).not.toContain('2015-03-01');
    expect(flatRow).not.toContain('1980-01-01');
    createObjectURLSpy.mockRestore();
  });
});

describe('MembersListPage mobile view', () => {
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

  it('renders a name-only accordion row per member instead of the data grid', async () => {
    const restore = forceMobile();
    try {
      renderPage();
      await waitFor(() => expect(screen.getByText('Max Mitglied')).toBeInTheDocument());
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
      expect(screen.queryByText('mm@example.org')).not.toBeInTheDocument(); // collapsed - no detail fields yet
    } finally {
      restore();
    }
  });

  it('lazily fetches and shows full member details only once its accordion row is expanded', async () => {
    const restore = forceMobile();
    try {
      server.use(http.get('/api/v1/members/m1', () => HttpResponse.json({
        uuid: 'm1', email: 'mm@example.org', firstname: 'Max', lastname: 'Mitglied',
        matriculation_number: 42, job_title: 'Zimmermann', date_of_birth: '1980-01-01',
        created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
        addresses: [], roles: [], can_edit: true, can_destroy: true, can_impersonate: false, editable_fields: [],
      })));
      renderPage();
      await waitFor(() => expect(screen.getByText('Max Mitglied')).toBeInTheDocument());
      expect(screen.queryByText('mm@example.org')).not.toBeInTheDocument();

      await userEvent.click(screen.getByText('Max Mitglied'));
      expect(await screen.findByText('mm@example.org')).toBeInTheDocument();
      expect(screen.getByText('Zimmermann')).toBeInTheDocument();
    } finally {
      restore();
    }
  });

  it('shows a pagination control only when there is more than one page, and paging advances the request', async () => {
    const restore = forceMobile();
    try {
      const requestedPages: number[] = [];
      server.use(http.get('/api/v1/members', ({ request }) => {
        const url = new URL(request.url);
        requestedPages.push(Number(url.searchParams.get('page')));
        return HttpResponse.json({ rows: [memberRow()], row_count: 30 }); // pageSize 25 -> 2 pages
      }));
      renderPage();
      await waitFor(() => expect(screen.getByText('Max Mitglied')).toBeInTheDocument());
      expect(screen.getByRole('navigation')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: /2/ }));
      await waitFor(() => expect(requestedPages).toContain(1));
    } finally {
      restore();
    }
  });

  it('does not show a pagination control when there is only one page', async () => {
    const restore = forceMobile();
    try {
      renderPage();
      await waitFor(() => expect(screen.getByText('Max Mitglied')).toBeInTheDocument());
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    } finally {
      restore();
    }
  });
} );
