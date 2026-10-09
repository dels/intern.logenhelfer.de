import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import { authenticator } from 'otplib';
import { rateLimit } from 'express-rate-limit';
import type { NextFunction, Request, Response } from 'express';
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
import { recordFailedMfaAttempt } from '../../src/auth/mfaLockout.js';
import { appConfig, KNOWN_KEYS } from '../../src/lib/appConfig.js';

vi.mock('../../src/lib/mfaPasskeys.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/mfaPasskeys.js')>();
  return { ...actual, verifyAuthentication: vi.fn() };
});
const { verifyAuthentication } = await import('../../src/lib/mfaPasskeys.js');

vi.mock('../../src/lib/mail.js', () => ({ sendMail: vi.fn().mockResolvedValue(undefined) }));
const { sendMail } = await import('../../src/lib/mail.js');

// rateLimit.ts's createRateLimiter unconditionally no-ops (MAX_SAFE_INTEGER)
// under NODE_ENV=test (see that file's own doc comment) - necessary so the
// rest of this suite, and every other suite that logs in repeatedly, doesn't
// flake against a real per-IP throttle. That means loginRateLimiter itself
// can never be observed actually triggering via a normal import. To prove
// Finding 4's `/email/send` route really has it wired in (not just that the
// route still works), this mock swaps in a delegating middleware whose
// target a single test can redirect to a real, tightly-limited rateLimit()
// instance - every other test leaves `rateLimiterHolder.active` at its
// default passthrough, so this has zero effect on the rest of the suite.
const rateLimiterHolder = vi.hoisted(() => ({
  active: (_req: unknown, _res: unknown, next: () => void) => next(),
}));
vi.mock('../../src/middleware/rateLimit.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/middleware/rateLimit.js')>();
  return {
    ...actual,
    loginRateLimiter: (req: Request, res: Response, next: NextFunction) => rateLimiterHolder.active(req, res, next),
  };
});

