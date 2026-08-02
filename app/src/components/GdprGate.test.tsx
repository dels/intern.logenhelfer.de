import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import GdprGate from './GdprGate';
import { AuthProvider } from '../auth/AuthProvider';
import '../i18n';

const meUser = { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster', subscribed_to_announcements: false, gdpr_accepted: false };
const server = setupServer(
  http.get('/api/v1/me', () => HttpResponse.json({ user: meUser, abilities: {} })),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderGate() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider><GdprGate /></AuthProvider>
    </QueryClientProvider>,
  );
}

describe('GdprGate', () => {
  it('renders the privacy-policy heading and notice', () => {
    renderGate();
    expect(screen.getByRole('heading', { name: 'Datenschutzbestimmungen' })).toBeInTheDocument();
    expect(screen.getByText(/Um diesen Webdienst weiter nutzen zu können/)).toBeInTheDocument();
  });

  it('disables the accept button until the checkbox is checked', () => {
    renderGate();
    expect(screen.getByRole('button', { name: 'Ich akzeptiere die Datenschutzvereinbarung' })).toBeDisabled();
  });

  it('enables the accept button once checked, and calls the gdpr_acceptance endpoint on click', async () => {
    const acceptGdpr = vi.fn();
    server.use(
      http.patch('/api/v1/me/gdpr_acceptance', () => {
        acceptGdpr();
        return HttpResponse.json({ user: { ...meUser, gdpr_accepted: true }, abilities: {} });
      }),
    );
    renderGate();

    await userEvent.click(screen.getByRole('checkbox'));
    const acceptButton = screen.getByRole('button', { name: 'Ich akzeptiere die Datenschutzvereinbarung' });
    expect(acceptButton).toBeEnabled();

    await userEvent.click(acceptButton);
    await waitFor(() => expect(acceptGdpr).toHaveBeenCalledTimes(1));
  });
});
