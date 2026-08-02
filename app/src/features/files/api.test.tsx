import { renderHook, screen } from '@testing-library/react';
import { act } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import type { ReactNode } from 'react';
import { ToastProvider } from '../../notifications/ToastProvider';
import '../../i18n';
import { useUploadFile, useUpdateFile, useDeleteFile } from './api';

const server = setupServer(
  http.post('/api/v1/attached_files', () => HttpResponse.json({ uuid: 'f1', directory_slug: 'finanzen' })),
  http.patch('/api/v1/attached_files/:uuid', () => HttpResponse.json({ uuid: 'f1', directory_slug: 'finanzen' })),
  http.delete('/api/v1/attached_files/:uuid', () => new HttpResponse(null, { status: 204 })),
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

describe('files api toasts', () => {
  it('shows a success toast after uploading a file', async () => {
    const { result } = renderHook(() => useUploadFile(), { wrapper });
    act(() => { result.current.mutate({ file: new File(['x'], 'a.txt'), directorySlug: 'finanzen', roleIds: [] }); });
    expect(await screen.findByText('Erstellt.')).toBeInTheDocument();
  });

  it('shows a success toast after updating a file', async () => {
    const { result } = renderHook(() => useUpdateFile('f1'), { wrapper });
    act(() => { result.current.mutate({ filename: 'a.txt', role_ids: [] }); });
    expect(await screen.findByText('Gespeichert.')).toBeInTheDocument();
  });

  it('shows a success toast after deleting a file', async () => {
    const { result } = renderHook(() => useDeleteFile(), { wrapper });
    act(() => { result.current.mutate({ uuid: 'f1', directorySlug: 'finanzen' }); });
    expect(await screen.findByText('Gelöscht.')).toBeInTheDocument();
  });
});
