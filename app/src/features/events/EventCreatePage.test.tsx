import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import EventCreatePage from './EventCreatePage';
import '../../i18n';

const server = setupServer(
  http.get('/api/v1/events/defaults', () => HttpResponse.json({ location: 'Logenhaus', duration_minutes: 60 })),
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
        <EventCreatePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EventCreatePage', () => {
  it('seeds the location field from the default_event_location config', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByLabelText(/Ort/i)).toHaveValue('Logenhaus'));
  });

  // Regression test for a real infinite-render loop: EventForm (rendered
  // below this page once its own defaults query settles) independently
  // subscribes to that exact same query for its duration-shifting logic. If
  // the defaults endpoint 403s (a plain member with no 'create' ability on
  // Event, who can still reach this route - the form has no client-side
  // ability gate, see authorization-boundaries.spec.ts's equivalent
  // external-events case), the query never acquires data. TanStack Query
  // treats every new observer mounting on a never-succeeded query as a
  // fresh fetch, so the form's own mount flips this page's `isLoading` back
  // to true, unmounting the form, which lets it mount again next settle -
  // forever. Without the `hasLoadedOnceRef` latch in EventCreatePage.tsx,
  // this test hangs until the 10s suite timeout instead of finding the
  // field.
  it('renders the form even when the defaults endpoint is forbidden', async () => {
    server.use(http.get('/api/v1/events/defaults', () => HttpResponse.json({ error: 'forbidden' }, { status: 403 })));
    renderPage();
    await waitFor(() => expect(screen.getByLabelText(/Titel/i)).toBeInTheDocument());
  });
});
