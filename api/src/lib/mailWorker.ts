import { Worker, type Job } from 'bullmq';

import { appConfig } from './appConfig.js';
import { buildRedisConnection, mailQueueName, redisConfigured } from './mailQueue.js';
import { sendMail, type MailMessage } from './mail.js';

let worker: Worker<MailMessage> | null = null;

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
  if (!redisConfigured() || process.env.NODE_ENV === 'test') return;

  worker = new Worker<MailMessage>(
    mailQueueName(),
    async (job) => {
      await sendMail(job.data);
    },
    { connection: buildRedisConnection() },
  );

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
    await worker.close();
    worker = null;
  }
}
