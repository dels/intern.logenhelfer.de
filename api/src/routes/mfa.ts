import { Router } from 'express';

import { authenticateApiUser } from '../auth/middleware.js';
import { prisma } from '../db.js';
import { ApiError } from '../lib/errors.js';
import { encryptSecret, decryptSecret } from '../lib/mfaEncryption.js';
import { generateTotpSecret, buildOtpauthUri, verifyTotpCode, verifyEncryptedTotpCode, renderTotpQrDataUrl } from '../lib/mfaTotp.js';
import { sendEmailOtp, verifyEmailOtp } from '../lib/mfaEmailOtp.js';
import { generateBackupCodes, consumeBackupCode } from '../lib/mfaBackupCodes.js';
import { getUserMfaMethods, computeGracePeriodEndsAt } from '../lib/mfaStatus.js';
import { getMfaSettings } from '../lib/mfaSettings.js';
import { buildRegistrationOptions, verifyRegistration, buildAuthenticationOptions, verifyAuthentication } from '../lib/mfaPasskeys.js';
import type { AuthenticationResponseJSON } from '@simplewebauthn/server';
import { isMfaLockedOut, recordFailedMfaAttempt, resetMfaLockout } from '../auth/mfaLockout.js';

const router = Router();
router.use(authenticateApiUser);

// Security fix: an impersonating admin must never be able to enroll,
// re-enroll, or manage MFA credentials/trusted devices for the account
// they're impersonating - doing so would let them silently plant a
// passkey (or any other method) the real account holder never consented
// to, with no audit trail (mfa_reset_events only covers the dedicated,
// audited /mfa/reset route in members.ts, not this router). Matches the
// identical guard already applied to me.ts's consent-mutation handlers and
// members.ts's own /mfa/reset route - this router was the one place that
// gate was missed.
router.use((req, res, next) => {
  if (req.impersonatorId !== undefined) {
    res.status(403).json({ error: 'forbidden_while_impersonating' });
    return;
  }
  next();
});

// In-memory challenge store for WebAuthn registration ceremonies, keyed by
// user id - short-lived (a few minutes at most, cleared on use) and scoped
// to one Express process. Acceptable because registration is a synchronous,
// same-session ceremony (unlike login, which must survive across container
// restarts - see mfaChallenge.ts's persisted device-trust cookie instead).
const pendingRegistrationChallenges = new Map<number, string>();

// Same in-memory, per-user, single-use-ceremony pattern as
// pendingRegistrationChallenges above, but kept in a separate map: a user
// could otherwise be mid-registration (adding a new passkey) and
// mid-proof (re-verifying to add/remove a different method) at the same
// time, and the two ceremonies must not overwrite each other's challenge.
const pendingProofChallenges = new Map<number, string>();

/**
 * Security gate (added after automated review flagged an account-persistence
 * hole): a stolen/hijacked bearer token alone can complete TOTP setup or
 * passkey registration end-to-end with no out-of-band step - unlike email
 * setup, which can't be completed without inbox access, so it doesn't need
 * this gate. Whenever the user already has ANY verified method, starting a
 * TOTP or passkey (re-)enrollment requires proving control of an existing
 * method first (a fresh TOTP code or a backup code - both always available
 * once any method is verified, since ensureBackupCodesExist below generates
 * codes the moment the first method verifies).
 */
