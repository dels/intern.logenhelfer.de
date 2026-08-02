import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BijouLogo from './BijouLogo';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderLogo() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <BijouLogo defaultSrc="/default-bijou.png" width={28} height={37} />
    </QueryClientProvider>,
  );
}

describe('BijouLogo', () => {
  it('renders the bundled default when no custom logo is configured', async () => {
    server.use(
      http.get('/api/v1/public/landing', () =>
        HttpResponse.json({ calendar_as_landing_page: false, lodge: '', language: 'de', logo_version: null }),
      ),
    );
    const { container } = renderLogo();
    await waitFor(() =>
      expect(container.querySelector('img')).toHaveAttribute('src', '/default-bijou.png'),
    );
  });

  it('renders the versioned custom-logo URL once one is configured', async () => {
    server.use(
      http.get('/api/v1/public/landing', () =>
        HttpResponse.json({ calendar_as_landing_page: false, lodge: '', language: 'de', logo_version: 1234 }),
      ),
    );
    const { container } = renderLogo();
    await waitFor(() =>
      expect(container.querySelector('img')).toHaveAttribute('src', '/api/v1/public/logo?v=1234'),
    );
  });

  it('falls back to the bundled default before the config has loaded', () => {
    server.use(http.get('/api/v1/public/landing', () => new Promise(() => {})));
    const { container } = renderLogo();
    expect(container.querySelector('img')).toHaveAttribute('src', '/default-bijou.png');
  });
});
