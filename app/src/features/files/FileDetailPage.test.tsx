import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import FileDetailPage from './FileDetailPage';
import { AuthProvider } from '../../auth/AuthProvider';
import { BreadcrumbProvider } from '../../layouts/BreadcrumbContext';
import Breadcrumbs from '../../layouts/Breadcrumbs';
import i18n from '../../i18n';
import { formatDate } from '../../utils/formatDate';

const server = setupServer(
  http.get('/api/v1/me', () => HttpResponse.json({ user: { id: 1 }, abilities: { attached_file: ['update', 'destroy'] } })),
  http.get('/api/v1/attached_files/file-1', () =>
    HttpResponse.json({
      uuid: 'file-1', filename: 'satzung.pdf', content_type: 'application/pdf', content_length: 2048,
      directory_slug: 'finanzen', directory_name: 'Finanzen',
      category_slug: 'kassenwesen', category_name: 'Kassenwesen',
      uploader_email: 'a@b.de', role_ids: [], created_at: '2026-07-01T12:00:00.000Z', download_count: 0,
    }),
  ),
  http.delete('/api/v1/attached_files/file-1', () => new HttpResponse(null, { status: 204 })),
  http.get('/api/v1/roles', () =>
    HttpResponse.json({
      rows: [
        { id: 1, name: 'MasterMason', display_name: 'Meister', email: null },
        { id: 2, name: 'Secretary', display_name: 'Sekretär', email: null },
      ],
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
      <AuthProvider>
        <MemoryRouter initialEntries={['/categories/kassenwesen/directories/finanzen/files/file-1']}>
          <BreadcrumbProvider>
            <Breadcrumbs />
            <Routes>
              <Route path="/categories/:categorySlug/directories/:directorySlug/files/:uuid" element={<FileDetailPage />} />
              <Route path="/categories/:categorySlug/directories/:directorySlug" element={<div>Directory page</div>} />
            </Routes>
          </BreadcrumbProvider>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('FileDetailPage', () => {
  it('renders file metadata', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('satzung.pdf')).toBeInTheDocument());
    // Finanzen appears as both a breadcrumb link and a page body link; get the one in the content
    expect(screen.getAllByText('Finanzen')).toHaveLength(2);
    expect(screen.getByText('a@b.de')).toBeInTheDocument();
  });

  it('registers the correct breadcrumb trail', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('satzung.pdf')).toBeInTheDocument());
    const breadcrumbNav = screen.getByLabelText('breadcrumb');
    const breadcrumbLinks = within(breadcrumbNav);
    // Kategorien (root) link
    expect(breadcrumbLinks.getByRole('link', { name: 'Kategorien' })).toHaveAttribute('href', '/categories');
    // Category link
    expect(breadcrumbLinks.getByRole('link', { name: 'Kassenwesen' })).toHaveAttribute('href', '/categories/kassenwesen');
    // Directory link
    expect(breadcrumbLinks.getByRole('link', { name: 'Finanzen' })).toHaveAttribute('href', '/categories/kassenwesen/directories/finanzen');
    // Current page (filename, should not be a link)
    expect(breadcrumbLinks.getByText('satzung.pdf')).toBeInTheDocument();
  });

  it('renders the uploader email as a clickable mailto: link', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('satzung.pdf')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'a@b.de' })).toHaveAttribute('href', 'mailto:a@b.de');
  });

  it('deletes the file and navigates back to the directory', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('satzung.pdf')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Löschen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Wirklich löschen?' }));
    await waitFor(() => expect(screen.getByText('Directory page')).toBeInTheDocument());
  });

  it('hides edit/delete controls for a read-only member', async () => {
    server.use(
      http.get('/api/v1/me', () => HttpResponse.json({ user: { id: 1 }, abilities: { attached_file: ['read'] } })),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('satzung.pdf')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Bearbeiten' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument();
  });

  it('shows a visible error instead of silently doing nothing when the download fails', async () => {
    server.use(
      http.get('/api/v1/attached_files/file-1/download', () => HttpResponse.json({ error: 'forbidden' }, { status: 403 })),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('satzung.pdf')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Herunterladen' }));

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('shows size, filetype, and upload date in the metadata grid', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('satzung.pdf')).toBeInTheDocument());
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    expect(screen.getByText('application/pdf')).toBeInTheDocument();
    expect(screen.getByText(formatDate('2026-07-01T12:00:00.000Z', 'de', { dateStyle: 'medium', timeStyle: 'short' }))).toBeInTheDocument();
  });

  it('truncates a very long filename with the full name available as a title attribute', async () => {
    const longName = `${'a'.repeat(120)}.pdf`;
    server.use(
      http.get('/api/v1/attached_files/file-1', () =>
        HttpResponse.json({
          uuid: 'file-1', filename: longName, content_type: 'application/pdf', content_length: 2048,
          directory_slug: 'finanzen', directory_name: 'Finanzen', category_slug: 'kassenwesen', category_name: 'Kassenwesen',
          uploader_email: 'a@b.de', role_ids: [], created_at: '2026-07-01T12:00:00.000Z', download_count: 0,
        }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByTitle(longName)).toBeInTheDocument());
  });

  it('renders the upload date in the app i18n language, not the browser default locale - regression test for a locale-consistency bug', async () => {
    await i18n.changeLanguage('en');
    try {
      renderPage();
      await waitFor(() => expect(screen.getByText(/satzung\.pdf/i)).toBeInTheDocument());
      expect(screen.getByText(/Jul(y)? 1, 2026/i)).toBeInTheDocument();
    } finally {
      await act(async () => {
        await i18n.changeLanguage('de');
      });
    }
  });

  it('shows which groups can see this file', async () => {
    server.use(
      http.get('/api/v1/attached_files/file-1', () =>
        HttpResponse.json({
          uuid: 'file-1', filename: 'satzung.pdf', content_type: 'application/pdf', content_length: 2048,
          directory_slug: 'finanzen', directory_name: 'Finanzen',
          category_slug: 'kassenwesen', category_name: 'Kassenwesen',
          uploader_email: 'a@b.de', role_ids: [1], created_at: '2026-07-01T12:00:00.000Z', download_count: 0,
        }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Sichtbar für: Meister')).toBeInTheDocument());
  });

  it('shows the no-group message when role_ids is empty', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Für keine Gruppe sichtbar')).toBeInTheDocument());
  });
});
