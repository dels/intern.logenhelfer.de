import { beforeEach, describe, expect, it, vi } from 'vitest';
import { sendEmailOtp, verifyEmailOtp } from '../../src/lib/mfaEmailOtp.js';
import * as mail from '../../src/lib/mail.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

describe('mfaEmailOtp', () => {
  beforeEach(async () => {
    await resetDb();
    // vi.spyOn on an already-spied method returns the SAME mock instance
    // without clearing its call history - without clearAllMocks() here,
    // `.mock.calls[0]` in a later test silently reads an earlier test's
    // (different user's) call instead of this test's own. Found via a real
    // remote test-gate run: "is single-use" flakily failed because it read
    // the very first test's leftover call.
    vi.clearAllMocks();
    vi.spyOn(mail, 'sendMail').mockResolvedValue(undefined);
  });

  it('sends a 6-digit code and later accepts it', async () => {
    const user = await createUser({ email: 'brother@example.de' });
    await sendEmailOtp(user.id, user.email, 'setup');

    expect(mail.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'brother@example.de' }));
    const sentText = vi.mocked(mail.sendMail).mock.calls[0]![0].text;
    const code = /(\d{6})/.exec(sentText)![1]!;

    expect(await verifyEmailOtp(user.id, 'setup', code)).toBe(true);
  });

  it('rejects a wrong code', async () => {
    const user = await createUser();
    await sendEmailOtp(user.id, user.email, 'login');
    expect(await verifyEmailOtp(user.id, 'login', '000000')).toBe(false);
  });

  it('rejects a code from the wrong purpose', async () => {
    const user = await createUser();
    await sendEmailOtp(user.id, user.email, 'setup');
    const row = await prisma.mfa_email_otp_codes.findFirstOrThrow({ where: { user_id: user.id } });
    expect(row.purpose).toBe('setup');
    expect(await verifyEmailOtp(user.id, 'login', '123456')).toBe(false);
  });

  it('is single-use', async () => {
    const user = await createUser();
    await sendEmailOtp(user.id, user.email, 'login');
    const sentText = vi.mocked(mail.sendMail).mock.calls[0]![0].text;
    const code = /(\d{6})/.exec(sentText)![1]!;

    expect(await verifyEmailOtp(user.id, 'login', code)).toBe(true);
    expect(await verifyEmailOtp(user.id, 'login', code)).toBe(false);
  });

  it('rejects an expired code', async () => {
    const user = await createUser();
    await sendEmailOtp(user.id, user.email, 'login');
    await prisma.mfa_email_otp_codes.updateMany({ where: { user_id: user.id }, data: { expires_at: new Date(Date.now() - 1000) } });
    const sentText = vi.mocked(mail.sendMail).mock.calls[0]![0].text;
    const code = /(\d{6})/.exec(sentText)![1]!;
    expect(await verifyEmailOtp(user.id, 'login', code)).toBe(false);
  });
});
