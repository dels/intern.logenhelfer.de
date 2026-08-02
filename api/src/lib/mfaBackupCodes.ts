import { randomBytes } from 'node:crypto';

import bcrypt from 'bcryptjs';

import { prisma } from '../db.js';

const CODE_COUNT = 10;
const BCRYPT_COST = 12;

function generateOneCode(): string {
  // 10 chars from a base32-ish alphabet, grouped for readability (e.g. "7K2P-9XQR").
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = randomBytes(10);
  const chars = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  return `${chars.slice(0, 5)}-${chars.slice(5)}`;
}

export async function generateBackupCodes(userId: number): Promise<string[]> {
  const codes = Array.from({ length: CODE_COUNT }, generateOneCode);
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.mfa_backup_codes.deleteMany({ where: { user_id: userId } });
    await tx.mfa_backup_codes.createMany({
      data: await Promise.all(codes.map(async (code) => ({ user_id: userId, code_hash: await bcrypt.hash(code, BCRYPT_COST), created_at: now }))),
    });
  });

  return codes;
}

export async function consumeBackupCode(userId: number, code: string): Promise<boolean> {
  const candidates = await prisma.mfa_backup_codes.findMany({ where: { user_id: userId, used_at: null } });
  for (const candidate of candidates) {
    if (await bcrypt.compare(code, candidate.code_hash)) {
      await prisma.mfa_backup_codes.update({ where: { id: candidate.id }, data: { used_at: new Date() } });
      return true;
    }
  }
  return false;
}
