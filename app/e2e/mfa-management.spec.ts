import { test, expect } from '@playwright/test';
import { createHmac } from 'node:crypto';

/**
 * Decodes an RFC 4648 base32 string (no padding) - the alphabet
 * otplib's `authenticator.generateSecret()` uses for TOTP secrets
 * (api/src/lib/mfaTotp.ts's `generateTotpSecret`).
 */
function base32Decode(input: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const char of input.toUpperCase().replace(/=+$/, '')) {
    const value = alphabet.indexOf(char);
    if (value === -1) continue;
    bits += value.toString(2).padStart(5, '0');
  }
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/**
 * Hand-rolled RFC 6238 TOTP (HMAC-SHA1, 6 digits, 30s step) - the exact
 * defaults `otplib`'s `authenticator` (api/src/lib/mfaTotp.ts's real
 * generator/verifier) uses. `otplib` itself is only a dependency of `api`
 * (api/package.json), not resolvable from this `app` workspace package
 * under pnpm's strict node_modules layout (confirmed: `require('otplib')`
 * from `app/` throws MODULE_NOT_FOUND) - reimplemented directly here
 * instead of adding a new devDependency for ~15 lines of HMAC math.
 * Verified byte-for-byte against a real `otplib`-generated secret/code pair
 * before writing this file (same secret in, identical 6-digit code out).
 */
function generateTotpCode(secret: string, stepSeconds = 30, digits = 6): string {
  const counter = Math.floor(Date.now() / 1000 / stepSeconds);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const key = base32Decode(secret);
  const hmac = createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1]! & 0xf;
  const binCode =
    ((hmac[offset]! & 0x7f) << 24) |
    ((hmac[offset + 1]! & 0xff) << 16) |
    ((hmac[offset + 2]! & 0xff) << 8) |
    (hmac[offset + 3]! & 0xff);
  return (binCode % 10 ** digits).toString().padStart(digits, '0');
}

