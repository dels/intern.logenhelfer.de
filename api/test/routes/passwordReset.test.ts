import { createHash } from 'node:crypto';

import bcrypt from 'bcryptjs';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiErrorHandler } from '../../src/lib/errors.js';
import { appConfig, KNOWN_KEYS } from '../../src/lib/appConfig.js';
import { prisma } from '../../src/db.js';
import { issueRefreshToken, rotateRefreshToken, RefreshTokenInvalidError } from '../../src/auth/refreshToken.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

vi.mock('../../src/lib/mail.js', () => ({ sendMail: vi.fn().mockResolvedValue(undefined) }));
const { sendMail } = await import('../../src/lib/mail.js');
const passwordResetRouter = (await import('../../src/routes/passwordReset.js')).default;

// Covers the forgot/reset password flow: api/src/routes/passwordReset.ts.
// Mirrors session.test.ts's structure (standalone app, no auth middleware -
// both routes are unauthenticated by design).

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1', passwordResetRouter);
  app.use(apiErrorHandler);
  return app;
}

const app = buildApp();

const TEST_BCRYPT_COST = 4;

async function createResettableUser(overrides: Record<string, unknown> = {}) {
  return createUser({
    firstname: 'Appr',
    lastname: 'Entice',
    encrypted_password: bcrypt.hashSync('oldpassword123', TEST_BCRYPT_COST),
    ...overrides,
  });
}

