import { createHash } from 'node:crypto';

import bcrypt from 'bcryptjs';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { clearRefreshTokenCookie, REFRESH_TOKEN_COOKIE_NAME, setRefreshTokenCookie } from '../auth/cookies.js';
import { isDeviceTrusted } from '../auth/deviceTrust.js';
import { issueAccessToken, issueMfaPendingToken } from '../auth/jwt.js';
import { isLockedOut, recordFailedLogin, resetLoginLockout } from '../auth/loginLockout.js';
import { isMfaLockedOut, recordFailedMfaAttempt, resetMfaLockout } from '../auth/mfaLockout.js';
import {
  issueRefreshToken,
  revokeFamily,
  RefreshTokenInvalidError,
  RefreshTokenReuseError,
  rotateRefreshToken,
} from '../auth/refreshToken.js';
import { prisma } from '../db.js';
import { ApiError } from '../lib/errors.js';
import { sendLoginLockoutEmail, sendLoginSuccessEmail } from '../lib/loginNotification.js';
import { buildAuthenticationOptions, verifyAuthentication } from '../lib/mfaPasskeys.js';
import { getUserMfaMethods, isMfaSetupRequiredFor } from '../lib/mfaStatus.js';
import { loginRateLimiter } from '../middleware/rateLimit.js';

export const DEVICE_TOKEN_COOKIE_NAME = 'mfa_device_token';

// Matches me.ts's own (unexported, duplicated for the same file-boundary
// reason as this file's other helpers) BCRYPT_COST - kept identical so the
// dummy-hash compare below costs the same as a real one.
const BCRYPT_COST = 12;

/**
 * Fixed dummy hash, computed once at module load, compared against whenever
 * no real user/password hash is available (unknown email, or a user with a
 * blank encrypted_password) - see the login handler below. This is the
 * timing half of the Finding A fix: without it, the unknown-email branch
 * would skip bcrypt.compare entirely and return near-instantly, while the
 * real-user-wrong-password branch always pays a real bcrypt comparison,
 * giving an attacker a timing oracle for account existence on top of the
 * status-code oracle the request-shape-validation reordering below closes.
 * (Under the test suite specifically, real users are hashed at the much
 * cheaper TEST_BCRYPT_COST=4 - see session.test.ts - so this cost-12 dummy
 * compare is actually *slower* than the real-user path there; that's a test
 * artifact, not a bug: production always hashes at BCRYPT_COST=12, so the
 * two paths are genuinely comparable in prod.)
 */
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('dummy-password-for-timing-parity', BCRYPT_COST);

// Port of rails-app/app/controllers/api/v1/sessions_controller.rb. The whole
// controller does `skip_before_action :authenticate_api_user!` - none of
// these routes get authenticateApiUser applied, matching that.

const router = Router();

// rails-app/config/initializers/rack_attack.rb throttles:
//   req.ip if !Rails.env.test? && req.path.start_with?('/api/v1/session') && req.post?
// which - because it's a *prefix* match on path, not an exact match - also
// throttles POST /api/v1/session/refresh, not just POST /api/v1/session
// itself (but never DELETE /api/v1/session, since req.post? is false there).
// loginRateLimiter is applied to both POST routes below to match that scope
// exactly; it already no-ops in NODE_ENV=test (see rateLimit.ts) the same
// way Rack::Attack's own `!Rails.env.test?` guard does.

// --- shared helpers --------------------------------------------------------

interface SessionUserPayload {
  id: number;
  email: string;
  firstname: string | null;
  lastname: string | null;
  subscribed_to_announcements: boolean;
  gdpr_accepted: boolean | null;
}

/** Port of User#auth_json. */
async function authJsonFor(user: { id: number; email: string; firstname: string | null; lastname: string | null; accepted_gdpr: boolean | null }): Promise<SessionUserPayload> {
  const subscriptionCount = await prisma.announcement_subscriptions.count({ where: { user_id: user.id } });

  return {
    id: user.id,
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    subscribed_to_announcements: subscriptionCount > 0,
    gdpr_accepted: user.accepted_gdpr,
  };
}