// test.fixme, not a plain `test`: this body is expected to fail partway
// through (see the "KNOWN, VERIFIED, UNRESOLVED BLOCKER" comment further
// down, right before the passkey ceremony step) for a reason that cannot be
// fixed from this file - api/src/lib/mfaPasskeys.ts hardcodes the WebAuthn
// expectedOrigin's scheme, which this suite's real http://localhost:5173
// origin can never satisfy. `test.fixme` skips executing the body entirely
// (unlike `test.fail`, which still runs it and only inverts pass/fail) -
// load-bearing here, not just a status label: this test is tagged
// `@shared-state` and mutates real, persisted state (AppConfig[:domain],
// e2e-council@example.org's MFA enrollment) with its cleanup/revert steps
// placed *after* the step that's expected to fail, so a genuine failed run
// would strand that state - and this repo's playwright.config.ts declares
// the 'parallel' project as `dependencies: ['shared-state']`, so a failed
// shared-state test skips the entire parallel project (~24 other spec
// files) at the remote checkpoint, masking any real regression there too.
// `test.fixme` avoids all of that: nothing in this body runs, nothing is
// mutated, the parallel project runs clean. Once
// api/src/lib/mfaPasskeys.ts's origin is made dev/e2e-configurable (see
// .superpowers/sdd/task-7-report.md's Concern 0 for the three options),
// remove `.fixme` to re-enable this test - and wrap the domain set/revert
// pair in try/finally at that point too, so a *future* failure (of some
// other, real kind) still can't strand AppConfig[:domain]='localhost'.
test.fixme(
  'a member with an existing TOTP method adds a passkey and can later remove the original method',
  { tag: '@shared-state' },
  async ({ page, context }) => {
    // Tagged @shared-state (see playwright.config.ts): this test permanently
    // changes e2e-council@example.org's real, persisted MFA enrollment
    // state (add TOTP, add passkey, remove TOTP, then - see the cleanup at
    // the very end of this test - remove the passkey too, restoring zero
    // methods). authorization-boundaries.spec.ts's own (non-shared-state)
    // "MemberOfCouncil" test logs into this same seeded account expecting a
    // plain, single-step password login with no MFA challenge - the
    // 'shared-state' project (workers: 1) runs this test to full completion,
    // cleanup included, before the 'parallel' project (which contains that
    // other spec) starts, so there's no window where a concurrently-running
    // test could observe this account mid-enrollment or left enrolled.

    // CDP virtual authenticator setup. There is no existing pattern to copy
    // in this repo (grep -n "addVirtualAuthenticator\|CDPSession\|virtual"
    // across app/e2e and api/e2e returns nothing) - this task's own brief
    // pointed at "Task 24's passkey-lockout e2e coverage" in app/e2e/
    // auth.spec.ts as the thing to copy, but per
    // .superpowers/sdd/progress.md's Task 24 entry, that coverage ended up
    // as a backend-only integration test (asserting two independent
    // mfa_lockouts rows), not a frontend WebAuthn ceremony - auth.spec.ts
    // itself has no passkey/authenticator code at all. This is therefore
    // freshly authored against the documented Chrome DevTools Protocol
    // WebAuthn domain (playwright-core's own bundled protocol.d.ts confirms
    // the exact method names/params used below), not reconstructed from an
    // existing example. Chromium-only (CDP), which matches this project's
    // playwright.config.ts (no browserName override -> defaults to chromium).
    const client = await context.newCDPSession(page);
    await client.send('WebAuthn.enable');
    await client.send('WebAuthn.addVirtualAuthenticator', {
      options: {
        protocol: 'ctap2',
        transport: 'internal',
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
        automaticPresenceSimulation: true,
      },
    });

    // WebAuthn's rpID must equal (or be a registrable suffix of) the page's
    // actual origin hostname, or the ceremony fails - either client-side (a
    // SecurityError, if the browser rejects it outright) or server-side
    // (api/src/lib/mfaPasskeys.ts's verifyRegistrationResponse, comparing
    // expectedOrigin against the real origin embedded in clientDataJSON).
    // api/src/lib/mfaPasskeys.ts's getRelyingPartyConfig derives rpID from
    // AppConfig[:domain], which - confirmed directly against
    // api/src/lib/appConfig.ts's DEFAULT_RAW_VALUES and pinned by
    // api/test/lib/mfaPasskeys.test.ts's own "derives rpID from
    // AppConfig[:domain]" test - defaults to 'logenhelfer.de' whenever no
    // row is seeded (never the literal `?? 'localhost'` fallback in that
    // function, which is effectively dead code given this default always
    // resolves truthy). No seeded e2e fixture sets AppConfig[:domain]
    // (api/e2e/seedFrontendE2e.ts only sets `lodge`/`impressum`), and this
    // suite's real browser origin is `http://localhost:5173`
    // (playwright.config.ts's baseURL) - 'logenhelfer.de' is not a suffix of
    // 'localhost', so the passkey ceremony below would fail without this.
    // Set (and, at the very end of this test, reverted) the same way
    // configuration.spec.ts/authorization-boundaries.spec.ts's own
    // shared-state test already flips global AppConfig fields through the
    // UI - confirmed via `grep -rn "domain\|logenhelfer.de" app/e2e/*.spec.ts`
    // that no other spec in this suite references AppConfig[:domain]'s value.
    await page.goto('/login');
    await page.getByLabel('E-Mail').fill('e2e-admin@example.org');
    await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
    await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();
    await page.goto('/configuration');
    await page.getByRole('tab', { name: 'Konfiguration' }).click();
    await page.getByLabel('Domain').fill('localhost');
    const setDomainSaveButton = page.getByRole('button', { name: 'Speichern' }).first();
    await setDomainSaveButton.click();
    await expect(setDomainSaveButton).toBeEnabled();
    await page.getByRole('button', { name: 'Abmelden' }).click();

    await page.goto('/login');
    await page.getByLabel('E-Mail').fill('e2e-council@example.org');
    await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
    await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

    await page.goto('/account/security');
    await expect(page.getByRole('heading', { name: 'Sicherheit verwalten' })).toBeVisible();

    // Step 1: no seeded fixture in api/e2e/seedFrontendE2e.ts ever enrolls
    // MFA for any user (confirmed by inspection - it seeds users/roles/
    // District/Event/AppConfig only) - enroll TOTP via the UI first, per
    // this task's own documented fallback.
    const totpStartResponse = page.waitForResponse(
      (res) => new URL(res.url()).pathname === '/api/v1/mfa/setup/start' && res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Authenticator App (TOTP)' }).click();
    const { otpauth_uri: totpOtpauthUri } = (await (await totpStartResponse).json()) as { otpauth_uri: string };
    const totpSecret = new URL(totpOtpauthUri).searchParams.get('secret');
    if (!totpSecret) throw new Error('otpauth_uri had no secret param');

    await expect(page.getByAltText('QR-Code zum Scannen mit deiner Authenticator-App')).toBeVisible();
    await page.getByLabel('Code').fill(generateTotpCode(totpSecret));
    const totpVerifyResponse = page.waitForResponse(
      (res) => new URL(res.url()).pathname === '/api/v1/mfa/setup/totp/verify' && res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Bestätigen' }).click();
    const { backup_codes: backupCodes } = (await (await totpVerifyResponse).json()) as { backup_codes: string[] };
    expect(backupCodes.length).toBeGreaterThan(0);
    await expect(page.getByRole('heading', { name: 'Fertig!' })).toBeVisible();
    await expect(page.locator('code').first()).toBeVisible();

    await page.getByRole('button', { name: 'Weiter zum Dashboard' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'Authenticator App' })).toBeVisible();

    // Steps 2-4: the virtual authenticator is already attached to `context`
    // above. Adding a passkey while a verified TOTP method already exists
    // triggers the proof dialog first.
    //
    // KNOWN, VERIFIED, UNRESOLVED BLOCKER (see .superpowers/sdd/task-7-report.md's
    // Concern 0 for the full trace): setting AppConfig[:domain]='localhost'
    // above fixes the *client-side* WebAuthn rpID check (the browser would
    // otherwise reject the ceremony outright with a SecurityError, since
    // 'logenhelfer.de' - the unseeded default - is not a suffix of
    // 'localhost'). It does NOT fix the *server-side* origin check:
    // api/src/lib/mfaPasskeys.ts hardcodes `origin: \`https://${rpID}\``, so
    // expectedOrigin becomes 'https://localhost' regardless of what
    // AppConfig[:domain] is set to, while this suite's real browser origin
    // is 'http://localhost:5173' (playwright.config.ts's baseURL) - a
    // different scheme AND port. @simplewebauthn/server's
    // verifyRegistrationResponse does an exact string comparison
    // (`origin !== expectedOrigin`) and throws on any mismatch (confirmed by
    // reading node_modules/.pnpm/@simplewebauthn+server@13.3.2/.../
    // verifyRegistrationResponse.js directly) - no AppConfig[:domain] value
    // can express a scheme or port, so this cannot be worked around from
    // this test file. The passkey verify step below is therefore expected to
    // fail (a toast, not the 'Fertig!' heading) until either
    // api/src/lib/mfaPasskeys.ts's origin is made dev/e2e-configurable, or
    // this suite is served over https - both out of this task's stated
    // scope ("no new application code", e2e tests only). Left in place
    // rather than removed/mocked, since the ceremony logic itself is
    // correct and this is the most useful documentation of exactly what's
    // missing for a future task to pick up.
    await page.getByRole('button', { name: 'Passkey', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Bestätige deine Identität')).toBeVisible();
    await page.getByRole('dialog').getByLabel('Code').fill(generateTotpCode(totpSecret));
    const passkeyVerifyResponse = page.waitForResponse(
      (res) => new URL(res.url()).pathname === '/api/v1/mfa/setup/passkey/verify' && res.request().method() === 'POST',
    );
    await page.getByRole('dialog').getByRole('button', { name: 'Bestätigen' }).click();
    await passkeyVerifyResponse;

    // Step 5: the passkey registration ceremony completes via the virtual
    // authenticator (automaticPresenceSimulation + isUserVerified above mean
    // no real user gesture is needed) and the wizard reaches its "done"
    // step. This second enrollment's own backup_codes response is empty
    // ([]) - api/src/routes/mfa.ts's `ensureBackupCodesExist` only ever
    // returns real codes the *first* time any method is verified for an
    // account, so only the heading/warning is asserted here, not specific
    // codes; the real codes captured above (from the TOTP step) are what
    // gets used for this test's own cleanup at the end.
    await expect(page.getByRole('heading', { name: 'Fertig!' })).toBeVisible();
    await page.getByRole('button', { name: 'Weiter zum Dashboard' }).click();

    // Step 6: reload - both methods present from a clean server fetch, not
    // just client-side cache.
    await page.reload();
    await expect(page.getByRole('listitem').filter({ hasText: 'Authenticator App' })).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'Passkey' })).toBeVisible();

    // Step 7: remove the TOTP method with a fresh code (still valid - the
    // credential isn't removed until submission succeeds).
    await page
      .getByRole('listitem')
      .filter({ hasText: 'Authenticator App' })
      .getByRole('button', { name: 'Entfernen' })
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByLabel('Code').fill(generateTotpCode(totpSecret));
    await page.getByRole('dialog').getByRole('button', { name: 'Bestätigen' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'Authenticator App' })).toHaveCount(0);

    // Step 8: reload - only the passkey remains.
    await page.reload();
    await expect(page.getByRole('listitem').filter({ hasText: 'Authenticator App' })).toHaveCount(0);
    await expect(page.getByRole('listitem').filter({ hasText: 'Passkey' })).toBeVisible();

    // Cleanup (not in this task's illustrative brief, but required - see
    // this test's own @shared-state comment above): remove the passkey too,
    // restoring e2e-council@example.org to zero MFA methods for whatever
    // spec or future run relies on that starting state next (including a
    // re-run of this very test). The TOTP credential is already gone by
    // this point, so a backup code captured during the TOTP step above is
    // the only remaining proof mechanism.
    const passkeyRow = page.getByRole('listitem').filter({ hasText: 'Passkey' });
    await passkeyRow.getByRole('button', { name: 'Entfernen' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('dialog').getByRole('combobox', { name: 'Methode' }).click();
    await page.getByRole('option', { name: 'Backup-Code' }).click();
    await page.getByRole('dialog').getByLabel('Code').fill(backupCodes[0]!);
    await page.getByRole('dialog').getByRole('button', { name: 'Bestätigen' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'Passkey' })).toHaveCount(0);

    // Revert AppConfig[:domain] to the real default (see this test's own
    // comment above, next to where it was set to 'localhost').
    await page.getByRole('button', { name: 'Abmelden' }).click();
    await page.goto('/login');
    await page.getByLabel('E-Mail').fill('e2e-admin@example.org');
    await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
    await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();
    await page.goto('/configuration');
    await page.getByRole('tab', { name: 'Konfiguration' }).click();
    await page.getByLabel('Domain').fill('logenhelfer.de');
    const restoreDomainSaveButton = page.getByRole('button', { name: 'Speichern' }).first();
    await restoreDomainSaveButton.click();
    await expect(restoreDomainSaveButton).toBeEnabled();
  },
);

