import { Queue } from 'bullmq';
import { Redis } from 'ioredis';

import { sendMail, type MailMessage } from './mail.js';

const JOB_NAME = 'send-mail';

/**
 * True once enough REDIS_* env vars are set to build a connection -
 * username/password are optional (e.g. an unauthenticated local dev
 * Redis), protocol/host/port are not. See .env.example's Redis section.
 */
export function redisConfigured(): boolean {
  return Boolean(process.env.REDIS_PROTOCOL && process.env.REDIS_HOST && process.env.REDIS_PORT);
}

/**
 * Builds a fresh ioredis connection from the 5 split env vars documented in
 * .env.example. Each caller (the Queue producer here, the Worker consumer
 * in mailWorker.ts) gets its OWN connection rather than sharing one - a
 * Worker's blocking commands behave differently than a Queue's.
 * maxRetriesPerRequest: null is required by BullMQ on every connection it
 * manages.
 */
export function buildRedisConnection(): Redis {
  const { REDIS_PROTOCOL, REDIS_USERNAME, REDIS_PASSWORD, REDIS_HOST, REDIS_PORT } = process.env;
  const auth = REDIS_USERNAME && REDIS_PASSWORD ? `${REDIS_USERNAME}:${REDIS_PASSWORD}@` : '';
  const url = `${REDIS_PROTOCOL}://${auth}${REDIS_HOST}:${REDIS_PORT}`;
  return new Redis(url, { maxRetriesPerRequest: null });
}

/**
 * Per-environment queue name, so every environment sharing one Redis
 * instance (see .env.example's Redis section) gets its own isolated job
 * stream. DEPLOY_NAME is required whenever Redis is configured - see
 * .env.example's DEPLOY_NAME comment and bin/deploy-to's cross-check.
 */
export function mailQueueName(): string {
  const deployName = process.env.DEPLOY_NAME;
  if (!deployName) {
    throw new Error('DEPLOY_NAME must be set when REDIS_HOST is configured (see .env.example)');
  }
  return `mail-logenhelfer-${deployName}-queue`;
}

let queue: Queue<MailMessage> | null = null;

function getQueue(): Queue<MailMessage> {
  queue ??= new Queue<MailMessage>(mailQueueName(), { connection: buildRedisConnection() });
  return queue;
}

/**
 * Sends one email. No Redis configured (default for local dev/test and any
 * not-yet-wired environment): calls sendMail directly, synchronously - this
 * is load-bearing, not a convenience fallback (api/test/app.integration.test.ts
 * exercises real login routes that depend on exactly this path). Redis
 * configured: enqueues a durable job with retry/backoff instead of sending
 * inline.
 */
export async function enqueueMail(message: MailMessage): Promise<void> {
  if (!redisConfigured()) {
    await sendMail(message);
    return;
  }
  await getQueue().add(JOB_NAME, message, {
    attempts: 5,
    backoff: { type: 'exponential', delay: 30_000 },
  });
}

/**
 * Closes the producer-side Redis connection if one was ever created -
 * no-ops otherwise. Needed by scripts/eventsNightly.ts before a short-lived
 * CLI process exits, so it doesn't hang on an open connection.
 */
export async function closeMailQueue(): Promise<void> {
  if (queue) {
    await queue.close();
    queue = null;
  }
}
