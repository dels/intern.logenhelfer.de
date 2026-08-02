import { renderHook, screen } from '@testing-library/react';
import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import type { ReactNode } from 'react';
import { ToastProvider } from '../../notifications/ToastProvider';
import { AuthProvider } from '../../auth/AuthProvider';
import '../../i18n';
import { useCreateAnnouncement, useDeleteAnnouncement, useUpdateAnnouncementSubscription, useUpdateAnnouncement, useAcceptGdpr } from './api';

const server = setupServer(
  http.get('/api/v1/me', () =>
    HttpResponse.json({ user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: {} })),
  http.post('/api/v1/announcements', () => HttpResponse.json({ uuid: 'a1' })),
  http.delete('/api/v1/announcements/:uuid', () => new HttpResponse(null, { status: 204 })),
  http.patch('/api/v1/announcements/:uuid', () => HttpResponse.json({ uuid: 'a1', title: 'Updated', message_body: 'Updated body' })),
  http.patch('/api/v1/me/announcement_subscription', () =>
    HttpResponse.json({ user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' } })),
  http.patch('/api/v1/me/gdpr_acceptance', () =>
    HttpResponse.json({ user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' } })),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>{children}</AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

describe('announcements api toasts', () => {
  it('shows a success toast after creating an announcement', async () => {
    const { result } = renderHook(() => useCreateAnnouncement(), { wrapper });
    act(() => { result.current.mutate({ title: 'Hi', message_body: 'Body' }); });
    expect(await screen.findByText('Erstellt.')).toBeInTheDocument();
  });

  it('shows a success toast after deleting an announcement', async () => {
    const { result } = renderHook(() => useDeleteAnnouncement(), { wrapper });
    act(() => { result.current.mutate('a1'); });
    expect(await screen.findByText('Gelöscht.')).toBeInTheDocument();
  });

  it('shows a success toast after toggling the announcement subscription', async () => {
    const { result } = renderHook(() => useUpdateAnnouncementSubscription(), { wrapper });
    act(() => { result.current.mutate(true); });
    expect(await screen.findByText('Gespeichert.')).toBeInTheDocument();
  });

  it('shows a success toast after updating an announcement', async () => {
    const { result } = renderHook(() => useUpdateAnnouncement('a1'), { wrapper });
    act(() => { result.current.mutate({ title: 'Updated', message_body: 'Updated body' }); });
    expect(await screen.findByText('Gespeichert.')).toBeInTheDocument();
  });

  it('shows a success toast after accepting GDPR', async () => {
    const { result } = renderHook(() => useAcceptGdpr(), { wrapper });
    act(() => { result.current.mutate(); });
    expect(await screen.findByText('Gespeichert.')).toBeInTheDocument();
  });
});