async function sessionPayloadFor(user: { id: number; email: string; firstname: string | null; lastname: string | null; accepted_gdpr: boolean | null }): Promise<{
  access_token: string;
  user: SessionUserPayload;
}> {
  return {
    access_token: issueAccessToken(user.id),
    user: await authJsonFor(user),
  };
}

/**
 * Port of RefreshToken.revoke_family!(raw) - looks up the family by the raw
 * cookie value's digest, then revokes the whole family. Duplicates
 * refreshToken.ts's private digest() (SHA-256 hex) because that helper isn't
 * exported and this task's file boundaries don't permit editing
 * api/src/auth/refreshToken.ts to export it - see this task's final report.
 */
async function revokeFamilyForRawToken(rawToken: string): Promise<void> {
  const tokenDigest = createHash('sha256').update(rawToken).digest('hex');
  const record = await prisma.refresh_tokens.findUnique({ where: { token_digest: tokenDigest } });
  if (record) {
    await revokeFamily(record.family_id);
  }
}

/**
 * Port of Devise::Models::Trackable#update_tracked_fields! (Devise gem,
 * invoked from Devise::Models::Authenticatable#after_database_authentication
 * on every successful password sign-in) - this was never ported when
 * session.ts was rewritten from Rails, so sign_in_count/current_sign_in_at/
 * current_sign_in_ip/last_sign_in_at/last_sign_in_ip silently stayed frozen
 * at their DB defaults forever, which is what statistics.ts's `user_stats`
 * sub-report reads (see this repo's CLAUDE.md session note: "statistics
 * won't get updated ... logins are not updated"). `attachedFiles.ts`'s
 * download tracking and `events.ts`'s RSVP tracking also read
 * `current_sign_in_ip` off the current user, so this bug silently nulled
 * `remote_ip` everywhere downstream too. Same old-current-becomes-last
 * rollover Devise uses, run before the new value overwrites current_*.
 */
