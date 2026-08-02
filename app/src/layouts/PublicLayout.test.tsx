import { render, screen } from '@testing-library/react';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PublicLayout from './PublicLayout';
import { AuthProvider } from '../auth/AuthProvider';
import '../i18n';

const server = setupServer(
  http.get('/api/v1/me', () => new HttpResponse(null, { status: 401 })),
  http.get('/api/v1/public/landing', () => HttpResponse.json({ calendar_as_landing_page: false, lodge: 'Logenhelfer' })),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('PublicLayout', () => {
  it('renders the page content below a top nav with login, calendar, impressum and help links', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/login" element={<div>Login content</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>,
    );
    expect(screen.getByText('Login content')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Anmelden' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Öffentlicher Terminplan' })).toHaveAttribute('href', '/calendar');
    expect(screen.getByRole('link', { name: 'Impressum' })).toHaveAttribute('href', '/impressum');
    expect(screen.getByRole('link', { name: 'Hilfe' })).toHaveAttribute('href', '/help');
  });
});
