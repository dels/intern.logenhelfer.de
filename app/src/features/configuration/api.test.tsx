import { renderHook, screen } from '@testing-library/react';
import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import type { ReactNode } from 'react';
import { ToastProvider } from '../../notifications/ToastProvider';
import '../../i18n';
import { useUpdateAppConfig, useCreateDistrict, useDeleteDistrict } from './api';

const server = setupServer(
  http.patch('/api/v1/app_config', () => HttpResponse.json({})),
  http.post('/api/v1/districts', () => HttpResponse.json({ id: 1, name: 'Nord' })),
  http.delete('/api/v1/districts/:id', () => new HttpResponse(null, { status: 204 })),
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

describe('configuration api toasts', () => {
  it('shows a success toast after saving AppConfig', async () => {
    const { result } = renderHook(() => useUpdateAppConfig(), { wrapper });
    act(() => { result.current.mutate({ organisation: 'ACME' }); });
    expect(await screen.findByText('Gespeichert.')).toBeInTheDocument();
  });

  it('shows a success toast after creating a district', async () => {
    const { result } = renderHook(() => useCreateDistrict(), { wrapper });
    act(() => { result.current.mutate({ name: 'Nord' }); });
    expect(await screen.findByText('Erstellt.')).toBeInTheDocument();
  });

  it('shows a success toast after deleting a district', async () => {
    const { result } = renderHook(() => useDeleteDistrict(), { wrapper });
    act(() => { result.current.mutate(1); });
    expect(await screen.findByText('Gelöscht.')).toBeInTheDocument();
  });
});
