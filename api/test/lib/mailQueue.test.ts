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

  // Regression test for a final-review Critical finding: buildRedisConnection
  // used to set maxRetriesPerRequest: null unconditionally, which meant a
  // command sent while Redis is configured-but-unreachable sat in ioredis's
  // offline queue forever - enqueueMail never resolved or rejected, hanging
  // POST /password/forgot, MFA email-OTP setup, and POST /announcements
  // indefinitely. No real Redis server needed here (that's the point - this
  // tests the unreachable case), so it always runs, no describe.skipIf guard.
  it('falls back to sendMail instead of hanging when Redis is configured but unreachable', async () => {
    vi.stubEnv('REDIS_PROTOCOL', 'redis');
    vi.stubEnv('REDIS_HOST', '127.0.0.1');
    vi.stubEnv('REDIS_PORT', '1'); // nothing listens on port 1 - connection refused/times out
    vi.stubEnv('DEPLOY_NAME', `test-unreachable-${process.pid}`);
    const message = { to: 'brother@example.test', subject: 'Unreachable Redis test', text: 'Body' };

    const startedAt = Date.now();
    await enqueueMail(message);
    const elapsedMs = Date.now() - startedAt;

    // buildRedisConnection's producer role documents a ~6.6s worst-case
    // budget (connectTimeout + bounded retries) - allow a margin above that
    // instead of asserting near-instant, since CI/CPU-starved hosts can be
    // slower than a laptop, and this specific unreachable port (nothing
    // listens there) actually fails much faster than that worst case.
    expect(elapsedMs).toBeLessThan(10_000);
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledWith(message);

    await closeMailQueue();
  });
});

