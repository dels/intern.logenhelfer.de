import { useEffect, useRef } from 'react';

/**
 * Default idle-timeout window in minutes, used when VITE_IDLE_TIMEOUT_MINUTES
 * is unset or invalid (see getIdleTimeoutMs). Deliberately additive to, not a
 * replacement for, the existing JWT_ACCESS_TTL_SECONDS/JWT_REFRESH_TTL_SECONDS
 * (api/src/auth/tokenConfig.ts) - those govern token lifetimes independent of
 * user activity; this governs when AuthProvider proactively calls logout()
 * because of a lack of activity, entirely on the frontend.
 */
export const DEFAULT_IDLE_TIMEOUT_MINUTES = 30;

/**
 * Reads the build-time-baked VITE_IDLE_TIMEOUT_MINUTES (Vite only exposes
 * VITE_-prefixed vars to client code via import.meta.env - see
 * https://vite.dev/guide/env-and-mode.html - and only bakes them in at BUILD
 * time, not container-start time; see app/Dockerfile's ARG/ENV plumbing and
 * infra/docker-compose.production.yml's app build.args for how a real deploy
 * threads a per-environment value in here, mirroring GIT_HASH's existing
 * build-arg pattern). Falls back to DEFAULT_IDLE_TIMEOUT_MINUTES for
 * anything unset, non-numeric, zero, or negative - same defensive shape as
 * the API's own parseTtlSeconds (api/src/auth/tokenConfig.ts).
 */
export function getIdleTimeoutMs(): number {
  const raw = import.meta.env.VITE_IDLE_TIMEOUT_MINUTES;
  const parsed = Number(raw);
  const minutes = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_IDLE_TIMEOUT_MINUTES;
  return minutes * 60 * 1000;
}

const ACTIVITY_EVENTS = ['click', 'keydown'] as const;

/**
 * Calls `onTimeout` after `timeoutMs` of no click/keydown activity while
 * `enabled` is true - per the literal requirement ("users should be logged
 * out when they are not active within 30 minutes... every click restarts
 * this time window"), a click restarts the window; keydown is included too
 * for reasonable coverage of keyboard-only use. Listens on `window` (not a
 * specific element) so it fires regardless of what's focused. Per-tab only
 * (no cross-tab BroadcastChannel sync) - each browser tab tracks its own
 * activity and calls its own `onTimeout` independently, matching the task's
 * "no cross-tab sync required unless trivial" scope note.
 *
 * `timeoutMs` defaults to `getIdleTimeoutMs()` - callers needing a fixed,
 * test-friendly value (see useIdleTimeout.test.ts) pass it explicitly rather
 * than stubbing import.meta.env, which keeps timer-mechanics tests
 * completely decoupled from env-parsing tests.
 */
export function useIdleTimeout(enabled: boolean, onTimeout: () => void, timeoutMs: number = getIdleTimeoutMs()): void {
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    if (!enabled) return undefined;

    let timer: ReturnType<typeof setTimeout>;
    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => onTimeoutRef.current(), timeoutMs);
    };

    resetTimer();
    for (const eventName of ACTIVITY_EVENTS) {
      window.addEventListener(eventName, resetTimer);
    }

    return () => {
      clearTimeout(timer);
      for (const eventName of ACTIVITY_EVENTS) {
        window.removeEventListener(eventName, resetTimer);
      }
    };
  }, [enabled, timeoutMs]);
}
