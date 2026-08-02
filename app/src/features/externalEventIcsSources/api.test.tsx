import { renderHook, screen } from '@testing-library/react';
import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import type { ReactNode } from 'react';
import { ToastProvider } from '../../notifications/ToastProvider';
import '../../i18n';
import { useCreateExternalEventIcsSource, useUpdateExternalEventIcsSource, useDeleteExternalEventIcsSource } from './api';

const server = setupServer(
  http.post('/api/v1/external_event_ics_sources', () => HttpResponse.json({ uuid: 's1', name: 'Cal', url: 'https://x' })),
  http.patch('/api/v1/external_event_ics_sources/:uuid', () => HttpResponse.json({ uuid: 's1', name: 'Cal', url: 'https://x' })),
  http.delete('/api/v1/external_event_ics_sources/:uuid', () => new HttpResponse(null, { status: 204 })),
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

describe('externalEventIcsSources api toasts', () => {
  it('shows a success toast after creating a source', async () => {
    const { result } = renderHook(() => useCreateExternalEventIcsSource(), { wrapper });
    act(() => { result.current.mutate({ name: 'Cal', url: 'https://x' }); });
    expect(await screen.findByText('Erstellt.')).toBeInTheDocument();
  });

  it('shows a success toast after updating a source', async () => {
    const { result } = renderHook(() => useUpdateExternalEventIcsSource(), { wrapper });
    act(() => { result.current.mutate({ uuid: 's1', input: { name: 'Cal2' } }); });
    expect(await screen.findByText('Gespeichert.')).toBeInTheDocument();
  });

  it('shows a success toast after deleting a source', async () => {
    const { result } = renderHook(() => useDeleteExternalEventIcsSource(), { wrapper });
    act(() => { result.current.mutate('s1'); });
    expect(await screen.findByText('Gelöscht.')).toBeInTheDocument();
  });
});
