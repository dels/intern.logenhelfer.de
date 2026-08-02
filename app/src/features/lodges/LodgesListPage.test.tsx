import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import LodgesListPage from './LodgesListPage';
import { AuthProvider } from '../../auth/AuthProvider';
import '../../i18n';

const lodgeRow = { slug: 'zur-linde', name: 'Zur Linde', description: 'Am Marktplatz', district_name: 'Nordwest' };

const server = setupServer(
  http.get('/api/v1/me', () =>
    HttpResponse.json({ user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: { lodge: ['read', 'create', 'update', 'destroy'] } }),
  ),
  http.get('/api/v1/lodges', () => HttpResponse.json({ rows: [lodgeRow], row_count: 1 })),
  http.delete('/api/v1/lodges/zur-linde', () => new HttpResponse(null, { status: 204 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/lodges']}>
          <Routes>
            <Route path="/lodges" element={<LodgesListPage />} />
            <Route path="/lodges/:slug/edit" element={<div>Edit lodge page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('LodgesListPage', () => {
  it('renders lodges returned by the API', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Zur Linde')).toBeInTheDocument());
    expect(screen.getByText('Nordwest')).toBeInTheDocument();
  });

  it('requests the default sort (by name) on first load', async () => {
    let lastSort: string | null = null;
    server.use(
      http.get('/api/v1/lodges', ({ request }) => {
        lastSort = new URL(request.url).searchParams.get('sort');
        return HttpResponse.json({ rows: [lodgeRow], row_count: 1 });
      }),
    );
    renderPage();
    await waitFor(() => expect(lastSort).toBe('name'));
  });

  it('re-requests with the reversed sort param when the Distrikt column header is clicked', async () => {
    let lastSort: string | null = null;
    server.use(
      http.get('/api/v1/lodges', ({ request }) => {
        lastSort = new URL(request.url).searchParams.get('sort');
        return HttpResponse.json({ rows: [lodgeRow], row_count: 1 });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Zur Linde')).toBeInTheDocument());

    await user.click(screen.getByRole('columnheader', { name: /^Distrikt/ }));
    await waitFor(() => expect(lastSort).toBe('district_name'));

    await user.click(screen.getByRole('columnheader', { name: /^Distrikt/ }));
    await waitFor(() => expect(lastSort).toBe('-district_name'));
  });

  it('shows row-level edit/delete actions when abilities.lodge allows them', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
  });

  it('hides row-level actions for a read-only member', async () => {
    server.use(http.get('/api/v1/me', () => HttpResponse.json({ user: { id: 2, email: 'c@d.de', firstname: 'A', lastname: 'B' }, abilities: { lodge: ['read'] } })));
    renderPage();
    await waitFor(() => expect(screen.getByText('Zur Linde')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Bearbeiten' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument();
  });

  it('navigates to the edit page without navigating to the detail page', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    await waitFor(() => expect(screen.getByText('Edit lodge page')).toBeInTheDocument());
  });

  it('deletes the lodge after a second confirming click', async () => {
    let deleteCalled = false;
    server.use(http.delete('/api/v1/lodges/zur-linde', () => { deleteCalled = true; return new HttpResponse(null, { status: 204 }); }));
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Löschen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Wirklich löschen?' }));
    await waitFor(() => expect(deleteCalled).toBe(true));
  });
});
