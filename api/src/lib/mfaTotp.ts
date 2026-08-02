import { authenticator } from 'otplib';
import QRCode from 'qrcode';

import { decryptSecret } from './mfaEncryption.js';

const ISSUER = 'Logenhelfer';

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function buildOtpauthUri(secret: string, accountEmail: string): string {
  return authenticator.keyuri(accountEmail, ISSUER, secret);
}

/** `otplib`'s default window (1) tolerates ±30s of clock drift either side. */
export function verifyTotpCode(secret: string, code: string): boolean {
  try {
    return authenticator.verify({ token: code, secret });
  } catch {
    return false;
  }
}

/**
 * Same as verifyTotpCode, but takes the still-encrypted secret and decrypts
 * it itself - decryptSecret throws on any auth-tag mismatch (e.g. a secret
 * encrypted under a since-rotated/replaced MFA_ENCRYPTION_KEY), and callers
 * that decrypted inline before calling verifyTotpCode let that throw escape
 * their own try/catch entirely, crashing with a 500 instead of a clean
 * "verification failed". Found live on `next` 2026-08-02.
 */
export function verifyEncryptedTotpCode(encryptedSecret: string, code: string): boolean {
  try {
    return verifyTotpCode(decryptSecret(encryptedSecret), code);
  } catch {
    return false;
  }
}

export async function renderTotpQrDataUrl(otpauthUri: string): Promise<string> {
  return QRCode.toDataURL(otpauthUri);
}
