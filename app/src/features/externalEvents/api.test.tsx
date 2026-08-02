import { renderHook, screen } from '@testing-library/react';
import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import type { ReactNode } from 'react';
import { ToastProvider } from '../../notifications/ToastProvider';
import '../../i18n';
import {
  useCreateExternalEvent, useUpdateExternalEvent, useDeleteExternalEvent,
  useRegisterExternalEventParticipant, useRemoveExternalEventParticipant, useConfirmExternalEventParticipant,
} from './api';

const server = setupServer(
  http.post('/api/v1/external_events', () => HttpResponse.json({ uuid: 'e1' })),
  http.patch('/api/v1/external_events/:uuid', () => HttpResponse.json({ uuid: 'e1' })),
  http.delete('/api/v1/external_events/:uuid', () => new HttpResponse(null, { status: 204 })),
  http.post('/api/v1/external_events/:uuid/participants', () => HttpResponse.json({ user_uuid: 'u1' })),
  http.delete('/api/v1/external_events/:uuid/participants/:userUuid', () => new HttpResponse(null, { status: 204 })),
  http.post('/api/v1/external_events/:uuid/participants/:userUuid/confirm', () => HttpResponse.json({ user_uuid: 'u1' })),
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

describe('externalEvents api toasts', () => {
  it('shows a success toast after creating an external event', async () => {
    const { result } = renderHook(() => useCreateExternalEvent(), { wrapper });
    act(() => { result.current.mutate({ description: 'x', date: '2026-01-01', location: 'y' }); });
    expect(await screen.findByText('Erstellt.')).toBeInTheDocument();
  });

  it('shows a success toast after updating an external event', async () => {
    const { result } = renderHook(() => useUpdateExternalEvent('e1'), { wrapper });
    act(() => { result.current.mutate({ description: 'x', date: '2026-01-01', location: 'y' }); });
    expect(await screen.findByText('Gespeichert.')).toBeInTheDocument();
  });

  it('shows a success toast after deleting an external event', async () => {
    const { result } = renderHook(() => useDeleteExternalEvent(), { wrapper });
    act(() => { result.current.mutate('e1'); });
    expect(await screen.findByText('Gelöscht.')).toBeInTheDocument();
  });

  it('shows a success toast after registering a participant', async () => {
    const { result } = renderHook(() => useRegisterExternalEventParticipant('e1'), { wrapper });
    act(() => { result.current.mutate({ user_uuid: 'u1' }); });
    expect(await screen.findByText('Erstellt.')).toBeInTheDocument();
  });

  it('shows a success toast after removing a participant', async () => {
    const { result } = renderHook(() => useRemoveExternalEventParticipant('e1'), { wrapper });
    act(() => { result.current.mutate('u1'); });
    expect(await screen.findByText('Gelöscht.')).toBeInTheDocument();
  });

  it('shows a success toast after confirming a participant', async () => {
    const { result } = renderHook(() => useConfirmExternalEventParticipant('e1'), { wrapper });
    act(() => { result.current.mutate('u1'); });
    expect(await screen.findByText('Gespeichert.')).toBeInTheDocument();
  });
});
