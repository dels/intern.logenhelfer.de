import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import CategoriesListPage from './CategoriesListPage';
import { AuthProvider } from '../../auth/AuthProvider';
import { setAccessToken } from '../../api/token';
import '../../i18n';

const categoryRow = { slug: 'finanzen', name: 'Finanzen', description: 'Kassenwesen' };

const server = setupServer(
  http.get('/api/v1/me', () =>
    HttpResponse.json({ user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: { category: ['read', 'create', 'update', 'destroy'] } }),
  ),
  http.get('/api/v1/categories', () => HttpResponse.json({ rows: [categoryRow], row_count: 1 })),
  http.delete('/api/v1/categories/finanzen', () => new HttpResponse(null, { status: 204 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
// AuthProvider's cold-boot bootstrap effect (Task 4's sub-fix (a)) refreshes
// the session before ever calling /me when there's no access token in
// memory - this file's /me mock is token-agnostic and there's no
// /session/refresh handler here, so a token must already be present for the
// mount to reach /me at all, same as a returning session in the same tab.
beforeEach(() => setAccessToken('test-token'));
afterEach(() => { server.resetHandlers(); setAccessToken(null); });
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/categories']}>
          <Routes>
            <Route path="/categories" element={<CategoriesListPage />} />
            <Route path="/categories/:slug/edit" element={<div>Edit category page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('CategoriesListPage', () => {
  it('renders categories returned by the API', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Finanzen')).toBeInTheDocument());
  });

  it('requests the default sort (by name) on first load', async () => {
    let lastSort: string | null = null;
    server.use(
      http.get('/api/v1/categories', ({ request }) => {
        lastSort = new URL(request.url).searchParams.get('sort');
        return HttpResponse.json({ rows: [categoryRow], row_count: 1 });
      }),
    );
    renderPage();
    await waitFor(() => expect(lastSort).toBe('name'));
  });

  it('re-requests with the reversed sort param when the Beschreibung column header is clicked', async () => {
    let lastSort: string | null = null;
    server.use(
      http.get('/api/v1/categories', ({ request }) => {
        lastSort = new URL(request.url).searchParams.get('sort');
        return HttpResponse.json({ rows: [categoryRow], row_count: 1 });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Finanzen')).toBeInTheDocument());

    await user.click(screen.getByRole('columnheader', { name: /^Beschreibung/ }));
    await waitFor(() => expect(lastSort).toBe('description'));

    await user.click(screen.getByRole('columnheader', { name: /^Beschreibung/ }));
    await waitFor(() => expect(lastSort).toBe('-description'));
  });

  it('shows row-level edit/delete actions when abilities.category allows them', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
  });

  it('hides row-level actions for a read-only member', async () => {
    server.use(http.get('/api/v1/me', () => HttpResponse.json({ user: { id: 2, email: 'c@d.de', firstname: 'A', lastname: 'B' }, abilities: { category: ['read'] } })));
    renderPage();
    await waitFor(() => expect(screen.getByText('Finanzen')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Bearbeiten' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument();
  });

  it('navigates to the edit page without navigating to the detail page', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    await waitFor(() => expect(screen.getByText('Edit category page')).toBeInTheDocument());
  });

  it('deletes the category after a second confirming click', async () => {
    let deleteCalled = false;
    server.use(http.delete('/api/v1/categories/finanzen', () => { deleteCalled = true; return new HttpResponse(null, { status: 204 }); }));
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Löschen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Wirklich löschen?' }));
    await waitFor(() => expect(deleteCalled).toBe(true));
  });
});
