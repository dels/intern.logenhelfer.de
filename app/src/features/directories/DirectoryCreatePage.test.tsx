import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse, delay } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import DirectoryCreatePage from './DirectoryCreatePage';
import '../../i18n';

const server = setupServer(
  http.get('/api/v1/categories/finanzen', () => HttpResponse.json({
    slug: 'finanzen', name: 'Finanzen', description: null, role_ids: [1, 2],
  })),
  http.get('/api/v1/roles', () => HttpResponse.json({
    rows: [
      { id: 1, name: 'EnteredApprentice', display_name: 'Lehrling' },
      { id: 2, name: 'FellowCraft', display_name: 'Geselle' },
    ],
  })),
);
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/categories/finanzen/directories/new']}>
        <Routes>
          <Route path="/categories/:categorySlug/directories/new" element={<DirectoryCreatePage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('DirectoryCreatePage', () => {
  it('shows a loading indicator while the parent category is being fetched', async () => {
    server.use(
      http.get('/api/v1/categories/finanzen', async () => {
        await delay(50);
        return HttpResponse.json({ slug: 'finanzen', name: 'Finanzen', description: null, role_ids: [1] });
      }),
    );
    renderPage();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText(/Name/)).toBeInTheDocument());
  });

  it('pre-fills the roles field with the parent category\'s role_ids', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Lehrling')).toBeInTheDocument());
    expect(screen.getByText('Geselle')).toBeInTheDocument();
  });

  it('submits the category-inherited role_ids unchanged when the user does not touch the field', async () => {
    let capturedBody: unknown;
    server.use(
      http.post('/api/v1/directories', async ({ request }) => {
        capturedBody = await request.json();
        return HttpResponse.json({ slug: 'neu', name: 'Neu', category_slug: 'finanzen', role_ids: [1, 2] }, { status: 201 });
      }),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Lehrling')).toBeInTheDocument());

    await userEvent.type(screen.getByLabelText(/Name/), 'Neuer Ordner');
    await userEvent.click(screen.getByRole('button', { name: 'Speichern' }));

    await waitFor(() => expect(capturedBody).toMatchObject({ role_ids: [1, 2] }));
  });

  it('starts with an empty roles field when the parent category has none', async () => {
    server.use(
      http.get('/api/v1/categories/finanzen', () => HttpResponse.json({
        slug: 'finanzen', name: 'Finanzen', description: null, role_ids: [],
      })),
    );
    renderPage();
    await waitFor(() => expect(screen.getByLabelText(/Sichtbar für Rollen/)).toBeInTheDocument());
    expect(screen.queryByText('Lehrling')).not.toBeInTheDocument();
    expect(screen.queryByText('Geselle')).not.toBeInTheDocument();
  });
});
