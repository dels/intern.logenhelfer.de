import { describe, expect, it } from 'vitest';
import { mailStringsFor } from '../../src/lib/mailStrings.js';

describe('mailStringsFor', () => {
  it('returns German templates for "de"', () => {
    const strings = mailStringsFor('de');
    expect(strings.passwordReset.subject('Meine Loge')).toBe('Passwort zurücksetzen für Meine Loge');
    expect(strings.eventRegistrationDigest.greeting).toBe('Liebe Brüder');
    expect(strings.eventRegistrationDigest.externalLine('Fest', '2026-08-01', 'Loge X')).toBe('Fest am 2026-08-01 bei Loge X:');
  });

  it('returns English templates for "en"', () => {
    const strings = mailStringsFor('en');
    expect(strings.passwordReset.subject('My Lodge')).toBe('Reset your password for My Lodge');
    expect(strings.eventRegistrationDigest.greeting).toBe('Dear Brothers');
    expect(strings.eventRegistrationDigest.externalLine('Party', '2026-08-01', 'Lodge X')).toBe('Party on 2026-08-01 at Lodge X:');
  });

  it('falls back to German templates for an unrecognized language', () => {
    const strings = mailStringsFor('fr');
    expect(strings.eventRegistrationDigest.greeting).toBe('Liebe Brüder');
  });
});
