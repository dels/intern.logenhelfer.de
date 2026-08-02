import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { delay, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ImpressumPage from './ImpressumPage';

const server = setupServer(
  http.get('/api/v1/public/impressum', () => HttpResponse.json({ html: '<h2 id="test-heading">Testinhalt</h2>' })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <ImpressumPage />
    </QueryClientProvider>,
  );
}

describe('ImpressumPage', () => {
  it('renders the fetched HTML content', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Testinhalt')).toBeInTheDocument());
    expect(document.getElementById('test-heading')).toBeInTheDocument();
  });

  it('sanitizes admin-authored HTML before rendering it', async () => {
    server.use(
      http.get('/api/v1/public/impressum', () =>
        HttpResponse.json({
          html: '<p id="safe-paragraph">Hallo</p><img src="x" onerror="window.__pwned=true"><script>window.__pwned=true</script>',
        }),
      ),
    );

    const { container } = renderPage();
    await waitFor(() => expect(document.getElementById('safe-paragraph')).toBeInTheDocument());

    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(container.querySelector('img')?.getAttribute('onerror')).toBeNull();
    expect(container.innerHTML).not.toContain('onerror');
    expect((window as typeof window & { __pwned?: boolean }).__pwned).toBeUndefined();
  });

  it('shows a loading indicator while the content is loading', async () => {
    server.use(
      http.get('/api/v1/public/impressum', async () => {
        await delay('infinite');
        return HttpResponse.json({ html: '' });
      }),
    );
    render(
      <QueryClientProvider client={new QueryClient()}>
        <ImpressumPage />
      </QueryClientProvider>,
    );
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
  });
});
