import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import VisibleToRoles from './VisibleToRoles';
import '../i18n';

const server = setupServer(
  http.get('/api/v1/roles', () =>
    HttpResponse.json({
      rows: [
        { id: 1, name: 'MasterMason', display_name: 'Meister', email: null },
        { id: 2, name: 'Secretary', display_name: 'Sekretär', email: null },
      ],
    }),
  ),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderWithClient(roleIds: number[]) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <VisibleToRoles roleIds={roleIds} />
    </QueryClientProvider>,
  );
}

describe('VisibleToRoles', () => {
  it('resolves role ids to display names', async () => {
    renderWithClient([1, 2]);
    await waitFor(() => expect(screen.getByText('Sichtbar für: Meister, Sekretär')).toBeInTheDocument());
  });

  it('shows a distinct message when no group can see it', async () => {
    renderWithClient([]);
    await waitFor(() => expect(screen.getByText('Für keine Gruppe sichtbar')).toBeInTheDocument());
  });
});
