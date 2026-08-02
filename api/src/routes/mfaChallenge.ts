import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { setRefreshTokenCookie } from '../auth/cookies.js';
import { verifyAccessToken } from '../auth/jwt.js';
import { issueRefreshToken } from '../auth/refreshToken.js';
import { isMfaLockedOut, recordFailedMfaAttempt, resetMfaLockout } from '../auth/mfaLockout.js';
import { issueTrustedDeviceToken } from '../auth/deviceTrust.js';
import { DEVICE_TOKEN_COOKIE_NAME } from './session.js';
import { prisma } from '../db.js';
import { verifyEncryptedTotpCode } from '../lib/mfaTotp.js';
import { verifyEmailOtp } from '../lib/mfaEmailOtp.js';
import { consumeBackupCode } from '../lib/mfaBackupCodes.js';
import { getUserMfaMethods, computeGracePeriodEndsAt } from '../lib/mfaStatus.js';
import { getMfaSettings } from '../lib/mfaSettings.js';
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
      await recordFailedMfaAttempt(lockoutKey);
      res.status(401).json({ error: 'unauthorized' });
      return;
    }

    await resetMfaLockout(lockoutKey);
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

export default router;