async function verifyExistingMfaProof(userId: number, proof: unknown): Promise<boolean> {
  // Brute-force throttling (added after re-review flagged the TOTP branch as
  // unlimited-guess): both call sites gate access with a bearer token an
  // attacker may have stolen, so an unthrottled 6-digit TOTP guess is exactly
  // the threat this proof-gate exists to defend against. Reuses the generic
  // mfa_lockouts helper from Task 5 (isMfaLockedOut/recordFailedMfaAttempt/
  // resetMfaLockout), keyed per-user and scoped to this proof-check surface
  // specifically (distinct from a future login-challenge key) so it doesn't
  // share/contend with any other MFA lockout usage of the same user id.
  const lockoutKey = `mfa-proof:${userId}`;
  if (await isMfaLockedOut(lockoutKey)) {
    return false;
  }

  const p = proof as { method?: string; code?: string; response?: AuthenticationResponseJSON } | undefined;
  let proven = false;
  // Only a real totp/backup_code/passkey verification attempt should move
  // the lockout counter - any other/missing method (e.g. 'email', checked
  // via a completely separate verifyEmailOtp call by callers like
  // /backup-codes/regenerate) never touches mfa_totp_credentials,
  // consumeBackupCode, or mfa_passkey_credentials, so it must not count as
  // a failed guess here.
  let attempted = false;
  if (p?.method === 'totp') {
    attempted = true;
    const credential = await prisma.mfa_totp_credentials.findUnique({ where: { user_id: userId } });
    proven = credential !== null && credential.verified_at !== null && verifyEncryptedTotpCode(credential.encrypted_secret, String(p.code ?? ''));
  } else if (p?.method === 'backup_code') {
    attempted = true;
    // consumeBackupCode already fully consumes/checks the code with no
    // separate "was it a valid code" signal beyond its boolean return - any
    // `false` here is treated as a failed proof attempt, same as a wrong
    // TOTP code.
    proven = await consumeBackupCode(userId, String(p.code ?? ''));
  } else if (p?.method === 'passkey') {
    attempted = true;
    // One-time consumption regardless of outcome (unlike backup codes,
    // which have many distinct codes) - a WebAuthn challenge must never be
    // replayed, so a failed/missing attempt still burns it; the caller has
    // to re-request /proof/passkey/options before trying again.
    const challenge = pendingProofChallenges.get(userId);
    pendingProofChallenges.delete(userId);
    const response = p.response;
    if (challenge && response) {
      // Security: scope the credential lookup to THIS user, not just the
      // credential id from the response - unlike login (session.ts), which
      // legitimately discovers the user from the credential, a proof check
      // for an already-authenticated user must never accept a passkey
      // belonging to someone else's account.
      const credential = await prisma.mfa_passkey_credentials.findUnique({ where: { credential_id: response.id } });
      if (credential && credential.user_id === userId) {
        const verification = await verifyAuthentication(response, challenge, {
          id: credential.credential_id,
          publicKey: Buffer.from(credential.public_key, 'base64url'),
          counter: credential.sign_count,
        });
        if (verification.verified) {
          proven = true;
          await prisma.mfa_passkey_credentials.update({
            where: { id: credential.id },
            data: { sign_count: verification.authenticationInfo.newCounter, last_used_at: new Date() },
          });
        }
      }
    }
  }

  if (attempted) {
    if (proven) {
      await resetMfaLockout(lockoutKey);
    } else {
      await recordFailedMfaAttempt(lockoutKey);
    }
  }
  return proven;
}

router.post('/setup/start', async (req, res, next) => {
  try {
    const method = (req.body as { method?: unknown })?.method;
    const user = req.currentUser!;

    if (method === 'totp' || method === 'passkey') {
      const existingMethods = await getUserMfaMethods(user.id);
      if (existingMethods.length > 0) {
        const proof = (req.body as { proof?: unknown })?.proof;
        if (!(await verifyExistingMfaProof(user.id, proof))) {
          res.status(422).json({ error: 'unprocessable', detail: 'Bestehende MFA-Methode muss zur Bestätigung erneut verifiziert werden' });
          return;
        }
      }
    }

    if (method === 'totp') {
      const secret = generateTotpSecret();
      const now = new Date();
      await prisma.mfa_totp_credentials.upsert({
        where: { user_id: user.id },
        create: { user_id: user.id, encrypted_secret: encryptSecret(secret), created_at: now, updated_at: now },
        update: { encrypted_secret: encryptSecret(secret), verified_at: null, updated_at: now },
      });
      const otpauthUri = buildOtpauthUri(secret, user.email);
      res.status(200).json({ otpauth_uri: otpauthUri, qr_code_data_url: await renderTotpQrDataUrl(otpauthUri) });
      return;
    }

    if (method === 'email') {
      await sendEmailOtp(user.id, user.email, 'setup');
      res.status(200).json({});
      return;
    }

    if (method === 'passkey') {
      const existing = await prisma.mfa_passkey_credentials.findMany({ where: { user_id: user.id }, select: { credential_id: true } });
      const options = await buildRegistrationOptions({
        userId: user.id,
        email: user.email,
        existingCredentialIds: existing.map((c) => c.credential_id),
      });
      pendingRegistrationChallenges.set(user.id, options.challenge);
      res.status(200).json(options);
      return;
    }

    throw ApiError.badRequest(`unknown method: ${String(method)}`);
  } catch (err) {
    next(err);
  }
});

async function ensureBackupCodesExist(userId: number): Promise<string[] | null> {
  const existingCount = await prisma.mfa_backup_codes.count({ where: { user_id: userId } });
  if (existingCount > 0) return null;
  return generateBackupCodes(userId);
}

