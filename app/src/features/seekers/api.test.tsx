import { renderHook, screen } from '@testing-library/react';
import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import type { ReactNode } from 'react';
import { ToastProvider } from '../../notifications/ToastProvider';
import '../../i18n';
import { useCreateSeeker, useUpdateSeeker, useDeleteSeeker } from './api';

const server = setupServer(
  http.post('/api/v1/seekers', () => HttpResponse.json({ uuid: 's1' })),
  http.patch('/api/v1/seekers/:uuid', () => HttpResponse.json({ uuid: 's1' })),
  http.delete('/api/v1/seekers/:uuid', () => new HttpResponse(null, { status: 204 })),
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

describe('seekers api toasts', () => {
  it('shows a success toast after creating a seeker', async () => {
    const { result } = renderHook(() => useCreateSeeker(), { wrapper });
    act(() => { result.current.mutate({ firstname: 'Max', lastname: 'Muster' }); });
    expect(await screen.findByText('Erstellt.')).toBeInTheDocument();
  });

  it('shows a success toast after updating a seeker', async () => {
    const { result } = renderHook(() => useUpdateSeeker('s1'), { wrapper });
    act(() => { result.current.mutate({ firstname: 'Max', lastname: 'Muster' }); });
    expect(await screen.findByText('Gespeichert.')).toBeInTheDocument();
  });

  it('shows a success toast after deleting a seeker', async () => {
    const { result } = renderHook(() => useDeleteSeeker(), { wrapper });
    act(() => { result.current.mutate('s1'); });
    expect(await screen.findByText('Gelöscht.')).toBeInTheDocument();
  });
});
