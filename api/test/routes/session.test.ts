import { createHash } from 'node:crypto';

import bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { apiErrorHandler } from '../../src/lib/errors.js';
import { appConfig, KNOWN_KEYS } from '../../src/lib/appConfig.js';
import { prisma } from '../../src/db.js';
import { resetDb } from '../helpers/db.js';
import { createUser } from '../helpers/factories.js';

// No existing test in this file (or anywhere else in the suite) drives a
// full, real WebAuthn authentication ceremony end-to-end - buildAuthenticationOptions
// (real, pure @simplewebauthn/server computation, no network) is exercised
// directly by the existing "empty allow-list" test below, but verifyAuthentication
// itself requires a real signature from a real authenticator private key, which
// no test fixture here has. Mocking just verifyAuthentication (keeping
// buildAuthenticationOptions genuine via importOriginal) is this file's least
// invasive way to reach the post-verification code path (the `user.deleted`
// check below it) without reinventing a WebAuthn-ceremony test harness.
vi.mock('../../src/lib/mfaPasskeys.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../src/lib/mfaPasskeys.js')>();
  return { ...actual, verifyAuthentication: vi.fn() };
});

vi.mock('../../src/lib/mail.js', () => ({ sendMail: vi.fn().mockResolvedValue(undefined) }));
const { sendMail } = await import('../../src/lib/mail.js');

const { verifyAuthentication } = await import('../../src/lib/mfaPasskeys.js');
const sessionRouter = (await import('../../src/routes/session.js')).default;

// Port of rails-app/spec/requests/api/v1/sessions_spec.rb (6 examples), plus
// net-new edge-case and security coverage (see the bottom two `describe`
// blocks). This resource's controller does
// `skip_before_action :authenticate_api_user!` for every action, so there is
// no app.ts to mount against yet (it's owned by a later integration step) -
// this file builds a standalone Express app wired the same way app.ts will
// eventually wire it (express.json -> cookieParser -> router -> apiErrorHandler).

function buildApp() {
  const app = express();
  // Trusts X-Forwarded-For unconditionally (unlike app.ts's real `2`, tuned
  // to its specific host-nginx + this-app-nginx hop count) - this file builds
  // a standalone router, not the full app, so a single test-only header is
  // enough to exercise req.ip-dependent behavior (sign-in IP tracking).
  app.set('trust proxy', true);
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api/v1', sessionRouter);
  app.use(apiErrorHandler);
  return app;
}

const app = buildApp();

// Matches rails-app/spec/factories.rb's `factory :user` default password.
const PASSWORD = 'foobar123';

// Low bcrypt cost (Devise itself drops to `config.stretches = 1` in
// Rails.env.test? - see rails-app/config/initializers/devise.rb) keeps the
// test suite fast; the hash format ($2a$/$2b$) is what matters for the port,
// not the cost factor.
const TEST_BCRYPT_COST = 4;

async function createLoginableUser(overrides: Record<string, unknown> = {}) {
  return createUser({
    firstname: 'Appr',
    lastname: 'Entice',
    encrypted_password: bcrypt.hashSync(PASSWORD, TEST_BCRYPT_COST),
    ...overrides,
  });
}

/** Pulls a named cookie's raw value out of a supertest response's Set-Cookie header(s). */
function extractCookieValue(res: request.Response, name: string): string | undefined {
  const setCookie = res.headers['set-cookie'];
  const cookies: string[] = Array.isArray(setCookie) ? setCookie : setCookie ? [setCookie] : [];
  for (const cookie of cookies) {
    const pair = cookie.split(';')[0] ?? '';
    const [cookieName, value] = pair.split('=');
    if (cookieName === name) {
      return value;
    }
  }
  return undefined;
}