// test.fixme, not a plain `test`: same reasoning as the passkey ceremony
// test above (this body never executes, nothing is mutated), but for a
// DIFFERENT, independently-verified blocker that only surfaced while
// building this file's real coverage below - see
// .superpowers/sdd/task-7-report.md's "Second blocker" section (appended
// 2026-08-01) for the full trace. Short version: adding 'email' as a second
// method has no WebAuthn/origin problem at all (api/src/features/mfa/
// MfaSetupWizard.tsx's `choose()` doesn't even gate it behind the proof
// dialog - see that function's own `if ((method === 'totp' || method ===
// 'passkey') && existingMethods.length > 0)` check, which 'email' never
// matches) - but the 6-digit code itself is never observable from outside
// the api process in this test environment:
//   - POST /api/v1/mfa/setup/start's 'email' branch (api/src/routes/mfa.ts)
//     responds with a bare `{}` - unlike the 'totp' branch, which returns
//     otpauth_uri (and therefore the secret) directly in the response body,
//     nothing about the emailed code is ever sent back to the client.
//   - api/src/lib/mail.ts's console-transport fallback (the one active here -
//     bin/test-gate's ephemeral stack sets neither MAIL_TRANSPORT nor
//     SMTP_HOST, so resolveMailTransportMode() returns 'console') only logs
//     `to`/`subject` (`console.log(\`[mail:noop] to=... subject=...\`)`) -
//     the actual code lives solely in `message.text`, which is never logged
//     anywhere reachable by this test.
//   - e2e-council@example.org's domain (@example.org, RFC 2606 reserved) has
//     no real inbox to check even where a real SMTP relay is configured
//     (e.g. .env.next), and bin/test-gate's ephemeral compose project never
//     reads .env.next anyway (dcg's --env-file is a throwaway temp file - see
//     bin/test-gate itself), so there is no environment in this project's
//     current test topology where this code is observable end-to-end.
// This exact class of gap already has precedent in this repo:
// app/e2e/forgot-password.spec.ts's own top-of-file comment documents that
// its mail-delivered reset token is "never observable from outside the
// process, by design" and deliberately limits its e2e coverage to what a
// real browser can observe without seeing mail contents - this test hits
// the identical wall for the email MFA OTP. Not fixable from this file:
// would need either (a) a new, strictly test/console-mode-gated app seam
// that surfaces the OTP for observability (mirroring Concern 0's option 1
// for the passkey origin), or (b) mocking the network response (which the
// orchestrator's brief for this file explicitly ruled out - the whole point
// was a real, non-mocked add-a-second-method flow). Left in place (rather
// than deleted) as documentation of exactly where the reachable UI/API
// surface ends, matching this file's existing passkey-fixme test's own
// "document the intended flow up to the verified blocker" convention.
test.fixme(
  'a member with an existing TOTP method adds an email method and can later remove the original method',
  { tag: '@shared-state' },
  async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('E-Mail').fill('e2e-council@example.org');
    await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
    await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

    await page.goto('/account/security');
    await expect(page.getByRole('heading', { name: 'Sicherheit verwalten' })).toBeVisible();

    // Step 1: enroll TOTP as the first method (identical to the passkey
    // fixme test above - real, working reference code, kept here so this
    // test reads as a complete, standalone flow rather than depending on
    // the other fixme test having "already" run, which test.fixme never
    // does anyway).
    const totpStartResponse = page.waitForResponse(
      (res) => new URL(res.url()).pathname === '/api/v1/mfa/setup/start' && res.request().method() === 'POST',
    );
    await page.getByRole('button', { name: 'Authenticator App (TOTP)' }).click();
    const { otpauth_uri: totpOtpauthUri } = (await (await totpStartResponse).json()) as { otpauth_uri: string };
    const totpSecret = new URL(totpOtpauthUri).searchParams.get('secret');
    if (!totpSecret) throw new Error('otpauth_uri had no secret param');
    await page.getByLabel('Code').fill(generateTotpCode(totpSecret));
    await page.getByRole('button', { name: 'Bestätigen' }).click();
    await expect(page.getByRole('heading', { name: 'Fertig!' })).toBeVisible();
    await page.getByRole('button', { name: 'Weiter zum Dashboard' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'Authenticator App' })).toBeVisible();

    // Step 2: start email enrollment. Unlike passkey/totp re-enrollment,
    // this is NOT gated behind MfaProofDialog - MfaSetupWizard.tsx's
    // `choose()` only intercepts 'totp'/'passkey' when existingMethods.length
    // > 0, so this goes straight to `startTotpOrEmail('email')`.
    await page.getByRole('button', { name: 'E-Mail', exact: true }).click();
    await expect(page.getByText('Wir haben dir einen Code per E-Mail geschickt.')).toBeVisible();

    // KNOWN, VERIFIED, UNRESOLVED BLOCKER (see this test's own top-of-file
    // comment block for the full trace): there is no way to obtain the real
    // 6-digit code that was just emailed from anywhere this test can observe,
    // so the flow cannot proceed past this point. Left here rather than
    // continued with a fabricated code - unlike the passkey test above
    // (whose blocked step already has a well-defined single fix), there is
    // no "just compute the right value" continuation available here at all;
    // resolving this needs a product/tooling decision first (see the
    // blocker comment above for the two options), not just a code change to
    // this test.
  },
);