router.post('/setup/totp/verify', async (req, res, next) => {
  try {
    const user = req.currentUser!;
    const code = String((req.body as { code?: unknown })?.code ?? '');
    const credential = await prisma.mfa_totp_credentials.findUnique({ where: { user_id: user.id } });
    if (!credential) throw ApiError.notFound('no pending TOTP setup');

    if (!verifyTotpCode(decryptSecret(credential.encrypted_secret), code)) {
      res.status(422).json({ error: 'unprocessable', detail: 'Code ist ungültig' });
      return;
    }

    await prisma.mfa_totp_credentials.update({ where: { user_id: user.id }, data: { verified_at: new Date() } });
    const backupCodes = await ensureBackupCodesExist(user.id);
    res.status(200).json({ backup_codes: backupCodes ?? [] });
  } catch (err) {
    next(err);
  }
});

router.post('/setup/email/verify', async (req, res, next) => {
  try {
    const user = req.currentUser!;
    // Security: brute-force throttling, mirroring verifyExistingMfaProof's
    // isMfaLockedOut/recordFailedMfaAttempt/resetMfaLockout pattern just
    // above in this same file (and mfaChallenge.ts's identical pattern for
    // the login-time equivalent) - added after this endpoint was found to
    // have no lockout at all, unlike every other credential-guessing
    // surface in this codebase. A caller holding a stolen bearer token but
    // no access to the victim's real inbox could otherwise call
    // /setup/start {method:'email'} (delivers a real OTP to the victim's
    // real inbox, attacker never sees it) and brute-force the 6-digit code
    // here with unlimited guesses. Keyed `mfa-setup-email:${userId}`,
    // distinct from verifyExistingMfaProof's `mfa-proof:${userId}` and
    // mfaChallenge.ts's `mfa:${email}`, so a lockout on one surface never
    // blocks another. Deliberately returns the exact same 422 response as a
    // wrong code (not a distinct status) - matching this file's own
    // verifyExistingMfaProof callers, which are likewise indistinguishable
    // from a locked-out request, so a caller can't use the response shape
    // to learn whether they're merely wrong or already locked out.
    const lockoutKey = `mfa-setup-email:${user.id}`;
    if (await isMfaLockedOut(lockoutKey)) {
      res.status(422).json({ error: 'unprocessable', detail: 'Code ist ungültig' });
      return;
    }

    const code = String((req.body as { code?: unknown })?.code ?? '');
    if (!(await verifyEmailOtp(user.id, 'setup', code))) {
      await recordFailedMfaAttempt(lockoutKey);
      res.status(422).json({ error: 'unprocessable', detail: 'Code ist ungültig' });
      return;
    }
    await resetMfaLockout(lockoutKey);

    const now = new Date();
    await prisma.mfa_email_credentials.upsert({
      where: { user_id: user.id },
      create: { user_id: user.id, verified_at: now, created_at: now, updated_at: now },
      update: { verified_at: now, updated_at: now },
    });
    const backupCodes = await ensureBackupCodesExist(user.id);
    res.status(200).json({ backup_codes: backupCodes ?? [] });
  } catch (err) {
    next(err);
  }
});

router.post('/setup/passkey/verify', async (req, res, next) => {
  try {
    const user = req.currentUser!;
    const challenge = pendingRegistrationChallenges.get(user.id);
    if (!challenge) throw ApiError.badRequest('no pending passkey registration');

    const name = String((req.body as { name?: unknown })?.name ?? 'Passkey');
    const verification = await verifyRegistration(req.body.response, challenge);
    if (!verification.verified || !verification.registrationInfo) {
      res.status(422).json({ error: 'unprocessable', detail: 'Passkey-Registrierung fehlgeschlagen' });
      return;
    }

    pendingRegistrationChallenges.delete(user.id);
    const { credential } = verification.registrationInfo;
    const now = new Date();
    await prisma.mfa_passkey_credentials.create({
      data: {
        user_id: user.id,
        credential_id: credential.id,
        public_key: Buffer.from(credential.publicKey).toString('base64url'),
        sign_count: credential.counter,
        name,
        created_at: now,
        updated_at: now,
      },
    });
    const backupCodes = await ensureBackupCodesExist(user.id);
    res.status(200).json({ backup_codes: backupCodes ?? [] });
  } catch (err) {
    next(err);
  }
});

