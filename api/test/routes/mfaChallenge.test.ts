import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import { authenticator } from 'otplib';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiErrorHandler } from '../../src/lib/errors.js';
import { issueMfaPendingToken } from '../../src/auth/jwt.js';
import mfaChallengeRouter from '../../src/routes/mfaChallenge.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';
import { encryptSecret } from '../../src/lib/mfaEncryption.js';
import { sendEmailOtp } from '../../src/lib/mfaEmailOtp.js';
import { generateBackupCodes } from '../../src/lib/mfaBackupCodes.js';
import { appConfig, KNOWN_KEYS } from '../../src/lib/appConfig.js';

vi.mock('../../src/lib/mfaPasskeys.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/mfaPasskeys.js')>();
  return { ...actual, verifyAuthentication: vi.fn() };
});
const { verifyAuthentication } = await import('../../src/lib/mfaPasskeys.js');

vi.mock('../../src/lib/mail.js', () => ({ sendMail: vi.fn().mockResolvedValue(undefined) }));
const { sendMail } = await import('../../src/lib/mail.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/v1/mfa/challenge', mfaChallengeRouter);
  app.use(apiErrorHandler);
  return app;
}
const app = buildApp();

describe('MFA challenge', () => {
  beforeEach(async () => {
    await resetDb();
    process.env.MFA_ENCRYPTION_KEY = 'a'.repeat(64);
    for (const key of Object.keys(KNOWN_KEYS)) appConfig.dirty(key);
    vi.mocked(sendMail).mockClear();
  });

  it('lists enrolled methods for a valid pending token', async () => {
    const user = await createUser();
    await prisma.mfa_totp_credentials.create({
      data: { user_id: user.id, encrypted_secret: 'x', verified_at: new Date(), created_at: new Date(), updated_at: new Date() },
    });
    const token = issueMfaPendingToken(user.id);
    const res = await request(app).get('/api/v1/mfa/challenge/methods').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.methods).toEqual(['totp']);
  });

  it('rejects a normal (non-pending) access token', async () => {
    const { issueAccessToken } = await import('../../src/auth/jwt.js');
    const user = await createUser();
    const res = await request(app).get('/api/v1/mfa/challenge/methods').set('Authorization', `Bearer ${issueAccessToken(user.id)}`);
    expect(res.status).toBe(401);
  });

  it('verifies a correct TOTP code and issues full tokens', async () => {
    const user = await createUser();
    const secret = 'JBSWY3DPEHPK3PXP';
    await prisma.mfa_totp_credentials.create({
      data: { user_id: user.id, encrypted_secret: encryptSecret(secret), verified_at: new Date(), created_at: new Date(), updated_at: new Date() },
    });
    const token = issueMfaPendingToken(user.id);
    const res = await request(app)
      .post('/api/v1/mfa/challenge/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'totp', code: authenticator.generate(secret) });
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBeDefined();
  });

  it('rejects with 401 (not a 500) when the stored TOTP secret cannot be decrypted with the current key', async () => {
    const user = await createUser();
    const secret = 'JBSWY3DPEHPK3PXP';
    const encrypted = encryptSecret(secret);
    await prisma.mfa_totp_credentials.create({
      data: { user_id: user.id, encrypted_secret: encrypted, verified_at: new Date(), created_at: new Date(), updated_at: new Date() },
    });
    // Simulates a secret encrypted under a since-rotated/replaced
    // MFA_ENCRYPTION_KEY - decryptSecret throws on auth-tag mismatch, and
    // that throw must not crash the whole login attempt with a 500.
    process.env.MFA_ENCRYPTION_KEY = 'b'.repeat(64);
    const token = issueMfaPendingToken(user.id);
    const res = await request(app)
      .post('/api/v1/mfa/challenge/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'totp', code: authenticator.generate(secret) });
    expect(res.status).toBe(401);
  });

  it('locks out after 5 wrong codes', async () => {
    const user = await createUser();
    await prisma.mfa_totp_credentials.create({
      data: { user_id: user.id, encrypted_secret: encryptSecret('JBSWY3DPEHPK3PXP'), verified_at: new Date(), created_at: new Date(), updated_at: new Date() },
    });
    const token = issueMfaPendingToken(user.id);
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/v1/mfa/challenge/verify').set('Authorization', `Bearer ${token}`).send({ method: 'totp', code: '000000' });
    }
    const res = await request(app)
      .post('/api/v1/mfa/challenge/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'totp', code: '000000' });
    expect(res.status).toBe(401);
  });

  // The route now fires these notifications without awaiting them (fire-and-
  // forget `void sendLogin*Email(...)`, matching session.ts's identical
  // pattern - see loginNotification.ts's own comment) so a slow/failed SMTP
  // send can never reopen a timing side-channel on the MFA-verify response.
  // That means assertions on `sendMail` below must poll via vi.waitFor
  // rather than checking immediately after the request resolves.
  it('does not email on successful TOTP verification when the toggle is off (default)', async () => {
    const user = await createUser();
    const secret = 'JBSWY3DPEHPK3PXP';
    await prisma.mfa_totp_credentials.create({
      data: { user_id: user.id, encrypted_secret: encryptSecret(secret), verified_at: new Date(), created_at: new Date(), updated_at: new Date() },
    });
    const token = issueMfaPendingToken(user.id);
    await request(app)
      .post('/api/v1/mfa/challenge/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'totp', code: authenticator.generate(secret) });
    // This branch DOES fire `void sendLoginSuccessEmail(...)` - it just
    // returns early once isEnabled() resolves false. A vi.waitFor here would
    // pass on its first tick regardless of whether the toggle check actually
    // works (mirrors session.test.ts's identical rationale), so force a real
    // settle first instead.
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('emails the user on successful TOTP verification when the toggle is on', async () => {
    await appConfig.set('notify_user_on_login_activity', true);
    const user = await createUser();
    const secret = 'JBSWY3DPEHPK3PXP';
    await prisma.mfa_totp_credentials.create({
      data: { user_id: user.id, encrypted_secret: encryptSecret(secret), verified_at: new Date(), created_at: new Date(), updated_at: new Date() },
    });
    const token = issueMfaPendingToken(user.id);
    const res = await request(app)
      .post('/api/v1/mfa/challenge/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'totp', code: authenticator.generate(secret) });
    expect(res.status).toBe(200);
    await vi.waitFor(() => {
      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: user.email }));
    });
  });

  it('emails the user on successful email-OTP verification when the toggle is on', async () => {
    await appConfig.set('notify_user_on_login_activity', true);
    const user = await createUser();
    await sendEmailOtp(user.id, user.email, 'login');
    // sendEmailOtp itself sends the OTP-delivery mail through the same
    // mocked sendMail - extract the 6-digit code from it (mirrors
    // mfaEmailOtp.test.ts's own convention), then clear the mock so the
    // toHaveBeenCalledTimes(1) assertion below counts only the login-
    // notification send, not this setup call.
    const sentText = vi.mocked(sendMail).mock.calls[0]![0].text as string;
    const code = /(\d{6})/.exec(sentText)![1]!;
    vi.mocked(sendMail).mockClear();

    const token = issueMfaPendingToken(user.id);
    const res = await request(app)
      .post('/api/v1/mfa/challenge/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'email', code });
    expect(res.status).toBe(200);
    await vi.waitFor(() => {
      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: user.email }));
    });
  });

  it('emails the user on successful backup-code verification when the toggle is on', async () => {
    await appConfig.set('notify_user_on_login_activity', true);
    const user = await createUser();
    const [code] = await generateBackupCodes(user.id);
    const token = issueMfaPendingToken(user.id);
    const res = await request(app)
      .post('/api/v1/mfa/challenge/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'backup_code', code });
    expect(res.status).toBe(200);
    await vi.waitFor(() => {
      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: user.email }));
    });
  });

  it('emails a lockout notification on the 5th consecutive wrong TOTP code, not before', async () => {
    await appConfig.set('notify_user_on_login_activity', true);
    const user = await createUser();
    await prisma.mfa_totp_credentials.create({
      data: { user_id: user.id, encrypted_secret: encryptSecret('JBSWY3DPEHPK3PXP'), verified_at: new Date(), created_at: new Date(), updated_at: new Date() },
    });
    const token = issueMfaPendingToken(user.id);
    for (let i = 0; i < 4; i++) {
      await request(app).post('/api/v1/mfa/challenge/verify').set('Authorization', `Bearer ${token}`).send({ method: 'totp', code: '000000' });
    }
    // Unlike the toggle-off case above, sendLoginLockoutEmail is only
    // invoked at all once `lockedOut` is true - for these first 4 failures
    // it's never called, so no async operation is even scheduled and this
    // assertion is deterministic without a wait.
    expect(sendMail).not.toHaveBeenCalled();
    await request(app).post('/api/v1/mfa/challenge/verify').set('Authorization', `Bearer ${token}`).send({ method: 'totp', code: '000000' });
    await vi.waitFor(() => {
      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: user.email }));
    });
  });

  describe('passkey as a second factor', () => {
    async function enrollPasskey(userId: number, credentialId: string) {
      await prisma.mfa_passkey_credentials.create({
        data: {
          user_id: userId,
          credential_id: credentialId,
          public_key: Buffer.from('fake-public-key-bytes').toString('base64url'),
          sign_count: 0,
          name: 'Test passkey',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    it('today returns 401 for method=passkey with a typed code - reproduces the reported bug', async () => {
      const user = await createUser();
      await enrollPasskey(user.id, 'repro-credential');
      const token = issueMfaPendingToken(user.id);
      const res = await request(app)
        .post('/api/v1/mfa/challenge/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ method: 'passkey', code: 'not-a-real-code' });
      expect(res.status).toBe(401);
    });

    it("mints WebAuthn options scoped to only the pending user's own credentials", async () => {
      const user = await createUser();
      const otherUser = await createUser({ email: 'other@example.test' });
      await enrollPasskey(user.id, 'my-credential');
      await enrollPasskey(otherUser.id, 'someone-elses-credential');
      const token = issueMfaPendingToken(user.id);

      const res = await request(app).post('/api/v1/mfa/challenge/passkey/options').set('Authorization', `Bearer ${token}`).send({});

      expect(res.status).toBe(200);
      // .map to id only - the real buildAuthenticationOptions (reused as-is,
      // not reinvented) also sets `type: 'public-key'` on each entry, which
      // isn't the property under test here; matches mfa.test.ts's identical
      // allowCredentials-scoping assertion precedent.
      expect(res.body.allowCredentials.map((c: { id: string }) => c.id)).toEqual(['my-credential']);
    });

    it('404s when the pending user has no enrolled passkey', async () => {
      const user = await createUser();
      await prisma.mfa_totp_credentials.create({
        data: { user_id: user.id, encrypted_secret: 'x', verified_at: new Date(), created_at: new Date(), updated_at: new Date() },
      });
      const token = issueMfaPendingToken(user.id);
      const res = await request(app).post('/api/v1/mfa/challenge/passkey/options').set('Authorization', `Bearer ${token}`).send({});
      expect(res.status).toBe(404);
    });

    it('verifies a correct passkey assertion and issues a full session', async () => {
      const user = await createUser();
      await enrollPasskey(user.id, 'real-credential');
      const token = issueMfaPendingToken(user.id);

      const optionsRes = await request(app).post('/api/v1/mfa/challenge/passkey/options').set('Authorization', `Bearer ${token}`).send({});
      const challenge: string = optionsRes.body.challenge;

      vi.mocked(verifyAuthentication).mockResolvedValueOnce({
        verified: true,
        authenticationInfo: { newCounter: 1 },
      } as unknown as Awaited<ReturnType<typeof verifyAuthentication>>);
      const clientDataJSON = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge })).toString('base64');

      const res = await request(app)
        .post('/api/v1/mfa/challenge/passkey/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ response: { id: 'real-credential', response: { clientDataJSON } } });

      expect(res.status).toBe(200);
      expect(res.body.access_token).toBeDefined();
    });

    it('rejects a passkey belonging to a different account (cross-account confusion)', async () => {
      const pendingUser = await createUser();
      const credentialOwner = await createUser({ email: 'owner@example.test' });
      await enrollPasskey(credentialOwner.id, 'someone-elses-credential');
      // The pending user has no passkey of their own, but must still be able
      // to request options (e.g. they have another method enrolled too) -
      // this test drives the attack path where a forged/replayed assertion
      // for a REAL, valid, but WRONG-OWNER credential is submitted directly,
      // bypassing allowCredentials entirely (a malicious client can send any
      // credential id regardless of what the options response offered).
      const token = issueMfaPendingToken(pendingUser.id);

      vi.mocked(verifyAuthentication).mockResolvedValueOnce({
        verified: true,
        authenticationInfo: { newCounter: 1 },
      } as unknown as Awaited<ReturnType<typeof verifyAuthentication>>);
      const clientDataJSON = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge: 'any-challenge' })).toString('base64');

      const res = await request(app)
        .post('/api/v1/mfa/challenge/passkey/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ response: { id: 'someone-elses-credential', response: { clientDataJSON } } });

      expect(res.status).toBe(401);
      const stillPending = await prisma.refresh_tokens.count({ where: { user_id: pendingUser.id } });
      expect(stillPending).toBe(0);
    });

    it('locks out after 5 failed passkey verification attempts', async () => {
      const user = await createUser();
      await enrollPasskey(user.id, 'lockout-credential');
      const token = issueMfaPendingToken(user.id);
      for (let i = 0; i < 5; i++) {
        const optionsRes = await request(app).post('/api/v1/mfa/challenge/passkey/options').set('Authorization', `Bearer ${token}`).send({});
        const challenge: string = optionsRes.body.challenge;
        const clientDataJSON = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge })).toString('base64');
        vi.mocked(verifyAuthentication).mockResolvedValueOnce({ verified: false } as unknown as Awaited<ReturnType<typeof verifyAuthentication>>);
        await request(app)
          .post('/api/v1/mfa/challenge/passkey/verify')
          .set('Authorization', `Bearer ${token}`)
          .send({ response: { id: 'lockout-credential', response: { clientDataJSON } } });
      }

      const optionsRes = await request(app).post('/api/v1/mfa/challenge/passkey/options').set('Authorization', `Bearer ${token}`).send({});
      const challenge: string = optionsRes.body.challenge;
      const clientDataJSON = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge })).toString('base64');
      const res = await request(app)
        .post('/api/v1/mfa/challenge/passkey/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ response: { id: 'lockout-credential', response: { clientDataJSON } } });
      expect(res.status).toBe(401);
    });
  });
});
