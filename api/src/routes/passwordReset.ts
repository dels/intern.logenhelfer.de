import { createHash, randomBytes } from 'node:crypto';

import bcrypt from 'bcryptjs';
import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';

import { RESET_PASSWORD_TOKEN_TTL_SECONDS } from '../auth/tokenConfig.js';
import { revokeAllFamiliesForUser } from '../auth/refreshToken.js';
import { prisma } from '../db.js';
import { ApiError } from '../lib/errors.js';
import { appConfig } from '../lib/appConfig.js';
import { sendMail } from '../lib/mail.js';
import { mailStringsFor } from '../lib/mailStrings.js';
import { passwordResetRateLimiter } from '../middleware/rateLimit.js';

/**
 * Forgot/reset password, unauthenticated by design (same as session.ts,
 * which this file mirrors for its request-shape validation and
 * timing/enumeration precautions). Reuses Devise's original
 * reset_password_token/reset_password_sent_at columns on `users` (see
 * prisma/schema.prisma) rather than a new table - only a SHA-256 digest of
 * the token is ever stored, exactly like refreshToken.ts's token_digest, so
 * a DB leak alone can't be used to reset anyone's password.
 */

const MIN_PASSWORD_LENGTH = 8;
const BCRYPT_COST = 12;

const router = Router();

/** Port of `params.require(:key)` - see session.ts's identical helper. */
function requireParam(body: unknown, key: string): string {
  const value = (body as Record<string, unknown> | null | undefined)?.[key];
  if (value === undefined || value === null || String(value).trim() === '') {
    throw ApiError.badRequest(`param is missing or the value is empty: ${key}`);
  }
  return String(value);
}

function digest(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

router.post('/password/forgot', passwordResetRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = requireParam(req.body, 'email').toLowerCase().trim();

    const user = await prisma.users.findUnique({ where: { email } });
    // Soft-deleted and OAuth-only (no local password ever set) accounts are
    // treated identically to "no such account" - neither should be
    // resettable via this flow.
    const resettable = user !== null && user.deleted !== true && user.encrypted_password !== '';

    if (resettable) {
      const rawToken = randomBytes(32).toString('hex');
      await prisma.users.update({
        where: { id: user.id },
        data: { reset_password_token: digest(rawToken), reset_password_sent_at: new Date() },
      });

      const [lodge, lodgeShort, defaultFromEmail, configuredDomain, language] = await Promise.all([
        appConfig.get('lodge') as Promise<string | null>,
        appConfig.get('lodge_short') as Promise<string | null>,
        appConfig.get('default_from_email') as Promise<string | null>,
        appConfig.get('domain') as Promise<string | null>,
        appConfig.get('language') as Promise<string | null>,
      ]);
      // The Host header is attacker-controllable (host-header-injection /
      // password-reset-link poisoning) - only trust it when it matches this
      // environment's own AppConfig[:domain], so the link still reflects
      // whichever environment (prod/next/beta/dev) actually sent it without
      // letting a spoofed Host make it into the email.
      const requestHost = req.get('host');
      const host = requestHost === configuredDomain ? requestHost : configuredDomain;
      const resetUrl = `${req.protocol}://${host}/reset-password?token=${rawToken}`;
      const strings = mailStringsFor(language ?? 'de').passwordReset;
      await sendMail({
        to: user.email,
        from: `"${lodgeShort}" <${defaultFromEmail}>`,
        subject: strings.subject(lodge ?? ''),
        text: strings.body(user.firstname ?? '', resetUrl, Math.round(RESET_PASSWORD_TOKEN_TTL_SECONDS / 60)),
      });
    } else if ((await appConfig.get('notify_technical_contact_on_unknown_password_reset')) === true) {
      const [domain, technicalContactEmail, language] = await Promise.all([
        appConfig.get('domain') as Promise<string | null>,
        appConfig.get('technical_contact_email') as Promise<string | null>,
        appConfig.get('language') as Promise<string | null>,
      ]);
      const strings = mailStringsFor(language ?? 'de').unknownPasswordReset;
      await sendMail({
        to: technicalContactEmail ?? '',
        subject: strings.subject(domain ?? ''),
        text: strings.body(email, domain ?? ''),
      });
    }

    // Identical response regardless of which branch ran above - this
    // endpoint never reveals account existence via status code or body.
    res.status(200).json({});
  } catch (err) {
    next(err);
  }
});

router.post('/password/reset', passwordResetRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = requireParam(req.body, 'token');
    const newPassword = requireParam(req.body, 'new_password');
    const newPasswordConfirmation = requireParam(req.body, 'new_password_confirmation');

    const user = await prisma.users.findUnique({ where: { reset_password_token: digest(token) } });
    const sentAt = user?.reset_password_sent_at ?? null;
    const withinTtl = sentAt !== null && Date.now() - sentAt.getTime() <= RESET_PASSWORD_TOKEN_TTL_SECONDS * 1000;

    if (user === null || user.deleted === true || !withinTtl) {
      // Same generic message for "no such token", "expired", and
      // "already used" (the token is cleared on success below, so a used
      // token simply fails the lookup above on replay) - non-enumerating.
      res.status(422).json({ error: 'unprocessable', detail: 'Link ist ungültig oder abgelaufen' });
      return;
    }

    const errors: string[] = [];
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      errors.push(`Password ist zu kurz (nicht weniger als ${MIN_PASSWORD_LENGTH} Zeichen)`);
    }
    if (newPassword !== newPasswordConfirmation) {
      errors.push('Password stimmt nicht mit der Bestätigung überein');
    }
    if (errors.length > 0) {
      res.status(422).json({ error: 'unprocessable', detail: errors.join(', ') });
      return;
    }

    const newEncryptedPassword = await bcrypt.hash(newPassword, BCRYPT_COST);
    await prisma.users.update({
      where: { id: user.id },
      data: { encrypted_password: newEncryptedPassword, reset_password_token: null, reset_password_sent_at: null },
    });

    // Same security-event rule me.ts's /me/password follows: a password
    // reset must not leave a stolen/leaked refresh cookie from before the
    // reset still valid.
    await revokeAllFamiliesForUser(user.id);

    res.status(200).json({});
  } catch (err) {
    next(err);
  }
});

export default router;
