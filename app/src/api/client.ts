import { getAccessToken, setAccessToken, isImpersonating, notifyImpersonationEnded, stopImpersonation } from './token';
import type { SessionPayload } from './types';
import { reportFailure, reportSuccess } from './serverStatus';

export class ApiError extends Error {
  readonly status: number;
  readonly body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
    this.name = 'ApiError';
  }
}

// A request that hangs (connection accepted, never responds - e.g. a
// degraded upstream, unlike a clean connection-refused) would otherwise wait
// on the browser's own OS-level timeout (can be a minute or more), leaving
// the user staring at a stuck spinner with none of the app's existing error
// messaging/ServerStatusBanner ever firing, since that only triggers on a
// settled (rejected or 5xx) response. Bounding every fetch to this timeout
// turns a silent hang into a real rejection, which the existing catch blocks
// below already classify as a network error.
export const REQUEST_TIMEOUT_MS = 15_000;
// File downloads legitimately run longer than a normal API round-trip on a
// slow connection - a large attachment shouldn't hit the same 15s bound.
const DOWNLOAD_TIMEOUT_MS = 60_000;

function fetchWithTimeout(path: string, init: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(path, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

// The Rails API's error responses are `{ error, detail? }` (see Api::V1::BaseController
// and EventsController) - surface `detail` when present so a 422 reads as a real
// validation message ("Zeit muss ausgefüllt werden") instead of a generic failure.
export function apiErrorMessage(error: unknown): string | null {
  if (!error) return null;
  if (error instanceof ApiError && typeof error.body === 'object' && error.body !== null && 'detail' in error.body) {
    const detail = (error.body as { detail?: unknown }).detail;
    if (typeof detail === 'string') return detail;
  }
  return error instanceof Error ? error.message : String(error);
}

let refreshInFlight: Promise<boolean> | null = null;

// Exported so AuthProvider's cold-boot mount effect can call this directly
// (skipping the guaranteed-401 `/me` call that would otherwise trigger it
// indirectly via apiFetch's own 401-retry below) - see AuthProvider.tsx's
// bootstrap effect. `refreshInFlight` dedup means a concurrent direct call
// and an apiFetch-triggered call share the same in-flight request rather
// than firing two refreshes.
export function refreshSession(): Promise<boolean> {
  refreshInFlight ??= fetchWithTimeout('/api/v1/session/refresh', { method: 'POST', credentials: 'include' })
    .then(async (res) => {
      reportSuccess(); // any response at all proves connectivity, regardless of its status
      if (!res.ok) {
        if (res.status >= 500) reportFailure();
        return false;
      }
      const body = (await res.json()) as SessionPayload;
      setAccessToken(body.access_token);
      return true;
    })
    .catch(() => { reportFailure(); return false; })
    .finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isSessionEndpoint = path.startsWith('/api/v1/session');
  const isFormData = init.body instanceof FormData;

  const run = () => {
    const token = getAccessToken();
    return fetchWithTimeout(path, {
      ...init,
      credentials: 'include',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(init.headers ?? {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  };

  let res: Response;
  try {
    res = await run();
  } catch (err) {
    reportFailure();
    throw err;
  }
  reportSuccess(); // any response at all proves connectivity, regardless of its status

  if (res.status === 401 && !isSessionEndpoint) {
    if (isImpersonating()) { stopImpersonation(); notifyImpersonationEnded(); }
    if (await refreshSession()) {
      try {
        res = await run();
      } catch (err) {
        reportFailure();
        throw err;
      }
      reportSuccess();
    }
  }
  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.clone().json();
    } catch {
      body = undefined;
    }
    if (res.status >= 500) reportFailure();
    throw new ApiError(res.status, `${init.method ?? 'GET'} ${path} → ${res.status}`, body);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// Requests scoped to the short-lived, narrowly-scoped MFA "pending" token
// minted by POST /api/v1/session on a password login that still needs a
// second factor (see api/src/routes/mfaChallenge.ts's requireMfaPendingToken)
// - NOT the user's real access token, and there usually isn't one yet at
// this point in the login flow anyway. This deliberately bypasses apiFetch:
// apiFetch's header merge spreads getAccessToken()'s value LAST (see its own
// object literal above), so an explicit Authorization header passed through
// apiFetch's `init.headers` can be silently overwritten by whatever real
// token happens to be in memory - a correctness landmine on a
// security-sensitive path (the request would authenticate as the wrong
// identity/token type instead of failing loudly). refreshSession() above
// sidesteps the same kind of "special, non-standard token" problem the same
// way, with a raw fetch() instead of apiFetch - this mirrors that pattern.
async function mfaPendingFetch<T>(path: string, mfaPendingToken: string, init: RequestInit = {}): Promise<T> {
  const res = await fetchWithTimeout(path, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers ?? {}),
      Authorization: `Bearer ${mfaPendingToken}`,
    },
  });
  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.clone().json();
    } catch {
      body = undefined;
    }
    throw new ApiError(res.status, `${init.method ?? 'GET'} ${path} → ${res.status}`, body);
  }
  return (await res.json()) as T;
}

export function getMfaChallengeMethods(mfaPendingToken: string): Promise<{ methods: string[] }> {
  return mfaPendingFetch('/api/v1/mfa/challenge/methods', mfaPendingToken);
}

export function verifyMfaChallenge(
  mfaPendingToken: string,
  input: { method: string; code: string; remember_device: boolean },
): Promise<SessionPayload> {
  return mfaPendingFetch('/api/v1/mfa/challenge/verify', mfaPendingToken, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function downloadFile(path: string, filename: string): Promise<void> {
  const run = () => {
    const token = getAccessToken();
    return fetchWithTimeout(path, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }, DOWNLOAD_TIMEOUT_MS);
  };

  let res = await run();
  if (res.status === 401) {
    if (isImpersonating()) { stopImpersonation(); notifyImpersonationEnded(); }
    if (await refreshSession()) res = await run();
  }
  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.clone().json();
    } catch {
      body = undefined;
    }
    throw new ApiError(res.status, `GET ${path} → ${res.status}`, body);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
