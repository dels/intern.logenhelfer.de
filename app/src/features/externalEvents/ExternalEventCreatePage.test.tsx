import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import ExternalEventCreatePage from './ExternalEventCreatePage';
import '../../i18n';

const server = setupServer(
  http.get('/api/v1/external_events/defaults', () => HttpResponse.json({ location: 'Gastlogenhaus', duration_minutes: 60 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  // retry: false matches App.tsx's real production QueryClient config -
  // without it, the 403 regression test below would sit through react-query's
  // default 3-retry exponential backoff (~7s) before settling.
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ExternalEventCreatePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('ExternalEventCreatePage', () => {
  it('seeds the location field from the default_event_location config', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByLabelText(/Ort/i)).toHaveValue('Gastlogenhaus'));
  });

  // Regression test for a real infinite-render loop found while running this
  // task's remote gate: ExternalEventForm (rendered below this page once its
  // own defaults query settles) independently subscribes to the exact same
  // ['external-events','defaults'] query for its duration-shifting logic. A
  // plain member has no client-side gate on this route (see
  // authorization-boundaries.spec.ts's "does not allow a working create
  // flow" case) and the defaults endpoint 403s for them, so the query never
  // acquires data. TanStack Query treats every new observer mounting on a
  // never-succeeded query as a fresh fetch, so the form's own mount flips
  // this page's `isLoading` back to true, unmounting the form, which lets it
  // mount again next settle - forever (confirmed via a scratch repro:
  // thousands of renders/sec, DOM never showing the form). Without the
  // `hasLoadedOnceRef` latch in ExternalEventCreatePage.tsx, this test hangs
  // until the suite timeout instead of finding the field.
  it('renders the form even when the defaults endpoint is forbidden', async () => {
    server.use(http.get('/api/v1/external_events/defaults', () => HttpResponse.json({ error: 'forbidden' }, { status: 403 })));
    renderPage();
    await waitFor(() => expect(screen.getByLabelText(/Titel/i)).toBeInTheDocument());
  });
});
