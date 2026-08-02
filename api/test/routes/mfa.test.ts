import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authenticator } from 'otplib';

import { apiErrorHandler } from '../../src/lib/errors.js';
import { authenticateApiUser } from '../../src/auth/middleware.js';
import { issueAccessToken } from '../../src/auth/jwt.js';
import mfaRouter from '../../src/routes/mfa.js';
import meRouter from '../../src/routes/me.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';
import { decryptSecret, encryptSecret } from '../../src/lib/mfaEncryption.js';
import { appConfig, KNOWN_KEYS } from '../../src/lib/appConfig.js';
import * as mail from '../../src/lib/mail.js';

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(authenticateApiUser);
  app.use('/api/v1/mfa', mfaRouter);
  app.use(apiErrorHandler);
  return app;
}

const app = buildApp();

describe('POST /api/v1/mfa/setup/start + /setup/totp/verify', () => {
  beforeEach(async () => {
    await resetDb();
    process.env.MFA_ENCRYPTION_KEY = 'a'.repeat(64);
  });

  it('issues a TOTP secret and only verifies with a correct code', async () => {
    const user = await createUser();
    const token = issueAccessToken(user.id);

    const startRes = await request(app)
      .post('/api/v1/mfa/setup/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'totp' });
    expect(startRes.status).toBe(200);
    expect(startRes.body.otpauth_uri).toMatch(/^otpauth:\/\/totp\//);
    expect(startRes.body.qr_code_data_url).toMatch(/^data:image\/png/);

    const row = await prisma.mfa_totp_credentials.findUniqueOrThrow({ where: { user_id: user.id } });
    expect(row.verified_at).toBeNull();
    const secret = decryptSecret(row.encrypted_secret);

    const badVerify = await request(app)
      .post('/api/v1/mfa/setup/totp/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000' });
    expect(badVerify.status).toBe(422);

    const goodVerify = await request(app)
      .post('/api/v1/mfa/setup/totp/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: authenticator.generate(secret) });
    expect(goodVerify.status).toBe(200);
    expect(goodVerify.body.backup_codes).toHaveLength(10);

    const verified = await prisma.mfa_totp_credentials.findUniqueOrThrow({ where: { user_id: user.id } });
    expect(verified.verified_at).not.toBeNull();
  });

  it('requires authentication', async () => {
    const res = await request(app).post('/api/v1/mfa/setup/start').send({ method: 'totp' });
    expect(res.status).toBe(401);
  });

  it('rejects an unknown method', async () => {
    const user = await createUser();
    const token = issueAccessToken(user.id);
    const res = await request(app).post('/api/v1/mfa/setup/start').set('Authorization', `Bearer ${token}`).send({ method: 'sms' });
    expect(res.status).toBe(400);
  });
});

describe('impersonation guard - router-wide', () => {
  beforeEach(async () => {
    await resetDb();
    process.env.MFA_ENCRYPTION_KEY = 'a'.repeat(64);
  });

  // Security regression test: mfa.ts had no impersonation guard at all - an
  // impersonating admin could call /mfa/setup/start against a zero-method
  // target (no existing-method proof required in that case) and complete the
  // WebAuthn ceremony with their OWN authenticator, silently planting a
  // passkey the admin controls on the victim's account with no
  // mfa_reset_events-style audit trail. Matches the identical guard already
  // applied to me.ts's consent-mutation handlers and members.ts's own
  // /mfa/reset route.
  it('rejects every /mfa/setup/* route outright while impersonating, even for a zero-method target', async () => {
    const admin = await createUser({ email: `impersonating-admin-${Date.now()}@example.org` });
    const target = await createUser();
    const impersonationToken = issueAccessToken(target.id, admin.id);

    const res = await request(app)
      .post('/api/v1/mfa/setup/start')
      .set('Authorization', `Bearer ${impersonationToken}`)
      .send({ method: 'passkey' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('forbidden_while_impersonating');

    // No credential/secret must have been created for the target either.
    expect(await prisma.mfa_passkey_credentials.count({ where: { user_id: target.id } })).toBe(0);
  });

  // The fix is a router.use(...) applied before every route in this file, not
  // a per-route check - this spot-checks two other routes (one mutating, one
  // read-only) to prove the guard really is router-wide and not just wired
  // into /setup/start.
  it('rejects backup-codes/regenerate and GET /status while impersonating too', async () => {
    const admin = await createUser({ email: `impersonating-admin-2-${Date.now()}@example.org` });
    const target = await createUser();
    await createTotpCredential(target.id, authenticator.generateSecret(), true);
    const impersonationToken = issueAccessToken(target.id, admin.id);

    const regenRes = await request(app)
      .post('/api/v1/mfa/backup-codes/regenerate')
      .set('Authorization', `Bearer ${impersonationToken}`)
      .send({});
    expect(regenRes.status).toBe(403);
    expect(regenRes.body.error).toBe('forbidden_while_impersonating');

    const statusRes = await request(app)
      .get('/api/v1/mfa/status')
      .set('Authorization', `Bearer ${impersonationToken}`);
    expect(statusRes.status).toBe(403);
    expect(statusRes.body.error).toBe('forbidden_while_impersonating');
  });

  // "should allow" mirror case per this project's CLAUDE.md rule (any
  // CASL/authz-adjacent guard needs both an allow and a deny case). A normal,
  // non-impersonation token reaching /mfa/setup/start successfully is already
  // covered by this file's very first test above ('issues a TOTP secret and
  // only verifies with a correct code', describe('POST /api/v1/mfa/setup/start
  // + /setup/totp/verify') at the top of this file) - not duplicated here.
});

describe('GET /api/v1/mfa/status', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('reports zero methods for a fresh user', async () => {
    const user = await createUser();
    const token = issueAccessToken(user.id);
    const res = await request(app).get('/api/v1/mfa/status').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ methods: [], mode: 'optional', grace_period_ends_at: null });
  });

  it('reports mode: mandatory with a null grace_period_ends_at when the grace period has never been started', async () => {
    const user = await createUser();
    await setMfaMode('mandatory');
    const token = issueAccessToken(user.id);
    const res = await request(app).get('/api/v1/mfa/status').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ methods: [], mode: 'mandatory', grace_period_ends_at: null });
  });

  it('reports a grace_period_ends_at timestamp while mandatory mode is still within its grace period', async () => {
    const user = await createUser();
    await setMfaMode('mandatory');
    const startedDaysAgo = 1;
    const graceDays = 14;
    await setMfaGracePeriod(startedDaysAgo, graceDays);
    const token = issueAccessToken(user.id);
    const res = await request(app).get('/api/v1/mfa/status').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('mandatory');
    const expectedEndsAt = new Date(Date.now() - startedDaysAgo * 86_400_000 + graceDays * 86_400_000);
    expect(Math.abs(new Date(res.body.grace_period_ends_at).getTime() - expectedEndsAt.getTime())).toBeLessThan(5000);
  });

  it('still reports grace_period_ends_at even once a method is enrolled (methods/mode/grace_period_ends_at are independent fields)', async () => {
    const user = await createUser();
    await setMfaMode('mandatory');
    await setMfaGracePeriod(1, 14);
    await createTotpCredential(user.id, authenticator.generateSecret(), true);
    const token = issueAccessToken(user.id);
    const res = await request(app).get('/api/v1/mfa/status').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.methods).toEqual(['totp']);
    expect(res.body.mode).toBe('mandatory');
    expect(res.body.grace_period_ends_at).not.toBeNull();
  });
});

