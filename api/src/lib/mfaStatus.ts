import { prisma } from '../db.js';
import { getMfaSettings } from './mfaSettings.js';
import type { MfaSettings } from './mfaSettings.js';

export type MfaMethod = 'totp' | 'email' | 'passkey';

export async function getUserMfaMethods(userId: number): Promise<MfaMethod[]> {
  const [totp, email, passkeys] = await Promise.all([
    prisma.mfa_totp_credentials.findFirst({ where: { user_id: userId, verified_at: { not: null } } }),
    prisma.mfa_email_credentials.findFirst({ where: { user_id: userId, verified_at: { not: null } } }),
    prisma.mfa_passkey_credentials.findFirst({ where: { user_id: userId } }),
  ]);

  const methods: MfaMethod[] = [];
  if (totp) methods.push('totp');
  if (email) methods.push('email');
  if (passkeys) methods.push('passkey');
  return methods;
}

export async function userHasVerifiedMfa(userId: number): Promise<boolean> {
  return (await getUserMfaMethods(userId)).length > 0;
}

/**
 * Batch sibling of userHasVerifiedMfa - one query per credential table for a
 * whole page's/list's worth of users instead of an N+1 loop, mirroring
 * members.ts's loadRoleRowsForUsers/loadAddressesForUsers batching pattern.
 * Returns the set of user ids that have at least one verified MFA method
 * (totp/email verified_at set, or any passkey row at all - passkeys have no
 * separate verified_at, matching getUserMfaMethods' own semantics).
 */
export async function getUsersWithVerifiedMfa(userIds: number[]): Promise<Set<number>> {
  if (userIds.length === 0) return new Set();
  const [totp, email, passkeys] = await Promise.all([
    prisma.mfa_totp_credentials.findMany({ where: { user_id: { in: userIds }, verified_at: { not: null } }, select: { user_id: true } }),
    prisma.mfa_email_credentials.findMany({ where: { user_id: { in: userIds }, verified_at: { not: null } }, select: { user_id: true } }),
    prisma.mfa_passkey_credentials.findMany({ where: { user_id: { in: userIds } }, select: { user_id: true } }),
  ]);
  return new Set([...totp, ...email, ...passkeys].map((r) => r.user_id));
}

/**
 * True when a user is in mandatory-mode MFA's "must enroll before anything
 * else" state: mandatory mode, zero verified methods, and past (or never
 * started) the grace period. Single source of truth for this computation -
 * used both to decide what the frontend should render (session.ts's login
 * response, me.ts's GET /me) and to actually enforce it server-side
 * (middleware.ts's authenticateApiUser). Checks mode before touching
 * credential tables, since this runs on every authenticated request once
 * wired into authenticateApiUser - an optional-mode deployment (the common
 * case) short-circuits on one cached AppConfig read.
 */
/** `null` when there's no grace period start date to compute from (mode isn't mandatory yet, or it's never been entered). */
export function computeGracePeriodEndsAt(settings: MfaSettings): Date | null {
  return settings.gracePeriodStartedAt
    ? new Date(settings.gracePeriodStartedAt.getTime() + settings.gracePeriodDays * 86_400_000)
    : null;
}

export async function isMfaSetupRequiredFor(userId: number): Promise<boolean> {
  const mfaSettings = await getMfaSettings();
  if (mfaSettings.mode !== 'mandatory') return false;
  const methods = await getUserMfaMethods(userId);
  if (methods.length > 0) return false;
  const gracePeriodEndsAt = computeGracePeriodEndsAt(mfaSettings);
  return !gracePeriodEndsAt || gracePeriodEndsAt.getTime() < Date.now();
}
