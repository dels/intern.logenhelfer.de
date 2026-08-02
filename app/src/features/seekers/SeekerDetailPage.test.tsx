import { render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import SeekerDetailPage from './SeekerDetailPage';
import { AuthProvider } from '../../auth/AuthProvider';
import { BreadcrumbProvider } from '../../layouts/BreadcrumbContext';
import Breadcrumbs from '../../layouts/Breadcrumbs';
import '../../i18n';

function seekerFixture(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    uuid: 's1', firstname: 'Max', lastname: 'Sucher', source: 'Empfehlung', invite: true,
    status: 0, status_label: 'Kontaktiert', preferred_way_of_contact: 20, contact_value: '+49 (30) 1234567',
    address: { type_of_address: 0, purpose: 'Privat', street: 'Teststr. 1', zip: '28203', city: 'Bremen', phone: '+49 (30) 1234567', fax: null, mobile: null, email: null },
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

const server = setupServer(
  http.get('/api/v1/me', () =>
    HttpResponse.json({ user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: { seeker: ['read', 'create', 'update', 'destroy'] } }),
  ),
  http.get('/api/v1/seekers/s1', () => HttpResponse.json(seekerFixture())),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/seekers/s1']}>
          <BreadcrumbProvider>
            <Breadcrumbs />
            <Routes>
              <Route path="/seekers/:uuid" element={<SeekerDetailPage />} />
            </Routes>
          </BreadcrumbProvider>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('SeekerDetailPage', () => {
  it('renders the seeker and its contact info', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Sucher, Max')).toBeInTheDocument());
    expect(screen.getByText('+49 (30) 1234567')).toBeInTheDocument();
  });

  it('shows edit/delete controls when abilities.seeker allows them', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
  });

  it('hides edit/delete controls for a read-only council member', async () => {
    server.use(
      http.get('/api/v1/me', () =>
        HttpResponse.json({ user: { id: 2, email: 'c@d.de', firstname: 'A', lastname: 'B' }, abilities: { seeker: ['read'] } }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Sucher, Max')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Bearbeiten' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument();
  });

  it('registers the correct breadcrumb trail', async () => {
    renderPage();
    const breadcrumbNav = await screen.findByLabelText('breadcrumb');
    const breadcrumbLinks = within(breadcrumbNav);
    await waitFor(() => expect(breadcrumbLinks.getByText('Sucher, Max')).toBeInTheDocument());
    expect(breadcrumbLinks.getByRole('link', { name: 'Suchende' })).toHaveAttribute('href', '/seekers');
    expect(breadcrumbLinks.queryByText('Übersicht')).not.toBeInTheDocument();
  });
});
