import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import MfaSecurityPage from './MfaSecurityPage';
import { AuthProvider } from '../../auth/AuthProvider';
import { ToastProvider } from '../../notifications/ToastProvider';
import '../../i18n';

const meUser = { id: 1, email: 'a@b.de', firstname: null, lastname: null, subscribed_to_announcements: false, gdpr_accepted: true };

// Mutable, per-test-reseeded backing store for the trusted-devices handlers
// below (see the beforeEach reset) - a static single-response GET mock would
// make the "revokes a trusted device" test pass for the wrong reason (any
// component-local list filtering would satisfy it, whether or not the
// DELETE -> invalidateQueries -> refetch flow in useRevokeTrustedDevice
// (api.ts) actually works). Modeling the DELETE as actually mutating what
// the GET handler subsequently returns is what makes that test a genuine
// assertion about the real request flow.
let trustedDevices: Array<{ id: number; user_agent: string | null; last_ip: string | null; created_at: string; expires_at: string }>;

const server = setupServer(
  http.get('/api/v1/me', () => HttpResponse.json({ user: meUser, abilities: {}, mfa_setup_required: false })),
  http.get('/api/v1/mfa/status', () => HttpResponse.json({ methods: ['totp'], mode: 'optional', grace_period_ends_at: null })),
  http.get('/api/v1/mfa/passkeys', () => HttpResponse.json({ credentials: [] })),
  http.post('/api/v1/mfa/backup-codes/regenerate', async ({ request }) => {
    // Mirrors the real endpoint's contract (api/src/routes/mfa.ts,
    // openapi.yaml): a flat `{ method, code }` body is required as proof of
    // an existing method - a missing/wrong code 422s, exactly like the real
    // verifyExistingMfaProof gate. The original version of this mock
    // returned 200 unconditionally with no body at all, which is exactly
    // what hid the production bug where the "Regenerate backup codes"
    // button called this endpoint with no proof.
    const body = (await request.json()) as { method?: string; code?: string };
    if (body.method !== 'totp' || body.code !== '123456') {
      return HttpResponse.json({ error: 'unprocessable', detail: 'Code ist ungültig' }, { status: 422 });
    }
    return HttpResponse.json({ backup_codes: ['EEEEE-FFFFF'] });
  }),
  http.get('/api/v1/mfa/trusted-devices', () => HttpResponse.json({ devices: trustedDevices })),
  http.delete('/api/v1/mfa/trusted-devices/:id', ({ params }) => {
    trustedDevices = trustedDevices.filter((d) => String(d.id) !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),
);

beforeAll(() => server.listen());
beforeEach(() => {
  trustedDevices = [{ id: 1, user_agent: 'Chrome on macOS', last_ip: null, created_at: '2026-01-01T00:00:00Z', expires_at: '2026-06-01T00:00:00Z' }];
});
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderPage() {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={['/account/security']}>
            <MfaSecurityPage />
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe('MfaSecurityPage', () => {
  it('renders the methods list, backup codes section, and trusted devices section', async () => {
    renderPage();

    expect(await screen.findByText(/authenticator app/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /neue backup-codes|regenerate backup codes/i })).toBeInTheDocument();
    expect(await screen.findByText('Chrome on macOS')).toBeInTheDocument();
  });

  // Regression test: the trusted-device's expiry used to be rendered as the
  // raw `expires_at` ISO string (e.g. "2026-06-01T00:00:00Z") instead of
  // being run through this codebase's shared formatDate() convention -
  // asserting the raw string is absent is what a locale-formatted render
  // must satisfy (a specific formatted string would be timezone/ICU-version
  // dependent, so this checks the actual bug rather than one exact format).
  it("formats the trusted device's expiry date instead of showing the raw ISO string", async () => {
    renderPage();

    await screen.findByText('Chrome on macOS');
    expect(screen.queryByText('2026-06-01T00:00:00Z')).not.toBeInTheDocument();
  });

  // Regression test: the "Regenerate backup codes" button used to call
  // useRegenerateBackupCodes with no proof at all, which the real backend
  // (unlike this test's original always-200 mock) rejects with 422 - so
  // clicking the button silently did nothing in production. Proof must now
  // be collected via MfaProofDialog (the same component add/remove-method
  // flows already use) before the request is sent.
  it('regenerates backup codes: opens the proof dialog, submits a valid proof, and shows the new codes', async () => {
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /neue backup-codes|regenerate backup codes/i }));

    expect(await screen.findByText(/bestätige deine identität|confirm your identity/i)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/code/i), '123456');
    await userEvent.click(screen.getByRole('button', { name: /bestätigen|confirm/i }));

    await waitFor(() => expect(screen.getByText('EEEEE-FFFFF')).toBeInTheDocument());
  });

  it('shows an error toast and no new codes when the submitted proof is wrong', async () => {
    renderPage();
    await userEvent.click(await screen.findByRole('button', { name: /neue backup-codes|regenerate backup codes/i }));

    await userEvent.type(await screen.findByLabelText(/code/i), '000000');
    await userEvent.click(screen.getByRole('button', { name: /bestätigen|confirm/i }));

    await waitFor(() => expect(screen.getByText(/verification failed|bestätigung fehlgeschlagen/i)).toBeInTheDocument());
    expect(screen.queryByText('EEEEE-FFFFF')).not.toBeInTheDocument();
    // Matches the add/remove-method proof-failure pattern in
    // MfaSetupWizard.test.tsx: the dialog closes on submit regardless of
    // outcome (errors surface via toast, not by keeping the dialog open).
    // MUI's Dialog exit transition means the title isn't removed from the
    // DOM synchronously on close - wait for it, same as that file's own
    // equivalent assertion.
    await waitFor(() => expect(screen.queryByText(/bestätige deine identität|confirm your identity/i)).not.toBeInTheDocument());
  });

  it('revokes a trusted device', async () => {
    renderPage();
    // The manage-mode wizard's own methods list (rendered above this section)
    // also has an "Entfernen"/"Remove" button per method (see MfaSetupWizard.tsx),
    // with the same accessible name as this section's per-device revoke button -
    // wait for the device row to render first, then take the LAST match (this
    // section always renders after the wizard's methods list in document order),
    // so this doesn't race/misclick the wizard's own remove button instead.
    await screen.findByText('Chrome on macOS');
    const revokeButtons = screen.getAllByRole('button', { name: /^entfernen$|^revoke$/i });
    await userEvent.click(revokeButtons[revokeButtons.length - 1]!);

    await waitFor(() => expect(screen.queryByText('Chrome on macOS')).not.toBeInTheDocument());
  });
});