function buildApp() {
  const app = express();
  // Required for the sign-in-tracking tests below to see a forwarded IP via
  // X-Forwarded-For instead of the loopback socket address - matches
  // session.test.ts's identical standalone-app setup.
  app.set('trust proxy', 1);
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
    // A test's own queued vi.mocked(verifyAuthentication).mockResolvedValueOnce(...)
    // must never leak into a later test's mock queue - mockReset (not just
    // mockClear) also drops any queued one-time implementations, not just
    // call-history, since a leftover `verified: true` consumed by surprise in
    // an unrelated test would make a security-relevant attempt silently
    // succeed instead of failing the way that test expects.
    vi.mocked(verifyAuthentication).mockReset();
    rateLimiterHolder.active = (_req, _res, next) => next();
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
      await enrollPasskey(pendingUser.id, 'pending-users-own-credential');
      await enrollPasskey(credentialOwner.id, 'someone-elses-credential');
      const token = issueMfaPendingToken(pendingUser.id);

      // Drive a real options call for the pending user so a real,
      // server-side-stored challenge exists - otherwise the route's
      // `if (challenge && response?.id)` guard would short-circuit before
      // ever reaching the user_id check, and this test would only prove
      // "missing challenge -> 401" (already covered elsewhere), not the
      // cross-account property it's named for.
      const optionsRes = await request(app).post('/api/v1/mfa/challenge/passkey/options').set('Authorization', `Bearer ${token}`).send({});
      const challenge: string = optionsRes.body.challenge;

      vi.mocked(verifyAuthentication).mockResolvedValueOnce({
        verified: true,
        authenticationInfo: { newCounter: 1 },
      } as unknown as Awaited<ReturnType<typeof verifyAuthentication>>);
      const clientDataJSON = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge })).toString('base64');

      // Clear right before the request under test so the assertion below
      // only reflects this call, not the (never-reached) mock queued above.
      vi.mocked(verifyAuthentication).mockClear();

      // This drives the attack path where a forged/replayed assertion for a
      // REAL, valid, but WRONG-OWNER credential is submitted directly,
      // bypassing allowCredentials entirely (a malicious client can send any
      // credential id regardless of what the options response offered).
      const res = await request(app)
        .post('/api/v1/mfa/challenge/passkey/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ response: { id: 'someone-elses-credential', response: { clientDataJSON } } });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'unauthorized' });
      const stillPending = await prisma.refresh_tokens.count({ where: { user_id: pendingUser.id } });
      expect(stillPending).toBe(0);
      // Proves the route rejects based on the user_id mismatch BEFORE ever
      // attempting cryptographic verification, matching production code's
      // actual check order (stored.user_id === user.id gates entry into the
      // verifyAuthentication call entirely).
      expect(vi.mocked(verifyAuthentication)).not.toHaveBeenCalled();
    });

    it('locks out after 5 failed passkey verification attempts', async () => {
      const user = await createUser();
      await enrollPasskey(user.id, 'lockout-credential');
      const token = issueMfaPendingToken(user.id);
      for (let i = 0; i < 5; i++) {
        const optionsRes = await request(app).post('/api/v1/mfa/challenge/passkey/options').set('Authorization', `Bearer ${token}`).send({});
        const challenge: string = optionsRes.body.challenge;
        const clientDataJSON = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge })).toString('base64');
        // Explicit, intentional per-attempt mock - each of the 5 failed
        // attempts must genuinely fail verification, not merely exhaust an
        // unrelated mock and fall through to an unmocked vi.fn() returning
        // undefined (which, pre-Finding-1-fix, would throw inside the
        // route's verifyAuthentication call entirely uncaught).
        vi.mocked(verifyAuthentication).mockResolvedValueOnce({ verified: false } as unknown as Awaited<ReturnType<typeof verifyAuthentication>>);
        await request(app)
          .post('/api/v1/mfa/challenge/passkey/verify')
          .set('Authorization', `Bearer ${token}`)
          .send({ response: { id: 'lockout-credential', response: { clientDataJSON } } });
      }

      const optionsRes = await request(app).post('/api/v1/mfa/challenge/passkey/options').set('Authorization', `Bearer ${token}`).send({});
      const challenge: string = optionsRes.body.challenge;
      const clientDataJSON = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge })).toString('base64');
      // Clear right before the 6th (locked-out) request so the assertion
      // below proves verifyAuthentication is never reached - though since
      // final-review Finding 4 added a lockout check to /passkey/options
      // itself, the 6th options call above now ALSO 401s once locked out, so
      // `challenge` here is undefined too; "verifyAuthentication not called"
      // is therefore satisfied by either /passkey/verify's own lockout check
      // OR the plain missing-challenge guard. The dedicated
      // "still enforces lockout on /passkey/verify even with a real, valid
      // challenge already minted" test (email-OTP hardening describe block)
      // isolates /passkey/verify's own check specifically - this test alone
      // no longer proves that check exists.
      vi.mocked(verifyAuthentication).mockClear();
      const res = await request(app)
        .post('/api/v1/mfa/challenge/passkey/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ response: { id: 'lockout-credential', response: { clientDataJSON } } });
      expect(res.status).toBe(401);
      expect(vi.mocked(verifyAuthentication)).not.toHaveBeenCalled();
    });

    it('returns 401 (not 500) and counts toward lockout when verifyAuthentication throws instead of resolving verified:false', async () => {
      // @simplewebauthn/server's verifyAuthenticationResponse THROWS for most
      // failure modes (challenge/origin mismatch, missing user verification,
      // counter regression, malformed clientDataJSON/authenticatorData)
      // rather than resolving { verified: false } - only an outright bad
      // signature takes the resolve-false path. Before Finding 1's fix, this
      // throw escaped to the outer catch's next(err), producing a generic
      // 500 (via apiErrorHandler) instead of the identical 401 every other
      // failure mode on this route returns, and skipped
      // recordFailedMfaAttempt entirely.
      const user = await createUser();
      await enrollPasskey(user.id, 'throwing-credential');
      const token = issueMfaPendingToken(user.id);

      const optionsRes = await request(app).post('/api/v1/mfa/challenge/passkey/options').set('Authorization', `Bearer ${token}`).send({});
      const challenge: string = optionsRes.body.challenge;
      const clientDataJSON = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge })).toString('base64');

      vi.mocked(verifyAuthentication).mockRejectedValueOnce(new Error('Unexpected authentication response challenge'));

      const res = await request(app)
        .post('/api/v1/mfa/challenge/passkey/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ response: { id: 'throwing-credential', response: { clientDataJSON } } });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'unauthorized' });

      // Prove this failed attempt counted toward lockout - 4 more identical
      // throwing attempts should bring the total to 5, locking the account
      // out on the 6th attempt entirely (verifyAuthentication never even
      // called once locked out).
      for (let i = 0; i < 4; i++) {
        const nextOptionsRes = await request(app).post('/api/v1/mfa/challenge/passkey/options').set('Authorization', `Bearer ${token}`).send({});
        const nextChallenge: string = nextOptionsRes.body.challenge;
        const nextClientDataJSON = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge: nextChallenge })).toString('base64');
        vi.mocked(verifyAuthentication).mockRejectedValueOnce(new Error('Unexpected authentication response challenge'));
        await request(app)
          .post('/api/v1/mfa/challenge/passkey/verify')
          .set('Authorization', `Bearer ${token}`)
          .send({ response: { id: 'throwing-credential', response: { clientDataJSON: nextClientDataJSON } } });
      }

      // Same caveat as the preceding test: /passkey/options' own Finding-4
      // lockout check means `finalChallenge` below is undefined too once
      // locked out, so this probe no longer isolates /passkey/verify's own
      // lockout check in particular - see that test's comment and the
      // dedicated guard test for that.
      const finalOptionsRes = await request(app).post('/api/v1/mfa/challenge/passkey/options').set('Authorization', `Bearer ${token}`).send({});
      const finalChallenge: string = finalOptionsRes.body.challenge;
      const finalClientDataJSON = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge: finalChallenge })).toString('base64');
      vi.mocked(verifyAuthentication).mockClear();
      const lockedOutRes = await request(app)
        .post('/api/v1/mfa/challenge/passkey/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ response: { id: 'throwing-credential', response: { clientDataJSON: finalClientDataJSON } } });
      expect(lockedOutRes.status).toBe(401);
      expect(lockedOutRes.body).toEqual({ error: 'unauthorized' });
      expect(vi.mocked(verifyAuthentication)).not.toHaveBeenCalled();
    });
  });

  describe('email as a second factor', () => {
    // Deviation from the brief: the brief's own first test here asserted a
    // 404 "reproduces the reported gap" - but that 404 only held because no
    // route existed yet at all, and is the exact scenario (a verified email
    // credential) the route's happy path must turn into a 204 once
    // implemented. Keeping it as written would make it permanently
    // contradict the second test below (identical setup, opposite
    // assertion) and the brief's own Step 4 ("run tests, expect PASS").
    // Repurposed instead to cover the one branch nothing else exercises:
    // an email credential that exists but was never verified (mid-setup,
    // never confirmed) must not count as a usable second factor - mirrors
    // this file's existing TOTP precedent for the identical
    // `verified_at !== null` gate.
    it('404s when the pending user has an email credential that was never verified', async () => {
      const user = await createUser();
      await prisma.mfa_email_credentials.create({
        data: { user_id: user.id, verified_at: null, created_at: new Date(), updated_at: new Date() },
      });
      const token = issueMfaPendingToken(user.id);

      const res = await request(app).post('/api/v1/mfa/challenge/email/send').set('Authorization', `Bearer ${token}`).send({});
      expect(res.status).toBe(404);
      expect(sendMail).not.toHaveBeenCalled();
    });

    it('sends a login-purpose code that the existing /verify endpoint accepts', async () => {
      const user = await createUser();
      await prisma.mfa_email_credentials.create({
        data: { user_id: user.id, verified_at: new Date(), created_at: new Date(), updated_at: new Date() },
      });
      const token = issueMfaPendingToken(user.id);

      const sendRes = await request(app).post('/api/v1/mfa/challenge/email/send').set('Authorization', `Bearer ${token}`).send({});
      expect(sendRes.status).toBe(204);

      await vi.waitFor(() => expect(sendMail).toHaveBeenCalledTimes(1));
      const sentText = vi.mocked(sendMail).mock.calls[0]![0].text as string;
      const code = /(\d{6})/.exec(sentText)![1]!;

      const verifyRes = await request(app)
        .post('/api/v1/mfa/challenge/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ method: 'email', code });
      expect(verifyRes.status).toBe(200);
    });

    it('404s when the pending user has no verified email method', async () => {
      const user = await createUser();
      await prisma.mfa_totp_credentials.create({
        data: { user_id: user.id, encrypted_secret: 'x', verified_at: new Date(), created_at: new Date(), updated_at: new Date() },
      });
      const token = issueMfaPendingToken(user.id);
      const res = await request(app).post('/api/v1/mfa/challenge/email/send').set('Authorization', `Bearer ${token}`).send({});
      expect(res.status).toBe(404);
    });
  });

  // Final-review Finding 1: Task 1 fixed recordSuccessfulSignIn being called
  // too early (before MFA completed); Task 2 then added the ONLY two call
  // sites that fire it on a completed MFA challenge (this route's /verify
  // and /passkey/verify success paths). Nothing asserted on this before -
  // deleting either call would silently re-freeze these statistics fields
  // with the whole suite still green.
  describe('sign-in tracking on a completed MFA challenge (final-review Finding 1)', () => {
    it('records sign_in_count/current_sign_in_at/current_sign_in_ip on a successful TOTP verification', async () => {
      const user = await createUser();
      const secret = 'JBSWY3DPEHPK3PXP';
      await prisma.mfa_totp_credentials.create({
        data: { user_id: user.id, encrypted_secret: encryptSecret(secret), verified_at: new Date(), created_at: new Date(), updated_at: new Date() },
      });
      const token = issueMfaPendingToken(user.id);
      const res = await request(app)
        .post('/api/v1/mfa/challenge/verify')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Forwarded-For', '203.0.113.9')
        .send({ method: 'totp', code: authenticator.generate(secret) });
      expect(res.status).toBe(200);
      const updated = await prisma.users.findUniqueOrThrow({ where: { id: user.id } });
      expect(updated.sign_in_count).toBe(1);
      expect(updated.current_sign_in_at).not.toBeNull();
      expect(updated.current_sign_in_ip).toBe('203.0.113.9');
    });

    it('records sign_in_count/current_sign_in_at/current_sign_in_ip on a successful passkey verification', async () => {
      const user = await createUser();
      await prisma.mfa_passkey_credentials.create({
        data: {
          user_id: user.id,
          credential_id: 'tracking-credential',
          public_key: Buffer.from('fake-public-key-bytes').toString('base64url'),
          sign_count: 0,
          name: 'Test passkey',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
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
        .set('X-Forwarded-For', '203.0.113.9')
        .send({ response: { id: 'tracking-credential', response: { clientDataJSON } } });

      expect(res.status).toBe(200);
      const updated = await prisma.users.findUniqueOrThrow({ where: { id: user.id } });
      expect(updated.sign_in_count).toBe(1);
      expect(updated.current_sign_in_at).not.toBeNull();
      expect(updated.current_sign_in_ip).toBe('203.0.113.9');
    });

    it('leaves sign-in tracking fields untouched on a FAILED TOTP verification (proves the call only fires on success)', async () => {
      const user = await createUser();
      await prisma.mfa_totp_credentials.create({
        data: { user_id: user.id, encrypted_secret: encryptSecret('JBSWY3DPEHPK3PXP'), verified_at: new Date(), created_at: new Date(), updated_at: new Date() },
      });
      const token = issueMfaPendingToken(user.id);
      const res = await request(app)
        .post('/api/v1/mfa/challenge/verify')
        .set('Authorization', `Bearer ${token}`)
        .set('X-Forwarded-For', '203.0.113.9')
        .send({ method: 'totp', code: '000000' });
      expect(res.status).toBe(401);
      const unchanged = await prisma.users.findUniqueOrThrow({ where: { id: user.id } });
      expect(unchanged.sign_in_count).toBe(0);
      expect(unchanged.current_sign_in_at).toBeNull();
      expect(unchanged.current_sign_in_ip).toBeNull();
    });
  });

  // Final-review Finding 3: openapi.yaml only declares `response: { type:
  // object }` on /passkey/verify's request body - no constraint on
  // response.id's type - so a malformed `{ id: 123 }` passes contract
  // validation and used to reach the credential_id Prisma lookup as a
  // non-string, throwing a Prisma validation error OUTSIDE the inner
  // try/catch (which only wraps verifyAuthentication) and escaping to the
  // outer catch's next(err) - a 500, breaking this route's documented
  // "every failure mode returns the identical 401" contract.
  describe('malformed passkey response.id (final-review Finding 3)', () => {
    it('returns 401 (not 500) when response.id is not a string', async () => {
      const user = await createUser();
      await prisma.mfa_passkey_credentials.create({
        data: {
          user_id: user.id,
          credential_id: 'malformed-id-credential',
          public_key: Buffer.from('fake-public-key-bytes').toString('base64url'),
          sign_count: 0,
          name: 'Test passkey',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      const token = issueMfaPendingToken(user.id);
      // Mint a real challenge first - without one, the `challenge &&
      // typeof response?.id === 'string'` guard would short-circuit on the
      // missing-challenge half alone, and this test wouldn't actually prove
      // the type-guard half does anything.
      await request(app).post('/api/v1/mfa/challenge/passkey/options').set('Authorization', `Bearer ${token}`).send({});

      const res = await request(app)
        .post('/api/v1/mfa/challenge/passkey/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ response: { id: 123, response: { clientDataJSON: 'irrelevant' } } });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'unauthorized' });
    });
  });

  // Final-review Finding 4 (user-approved security hardening): a holder of a
  // valid pending token (i.e. someone who already has the account's
  // password) used to be able to stack unlimited valid login-purpose email
  // codes by calling /email/send repeatedly, each independently guessable
  // via /verify; /email/send and /passkey/options also used to skip the
  // lockout check that /verify and /passkey/verify already had.
  describe('email-OTP hardening (final-review Finding 4)', () => {
    it('invalidates a prior outstanding login code when a new one is sent - only the newest code verifies', async () => {
      const user = await createUser();
      await prisma.mfa_email_credentials.create({
        data: { user_id: user.id, verified_at: new Date(), created_at: new Date(), updated_at: new Date() },
      });
      const token = issueMfaPendingToken(user.id);

      await request(app).post('/api/v1/mfa/challenge/email/send').set('Authorization', `Bearer ${token}`).send({});
      await vi.waitFor(() => expect(sendMail).toHaveBeenCalledTimes(1));
      const firstCode = /(\d{6})/.exec(vi.mocked(sendMail).mock.calls[0]![0].text as string)![1]!;

      await request(app).post('/api/v1/mfa/challenge/email/send').set('Authorization', `Bearer ${token}`).send({});
      await vi.waitFor(() => expect(sendMail).toHaveBeenCalledTimes(2));
      const secondCode = /(\d{6})/.exec(vi.mocked(sendMail).mock.calls[1]![0].text as string)![1]!;

      const firstAttempt = await request(app)
        .post('/api/v1/mfa/challenge/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ method: 'email', code: firstCode });
      expect(firstAttempt.status).toBe(401);

      const secondAttempt = await request(app)
        .post('/api/v1/mfa/challenge/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ method: 'email', code: secondCode });
      expect(secondAttempt.status).toBe(200);
    });

    it('returns 401 from /email/send when the account is already MFA-locked-out, and sends no mail', async () => {
      const user = await createUser();
      await prisma.mfa_email_credentials.create({
        data: { user_id: user.id, verified_at: new Date(), created_at: new Date(), updated_at: new Date() },
      });
      const token = issueMfaPendingToken(user.id);
      for (let i = 0; i < 5; i++) await recordFailedMfaAttempt(`mfa:${user.email}`);

      const res = await request(app).post('/api/v1/mfa/challenge/email/send').set('Authorization', `Bearer ${token}`).send({});
      expect(res.status).toBe(401);
      expect(sendMail).not.toHaveBeenCalled();
    });

    it('returns 401 from /passkey/options when the account is already MFA-locked-out', async () => {
      const user = await createUser();
      await prisma.mfa_passkey_credentials.create({
        data: {
          user_id: user.id,
          credential_id: 'locked-out-options-credential',
          public_key: Buffer.from('fake-public-key-bytes').toString('base64url'),
          sign_count: 0,
          name: 'Test passkey',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      const token = issueMfaPendingToken(user.id);
      for (let i = 0; i < 5; i++) await recordFailedMfaAttempt(`mfa:${user.email}`);

      const res = await request(app).post('/api/v1/mfa/challenge/passkey/options').set('Authorization', `Bearer ${token}`).send({});
      expect(res.status).toBe(401);
    });

    // Dedicated guard for /passkey/verify's OWN lockout check, independent of
    // /passkey/options' new one above. Without this, the two pre-existing
    // "locks out after 5 failed..." tests in the "passkey as a second
    // factor" describe block above would stay green even if /passkey/verify's
    // own isMfaLockedOut check were deleted entirely - once /passkey/options
    // itself started returning 401 while locked out, those tests' 6th-attempt
    // probe never gets a real challenge, so `verifyAuthentication` already
    // goes uncalled for the unrelated reason "no challenge in the map",
    // regardless of whether /passkey/verify's own lockout check still exists.
    // Minting the challenge BEFORE locking out (unlike those two tests) keeps
    // a real, valid challenge in the map, so this test isolates /passkey/
    // verify's own check specifically.
    it('still enforces lockout on /passkey/verify even with a real, valid challenge already minted', async () => {
      const user = await createUser();
      await prisma.mfa_passkey_credentials.create({
        data: {
          user_id: user.id,
          credential_id: 'verify-lockout-guard-credential',
          public_key: Buffer.from('fake-public-key-bytes').toString('base64url'),
          sign_count: 0,
          name: 'Test passkey',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      const token = issueMfaPendingToken(user.id);

      const optionsRes = await request(app).post('/api/v1/mfa/challenge/passkey/options').set('Authorization', `Bearer ${token}`).send({});
      const challenge: string = optionsRes.body.challenge;
      const clientDataJSON = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge })).toString('base64');

      for (let i = 0; i < 5; i++) await recordFailedMfaAttempt(`mfa:${user.email}`);

      vi.mocked(verifyAuthentication).mockResolvedValueOnce({
        verified: true,
        authenticationInfo: { newCounter: 1 },
      } as unknown as Awaited<ReturnType<typeof verifyAuthentication>>);

      const res = await request(app)
        .post('/api/v1/mfa/challenge/passkey/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ response: { id: 'verify-lockout-guard-credential', response: { clientDataJSON } } });

      expect(res.status).toBe(401);
      expect(vi.mocked(verifyAuthentication)).not.toHaveBeenCalled();
    });

    // loginRateLimiter is no-op'd under NODE_ENV=test (see rateLimit.ts's own
    // doc comment) so the rest of this suite - and every other suite logging
    // in repeatedly - doesn't flake against a real per-IP throttle. The
    // module mock at the top of this file swaps in a delegating middleware so
    // this one test can redirect it to a real, tightly-limited rateLimit()
    // instance without affecting any other test (which all leave
    // rateLimiterHolder.active at its default passthrough).
    it('rate-limits POST /email/send via loginRateLimiter, scoped to only that route', async () => {
      const user = await createUser();
      await prisma.mfa_email_credentials.create({
        data: { user_id: user.id, verified_at: new Date(), created_at: new Date(), updated_at: new Date() },
      });
      const token = issueMfaPendingToken(user.id);

      rateLimiterHolder.active = rateLimit({
        windowMs: 60_000,
        limit: 2,
        standardHeaders: true,
        legacyHeaders: false,
        validate: false,
        handler: (_req, res) => res.status(429).json({ error: 'too_many_requests' }),
      });

      const first = await request(app).post('/api/v1/mfa/challenge/email/send').set('Authorization', `Bearer ${token}`).send({});
      const second = await request(app).post('/api/v1/mfa/challenge/email/send').set('Authorization', `Bearer ${token}`).send({});
      const third = await request(app).post('/api/v1/mfa/challenge/email/send').set('Authorization', `Bearer ${token}`).send({});
      expect(first.status).toBe(204);
      expect(second.status).toBe(204);
      expect(third.status).toBe(429);

      // Scoped to only this route - /verify and /passkey/options share no
      // middleware with it, so neither should ever see a 429 from this limiter.
      for (let i = 0; i < 3; i++) {
        const res = await request(app)
          .post('/api/v1/mfa/challenge/verify')
          .set('Authorization', `Bearer ${token}`)
          .send({ method: 'totp', code: '000000' });
        expect(res.status).not.toBe(429);
      }
      for (let i = 0; i < 3; i++) {
        const res = await request(app).post('/api/v1/mfa/challenge/passkey/options').set('Authorization', `Bearer ${token}`).send({});
        expect(res.status).not.toBe(429);
      }
    });
  });
});