function digest(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

describe('Password reset API', () => {
  beforeEach(async () => {
    await resetDb();
    for (const key of Object.keys(KNOWN_KEYS)) appConfig.dirty(key);
    vi.mocked(sendMail).mockClear();
  });

  describe('POST /api/v1/password/forgot', () => {
    it('returns 200 and emails a reset link for a known email', async () => {
      const user = await createResettableUser();

      const res = await request(app).post('/api/v1/password/forgot').send({ email: user.email });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({});
      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: user.email }));

      const reloaded = await prisma.users.findUniqueOrThrow({ where: { id: user.id } });
      expect(reloaded.reset_password_token).toBeTruthy();
      expect(reloaded.reset_password_token).not.toContain(' '); // stored as a hex digest, not the raw token
      expect(reloaded.reset_password_sent_at).toBeInstanceOf(Date);
    });

    it('returns 200 and notifies the technical contact for an unknown email (toggle on by default)', async () => {
      const res = await request(app).post('/api/v1/password/forgot').send({ email: 'nobody-at-all@example.test' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({});
      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'technik@logenhelfer.de' }));
    });

    it('does not notify the technical contact when the toggle is disabled', async () => {
      await appConfig.set('notify_technical_contact_on_unknown_password_reset', false);

      const res = await request(app).post('/api/v1/password/forgot').send({ email: 'nobody-at-all@example.test' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({});
      expect(sendMail).not.toHaveBeenCalled();
    });

    it('treats a soft-deleted user as unknown (not resettable, technical contact path)', async () => {
      const user = await createResettableUser({ deleted: true });

      const res = await request(app).post('/api/v1/password/forgot').send({ email: user.email });

      expect(res.status).toBe(200);
      expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'technik@logenhelfer.de' }));
      const reloaded = await prisma.users.findUniqueOrThrow({ where: { id: user.id } });
      expect(reloaded.reset_password_token).toBeNull();
    });

    it('treats an OAuth-only user (blank encrypted_password) as unknown', async () => {
      const user = await createResettableUser({ encrypted_password: '' });

      const res = await request(app).post('/api/v1/password/forgot').send({ email: user.email });

      expect(res.status).toBe(200);
      expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'technik@logenhelfer.de' }));
      const reloaded = await prisma.users.findUniqueOrThrow({ where: { id: user.id } });
      expect(reloaded.reset_password_token).toBeNull();
    });

    it('sends from the short lodge name, with a subject naming the long lodge name', async () => {
      const user = await createResettableUser();
      await appConfig.set('lodge', 'Loge Zur Einigkeit');
      await appConfig.set('lodge_short', 'einigkeit');

      const res = await request(app).post('/api/v1/password/forgot').send({ email: user.email });

      expect(res.status).toBe(200);
      const call = vi.mocked(sendMail).mock.calls.find((c) => c[0].to === user.email);
      expect(call?.[0].from).toContain('einigkeit');
      expect(call?.[0].subject).toBe('Passwort zurücksetzen für Loge Zur Einigkeit');
    });

    it('sends an English password reset email when language is configured to "en"', async () => {
      const user = await createResettableUser();
      await appConfig.set('lodge', 'My Lodge');
      await appConfig.set('language', 'en');

      const res = await request(app).post('/api/v1/password/forgot').send({ email: user.email });

      expect(res.status).toBe(200);
      const call = vi.mocked(sendMail).mock.calls.find((c) => c[0].to === user.email);
      expect(call?.[0].subject).toBe('Reset your password for My Lodge');
      expect(call?.[0].text).toContain('Dear Br.');
    });

    it('uses the request Host in the reset link when it matches this environment\'s AppConfig[:domain]', async () => {
      const user = await createResettableUser();
      await appConfig.set('domain', 'next.example.com');

      const res = await request(app)
        .post('/api/v1/password/forgot')
        .set('Host', 'next.example.com')
        .send({ email: user.email });

      expect(res.status).toBe(200);
      const call = vi.mocked(sendMail).mock.calls.find((c) => c[0].to === user.email);
      expect(call?.[0].text).toContain('http://next.example.com/reset-password?token=');
    });

    it('ignores a mismatched/spoofed Host header and falls back to AppConfig[:domain] (prevents password-reset-link poisoning)', async () => {
      const user = await createResettableUser();
      await appConfig.set('domain', 'intern.logenhelfer.de');

      const res = await request(app)
        .post('/api/v1/password/forgot')
        .set('Host', 'evil-attacker.example')
        .send({ email: user.email });

      expect(res.status).toBe(200);
      const call = vi.mocked(sendMail).mock.calls.find((c) => c[0].to === user.email);
      expect(call?.[0].text).toContain('://intern.logenhelfer.de/reset-password?token=');
      expect(call?.[0].text).not.toContain('evil-attacker.example');
    });

    it('returns bad_request when email is missing', async () => {
      const res = await request(app).post('/api/v1/password/forgot').send({});

      expect(res.status).toBe(400);
    });

    it('does not leak whether an email exists: known and unknown addresses get an identical response', async () => {
      const user = await createResettableUser();

      const known = await request(app).post('/api/v1/password/forgot').send({ email: user.email });
      const unknown = await request(app).post('/api/v1/password/forgot').send({ email: 'nobody-at-all@example.test' });

      expect(known.status).toBe(unknown.status);
      expect(known.body).toEqual(unknown.body);
    });
  });

  describe('POST /api/v1/password/reset', () => {
    async function requestReset(email: string): Promise<string> {
      await request(app).post('/api/v1/password/forgot').send({ email });
      const user = await prisma.users.findUniqueOrThrow({ where: { email } });
      const mailCall = vi.mocked(sendMail).mock.calls.find((call) => call[0].to === email);
      const match = /token=([a-f0-9]+)/.exec(mailCall?.[0].text ?? '');
      if (!match) throw new Error('reset link not found in mail body');
      // Sanity: the mailed raw token must map back to the stored digest.
      expect(digest(match[1])).toBe(user.reset_password_token);
      return match[1];
    }

    it('sets the new password, clears the token, and revokes outstanding refresh tokens', async () => {
      const user = await createResettableUser();
      const { rawToken: refreshToken } = await issueRefreshToken(user.id);
      const token = await requestReset(user.email);

      const res = await request(app).post('/api/v1/password/reset').send({
        token,
        new_password: 'newpassword123',
        new_password_confirmation: 'newpassword123',
      });

      expect(res.status).toBe(200);
      const reloaded = await prisma.users.findUniqueOrThrow({ where: { id: user.id } });
      expect(await bcrypt.compare('newpassword123', reloaded.encrypted_password)).toBe(true);
      expect(reloaded.reset_password_token).toBeNull();
      expect(reloaded.reset_password_sent_at).toBeNull();
      await expect(rotateRefreshToken(refreshToken)).rejects.toThrow(RefreshTokenInvalidError);
    });

    it('rejects an already-used token (cannot be replayed)', async () => {
      const user = await createResettableUser();
      const token = await requestReset(user.email);
      await request(app).post('/api/v1/password/reset').send({
        token,
        new_password: 'newpassword123',
        new_password_confirmation: 'newpassword123',
      });

      const res = await request(app).post('/api/v1/password/reset').send({
        token,
        new_password: 'anotherpassword123',
        new_password_confirmation: 'anotherpassword123',
      });

      expect(res.status).toBe(422);
    });

    it('rejects an expired token', async () => {
      const user = await createResettableUser();
      const token = await requestReset(user.email);
      // Backdate reset_password_sent_at past the default 3600s TTL.
      await prisma.users.update({
        where: { id: user.id },
        data: { reset_password_sent_at: new Date(Date.now() - 3601 * 1000) },
      });

      const res = await request(app).post('/api/v1/password/reset').send({
        token,
        new_password: 'newpassword123',
        new_password_confirmation: 'newpassword123',
      });

      expect(res.status).toBe(422);
      expect(res.body).toEqual({ error: 'unprocessable', detail: expect.any(String) });
    });

    it('rejects a garbage/unknown token with the same generic message as an expired one', async () => {
      const user = await createResettableUser();
      const token = await requestReset(user.email);
      await prisma.users.update({
        where: { id: user.id },
        data: { reset_password_sent_at: new Date(Date.now() - 3601 * 1000) },
      });
      const expiredRes = await request(app).post('/api/v1/password/reset').send({
        token,
        new_password: 'newpassword123',
        new_password_confirmation: 'newpassword123',
      });

      const garbageRes = await request(app).post('/api/v1/password/reset').send({
        token: 'not-a-real-token',
        new_password: 'newpassword123',
        new_password_confirmation: 'newpassword123',
      });

      expect(garbageRes.status).toBe(expiredRes.status);
      expect(garbageRes.body).toEqual(expiredRes.body);
    });

    it('rejects a too-short new password', async () => {
      const user = await createResettableUser();
      const token = await requestReset(user.email);

      const res = await request(app).post('/api/v1/password/reset').send({
        token,
        new_password: 'short',
        new_password_confirmation: 'short',
      });

      expect(res.status).toBe(422);
    });

    it('rejects a mismatched confirmation', async () => {
      const user = await createResettableUser();
      const token = await requestReset(user.email);

      const res = await request(app).post('/api/v1/password/reset').send({
        token,
        new_password: 'newpassword123',
        new_password_confirmation: 'different123',
      });

      expect(res.status).toBe(422);
    });

    it('returns bad_request when token is missing', async () => {
      const res = await request(app).post('/api/v1/password/reset').send({
        new_password: 'newpassword123',
        new_password_confirmation: 'newpassword123',
      });

      expect(res.status).toBe(400);
    });
  });
});
