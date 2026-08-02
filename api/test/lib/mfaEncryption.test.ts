import { beforeEach, describe, expect, it } from 'vitest';
import { encryptSecret, decryptSecret } from '../../src/lib/mfaEncryption.js';

describe('mfaEncryption', () => {
  beforeEach(() => {
    process.env.MFA_ENCRYPTION_KEY = 'a'.repeat(64); // 32 bytes hex
  });

  it('round-trips a plaintext value', () => {
    const encoded = encryptSecret('JBSWY3DPEHPK3PXP');
    expect(encoded).not.toContain('JBSWY3DPEHPK3PXP');
    expect(decryptSecret(encoded)).toBe('JBSWY3DPEHPK3PXP');
  });

  it('produces a different ciphertext each call (random IV)', () => {
    const a = encryptSecret('same-secret');
    const b = encryptSecret('same-secret');
    expect(a).not.toBe(b);
  });

  it('throws when MFA_ENCRYPTION_KEY is missing', () => {
    delete process.env.MFA_ENCRYPTION_KEY;
    expect(() => encryptSecret('x')).toThrow('MFA_ENCRYPTION_KEY is not set');
  });

  it('throws when the encrypted value is malformed', () => {
    expect(() => decryptSecret('not-a-valid-encoded-value')).toThrow();
  });
});
