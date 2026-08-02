import { afterEach, describe, expect, it } from 'vitest';
import { resolveMailTransportMode } from './mail.js';

describe('resolveMailTransportMode', () => {
  const originalTransport = process.env.MAIL_TRANSPORT;
  const originalSmtpHost = process.env.SMTP_HOST;

  afterEach(() => {
    if (originalTransport === undefined) delete process.env.MAIL_TRANSPORT;
    else process.env.MAIL_TRANSPORT = originalTransport;
    if (originalSmtpHost === undefined) delete process.env.SMTP_HOST;
    else process.env.SMTP_HOST = originalSmtpHost;
  });

  it('defaults to console when neither MAIL_TRANSPORT nor SMTP_HOST is set', () => {
    delete process.env.MAIL_TRANSPORT;
    delete process.env.SMTP_HOST;
    expect(resolveMailTransportMode()).toBe('console');
  });

  it('infers smtp when SMTP_HOST is set and MAIL_TRANSPORT is unset (backward compat)', () => {
    delete process.env.MAIL_TRANSPORT;
    process.env.SMTP_HOST = 'mail.example.com';
    expect(resolveMailTransportMode()).toBe('smtp');
  });

  it('explicit MAIL_TRANSPORT=console wins even when SMTP_HOST is set', () => {
    process.env.MAIL_TRANSPORT = 'console';
    process.env.SMTP_HOST = 'mail.example.com';
    expect(resolveMailTransportMode()).toBe('console');
  });

  it('explicit MAIL_TRANSPORT=smtp wins even when SMTP_HOST is unset', () => {
    process.env.MAIL_TRANSPORT = 'smtp';
    delete process.env.SMTP_HOST;
    expect(resolveMailTransportMode()).toBe('smtp');
  });

  it('falls back to inference on an unrecognized MAIL_TRANSPORT value', () => {
    process.env.MAIL_TRANSPORT = 'carrier-pigeon';
    process.env.SMTP_HOST = 'mail.example.com';
    expect(resolveMailTransportMode()).toBe('smtp');
  });
});
