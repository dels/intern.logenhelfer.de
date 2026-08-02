import { describe, expect, it, vi } from 'vitest';
import { getRelyingPartyConfig, buildRegistrationOptions, buildAuthenticationOptions } from '../../src/lib/mfaPasskeys.js';
import { appConfig } from '../../src/lib/appConfig.js';

describe('mfaPasskeys', () => {
  it('derives rpID from AppConfig[:domain]', async () => {
    vi.spyOn(appConfig, 'get').mockResolvedValue('logenhelfer.de');
    const config = await getRelyingPartyConfig();
    expect(config.rpID).toBe('logenhelfer.de');
    expect(config.origin).toBe('https://logenhelfer.de');
  });

  // Regression: a mixed-case or whitespace-padded AppConfig[:domain] value
  // (e.g. an admin-entered "Intern.fwze.de" vs. the real "intern.fwze.de")
  // must not silently produce a wrong rpID/origin - @simplewebauthn/server's
  // verifyRegistrationResponse does an exact `origin !== expectedOrigin`
  // string comparison against the browser's always-lowercase origin, so any
  // case/whitespace drift here throws for every registration attempt.
  it('normalizes a mixed-case or whitespace-padded domain', async () => {
    vi.spyOn(appConfig, 'get').mockResolvedValue(' Intern.fwze.de \n');
    const config = await getRelyingPartyConfig();
    expect(config.rpID).toBe('intern.fwze.de');
    expect(config.origin).toBe('https://intern.fwze.de');
  });

  it('builds registration options requiring a discoverable (resident-key) credential', async () => {
    vi.spyOn(appConfig, 'get').mockResolvedValue('logenhelfer.de');
    const options = await buildRegistrationOptions({ userId: 1, email: 'brother@example.de', existingCredentialIds: [] });
    expect(options.authenticatorSelection?.residentKey).toBe('required');
    expect(options.authenticatorSelection?.userVerification).toBe('required');
  });

  it('builds authentication options with an empty allow-list for discoverable login', async () => {
    vi.spyOn(appConfig, 'get').mockResolvedValue('logenhelfer.de');
    const options = await buildAuthenticationOptions({ allowCredentialIds: [] });
    expect(options.allowCredentials).toEqual([]);
  });
});
