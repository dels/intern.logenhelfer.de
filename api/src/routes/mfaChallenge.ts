import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { setRefreshTokenCookie } from '../auth/cookies.js';
import { verifyAccessToken } from '../auth/jwt.js';
import { issueRefreshToken } from '../auth/refreshToken.js';
import { isMfaLockedOut, recordFailedMfaAttempt, resetMfaLockout } from '../auth/mfaLockout.js';
import { issueTrustedDeviceToken } from '../auth/deviceTrust.js';
import { recordSuccessfulSignIn } from '../auth/signInTracking.js';
import { DEVICE_TOKEN_COOKIE_NAME } from './session.js';
import { prisma } from '../db.js';
import { ApiError } from '../lib/errors.js';
import { verifyEncryptedTotpCode } from '../lib/mfaTotp.js';
import { sendEmailOtp, verifyEmailOtp } from '../lib/mfaEmailOtp.js';
import { consumeBackupCode } from '../lib/mfaBackupCodes.js';
import { getUserMfaMethods, computeGracePeriodEndsAt } from '../lib/mfaStatus.js';
import { getMfaSettings } from '../lib/mfaSettings.js';
import { buildAuthenticationOptions, verifyAuthentication } from '../lib/mfaPasskeys.js';
import { sendLoginLockoutEmail, sendLoginSuccessEmail, type LoginMethod } from '../lib/loginNotification.js';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import type { users } from '../generated/prisma/client.js';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      mfaPendingUser?: users;
    }
  }
}

async function requireMfaPendingToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) throw new Error('missing token');
    const payload = verifyAccessToken(header.slice('Bearer '.length));
    if (payload.mfa_pending !== true) throw new Error('not a pending token');
    const user = await prisma.users.findUnique({ where: { id: payload.sub } });
    if (!user) throw new Error('user not found');
    req.mfaPendingUser = user;
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
}

const router = Router();
router.use(requireMfaPendingToken);

// Same in-memory, per-pending-user, single-use-ceremony pattern as mfa.ts's
// pendingProofChallenges - bounded by "how many users are mid-login-
// challenge right now" (reachable only with a valid, 15-minute-TTL
// mfa_pending bearer token), unlike session.ts's public, unauthenticated
// passkeyLoginChallenges map, which needs its own TTL+prune for exactly
// that reason. Kept separate from mfa.ts's own maps so a login challenge
// and an unrelated proof-of-control ceremony for the same user id can never
// clobber each other's challenge.
const pendingLoginPasskeyChallenges = new Map<number, string>();

router.get('/methods', async (req, res, next) => {
  try {
    // Response shape must match components/schemas/MfaMethodsList
    // (openapi/openapi.yaml) exactly - required: [methods, mode,
    // grace_period_ends_at] - same assembly as mfa.ts's GET /status (that
    // route's own mode/grace_period_ends_at logic, not duplicated ad hoc
    // here). Found live-broken on `next` 2026-08-01: this handler only ever
    // returned `{ methods }`, so express-openapi-validator's *response*
    // validator rejected every single call with a 500 ("must have required
    // property 'mode'") - the route-level unit test for this handler
    // (mfaChallenge.test.ts) mounts the router directly on a bare Express
    // app, bypassing that validator entirely, so it never caught this.
    const methods = await getUserMfaMethods(req.mfaPendingUser!.id);
    const mfaSettings = await getMfaSettings();
    const gracePeriodEndsAt = mfaSettings.mode === 'mandatory' ? computeGracePeriodEndsAt(mfaSettings) : null;
    res.status(200).json({
      methods,
      mode: mfaSettings.mode,
      grace_period_ends_at: gracePeriodEndsAt ? gracePeriodEndsAt.toISOString() : null,
    });
  } catch (err) {
    next(err);
  }
});

function toLoginMethod(method: string | undefined): LoginMethod {
  return method === 'totp' || method === 'email' || method === 'backup_code' ? method : 'mfa_unknown';
}