describe('GET /api/v1/mfa/passkeys', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('lists the caller\'s own passkey credentials, not another user\'s', async () => {
    const user = await createUser();
    const otherUser = await createUser();
    const now = new Date();
    await prisma.mfa_passkey_credentials.create({
      data: { user_id: user.id, credential_id: 'cred-a', public_key: 'pk-a', name: 'YubiKey', created_at: now, updated_at: now },
    });
    await prisma.mfa_passkey_credentials.create({
      data: { user_id: otherUser.id, credential_id: 'cred-b', public_key: 'pk-b', name: 'Other user\'s key', created_at: now, updated_at: now },
    });
    const token = issueAccessToken(user.id);

    const res = await request(app).get('/api/v1/mfa/passkeys').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.credentials).toHaveLength(1);
    expect(res.body.credentials[0]).toMatchObject({ credential_id: 'cred-a', name: 'YubiKey', last_used_at: null });
  });

  it('returns an empty list for a user with no passkeys', async () => {
    const user = await createUser();
    const token = issueAccessToken(user.id);

    const res = await request(app).get('/api/v1/mfa/passkeys').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.credentials).toEqual([]);
  });
});

/** Inserts a `mfa_totp_credentials` row directly, bypassing the setup/verify
 * flow, so tests can control `verified_at` and know the plaintext secret. */
