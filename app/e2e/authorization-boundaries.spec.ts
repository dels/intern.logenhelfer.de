import { test, expect } from '@playwright/test';

async function login(page, email: string) {
  await page.goto('/login');
  await page.getByLabel('E-Mail').fill(email);
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  // exact: true - LoginPage now also renders a "Mit Passkey anmelden"
  // button (this task series' MFA work); Playwright's default getByRole
  // name match is a case-insensitive substring, so the un-anchored
  // 'Anmelden' query used to match both buttons ("Anmelden" and "Mit
  // Passkey anmelden" both contain "anmelden") and threw a strict-mode
  // violation - a pre-existing regression in this helper found while
  // adding this file's own new MFA-related tests below, not something
  // either of the two new tests exercises directly. account.spec.ts has an
  // identical inline copy of this same ambiguous selector - out of this
  // task's file boundaries, left for a follow-up.
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();
}

test('a plain member has no Settings nav entry, and direct navigation to /configuration is refused cleanly', async ({ page }) => {
  await login(page, 'e2e@example.org');

  await expect(page.getByRole('link', { name: 'Einstellungen' })).toHaveCount(0);

  await page.goto('/configuration');
  await expect(page.getByText('Sie haben keine Berechtigung, die Konfiguration zu bearbeiten.')).toBeVisible();
  await expect(page.getByLabel('Vereinsname')).toHaveCount(0);
});

test('a plain member has no login-activity nav entry, and direct navigation to /statistics/user-stats is refused cleanly', async ({ page }) => {
  await login(page, 'e2e@example.org');

  await page.getByRole('link', { name: 'Statistiken' }).click();
  await expect(page.getByRole('link', { name: 'Anmeldeaktivität' })).toHaveCount(0);

  await page.goto('/statistics/user-stats');
  await expect(page.getByText('Sie haben keine Berechtigung, diese Statistik einzusehen.')).toBeVisible();
});

test('a MemberOfCouncil sees login activity but still has no Settings access (boundary is per-role, not just logged-in-vs-not)', async ({ page }) => {
  await login(page, 'e2e-council@example.org');

  await page.getByRole('link', { name: 'Statistiken' }).click();
  await page.getByRole('link', { name: 'Anmeldeaktivität' }).click();
  await expect(page.getByRole('heading', { name: 'Anmeldeaktivität' })).toBeVisible();

  await expect(page.getByRole('link', { name: 'Einstellungen' })).toHaveCount(0);
  await page.goto('/configuration');
  await expect(page.getByText('Sie haben keine Berechtigung, die Konfiguration zu bearbeiten.')).toBeVisible();
});

