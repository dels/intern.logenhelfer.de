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
import { appConfig, KNOWN_KEYS } from '../../src/lib/appConfig.js';

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
});
