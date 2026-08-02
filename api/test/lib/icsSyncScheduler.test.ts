import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/externalEventIcsSync.js', () => ({ syncAllActiveIcsSources: vi.fn().mockResolvedValue([]) }));
vi.mock('../../src/lib/safeIcsFetch.js', () => ({ fetchIcsUrlSafely: vi.fn() }));

const { syncAllActiveIcsSources } = await import('../../src/lib/externalEventIcsSync.js');
const { startIcsAutoSync, resolveIntervalHours } = await import('../../src/lib/icsSyncScheduler.js');

describe('resolveIntervalHours', () => {
  const ORIGINAL = process.env.ICS_SYNC_INTERVAL_HOURS;

  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.ICS_SYNC_INTERVAL_HOURS;
    else process.env.ICS_SYNC_INTERVAL_HOURS = ORIGINAL;
  });

  it('defaults to 24 when unset', () => {
    delete process.env.ICS_SYNC_INTERVAL_HOURS;
    expect(resolveIntervalHours()).toBe(24);
  });

  it('uses a valid positive override', () => {
    process.env.ICS_SYNC_INTERVAL_HOURS = '6';
    expect(resolveIntervalHours()).toBe(6);
  });

  it.each(['not-a-number', '0', '-5', ''])('falls back to 24 for invalid value %j', (value) => {
    process.env.ICS_SYNC_INTERVAL_HOURS = value;
    expect(resolveIntervalHours()).toBe(24);
  });
});

describe('startIcsAutoSync', () => {
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
  const ORIGINAL_DISABLED = process.env.ICS_SYNC_DISABLED;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.mocked(syncAllActiveIcsSources).mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
    if (ORIGINAL_DISABLED === undefined) delete process.env.ICS_SYNC_DISABLED;
    else process.env.ICS_SYNC_DISABLED = ORIGINAL_DISABLED;
  });

  it('does nothing under NODE_ENV=test', () => {
    process.env.NODE_ENV = 'test';
    startIcsAutoSync();
    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(syncAllActiveIcsSources).not.toHaveBeenCalled();
  });

  it('does nothing under ICS_SYNC_DISABLED=true, even outside NODE_ENV=test (e2e rate-limit server case)', () => {
    process.env.NODE_ENV = 'e2e-ratelimit';
    process.env.ICS_SYNC_DISABLED = 'true';
    startIcsAutoSync();
    vi.advanceTimersByTime(60 * 60 * 1000);
    expect(syncAllActiveIcsSources).not.toHaveBeenCalled();
  });

  it('delays the initial sync rather than firing it synchronously at boot, then runs it', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.ICS_SYNC_DISABLED;
    startIcsAutoSync();
    expect(syncAllActiveIcsSources).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(syncAllActiveIcsSources).toHaveBeenCalledTimes(1);
  });
});