async function recordSuccessfulSignIn(user: { id: number; current_sign_in_at: Date | null; current_sign_in_ip: string | null; sign_in_count: number | null }, ip: string | null): Promise<void> {
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

/**
 * Port of `params.require(:key)` - raises (here: throws ApiError.badRequest)
 * when the value is missing or blank. Rails' `.blank?` treats a
 * whitespace-only string as blank too (not just `""`), so the presence check
 * trims before testing - but the returned value itself is left untrimmed, so
 * a password containing meaningful leading/trailing whitespace still compares
 * verbatim, matching Rails (which only .strip's the email, never the password).
 */
function requireParam(body: unknown, key: 'email' | 'password'): string {
  const value = (body as Record<string, unknown> | null | undefined)?.[key];
  if (value === undefined || value === null || String(value).trim() === '') {
    throw ApiError.badRequest(`param is missing or the value is empty: ${key}`);
  }
  return String(value);
}

// --- routes ------------------------------------------------------------

router.post('/session', loginRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Request-shape validation happens up front, before any DB lookup or
    // user-existence branching - both email and password are required
    // regardless of whether the email turns out to match a user. This used
    // to be Ruby's safe-navigation short-circuit in
    // `unless user&.valid_password?(params.require(:password))` (password
    // only required once a matching user had been found), which meant a
    // missing password returned 400 for a real email but 401 for an unknown
    // one - a user-enumeration oracle (Finding A). Validating unconditionally
    // here closes that: a malformed request now returns the same 400 no
    // matter which email was sent.
    const email = requireParam(req.body, 'email').toLowerCase().trim();
    const password = requireParam(req.body, 'password');

    // Per-email lockout (Finding B), independent of source IP - checked
    // before touching the user row/bcrypt at all. Deliberately returns the
    // exact same 401 body as a normal wrong-password rejection below: not
    // revealing "you're locked out" avoids handing an attacker a second,
    // more precise oracle in place of the one this endpoint is trying to
    // close.
    if (await isLockedOut(email)) {
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }

    const user = await prisma.users.findUnique({ where: { email } });

    let passwordValid = false;
    if (user && user.encrypted_password !== '') {
      // Devise::Encryptor.compare returns false (never raises) for a blank
      // hash - mirror that instead of letting bcrypt throw on an invalid hash.
      passwordValid = await bcrypt.compare(password, user.encrypted_password);
    } else {
      // No matching user (or a real user with a blank encrypted_password) -
      // still run a real bcrypt.compare, against the fixed dummy hash, so
      // this branch costs the same as the real-user branch above instead of
      // returning near-instantly. See DUMMY_PASSWORD_HASH's doc comment.
      await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
    }

    if (!user || !passwordValid) {
      const { lockedOut } = await recordFailedLogin(email);
      if (lockedOut && user) {
        void sendLoginLockoutEmail(user, req, 'password');
      }
      res.status(401).json({ error: 'invalid_credentials' });
      return;
    }

    await resetLoginLockout(email);
    await recordSuccessfulSignIn(user, req.ip ?? null);

    const methods = await getUserMfaMethods(user.id);

    if (methods.length === 0) {
      // A user with zero enrolled methods still gets a full session
      // regardless of mode/grace-period state - `setup_required` below is
      // purely advisory for the frontend (RequireAuth forces /mfa/setup and
      // blocks every other route while it's true); the actual enforcement
      // now also happens server-side, in authenticateApiUser (see
      // middleware.ts), via the same isMfaSetupRequiredFor helper. This
      // mirrors the within-grace-period behavior that already existed for
      // mandatory mode - see docs/superpowers/specs/2026-07-31-mfa-design.md.
      // Past grace period, the ONLY thing that changes for THIS response is
      // the frontend can no longer be dismissed/deferred; there is
      // deliberately no separate server-side lockout of the login response
      // itself, because a `setup_required`-without-tokens response has no
      // route it can ever lead anywhere (found by Task 21 - see
      // api/../task-21-report.md and the now-superseded
      // app/src/pages/LoginPage.test.tsx "KNOWN GAP" test this task replaces).
      const mfaSetupRequired = await isMfaSetupRequiredFor(user.id);
      const { rawToken } = await issueRefreshToken(user.id);
      setRefreshTokenCookie(res, rawToken);
      void sendLoginSuccessEmail(user, req, 'password');
      res.status(200).json({ ...(await sessionPayloadFor(user)), setup_required: mfaSetupRequired });
      return;
    }

    const deviceToken: unknown = req.cookies?.[DEVICE_TOKEN_COOKIE_NAME];
    if (await isDeviceTrusted(user.id, typeof deviceToken === 'string' ? deviceToken : undefined)) {
      const { rawToken } = await issueRefreshToken(user.id);
      setRefreshTokenCookie(res, rawToken);
      void sendLoginSuccessEmail(user, req, 'password');
      res.status(200).json(await sessionPayloadFor(user));
      return;
    }

    res.status(200).json({ mfa_pending_token: issueMfaPendingToken(user.id) });
  } catch (err) {
    next(err);
  }
});

router.post('/session/refresh', loginRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw: unknown = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (!raw) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    const { rawToken: newRaw, user } = await rotateRefreshToken(String(raw));
    setRefreshTokenCookie(res, newRaw);
    res.status(200).json(await sessionPayloadFor(user));
  } catch (err) {
    if (err instanceof RefreshTokenInvalidError || err instanceof RefreshTokenReuseError) {
      clearRefreshTokenCookie(res);
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    next(err);
  }
});

