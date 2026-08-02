import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { useDemoMode } from './useDemoMode';

const server = setupServer();
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function wrapper({ children }: { children: ReactNode }) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return createElement(QueryClientProvider, { client }, children);
}

describe('useDemoMode', () => {
  it('returns false before the request resolves and while there is no demo flag', async () => {
    server.use(http.get('/api/v1/health', () => HttpResponse.json({ status: 'ok', revision: null, demo: false })));
    const { result } = renderHook(() => useDemoMode(), { wrapper });

    expect(result.current).toBe(false);
    await waitFor(() => expect(result.current).toBe(false));
  });

  it('returns true once /api/v1/health resolves with demo: true', async () => {
    server.use(http.get('/api/v1/health', () => HttpResponse.json({ status: 'ok', revision: null, demo: true })));
    const { result } = renderHook(() => useDemoMode(), { wrapper });

    await waitFor(() => expect(result.current).toBe(true));
  });

  it('returns false on a fetch error', async () => {
    server.use(http.get('/api/v1/health', () => HttpResponse.json({}, { status: 500 })));
    const { result } = renderHook(() => useDemoMode(), { wrapper });

    await waitFor(() => expect(result.current).toBe(false));
  });
});
