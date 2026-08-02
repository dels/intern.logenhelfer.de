import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getMfaSettings } from '../../src/lib/mfaSettings.js';
import { appConfig } from '../../src/lib/appConfig.js';

describe('getMfaSettings', () => {
  beforeEach(() => {
    delete process.env.DEMO_MODE;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reads through AppConfig when not in demo mode', async () => {
    vi.spyOn(appConfig, 'get').mockImplementation(async (key: string) => {
      const values: Record<string, unknown> = {
        mfa_mode: 'mandatory',
        mfa_enforce_for_officers: true,
        mfa_grace_period_days: 21,
        mfa_trusted_device_days: 45,
        mfa_grace_period_started_at: '2026-07-01T00:00:00.000Z',
      };
      return values[key] ?? null;
    });

    const settings = await getMfaSettings();
    expect(settings).toEqual({
      mode: 'mandatory',
      enforceForOfficers: true,
      gracePeriodDays: 21,
      trustedDeviceDays: 45,
      gracePeriodStartedAt: new Date('2026-07-01T00:00:00.000Z'),
    });
  });

  it('forces optional/no-enforcement in demo mode regardless of stored config', async () => {
    process.env.DEMO_MODE = 'true';
    vi.spyOn(appConfig, 'get').mockImplementation(async (key: string) => {
      if (key === 'mfa_mode') return 'mandatory';
      if (key === 'mfa_enforce_for_officers') return true;
      return null;
    });

    const settings = await getMfaSettings();
    expect(settings.mode).toBe('optional');
    expect(settings.enforceForOfficers).toBe(false);
  });

  it('clamps trustedDeviceDays to a maximum of 90', async () => {
    vi.spyOn(appConfig, 'get').mockImplementation(async (key: string) => (key === 'mfa_trusted_device_days' ? 400 : null));
    const settings = await getMfaSettings();
    expect(settings.trustedDeviceDays).toBe(90);
  });
});
