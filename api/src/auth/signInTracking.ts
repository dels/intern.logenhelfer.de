import { prisma } from '../db.js';

/**
 * Port of Devise::Models::Trackable#update_tracked_fields! (Devise gem,
 * invoked from Devise::Models::Authenticatable#after_database_authentication
 * on every successful password sign-in) - extracted out of session.ts
 * (Task 1 of the login-challenge passkey/email fix) so every branch that
 * actually issues a full session - not just the password-check step - can
 * call it: session.ts's no-MFA and trusted-device branches, its
 * passwordless-passkey branch, and mfaChallenge.ts's pending-challenge
 * verify success. Same old-current-becomes-last rollover Devise uses, run
 * before the new value overwrites current_*.
 */
export async function recordSuccessfulSignIn(
  user: { id: number; current_sign_in_at: Date | null; current_sign_in_ip: string | null; sign_in_count: number | null },
  ip: string | null,
): Promise<void> {
  const now = new Date();
  await prisma.users.update({
    where: { id: user.id },
    data: {
      last_sign_in_at: user.current_sign_in_at ?? now,
      current_sign_in_at: now,
      last_sign_in_ip: user.current_sign_in_ip ?? ip,
      current_sign_in_ip: ip,
      sign_in_count: (user.sign_in_count ?? 0) + 1,
    },
  });
}
