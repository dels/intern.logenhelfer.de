import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, beforeAll, afterEach, afterAll } from 'vitest';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import ResetPasswordPage from './ResetPasswordPage';
import '../i18n';

let lastResetBody: unknown;
const server = setupServer(
  http.post('/api/v1/password/reset', async ({ request }) => {
    lastResetBody = await request.json();
    const body = lastResetBody as { token: string };
    if (body.token !== 'valid-token') {
      return HttpResponse.json({ error: 'unprocessable', detail: 'Link ist ungültig oder abgelaufen' }, { status: 422 });
    }
    return HttpResponse.json({});
  }),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage(token = 'valid-token') {
  return render(
    <MemoryRouter initialEntries={[`/reset-password?token=${token}`]}>
      <ResetPasswordPage />
    </MemoryRouter>,
  );
}

describe('ResetPasswordPage', () => {
  it('renders the reset form', () => {
    renderPage();
    expect(screen.getByLabelText('Neues Passwort')).toBeInTheDocument();
    expect(screen.getByLabelText('Neues Passwort bestätigen')).toBeInTheDocument();
  });

  it('sets a new password with a valid token', async () => {
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Neues Passwort'), 'newpassword123');
    await user.type(screen.getByLabelText('Neues Passwort bestätigen'), 'newpassword123');
    await user.click(screen.getByRole('button', { name: 'Passwort speichern' }));

    await waitFor(() => expect(screen.getByText(/Dein Passwort wurde geändert/)).toBeInTheDocument());
    expect(lastResetBody).toEqual({ token: 'valid-token', new_password: 'newpassword123', new_password_confirmation: 'newpassword123' });
  });

  it('shows an invalid-token error for an expired/invalid token', async () => {
    renderPage('expired-token');
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Neues Passwort'), 'newpassword123');
    await user.type(screen.getByLabelText('Neues Passwort bestätigen'), 'newpassword123');
    await user.click(screen.getByRole('button', { name: 'Passwort speichern' }));

    await waitFor(() => expect(screen.getByText(/Der Link ist ungültig oder abgelaufen/)).toBeInTheDocument());
  });

  it('rejects a too-short password before submitting', async () => {
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Neues Passwort'), 'short');
    await user.type(screen.getByLabelText('Neues Passwort bestätigen'), 'short');
    await user.click(screen.getByRole('button', { name: 'Passwort speichern' }));

    expect(screen.queryByText(/Dein Passwort wurde geändert/)).not.toBeInTheDocument();
  });

  it('rejects a mismatched confirmation before submitting', async () => {
    renderPage();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText('Neues Passwort'), 'newpassword123');
    await user.type(screen.getByLabelText('Neues Passwort bestätigen'), 'different123');
    await user.click(screen.getByRole('button', { name: 'Passwort speichern' }));

    expect(screen.queryByText(/Dein Passwort wurde geändert/)).not.toBeInTheDocument();
  });
});
