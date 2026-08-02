import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import ForgotPasswordPage from './ForgotPasswordPage';
import '../i18n';

let lastForgotBody: unknown;
const server = setupServer(
  http.post('/api/v1/password/forgot', async ({ request }) => {
    lastForgotBody = await request.json();
    return HttpResponse.json({});
  }),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  return render(
    <MemoryRouter>
      <ForgotPasswordPage />
    </MemoryRouter>,
  );
}

describe('ForgotPasswordPage', () => {
  it('renders the request form', () => {
    renderPage();
    expect(screen.getByLabelText('E-Mail')).toBeInTheDocument();
  });

  it('shows the generic success message after submitting a known-looking email', async () => {
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('E-Mail'), 'member@example.test');
    await user.click(screen.getByRole('button', { name: 'Link anfordern' }));

    await waitFor(() => expect(screen.getByText(/Falls diese E-Mail-Adresse registriert ist/)).toBeInTheDocument());
    expect(lastForgotBody).toEqual({ email: 'member@example.test' });
  });

  it('shows the identical generic success message even when the API call fails', async () => {
    // The UI must never distinguish "known" from "unknown" from "network
    // error" - see passwordReset.ts's non-enumeration guarantee.
    server.use(http.post('/api/v1/password/forgot', () => HttpResponse.json({ error: 'internal_server_error' }, { status: 500 })));
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('E-Mail'), 'anyone@example.test');
    await user.click(screen.getByRole('button', { name: 'Link anfordern' }));

    await waitFor(() => expect(screen.getByText(/Falls diese E-Mail-Adresse registriert ist/)).toBeInTheDocument());
  });

  it('does not submit an invalid email', async () => {
    renderPage();
    const user = userEvent.setup();
    const submitSpy = vi.fn();
    server.use(http.post('/api/v1/password/forgot', () => { submitSpy(); return HttpResponse.json({}); }));

    await user.type(screen.getByLabelText('E-Mail'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: 'Link anfordern' }));

    expect(submitSpy).not.toHaveBeenCalled();
  });
});
