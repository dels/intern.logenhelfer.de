import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeAll, beforeEach, afterEach, afterAll } from 'vitest';
import { MemoryRouter, Route, Routes, createMemoryRouter, RouterProvider } from 'react-router';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WebAuthnError, startAuthentication, browserSupportsWebAuthnAutofill, WebAuthnAbortService } from '@simplewebauthn/browser';
import LoginPage from './LoginPage';
import { AuthProvider } from '../auth/AuthProvider';
import { setAccessToken } from '../api/token';
import { routes } from '../routes';
import '../i18n';

vi.mock('@simplewebauthn/browser', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@simplewebauthn/browser')>();
  return { ...actual, startAuthentication: vi.fn(), browserSupportsWebAuthnAutofill: vi.fn() };
});

const user = { id: 1, email: 'a@b.de', firstname: 'Max', lastname: 'Muster', subscribed_to_announcements: false, gdpr_accepted: true };

const server = setupServer(
  http.get('/api/v1/me', () => new HttpResponse(null, { status: 401 })),
  http.get('/api/v1/public/landing', () => HttpResponse.json({ calendar_as_landing_page: false, lodge: 'Zur Morgenröte' })),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterEach(() => {
  server.resetHandlers();
  setAccessToken(null);
  vi.mocked(startAuthentication).mockReset();
  vi.mocked(browserSupportsWebAuthnAutofill).mockReset();
});
beforeEach(() => { vi.mocked(browserSupportsWebAuthnAutofill).mockResolvedValue(false); });
afterAll(() => server.close());

function renderLoginPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

// Renders LoginPage behind a real route table so navigate('/')/navigate('/mfa/setup')
// can be asserted by what actually ends up on screen, not just inferred.
function renderLoginPageWithRoutes() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/login']}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/mfa/setup" element={<div>mfa-setup-page</div>} />
            <Route path="/" element={<div>dashboard-page</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('LoginPage', () => {
  it('shows the configured lodge name instead of the literal "Logenhelfer"', async () => {
    renderLoginPage();
    expect(await screen.findByText('Zur Morgenröte')).toBeInTheDocument();
    expect(screen.queryByText('Logenhelfer')).not.toBeInTheDocument();
  });

  it('falls back to "Logenhelfer" while the lodge name has not loaded yet', () => {
    server.use(http.get('/api/v1/public/landing', () => new Promise(() => {})));
    renderLoginPage();
    expect(screen.getByText('Logenhelfer')).toBeInTheDocument();
  });

  it('falls back to "Logenhelfer" when the config request fails', async () => {
    server.use(http.get('/api/v1/public/landing', () => new HttpResponse(null, { status: 500 })));
    renderLoginPage();
    expect(await screen.findByText('Logenhelfer')).toBeInTheDocument();
  });

  it('renders the login form', () => {
    renderLoginPage();
    expect(screen.getByLabelText('E-Mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Passwort')).toBeInTheDocument();
  });

  describe('login failure messages', () => {
    async function submitLogin() {
      await userEvent.type(screen.getByLabelText('E-Mail'), 'a@b.de');
      await userEvent.type(screen.getByLabelText('Passwort'), 'wrong');
      await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }));
    }

    it('shows the invalid-credentials message on a 401', async () => {
      server.use(http.post('/api/v1/session', () => new HttpResponse(null, { status: 401 })));
      renderLoginPage();
      await submitLogin();
      expect(await screen.findByText('E-Mail oder Passwort ist falsch.')).toBeInTheDocument();
    });

    it('shows the network-error message on a 5xx', async () => {
      server.use(http.post('/api/v1/session', () => new HttpResponse(null, { status: 500 })));
      renderLoginPage();
      await submitLogin();
      expect(await screen.findByText('Der Server ist momentan nicht erreichbar. Bitte versuche es später erneut.')).toBeInTheDocument();
    });

    it('shows the network-error message on a raw network failure', async () => {
      server.use(http.post('/api/v1/session', () => HttpResponse.error()));
      renderLoginPage();
      await submitLogin();
      expect(await screen.findByText('Der Server ist momentan nicht erreichbar. Bitte versuche es später erneut.')).toBeInTheDocument();
    });

    it('does not show the network-error message for a 429 rate-limit response', async () => {
      server.use(http.post('/api/v1/session', () => HttpResponse.json({ error: 'too_many_requests' }, { status: 429 })));
      renderLoginPage();
      await submitLogin();
      expect(screen.queryByText('Der Server ist momentan nicht erreichbar. Bitte versuche es später erneut.')).not.toBeInTheDocument();
      expect(screen.queryByText('E-Mail oder Passwort ist falsch.')).not.toBeInTheDocument();
    });
  });

  describe('MFA challenge', () => {
    async function submitLoginForm() {
      await userEvent.type(screen.getByLabelText('E-Mail'), 'a@b.de');
      await userEvent.type(screen.getByLabelText('Passwort'), 'foobar123');
      await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }));
    }

    it('shows the challenge form (and hides the password form) when the account requires a second factor', async () => {
      server.use(
        http.post('/api/v1/session', () => HttpResponse.json({ mfa_pending_token: 'ptok' })),
        http.get('/api/v1/mfa/challenge/methods', () => HttpResponse.json({ methods: ['totp'] })),
      );
      renderLoginPage();
      await submitLoginForm();
      expect(await screen.findByLabelText(/code/i)).toBeInTheDocument();
      expect(screen.queryByLabelText('E-Mail')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Passwort')).not.toBeInTheDocument();
    });

    it('sends the mfa_pending_token (not a stale real access token) to both the methods lookup and the verify call', async () => {
      // Regression test: apiFetch's header-merge order spreads a stored real
      // access token LAST, which would silently clobber an explicit
      // Authorization header if the mfa-pending requests went through
      // apiFetch. Priming a stale token here would previously have leaked
      // into these requests instead of the pending token.
      setAccessToken('stale-real-access-token');
      let methodsAuthHeader: string | null = null;
      let verifyAuthHeader: string | null = null;
      server.use(
        http.post('/api/v1/session', () => HttpResponse.json({ mfa_pending_token: 'ptok' })),
        http.get('/api/v1/mfa/challenge/methods', ({ request }) => {
          methodsAuthHeader = request.headers.get('Authorization');
          return HttpResponse.json({ methods: ['totp'] });
        }),
        http.post('/api/v1/mfa/challenge/verify', ({ request }) => {
          verifyAuthHeader = request.headers.get('Authorization');
          return HttpResponse.json({ access_token: 'full-tok', user });
        }),
        http.get('/api/v1/me', ({ request }) => {
          if (request.headers.get('Authorization') === 'Bearer full-tok') return HttpResponse.json({ user, abilities: {} });
          return new HttpResponse(null, { status: 401 });
        }),
      );
      renderLoginPage();
      await submitLoginForm();
      await userEvent.type(await screen.findByLabelText(/code/i), '123456');
      await userEvent.click(screen.getByRole('button', { name: /bestätigen|confirm/i }));
      await vi.waitFor(() => expect(verifyAuthHeader).not.toBeNull());
      expect(methodsAuthHeader).toBe('Bearer ptok');
      expect(verifyAuthHeader).toBe('Bearer ptok');
    });

    it('completes the challenge and reaches the dashboard on a correct code', async () => {
      server.use(
        http.post('/api/v1/session', () => HttpResponse.json({ mfa_pending_token: 'ptok' })),
        http.get('/api/v1/mfa/challenge/methods', () => HttpResponse.json({ methods: ['totp'] })),
        http.post('/api/v1/mfa/challenge/verify', () => HttpResponse.json({ access_token: 'full-tok', user })),
        http.get('/api/v1/me', ({ request }) => {
          if (request.headers.get('Authorization') === 'Bearer full-tok') return HttpResponse.json({ user, abilities: {} });
          return new HttpResponse(null, { status: 401 });
        }),
      );
      renderLoginPageWithRoutes();
      await submitLoginForm();
      await userEvent.type(await screen.findByLabelText(/code/i), '123456');
      await userEvent.click(screen.getByRole('button', { name: /bestätigen|confirm/i }));
      expect(await screen.findByText('dashboard-page')).toBeInTheDocument();
    });

    it('shows an invalid-code message and stays on the challenge form on a 401', async () => {
      server.use(
        http.post('/api/v1/session', () => HttpResponse.json({ mfa_pending_token: 'ptok' })),
        http.get('/api/v1/mfa/challenge/methods', () => HttpResponse.json({ methods: ['totp'] })),
        http.post('/api/v1/mfa/challenge/verify', () => new HttpResponse(null, { status: 401 })),
      );
      renderLoginPage();
      await submitLoginForm();
      await userEvent.type(await screen.findByLabelText(/code/i), '000000');
      await userEvent.click(screen.getByRole('button', { name: /bestätigen|confirm/i }));
      expect(await screen.findByText('Der eingegebene Code ist ungültig.')).toBeInTheDocument();
      expect(screen.getByLabelText(/code/i)).toBeInTheDocument();
    });

    it('lets the user cancel back to the plain login form', async () => {
      server.use(
        http.post('/api/v1/session', () => HttpResponse.json({ mfa_pending_token: 'ptok' })),
        http.get('/api/v1/mfa/challenge/methods', () => HttpResponse.json({ methods: ['totp'] })),
      );
      renderLoginPage();
      await submitLoginForm();
      await screen.findByLabelText(/code/i);
      await userEvent.click(screen.getByText('Zurück zur Anmeldung'));
      expect(await screen.findByLabelText('E-Mail')).toBeInTheDocument();
      expect(screen.queryByLabelText(/code/i)).not.toBeInTheDocument();
    });

    it('reaches /mfa/setup (not bounced back to login) when the account must enroll before continuing', async () => {
      // Task 21b: session.ts's zero-methods branch now always issues a full
      // session (access_token + refresh cookie), with `setup_required` kept
      // only as an advisory flag - RequireAuth (app/src/auth/RequireAuth.tsx)
      // is what actually forces the wizard, via GET /me's mfa_setup_required.
      // This replaces the old two-test pair (a passing "LoginPage navigates
      // straight to /mfa/setup" check plus a documented "KNOWN GAP" test
      // showing the real route table bounced back to /login instead) - the
      // gap that test documented is what this task fixes.
      server.use(
        http.post('/api/v1/session', () => HttpResponse.json({ access_token: 'setup-tok', user, setup_required: true })),
        http.get('/api/v1/me', ({ request }) => {
          if (request.headers.get('Authorization') === 'Bearer setup-tok') {
            return HttpResponse.json({ user, abilities: {}, mfa_setup_required: true });
          }
          return new HttpResponse(null, { status: 401 });
        }),
      );
      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      const router = createMemoryRouter(routes, { initialEntries: ['/login'] });
      render(
        <QueryClientProvider client={queryClient}>
          <AuthProvider><RouterProvider router={router} /></AuthProvider>
        </QueryClientProvider>,
      );
      await submitLoginForm();
      expect(await screen.findByText(/zwei-faktor-authentifizierung einrichten/i)).toBeInTheDocument();
      expect(screen.queryByLabelText('E-Mail')).not.toBeInTheDocument();
    });
  });

  describe('passkey login', () => {
    it('signs in with a passkey and reaches the dashboard', async () => {
      server.use(
        http.post('/api/v1/session/passkey/options', () => HttpResponse.json({ challenge: 'chal', allowCredentials: [] })),
        http.post('/api/v1/session/passkey/verify', () => HttpResponse.json({ access_token: 'passkey-tok', user })),
        http.get('/api/v1/me', ({ request }) => {
          if (request.headers.get('Authorization') === 'Bearer passkey-tok') return HttpResponse.json({ user, abilities: {} });
          return new HttpResponse(null, { status: 401 });
        }),
      );
      vi.mocked(startAuthentication).mockResolvedValueOnce({
        id: 'cred-1', rawId: 'cred-1', type: 'public-key',
        response: { clientDataJSON: '', authenticatorData: '', signature: '' },
        clientExtensionResults: {},
      } as never);
      renderLoginPageWithRoutes();
      await userEvent.click(screen.getByRole('button', { name: /passkey/i }));
      expect(await screen.findByText('dashboard-page')).toBeInTheDocument();
    });

    it('does not show an error when the user cancels the passkey prompt', async () => {
      server.use(http.post('/api/v1/session/passkey/options', () => HttpResponse.json({ challenge: 'chal', allowCredentials: [] })));
      vi.mocked(startAuthentication).mockRejectedValueOnce(
        new WebAuthnError({ message: 'ceremony aborted', code: 'ERROR_CEREMONY_ABORTED', cause: new Error('AbortError') }),
      );
      renderLoginPage();
      const button = screen.getByRole('button', { name: /passkey/i });
      await userEvent.click(button);
      await vi.waitFor(() => expect(button).not.toBeDisabled());
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('shows a passkey-specific error message when verification fails', async () => {
      server.use(
        http.post('/api/v1/session/passkey/options', () => HttpResponse.json({ challenge: 'chal', allowCredentials: [] })),
        http.post('/api/v1/session/passkey/verify', () => new HttpResponse(null, { status: 401 })),
      );
      vi.mocked(startAuthentication).mockResolvedValueOnce({
        id: 'cred-1', rawId: 'cred-1', type: 'public-key',
        response: { clientDataJSON: '', authenticatorData: '', signature: '' },
        clientExtensionResults: {},
      } as never);
      renderLoginPage();
      await userEvent.click(screen.getByRole('button', { name: /passkey/i }));
      expect(await screen.findByText('Die Anmeldung mit dem Passkey ist fehlgeschlagen.')).toBeInTheDocument();
    });
  });

  describe('passkey conditional autofill', () => {
    it('automatically completes login via autofill with no click, when the browser supports it', async () => {
      vi.mocked(browserSupportsWebAuthnAutofill).mockResolvedValue(true);
      server.use(
        http.post('/api/v1/session/passkey/options', () => HttpResponse.json({ challenge: 'chal', allowCredentials: [] })),
        http.post('/api/v1/session/passkey/verify', () => HttpResponse.json({ access_token: 'passkey-tok', user })),
        http.get('/api/v1/me', ({ request }) => {
          if (request.headers.get('Authorization') === 'Bearer passkey-tok') return HttpResponse.json({ user, abilities: {} });
          return new HttpResponse(null, { status: 401 });
        }),
      );
      vi.mocked(startAuthentication).mockResolvedValueOnce({
        id: 'cred-1', rawId: 'cred-1', type: 'public-key',
        response: { clientDataJSON: '', authenticatorData: '', signature: '' },
        clientExtensionResults: {},
      } as never);

      renderLoginPageWithRoutes();

      expect(await screen.findByText('dashboard-page')).toBeInTheDocument();
      expect(startAuthentication).toHaveBeenCalledWith(
        expect.objectContaining({ useBrowserAutofill: true }),
      );
    });

    it('logs a console message and never attempts a ceremony when the browser lacks autofill support', async () => {
      vi.mocked(browserSupportsWebAuthnAutofill).mockResolvedValue(false);
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {});

      renderLoginPage();
      await screen.findByLabelText('E-Mail');

      expect(startAuthentication).not.toHaveBeenCalled();
      expect(infoSpy).toHaveBeenCalledWith('Passkey autofill not supported in this browser');

      infoSpy.mockRestore();
    });

    it('shows the passkey-specific error message when a verification triggered via autofill fails', async () => {
      vi.mocked(browserSupportsWebAuthnAutofill).mockResolvedValue(true);
      server.use(
        http.post('/api/v1/session/passkey/options', () => HttpResponse.json({ challenge: 'chal', allowCredentials: [] })),
        http.post('/api/v1/session/passkey/verify', () => new HttpResponse(null, { status: 401 })),
      );
      vi.mocked(startAuthentication).mockResolvedValueOnce({
        id: 'cred-1', rawId: 'cred-1', type: 'public-key',
        response: { clientDataJSON: '', authenticatorData: '', signature: '' },
        clientExtensionResults: {},
      } as never);

      renderLoginPage();
      expect(await screen.findByText('Die Anmeldung mit dem Passkey ist fehlgeschlagen.')).toBeInTheDocument();
    });

    it('cancels the pending autofill ceremony when the user submits the password login form', async () => {
      vi.mocked(browserSupportsWebAuthnAutofill).mockResolvedValue(true);
      server.use(
        http.post('/api/v1/session/passkey/options', () => HttpResponse.json({ challenge: 'chal', allowCredentials: [] })),
        http.post('/api/v1/session', () => HttpResponse.json({ access_token: 'pw-tok', user })),
        http.get('/api/v1/me', ({ request }) => {
          if (request.headers.get('Authorization') === 'Bearer pw-tok') return HttpResponse.json({ user, abilities: {} });
          return new HttpResponse(null, { status: 401 });
        }),
      );
      vi.mocked(startAuthentication).mockImplementation(() => new Promise(() => {}));
      const cancelSpy = vi.spyOn(WebAuthnAbortService, 'cancelCeremony');

      renderLoginPageWithRoutes();
      await waitFor(() => expect(startAuthentication).toHaveBeenCalled());

      await userEvent.type(screen.getByLabelText('E-Mail'), 'a@b.de');
      await userEvent.type(screen.getByLabelText('Passwort'), 'foobar123');
      await userEvent.click(screen.getByRole('button', { name: 'Anmelden' }));

      expect(cancelSpy).toHaveBeenCalled();
      expect(await screen.findByText('dashboard-page')).toBeInTheDocument();
      cancelSpy.mockRestore();
    });

    it('still successfully logs in via the explicit passkey button while an autofill ceremony is pending', async () => {
      // Exercises the library's own auto-cancel-on-new-ceremony behavior
      // end-to-end: `startAuthentication` internally cancels any pending
      // ceremony via `WebAuthnAbortService` the instant it's called again,
      // so the app needs no explicit cancel call before the button's own
      // ceremony starts.
      vi.mocked(browserSupportsWebAuthnAutofill).mockResolvedValue(true);
      server.use(
        http.post('/api/v1/session/passkey/options', () => HttpResponse.json({ challenge: 'chal', allowCredentials: [] })),
        http.post('/api/v1/session/passkey/verify', () => HttpResponse.json({ access_token: 'passkey-tok', user })),
        http.get('/api/v1/me', ({ request }) => {
          if (request.headers.get('Authorization') === 'Bearer passkey-tok') return HttpResponse.json({ user, abilities: {} });
          return new HttpResponse(null, { status: 401 });
        }),
      );
      vi.mocked(startAuthentication)
        .mockImplementationOnce(() => new Promise(() => {})) // the pending autofill ceremony, never resolves
        .mockResolvedValueOnce({
          id: 'cred-1', rawId: 'cred-1', type: 'public-key',
          response: { clientDataJSON: '', authenticatorData: '', signature: '' },
          clientExtensionResults: {},
        } as never);

      renderLoginPageWithRoutes();
      await waitFor(() => expect(startAuthentication).toHaveBeenCalledTimes(1));

      await userEvent.click(screen.getByRole('button', { name: /passkey/i }));

      expect(await screen.findByText('dashboard-page')).toBeInTheDocument();
    });

    it('cancels the pending autofill ceremony on unmount', async () => {
      vi.mocked(browserSupportsWebAuthnAutofill).mockResolvedValue(true);
      server.use(http.post('/api/v1/session/passkey/options', () => HttpResponse.json({ challenge: 'chal', allowCredentials: [] })));
      vi.mocked(startAuthentication).mockImplementation(() => new Promise(() => {}));
      const cancelSpy = vi.spyOn(WebAuthnAbortService, 'cancelCeremony');

      const { unmount } = renderLoginPage();
      await waitFor(() => expect(startAuthentication).toHaveBeenCalled());
      unmount();

      expect(cancelSpy).toHaveBeenCalled();
      cancelSpy.mockRestore();
    });

    it('never attempts a passkey ceremony if the component unmounts before the availability check resolves', async () => {
      // Simulates a fast typist who submits the password form and navigates
      // away (unmounting LoginPage) before browserSupportsWebAuthnAutofill()
      // has resolved. We control resolution ourselves and only resolve it
      // (as "supported") after the component is already gone, to prove the
      // stale .then() callback is a no-op post-unmount.
      //
      // The passkey options endpoint is mocked (like the other tests in this
      // block) so that, absent the unmount guard, attemptPasskeyLogin would
      // actually reach startAuthentication rather than failing earlier for
      // an unrelated reason (an unmocked request) - that would make this
      // test pass "by accident" instead of actually exercising the guard.
      server.use(http.post('/api/v1/session/passkey/options', () => HttpResponse.json({ challenge: 'chal', allowCredentials: [] })));
      vi.mocked(startAuthentication).mockImplementation(() => new Promise(() => {}));
      let resolveSupported: (value: boolean) => void = () => {};
      vi.mocked(browserSupportsWebAuthnAutofill).mockImplementation(
        () => new Promise((resolve) => { resolveSupported = resolve; }),
      );

      const { unmount } = renderLoginPage();
      unmount();

      resolveSupported(true);
      // Flush the microtask queue (and the options fetch's own promise chain)
      // so the (guarded) .then() callback, and anything it would have
      // triggered, gets a chance to run.
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(startAuthentication).not.toHaveBeenCalled();
    });
  });
});
