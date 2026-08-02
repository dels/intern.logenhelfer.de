import { renderHook, waitFor, screen } from '@testing-library/react';
import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import type { ReactNode } from 'react';
import { ToastProvider } from '../../notifications/ToastProvider';
import '../../i18n';
import { useDirectories, useCreateDirectory, useDeleteDirectory } from './api';

let requestCount = 0;
const server = setupServer(
  http.get('/api/v1/directories', () => {
    requestCount += 1;
    return HttpResponse.json({ rows: [{ slug: 'finanzen', name: 'Finanzen', description: null }], row_count: 1 });
  }),
  http.post('/api/v1/directories', () => HttpResponse.json({ slug: 'finanzen-dir', name: 'Finanzen', category_slug: 'finanzen' })),
  http.delete('/api/v1/directories/:slug', () => new HttpResponse(null, { status: 204 })),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => { server.resetHandlers(); requestCount = 0; });
afterAll(() => server.close());

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

describe('useDirectories', () => {
  it('does not fetch when enabled is false', async () => {
    renderHook(() => useDirectories('finanzen', { enabled: false }), { wrapper });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(requestCount).toBe(0);
  });

  it('fetches when enabled is true (the default)', async () => {
    const { result } = renderHook(() => useDirectories('finanzen'), { wrapper });
    await waitFor(() => expect(result.current.data?.rows).toHaveLength(1));
    expect(requestCount).toBe(1);
  });
});

describe('directories api toasts', () => {
  it('shows a success toast after creating a directory', async () => {
    const { result } = renderHook(() => useCreateDirectory(), { wrapper });
    act(() => { result.current.mutate({ name: 'Finanzen', category_slug: 'finanzen' }); });
    expect(await screen.findByText('Erstellt.')).toBeInTheDocument();
  });

  it('shows a success toast after deleting a directory', async () => {
    const { result } = renderHook(() => useDeleteDirectory(), { wrapper });
    act(() => { result.current.mutate({ slug: 'finanzen-dir', categorySlug: 'finanzen' }); });
    expect(await screen.findByText('Gelöscht.')).toBeInTheDocument();
  });
});
