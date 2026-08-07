import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/mail.js', () => ({ sendMail: vi.fn().mockResolvedValue(undefined) }));
const { sendMail } = await import('../../src/lib/mail.js');
const { redisConfigured, mailQueueName, enqueueMail } = await import('../../src/lib/mailQueue.js');

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