async function createTotpCredential(userId: number, secret: string, verified: boolean) {
  const now = new Date();
  return prisma.mfa_totp_credentials.create({
    data: {
      user_id: userId,
      encrypted_secret: encryptSecret(secret),
      verified_at: verified ? now : null,
      created_at: now,
      updated_at: now,
    },
  });
}

async function createPasskeyCredential(userId: number, credentialId: string, name = 'Passkey') {
  const now = new Date();
  return prisma.mfa_passkey_credentials.create({
    data: { user_id: userId, credential_id: credentialId, public_key: 'test-public-key', name, created_at: now, updated_at: now },
  });
}

describe('POST /api/v1/mfa/setup/start - re-enrollment proof gate', () => {
  beforeEach(async () => {
    await resetDb();
    process.env.MFA_ENCRYPTION_KEY = 'a'.repeat(64);
  });

  it('denies (re-)starting TOTP setup with no proof once a verified TOTP method already exists', async () => {
    const user = await createUser();
    const token = issueAccessToken(user.id);
    const secret = authenticator.generateSecret();
    await createTotpCredential(user.id, secret, true);

    const res = await request(app).post('/api/v1/mfa/setup/start').set('Authorization', `Bearer ${token}`).send({ method: 'totp' });
    expect(res.status).toBe(422);

    // The existing verified credential must be untouched - no new secret issued.
    const row = await prisma.mfa_totp_credentials.findUniqueOrThrow({ where: { user_id: user.id } });
    expect(decryptSecret(row.encrypted_secret)).toBe(secret);
  });

  it('denies starting passkey registration with no proof once a verified TOTP method already exists', async () => {
    const user = await createUser();
    const token = issueAccessToken(user.id);
    const secret = authenticator.generateSecret();
    await createTotpCredential(user.id, secret, true);

    const res = await request(app).post('/api/v1/mfa/setup/start').set('Authorization', `Bearer ${token}`).send({ method: 'passkey' });
    expect(res.status).toBe(422);
  });

  it('allows re-starting TOTP setup once a valid proof of the existing verified TOTP method is supplied', async () => {
    const user = await createUser();
    const token = issueAccessToken(user.id);
    const secret = authenticator.generateSecret();
    await createTotpCredential(user.id, secret, true);

    const res = await request(app)
      .post('/api/v1/mfa/setup/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'totp', proof: { method: 'totp', code: authenticator.generate(secret) } });
    expect(res.status).toBe(200);
    expect(res.body.otpauth_uri).toMatch(/^otpauth:\/\/totp\//);
  });
});

describe('POST /api/v1/mfa/setup/email/verify - brute-force protection', () => {
  beforeEach(async () => {
    await resetDb();
    process.env.MFA_ENCRYPTION_KEY = 'a'.repeat(64);
    // vi.spyOn on an already-spied method returns the SAME mock instance
    // without clearing its call history - see mfaEmailOtp.test.ts's
    // identical comment for the flaky-test this bit us on before.
    vi.clearAllMocks();
    vi.spyOn(mail, 'sendMail').mockResolvedValue(undefined);
  });

  /** Starts a real email-OTP setup enrollment and extracts the plaintext
   * code from the mocked outgoing mail - mirrors mfaEmailOtp.test.ts's
   * technique, since there's no other way to read the code from this layer
   * (it's only ever stored bcrypt-hashed). */
  async function startEmailSetupAndGetCode(token: string): Promise<string> {
    await request(app).post('/api/v1/mfa/setup/start').set('Authorization', `Bearer ${token}`).send({ method: 'email' });
    const sentText = vi.mocked(mail.sendMail).mock.calls.at(-1)![0].text;
    return /(\d{6})/.exec(sentText)![1]!;
  }

  it('verifies a correct email-OTP code and rejects a wrong one', async () => {
    const user = await createUser();
    const token = issueAccessToken(user.id);
    const code = await startEmailSetupAndGetCode(token);

    const bad = await request(app).post('/api/v1/mfa/setup/email/verify').set('Authorization', `Bearer ${token}`).send({ code: '000000' });
    expect(bad.status).toBe(422);

    const good = await request(app).post('/api/v1/mfa/setup/email/verify').set('Authorization', `Bearer ${token}`).send({ code });
    expect(good.status).toBe(200);
    expect(good.body.backup_codes).toHaveLength(10);
  });

  // Regression test for a real gap found during Task 11's review and
  // deferred to this task: unlike every other credential-guessing surface in
  // this codebase (verifyExistingMfaProof's totp/backup_code branches just
  // below, mfaChallenge.ts's login-time email verify, session.ts's passkey
  // verify), this endpoint had NO lockout check at all. A caller holding a
  // stolen bearer token for a victim account - but no access to the
  // victim's real inbox - could call /setup/start {method:'email'} (sends a
  // real OTP to the victim's real inbox, attacker never sees it) and then
  // brute-force the 6-digit code against this endpoint with unlimited
  // attempts, eventually registering email-OTP as a persistent,
  // attacker-controlled second factor - entirely without ever reading the
  // victim's email.
  it('locks out further verification attempts after 5 consecutive wrong codes, blocking even the real code on the 6th attempt', async () => {
    const user = await createUser();
    const token = issueAccessToken(user.id);
    const code = await startEmailSetupAndGetCode(token);

    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/v1/mfa/setup/email/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ code: '000000' });
      expect(res.status).toBe(422);
    }

    // The 6th attempt, even with the real, otherwise-valid (unconsumed,
    // unexpired) code, must still be rejected - proving a lockout is in
    // effect, not merely that the code itself was wrong.
    const lockedRes = await request(app)
      .post('/api/v1/mfa/setup/email/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ code });
    expect(lockedRes.status).toBe(422);
    expect(lockedRes.body.backup_codes).toBeUndefined();

    // Not just this code, but the whole surface: a freshly-issued, entirely
    // separate valid code for the same user must also be rejected while
    // still locked out.
    const freshCode = await startEmailSetupAndGetCode(token);
    const stillLockedRes = await request(app)
      .post('/api/v1/mfa/setup/email/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: freshCode });
    expect(stillLockedRes.status).toBe(422);
    expect(stillLockedRes.body.backup_codes).toBeUndefined();
  });

  it('does not lock out a different user from a first user\'s failed attempts', async () => {
    const userA = await createUser();
    const tokenA = issueAccessToken(userA.id);
    await startEmailSetupAndGetCode(tokenA);
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/v1/mfa/setup/email/verify').set('Authorization', `Bearer ${tokenA}`).send({ code: '000000' });
    }

    const userB = await createUser({ email: `unlocked-${Date.now()}@example.org` });
    const tokenB = issueAccessToken(userB.id);
    const codeB = await startEmailSetupAndGetCode(tokenB);
    const res = await request(app).post('/api/v1/mfa/setup/email/verify').set('Authorization', `Bearer ${tokenB}`).send({ code: codeB });
    expect(res.status).toBe(200);
  });
});

