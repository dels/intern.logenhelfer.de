import { appConfig } from './appConfig.js';

export type MfaMode = 'optional' | 'mandatory';

export interface MfaSettings {
  mode: MfaMode;
  enforceForOfficers: boolean;
  gracePeriodDays: number;
  trustedDeviceDays: number;
  gracePeriodStartedAt: Date | null;
}

const MAX_TRUSTED_DEVICE_DAYS = 90;

/**
 * Single read-path for every MFA-related AppConfig value. Forces
 * optional/no-enforcement whenever DEMO_MODE is set, regardless of stored
 * values - see docs/superpowers/specs/2026-07-31-mfa-design.md's "Demo mode"
 * section. Every route that needs an MFA setting must go through this, not
 * appConfig.get(...) directly, so the demo override can't be forgotten at a
 * new call site.
 */
export async function getMfaSettings(): Promise<MfaSettings> {
  const isDemo = process.env.DEMO_MODE === 'true';

  const [rawMode, rawEnforce, rawGraceDays, rawTrustedDays, rawStartedAt] = await Promise.all([
    appConfig.get('mfa_mode'),
    appConfig.get('mfa_enforce_for_officers'),
    appConfig.get('mfa_grace_period_days'),
    appConfig.get('mfa_trusted_device_days'),
    appConfig.get('mfa_grace_period_started_at'),
  ]);

  const mode: MfaMode = isDemo ? 'optional' : rawMode === 'mandatory' ? 'mandatory' : 'optional';
  const trustedDeviceDays = Math.min(typeof rawTrustedDays === 'number' ? rawTrustedDays : 30, MAX_TRUSTED_DEVICE_DAYS);

  return {
    mode,
    enforceForOfficers: isDemo ? false : rawEnforce === true,
    gracePeriodDays: typeof rawGraceDays === 'number' ? rawGraceDays : 14,
    trustedDeviceDays,
    gracePeriodStartedAt: typeof rawStartedAt === 'string' && rawStartedAt !== '' ? new Date(rawStartedAt) : null,
  };
}
