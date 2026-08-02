import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { startAuthentication } from '@simplewebauthn/browser';
import type { PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/browser';
import { apiFetch, verifyMfaChallenge } from '../api/client';
import { setAccessToken, startImpersonation, stopImpersonation, onImpersonationEnded } from '../api/token';
import type { Me, MeUser, MfaLoginResult, SessionPayload } from '../api/types';
import { useIdleTimeout } from './useIdleTimeout';

type Status = 'loading' | 'anonymous' | 'authenticated';

export type LoginResult = 'logged_in' | { mfa_pending_token: string };

interface AuthContextValue {
  status: Status;
  user: MeUser | null;
  abilities: Record<string, string[]>;
  impersonating: boolean;
  mfaSetupRequired: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  completeMfaChallenge: (mfaPendingToken: string, input: { method: string; code: string; remember_device: boolean }) => Promise<void>;
  loginWithPasskey: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: MeUser) => void;
  refreshUser: () => Promise<void>;
  impersonate: (uuid: string) => Promise<void>;
  stopImpersonating: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [user, setUser] = useState<MeUser | null>(null);
  const [abilities, setAbilities] = useState<Record<string, string[]>>({});
  const [impersonating, setImpersonating] = useState(false);
  const [mfaSetupRequired, setMfaSetupRequired] = useState(false);

  const applyMe = useCallback((me: Me) => {
    setUser(me.user);
    setAbilities(me.abilities);
    setMfaSetupRequired(me.mfa_setup_required);
  }, []);

  // Named separately from the `logout` field on `value` below so the
  // idle-timeout effect can call it directly without depending on `value`
  // (which is itself built from this function) - both call the same
  // implementation, so there is exactly one logout code path.
  const performLogout = useCallback(async () => {
    await apiFetch<void>('/api/v1/session', { method: 'DELETE' }).catch(() => undefined);
    setAccessToken(null);
    setUser(null);
    setAbilities({});
    setStatus('anonymous');
  }, []);

  // Security-relevant idle-timeout logout (see CLAUDE.md's spec: "users
  // should be logged out when they are not active within 30 minutes...
  // configurable via .env... every click restarts this time window").
  // Enabled only while actually authenticated - an anonymous/loading visitor
  // has no session to time out, and firing logout() then would just be a
  // wasted DELETE /api/v1/session call. This is additive to, not a
  // replacement for, the existing JWT_ACCESS_TTL/JWT_REFRESH_TTL token
  // lifetimes (api/src/auth/tokenConfig.ts) - see useIdleTimeout.ts's doc
  // comment.
  useIdleTimeout(status === 'authenticated', () => { void performLogout(); });

  useEffect(() => {
    onImpersonationEnded(() => setImpersonating(false));
    return () => onImpersonationEnded(null);
  }, []);

  useEffect(() => {
    // Try to restore a session from the refresh cookie on first load.
    // `cancelled` guards against setting state (or, in a torn-down test
    // environment, touching `window` via React's own scheduling internals)
    // after this provider has already unmounted - e.g. a test that unmounts
    // before this fetch resolves, which otherwise surfaces as an unhandled
    // "window is not defined" rejection in a later, unrelated test file.
    let cancelled = false;
    apiFetch<Me>('/api/v1/me')
      .then((me) => {
        if (cancelled) return;
        applyMe(me); setStatus('authenticated');
      })
      .catch(() => { if (!cancelled) setStatus('anonymous'); });
    return () => { cancelled = true; };
  }, [applyMe]);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    user,
    abilities,
    impersonating,
    mfaSetupRequired,
    setUser,
    async login(email, password) {
      const response = await apiFetch<MfaLoginResult>('/api/v1/session', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (response.mfa_pending_token) return { mfa_pending_token: response.mfa_pending_token };

      setAccessToken(response.access_token!);
      const me = await apiFetch<Me>('/api/v1/me');
      applyMe(me);
      setStatus('authenticated');
      return 'logged_in';
    },
    async completeMfaChallenge(mfaPendingToken, input) {
      const session = await verifyMfaChallenge(mfaPendingToken, input);
      setAccessToken(session.access_token);
      const me = await apiFetch<Me>('/api/v1/me');
      applyMe(me);
      setStatus('authenticated');
    },
    async loginWithPasskey() {
      // Passwordless login (Task 15's routes): unlike password login, this
      // never yields `mfa_pending_token`/`setup_required` - the passkey
      // itself already IS the verified second factor (see session.ts's
      // verifyPasskeyLogin), so a successful assertion always produces a
      // full session directly.
      const options = await apiFetch<PublicKeyCredentialRequestOptionsJSON>('/api/v1/session/passkey/options', { method: 'POST' });
      const assertion = await startAuthentication({ optionsJSON: options });
      const session = await apiFetch<SessionPayload>('/api/v1/session/passkey/verify', {
        method: 'POST',
        body: JSON.stringify({ response: assertion }),
      });
      setAccessToken(session.access_token);
      const me = await apiFetch<Me>('/api/v1/me');
      applyMe(me);
      setStatus('authenticated');
    },
    logout: performLogout,
    async refreshUser() {
      const me = await apiFetch<Me>('/api/v1/me');
      applyMe(me);
    },
    async impersonate(uuid) {
      const session = await apiFetch<SessionPayload>(`/api/v1/members/${uuid}/impersonate`, { method: 'POST' });
      startImpersonation(session.access_token);
      const me = await apiFetch<Me>('/api/v1/me');
      applyMe(me);
      setImpersonating(true);
    },
    async stopImpersonating() {
      stopImpersonation();
      setImpersonating(false);
      const me = await apiFetch<Me>('/api/v1/me');
      applyMe(me);
    },
  }), [status, user, abilities, impersonating, mfaSetupRequired, performLogout, applyMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// oxlint-disable-next-line react/only-export-components -- hook belongs next to its context, fast-refresh-only concern
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
}
