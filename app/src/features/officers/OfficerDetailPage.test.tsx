import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import OfficerDetailPage from './OfficerDetailPage';
import { AuthProvider } from '../../auth/AuthProvider';
import '../../i18n';

function officerFixture(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    uuid: 'off-1', firstname: 'Karl', lastname: 'Meister', role_id: 1,
    role_display_name: 'Meister vom Stuhl', role_email: 'meister@zur-linde.de',
    lodge_slug: 'zur-linde', lodge_name: 'Zur Linde',
    ...overrides,
  };
}

const server = setupServer(
  http.get('/api/v1/me', () =>
    HttpResponse.json({ user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: { officer: ['read', 'create', 'update', 'destroy'] } }),
  ),
  http.get('/api/v1/officers/off-1', () => HttpResponse.json(officerFixture())),
  http.delete('/api/v1/officers/off-1', () => new HttpResponse(null, { status: 204 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/officers/off-1']}>
          <Routes>
            <Route path="/officers/:uuid" element={<OfficerDetailPage />} />
            <Route path="/lodges/:slug" element={<div>Lodge page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('OfficerDetailPage', () => {
  it('renders the officer name, role, and lodge link', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Meister, Karl')).toBeInTheDocument());
    expect(screen.getByText('Meister vom Stuhl')).toBeInTheDocument();
    expect(screen.getByText('meister@zur-linde.de')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Zur Linde' })).toBeInTheDocument();
  });

  it('renders the role email as a clickable mailto: link', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Meister, Karl')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'meister@zur-linde.de' })).toHaveAttribute('href', 'mailto:meister@zur-linde.de');
  });

  it('shows edit/delete controls when abilities.officer allows them', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Bearbeiten' })).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument();
  });

  it('hides edit/delete controls for a read-only council member', async () => {
    server.use(
      http.get('/api/v1/me', () =>
        HttpResponse.json({ user: { id: 2, email: 'c@d.de', firstname: 'A', lastname: 'B' }, abilities: { officer: ['read'] } }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByText('Meister, Karl')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Bearbeiten' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument();
  });

  it('deletes the officer and navigates back to the lodge after confirming', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Löschen' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Löschen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Wirklich löschen?' }));
    await waitFor(() => expect(screen.getByText('Lodge page')).toBeInTheDocument());
  });
});
