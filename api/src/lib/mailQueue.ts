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
 * Worker's blocking commands behave differently than a Queue's, which is
 * also why they need different options (see `role` below).
 *
 * role: 'worker' (default) sets maxRetriesPerRequest: null, which BullMQ
 * requires on every connection it hands to a Worker for its blocking
 * commands. role: 'producer' is for enqueueMail's Queue instead - giving it
 * the same null there would mean a command sent while Redis is unreachable
 * sits in ioredis's offline queue forever, so enqueueMail would never
 * resolve or reject (found in a final-review pass: this hung
 * POST /password/forgot, MFA email-OTP setup, and POST /announcements
 * indefinitely against an unreachable Redis).
 *
 * The producer instead gets a finite maxRetriesPerRequest, enableOfflineQueue:
 * false (fail fast instead of queueing offline), a connectTimeout, AND a
 * bounded retryStrategy - verified empirically that the first three alone
 * are NOT enough: ioredis's default retryStrategy retries forever, so the
 * connection never reaches a terminal state and BullMQ's own internal wait
 * for the connection to become ready never resolves either - enqueueMail
 * still hung past 20s in a real run with only those three set. Bounding
 * retryStrategy to give up after 2 retries is what actually lets it reject.
 * Budget, worst case (a black-holed host that burns the full connectTimeout
 * on every attempt, not just an instant ECONNREFUSED): connectTimeout (2s) +
 * retry 1 backoff (0.3s) + connectTimeout (2s) + retry 2 backoff (0.3s) +
 * connectTimeout (2s) = 6.6s - comfortably under the ~10s budget for
 * enqueueMail's callers (POST /password/forgot and friends) to fail over to
 * sendMail instead of hanging the request.
 */
export function buildRedisConnection(role: 'worker' | 'producer' = 'worker'): Redis {
  const { REDIS_PROTOCOL, REDIS_USERNAME, REDIS_PASSWORD, REDIS_HOST, REDIS_PORT } = process.env;
  const auth = REDIS_USERNAME && REDIS_PASSWORD ? `${REDIS_USERNAME}:${REDIS_PASSWORD}@` : '';
  const url = `${REDIS_PROTOCOL}://${auth}${REDIS_HOST}:${REDIS_PORT}`;
  if (role === 'producer') {
    return new Redis(url, {
      maxRetriesPerRequest: 3,
      enableOfflineQueue: false,
      connectTimeout: 2_000,
      retryStrategy: (times) => (times > 2 ? null : 300),
    });
  }
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
  queue ??= new Queue<MailMessage>(mailQueueName(), { connection: buildRedisConnection('producer') });
  return queue;
}

/**
 * Sends one email. No Redis configured (default for local dev/test and any
 * not-yet-wired environment): calls sendMail directly, synchronously - this
 * is load-bearing, not a convenience fallback (api/test/app.integration.test.ts
 * exercises real login routes that depend on exactly this path). Redis
 * configured: enqueues a durable job with retry/backoff instead of sending
 * inline - unless Redis is unreachable, in which case this falls back to the
 * same inline sendMail path rather than hanging (see buildRedisConnection's
 * 'producer' role comment) or throwing, so a Redis outage degrades to the
 * pre-queue behavior instead of being strictly worse than it.
 *
 * removeOnComplete/removeOnFail bound the shared production Redis's job
 * retention - without them BullMQ keeps every job forever by default, and
 * login-notification mail alone fires on every successful login.
 */
export async function enqueueMail(message: MailMessage): Promise<void> {
  if (!redisConfigured()) {
    await sendMail(message);
    return;
  }
  try {
    await getQueue().add(JOB_NAME, message, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 30_000 },
      removeOnComplete: { age: 86_400, count: 1_000 },
      removeOnFail: { age: 604_800 },
    });
  } catch (err) {
    console.error('[mailQueue] enqueue failed, falling back to inline send', err);
    // Tear down the cached producer connection so the NEXT enqueueMail call
    // builds a fresh one instead of reusing this one forever.
    // buildRedisConnection's bounded retryStrategy (see its own comment)
    // means a connection that fails this many times gives up reconnecting
    // for good - without this reset, a transient Redis blip would silently
    // disable queueing for the rest of the process's lifetime (permanent
    // degradation) instead of recovering the next time Redis is reachable.
    if (queue) {
      const deadQueue = queue;
      queue = null;
      await deadQueue.close().catch(() => {});
    }
    await sendMail(message);
  }
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
