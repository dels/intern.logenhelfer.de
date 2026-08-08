import { Worker, type Job } from 'bullmq';
import type { Redis } from 'ioredis';

import { appConfig } from './appConfig.js';
import { buildRedisConnection, mailQueueName, redisConfigured } from './mailQueue.js';
import { sendMail, type MailMessage } from './mail.js';

let worker: Worker<MailMessage> | null = null;
// Same reason as mailQueue.ts's own `connection` variable: BullMQ treats an
// externally-constructed connection as "shared" and never quits it itself
// (see bullmq's createRedisBackend), so stopMailWorker() has to close this
// directly or the connection leaks past worker.close().
let workerConnection: Redis | null = null;

/**
 * Alerts a human that mail delivery is failing systemically - called only
 * after a job has exhausted every retry attempt (see startMailWorker's
 * 'failed' handler below). Sends straight through sendMail, never
 * enqueueMail: a systemic queue/Redis/SMTP outage must not try to
 * re-enqueue its own failure notification. Exported (not module-private) so
 * this behavior is unit-testable directly against a synthetic job, without
 * waiting out BullMQ's real ~7.5-minute exhausted-retries backoff schedule
 * end-to-end - see mailWorker.test.ts.
 */
export async function alertTechnicalContact(job: Job<MailMessage> | undefined, err: Error): Promise<void> {
  try {
    const technicalContactEmail = (await appConfig.get('technical_contact_email')) as string | null;
    if (!technicalContactEmail) return;
    await sendMail({
      to: technicalContactEmail,
      subject: `Mail delivery failed after ${job?.attemptsMade ?? '?'} attempts`,
      text: `A queued email to "${job?.data.to ?? 'unknown'}" failed permanently.\n\nSubject: ${job?.data.subject ?? 'unknown'}\nError: ${err.message}`,
    });
  } catch (alertErr) {
    console.error('[mailWorker] failed to send failure-alert email', alertErr);
  }
}

/**
 * Starts the in-process BullMQ worker that actually sends queued mail - the
 * only thing that calls the real sendMail once Redis is configured. No-ops
 * if Redis isn't configured or NODE_ENV=test, mirroring
 * icsSyncScheduler.ts's startIcsAutoSync() guard exactly (importing this
 * module in tests must never open a real connection or start a background
 * process).
 */
export function startMailWorker(): void {
  const isTest = process.env.NODE_ENV === 'test';
  if (!redisConfigured() || isTest) {
    // Don't log the no-op reason when it's specifically NODE_ENV=test - this
    // module is imported by every test file that touches mail, and logging
    // here would add noise to every single test run.
    if (!redisConfigured() && !isTest) {
      console.log('[mailWorker] disabled (no Redis configured)');
    }
    return;
  }

  // skipVersionCheck: true - see mailQueue.ts's buildRedisConnection doc
  // comment; without it BullMQ's own unconditional INFO call errors against
  // an ACL that doesn't permit it (found live 2026-08-08 against the shared
  // prod Redis's restricted `rels` user).
  workerConnection = buildRedisConnection('worker');
  worker = new Worker<MailMessage>(
    mailQueueName(),
    async (job) => {
      await sendMail(job.data);
    },
    { connection: workerConnection, skipVersionCheck: true },
  );
  console.log(`[mailWorker] started (queue=${mailQueueName()})`);

  worker.on('failed', (job, err) => {
    console.error(`[mailWorker] job ${job?.id} failed`, err);
    const attempts = job?.opts.attempts ?? 1;
    if (job && job.attemptsMade >= attempts) {
      void alertTechnicalContact(job, err);
    }
  });
}

/** Closes the worker's connection if one was ever started - no-ops otherwise. */
export async function stopMailWorker(): Promise<void> {
  if (worker) {
    const closingWorker = worker;
    const closingConnection = workerConnection;
    worker = null;
    workerConnection = null;
    await closingWorker.close().catch(() => {});
    await closingConnection?.quit().catch(() => closingConnection?.disconnect());
  }
}