router.get('/status', async (req, res, next) => {
  try {
    const methods = await getUserMfaMethods(req.currentUser!.id);
    const mfaSettings = await getMfaSettings();
    const gracePeriodEndsAt = mfaSettings.mode === 'mandatory' ? computeGracePeriodEndsAt(mfaSettings) : null;
    res.status(200).json({
      methods,
      mode: mfaSettings.mode,
      grace_period_ends_at: gracePeriodEndsAt ? gracePeriodEndsAt.toISOString() : null,
    });
  } catch (err) {
    next(err);
  }
});

router.post('/backup-codes/regenerate', async (req, res, next) => {
  try {
    const user = req.currentUser!;
    const body = req.body as { method?: string; code?: string };

    // Per the design spec: regeneration must prove control of an existing
    // method, not just "has one enrolled" - otherwise a hijacked session
    // (not the account's actual owner) could silently invalidate the real
    // owner's saved backup codes. Reuses verifyExistingMfaProof's totp/
    // backup_code checks (with the verified_at fix), plus email is allowed
    // here specifically (unlike the /setup/start gate) since regenerate's
    // threat model is griefing, not account persistence - and proving via
    // email still requires actual inbox access, which a stolen bearer token
    // alone doesn't grant.
    let proven = await verifyExistingMfaProof(user.id, body);
    if (!proven && body.method === 'email') {
      // 'setup' purpose, not 'login' - matches the only OTP-sending path
      // that currently exists (POST /setup/start {method:'email'}); a
      // 'login'-purpose code isn't issued until Task 14's challenge flow
      // lands, so checking for one here would make this branch permanently
      // unreachable in the meantime.
      proven = await verifyEmailOtp(user.id, 'setup', String(body.code ?? ''));
    }

    if (!proven) {
      res.status(422).json({ error: 'unprocessable', detail: 'Code ist ungültig' });
      return;
    }

    const codes = await generateBackupCodes(user.id);
    res.status(200).json({ backup_codes: codes });
  } catch (err) {
    next(err);
  }
});

router.get('/trusted-devices', async (req, res, next) => {
  try {
    const devices = await prisma.mfa_trusted_devices.findMany({
      where: { user_id: req.currentUser!.id },
      select: { id: true, user_agent: true, last_ip: true, created_at: true, expires_at: true },
      orderBy: { created_at: 'desc' },
    });
    res.status(200).json({ devices });
  } catch (err) {
    next(err);
  }
});

