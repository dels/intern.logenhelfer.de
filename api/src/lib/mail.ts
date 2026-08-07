import nodemailer from 'nodemailer';

import { appConfig } from './appConfig.js';

/**
 * Port of rails-app's ActionMailer SMTP setup (config/environments/*.rb +
 * SMTP_ADDRESS/SMTP_PORT/SMTP_USER/SMTP_PASSWORD env vars, renamed here to
 * SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASSWORD - SMTP_ADDRESS read like it
 * should hold an email address, but it's always been used as the SMTP
 * server's hostname; SMTP_DOMAIN from the original Rails setup was never
 * actually read anywhere in this port, dropped rather than carried forward
 * as a stale reference). Rails used `letter_opener` in development (never
 * actually sends, opens a browser preview); this port's equivalent is
 * simpler - if MAIL_TRANSPORT resolves to 'console' (see
 * resolveMailTransportMode), log the message instead of sending. That's a
 * real behavioral difference (no preview UI), acceptable since dev/test
 * never need to see rendered mail today - see this module's `sendMail` doc.
 */
export interface MailMessage {
  to: string;
  cc?: string;
  bcc?: string;
  subject: string;
  text: string;
  /** Overrides AppConfig[:default_from_email] when a caller needs a specific display name (e.g. passwordReset.ts's lodge_short). */
  from?: string;
}

/**
 * MAIL_TRANSPORT explicitly picks 'smtp' or 'console'. Unset (or any other
 * value) falls back to the original implicit rule this project shipped
 * with: smtp if SMTP_HOST is configured, console otherwise. An
 * already-deployed environment still setting SMTP_ADDRESS (pre-rename) will
 * fall through to 'console' here until its .env.<name> is updated to
 * SMTP_HOST - see this repo's deploy-host handoff note for this rename.
 */
export function resolveMailTransportMode(): 'smtp' | 'console' {
  const raw = process.env.MAIL_TRANSPORT;
  if (raw === 'smtp' || raw === 'console') return raw;
  return process.env.SMTP_HOST ? 'smtp' : 'console';
}

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransport(): ReturnType<typeof nodemailer.createTransport> | null {
  if (resolveMailTransportMode() !== 'smtp') return null;
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined,
  });
  return transport;
}

/**
 * Sends one email, `from` defaulting to AppConfig[:default_from_email] (same
 * default every rails-app mailer used). No-ops (logs instead) when
 * resolveMailTransportMode() is 'console' - true for local dev/test unless
 * MAIL_TRANSPORT=smtp is explicitly set, matching this module's doc comment.
 */
export async function sendMail(message: MailMessage): Promise<void> {
  const from = message.from ?? ((await appConfig.get('default_from_email')) as string | null);
  const client = getTransport();
  if (!client) {
    console.log(`[mail:noop] to=${message.to} subject=${message.subject}`);
    return;
  }
  await client.sendMail({ ...message, from: from ?? undefined });
}
