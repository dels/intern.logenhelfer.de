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

describe('mailStringsFor - login notifications', () => {
  it('returns German login-notification templates', () => {
    const strings = mailStringsFor('de');
    expect(strings.loginNotification.subject('Meine Loge')).toBe('Neue Anmeldung bei Meine Loge');
    expect(strings.loginMethodLabel('passkey')).toBe('Passkey');
    expect(strings.loginMethodLabel('email')).toBe('E-Mail-Code');
    const body = strings.loginNotification.body('Appr', '2026-08-05T12:00:00.000Z', '203.0.113.5', 'Passwort');
    expect(body).toContain('Lieber Br. Appr');
    expect(body).toContain('2026-08-05T12:00:00.000Z');
    expect(body).toContain('203.0.113.5');
    expect(body).toContain('Passwort');
  });

  it('returns German lockout-notification templates', () => {
    const strings = mailStringsFor('de');
    expect(strings.loginLockoutNotification.subject('Meine Loge')).toBe('Mehrere fehlgeschlagene Anmeldeversuche bei Meine Loge');
    const body = strings.loginLockoutNotification.body('Appr', '2026-08-05T12:00:00.000Z', '203.0.113.5', 'TOTP');
    expect(body).toContain('Lieber Br. Appr');
    expect(body).toContain('TOTP');
  });

  it('returns English login-notification templates', () => {
    const strings = mailStringsFor('en');
    expect(strings.loginNotification.subject('My Lodge')).toBe('New login for My Lodge');
    expect(strings.loginMethodLabel('backup_code')).toBe('Backup code');
    const body = strings.loginNotification.body('Appr', '2026-08-05T12:00:00.000Z', '203.0.113.5', 'Password');
    expect(body).toContain('Dear Br. Appr');
    expect(body).toContain('Password');
  });

  it('returns English lockout-notification templates', () => {
    const strings = mailStringsFor('en');
    expect(strings.loginLockoutNotification.subject('My Lodge')).toBe('Multiple failed login attempts for My Lodge');
  });

  it('falls back to the generic MFA label for an unrecognized method', () => {
    expect(mailStringsFor('de').loginMethodLabel('mfa_unknown')).toBe('MFA');
    expect(mailStringsFor('en').loginMethodLabel('mfa_unknown')).toBe('MFA');
  });
});
