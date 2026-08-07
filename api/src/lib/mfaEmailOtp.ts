import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';

import { prisma } from '../db.js';
import { enqueueMail } from './mailQueue.js';

const BCRYPT_COST = 12;
const OTP_TTL_MS = 10 * 60_000;

function generateSixDigitCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export async function sendEmailOtp(userId: number, email: string, purpose: 'setup' | 'login'): Promise<void> {
  const code = generateSixDigitCode();
  const now = new Date();

  await prisma.mfa_email_otp_codes.create({
    data: {
      user_id: userId,
      purpose,
      code_hash: await bcrypt.hash(code, BCRYPT_COST),
      expires_at: new Date(now.getTime() + OTP_TTL_MS),
      created_at: now,
    },
  });

  await enqueueMail({
    to: email,
    subject: 'Dein Anmeldecode',
    text: `Dein Bestätigungscode lautet: ${code}\n\nDieser Code ist 10 Minuten gültig.`,
  });
}

export async function verifyEmailOtp(userId: number, purpose: 'setup' | 'login', code: string): Promise<boolean> {
  const candidates = await prisma.mfa_email_otp_codes.findMany({
    where: { user_id: userId, purpose, consumed_at: null, expires_at: { gt: new Date() } },
    orderBy: { created_at: 'desc' },
  });

  for (const candidate of candidates) {
    if (await bcrypt.compare(code, candidate.code_hash)) {
      await prisma.mfa_email_otp_codes.update({ where: { id: candidate.id }, data: { consumed_at: new Date() } });
      return true;
    }
  }
  return false;
}
