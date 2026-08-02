import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse, delay } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import CategoryDetailPage from './CategoryDetailPage';
import { AuthProvider } from '../../auth/AuthProvider';
import { BreadcrumbProvider } from '../../layouts/BreadcrumbContext';
import Breadcrumbs from '../../layouts/Breadcrumbs';
import '../../i18n';

function categoryFixture(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    slug: 'finanzen', name: 'Finanzen', description: 'Kassenwesen', role_ids: [1],
    ...overrides,
  };
}

const server = setupServer(
  http.get('/api/v1/me', () =>
    HttpResponse.json({ user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: { category: ['read', 'create', 'update', 'destroy'] } }),
  ),
  http.get('/api/v1/categories/finanzen', () => HttpResponse.json(categoryFixture())),
  http.get('/api/v1/directories', () =>
    HttpResponse.json({ rows: [{ slug: 'protokolle', name: 'Protokolle', description: 'Sitzungsprotokolle' }], row_count: 1 }),
  ),
  http.delete('/api/v1/directories/protokolle', () => new HttpResponse(null, { status: 204 })),
  http.get('/api/v1/roles', () =>
    HttpResponse.json({ rows: [{ id: 1, name: 'MasterMason', display_name: 'Meister', email: null }] }),
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
        <MemoryRouter initialEntries={['/categories/finanzen']}>
          <BreadcrumbProvider>
            <Breadcrumbs />
            <Routes>
              <Route path="/categories/:slug" element={<CategoryDetailPage />} />
              <Route path="/categories/:categorySlug/directories/:slug/edit" element={<div>Edit directory page</div>} />
            </Routes>
          </BreadcrumbProvider>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('CategoryDetailPage', () => {
  it('renders the category name and description', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Finanzen')).toBeInTheDocument());
    expect(screen.getByText('Kassenwesen')).toBeInTheDocument();
  });

  it('registers the correct breadcrumb trail', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Finanzen')).toBeInTheDocument());
    const breadcrumbNav = screen.getByLabelText('breadcrumb');
    const breadcrumbLinks = within(breadcrumbNav);
    // Kategorien (root) link
    expect(breadcrumbLinks.getByRole('link', { name: 'Kategorien' })).toHaveAttribute('href', '/categories');
    // Current page (category name, should not be a link)
    expect(breadcrumbLinks.getByText('Finanzen')).toBeInTheDocument();
  });

  it('shows which groups can see this category', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Sichtbar für: Meister')).toBeInTheDocument());
  });

  it('renders the directory list for the category', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Protokolle')).toBeInTheDocument());
  });

  it('shows edit/delete controls when abilities.category allows them', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
  });

  it('hides edit/delete controls for a read-only council member', async () => {
    server.use(
      http.get('/api/v1/me', () =>
        HttpResponse.json({ user: { id: 2, email: 'c@d.de', firstname: 'A', lastname: 'B' }, abilities: { category: ['read'] } }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Finanzen')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Bearbeiten' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument();
  });

  it('hides row-level directory actions when abilities.directory is absent, even with category update/destroy', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Protokolle')).toBeInTheDocument());
    expect(screen.getAllByRole('button', { name: 'Bearbeiten' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Löschen' })).toHaveLength(1);
  });

  it('shows row-level directory edit/delete actions when abilities.directory allows them', async () => {
    server.use(
      http.get('/api/v1/me', () =>
        HttpResponse.json({ user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: { category: ['read'], directory: ['read', 'update', 'destroy'] } }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
  });

  it('navigates to the directory edit page without navigating to the directory detail page', async () => {
    server.use(
      http.get('/api/v1/me', () =>
        HttpResponse.json({ user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: { category: ['read'], directory: ['read', 'update', 'destroy'] } }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    await waitFor(() => expect(screen.getByText('Edit directory page')).toBeInTheDocument());
  });

  it('deletes the directory after a second confirming click', async () => {
    let deleteCalled = false;
    server.use(
      http.get('/api/v1/me', () =>
        HttpResponse.json({ user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: { category: ['read'], directory: ['read', 'update', 'destroy'] } }),
      ),
      http.delete('/api/v1/directories/protokolle', () => { deleteCalled = true; return new HttpResponse(null, { status: 204 }); }),
    );
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Löschen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Wirklich löschen?' }));
    await waitFor(() => expect(deleteCalled).toBe(true));
  });

  it('shows a loading indicator while the category is being fetched', async () => {
    server.use(
      http.get('/api/v1/categories/finanzen', async () => {
        await delay(50);
        return HttpResponse.json(categoryFixture());
      }),
    );
    renderPage();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Finanzen')).toBeInTheDocument());
  });
});
