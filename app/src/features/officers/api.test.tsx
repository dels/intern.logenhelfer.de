import { renderHook, screen } from '@testing-library/react';
import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import type { ReactNode } from 'react';
import { ToastProvider } from '../../notifications/ToastProvider';
import '../../i18n';
import { useCreateOfficer, useUpdateOfficer, useDeleteOfficer } from './api';

const server = setupServer(
  http.post('/api/v1/officers', () => HttpResponse.json({ uuid: 'o1', lodge_slug: 'ze' })),
  http.patch('/api/v1/officers/:uuid', () => HttpResponse.json({ uuid: 'o1', lodge_slug: 'ze' })),
  http.delete('/api/v1/officers/:uuid', () => new HttpResponse(null, { status: 204 })),
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

describe('officers api toasts', () => {
  it('shows a success toast after creating an officer', async () => {
    const { result } = renderHook(() => useCreateOfficer(), { wrapper });
    act(() => { result.current.mutate({ lodge_slug: 'ze', role_id: 1, firstname: 'Max', lastname: 'Muster' }); });
    expect(await screen.findByText('Erstellt.')).toBeInTheDocument();
  });

  it('shows a success toast after updating an officer', async () => {
    const { result } = renderHook(() => useUpdateOfficer('o1'), { wrapper });
    act(() => { result.current.mutate({ lodge_slug: 'ze', role_id: 1, firstname: 'Max', lastname: 'Muster' }); });
    expect(await screen.findByText('Gespeichert.')).toBeInTheDocument();
  });

  it('shows a success toast after deleting an officer', async () => {
    const { result } = renderHook(() => useDeleteOfficer(), { wrapper });
    act(() => { result.current.mutate({ uuid: 'o1', lodgeSlug: 'ze' }); });
    expect(await screen.findByText('Gelöscht.')).toBeInTheDocument();
  });
});
