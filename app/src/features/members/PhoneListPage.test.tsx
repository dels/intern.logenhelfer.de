import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import PhoneListPage from './PhoneListPage';
import '../../i18n';

const server = setupServer(
  http.get('/api/v1/members/phone_list', () =>
    HttpResponse.json({ rows: [{ uuid: 'u-1', lastname: 'Muster', firstname: 'Max', phone: '030-1', fax: '', mobile: '' }], row_count: 1 }),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/members/phone-list']}>
        <PhoneListPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('PhoneListPage', () => {
  it('renders a member with their phone number', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Muster')).toBeInTheDocument());
    expect(screen.getByText('030-1')).toBeInTheDocument();
  });

  it('renders phone and mobile as clickable tel: links', async () => {
    server.use(
      http.get('/api/v1/members/phone_list', () =>
        HttpResponse.json({ rows: [{ uuid: 'u-1', lastname: 'Muster', firstname: 'Max', phone: '030-1', fax: '', mobile: '0170-9' }], row_count: 1 }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Muster')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: '030-1' })).toHaveAttribute('href', 'tel:030-1');
    expect(screen.getByRole('link', { name: '0170-9' })).toHaveAttribute('href', 'tel:0170-9');
  });

  it('does not render a Fax column', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Muster')).toBeInTheDocument());
    expect(screen.queryByRole('columnheader', { name: /Fax/ })).not.toBeInTheDocument();
  });

  it('requests the default sort (by lastname) on first load', async () => {
    let lastSort: string | null = null;
    server.use(
      http.get('/api/v1/members/phone_list', ({ request }) => {
        lastSort = new URL(request.url).searchParams.get('sort');
        return HttpResponse.json({ rows: [], row_count: 0 });
      }),
    );
    renderPage();
    await waitFor(() => expect(lastSort).toBe('lastname'));
  });

  it('re-requests with the reversed sort param when the Telefon column header is clicked', async () => {
    let lastSort: string | null = null;
    server.use(
      http.get('/api/v1/members/phone_list', ({ request }) => {
        lastSort = new URL(request.url).searchParams.get('sort');
        return HttpResponse.json({ rows: [{ uuid: 'u-1', lastname: 'Muster', firstname: 'Max', phone: '030-1', fax: '', mobile: '' }], row_count: 1 });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Muster')).toBeInTheDocument());

    await user.click(screen.getByRole('columnheader', { name: /^Telefon/ }));
    await waitFor(() => expect(lastSort).toBe('phone'));

    await user.click(screen.getByRole('columnheader', { name: /^Telefon/ }));
    await waitFor(() => expect(lastSort).toBe('-phone'));
  });

  it('builds and downloads a PDF client-side, recording the export as JSON', async () => {
    let recordedBody: unknown;
    server.use(
      http.get('/api/v1/members/phone_list', () =>
        HttpResponse.json({ rows: [{ uuid: 'u-1', lastname: 'Muster', firstname: 'Max', phone: '030-1', fax: '', mobile: '' }], row_count: 1 }),
      ),
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
    // server actually parsed `{ kind: 'phone_list' }` as JSON.
    await waitFor(() => expect(recordedBody).toEqual({ kind: 'phone_list' }));
    createObjectURLSpy.mockRestore();
  });

  it('paginates through all phone_list pages before building the PDF', async () => {
    const requestedPages: number[] = [];
    server.use(
      http.get('/api/v1/members/phone_list', ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page'));
        requestedPages.push(page);
        if (page === 0) {
          return HttpResponse.json({ rows: [{ uuid: 'u-1', lastname: 'Erste', firstname: 'A', phone: '1', fax: '', mobile: '' }], row_count: 2 });
        }
        return HttpResponse.json({ rows: [{ uuid: 'u-2', lastname: 'Zweite', firstname: 'B', phone: '2', fax: '', mobile: '' }], row_count: 2 });
      }),
      http.post('/api/v1/members/record_export', () => new HttpResponse(null, { status: 204 })),
    );
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock');
    renderPage();
    // Wait for the on-screen DataTable's own page-0 fetch (via usePhoneList)
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

  it('shows the shared members navigation tabs, with Phone list selected', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('tab', { name: 'Telefonliste' })).toBeInTheDocument());
    expect(screen.getByRole('tab', { name: 'Telefonliste' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Mitglieder' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Geburtstagsliste' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Beamtenrat' })).toBeInTheDocument();
  });
});

describe('PhoneListPage mobile view', () => {
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

  it('renders an accordion list instead of the data grid, with only the name visible before expanding', async () => {
    const restore = forceMobile();
    try {
      renderPage();
      await waitFor(() => expect(screen.getByText('Max Muster')).toBeInTheDocument());
      expect(screen.queryByRole('grid')).not.toBeInTheDocument();
      expect(screen.queryByText('030-1')).not.toBeInTheDocument();
    } finally {
      restore();
    }
  });

  it('shows the phone number once the accordion row is expanded', async () => {
    const restore = forceMobile();
    try {
      renderPage();
      await waitFor(() => expect(screen.getByText('Max Muster')).toBeInTheDocument());
      await userEvent.click(screen.getByText('Max Muster'));
      expect(await screen.findByRole('link', { name: '030-1' })).toBeInTheDocument();
    } finally {
      restore();
    }
  });

  it('shows a pagination control only when there is more than one page', async () => {
    const restore = forceMobile();
    try {
      server.use(http.get('/api/v1/members/phone_list', () =>
        HttpResponse.json({ rows: [{ uuid: 'u-1', lastname: 'Muster', firstname: 'Max', phone: '030-1', fax: '', mobile: '' }], row_count: 30 })));
      renderPage();
      await waitFor(() => expect(screen.getByText('Max Muster')).toBeInTheDocument());
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    } finally {
      restore();
    }
  });
});