// Real, executable coverage for the "remove a method" half of this plan's
// core deliverable (see .superpowers/sdd/task-7-report.md's "Second
// blocker" section for why the "add a second method" half can't be made
// real for either candidate method - 'passkey' hits Concern 0's WebAuthn
// origin wall, 'email' hits the OTP-observability wall documented in the
// fixme test right above this one). This test doesn't add a second method
// at all - it enrolls TOTP as the account's ONLY method, then removes it
// again with a fresh TOTP code, through the exact same real
// POST /api/v1/mfa/setup/start -> POST /api/v1/mfa/setup/totp/verify ->
// DELETE /api/v1/mfa/methods/totp round trip a real user would drive,
// ending back at zero enrolled methods (the same starting state
// authorization-boundaries.spec.ts's "MemberOfCouncil" test - which shares
// this account - already assumes). Removing the account's only method
// succeeds here because mfa_mode defaults to 'optional'
// (api/src/lib/appConfig.ts's DEFAULT_RAW_VALUES; api/e2e/seedFrontendE2e.ts
// never overrides it) - wouldBeLastMethodAndMandatoryPastGrace
// (api/src/routes/mfa.ts) only blocks a last-method removal when
// mfa_mode==='mandatory' AND the grace period has elapsed, neither of which
// is true here. That mandatory-and-elapsed case is exactly what the next
// test (mocked GET /mfa/status) covers instead.
//
// @shared-state for the same reason as the two fixme tests above: this
// mutates e2e-council@example.org's real, persisted MFA enrollment for the
// duration of the test. Fully round-trips back to zero methods before the
// test ends, so the 'parallel' project (which starts only once every
// 'shared-state' test, this one included, has finished - see
// playwright.config.ts) never observes this account mid-enrollment.
test('a member enrolls TOTP and can remove it again with a fresh code, ending at zero methods', { tag: '@shared-state' }, async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e-council@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  await page.goto('/account/security');
  await expect(page.getByRole('heading', { name: 'Sicherheit verwalten' })).toBeVisible();

  // Enroll TOTP (identical pattern to the fixme tests above - real,
  // verified reference code): capture the real otpauth secret off the real
  // POST /api/v1/mfa/setup/start response, generate a real current code for
  // it, submit.
  const totpStartResponse = page.waitForResponse(
    (res) => new URL(res.url()).pathname === '/api/v1/mfa/setup/start' && res.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Authenticator App (TOTP)' }).click();
  const { otpauth_uri: totpOtpauthUri } = (await (await totpStartResponse).json()) as { otpauth_uri: string };
  const totpSecret = new URL(totpOtpauthUri).searchParams.get('secret');
  if (!totpSecret) throw new Error('otpauth_uri had no secret param');

  await expect(page.getByAltText('QR-Code zum Scannen mit deiner Authenticator-App')).toBeVisible();
  await page.getByLabel('Code').fill(generateTotpCode(totpSecret));
  const totpVerifyResponse = page.waitForResponse(
    (res) => new URL(res.url()).pathname === '/api/v1/mfa/setup/totp/verify' && res.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Bestätigen' }).click();
  const { backup_codes: backupCodes } = (await (await totpVerifyResponse).json()) as { backup_codes: string[] };
  expect(backupCodes.length).toBeGreaterThan(0);
  await expect(page.getByRole('heading', { name: 'Fertig!' })).toBeVisible();
  await expect(page.locator('code').first()).toBeVisible();

  await page.getByRole('button', { name: 'Weiter zum Dashboard' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'Authenticator App' })).toBeVisible();

  // Reload - the enrolled method persisted server-side, not just in client
  // cache.
  await page.reload();
  await expect(page.getByRole('listitem').filter({ hasText: 'Authenticator App' })).toBeVisible();

  // Remove it again with a fresh TOTP code (still valid - the credential
  // isn't removed until the DELETE actually succeeds). This is the real,
  // non-mocked round trip: proof dialog opens, a fresh code is submitted,
  // DELETE /api/v1/mfa/methods/totp succeeds (allowed because mfa_mode is
  // 'optional' by default - see this test's own top comment), and the row
  // disappears from the list.
  await page
    .getByRole('listitem')
    .filter({ hasText: 'Authenticator App' })
    .getByRole('button', { name: 'Entfernen' })
    .click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('Bestätige deine Identität')).toBeVisible();
  await page.getByRole('dialog').getByLabel('Code').fill(generateTotpCode(totpSecret));
  await page.getByRole('dialog').getByRole('button', { name: 'Bestätigen' }).click();
  await expect(page.getByRole('listitem').filter({ hasText: 'Authenticator App' })).toHaveCount(0);

  // Reload - the removal persisted server-side too, restoring
  // e2e-council@example.org to zero MFA methods for whatever spec or future
  // run relies on that starting state next (including a re-run of this very
  // test).
  await page.reload();
  await expect(page.getByRole('listitem').filter({ hasText: 'Authenticator App' })).toHaveCount(0);
});

