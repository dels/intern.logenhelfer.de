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
