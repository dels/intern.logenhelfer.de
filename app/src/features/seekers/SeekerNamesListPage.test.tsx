import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import SeekerNamesListPage from './SeekerNamesListPage';
import { AuthProvider } from '../../auth/AuthProvider';
import '../../i18n';

const server = setupServer(
  http.get('/api/v1/me', () =>
    HttpResponse.json({ user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: { seeker: ['names_list'] } }),
  ),
  http.get('/api/v1/seekers/names', () =>
    HttpResponse.json({ rows: [{ firstname: 'Max', lastname: 'Sucher' }], row_count: 1 }),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/seekers/names']}>
          <SeekerNamesListPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('SeekerNamesListPage', () => {
  it('renders the names of active seekers returned by the API', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Sucher, Max')).toBeInTheDocument());
  });

  it('shows nothing but the name - no status/contact/uuid/other seeker data', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Sucher, Max')).toBeInTheDocument());
    expect(screen.queryByText(/Kontaktiert|Angenommen|Abgelehnt/)).not.toBeInTheDocument();
  });

  it('shows an empty-state message when there are no active seekers', async () => {
    server.use(http.get('/api/v1/seekers/names', () => HttpResponse.json({ rows: [], row_count: 0 })));
    renderPage();
    expect(await screen.findByText('Es gibt aktuell keine Suchenden.')).toBeInTheDocument();
  });

  it('shows a forbidden message instead of the list for a user without the names_list ability', async () => {
    server.use(http.get('/api/v1/me', () => HttpResponse.json({ user: { id: 2, email: 'c@d.de', firstname: 'No', lastname: 'Access' }, abilities: {} })));
    renderPage();
    expect(await screen.findByText('Sie haben keine Berechtigung, die Suchenden einzusehen.')).toBeInTheDocument();
    expect(screen.queryByText('Sucher, Max')).not.toBeInTheDocument();
  });

  it('shows a forbidden message for a Worshipful Master/officer (full read, no names_list) - they use the full list instead', async () => {
    server.use(http.get('/api/v1/me', () => HttpResponse.json({ user: { id: 3, email: 'e@f.de', firstname: 'W', lastname: 'M' }, abilities: { seeker: ['read', 'create', 'update', 'destroy'] } })));
    renderPage();
    expect(await screen.findByText('Sie haben keine Berechtigung, die Suchenden einzusehen.')).toBeInTheDocument();
  });
});
