import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import SeekersListPage from './SeekersListPage';
import { AuthProvider } from '../../auth/AuthProvider';
import i18n from '../../i18n';

const seekerRow = { uuid: 's1', firstname: 'Max', lastname: 'Sucher', source: 'Empfehlung', status: 0, status_label: 'Kontaktiert', contact_value: '+49 (30) 1234567', updated_at: '2026-01-01T00:00:00Z' };

const server = setupServer(
  http.get('/api/v1/me', () =>
    HttpResponse.json({ user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: { seeker: ['read', 'create', 'update', 'destroy'] } }),
  ),
  http.get('/api/v1/seekers', () => HttpResponse.json({ rows: [seekerRow], row_count: 1 })),
  http.delete('/api/v1/seekers/s1', () => new HttpResponse(null, { status: 204 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  // retry: false - without it, the fetch-error regression test below would
  // need to wait through React Query's default 3-retry backoff before
  // isError ever settles, several seconds past findByText's default timeout
  // (matches MembersListPage.test.tsx's renderPage, which shares this need).
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/seekers']}>
          <Routes>
            <Route path="/seekers" element={<SeekersListPage />} />
            <Route path="/seekers/:uuid/edit" element={<div>Edit seeker page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('SeekersListPage', () => {
  it('renders seekers returned by the API', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Sucher, Max')).toBeInTheDocument());
  });

  it('shows row-level edit/delete actions when abilities.seeker allows them', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
  });

  it('surfaces a visible error instead of silently rendering an empty list when the seekers fetch fails', async () => {
    // Regression test, same shape as MembersListPage's: SeekersListPage used
    // to destructure only `{ data, isLoading }` from useSeekers, discarding
    // useQuery's error/isError - a failed fetch rendered as an ordinary,
    // silent "no rows" empty grid instead of surfacing that the request
    // actually failed.
    server.use(http.get('/api/v1/seekers', () => HttpResponse.json({ error: 'internal_server_error' }, { status: 500 })));
    renderPage();
    expect(await screen.findByText(/Die Liste der Suchenden konnte nicht geladen werden\./)).toBeInTheDocument();
  });

  it('hides row-level actions for a read-only member', async () => {
    server.use(http.get('/api/v1/me', () => HttpResponse.json({ user: { id: 2, email: 'c@d.de', firstname: 'A', lastname: 'B' }, abilities: { seeker: ['read'] } })));
    renderPage();
    await waitFor(() => expect(screen.getByText('Sucher, Max')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Bearbeiten' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument();
  });

  it('shows a forbidden message instead of the table for a user without seeker read access', async () => {
    server.use(http.get('/api/v1/me', () => HttpResponse.json({ user: { id: 3, email: 'e@f.de', firstname: 'No', lastname: 'Access' }, abilities: {} })));
    renderPage();
    expect(await screen.findByText('Sie haben keine Berechtigung, die Suchenden einzusehen.')).toBeInTheDocument();
    expect(screen.queryByText('Sucher, Max')).not.toBeInTheDocument();
  });

  it('navigates to the edit page without navigating to the detail page', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Bearbeiten' }));
    await waitFor(() => expect(screen.getByText('Edit seeker page')).toBeInTheDocument());
  });

  it('deletes the seeker after a second confirming click', async () => {
    let deleteCalled = false;
    server.use(http.delete('/api/v1/seekers/s1', () => { deleteCalled = true; return new HttpResponse(null, { status: 204 }); }));
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Löschen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Diese*n Suchende*n wirklich löschen?' }));
    await waitFor(() => expect(deleteCalled).toBe(true));
  });

  it('formats the updated_at column as a localized date-time instead of the raw ISO timestamp', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Sucher, Max')).toBeInTheDocument());
    const expected = new Date('2026-01-01T00:00:00Z').toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' });
    expect(screen.getByText(expected)).toBeInTheDocument();
    expect(screen.queryByText('2026-01-01T00:00:00Z')).not.toBeInTheDocument();
  });

  it('re-requests with the reversed sort param when the Status column header is clicked', async () => {
    let lastSort: string | null = null;
    server.use(
      http.get('/api/v1/seekers', ({ request }) => {
        lastSort = new URL(request.url).searchParams.get('sort');
        return HttpResponse.json({ rows: [seekerRow], row_count: 1 });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Sucher, Max')).toBeInTheDocument());

    await user.click(screen.getByRole('columnheader', { name: /^Status/ }));
    await waitFor(() => expect(lastSort).toBe('status_label'));

    await user.click(screen.getByRole('columnheader', { name: /^Status/ }));
    await waitFor(() => expect(lastSort).toBe('-status_label'));
  });

  it('re-requests with the reversed sort param when the Kontakt column header is clicked', async () => {
    let lastSort: string | null = null;
    server.use(
      http.get('/api/v1/seekers', ({ request }) => {
        lastSort = new URL(request.url).searchParams.get('sort');
        return HttpResponse.json({ rows: [seekerRow], row_count: 1 });
      }),
    );
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Sucher, Max')).toBeInTheDocument());

    await user.click(screen.getByRole('columnheader', { name: /^Kontakt/ }));
    await waitFor(() => expect(lastSort).toBe('contact_value'));
  });
});
