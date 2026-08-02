import { createHash, randomBytes } from 'node:crypto';
import type { Request } from 'express';

import { prisma } from '../db.js';

function digest(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export async function isDeviceTrusted(userId: number, rawDeviceToken: string | undefined): Promise<boolean> {
  if (!rawDeviceToken) return false;
  const record = await prisma.mfa_trusted_devices.findUnique({ where: { device_token_hash: digest(rawDeviceToken) } });
  return record !== null && record.user_id === userId && record.expires_at.getTime() > Date.now();
}

export async function issueTrustedDeviceToken(userId: number, req: Request, trustedDeviceDays: number): Promise<string> {
  const rawToken = randomBytes(32).toString('hex');
  const now = new Date();
  await prisma.mfa_trusted_devices.create({
    data: {
      user_id: userId,
      device_token_hash: digest(rawToken),
      user_agent: req.headers['user-agent'] ?? null,
      last_ip: req.ip ?? null,
      expires_at: new Date(now.getTime() + trustedDeviceDays * 86_400_000),
      created_at: now,
    },
  });
  return rawToken;
}
