import { renderHook, screen } from '@testing-library/react';
import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import type { ReactNode } from 'react';
import { ToastProvider } from '../../notifications/ToastProvider';
import '../../i18n';
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from './api';

const server = setupServer(
  http.post('/api/v1/categories', () => HttpResponse.json({ slug: 'finanzen', name: 'Finanzen' })),
  http.patch('/api/v1/categories/:slug', () => HttpResponse.json({ slug: 'finanzen', name: 'Finanzen' })),
  http.delete('/api/v1/categories/:slug', () => new HttpResponse(null, { status: 204 })),
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

describe('categories api toasts', () => {
  it('shows a success toast after creating a category', async () => {
    const { result } = renderHook(() => useCreateCategory(), { wrapper });
    act(() => { result.current.mutate({ name: 'Finanzen' }); });
    expect(await screen.findByText('Erstellt.')).toBeInTheDocument();
  });

  it('shows a success toast after updating a category', async () => {
    const { result } = renderHook(() => useUpdateCategory('finanzen'), { wrapper });
    act(() => { result.current.mutate({ name: 'Finanzen' }); });
    expect(await screen.findByText('Gespeichert.')).toBeInTheDocument();
  });

  it('shows a success toast after deleting a category', async () => {
    const { result } = renderHook(() => useDeleteCategory(), { wrapper });
    act(() => { result.current.mutate('finanzen'); });
    expect(await screen.findByText('Gelöscht.')).toBeInTheDocument();
  });
});