describe('POST /api/v1/mfa/backup-codes/regenerate', () => {
  beforeEach(async () => {
    await resetDb();
    process.env.MFA_ENCRYPTION_KEY = 'a'.repeat(64);
  });

  it('rejects a code computed from an unverified TOTP credential (regression: security finding 1)', async () => {
    const user = await createUser();
    const token = issueAccessToken(user.id);
    const secret = authenticator.generateSecret();
    await createTotpCredential(user.id, secret, false);

    const res = await request(app)
      .post('/api/v1/mfa/backup-codes/regenerate')
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'totp', code: authenticator.generate(secret) });
    expect(res.status).toBe(422);
  });

  it('accepts a code from a verified TOTP credential and issues fresh backup codes', async () => {
    const user = await createUser();
    const token = issueAccessToken(user.id);
    const secret = authenticator.generateSecret();
    await createTotpCredential(user.id, secret, true);

    const res = await request(app)
      .post('/api/v1/mfa/backup-codes/regenerate')
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'totp', code: authenticator.generate(secret) });
    expect(res.status).toBe(200);
    expect(res.body.backup_codes).toHaveLength(10);
  });

  it('rejects with 422 (not a 500) when the stored TOTP secret cannot be decrypted with the current key', async () => {
    const user = await createUser();
    const token = issueAccessToken(user.id);
    const secret = authenticator.generateSecret();
    await createTotpCredential(user.id, secret, true);
    // Simulates a secret encrypted under a since-rotated/replaced
    // MFA_ENCRYPTION_KEY - decryptSecret throws on auth-tag mismatch, and
    // that throw must not crash this route with a 500 (found live on `next`
    // 2026-08-02: every proof attempt for an affected account 500'd,
    // blocking backup-code regen, method removal, and re-enrollment alike,
    // since they all route through verifyExistingMfaProof).
    process.env.MFA_ENCRYPTION_KEY = 'b'.repeat(64);

    const res = await request(app)
      .post('/api/v1/mfa/backup-codes/regenerate')
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'totp', code: authenticator.generate(secret) });
    expect(res.status).toBe(422);
  });

  // Regression test for the re-review finding: verifyExistingMfaProof's TOTP
  // branch previously had no attempt limit, so a caller holding a stolen
  // bearer token could brute-force the 6-digit code with unlimited guesses.
  it('locks out further proof attempts after 5 consecutive wrong TOTP codes, blocking even a correct code on the 6th attempt', async () => {
    const user = await createUser();
    const token = issueAccessToken(user.id);
    const secret = authenticator.generateSecret();
    await createTotpCredential(user.id, secret, true);

    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/v1/mfa/backup-codes/regenerate')
        .set('Authorization', `Bearer ${token}`)
        .send({ method: 'totp', code: '000000' });
      expect(res.status).toBe(422);
    }

    const lockedOutRes = await request(app)
      .post('/api/v1/mfa/backup-codes/regenerate')
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'totp', code: authenticator.generate(secret) });
    expect(lockedOutRes.status).toBe(422);

    // The lockout must not have silently regenerated the codes either.
    expect(lockedOutRes.body.backup_codes).toBeUndefined();
  });

  // Regression test for the bug this task fixes: verifyExistingMfaProof used
  // to record a failed lockout attempt for ANY proof.method, even one it
  // never actually verified (email is checked separately, via
  // verifyEmailOtp, right below the verifyExistingMfaProof call in this
  // route). Five wrong-code email attempts - which fail verifyEmailOtp for
  // the unrelated reason that no OTP was ever sent - must not arm the
  // totp/backup_code lockout counter, since no totp/backup_code guess was
  // ever made.
  it('does not count failed email-proof attempts toward the TOTP/backup-code lockout', async () => {
    const user = await createUser();
    const token = issueAccessToken(user.id);
    const secret = authenticator.generateSecret();
    await createTotpCredential(user.id, secret, true);

    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/v1/mfa/backup-codes/regenerate')
        .set('Authorization', `Bearer ${token}`)
        .send({ method: 'email', code: 'wrong' });
      expect(res.status).toBe(422);
    }

    const goodTotpRes = await request(app)
      .post('/api/v1/mfa/backup-codes/regenerate')
      .set('Authorization', `Bearer ${token}`)
      .send({ method: 'totp', code: authenticator.generate(secret) });
    expect(goodTotpRes.status).toBe(200);
    expect(goodTotpRes.body.backup_codes).toHaveLength(10);
  });
});