router.delete('/trusted-devices/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const device = await prisma.mfa_trusted_devices.findUnique({ where: { id } });
    if (!device || device.user_id !== req.currentUser!.id) throw ApiError.notFound();
    await prisma.mfa_trusted_devices.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.get('/passkeys', async (req, res, next) => {
  try {
    const credentials = await prisma.mfa_passkey_credentials.findMany({
      where: { user_id: req.currentUser!.id },
      select: { credential_id: true, name: true, created_at: true, last_used_at: true },
      orderBy: { created_at: 'asc' },
    });
    res.status(200).json({
      credentials: credentials.map((c) => ({
        credential_id: c.credential_id,
        name: c.name,
        created_at: c.created_at.toISOString(),
        last_used_at: c.last_used_at ? c.last_used_at.toISOString() : null,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.post('/proof/passkey/options', async (req, res, next) => {
  try {
    const user = req.currentUser!;
    const credentials = await prisma.mfa_passkey_credentials.findMany({
      where: { user_id: user.id },
      select: { credential_id: true },
    });
    if (credentials.length === 0) throw ApiError.notFound();

    const options = await buildAuthenticationOptions({ allowCredentialIds: credentials.map((c) => c.credential_id) });
    pendingProofChallenges.set(user.id, options.challenge);
    res.status(200).json(options);
  } catch (err) {
    next(err);
  }
});

/**
 * Shared "don't strand a mandatory-MFA user at zero methods" guard. Also
 * reused as-is by Task 3's passkey-removal route (see its own
 * `removingLastPasskey` parameter below) - keep this signature stable.
 *
 * `removingLastPasskey` only matters when `methodBeingRemoved === 'passkey'`:
 * a user can have more than one passkey, so removing one passkey out of
 * several never brings them to zero methods on its own - the caller (Task 3)
 * computes whether the passkey being removed is the account's last one and
 * passes that in. totp/email removal always removes the credential entirely
 * (one row per user), so this task's two call sites never pass a third
 * argument and rely on the `true` default.
 */
async function wouldBeLastMethodAndMandatoryPastGrace(userId: number, methodBeingRemoved: 'totp' | 'email' | 'passkey', removingLastPasskey = true): Promise<boolean> {
  const currentMethods = await getUserMfaMethods(userId);
  const remainingMethods =
    methodBeingRemoved === 'passkey' && !removingLastPasskey
      ? currentMethods
      : currentMethods.filter((m) => m !== methodBeingRemoved);
  if (remainingMethods.length > 0) return false;

  const mfaSettings = await getMfaSettings();
  if (mfaSettings.mode !== 'mandatory') return false;
  const gracePeriodEndsAt = computeGracePeriodEndsAt(mfaSettings);
  return !gracePeriodEndsAt || gracePeriodEndsAt.getTime() < Date.now();
}

router.delete('/methods/:type', async (req, res, next) => {
  try {
    const user = req.currentUser!;
    const type = req.params.type as 'totp' | 'email';

    // Existence check (404) intentionally runs BEFORE the proof gate, not
    // after (this deviates from an earlier draft that checked proof first -
    // see this route's own history/task report for why: with proof-first,
    // a caller with zero credentials of `type` who also fails to prove any
    // *other* method got a 422 instead of a 404, which contradicts this
    // route's own test suite and the identical existence-then-verify
    // ordering setup/totp/verify above already uses). Safe to leak "you
    // don't have this method" ahead of the proof check because this is a
    // self-service action on the caller's own account - GET /mfa/status
    // already exposes exactly this information with no proof required.
    if (type === 'totp') {
      const credential = await prisma.mfa_totp_credentials.findUnique({ where: { user_id: user.id } });
      if (!credential || !credential.verified_at) throw ApiError.notFound();
    } else {
      const credential = await prisma.mfa_email_credentials.findUnique({ where: { user_id: user.id } });
      if (!credential || !credential.verified_at) throw ApiError.notFound();
    }

    const proof = (req.body as { proof?: unknown })?.proof;
    if (!(await verifyExistingMfaProof(user.id, proof))) {
      res.status(422).json({ error: 'unprocessable', detail: 'Bestehende MFA-Methode muss zur Bestätigung erneut verifiziert werden' });
      return;
    }

    if (await wouldBeLastMethodAndMandatoryPastGrace(user.id, type)) {
      res.status(422).json({ error: 'unprocessable', detail: 'Letzte MFA-Methode kann nicht entfernt werden' });
      return;
    }

    if (type === 'totp') {
      await prisma.mfa_totp_credentials.delete({ where: { user_id: user.id } });
    } else {
      await prisma.mfa_email_credentials.delete({ where: { user_id: user.id } });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Ordering here deliberately differs from the /methods/:type route above:
// :credentialId is an arbitrary WebAuthn credential id that could belong to
// ANY user, not just the caller (unlike /methods/:type, whose lookup is
// always scoped to req.currentUser.id). Proof is checked FIRST, and only
// once proof succeeds is the credential looked up and its ownership
// checked - both "doesn't exist" and "belongs to someone else" collapse
// into the same 404. This prevents an unauthenticated-of-target-account
// caller (holding only their own valid bearer token) from using this
// endpoint as a credential-id oracle: reordered to existence-first, an
// attacker could learn whether an arbitrary credential_id exists (and,
// combined with timing/other endpoints, whose it is) without ever proving
// control of their own account first.
router.delete('/methods/passkey/:credentialId', async (req, res, next) => {
  try {
    const user = req.currentUser!;
    const proof = (req.body as { proof?: unknown })?.proof;

    if (!(await verifyExistingMfaProof(user.id, proof))) {
      res.status(422).json({ error: 'unprocessable', detail: 'Bestehende MFA-Methode muss zur Bestätigung erneut verifiziert werden' });
      return;
    }

    const credential = await prisma.mfa_passkey_credentials.findUnique({ where: { credential_id: req.params.credentialId } });
    if (!credential || credential.user_id !== user.id) throw ApiError.notFound();

    const passkeyCount = await prisma.mfa_passkey_credentials.count({ where: { user_id: user.id } });
    if (await wouldBeLastMethodAndMandatoryPastGrace(user.id, 'passkey', passkeyCount === 1)) {
      res.status(422).json({ error: 'unprocessable', detail: 'Letzte MFA-Methode kann nicht entfernt werden' });
      return;
    }

    await prisma.mfa_passkey_credentials.delete({ where: { credential_id: req.params.credentialId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
