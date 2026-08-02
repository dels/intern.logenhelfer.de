import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import MemberCreatePage from './MemberCreatePage';
import '../../i18n';

// MemberForm renders real role-picker Autocompletes backed by useRoles()
// (a real useQuery call from ../categories/api) - it needs a working
// /api/v1/roles handler even though this test never touches those fields.
const server = setupServer(
  http.get('/api/v1/roles', () => HttpResponse.json({ rows: [] })),
  http.get('/api/v1/members/next_matriculation_number', () => HttpResponse.json({ next_matriculation_number: 4321 })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <MemberCreatePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('MemberCreatePage', () => {
  it('prefills the Matrikelnummer field with the suggested next number from the API', async () => {
    renderPage();

    const field = await screen.findByLabelText(/Matrikelnummer/);
    await waitFor(() => expect(field).toHaveValue(4321));
  });

  it('keeps the prefilled Matrikelnummer field editable', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    renderPage();

    const field = await screen.findByLabelText(/Matrikelnummer/);
    await waitFor(() => expect(field).toHaveValue(4321));

    await userEvent.clear(field);
    await userEvent.type(field, '9999');

    expect(field).toHaveValue(9999);
  });

  it('renders with an empty Matrikelnummer field if the suggestion request fails, rather than never rendering the form', async () => {
    server.use(http.get('/api/v1/members/next_matriculation_number', () => HttpResponse.json({ error: 'forbidden' }, { status: 403 })));
    renderPage();

    const field = await screen.findByLabelText(/Matrikelnummer/);
    expect(field).toHaveValue(null);
  });
});
