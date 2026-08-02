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
import { useUpdatePassword } from './api';

const server = setupServer(
  http.get('/api/v1/me', () =>
    HttpResponse.json({ user: { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster' }, abilities: {} })),
  http.patch('/api/v1/me/password', () =>
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

describe('useUpdatePassword', () => {
  it('shows a success toast after changing the password', async () => {
    const { result } = renderHook(() => useUpdatePassword(), { wrapper });
    act(() => {
      result.current.mutate({ current_password: 'old', new_password: 'newpass123', new_password_confirmation: 'newpass123' });
    });
    expect(await screen.findByText('Gespeichert.')).toBeInTheDocument();
  });
});