test('removing the only enrolled method is blocked once mandatory MFA\'s grace period has passed', async ({ page }) => {
  // This test does NOT flip the real, global mfa_mode AppConfig value to
  // mandatory (unlike this task's illustrative brief, which assumed that
  // was the way to reach this state - see .superpowers/sdd/task-7-report.md
  // for the full reasoning). Doing so for real would require the admin
  // account performing the PATCH /api/v1/app_config to itself already hold
  // a verified MFA method, or it immediately locks itself out too: once
  // mode=mandatory and the grace period has elapsed,
  // api/src/auth/middleware.ts's authenticateApiUser 403s *every* route
  // except /api/v1/mfa/* and GET /api/v1/me for any zero-method user -
  // including PATCH /api/v1/app_config itself, which isn't allowlisted. No
  // seeded e2e fixture has any MFA method, so the flipping admin would need
  // its own throwaway enrollment first, and the resulting choreography
  // (real login/logout cycles across two seeded accounts, two live MFA
  // credentials, and careful ordering to never leave global config in a
  // state that would break every other spec file's admin login) is a
  // real, pre-existing product hazard worth flagging, not something to
  // route around by re-implementing it inside an unrunnable e2e test.
  //
  // Instead, this test controls exactly what it's actually responsible for
  // - MfaSetupWizard.tsx's client-side `removalBlocked` computation, purely
  // a function of GET /mfa/status's response - by mocking that endpoint,
  // the same `page.route` technique this file's sibling
  // (authorization-boundaries.spec.ts's "dashboard MFA banner shows
  // demo-restricted message" test) already uses to force a config state
  // the real backend isn't in. The server-side 422 enforcement for this
  // same condition (wouldBeLastMethodAndMandatoryPastGrace) is already
  // covered directly against a real database by api/test/routes/mfa.test.ts
  // (Tasks 2 and 3 of this plan) - this test's job is the frontend control,
  // not re-proving the backend rule.
  await page.route(
    '**/api/v1/mfa/status',
    (route) => route.fulfill({
      json: { methods: ['totp'], mode: 'mandatory', grace_period_ends_at: '2020-01-01T00:00:00.000Z' },
    }),
  );
  await page.route('**/api/v1/mfa/passkeys', (route) => route.fulfill({ json: { credentials: [] } }));

  // e2e@example.org has zero *real* enrolled MFA methods (no seeded fixture
  // ever enrolls one, and mfa_mode defaults to optional - see
  // authorization-boundaries.spec.ts's identical comment on its own
  // demo-banner test) - it logs in with a plain, single-step password
  // login, with no real MFA challenge to also account for here. The mocked
  // GET /mfa/status above is what makes MfaSetupWizard believe otherwise
  // once it loads /account/security.
  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  await page.goto('/account/security');
  await expect(page.getByRole('heading', { name: 'Sicherheit verwalten' })).toBeVisible();

  const totpRow = page.getByRole('listitem').filter({ hasText: 'Authenticator App' });
  await expect(totpRow).toBeVisible();
  const removeButton = totpRow.getByRole('button', { name: 'Entfernen' });

  // Real, shipped behavior (MfaSetupWizard.tsx): once removalBlocked is
  // true, the "Entfernen" button is disabled outright with an explanatory
  // tooltip - it never lets a click through to the proof dialog/a 422 round
  // trip the way this task's illustrative brief originally imagined. That
  // pre-emption is what's actually being asserted here.
  await expect(removeButton).toBeDisabled();
  await removeButton.hover({ force: true });
  await expect(
    page.getByText('Die letzte Methode kann nicht entfernt werden, solange Zwei-Faktor-Authentifizierung verpflichtend ist.'),
  ).toBeVisible();

  // The method was never removed - the disabled button cannot submit anything.
  await expect(totpRow).toBeVisible();
});
