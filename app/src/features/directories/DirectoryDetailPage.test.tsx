import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse, delay } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import DirectoryDetailPage from './DirectoryDetailPage';
import { AuthProvider } from '../../auth/AuthProvider';
import { BreadcrumbProvider } from '../../layouts/BreadcrumbContext';
import Breadcrumbs from '../../layouts/Breadcrumbs';
import '../../i18n';

function directoryFixture(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    slug: 'protokolle', name: 'Protokolle', description: 'Sitzungsprotokolle',
    category_slug: 'finanzen', category_name: 'Finanzen', role_ids: [1],
    ...overrides,
  };
}

const server = setupServer(
  http.get('/api/v1/me', () =>
    HttpResponse.json({ user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: { directory: ['read', 'create', 'update', 'destroy'] } }),
  ),
  http.get('/api/v1/directories/protokolle', () => HttpResponse.json(directoryFixture())),
  http.delete('/api/v1/directories/protokolle', () => new HttpResponse(null, { status: 204 })),
  http.get('/api/v1/attached_files', () => HttpResponse.json({ rows: [], row_count: 0 })),
  http.get('/api/v1/roles', () =>
    HttpResponse.json({ rows: [{ id: 1, name: 'MasterMason', display_name: 'Meister', email: null }] }),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  // Guarantees any vi.spyOn from the download-button test is torn down even
  // if an assertion above it throws mid-test - a leaked spy on
  // HTMLAnchorElement.prototype.click/URL.createObjectURL would otherwise
  // silently corrupt whichever test runs next.
  vi.restoreAllMocks();
});
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/categories/finanzen/directories/protokolle']}>
          <BreadcrumbProvider>
            <Breadcrumbs />
            <Routes>
              <Route path="/categories/:categorySlug/directories/:slug" element={<DirectoryDetailPage />} />
              <Route path="/categories/:slug" element={<div>Category page</div>} />
            </Routes>
          </BreadcrumbProvider>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('DirectoryDetailPage', () => {
  it('renders the directory name, description, and category link', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Protokolle')).toBeInTheDocument());
    expect(screen.getByText('Sitzungsprotokolle')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finanzen' })).toBeInTheDocument();
  });

  it('shows which groups can see this directory', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Sichtbar für: Meister')).toBeInTheDocument());
  });

  it('registers the correct breadcrumb trail', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Protokolle')).toBeInTheDocument());
    const breadcrumbNav = screen.getByLabelText('breadcrumb');
    const breadcrumbLinks = within(breadcrumbNav);
    // Kategorien (root) link
    expect(breadcrumbLinks.getByRole('link', { name: 'Kategorien' })).toHaveAttribute('href', '/categories');
    // Category link
    expect(breadcrumbLinks.getByRole('link', { name: 'Finanzen' })).toHaveAttribute('href', '/categories/finanzen');
    // Current page (directory name, should not be a link)
    expect(breadcrumbLinks.getByText('Protokolle')).toBeInTheDocument();
  });

  it('shows edit/delete controls when abilities.directory allows them', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
  });

  it('hides edit/delete controls for a read-only council member', async () => {
    server.use(
      http.get('/api/v1/me', () =>
        HttpResponse.json({ user: { id: 2, email: 'c@d.de', firstname: 'A', lastname: 'B' }, abilities: { directory: ['read'] } }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Protokolle')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Bearbeiten' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument();
  });

  it('deletes the directory and navigates back to the category after confirming', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Löschen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Wirklich löschen?' }));
    await waitFor(() => expect(screen.getByText('Category page')).toBeInTheDocument());
  });

  it('shows an empty-state message when the directory has no files', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Keine Dateien vorhanden.')).toBeInTheDocument());
  });

  it('lists files with their size and downloads the file when the row is clicked', async () => {
    server.use(
      http.get('/api/v1/attached_files', () => HttpResponse.json({
        rows: [{ uuid: 'file-1', filename: 'protokoll.pdf', content_type: 'application/pdf', content_length: 2048 }],
        row_count: 1,
      })),
      http.get('/api/v1/attached_files/file-1/download', () => new HttpResponse('file contents', {
        headers: { 'Content-Type': 'application/pdf' },
      })),
    );
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    renderPage();

    await waitFor(() => expect(screen.getByText('protokoll.pdf')).toBeInTheDocument());
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();

    await userEvent.click(screen.getByText('protokoll.pdf'));

    await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1));
    const clickedAnchor = clickSpy.mock.contexts[0] as HTMLAnchorElement;
    expect(clickedAnchor.download).toBe('protokoll.pdf');
    // There is no file detail page any more - the row itself stays put.
    expect(screen.getByText('protokoll.pdf')).toBeInTheDocument();
  });

  it('shows the drop zone when abilities.attached_file allows create', async () => {
    server.use(
      http.get('/api/v1/me', () =>
        HttpResponse.json({
          user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' },
          abilities: { directory: ['read'], attached_file: ['create'] },
        }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Dateien hierher ziehen oder klicken zum Auswählen')).toBeInTheDocument());
  });

  it('hides the drop zone when abilities.attached_file does not allow create', async () => {
    server.use(
      http.get('/api/v1/me', () =>
        HttpResponse.json({
          user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' },
          abilities: { directory: ['read'] },
        }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Protokolle')).toBeInTheDocument());
    expect(screen.queryByText('Dateien hierher ziehen oder klicken zum Auswählen')).not.toBeInTheDocument();
  });

  it('dropping a file on the drop zone uploads it using the directory\'s own role_ids, and the new file appears in the list', async () => {
    server.use(
      http.get('/api/v1/me', () =>
        HttpResponse.json({
          user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' },
          abilities: { directory: ['read'], attached_file: ['create'] },
        }),
      ),
    );
    let capturedBody: FormData | undefined;
    let uploaded = false;
    server.use(
      http.post('/api/v1/attached_files', async ({ request }) => {
        capturedBody = await request.formData();
        uploaded = true;
        return HttpResponse.json({
          uuid: 'file-1', filename: 'neu.pdf', content_type: 'application/pdf', content_length: 5,
          directory_slug: 'protokolle', directory_name: 'Protokolle', category_slug: 'finanzen', category_name: 'Finanzen',
          uploader_email: 'a@b.de', role_ids: [1], created_at: '2026-07-01T00:00:00.000Z', download_count: 0,
        }, { status: 201 });
      }),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Dateien hierher ziehen oder klicken zum Auswählen')).toBeInTheDocument());

    const file = new File(['contents'], 'neu.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('Dateien hierher ziehen oder klicken zum Auswählen');
    server.use(http.get('/api/v1/attached_files', () => HttpResponse.json({
      rows: uploaded ? [{ uuid: 'file-1', filename: 'neu.pdf', content_type: 'application/pdf', content_length: 5 }] : [],
      row_count: uploaded ? 1 : 0,
    })));
    await userEvent.upload(input, file);

    await waitFor(() => expect(capturedBody).toBeDefined());
    // directoryFixture()'s role_ids default is [1] - the upload must reuse it verbatim.
    expect(capturedBody!.getAll('role_ids[]')).toEqual(['1']);
    await waitFor(() => expect(screen.getByText('neu.pdf')).toBeInTheDocument());
  });

  it('clicking the download button downloads the file without navigating away', async () => {
    server.use(
      http.get('/api/v1/attached_files', () => HttpResponse.json({
        rows: [{ uuid: 'file-1', filename: 'protokoll.pdf', content_type: 'application/pdf', content_length: 2048 }],
        row_count: 1,
      })),
      http.get('/api/v1/attached_files/file-1/download', () => new HttpResponse('file contents', {
        headers: { 'Content-Type': 'application/pdf' },
      })),
    );

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    renderPage();
    await waitFor(() => expect(screen.getByText('protokoll.pdf')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Herunterladen' }));

    await waitFor(() => expect(clickSpy).toHaveBeenCalledTimes(1));
    const clickedAnchor = clickSpy.mock.contexts[0] as HTMLAnchorElement;
    expect(clickedAnchor.download).toBe('protokoll.pdf');
    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
    expect(screen.getByText('protokoll.pdf')).toBeInTheDocument();
  });

  it('shows a loading indicator while the directory is being fetched', async () => {
    server.use(
      http.get('/api/v1/directories/protokolle', async () => {
        await delay(50);
        return HttpResponse.json(directoryFixture());
      }),
    );
    renderPage();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Protokolle')).toBeInTheDocument());
  });

  it('shows a loading indicator while the files list is being fetched', async () => {
    server.use(
      http.get('/api/v1/attached_files', async () => {
        await delay(50);
        return HttpResponse.json({ rows: [], row_count: 0 });
      }),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Protokolle')).toBeInTheDocument());
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Keine Dateien vorhanden.')).toBeInTheDocument());
  });

  it('shows a visible error instead of silently doing nothing when a row download fails', async () => {
    server.use(
      http.get('/api/v1/attached_files', () => HttpResponse.json({
        rows: [{ uuid: 'file-1', filename: 'protokoll.pdf', content_type: 'application/pdf', content_length: 2048 }],
        row_count: 1,
      })),
      http.get('/api/v1/attached_files/file-1/download', () => HttpResponse.json({ error: 'forbidden' }, { status: 403 })),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('protokoll.pdf')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Herunterladen' }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('shows a row edit icon that navigates straight to the file edit page when abilities.attached_file allows update', async () => {
    server.use(
      http.get('/api/v1/me', () =>
        HttpResponse.json({
          user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' },
          abilities: { directory: ['read'], attached_file: ['update'] },
        }),
      ),
      http.get('/api/v1/attached_files', () => HttpResponse.json({
        rows: [{ uuid: 'file-1', filename: 'protokoll.pdf', content_type: 'application/pdf', content_length: 2048 }],
        row_count: 1,
      })),
    );
    render(
      <QueryClientProvider client={new QueryClient()}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/categories/finanzen/directories/protokolle']}>
            <BreadcrumbProvider>
              <Routes>
                <Route path="/categories/:categorySlug/directories/:slug" element={<DirectoryDetailPage />} />
                <Route path="/categories/:categorySlug/directories/:directorySlug/files/:uuid/edit" element={<div>File edit page</div>} />
              </Routes>
            </BreadcrumbProvider>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>,
    );

    await waitFor(() => expect(screen.getByText('protokoll.pdf')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    await waitFor(() => expect(screen.getByText('File edit page')).toBeInTheDocument());
  });

  it('hides the row edit icon when abilities.attached_file does not allow update', async () => {
    server.use(
      http.get('/api/v1/me', () =>
        HttpResponse.json({
          user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' },
          abilities: { directory: ['read'], attached_file: ['read'] },
        }),
      ),
      http.get('/api/v1/attached_files', () => HttpResponse.json({
        rows: [{ uuid: 'file-1', filename: 'protokoll.pdf', content_type: 'application/pdf', content_length: 2048 }],
        row_count: 1,
      })),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('protokoll.pdf')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Bearbeiten' })).not.toBeInTheDocument();
  });

  it('opens the file info dialog from the row info icon', async () => {
    server.use(
      http.get('/api/v1/attached_files', () => HttpResponse.json({
        rows: [{ uuid: 'file-1', filename: 'protokoll.pdf', content_type: 'application/pdf', content_length: 2048 }],
        row_count: 1,
      })),
      http.get('/api/v1/attached_files/file-1', () => HttpResponse.json({
        uuid: 'file-1', filename: 'protokoll.pdf', content_type: 'application/pdf', content_length: 2048,
        directory_slug: 'protokolle', directory_name: 'Protokolle', category_slug: 'finanzen', category_name: 'Finanzen',
        uploader_email: 'a@b.de', role_ids: [], created_at: '2026-07-01T00:00:00.000Z', download_count: 2,
      })),
      http.get('/api/v1/roles', () => HttpResponse.json({ rows: [] })),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('protokoll.pdf')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Info' }));

    await waitFor(() => expect(screen.getByText('a@b.de')).toBeInTheDocument());
    // Opening info must not act like a row click - stays on the directory page.
    expect(screen.getByText('protokoll.pdf')).toBeInTheDocument();
  });
});
