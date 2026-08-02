import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import FileEditPage from './FileEditPage';
import '../../i18n';

let updatedBody: unknown;

const server = setupServer(
  http.get('/api/v1/roles', () => HttpResponse.json({ rows: [] })),
  http.get('/api/v1/attached_files/file-1', () =>
    HttpResponse.json({
      uuid: 'file-1', filename: 'satzung.pdf', content_type: 'application/pdf', content_length: 2048,
      directory_slug: 'finanzen', directory_name: 'Finanzen',
      category_slug: 'kassenwesen', category_name: 'Kassenwesen',
      uploader_email: 'a@b.de', role_ids: [], created_at: '2026-07-01T00:00:00.000Z', download_count: 0,
    }),
  ),
  http.patch('/api/v1/attached_files/file-1', async ({ request }) => {
    updatedBody = await request.json();
    return HttpResponse.json({
      uuid: 'file-1', filename: 'renamed.pdf', content_type: 'application/pdf', content_length: 2048,
      directory_slug: 'finanzen', directory_name: 'Finanzen',
      category_slug: 'kassenwesen', category_name: 'Kassenwesen',
      uploader_email: 'a@b.de', role_ids: [], created_at: '2026-07-01T00:00:00.000Z', download_count: 0,
    });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/categories/kassenwesen/directories/finanzen/files/file-1/edit']}>
        <Routes>
          <Route path="/categories/:categorySlug/directories/:directorySlug/files/:uuid/edit" element={<FileEditPage />} />
          <Route path="/categories/:categorySlug/directories/:directorySlug" element={<div>Directory page</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('FileEditPage', () => {
  it('submits the updated filename', async () => {
    renderPage();
    const user = userEvent.setup();

    const filenameInput = await screen.findByLabelText(/Dateiname/);
    await user.clear(filenameInput);
    await user.type(filenameInput, 'renamed.pdf');
    await user.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(screen.getByText('Directory page')).toBeInTheDocument());
    expect(updatedBody).toEqual({ filename: 'renamed.pdf', role_ids: [] });
  });
});