// --- Server-side enforcement gate for mandatory MFA (authenticateApiUser) --
//
// Task 21b fix round 2: the previous round issued a full access token to a
// zero-method user even past mandatory mode's grace period and relied
// entirely on the frontend's RequireAuth route guard to force /mfa/setup - a
// security review correctly flagged that a password-only attacker (or a
// user who never enrolls) could call any other API route directly with that
// token. This describes the new server-side gate added to
// authenticateApiUser itself. A dedicated app is built here (rather than
// reusing the module-level `app` above) because this gate needs a genuinely
// "ordinary" route outside both /api/v1/mfa/* and /api/v1/me to prove the
// block actually applies broadly, plus a real GET /api/v1/me mount to prove
// that specific route stays reachable.
function buildGateTestApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use(authenticateApiUser);
  app.get('/api/v1/__ordinary_test_route', (_req, res) => res.status(200).json({ ok: true }));
  app.use('/api/v1', meRouter);
  app.use('/api/v1/mfa', mfaRouter);
  app.use(apiErrorHandler);
  return app;
}

const gateApp = buildGateTestApp();

async function setMfaMode(mode: 'optional' | 'mandatory'): Promise<void> {
  await prisma.app_config_adapters.create({ data: { key: 'test_mfa_mode', value: mode } });
  appConfig.dirty('mfa_mode');
}