router.delete('/session', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const raw: unknown = req.cookies?.[REFRESH_TOKEN_COOKIE_NAME];
    if (raw) {
      await revokeFamilyForRawToken(String(raw));
    }
    clearRefreshTokenCookie(res);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Security: unlike mfa.ts's pendingRegistrationChallenges (bounded by "how
// many logged-in users are mid-setup"), this endpoint is public and
// unauthenticated - anyone can call it with no login at all. Without a rate
// limit AND a bounded lifetime, an attacker can grow this Map indefinitely
// (memory-exhaustion DoS) just by spamming POST /session/passkey/options.
// loginRateLimiter throttles the *rate*; the TTL below bounds the *total
// size* even under a slow, sustained attacker who stays under the rate
// limit - rate-limiting alone doesn't cap memory since unexpired-but-unused
// entries would otherwise never be removed.
const PASSKEY_CHALLENGE_TTL_MS = 5 * 60_000;
const passkeyLoginChallenges = new Map<string, number>(); // challenge -> expiresAt

function pruneExpiredPasskeyChallenges(): void {
  const now = Date.now();
  for (const [challenge, expiresAt] of passkeyLoginChallenges) {
    if (expiresAt <= now) passkeyLoginChallenges.delete(challenge);
  }
}

router.post('/session/passkey/options', loginRateLimiter, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    pruneExpiredPasskeyChallenges();
    const options = await buildAuthenticationOptions({ allowCredentialIds: [] });
    passkeyLoginChallenges.set(options.challenge, Date.now() + PASSKEY_CHALLENGE_TTL_MS);
    res.status(200).json(options);
  } catch (err) {
    next(err);
  }
});

router.post('/session/passkey/verify', loginRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const response = req.body?.response;
    const credentialId: string | undefined = response?.id;
    if (!credentialId) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    if (await isMfaLockedOut(`passkey:${credentialId}`)) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    const stored = await prisma.mfa_passkey_credentials.findUnique({ where: { credential_id: credentialId } });
    if (!stored) {
      await recordFailedMfaAttempt(`passkey:${credentialId}`);
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    const challenge = response?.response?.clientDataJSON
      ? (JSON.parse(Buffer.from(response.response.clientDataJSON, 'base64').toString('utf8')).challenge as string)
      : undefined;
    const challengeExpiresAt = challenge ? passkeyLoginChallenges.get(challenge) : undefined;
    if (!challenge || challengeExpiresAt === undefined || challengeExpiresAt <= Date.now()) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    passkeyLoginChallenges.delete(challenge);

    const verification = await verifyAuthentication(response, challenge, {
      id: stored.credential_id,
      publicKey: Buffer.from(stored.public_key, 'base64url'),
      counter: stored.sign_count,
    });

    if (!verification.verified) {
      const { lockedOut } = await recordFailedMfaAttempt(`passkey:${credentialId}`);
      if (lockedOut) {
        const owner = await prisma.users.findUnique({ where: { id: stored.user_id } });
        if (owner) void sendLoginLockoutEmail(owner, req, 'passkey');
      }
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    await resetMfaLockout(`passkey:${credentialId}`);
    await prisma.mfa_passkey_credentials.update({
      where: { id: stored.id },
      data: { sign_count: verification.authenticationInfo.newCounter, last_used_at: new Date() },
    });

    const user = await prisma.users.findUniqueOrThrow({ where: { id: stored.user_id } });
    // Security fix: a soft-deleted/offboarded member's passkey credential
    // otherwise still verifies successfully (it's looked up purely by
    // credential_id -> user_id, independent of the mangled-email/
    // revoked-refresh-token offboarding flow password login relies on) -
    // without this check, an expelled member could keep logging in
    // indefinitely via passwordless passkey login. Matches this handler's
    // existing non-enumerating convention: identical 401/'unauthorized' as
    // every other failure above, so as not to leak "this credential belongs
    // to a real, disabled account" to an attacker.
    if (user.deleted) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    const { rawToken } = await issueRefreshToken(user.id);
    setRefreshTokenCookie(res, rawToken);
    void sendLoginSuccessEmail(user, req, 'passkey');
    res.status(200).json(await sessionPayloadFor(user));
  } catch (err) {
    next(err);
  }
});

export default router;
