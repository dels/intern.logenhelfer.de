import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

// AES-256-GCM, random 12-byte IV per value. Only TOTP secrets need this -
// backup codes and passkey public keys never need to be decrypted back to
// plaintext (see docs/superpowers/specs/2026-07-31-mfa-design.md).
const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;

function loadKey(): Buffer {
  const hex = process.env.MFA_ENCRYPTION_KEY;
  if (!hex) {
    throw new Error('MFA_ENCRYPTION_KEY is not set');
  }
  const buf = Buffer.from(hex, 'hex');
  if (buf.length !== KEY_BYTES) {
    throw new Error(`MFA_ENCRYPTION_KEY must be ${KEY_BYTES} bytes (${KEY_BYTES * 2} hex chars)`);
  }
  return buf;
}

/** Encrypts `plaintext`, returning `iv.ciphertext.authTag`, each base64-encoded. */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, loadKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, ciphertext, authTag].map((buf) => buf.toString('base64')).join('.');
}

/** Reverses encryptSecret. Throws on any malformed input or auth-tag mismatch. */
export function decryptSecret(encoded: string): string {
  const parts = encoded.split('.');
  if (parts.length !== 3) {
    throw new Error('malformed encrypted value');
  }
  const [ivB64, ciphertextB64, authTagB64] = parts as [string, string, string];
  const decipher = createDecipheriv(ALGORITHM, loadKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextB64, 'base64')), decipher.final()]).toString('utf8');
}