describe('Session API', () => {
  beforeEach(async () => {
    await resetDb();
    for (const key of Object.keys(KNOWN_KEYS)) appConfig.dirty(key);
    vi.mocked(sendMail).mockClear();
  });

  describe('POST /api/v1/session', () => {
    it('returns an access token and sets the refresh cookie', async () => {
      const user = await createLoginableUser();

      const res = await request(app).post('/api/v1/session').send({ email: user.email, password: PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.access_token).toBeTruthy();
      expect(res.body.user.email).toBe(user.email);
      expect(extractCookieValue(res, 'refresh_token')).toBeTruthy();
    });

    it('rejects wrong credentials without a cookie', async () => {
      const user = await createLoginableUser();

      const res = await request(app).post('/api/v1/session').send({ email: user.email, password: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'invalid_credentials' });
      expect(extractCookieValue(res, 'refresh_token')).toBeUndefined();
    });

    it('returns bad_request when a required parameter is missing', async () => {
      const user = await createLoginableUser();

      const res = await request(app).post('/api/v1/session').send({ email: user.email });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('bad_request');
    });
  });

  // --- Devise trackable port: sign_in_count/current_sign_in_at/
  // last_sign_in_at/current_sign_in_ip/last_sign_in_ip must be updated on
  // every successful login, exactly like Devise::Models::Trackable#
  // update_tracked_fields! - these are what statistics.ts's user_stats
  // sub-report reads (see this repo's CLAUDE.md session note on statistics
  // not updating after login). ---
  describe('sign-in tracking (Devise trackable port)', () => {
    it('sets sign_in_count to 1, current_sign_in_at, and current_sign_in_ip on first login', async () => {
      const user = await createLoginableUser();

      const res = await request(app).post('/api/v1/session').set('X-Forwarded-For', '203.0.113.9').send({ email: user.email, password: PASSWORD });

      expect(res.status).toBe(200);
      const updated = await prisma.users.findUniqueOrThrow({ where: { id: user.id } });
      expect(updated.sign_in_count).toBe(1);
      expect(updated.current_sign_in_at).not.toBeNull();
      // Devise's `update_tracked_fields!` seeds last_* from current_* via
      // `old_current || new_current` - on a user's very first login there is
      // no old value, so last_* ends up equal to current_*, not null.
      expect(updated.last_sign_in_at?.getTime()).toBe(updated.current_sign_in_at?.getTime());
      expect(updated.current_sign_in_ip).toBe('203.0.113.9');
      expect(updated.last_sign_in_ip).toBe('203.0.113.9');
    });

    it('increments sign_in_count and rolls current_* into last_* on a second login', async () => {
      const user = await createLoginableUser();

      const first = await request(app).post('/api/v1/session').set('X-Forwarded-For', '203.0.113.9').send({ email: user.email, password: PASSWORD });
      expect(first.status).toBe(200);
      const afterFirst = await prisma.users.findUniqueOrThrow({ where: { id: user.id } });

      const second = await request(app).post('/api/v1/session').set('X-Forwarded-For', '198.51.100.4').send({ email: user.email, password: PASSWORD });
      expect(second.status).toBe(200);

      const afterSecond = await prisma.users.findUniqueOrThrow({ where: { id: user.id } });
      expect(afterSecond.sign_in_count).toBe(2);
      expect(afterSecond.current_sign_in_ip).toBe('198.51.100.4');
      expect(afterSecond.last_sign_in_ip).toBe('203.0.113.9');
      expect(afterSecond.current_sign_in_at?.getTime()).toBeGreaterThanOrEqual(afterFirst.current_sign_in_at!.getTime());
      expect(afterSecond.last_sign_in_at?.getTime()).toBe(afterFirst.current_sign_in_at!.getTime());
    });

    it('does not touch sign-in tracking fields on a failed login attempt', async () => {
      const user = await createLoginableUser();

      const res = await request(app).post('/api/v1/session').send({ email: user.email, password: 'wrong-password' });

      expect(res.status).toBe(401);
      const unchanged = await prisma.users.findUniqueOrThrow({ where: { id: user.id } });
      expect(unchanged.sign_in_count).toBe(0);
      expect(unchanged.current_sign_in_at).toBeNull();
      expect(unchanged.current_sign_in_ip).toBeNull();
    });
  });

  describe('POST /api/v1/session/refresh', () => {
    it('rotates the refresh token and returns a new access token', async () => {
      const user = await createLoginableUser();
      const agent = request.agent(app);

      const first = await agent.post('/api/v1/session').send({ email: user.email, password: PASSWORD });
      const firstCookie = extractCookieValue(first, 'refresh_token');

      const res = await agent.post('/api/v1/session/refresh').send();

      expect(res.status).toBe(200);
      expect(res.body.access_token).toBeTruthy();
      expect(extractCookieValue(res, 'refresh_token')).not.toBe(firstCookie);
    });

    it('401s without a cookie', async () => {
      const res = await request(app).post('/api/v1/session/refresh').send();

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/v1/session', () => {
    it('revokes the family so refresh stops working', async () => {
      const user = await createLoginableUser();
      const agent = request.agent(app);

      await agent.post('/api/v1/session').send({ email: user.email, password: PASSWORD });
      const del = await agent.delete('/api/v1/session');
      expect(del.status).toBe(204);

      const res = await agent.post('/api/v1/session/refresh').send();
      expect(res.status).toBe(401);
    });
  });

  // --- net-new edge cases, not in the Rails spec but exercising behavior the
  // Rails controller's `user&.valid_password?(params.require(:password))`
  // line implies via Ruby's safe-navigation short-circuit and Devise's
  // blank-hash handling. ---
  describe('edge cases', () => {
    it('returns bad_request when email itself is missing', async () => {
      const res = await request(app).post('/api/v1/session').send({ password: PASSWORD });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('bad_request');
    });

    it('returns bad_request (not invalid_credentials) for a missing password, even when the email does not match any user', async () => {
      // This used to mirror `user&.valid_password?(params.require(:password))`:
      // when `user` was nil, `params.require(:password)` was never evaluated
      // (Ruby's safe-navigation short-circuit), so a missing password against
      // an unknown email took the invalid_credentials branch while the same
      // missing password against a *real* email took the bad_request branch
      // below - a user-enumeration oracle (Finding A). Request-shape
      // validation now happens up front, before any user lookup, so both
      // cases return the identical 400 regardless of whether the email
      // exists - see the 'does not leak whether an email exists' test below
      // for the full-credentials version of this same guarantee.
      const res = await request(app).post('/api/v1/session').send({ email: 'nobody@example.test' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('bad_request');
    });

    it('rejects login for a user with a blank encrypted_password without crashing', async () => {
      const user = await createUser({ firstname: 'No', lastname: 'Password', encrypted_password: '' });

      const res = await request(app).post('/api/v1/session').send({ email: user.email, password: 'whatever' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'invalid_credentials' });
    });

    it('logs in a deleted user, matching Rails (valid_password? does not check active_for_authentication?)', async () => {
      const user = await createLoginableUser({ deleted: true });

      const res = await request(app).post('/api/v1/session').send({ email: user.email, password: PASSWORD });

      expect(res.status).toBe(200);
    });

    it('normalizes email case and surrounding whitespace before lookup', async () => {
      const user = await createLoginableUser();

      const res = await request(app)
        .post('/api/v1/session')
        .send({ email: `  ${user.email.toUpperCase()}  `, password: PASSWORD });

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(user.email);
    });
  });

  // --- net-new security coverage (this task's instructions call for at
  // least one authz-boundary test and, since `email` is user input flowing
  // into a Prisma query, a SQL-injection-attempt test). ---
  describe('security', () => {
    it('does not error or leak data for a SQL-metacharacter email payload', async () => {
      await createLoginableUser();

      const res = await request(app)
        .post('/api/v1/session')
        .send({ email: "' OR '1'='1' --", password: 'whatever' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'invalid_credentials' });
    });

    it('does not error or leak data for a % wildcard email payload', async () => {
      await createLoginableUser();

      const res = await request(app).post('/api/v1/session').send({ email: '%', password: 'whatever' });

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: 'invalid_credentials' });
    });

    it('rejects a replayed refresh cookie after logout, even though it is well-formed and was recently valid', async () => {
      const user = await createLoginableUser();
      const agent = request.agent(app);

      const loginRes = await agent.post('/api/v1/session').send({ email: user.email, password: PASSWORD });
      const revokedCookie = extractCookieValue(loginRes, 'refresh_token');

      await agent.delete('/api/v1/session');

      // Present the now-revoked cookie directly (the agent's own jar already
      // dropped it via Set-Cookie on logout) to prove the server-side
      // revocation - not just the client-side cookie clear - is what blocks
      // reuse of a token that was genuinely issued and, until logout, valid.
      const res = await request(app).post('/api/v1/session/refresh').set('Cookie', `refresh_token=${revokedCookie}`);

      expect(res.status).toBe(401);
    });

    it('a valid access-token Authorization header does not substitute for the refresh cookie', async () => {
      // Session routes skip authenticate_api_user! entirely; refresh must
      // rely solely on the refresh_token cookie, never on a Bearer token,
      // even a well-formed and currently-valid one for a real user.
      const user = await createLoginableUser();
      const loginRes = await request(app).post('/api/v1/session').send({ email: user.email, password: PASSWORD });
      const accessToken = loginRes.body.access_token as string;

      const res = await request(app).post('/api/v1/session/refresh').set('Authorization', `Bearer ${accessToken}`).send();

      expect(res.status).toBe(401);
    });

    it('does not leak whether an email exists: wrong password on a real account and any password on an unknown account get identical responses', async () => {
      // Finding A: the missing-password check used to run only inside
      // `if (user)`, so a well-formed wrong-password request against a real
      // email and one against an unknown email must be genuinely
      // indistinguishable in status/body - not just "both happen to be 401"
      // (that was already true before the fix for this specific pairing;
      // what changed is the missing-password edge case above, plus this
      // request now runs a real bcrypt.compare against a fixed dummy hash on
      // the unknown-email path instead of skipping bcrypt entirely, closing
      // the timing side of the same oracle - see DUMMY_PASSWORD_HASH in
      // src/routes/session.ts). A precise timing assertion would be flaky in
      // CI, so this only asserts the deterministic status/body identity.
      const user = await createLoginableUser();

      const wrongPasswordReal = await request(app).post('/api/v1/session').send({ email: user.email, password: 'wrong-password' });
      const unknownEmail = await request(app).post('/api/v1/session').send({ email: 'nobody-at-all@example.test', password: 'wrong-password' });

      expect(wrongPasswordReal.status).toBe(401);
      expect(unknownEmail.status).toBe(401);
      expect(wrongPasswordReal.body).toEqual({ error: 'invalid_credentials' });
      expect(unknownEmail.body).toEqual({ error: 'invalid_credentials' });
    });
  });

  // --- Fix B: per-email failed-login lockout, independent of source IP
  // (loginRateLimiter in src/middleware/rateLimit.ts is per-IP only and is
  // itself disabled under NODE_ENV=test - see that file - so these tests
  // exercise the DB-backed per-email mechanism directly, not the IP throttle). ---
  describe('per-email login lockout', () => {
    const LOCKOUT_THRESHOLD = 5;

    it('locks the account after enough consecutive failures, rejecting even the correct password while locked', async () => {
      const user = await createLoginableUser();

      let last;
      for (let i = 0; i < LOCKOUT_THRESHOLD; i += 1) {
        // eslint-disable-next-line no-await-in-loop -- deliberately sequential: each failure must land before the next to accumulate against the same counter.
        last = await request(app).post('/api/v1/session').send({ email: user.email, password: 'wrong-password' });
        expect(last.status).toBe(401);
      }

      // The account should now be locked purely from the failure count -
      // proven by presenting the *correct* password and still getting
      // rejected (not just "wrong password keeps failing").
      const correctButLocked = await request(app).post('/api/v1/session').send({ email: user.email, password: PASSWORD });

      expect(correctButLocked.status).toBe(401);
      expect(correctButLocked.body).toEqual({ error: 'invalid_credentials' });
    });

    it('resets the failure counter after a successful login', async () => {
      const user = await createLoginableUser();

      // A couple of failures, but fewer than the lockout threshold.
      await request(app).post('/api/v1/session').send({ email: user.email, password: 'wrong-password' });
      await request(app).post('/api/v1/session').send({ email: user.email, password: 'wrong-password' });

      const success = await request(app).post('/api/v1/session').send({ email: user.email, password: PASSWORD });
      expect(success.status).toBe(200);

      const lockoutRow = await prisma.login_lockouts.findUnique({ where: { email: user.email } });
      expect(lockoutRow?.failed_count ?? 0).toBe(0);
      expect(lockoutRow?.locked_until ?? null).toBeNull();

      // And the account is immediately usable again, not still throttled.
      const loginAgain = await request(app).post('/api/v1/session').send({ email: user.email, password: PASSWORD });
      expect(loginAgain.status).toBe(200);
    });

    it('does not throttle a different, never-attempted email', async () => {
      const attacked = await createLoginableUser();
      const bystander = await createLoginableUser();

      for (let i = 0; i < LOCKOUT_THRESHOLD; i += 1) {
        // eslint-disable-next-line no-await-in-loop -- see above.
        await request(app).post('/api/v1/session').send({ email: attacked.email, password: 'wrong-password' });
      }

      const bystanderLogin = await request(app).post('/api/v1/session').send({ email: bystander.email, password: PASSWORD });
      expect(bystanderLogin.status).toBe(200);
    });

    it('tracks and throttles an email with no matching user at all', async () => {
      // The whole point of keying by email (not by a users FK) is that an
      // attacker enumerating many unknown emails plus one real one still
      // gets throttled on the unknown ones too - the record must exist even
      // before we know whether the email corresponds to a real user.
      const unknownEmail = 'never-registered@example.test';

      for (let i = 0; i < LOCKOUT_THRESHOLD; i += 1) {
        // eslint-disable-next-line no-await-in-loop -- see above.
        await request(app).post('/api/v1/session').send({ email: unknownEmail, password: 'whatever' });
      }

      const lockoutRow = await prisma.login_lockouts.findUnique({ where: { email: unknownEmail } });
      expect(lockoutRow?.failed_count).toBe(LOCKOUT_THRESHOLD);
      expect(lockoutRow?.locked_until).not.toBeNull();
    });
  });

  describe('MFA-gated login', () => {
    it('returns an mfa_pending_token when the user has a verified method', async () => {
      const user = await createLoginableUser();
      await prisma.mfa_totp_credentials.create({
        data: { user_id: user.id, encrypted_secret: 'x', verified_at: new Date(), created_at: new Date(), updated_at: new Date() },
      });
      const res = await request(app).post('/api/v1/session').send({ email: user.email, password: PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.mfa_pending_token).toBeDefined();
      expect(res.body.access_token).toBeUndefined();
    });

    it('skips the challenge when a trusted-device cookie matches', async () => {
      const user = await createLoginableUser();
      await prisma.mfa_totp_credentials.create({
        data: { user_id: user.id, encrypted_secret: 'x', verified_at: new Date(), created_at: new Date(), updated_at: new Date() },
      });
      const raw = 'a'.repeat(64);
      await prisma.mfa_trusted_devices.create({
        data: {
          user_id: user.id,
          // Task brief's literal test code used `require('node:crypto')`
          // inline - swapped for a top-level import since this file is ESM
          // (`"type": "module"`), where a bare `require` global isn't
          // guaranteed to exist at runtime (no other test file in this repo
          // relies on it); semantically identical otherwise.
          device_token_hash: createHash('sha256').update(raw).digest('hex'),
          expires_at: new Date(Date.now() + 86_400_000),
          created_at: new Date(),
        },
      });
      const res = await request(app)
        .post('/api/v1/session')
        .set('Cookie', [`mfa_device_token=${raw}`])
        .send({ email: user.email, password: PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.access_token).toBeDefined();
    });

    it('never sets setup_required for optional mode, even with zero enrolled methods', async () => {
      // Placed before the mandatory-mode tests below deliberately: those
      // dirty the AppConfig cache to 'mandatory' and nothing re-dirties it
      // back afterward, so running this test after them would read a stale
      // cached 'mandatory' value instead of exercising the actual default -
      // see the neighboring comment on the grace-period test for the same
      // singleton-cache gotcha.
      const user = await createLoginableUser();
      const res = await request(app).post('/api/v1/session').send({ email: user.email, password: PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.access_token).toBeDefined();
      expect(res.body.setup_required).toBe(false);
    });

    it('returns setup_required past the grace period for a mandatory, unenrolled user', async () => {
      const user = await createLoginableUser();
      await prisma.app_config_adapters.create({ data: { key: 'test_mfa_mode', value: 'mandatory' } });
      await prisma.app_config_adapters.create({
        data: { key: 'test_mfa_grace_period_started_at', value: new Date(Date.now() - 30 * 86_400_000).toISOString() },
      });
      await prisma.app_config_adapters.create({ data: { key: 'test_mfa_grace_period_days', value: '14' } });
      // Deviation from the task brief's literal test code: these three keys
      // are written directly via Prisma, bypassing appConfig.set() (which
      // would also invalidate the shared AppConfigService singleton's
      // cache - see appConfig.dirty()). Without dirtying them explicitly,
      // getMfaSettings() (which this file's earlier tests already warmed
      // with the 'optional'/null defaults, since every successful login now
      // calls it) would keep serving those stale cached values for up to 5
      // minutes (NODE_ENV=test), and this test would see mode 'optional'
      // instead of 'mandatory'. Same fix already established by
      // public.test.ts's beforeEach and appConfig.test.ts's setConfigValue
      // helper for this exact singleton-cache gotcha.
      appConfig.dirty('mfa_mode');
      appConfig.dirty('mfa_grace_period_started_at');
      appConfig.dirty('mfa_grace_period_days');
      const res = await request(app).post('/api/v1/session').send({ email: user.email, password: PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.setup_required).toBe(true);
      expect(res.body.access_token).toBeDefined();
      expect(res.body.user).toBeDefined();
    });

    it('issues full tokens when mandatory mode is still within its grace period', async () => {
      const user = await createLoginableUser();
      await prisma.app_config_adapters.create({ data: { key: 'test_mfa_mode', value: 'mandatory' } });
      await prisma.app_config_adapters.create({
        data: { key: 'test_mfa_grace_period_started_at', value: new Date(Date.now() - 1 * 86_400_000).toISOString() },
      });
      await prisma.app_config_adapters.create({ data: { key: 'test_mfa_grace_period_days', value: '14' } });
      appConfig.dirty('mfa_mode');
      appConfig.dirty('mfa_grace_period_started_at');
      appConfig.dirty('mfa_grace_period_days');
      const res = await request(app).post('/api/v1/session').send({ email: user.email, password: PASSWORD });
      expect(res.status).toBe(200);
      expect(res.body.access_token).toBeDefined();
      expect(res.body.setup_required).not.toBe(true);
    });
  });

  describe('Passwordless passkey login', () => {
    it('returns authentication options with an empty allow-list', async () => {
      const res = await request(app).post('/api/v1/session/passkey/options').send({});
      expect(res.status).toBe(200);
      expect(res.body.allowCredentials).toEqual([]);
    });

    it('rejects verification with no matching credential', async () => {
      const res = await request(app)
        .post('/api/v1/session/passkey/verify')
        .send({ response: { id: 'nonexistent-credential-id' } });
      expect(res.status).toBe(401);
    });

    // Regression coverage for a real property, not just the response status:
    // session.ts's `!stored` branch (no credential found for the given id)
    // calls recordFailedMfaAttempt(`passkey:${credentialId}`) BEFORE ever
    // looking up whether the credential is real - so a fabricated
    // credential_id exercises the exact same lockout bookkeeping a
    // guessed/stolen real one would, with no WebAuthn ceremony needed. Every
    // failure response here is the same 401 { error: 'unauthorized' }
    // regardless of whether the underlying cause is "unknown credential" or
    // "locked out" (this app never leaks lockout state via status code - see
    // CLAUDE.md's non-enumeration principle), so a black-box, status-code-only
    // test cannot distinguish a correctly per-credential-keyed lockout from a
    // globally-shared one or no lockout at all. This test instead asserts
    // directly against mfa_lockouts - the only way to actually prove the
    // `passkey:${credentialId}` key is scoped per-credential rather than
    // shared.
    it('keys the login lockout per credential_id, not globally', async () => {
      for (let i = 0; i < 5; i++) {
        const res = await request(app)
          .post('/api/v1/session/passkey/verify')
          .send({ response: { id: 'e2e-fake-credential-A' } });
        expect(res.status).toBe(401);
      }
      const res = await request(app)
        .post('/api/v1/session/passkey/verify')
        .send({ response: { id: 'e2e-fake-credential-B' } });
      expect(res.status).toBe(401);

      const lockoutA = await prisma.mfa_lockouts.findUnique({
        where: { subject_key: 'passkey:e2e-fake-credential-A' },
      });
      const lockoutB = await prisma.mfa_lockouts.findUnique({
        where: { subject_key: 'passkey:e2e-fake-credential-B' },
      });

      // Two independent rows with independent counts is the discriminating
      // assertion: under a correctly-scoped per-credential key, A's five
      // failures never touch B's count. Under a global/shared key there
      // would be one row (or B's row would already show a merged count of
      // 6), not two rows reading 5 and 1.
      expect(lockoutA?.failed_count).toBe(5);
      expect(lockoutB?.failed_count).toBe(1);
      expect(await prisma.mfa_lockouts.count()).toBe(2);
    });

    // Security regression test: session.ts's passkey/verify handler resolves
    // the user purely from credential_id -> user_id and (before this fix)
    // never checked `deleted` - so an offboarded/expelled member who
    // enrolled a passkey before removal could keep logging in indefinitely,
    // bypassing the whole point of members.ts's soft-delete flow (mangled
    // email + revoked refresh tokens block password login and existing
    // sessions, but never touched MFA credentials).
    it('rejects passkey login for a soft-deleted user', async () => {
      const user = await createLoginableUser();
      const credentialId = 'e2e-soft-deleted-user-credential';
      await prisma.mfa_passkey_credentials.create({
        data: {
          user_id: user.id,
          credential_id: credentialId,
          public_key: Buffer.from('fake-public-key-bytes').toString('base64url'),
          sign_count: 0,
          name: 'Test passkey',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Mirror members.ts's own soft-delete write exactly (deleted: true +
      // mangled email) - this test only needs the resulting DB state, not to
      // re-exercise the DELETE route itself.
      await prisma.users.update({
        where: { id: user.id },
        data: { deleted: true, email: `deleted-${Math.floor(Date.now() / 1000)}-${user.email}`, updated_at: new Date() },
      });

      const optionsRes = await request(app).post('/api/v1/session/passkey/options').send({});
      const challenge: string = optionsRes.body.challenge;
      expect(challenge).toBeDefined();

      // The WebAuthn signature verification itself is out of scope here (it's
      // a pure library call with no access to real authenticator key
      // material) - what this test proves is that even a *successfully
      // verified* assertion for a real, enrolled credential must not produce
      // a session once the owning user is soft-deleted.
      vi.mocked(verifyAuthentication).mockResolvedValueOnce({
        verified: true,
        authenticationInfo: { newCounter: 1 },
      } as unknown as Awaited<ReturnType<typeof verifyAuthentication>>);

      const clientDataJSON = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge })).toString('base64');

      const res = await request(app)
        .post('/api/v1/session/passkey/verify')
        .send({ response: { id: credentialId, response: { clientDataJSON } } });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('unauthorized');
    });
  });

  describe('login notification emails', () => {
    it('does not email on successful login when the toggle is off (default)', async () => {
      const user = await createUser({ encrypted_password: bcrypt.hashSync(PASSWORD, TEST_BCRYPT_COST) });
      await request(app).post('/api/v1/session').send({ email: user.email, password: PASSWORD });
      expect(sendMail).not.toHaveBeenCalled();
    });

    it('emails the user on successful password login when the toggle is on', async () => {
      await appConfig.set('notify_user_on_login_activity', true);
      const user = await createUser({ encrypted_password: bcrypt.hashSync(PASSWORD, TEST_BCRYPT_COST) });
      const res = await request(app).post('/api/v1/session').send({ email: user.email, password: PASSWORD });
      expect(res.status).toBe(200);
      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: user.email }));
    });

    it('does not email on a failed password login (wrong password)', async () => {
      await appConfig.set('notify_user_on_login_activity', true);
      const user = await createUser({ encrypted_password: bcrypt.hashSync(PASSWORD, TEST_BCRYPT_COST) });
      await request(app).post('/api/v1/session').send({ email: user.email, password: 'wrong-password' });
      expect(sendMail).not.toHaveBeenCalled();
    });

    it('emails a lockout notification on the 5th consecutive failed password attempt, not before', async () => {
      await appConfig.set('notify_user_on_login_activity', true);
      const user = await createUser({ encrypted_password: bcrypt.hashSync(PASSWORD, TEST_BCRYPT_COST) });
      for (let i = 0; i < 4; i++) {
        // eslint-disable-next-line no-await-in-loop -- deliberately sequential: each failure must land before the next to accumulate against the same counter.
        await request(app).post('/api/v1/session').send({ email: user.email, password: 'wrong-password' });
      }
      expect(sendMail).not.toHaveBeenCalled();
      await request(app).post('/api/v1/session').send({ email: user.email, password: 'wrong-password' });
      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: user.email }));
    });

    it('does not email a lockout notification for an unknown email (no user to notify)', async () => {
      await appConfig.set('notify_user_on_login_activity', true);
      for (let i = 0; i < 5; i++) {
        // eslint-disable-next-line no-await-in-loop -- see above.
        await request(app).post('/api/v1/session').send({ email: 'nobody-at-all@example.test', password: 'whatever' });
      }
      expect(sendMail).not.toHaveBeenCalled();
    });

    it('does not email on refresh-token rotation (not a fresh login)', async () => {
      await appConfig.set('notify_user_on_login_activity', true);
      const user = await createUser({ encrypted_password: bcrypt.hashSync(PASSWORD, TEST_BCRYPT_COST) });
      const loginRes = await request(app).post('/api/v1/session').send({ email: user.email, password: PASSWORD });
      const cookie = loginRes.headers['set-cookie'];
      vi.mocked(sendMail).mockClear();

      const refreshRes = await request(app).post('/api/v1/session/refresh').set('Cookie', cookie);
      // Asserting the refresh itself actually succeeded is load-bearing here:
      // without it, a broken/401ing refresh would make sendMail's
      // not-having-been-called assertion pass for the wrong reason (the
      // request failed) instead of proving rotation deliberately skips the
      // notification.
      expect(refreshRes.status).toBe(200);
      expect(sendMail).not.toHaveBeenCalled();
    });

    it('emails the user on successful login via a trusted-device MFA skip', async () => {
      await appConfig.set('notify_user_on_login_activity', true);
      const user = await createLoginableUser();
      await prisma.mfa_totp_credentials.create({
        data: { user_id: user.id, encrypted_secret: 'x', verified_at: new Date(), created_at: new Date(), updated_at: new Date() },
      });
      const raw = 'b'.repeat(64);
      await prisma.mfa_trusted_devices.create({
        data: {
          user_id: user.id,
          device_token_hash: createHash('sha256').update(raw).digest('hex'),
          expires_at: new Date(Date.now() + 86_400_000),
          created_at: new Date(),
        },
      });
      const res = await request(app)
        .post('/api/v1/session')
        .set('Cookie', [`mfa_device_token=${raw}`])
        .send({ email: user.email, password: PASSWORD });
      expect(res.status).toBe(200);
      // Proves this actually took the trusted-device branch, not the
      // zero-MFA-methods branch above it (both send a 'password' success
      // email, so without this the assertions below would pass either way)
      // - only the zero-methods branch's response includes setup_required.
      expect(res.body.setup_required).toBeUndefined();
      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: user.email }));
    });

    it('emails the user on a successful passkey login', async () => {
      await appConfig.set('notify_user_on_login_activity', true);
      const user = await createLoginableUser();
      const credentialId = 'e2e-success-notification-credential';
      await prisma.mfa_passkey_credentials.create({
        data: {
          user_id: user.id,
          credential_id: credentialId,
          public_key: Buffer.from('fake-public-key-bytes').toString('base64url'),
          sign_count: 0,
          name: 'Test passkey',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      vi.mocked(verifyAuthentication).mockResolvedValueOnce({
        verified: true,
        authenticationInfo: { newCounter: 1 },
      } as unknown as Awaited<ReturnType<typeof verifyAuthentication>>);

      const optionsRes = await request(app).post('/api/v1/session/passkey/options').send({});
      const challenge: string = optionsRes.body.challenge;
      const clientDataJSON = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge })).toString('base64');
      const res = await request(app)
        .post('/api/v1/session/passkey/verify')
        .send({ response: { id: credentialId, response: { clientDataJSON } } });

      expect(res.status).toBe(200);
      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: user.email }));
    });

    it('emails a lockout notification on the 5th consecutive failed passkey verification', async () => {
      await appConfig.set('notify_user_on_login_activity', true);
      const user = await createLoginableUser();
      const credentialId = 'e2e-lockout-notification-credential';
      await prisma.mfa_passkey_credentials.create({
        data: {
          user_id: user.id,
          credential_id: credentialId,
          public_key: Buffer.from('fake-public-key-bytes').toString('base64url'),
          sign_count: 0,
          name: 'Test passkey',
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
      vi.mocked(verifyAuthentication).mockResolvedValue({
        verified: false,
        authenticationInfo: { newCounter: 0 },
      } as unknown as Awaited<ReturnType<typeof verifyAuthentication>>);

      async function attempt() {
        const optionsRes = await request(app).post('/api/v1/session/passkey/options').send({});
        const challenge: string = optionsRes.body.challenge;
        const clientDataJSON = Buffer.from(JSON.stringify({ type: 'webauthn.get', challenge })).toString('base64');
        return request(app)
          .post('/api/v1/session/passkey/verify')
          .send({ response: { id: credentialId, response: { clientDataJSON } } });
      }

      for (let i = 0; i < 4; i++) {
        // eslint-disable-next-line no-await-in-loop -- see above.
        const res = await attempt();
        expect(res.status).toBe(401);
      }
      expect(sendMail).not.toHaveBeenCalled();

      const res = await attempt();
      expect(res.status).toBe(401);
      expect(sendMail).toHaveBeenCalledTimes(1);
      expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: user.email }));

      // This test's mock uses the persistent mockResolvedValue (all 5
      // attempts need `verified: false`), unlike every other test in this
      // file's mockResolvedValueOnce convention - reset it explicitly so a
      // future test appended after this one doesn't silently inherit it.
      vi.mocked(verifyAuthentication).mockReset();
    });
  });
});