// Needs an actual Redis - BullMQ has no official in-memory fake worth
// trusting for this. Set TEST_REDIS_HOST (e.g. via `docker compose up -d
// redis` locally, using TEST_REDIS_HOST=127.0.0.1 and
// TEST_REDIS_PORT=${REDIS_LOCAL_PORT:-56379} in your own .env, or on the
// command line: `TEST_REDIS_HOST=127.0.0.1 TEST_REDIS_PORT=56379 npx vitest
// run test/lib/mailQueue.test.ts`) to run this block; it skips cleanly
// otherwise, and always runs in bin/test-gate. TEST_REDIS_* (not REDIS_*) is
// deliberate - see bin/test-gate's own comment on this: REDIS_* is what
// redisConfigured() reads at runtime, and setting it env-wide on the whole
// suite broke 24+ unrelated tests that route mail through enqueueMail. Every
// real-Redis it() below stubs REDIS_PROTOCOL/REDIS_HOST/REDIS_PORT (and
// DEPLOY_NAME) explicitly from these TEST_REDIS_* vars rather than relying on
// any of them being ambient in process.env.
describe.skipIf(!process.env.TEST_REDIS_HOST)('enqueueMail against a real Redis', () => {
  // Unique per test run (and per concurrent worktree) so a prior run's
  // leftover jobs can never be mistaken for evidence that this run's
  // enqueueMail call actually worked - see the afterEach below for the
  // matching cleanup that keeps this queue from leaking state forward too.
  let verifyQueue: Queue | undefined;
  // BullMQ treats an externally-constructed connection as "shared" and
  // never quits it itself on queue.close() - same reason mailQueue.ts's own
  // teardownQueue exists. verifyQueue.close() alone leaves this connection
  // open; found live 2026-08-08 when that leaked connection outlived an ACL
  // user deletion in the NOPERM regression test below and threw unrelated
  // WRONGPASS errors afterward.
  let verifyConnection: ReturnType<typeof buildRedisConnection> | undefined;

  afterEach(async () => {
    if (verifyQueue) {
      await verifyQueue.obliterate({ force: true });
      await verifyQueue.close().catch(() => {});
      await verifyConnection?.quit().catch(() => verifyConnection?.disconnect());
      verifyQueue = undefined;
      verifyConnection = undefined;
    }
    await closeMailQueue();
  });

  it('adds a real job instead of calling sendMail directly', async () => {
    vi.stubEnv('REDIS_PROTOCOL', process.env.TEST_REDIS_PROTOCOL || 'redis');
    vi.stubEnv('REDIS_HOST', process.env.TEST_REDIS_HOST || '127.0.0.1');
    vi.stubEnv('REDIS_PORT', process.env.TEST_REDIS_PORT || '6379');
    vi.stubEnv('DEPLOY_NAME', `test-${process.pid}`);
    const message = { to: 'brother@example.test', subject: 'Real queue test', text: 'Body' };

    await enqueueMail(message);

    expect(sendMail).not.toHaveBeenCalled();

    const { Queue } = await import('bullmq');
    verifyConnection = buildRedisConnection();
    verifyQueue = new Queue(mailQueueName(), { connection: verifyConnection });
    const jobs = await verifyQueue.getJobs(['waiting', 'delayed', 'active', 'completed']);
    expect(jobs.some((job) => job.data.to === message.to)).toBe(true);
  });

  // Regression test for a live incident (2026-08-08): the shared prod
  // Redis's `rels` ACL user is deliberately locked down and has no
  // permission for INFO ("NOPERM User rels has no permissions to run the
  // 'info' command"). That error came from BullMQ's own unconditional
  // RedisConnection#getRedisVersionAndType() call, not from ioredis's own
  // ready-check (which already degrades gracefully on a NOPERM'd INFO) -
  // fixed via `skipVersionCheck: true` on both the Queue and Worker
  // options in mailQueue.ts/mailWorker.ts. This test creates a real
  // restricted-ACL user on the test Redis to reproduce the exact failure
  // mode rather than only asserting the fix in the abstract.
  it('still enqueues successfully when the Redis user\'s ACL denies INFO (2026-08-08 NOPERM regression)', async () => {
    const adminHost = process.env.TEST_REDIS_HOST || '127.0.0.1';
    const adminPort = Number(process.env.TEST_REDIS_PORT || '6379');
    const { Redis } = await import('ioredis');
    const admin = new Redis({ host: adminHost, port: adminPort });
    const restrictedUsername = `noinfo-${process.pid}`;
    const restrictedPassword = 'test-only-not-a-real-secret';
    try {
      // +@all then -info mirrors the shape of a real locked-down ACL user:
      // broad command access, but INFO explicitly denied.
      await admin.call('ACL', 'SETUSER', restrictedUsername, 'on', `>${restrictedPassword}`, '~*', '+@all', '-info');

      vi.stubEnv('REDIS_PROTOCOL', process.env.TEST_REDIS_PROTOCOL || 'redis');
      vi.stubEnv('REDIS_HOST', adminHost);
      vi.stubEnv('REDIS_PORT', String(adminPort));
      vi.stubEnv('REDIS_USERNAME', restrictedUsername);
      vi.stubEnv('REDIS_PASSWORD', restrictedPassword);
      vi.stubEnv('DEPLOY_NAME', `test-noinfo-${process.pid}`);
      const message = { to: 'brother@example.test', subject: 'NOPERM regression test', text: 'Body' };

      await enqueueMail(message);

      expect(sendMail).not.toHaveBeenCalled();

      const { Queue } = await import('bullmq');
      verifyConnection = buildRedisConnection();
      verifyQueue = new Queue(mailQueueName(), { connection: verifyConnection, skipVersionCheck: true });
      const jobs = await verifyQueue.getJobs(['waiting', 'delayed', 'active', 'completed']);
      expect(jobs.some((job) => job.data.to === message.to)).toBe(true);

      // Close this test's own connections BEFORE deleting the restricted
      // user below, not in the shared afterEach (which runs after this
      // finally block) - a connection still using this user's credentials
      // when the user disappears throws an unrelated, delayed WRONGPASS
      // error instead of the assertions above ever getting a chance to run
      // (found live 2026-08-08 authoring this exact test).
      await verifyQueue.obliterate({ force: true });
      await verifyQueue.close().catch(() => {});
      await verifyConnection.quit().catch(() => verifyConnection?.disconnect());
      verifyQueue = undefined;
      verifyConnection = undefined;
      await closeMailQueue();
    } finally {
      await admin.call('ACL', 'DELUSER', restrictedUsername).catch(() => {});
      await admin.quit();
    }
  });
});