async function sessionPayloadFor(user: users) {
  const { issueAccessToken } = await import('../auth/jwt.js');
  const subscriptionCount = await prisma.announcement_subscriptions.count({ where: { user_id: user.id } });
  return {
    access_token: issueAccessToken(user.id),
    user: {
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      subscribed_to_announcements: subscriptionCount > 0,
      gdpr_accepted: user.accepted_gdpr,
    },
  };
}

router.post('/verify', async (req, res, next) => {
  try {
    const user = req.mfaPendingUser!;
    const body = req.body as { method?: string; code?: string; remember_device?: boolean };
    const lockoutKey = `mfa:${user.email}`;

    if (await isMfaLockedOut(lockoutKey)) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    let ok = false;
    if (body.method === 'totp') {
      const credential = await prisma.mfa_totp_credentials.findUnique({ where: { user_id: user.id } });
      // Security: verified_at !== null gates this - an in-progress, not-yet-
      // confirmed TOTP setup must never count as proof of an existing second
      // factor (see Task 11's identical fix, caught by automated review).
      ok = credential !== null && credential.verified_at !== null && verifyEncryptedTotpCode(credential.encrypted_secret, String(body.code ?? ''));
    } else if (body.method === 'email') {
      ok = await verifyEmailOtp(user.id, 'login', String(body.code ?? ''));
    } else if (body.method === 'backup_code') {
      ok = await consumeBackupCode(user.id, String(body.code ?? ''));
    }

    if (!ok) {
      const { lockedOut } = await recordFailedMfaAttempt(lockoutKey);
      // Response first, then notify - never await a real mail-send before
      // the HTTP response, or the response timing itself becomes an oracle
      // (same class of issue session.ts's DUMMY_PASSWORD_HASH guards
      // against). Fire-and-forget after the response, not before.
      res.status(401).json({ error: 'unauthorized' });
      if (lockedOut) {
        void sendLoginLockoutEmail(user, req, toLoginMethod(body.method));
      }
      return;
    }

    await resetMfaLockout(lockoutKey);
    await recordSuccessfulSignIn(user, req.ip ?? null);
    // Fire-and-forget - see the comment on the lockout branch above.
    void sendLoginSuccessEmail(user, req, toLoginMethod(body.method));
    const { rawToken } = await issueRefreshToken(user.id);
    setRefreshTokenCookie(res, rawToken);

    if (body.remember_device === true) {
      const { trustedDeviceDays } = await getMfaSettings();
      const deviceToken = await issueTrustedDeviceToken(user.id, req, trustedDeviceDays);
      res.cookie(DEVICE_TOKEN_COOKIE_NAME, deviceToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: trustedDeviceDays * 86_400_000,
      });
    }

    res.status(200).json(await sessionPayloadFor(user));
  } catch (err) {
    next(err);
  }
});

router.post('/passkey/options', async (req, res, next) => {
  try {
    const user = req.mfaPendingUser!;
    const credentials = await prisma.mfa_passkey_credentials.findMany({
      where: { user_id: user.id },
      select: { credential_id: true },
    });
    if (credentials.length === 0) throw ApiError.notFound();

    const options = await buildAuthenticationOptions({ allowCredentialIds: credentials.map((c) => c.credential_id) });
    pendingLoginPasskeyChallenges.set(user.id, options.challenge);
    res.status(200).json(options);
  } catch (err) {
    next(err);
  }
});

