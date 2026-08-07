import type { Request } from 'express';

import { appConfig } from './appConfig.js';
import { enqueueMail } from './mailQueue.js';
import { mailStringsFor } from './mailStrings.js';

/**
 * Every method that can grant or challenge a login, for the purposes of the
 * login-notification email (docs/superpowers/specs/2026-08-05-login-notification-emails-design.md).
 * 'mfa_unknown' is the fallback for a failed /mfa/verify attempt whose
 * `method` field didn't match a known value - mfaChallenge.ts's lockout
 * counter still increments for those, so the notification still needs some
 * label to show.
 */
export type LoginMethod = 'password' | 'passkey' | 'totp' | 'email' | 'backup_code' | 'mfa_unknown';

interface NotifiableUser {
  id: number;
  email: string;
  firstname: string | null;
}

async function isEnabled(): Promise<boolean> {
  return (await appConfig.get('notify_user_on_login_activity')) === true;
}

async function mailContext(): Promise<{ language: string; lodgeShort: string; defaultFromEmail: string | null }> {
  const [language, lodgeShort, defaultFromEmail] = await Promise.all([
    appConfig.get('language') as Promise<string | null>,
    appConfig.get('lodge_short') as Promise<string | null>,
    appConfig.get('default_from_email') as Promise<string | null>,
  ]);
  return { language: language ?? 'de', lodgeShort: lodgeShort ?? '', defaultFromEmail };
}

/**
 * Fire-and-forget from every current call site - session.ts's 5 call sites
 * and mfaChallenge.ts's 2 call sites never `await` these (see their `void
 * sendLogin*Email(...)` calls) - a login/verify response must not wait on
 * this, in time OR in outcome. That means this function must never reject:
 * the whole body (not just the sendMail call) is wrapped in try/catch,
 * since an un-awaited rejection would otherwise surface as an unhandled
 * promise rejection instead of a login-blocking error - same "never fail
 * the login" contract, enforced at the one point that actually matters now
 * that nothing downstream awaits this. Any future call site must use the
 * same fire-and-forget `void` pattern, not `await`, for the same
 * timing-oracle reason documented on session.ts's DUMMY_PASSWORD_HASH.
 */
export async function sendLoginSuccessEmail(user: NotifiableUser, req: Request, method: LoginMethod): Promise<void> {
  try {
    if (!(await isEnabled())) return;
    const { language, lodgeShort, defaultFromEmail } = await mailContext();
    const strings = mailStringsFor(language);
    const methodLabel = strings.loginMethodLabel(method);
    const at = new Date().toISOString();
    const ip = req.ip ?? 'unknown';
    await enqueueMail({
      to: user.email,
      from: `"${lodgeShort}" <${defaultFromEmail ?? ''}>`,
      subject: strings.loginNotification.subject(lodgeShort),
      text: strings.loginNotification.body(user.firstname ?? '', at, ip, methodLabel),
    });
  } catch (err) {
    console.error('[loginNotification] failed to send login-success email', err);
  }
}

export async function sendLoginLockoutEmail(user: NotifiableUser, req: Request, method: LoginMethod): Promise<void> {
  try {
    if (!(await isEnabled())) return;
    const { language, lodgeShort, defaultFromEmail } = await mailContext();
    const strings = mailStringsFor(language);
    const methodLabel = strings.loginMethodLabel(method);
    const at = new Date().toISOString();
    const ip = req.ip ?? 'unknown';
    await enqueueMail({
      to: user.email,
      from: `"${lodgeShort}" <${defaultFromEmail ?? ''}>`,
      subject: strings.loginLockoutNotification.subject(lodgeShort),
      text: strings.loginLockoutNotification.body(user.firstname ?? '', at, ip, methodLabel),
    });
  } catch (err) {
    console.error('[loginNotification] failed to send lockout email', err);
  }
}
