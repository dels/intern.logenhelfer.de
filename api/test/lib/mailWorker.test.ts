import type { Job } from 'bullmq';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/mail.js', () => ({ sendMail: vi.fn().mockResolvedValue(undefined) }));
const { sendMail } = await import('../../src/lib/mail.js');
const { startMailWorker, stopMailWorker, alertTechnicalContact } = await import('../../src/lib/mailWorker.js');

import { appConfig, KNOWN_KEYS } from '../../src/lib/appConfig.js';
import { resetDb } from '../helpers/db.js';

afterEach(async () => {
  vi.unstubAllEnvs();
  vi.mocked(sendMail).mockClear();
  await stopMailWorker();
});

describe('startMailWorker guards', () => {
  it('does not throw when Redis is not configured', () => {
    vi.stubEnv('REDIS_PROTOCOL', '');
    vi.stubEnv('REDIS_HOST', '');
    vi.stubEnv('REDIS_PORT', '');
    expect(() => startMailWorker()).not.toThrow();
  });

  it('does not throw under NODE_ENV=test even if Redis vars happen to be set', () => {
    vi.stubEnv('REDIS_PROTOCOL', 'redis');
    vi.stubEnv('REDIS_HOST', '127.0.0.1');
    vi.stubEnv('REDIS_PORT', '6379');
    vi.stubEnv('DEPLOY_NAME', 'test');
    vi.stubEnv('NODE_ENV', 'test');
    // Must no-op (not attempt a real connection) - NODE_ENV=test always wins,
    // mirroring icsSyncScheduler.ts's startIcsAutoSync() guard.
    expect(() => startMailWorker()).not.toThrow();
  });
});

describe.skipIf(!process.env.REDIS_HOST)('mailWorker against a real Redis', () => {
  afterEach(async () => {
    await stopMailWorker();
    const { closeMailQueue } = await import('../../src/lib/mailQueue.js');
    await closeMailQueue();
  });

  it('processes an enqueued job by calling the real sendMail', async () => {
    vi.stubEnv('REDIS_PROTOCOL', process.env.REDIS_PROTOCOL || 'redis');
    vi.stubEnv('DEPLOY_NAME', 'test-worker');
    // NODE_ENV is already 'test' in this suite (see api/test/setup.ts), but
    // startMailWorker's guard would no-op on that - override it just for
    // this test so the worker actually starts, matching how a real
    // deployed environment (NODE_ENV=production) behaves.
    vi.stubEnv('NODE_ENV', 'production');

    const { enqueueMail } = await import('../../src/lib/mailQueue.js');
    startMailWorker();

    const message = { to: 'brother@example.test', subject: 'Worker test', text: 'Body' };
    await enqueueMail(message);

    await vi.waitFor(
      () => {
        expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: message.to }));
      },
      { timeout: 5_000, interval: 100 },
    );
  });
});

describe('alertTechnicalContact', () => {
  beforeEach(async () => {
    await resetDb();
    for (const key of Object.keys(KNOWN_KEYS)) appConfig.dirty(key);
  });

  it('emails the technical contact directly, never via enqueueMail', async () => {
    await appConfig.set('technical_contact_email', 'technik@example.test');
    const fakeJob = {
      attemptsMade: 5,
      opts: { attempts: 5 },
      data: { to: 'brother@example.test', subject: 'Will fail', text: 'Body' },
    } as unknown as Job<{ to: string; subject: string; text: string }>;

    await alertTechnicalContact(fakeJob, new Error('smtp unreachable'));

    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'technik@example.test' }));
  });

  it('does nothing when no technical contact is configured', async () => {
    // technical_contact_email has a non-empty compiled-in default
    // ('technik@logenhelfer.de' - see appConfig.ts's DEFAULT_RAW_VALUES), so
    // "not configured" has to be represented as an explicit empty string,
    // not just an absent row (resetDb() alone would still resolve to that
    // default).
    await appConfig.set('technical_contact_email', '');
    const fakeJob = {
      attemptsMade: 5,
      opts: { attempts: 5 },
      data: { to: 'brother@example.test', subject: 'Will fail', text: 'Body' },
    } as unknown as Job<{ to: string; subject: string; text: string }>;

    await alertTechnicalContact(fakeJob, new Error('smtp unreachable'));

    expect(sendMail).not.toHaveBeenCalled();
  });

  it('never throws, even if the alert send itself fails', async () => {
    await appConfig.set('technical_contact_email', 'technik@example.test');
    vi.mocked(sendMail).mockRejectedValueOnce(new Error('smtp also down'));
    const fakeJob = {
      attemptsMade: 5,
      opts: { attempts: 5 },
      data: { to: 'brother@example.test', subject: 'Will fail', text: 'Body' },
    } as unknown as Job<{ to: string; subject: string; text: string }>;

    await expect(alertTechnicalContact(fakeJob, new Error('smtp unreachable'))).resolves.toBeUndefined();
  });
});