test('Konfiguration section is absent for a plain member and present for an admin', async ({ page }) => {
  await login(page, 'e2e@example.org');
  await expect(page.getByText('Konfiguration')).toHaveCount(0);

  await login(page, 'e2e-admin@example.org');
  await expect(page.getByText('Konfiguration')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Einstellungen' })).toBeVisible();
});

test('a plain member sees no external-events create control, and direct navigation to /external-events/new does not allow a working create flow', async ({ page }) => {
  await login(page, 'e2e@example.org');

  // The standalone /external-events list page (and its "Neuer externer
  // Termin" create button) was removed once the Arbeitsplan header/filter
  // restructure merged the external-events list into EventsListTable on
  // /events - this deny-side check now targets that page's replacement
  // control, "Neuer Termin außer Haus". The old bare /external-events route
  // falls through to the app's catch-all 404 now, worth asserting too so
  // this test also catches the route ever silently coming back.
  await page.goto('/external-events');
  await expect(page.getByRole('heading', { name: 'Seite nicht gefunden' })).toBeVisible();

  // Wait for a real render marker (the page's own h1) before the
  // toHaveCount(0) check below, not just the bare navigation - toHaveCount(0)
  // resolves immediately (vacuously true) on a still-loading or blank page,
  // so without an explicit positive wait first, this goto's session-refresh
  // round-trip (each page.goto here is a full page reload, so AuthProvider
  // re-mounts and re-derives the session from the refresh cookie every
  // time) can still be in flight when the very next goto below fires and
  // aborts it - the refresh token had already rotated server-side by then,
  // so the following attempt 401s and RequireAuth bounces to /login,
  // breaking the next step non-deterministically (found by actually
  // reproducing this flake, not guessed).
  await page.goto('/events');
  await expect(page.getByRole('heading', { name: 'Arbeitsplan' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Neuer Termin außer Haus' })).toHaveCount(0);

  // ExternalEventCreatePage has no client-side ability gate - same shape as
  // EventCreatePage.tsx/AnnouncementCreatePage.tsx (both also ungated, the
  // backend's ability check is the sole enforcement point). So the form
  // renders regardless of role; what must fail is the actual submit, which
  // externalEvents.ts's POST / route rejects via `can('create', 'ExternalEvent')`.
  await page.goto('/external-events/new');
  await page.getByLabel(/Titel/).fill('Sollte abgelehnt werden');
  await page.getByLabel(/Loge/).fill('Loge');
  await page.getByLabel(/Ort/).fill('Ort');
  await page.getByLabel(/Datum/).fill('2027-01-01');
  await page.getByLabel(/Beginn/).fill('19:00');
  await page.getByRole('button', { name: 'Speichern' }).click();

  await expect(page.getByRole('alert')).toContainText('403');
  await expect(page).toHaveURL(/\/external-events\/new$/);
});

test('a plain member has no Externe ICS-Kalender nav entry, and direct navigation to /external-event-ics-sources does not allow a working add flow', async ({ page }) => {
  await login(page, 'e2e@example.org');

  await expect(page.getByRole('link', { name: 'Externe ICS-Kalender' })).toHaveCount(0);

  // Same shape as the external-events create page above: no client-side
  // gate on ExternalEventIcsSourcesPage.tsx, the backend's
  // `can('manage', 'ExternalEvent')` check (externalEventIcsSources.ts)
  // rejects both the (silently swallowed) list GET and the add POST - the
  // add POST's rejection is the one surfaced to the user as an error alert.
  await page.goto('/external-event-ics-sources');
  await page.getByLabel('Name').fill('Sollte abgelehnt werden');
  await page.getByLabel('URL').fill('https://example.org/calendar.ics');
  await page.getByRole('button', { name: 'Hinzufügen' }).click();

  await expect(page.getByRole('alert')).toContainText('403');
});

test(
  'an admin can disable users_can_view_statistics, hiding the Statistiken nav entry from a plain member',
  { tag: '@shared-state' },
  async ({ page }) => {
    // Tagged @shared-state (see playwright.config.ts): this toggles an
    // app-wide AppConfig flag the two 'Statistiken'-nav tests above (and
    // statistics.spec.ts, in a different file) assume is enabled. The
    // 'shared-state' project runs this to completion - full
    // disable-then-restore cycle - before the 'parallel' project (which
    // contains those other tests) starts, so there's no window where a
    // concurrently-running test could observe the flag disabled.
    await login(page, 'e2e-admin@example.org');
    await page.goto('/configuration');
    await expect(page.getByRole('heading', { name: 'Anwendungs-Konfiguration' })).toBeVisible();

    const statisticsSwitch = page.getByRole('switch', { name: 'Statistiken für alle Mitglieder sichtbar' });

    // Normalize to enabled first (same defensive pattern as
    // announcements.spec.ts's subscribeSwitch test) - this flag persists
    // across runs on the shared e2e DB.
    if (!(await statisticsSwitch.isChecked())) {
      await statisticsSwitch.click();
      const saveButton = page.getByRole('button', { name: 'Speichern' }).first();
      await saveButton.click();
      // Wait for the save mutation to actually settle (the button is
      // disabled via useUpdateAppConfig()'s isPending while in flight)
      // before reloading - without this, reload() can race ahead of the
      // PATCH and re-fetch the pre-save value, exactly what the assertion
      // right after is trying to check.
      await expect(saveButton).toBeEnabled();
      await page.reload();
      await expect(statisticsSwitch).toBeChecked();
    }

    await statisticsSwitch.click();
    const saveButton = page.getByRole('button', { name: 'Speichern' }).first();
    await saveButton.click();
    // See the if-block above: wait for the save mutation to settle before
    // reloading, or reload() can race ahead of the PATCH.
    await expect(saveButton).toBeEnabled();
    await page.reload();
    await expect(statisticsSwitch).not.toBeChecked();

    await page.getByRole('button', { name: 'Abmelden' }).click();

    await login(page, 'e2e@example.org');
    await expect(page.getByRole('link', { name: 'Statistiken' })).toHaveCount(0);

    await page.goto('/statistics/mem-stats');
    await expect(page.getByText('Sie haben keine Berechtigung, diese Statistik einzusehen.')).toBeVisible();

    await page.getByRole('button', { name: 'Abmelden' }).click();

    // Restore the flag so the two 'Statistiken'-nav tests above (and
    // statistics.spec.ts) see it enabled, matching their assumption.
    await login(page, 'e2e-admin@example.org');
    await page.goto('/configuration');
    if (!(await statisticsSwitch.isChecked())) {
      await statisticsSwitch.click();
      const saveButton = page.getByRole('button', { name: 'Speichern' }).first();
      await saveButton.click();
      // Wait for the save mutation to actually settle (the button is
      // disabled via useUpdateAppConfig()'s isPending while in flight)
      // before reloading - without this, reload() can race ahead of the
      // PATCH and re-fetch the pre-save value, exactly what the assertion
      // right after is trying to check.
      await expect(saveButton).toBeEnabled();
      await page.reload();
      await expect(statisticsSwitch).toBeChecked();
    }
  },
);

test('an admin (WorshipfulMaster grant) sees the Seekers nav link and can use it', async ({ page }) => {
  await login(page, 'e2e-admin@example.org');

  // exact: true - the dashboard's Seekers stat card is now also a link (to
  // /seekers or /seekers/names), whose accessible name includes the count
  // (e.g. "0 Suchende"), so a substring match would hit both it and the
  // sidebar nav link this test actually means to exercise.
  await expect(page.getByRole('link', { name: 'Suchende', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Suchende', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Suchende' })).toBeVisible();
});

test('a plain member has no Seekers nav entry, and direct navigation to /seekers shows a clean forbidden message', async ({ page }) => {
  await login(page, 'e2e@example.org');

  await expect(page.getByRole('link', { name: 'Suchende' })).toHaveCount(0);

  await page.goto('/seekers');
  await expect(page.getByText('Sie haben keine Berechtigung, die Suchenden einzusehen.')).toBeVisible();
});

test('dashboard MFA banner shows demo-restricted message on click, in demo mode', async ({ page }) => {
  // Forces the frontend's own demo-mode detection (useDemoMode ->
  // GET /api/v1/health) without needing a real DEMO_MODE-enabled backend -
  // same technique MfaSetupBanner.test.tsx already uses via an msw handler,
  // just exercised here against the real running dev server/API instead of
  // a mocked one. No other app/e2e spec mocks/toggles DEMO_MODE - route
  // interception is the only lever available at this layer, since the real
  // server's own DEMO_MODE env var is fixed for the whole process.
  await page.route('**/api/v1/health', (route) => route.fulfill({ json: { status: 'ok', demo: true } }));

  let setupStartRequested = false;
  await page.route('**/api/v1/mfa/setup/start', (route) => {
    setupStartRequested = true;
    return route.continue();
  });

  // e2e@example.org has zero enrolled MFA methods (no app/e2e spec ever
  // completes an MFA setup flow on any frontend-seeded user), and mfa_mode
  // defaults to optional (seedFrontendE2e.ts never sets it) - so
  // MfaSetupBanner renders its dismissible CTA on a fresh dashboard load.
  await login(page, 'e2e@example.org');

  await page.getByRole('button', { name: 'Jetzt einrichten' }).click();
  // Scoped to the exact MFA-demo-restriction copy (i18n key
  // mfa.demoUnavailable), not a loose /demo/i match: mocking
  // GET /api/v1/health with demo:true also makes the app's own
  // always-present DemoBanner render ("Dies ist eine Demo-Umgebung..."),
  // so an unscoped /demo/i text match resolves to two elements and throws a
  // strict-mode violation - found by actually running this test, not
  // apparent from reading the diff alone.
  await expect(page.getByText('MFA ist in der Demo-Umgebung nicht verfügbar.')).toBeVisible();
  expect(setupStartRequested).toBe(false);
});

test.describe('member-list MFA shield icon visibility', () => {
  // MemberAccordionList.tsx (and its shield icon) only renders on
  // MembersListPage's mobile branch (`!isDesktop`, MUI's default `md`
  // breakpoint = 900px, see theme.ts) - the desktop branch renders a plain
  // DataTable grid with no MFA column at all. Without narrowing the
  // viewport below 900px here, this test would see no shield icon for
  // EITHER user and the admin assertion below would fail for an unrelated
  // reason. Matches mobile-nav.spec.ts's own `test.use({ viewport: ... })`
  // convention for the same breakpoint.
  test.use({ viewport: { width: 500, height: 900 } });

  test('member-list MFA icon only renders for a user who can edit members', async ({ page }) => {
    // Deviation from this task's brief: "assert no shield icon is present
    // anywhere on the page" for a plain member is not actually correct
    // given this app's real ability model - default_user_abilities grants
    // every logged-in user `can('update', 'User', {id: user.id})`
    // unconditionally (ability.ts), so `can_edit` (and therefore the
    // shield icon) is also true on a plain member's OWN row in this same
    // list. Asserting "zero icons anywhere" would fail for a reason
    // unrelated to what this test means to prove (self-edit ability is
    // correct/intended, not a bug). Scoped instead to a specific OTHER
    // member's row (E2E Admin, visible to a plain member too since
    // show_admins defaults true) - not editable by a plain member, so it
    // must show no icon there, while an admin (who can edit anyone) must
    // see one on that same row.
    await login(page, 'e2e-admin@example.org');
    await page.goto('/members');
    const adminRowAsAdmin = page.locator('.MuiAccordion-root').filter({ hasText: 'E2E Admin' });
    await expect(adminRowAsAdmin).toBeVisible();
    await expect(adminRowAsAdmin.getByTestId(/ShieldIcon|ShieldOutlinedIcon/)).toHaveCount(1);
    await page.getByRole('button', { name: 'Abmelden' }).click();

    await login(page, 'e2e@example.org');
    await page.goto('/members');
    const adminRowAsMember = page.locator('.MuiAccordion-root').filter({ hasText: 'E2E Admin' });
    await expect(adminRowAsMember).toBeVisible();
    await expect(adminRowAsMember.getByTestId(/ShieldIcon|ShieldOutlinedIcon/)).toHaveCount(0);
  });
});
