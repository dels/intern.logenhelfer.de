import { prisma } from '../db.js';

const LOCKOUT_THRESHOLD = 5;
const BASE_LOCK_MS = 30_000;
const MAX_LOCK_MS = 15 * 60_000;

function lockDurationMs(failedCount: number): number {
  const failuresPastThreshold = failedCount - LOCKOUT_THRESHOLD;
  return Math.min(BASE_LOCK_MS * 2 ** failuresPastThreshold, MAX_LOCK_MS);
}

export async function isMfaLockedOut(subjectKey: string): Promise<boolean> {
  const record = await prisma.mfa_lockouts.findUnique({ where: { subject_key: subjectKey } });
  return record?.locked_until !== null && record?.locked_until !== undefined && record.locked_until.getTime() > Date.now();
}

export async function recordFailedMfaAttempt(subjectKey: string): Promise<void> {
  const now = new Date();
  const existing = await prisma.mfa_lockouts.findUnique({ where: { subject_key: subjectKey } });
  const failedCount = (existing?.failed_count ?? 0) + 1;
  const lockedUntil = failedCount >= LOCKOUT_THRESHOLD ? new Date(now.getTime() + lockDurationMs(failedCount)) : null;

  await prisma.mfa_lockouts.upsert({
    where: { subject_key: subjectKey },
    create: { subject_key: subjectKey, failed_count: failedCount, locked_until: lockedUntil, created_at: now, updated_at: now },
    update: { failed_count: failedCount, locked_until: lockedUntil, updated_at: now },
  });
}

export async function resetMfaLockout(subjectKey: string): Promise<void> {
  await prisma.mfa_lockouts.updateMany({
    where: { subject_key: subjectKey },
    data: { failed_count: 0, locked_until: null, updated_at: new Date() },
  });
}
