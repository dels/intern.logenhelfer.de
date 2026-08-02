import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router';
import LandingResolver from './LandingResolver';
import * as AuthProviderModule from '../auth/AuthProvider';

const server = setupServer(
  http.get('/api/v1/public/landing', () => HttpResponse.json({ calendar_as_landing_page: false })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderResolver() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<LandingResolver />} />
          <Route path="/dashboard" element={<div>Dashboard content</div>} />
          <Route path="/login" element={<div>Login content</div>} />
          <Route path="/calendar" element={<div>Calendar content</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LandingResolver', () => {
  it('redirects an authenticated user to /dashboard', async () => {
    vi.spyOn(AuthProviderModule, 'useAuth').mockReturnValue({ status: 'authenticated' } as ReturnType<typeof AuthProviderModule.useAuth>);
    renderResolver();
    await waitFor(() => expect(screen.getByText('Dashboard content')).toBeInTheDocument());
  });

  it('redirects an anonymous user to /login when calendar_as_landing_page is false', async () => {
    vi.spyOn(AuthProviderModule, 'useAuth').mockReturnValue({ status: 'anonymous' } as ReturnType<typeof AuthProviderModule.useAuth>);
    renderResolver();
    await waitFor(() => expect(screen.getByText('Login content')).toBeInTheDocument());
  });

  it('redirects an anonymous user to /calendar when calendar_as_landing_page is true', async () => {
    server.use(http.get('/api/v1/public/landing', () => HttpResponse.json({ calendar_as_landing_page: true })));
    vi.spyOn(AuthProviderModule, 'useAuth').mockReturnValue({ status: 'anonymous' } as ReturnType<typeof AuthProviderModule.useAuth>);
    renderResolver();
    await waitFor(() => expect(screen.getByText('Calendar content')).toBeInTheDocument());
  });
});
