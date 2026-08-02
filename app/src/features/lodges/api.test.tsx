import { renderHook, screen } from '@testing-library/react';
import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import type { ReactNode } from 'react';
import { ToastProvider } from '../../notifications/ToastProvider';
import '../../i18n';
import { useCreateLodge, useUpdateLodge, useDeleteLodge } from './api';

const server = setupServer(
  http.post('/api/v1/lodges', () => HttpResponse.json({ slug: 'zs', name: 'Zur Standhaftigkeit' })),
  http.patch('/api/v1/lodges/:slug', () => HttpResponse.json({ slug: 'zs', name: 'Zur Standhaftigkeit' })),
  http.delete('/api/v1/lodges/:slug', () => new HttpResponse(null, { status: 204 })),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>{children}</ToastProvider>
    </QueryClientProvider>
  );
}

describe('lodges api toasts', () => {
  it('shows a success toast after creating a lodge', async () => {
    const { result } = renderHook(() => useCreateLodge(), { wrapper });
    act(() => { result.current.mutate({ name: 'Zur Standhaftigkeit', district_id: 1 }); });
    expect(await screen.findByText('Erstellt.')).toBeInTheDocument();
  });

  it('shows a success toast after updating a lodge', async () => {
    const { result } = renderHook(() => useUpdateLodge('zs'), { wrapper });
    act(() => { result.current.mutate({ name: 'Zur Standhaftigkeit', district_id: 1 }); });
    expect(await screen.findByText('Gespeichert.')).toBeInTheDocument();
  });

  it('shows a success toast after deleting a lodge', async () => {
    const { result } = renderHook(() => useDeleteLodge(), { wrapper });
    act(() => { result.current.mutate('zs'); });
    expect(await screen.findByText('Gelöscht.')).toBeInTheDocument();
  });
});
