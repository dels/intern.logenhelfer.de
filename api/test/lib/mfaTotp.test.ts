import { describe, expect, it } from 'vitest';
import { authenticator } from 'otplib';
import { generateTotpSecret, buildOtpauthUri, verifyTotpCode, renderTotpQrDataUrl } from '../../src/lib/mfaTotp.js';

describe('mfaTotp', () => {
  it('generates a secret usable to produce a verifiable code', () => {
    const secret = generateTotpSecret();
    const code = authenticator.generate(secret);
    expect(verifyTotpCode(secret, code)).toBe(true);
  });

  it('rejects an incorrect code', () => {
    const secret = generateTotpSecret();
    expect(verifyTotpCode(secret, '000000')).toBe(false);
  });

  it('builds an otpauth:// URI containing the account email and issuer', () => {
    const secret = generateTotpSecret();
    const uri = buildOtpauthUri(secret, 'brother@example.de');
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(decodeURIComponent(uri)).toContain('brother@example.de');
    expect(decodeURIComponent(uri)).toContain('Logenhelfer');
  });

  it('renders a QR code as a data: URL', async () => {
    const uri = buildOtpauthUri(generateTotpSecret(), 'brother@example.de');
    const dataUrl = await renderTotpQrDataUrl(uri);
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
