import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { startRegistration, WebAuthnError } from '@simplewebauthn/browser';
import MfaSetupWizard from './MfaSetupWizard';
import { AuthProvider } from '../../auth/AuthProvider';
import { ToastProvider } from '../../notifications/ToastProvider';
import '../../i18n';

vi.mock('@simplewebauthn/browser', async () => {
  const actual = await vi.importActual<typeof import('@simplewebauthn/browser')>('@simplewebauthn/browser');
  return { ...actual, startRegistration: vi.fn() };
});

const meUser = { id: 1, email: 'a@b.de', firstname: null, lastname: null, subscribed_to_announcements: false, gdpr_accepted: true };

const server = setupServer(
  http.post('/api/v1/mfa/setup/start', async ({ request }) => {
    const body = (await request.json()) as { method: string };
    return body.method === 'passkey'
      ? HttpResponse.json({ challenge: 'chal', rp: { id: 'localhost', name: 'Logenhelfer' }, user: { id: 'AQ', name: 'a@b.de', displayName: 'a@b.de' }, pubKeyCredParams: [] })
      : HttpResponse.json({ otpauth_uri: 'otpauth://totp/Logenhelfer:brother@example.de?secret=ABC', qr_code_data_url: 'data:image/png;base64,abc' });
  }),
  http.post('/api/v1/mfa/setup/totp/verify', () => HttpResponse.json({ backup_codes: ['AAAAA-BBBBB'] })),
  http.post('/api/v1/mfa/setup/passkey/verify', () => HttpResponse.json({ backup_codes: ['CCCCC-DDDDD'] })),
  // AuthProvider's bootstrap effect and its refreshUser() (called by the new
  // Continue button below) both hit GET /me - a single unconditional mock is
  // enough here since this test never depends on the Authorization header
  // distinguishing callers, unlike auth.test.tsx/LoginPage.test.tsx.
  http.get('/api/v1/me', () => HttpResponse.json({ user: meUser, abilities: {}, mfa_setup_required: false })),
  http.get('/api/v1/mfa/status', () => HttpResponse.json({ methods: ['totp'], mode: 'optional', grace_period_ends_at: null })),
  http.get('/api/v1/mfa/passkeys', () => HttpResponse.json({ credentials: [] })),
  http.delete('/api/v1/mfa/methods/:type', () => new HttpResponse(null, { status: 204 })),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderWizard() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/mfa/setup']}>
            <Routes>
              <Route path="/mfa/setup" element={<MfaSetupWizard />} />
              <Route path="/dashboard" element={<div>dashboard-page</div>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('MfaSetupWizard', () => {
  it('walks through TOTP setup, shows backup codes once, and Continue re-fetches /me then navigates to the dashboard', async () => {
    renderWizard();
    await userEvent.click(await screen.findByRole('button', { name: /authenticator app/i }));
    await screen.findByAltText(/qr/i);
    await userEvent.type(screen.getByLabelText(/code/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /bestätigen|confirm/i }));
    await waitFor(() => expect(screen.getByText('AAAAA-BBBBB')).toBeInTheDocument());

    const continueButton = screen.getByRole('button', { name: /weiter zum dashboard|continue to dashboard/i });
    await userEvent.click(continueButton);

    expect(await screen.findByText('dashboard-page')).toBeInTheDocument();
  });

  it('completes the passkey registration ceremony end to end', async () => {
    vi.mocked(startRegistration).mockResolvedValue({
      id: 'cred-a', rawId: 'cred-a', type: 'public-key', clientExtensionResults: {},
      response: { clientDataJSON: 'x', attestationObject: 'y', transports: [] },
    } as never);
    renderWizard();

    await userEvent.click(await screen.findByRole('button', { name: /passkey/i }));

    await waitFor(() => expect(screen.getByText('CCCCC-DDDDD')).toBeInTheDocument());
  });

  it('silently does nothing when the user cancels the passkey prompt', async () => {
    vi.mocked(startRegistration).mockRejectedValue(new WebAuthnError({ message: 'aborted', code: 'ERROR_CEREMONY_ABORTED', cause: new Error('aborted') }));
    renderWizard();

    await userEvent.click(await screen.findByRole('button', { name: /passkey/i }));

    await waitFor(() => expect(screen.getByRole('button', { name: /passkey/i })).toBeInTheDocument());
    expect(screen.queryByText(/fehlgeschlagen|failed/i)).not.toBeInTheDocument();
  });

  // Regression test for the minor review finding: startPasskey's initial,
  // no-proof `start` call (this is the first-enrollment path - `mode`
  // defaults to 'initial' here, so no proof is ever sent) used to be lumped
  // into the same try/catch as the WebAuthn ceremony itself, so ANY failure
  // here showed "Passkey registration failed" - which used to also be shown
  // (wrongly) for a proof-check failure on the manage-mode path, see the
  // sibling test below. Asserting the *specific* passkeyFailed message
  // (not proofFailed) here is what would catch a regression that flips the
  // proof-conditional back to unconditional.
  it('shows the generic passkey-failed message (not a proof-failed message) when /setup/start fails with no proof involved', async () => {
    server.use(http.post('/api/v1/mfa/setup/start', () => HttpResponse.json({ error: 'server_error' }, { status: 500 })));
    renderWizard();

    await userEvent.click(await screen.findByRole('button', { name: /passkey/i }));

    await waitFor(() => expect(screen.getByText(/passkey registration failed|passkey-registrierung fehlgeschlagen/i)).toBeInTheDocument());
    expect(screen.queryByText(/verification failed|bestätigung fehlgeschlagen/i)).not.toBeInTheDocument();
  });
});

function renderWizardInManageMode() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/account/security']}>
            <MfaSetupWizard mode="manage" />
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('MfaSetupWizard in manage mode', () => {
  it('shows the current methods list before the add-a-method chooser', async () => {
    renderWizardInManageMode();

    expect(await screen.findByText(/authenticator app/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^entfernen$|^remove$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /e-mail|email/i })).toBeInTheDocument();
  });

  it('collects proof before starting a new totp enrollment when a method already exists', async () => {
    renderWizardInManageMode();
    await userEvent.click(await screen.findByRole('button', { name: /authenticator app \(totp\)|authenticator app/i, hidden: true }));

    expect(await screen.findByText(/bestätige deine identität|confirm your identity/i)).toBeInTheDocument();
  });

  // Regression test for the minor review finding, opposite side of the one
  // above renderWizard(): here the `start` call for passkey re-enrollment IS
  // proof-gated (existingMethods is non-empty in manage mode), so a failure
  // must show proofFailed, not the generic passkeyFailed message it used to
  // show unconditionally before the fix.
  it('shows a proof-failed (not passkey-failed) message when the proof-gated start call fails during passkey re-enrollment', async () => {
    server.use(http.post('/api/v1/mfa/setup/start', () => HttpResponse.json({ error: 'unprocessable_entity' }, { status: 422 })));
    renderWizardInManageMode();
    await userEvent.click(await screen.findByRole('button', { name: /^passkey$/i }));
    await userEvent.type(await screen.findByLabelText(/code/i), '000000');
    await userEvent.click(screen.getByRole('button', { name: /bestätigen|confirm/i }));

    await waitFor(() => expect(screen.getByText(/verification failed|bestätigung fehlgeschlagen/i)).toBeInTheDocument());
    expect(screen.queryByText(/passkey registration failed|passkey-registrierung fehlgeschlagen/i)).not.toBeInTheDocument();
  });

  it('removes a method after confirming proof', async () => {
    renderWizardInManageMode();
    await userEvent.click(await screen.findByRole('button', { name: /^entfernen$|^remove$/i }));
    await userEvent.type(screen.getByLabelText(/code/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /bestätigen|confirm/i }));

    await waitFor(() => expect(screen.queryByText(/bestätige deine identität|confirm your identity/i)).not.toBeInTheDocument());
  });

  it('disables Remove for the only method when mandatory MFA\'s grace period has passed (defense in depth - the server enforces this too, see Task 2)', async () => {
    server.use(
      http.get('/api/v1/mfa/status', () => HttpResponse.json({
        methods: ['totp'], mode: 'mandatory', grace_period_ends_at: '2020-01-01T00:00:00Z',
      })),
    );
    renderWizardInManageMode();

    expect(await screen.findByRole('button', { name: /^entfernen$|^remove$/i })).toBeDisabled();
  });

  it('does not disable Remove when a second method exists, even past the grace period', async () => {
    server.use(
      http.get('/api/v1/mfa/status', () => HttpResponse.json({
        methods: ['totp', 'email'], mode: 'mandatory', grace_period_ends_at: '2020-01-01T00:00:00Z',
      })),
    );
    renderWizardInManageMode();

    const removeButtons = await screen.findAllByRole('button', { name: /^entfernen$|^remove$/i });
    expect(removeButtons.every((btn) => !(btn as HTMLButtonElement).disabled)).toBe(true);
  });

  // Regression test: useVerifyPasskeySetup's onSuccess previously invalidated
  // only ['mfa-status'], not ['mfa-passkeys'] - the query this list's passkey
  // rows are actually sourced from - so a newly-added passkey never showed up
  // here until an unrelated refetch happened to fire.
  it('shows a newly added passkey in the methods list after enrolling one in manage mode', async () => {
    vi.mocked(startRegistration).mockResolvedValue({
      id: 'cred-a', rawId: 'cred-a', type: 'public-key', clientExtensionResults: {},
      response: { clientDataJSON: 'x', attestationObject: 'y', transports: [] },
    } as never);
    let passkeyAdded = false;
    server.use(
      http.get('/api/v1/mfa/passkeys', () => HttpResponse.json({
        credentials: passkeyAdded
          ? [{ credential_id: 'cred-a', name: 'My passkey', created_at: '2026-01-01T00:00:00Z', last_used_at: null }]
          : [],
      })),
      http.post('/api/v1/mfa/setup/passkey/verify', () => {
        passkeyAdded = true;
        return HttpResponse.json({ backup_codes: ['EEEEE-FFFFF'] });
      }),
    );
    renderWizardInManageMode();

    await userEvent.click(await screen.findByRole('button', { name: /^passkey$/i }));
    await userEvent.type(await screen.findByLabelText(/code/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /bestätigen|confirm/i }));

    await waitFor(() => expect(screen.getByText('EEEEE-FFFFF')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /weiter|continue/i }));

    expect(await screen.findByText('My passkey')).toBeInTheDocument();
  });

  it('shows an error toast when proof verification fails during removal', async () => {
    server.use(
      http.delete('/api/v1/mfa/methods/:type', () => HttpResponse.json({ error: 'unprocessable_entity' }, { status: 422 })),
    );
    renderWizardInManageMode();
    await userEvent.click(await screen.findByRole('button', { name: /^entfernen$|^remove$/i }));
    await userEvent.type(screen.getByLabelText(/code/i), '000000');
    await userEvent.click(screen.getByRole('button', { name: /bestätigen|confirm/i }));

    await waitFor(() => expect(screen.getByText(/verification failed|bestätigung fehlgeschlagen/i)).toBeInTheDocument());
  });
});
