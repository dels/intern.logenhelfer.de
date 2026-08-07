import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Queue } from 'bullmq';

vi.mock('../../src/lib/mail.js', () => ({ sendMail: vi.fn().mockResolvedValue(undefined) }));
const { sendMail } = await import('../../src/lib/mail.js');
const { redisConfigured, mailQueueName, enqueueMail, closeMailQueue, buildRedisConnection } = await import('../../src/lib/mailQueue.js');

// vi.stubEnv's automatic restore (via vi.unstubAllEnvs in afterEach) means
// these tests are safe to run even when a developer's local .env already
// has real REDIS_* values loaded (api/test/setup.ts loads it) - each test
// stubs exactly the vars it cares about, then the original value (whatever
// it was, set or unset) comes back afterward.
afterEach(() => {
  vi.unstubAllEnvs();
  vi.mocked(sendMail).mockClear();
});

describe('redisConfigured', () => {
  it('is false when no REDIS_* vars are set', () => {
    vi.stubEnv('REDIS_PROTOCOL', '');
    vi.stubEnv('REDIS_HOST', '');
    vi.stubEnv('REDIS_PORT', '');
    expect(redisConfigured()).toBe(false);
  });

  it('is true once protocol, host, and port are all set (username/password optional)', () => {
    vi.stubEnv('REDIS_PROTOCOL', 'redis');
    vi.stubEnv('REDIS_HOST', '127.0.0.1');
    vi.stubEnv('REDIS_PORT', '6379');
    expect(redisConfigured()).toBe(true);
  });

  it('is false if any of protocol/host/port is missing', () => {
    vi.stubEnv('REDIS_PROTOCOL', 'redis');
    vi.stubEnv('REDIS_HOST', '127.0.0.1');
    vi.stubEnv('REDIS_PORT', '');
    expect(redisConfigured()).toBe(false);
  });
});

describe('mailQueueName', () => {
  it('throws when DEPLOY_NAME is unset', () => {
    vi.stubEnv('DEPLOY_NAME', '');
    expect(() => mailQueueName()).toThrow(/DEPLOY_NAME/);
  });

  it('builds the env-scoped queue name from DEPLOY_NAME', () => {
    vi.stubEnv('DEPLOY_NAME', 'fwze');
    expect(mailQueueName()).toBe('mail-logenhelfer-fwze-queue');
  });
});

describe('enqueueMail', () => {
  it('calls sendMail directly when Redis is not configured', async () => {
    vi.stubEnv('REDIS_PROTOCOL', '');
    vi.stubEnv('REDIS_HOST', '');
    vi.stubEnv('REDIS_PORT', '');
    const message = { to: 'brother@example.test', subject: 'Test', text: 'Body' };

    await enqueueMail(message);

    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledWith(message);
  });
});

// Needs an actual Redis - BullMQ has no official in-memory fake worth
// trusting for this. Set REDIS_HOST (e.g. via `docker compose up -d redis`
// locally, using REDIS_HOST=127.0.0.1 and REDIS_PORT=${REDIS_LOCAL_PORT:-56379}
// in your own .env) to run this block; it skips cleanly otherwise, and
// always runs in bin/test-gate (Task 5 wires that up).
describe.skipIf(!process.env.REDIS_HOST)('enqueueMail against a real Redis', () => {
  // Unique per test run (and per concurrent worktree) so a prior run's
  // leftover jobs can never be mistaken for evidence that this run's
  // enqueueMail call actually worked - see the afterEach below for the
  // matching cleanup that keeps this queue from leaking state forward too.
  let verifyQueue: Queue | undefined;

  afterEach(async () => {
    if (verifyQueue) {
      await verifyQueue.obliterate({ force: true });
      await verifyQueue.close();
      verifyQueue = undefined;
    }
    await closeMailQueue();
  });

  it('adds a real job instead of calling sendMail directly', async () => {
    vi.stubEnv('REDIS_PROTOCOL', process.env.REDIS_PROTOCOL || 'redis');
    vi.stubEnv('DEPLOY_NAME', `test-${process.pid}`);
    const message = { to: 'brother@example.test', subject: 'Real queue test', text: 'Body' };

    await enqueueMail(message);

    expect(sendMail).not.toHaveBeenCalled();

    const { Queue } = await import('bullmq');
    verifyQueue = new Queue(mailQueueName(), { connection: buildRedisConnection() });
    const jobs = await verifyQueue.getJobs(['waiting', 'delayed', 'active', 'completed']);
    expect(jobs.some((job) => job.data.to === message.to)).toBe(true);
  });
});