router.post('/passkey/verify', async (req, res, next) => {
  try {
    const user = req.mfaPendingUser!;
    const lockoutKey = `mfa:${user.email}`;

    if (await isMfaLockedOut(lockoutKey)) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    // One-time consumption regardless of outcome, same as mfa.ts's
    // pendingProofChallenges - a WebAuthn challenge must never be replayed,
    // so a failed/missing attempt still burns it.
    const challenge = pendingLoginPasskeyChallenges.get(user.id);
    pendingLoginPasskeyChallenges.delete(user.id);

    const response = req.body?.response as AuthenticationResponseJSON | undefined;
    let verified = false;
    if (challenge && response?.id) {
      // Security: scope the credential lookup to THIS pending user, not
      // just the credential id from the response - a client can send any
      // credential_id regardless of what allowCredentials offered, so the
      // user_id match below (not allowCredentials) is the actual
      // enforcement. Matches mfa.ts's verifyExistingMfaProof precedent.
      const stored = await prisma.mfa_passkey_credentials.findUnique({ where: { credential_id: response.id } });
      if (stored && stored.user_id === user.id) {
        // Security: verifyAuthentication (wrapping @simplewebauthn/server's
        // verifyAuthenticationResponse) THROWS for most failure modes
        // (challenge/origin mismatch, missing user verification, counter
        // regression, malformed clientDataJSON/authenticatorData) rather than
        // resolving { verified: false } - only an outright bad signature
        // takes the resolve-false path. Without this try/catch, a throw here
        // would escape to the outer catch's next(err), producing a generic
        // 500 instead of the same 401 every other failure mode on this route
        // returns, and - just as importantly - would skip
        // recordFailedMfaAttempt entirely, letting an attacker retry
        // malformed/forged assertions without ever counting toward the
        // 5-attempt lockout. Treat any throw exactly like verified: false.
        // Deliberately scoped to ONLY the verifyAuthentication call, not the
        // sign_count update below it - a DB write failure after a genuine
        // verified:true must surface as a real 500 via the outer catch, not
        // get silently reinterpreted as a failed login attempt (which would
        // both hide a real server fault and wrongly charge the user a
        // lockout strike for it).
        let verification: Awaited<ReturnType<typeof verifyAuthentication>> | undefined;
        try {
          verification = await verifyAuthentication(response, challenge, {
            id: stored.credential_id,
            publicKey: Buffer.from(stored.public_key, 'base64url'),
            counter: stored.sign_count,
          });
        } catch {
          verification = undefined;
        }
        if (verification?.verified) {
          verified = true;
          await prisma.mfa_passkey_credentials.update({
            where: { id: stored.id },
            data: { sign_count: verification.authenticationInfo.newCounter, last_used_at: new Date() },
          });
        }
      }
    }

    if (!verified) {
      const { lockedOut } = await recordFailedMfaAttempt(lockoutKey);
      res.status(401).json({ error: 'unauthorized' });
      if (lockedOut) {
        void sendLoginLockoutEmail(user, req, 'passkey');
      }
      return;
    }

    await resetMfaLockout(lockoutKey);
    await recordSuccessfulSignIn(user, req.ip ?? null);
    void sendLoginSuccessEmail(user, req, 'passkey');
    const { rawToken } = await issueRefreshToken(user.id);
    setRefreshTokenCookie(res, rawToken);

    const body = req.body as { remember_device?: boolean };
    if (body.remember_device === true) {
      const { trustedDeviceDays } = await getMfaSettings();
      const deviceToken = await issueTrustedDeviceToken(user.id, req, trustedDeviceDays);
      res.cookie(DEVICE_TOKEN_COOKIE_NAME, deviceToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: trustedDeviceDays * 86_400_000,
      });
    }

    res.status(200).json(await sessionPayloadFor(user));
  } catch (err) {
    next(err);
  }
});

router.post('/email/send', async (req, res, next) => {
  try {
    const user = req.mfaPendingUser!;
    const credential = await prisma.mfa_email_credentials.findUnique({ where: { user_id: user.id } });
    if (!credential || credential.verified_at === null) throw ApiError.notFound();

    // ponytail: no resend cooldown, matching /mfa/setup/start's existing
    // (pre-existing, out of this fix's scope) unthrottled behavior for the
    // 'setup'-purpose send - repeated calls just stack additional valid
    // codes. Add a cooldown if this is ever abused for mail-bombing.
    await sendEmailOtp(user.id, user.email, 'login');
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
