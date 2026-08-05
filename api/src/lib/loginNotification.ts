import type { Request } from 'express';

import { appConfig } from './appConfig.js';
import { sendMail } from './mail.js';
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
 * A mail-delivery failure must never fail the login/verify request that
 * triggered it (see design doc) - errors are logged, never thrown.
 */
async function safeSend(to: string, from: string, subject: string, text: string): Promise<void> {
  try {
    await sendMail({ to, from, subject, text });
  } catch (err) {
    console.error('[loginNotification] failed to send email', err);
  }
}

/** Sends the "you just logged in" notification, if the admin toggle is on. */
export async function sendLoginSuccessEmail(user: NotifiableUser, req: Request, method: LoginMethod): Promise<void> {
  if (!(await isEnabled())) return;
  const { language, lodgeShort, defaultFromEmail } = await mailContext();
  const strings = mailStringsFor(language);
  const methodLabel = strings.loginMethodLabel(method);
  const at = new Date().toISOString();
  const ip = req.ip ?? 'unknown';
  await safeSend(
    user.email,
    `"${lodgeShort}" <${defaultFromEmail ?? ''}>`,
    strings.loginNotification.subject(lodgeShort),
    strings.loginNotification.body(user.firstname ?? '', at, ip, methodLabel),
  );
}

/** Sends the "repeated failed attempts locked your account" notification, if the admin toggle is on. */
export async function sendLoginLockoutEmail(user: NotifiableUser, req: Request, method: LoginMethod): Promise<void> {
  if (!(await isEnabled())) return;
  const { language, lodgeShort, defaultFromEmail } = await mailContext();
  const strings = mailStringsFor(language);
  const methodLabel = strings.loginMethodLabel(method);
  const at = new Date().toISOString();
  const ip = req.ip ?? 'unknown';
  await safeSend(
    user.email,
    `"${lodgeShort}" <${defaultFromEmail ?? ''}>`,
    strings.loginLockoutNotification.subject(lodgeShort),
    strings.loginLockoutNotification.body(user.firstname ?? '', at, ip, methodLabel),
  );
}
