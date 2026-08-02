import { prisma } from '../db.js';

/**
 * Per-email failed-login lockout, independent of source IP - complements
 * `loginRateLimiter` (api/src/middleware/rateLimit.ts), which only throttles
 * per-IP and so does nothing against a distributed attacker (or one behind a
 * shared/rotating IP) hammering one specific account.
 *
 * Tracked in the separate `login_lockouts` table (see schema.prisma) rather
 * than as columns on `users`, because a row has to exist for emails that
 * don't correspond to any real user yet: an attacker enumerating many
 * unknown emails plus one real one must still get throttled on the real one,
 * and a `users` column can't represent a lockout state for a nonexistent
 * user row. Always keyed by the already-normalized (lowercased/trimmed)
 * email the caller looked the user up by - see session.ts's login handler.
 */

// No lock until this many consecutive failures; each additional failure
// beyond the threshold doubles the lock duration (30s, 60s, 120s, ...),
// capped at 15 minutes so a very long failure streak doesn't lock an account
// out indefinitely.
const LOCKOUT_THRESHOLD = 5;
const BASE_LOCK_MS = 30_000;
const MAX_LOCK_MS = 15 * 60_000;

function lockDurationMs(failedCount: number): number {
  const failuresPastThreshold = failedCount - LOCKOUT_THRESHOLD;
  return Math.min(BASE_LOCK_MS * 2 ** failuresPastThreshold, MAX_LOCK_MS);
}

/** True while `email` is currently within an active lockout window. */
export async function isLockedOut(email: string): Promise<boolean> {
  const record = await prisma.login_lockouts.findUnique({ where: { email } });
  return record?.locked_until !== null && record?.locked_until !== undefined && record.locked_until.getTime() > Date.now();
}

/**
 * Records one failed login attempt against `email`, creating the tracking
 * row if it doesn't exist yet (see the module doc comment on why unknown
 * emails are tracked too). Arms (or extends) the lockout once the
 * consecutive-failure count reaches `LOCKOUT_THRESHOLD`.
 */
export async function recordFailedLogin(email: string): Promise<void> {
  const now = new Date();
  const existing = await prisma.login_lockouts.findUnique({ where: { email } });
  const failedCount = (existing?.failed_count ?? 0) + 1;
  const lockedUntil = failedCount >= LOCKOUT_THRESHOLD ? new Date(now.getTime() + lockDurationMs(failedCount)) : null;

  await prisma.login_lockouts.upsert({
    where: { email },
    create: { email, failed_count: failedCount, locked_until: lockedUntil, created_at: now, updated_at: now },
    update: { failed_count: failedCount, locked_until: lockedUntil, updated_at: now },
  });
}

/** Clears any failure count/lock for `email` after a successful login. */
export async function resetLoginLockout(email: string): Promise<void> {
  await prisma.login_lockouts.updateMany({
    where: { email },
    data: { failed_count: 0, locked_until: null, updated_at: new Date() },
  });
}