async function setMfaGracePeriod(startedDaysAgo: number, graceDays: number): Promise<void> {
  await prisma.app_config_adapters.create({
    data: { key: 'test_mfa_grace_period_started_at', value: new Date(Date.now() - startedDaysAgo * 86_400_000).toISOString() },
  });
  await prisma.app_config_adapters.create({ data: { key: 'test_mfa_grace_period_days', value: String(graceDays) } });
  appConfig.dirty('mfa_grace_period_started_at');
  appConfig.dirty('mfa_grace_period_days');
}

async function makeMustSetupUser(): Promise<{ id: number }> {
  const user = await createUser();
  await setMfaMode('mandatory');
  await setMfaGracePeriod(30, 14); // started 30 days ago, 14-day grace -> long past.
  return user;
}

describe('authenticateApiUser - mandatory MFA setup enforcement gate', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('403s a must-setup user on an ordinary authenticated route', async () => {
    const user = await makeMustSetupUser();
    const token = issueAccessToken(user.id);

    const res = await request(gateApp).get('/api/v1/__ordinary_test_route').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: 'mfa_setup_required' });
  });

  it('still allows a must-setup user to GET /api/v1/me', async () => {
    const user = await makeMustSetupUser();
    const token = issueAccessToken(user.id);

    const res = await request(gateApp).get('/api/v1/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.mfa_setup_required).toBe(true);
  });

  it('still allows a must-setup user through to the MFA setup API itself', async () => {
    const user = await makeMustSetupUser();
    const token = issueAccessToken(user.id);

    const res = await request(gateApp).get('/api/v1/mfa/status').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.methods).toEqual([]);
    expect(res.body.mode).toBe('mandatory');
    // makeMustSetupUser's grace period started 30 days ago with a 14-day
    // window, so it's already over - but computeGracePeriodEndsAt still
    // returns the (past) timestamp rather than null; only a mode other than
    // 'mandatory' makes this field null.
    expect(res.body.grace_period_ends_at).not.toBeNull();
  });

  it('does not gate a user still within mandatory mode\'s grace period', async () => {
    const user = await createUser();
    await setMfaMode('mandatory');
    await setMfaGracePeriod(1, 14); // started yesterday, 14-day grace -> still within it.
    const token = issueAccessToken(user.id);

    const res = await request(gateApp).get('/api/v1/__ordinary_test_route').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('does not gate a zero-method user in optional mode', async () => {
    const user = await createUser();
    // Explicit, not relying on the default: AppConfigService caches
    // mfa_mode per-key with a 5-minute TTL in tests, and the preceding
    // grace-period test above dirties it to 'mandatory' - without setting
    // (and dirtying) it back here, this test would silently inherit that
    // stale cached value and pass via the grace-period branch instead of
    // the mode !== 'mandatory' early-return it claims to exercise. Same
    // ordering hazard session.test.ts's own tests already document.
    await setMfaMode('optional');
    const token = issueAccessToken(user.id);

    const res = await request(gateApp).get('/api/v1/__ordinary_test_route').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('does not gate a user with a verified MFA method, even in mandatory mode past the grace period', async () => {
    const user = await createUser();
    await setMfaMode('mandatory');
    await setMfaGracePeriod(30, 14);
    await createTotpCredential(user.id, authenticator.generateSecret(), true);
    const token = issueAccessToken(user.id);

    const res = await request(gateApp).get('/api/v1/__ordinary_test_route').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it('does not gate an admin impersonating a must-setup target - reflects the target, but impersonation itself bypasses the gate', async () => {
    const target = await makeMustSetupUser();
    const admin = await createUser({ email: `impersonating-admin-${Date.now()}@example.org` });
    const token = issueAccessToken(target.id, admin.id);

    const res = await request(gateApp).get('/api/v1/__ordinary_test_route').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});

describe('DELETE /api/v1/mfa/methods/:type', () => {
  beforeEach(async () => {
    await resetDb();
    for (const key of Object.keys(KNOWN_KEYS)) appConfig.dirty(key);
    process.env.MFA_ENCRYPTION_KEY = 'a'.repeat(64);
  });

  it('removes a verified totp credential given correct proof (a valid backup code)', async () => {
    const user = await createUser();
    const secret = authenticator.generateSecret();
    await createTotpCredential(user.id, secret, true);
    const [backupCode] = await import('../../src/lib/mfaBackupCodes.js').then((m) => m.generateBackupCodes(user.id));
    const token = issueAccessToken(user.id);

    const res = await request(app)
      .delete('/api/v1/mfa/methods/totp')
      .set('Authorization', `Bearer ${token}`)
      .send({ proof: { method: 'backup_code', code: backupCode } });

    expect(res.status).toBe(204);
    expect(await prisma.mfa_totp_credentials.findUnique({ where: { user_id: user.id } })).toBeNull();
  });

  it('422s with missing/wrong proof and does not remove the credential', async () => {
    const user = await createUser();
    await createTotpCredential(user.id, authenticator.generateSecret(), true);
    const token = issueAccessToken(user.id);

    const res = await request(app)
      .delete('/api/v1/mfa/methods/totp')
      .set('Authorization', `Bearer ${token}`)
      .send({ proof: { method: 'totp', code: '000000' } });

    expect(res.status).toBe(422);
    expect(await prisma.mfa_totp_credentials.findUnique({ where: { user_id: user.id } })).not.toBeNull();
  });

  it('404s when the caller has no verified credential of that type', async () => {
    const user = await createUser();
    const token = issueAccessToken(user.id);

    const res = await request(app)
      .delete('/api/v1/mfa/methods/email')
      .set('Authorization', `Bearer ${token}`)
      .send({ proof: { method: 'totp', code: '000000' } });

    expect(res.status).toBe(404);
  });

  it('blocks removing the last method when mandatory MFA\'s grace period has passed (deny case)', async () => {
    const user = await createUser();
    const secret = authenticator.generateSecret();
    await createTotpCredential(user.id, secret, true);
    await setMfaMode('mandatory');
    await setMfaGracePeriod(30, 14); // started 30 days ago, 14-day grace -> long past.
    const token = issueAccessToken(user.id);
    const validCode = authenticator.generate(secret);

    const res = await request(app)
      .delete('/api/v1/mfa/methods/totp')
      .set('Authorization', `Bearer ${token}`)
      .send({ proof: { method: 'totp', code: validCode } });

    expect(res.status).toBe(422);
    expect(await prisma.mfa_totp_credentials.findUnique({ where: { user_id: user.id } })).not.toBeNull();
  });

  it('allows removing the last method when mode is optional (allow case)', async () => {
    const user = await createUser();
    const secret = authenticator.generateSecret();
    await createTotpCredential(user.id, secret, true);
    const token = issueAccessToken(user.id);
    const validCode = authenticator.generate(secret);

    const res = await request(app)
      .delete('/api/v1/mfa/methods/totp')
      .set('Authorization', `Bearer ${token}`)
      .send({ proof: { method: 'totp', code: validCode } });

    expect(res.status).toBe(204);
  });

  it('allows removing the last method when mandatory but still within the grace period (allow case)', async () => {
    const user = await createUser();
    const secret = authenticator.generateSecret();
    await createTotpCredential(user.id, secret, true);
    await setMfaMode('mandatory');
    await setMfaGracePeriod(1, 14); // started yesterday, 14-day grace -> still within it.
    const token = issueAccessToken(user.id);
    const validCode = authenticator.generate(secret);

    const res = await request(app)
      .delete('/api/v1/mfa/methods/totp')
      .set('Authorization', `Bearer ${token}`)
      .send({ proof: { method: 'totp', code: validCode } });

    expect(res.status).toBe(204);
  });

  it('allows removing one of two methods even past the grace period, since one remains (allow case)', async () => {
    const user = await createUser();
    const secret = authenticator.generateSecret();
    await createTotpCredential(user.id, secret, true);
    const now = new Date();
    await prisma.mfa_email_credentials.create({ data: { user_id: user.id, verified_at: now, created_at: now, updated_at: now } });
    await setMfaMode('mandatory');
    await setMfaGracePeriod(30, 14);
    const token = issueAccessToken(user.id);
    const validCode = authenticator.generate(secret);

    const res = await request(app)
      .delete('/api/v1/mfa/methods/totp')
      .set('Authorization', `Bearer ${token}`)
      .send({ proof: { method: 'totp', code: validCode } });

    expect(res.status).toBe(204);
  });
});

describe('DELETE /api/v1/mfa/methods/passkey/:credentialId', () => {
  beforeEach(async () => {
    await resetDb();
    process.env.MFA_ENCRYPTION_KEY = 'a'.repeat(64);
  });

  it('removes the caller\'s own passkey credential given correct proof', async () => {
    const user = await createUser();
    const secret = authenticator.generateSecret();
    await createTotpCredential(user.id, secret, true); // proof needs an existing verified method
    await createPasskeyCredential(user.id, 'cred-a');
    const token = issueAccessToken(user.id);
    const validCode = authenticator.generate(secret);

    const res = await request(app)
      .delete('/api/v1/mfa/methods/passkey/cred-a')
      .set('Authorization', `Bearer ${token}`)
      .send({ proof: { method: 'totp', code: validCode } });

    expect(res.status).toBe(204);
    expect(await prisma.mfa_passkey_credentials.findUnique({ where: { credential_id: 'cred-a' } })).toBeNull();
  });

  it('404s for a credential id belonging to another user (does not leak existence)', async () => {
    const user = await createUser();
    const otherUser = await createUser();
    const secret = authenticator.generateSecret();
    await createTotpCredential(user.id, secret, true);
    await createPasskeyCredential(otherUser.id, 'not-mine');
    const token = issueAccessToken(user.id);
    const validCode = authenticator.generate(secret);

    const res = await request(app)
      .delete('/api/v1/mfa/methods/passkey/not-mine')
      .set('Authorization', `Bearer ${token}`)
      .send({ proof: { method: 'totp', code: validCode } });

    expect(res.status).toBe(404);
    expect(await prisma.mfa_passkey_credentials.findUnique({ where: { credential_id: 'not-mine' } })).not.toBeNull();
  });

  it('404s for a credential id that does not exist at all', async () => {
    const user = await createUser();
    const secret = authenticator.generateSecret();
    await createTotpCredential(user.id, secret, true);
    const token = issueAccessToken(user.id);
    const validCode = authenticator.generate(secret);

    const res = await request(app)
      .delete('/api/v1/mfa/methods/passkey/does-not-exist')
      .set('Authorization', `Bearer ${token}`)
      .send({ proof: { method: 'totp', code: validCode } });

    expect(res.status).toBe(404);
  });

  it('422s with missing/wrong proof and does not remove the credential', async () => {
    const user = await createUser();
    const secret = authenticator.generateSecret();
    await createTotpCredential(user.id, secret, true);
    await createPasskeyCredential(user.id, 'cred-a');
    const token = issueAccessToken(user.id);

    const res = await request(app)
      .delete('/api/v1/mfa/methods/passkey/cred-a')
      .set('Authorization', `Bearer ${token}`)
      .send({ proof: { method: 'totp', code: '000000' } });

    expect(res.status).toBe(422);
    expect(await prisma.mfa_passkey_credentials.findUnique({ where: { credential_id: 'cred-a' } })).not.toBeNull();
  });

  it('blocks removing the only passkey when it is the last method and mandatory MFA\'s grace period has passed (deny case)', async () => {
    const user = await createUser();
    await createPasskeyCredential(user.id, 'cred-a');
    const [backupCode] = await import('../../src/lib/mfaBackupCodes.js').then((m) => m.generateBackupCodes(user.id));
    await setMfaMode('mandatory');
    await setMfaGracePeriod(30, 14);
    const token = issueAccessToken(user.id);

    const res = await request(app)
      .delete('/api/v1/mfa/methods/passkey/cred-a')
      .set('Authorization', `Bearer ${token}`)
      .send({ proof: { method: 'backup_code', code: backupCode } });

    expect(res.status).toBe(422);
    expect(await prisma.mfa_passkey_credentials.findUnique({ where: { credential_id: 'cred-a' } })).not.toBeNull();
  });

  it('allows removing one of two passkeys past the grace period, since one remains (allow case)', async () => {
    const user = await createUser();
    await createPasskeyCredential(user.id, 'cred-a');
    await createPasskeyCredential(user.id, 'cred-b');
    const [backupCode] = await import('../../src/lib/mfaBackupCodes.js').then((m) => m.generateBackupCodes(user.id));
    await setMfaMode('mandatory');
    await setMfaGracePeriod(30, 14);
    const token = issueAccessToken(user.id);

    const res = await request(app)
      .delete('/api/v1/mfa/methods/passkey/cred-a')
      .set('Authorization', `Bearer ${token}`)
      .send({ proof: { method: 'backup_code', code: backupCode } });

    expect(res.status).toBe(204);
    expect(await prisma.mfa_passkey_credentials.findUnique({ where: { credential_id: 'cred-b' } })).not.toBeNull();
  });
});
