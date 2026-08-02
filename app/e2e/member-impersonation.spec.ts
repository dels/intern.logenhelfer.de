import { randomBytes, randomInt } from 'node:crypto';
import { test, expect } from '@playwright/test';

test('a strict Admin impersonates a member and returns to their own account', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e-strict-admin@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  // Fresh member, unique email/matriculation_number/lastname so this doesn't
  // collide with other e2e specs' fixtures in the shared, non-transactional
  // test DB. Generated inside the test body (not module scope) so a
  // Playwright retry of this same test gets fresh values instead of
  // colliding with whatever this test's own previous attempt left behind -
  // a hardcoded lastname here would leave a same-named row behind if this
  // attempt's own cleanup below fails to complete (e.g. the confirm-delete
  // button detaching mid-click under a CPU-starved gate), turning one
  // transient hiccup into a permanent failure (same class of bug as
  // 424d1c6/34e24db6's matriculation-number/category-name/login-password
  // fixtures).
  const lastname = `Impersonated${randomBytes(4).toString('hex')}`;
  const email = `e2e-impersonated-${randomBytes(4).toString('hex')}@example.org`;
  const matriculationNumber = `${randomInt(100000, 999999)}`;

  await page.goto('/members/new');
  await page.getByLabel(/Vorname/).fill('E2E');
  await page.getByLabel(/Nachname/).fill(lastname);
  await page.getByLabel(/E-Mail/).fill(email);
  await page.getByLabel(/Geburtsdatum/).fill('1990-01-01');
  await page.getByLabel(/Matrikelnummer/).fill(matriculationNumber);
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { name: `Br. E2E ${lastname}` })).toBeVisible();

  await page.getByRole('button', { name: 'Impersonate' }).click();
  await expect(page.getByText(`Ansicht als E2E ${lastname}`)).toBeVisible();
  // The sidebar identity block reflects the impersonated member, not the admin.
  await expect(page.getByText(`E2E ${lastname}`, { exact: true })).toBeVisible();

  // Regression check: this freshly created member has never accepted GDPR
  // (DB default accepted_gdpr:false) - the app-wide gate (AppShell.tsx) must
  // not block the impersonating admin's view of the app on account of that,
  // since accepting GDPR while impersonating is itself blocked server-side
  // (api/src/routes/me.ts's forbidden_while_impersonating rule) - gating the
  // view too would be a dead end with no way out except ending impersonation.
  await expect(page.getByRole('heading', { name: 'Datenschutzbestimmungen' })).not.toBeVisible();
  // exact: true - the dashboard's Members stat card is now also a link (to
  // /members), whose accessible name includes the count (e.g. "6
  // Mitglieder"), so a substring match would hit both it and the sidebar
  // nav link this assertion actually means to exercise.
  await expect(page.getByRole('link', { name: 'Mitglieder', exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Zurück zu meinem Konto' }).click();
  await expect(page.getByText(/Ansicht als/)).not.toBeVisible();
  await expect(page.getByText('E2E StrictAdmin', { exact: true })).toBeVisible();

  // Clean up the member this spec created (same convention as every other
  // e2e spec in this suite - leave no fixture behind for later specs/re-runs).
  await page.goto('/members');
  // Wait for the search-filtered fetch to actually land before clicking the
  // row - fill() only updates MembersListPage's `search` state, and the
  // resulting refetch (useMembers()) re-renders the DataGrid's rows async;
  // clicking too early can target a row that DataGrid is mid-swap on
  // (observed as "element is not attached to the DOM"/detaching mid-click),
  // same race class as be4d897's reload()/goto() fixes. Match on the
  // encoded search param, not just the endpoint, so this doesn't resolve on
  // the page's initial (unfiltered) load instead.
  const searchResponsePromise = page.waitForResponse(
    (res) => res.url().includes(`search=${encodeURIComponent(email)}`) && res.request().method() === 'GET',
  );
  await page.getByLabel('Suche').fill(email);
  await searchResponsePromise;
  await page.getByText(`E2E ${lastname}`).click();
  await page.getByRole('button', { name: 'Löschen' }).click();
  await page.getByRole('button', { name: /wirklich löschen/ }).click();
  await expect(page).toHaveURL(/\/members$/);
  // Wait for the list page's own heading before checking absence - the URL
  // commits synchronously on navigate() but the route's Outlet can still be
  // mid-transition for a render tick, during which the old detail page (with
  // its useSetBreadcrumb-registered name, since 6fa8d8cc) is still mounted
  // alongside it. A bare getByText check right after the URL assertion can
  // transiently resolve to both the breadcrumb text and the still-mounted
  // detail heading at once - a strict-mode violation. Waiting for
  // MembersListPage's own <h1> first guarantees the detail Outlet (and its
  // breadcrumb) has actually unmounted, after which a lingering record can
  // only ever appear once (as a DataGrid cell) - keeping this able to catch
  // a delete that silently no-opped, without the transient race.
  await expect(page.getByRole('heading', { name: 'Mitglieder' })).toBeVisible();
  await expect(page.getByText(`E2E ${lastname}`)).not.toBeVisible();
});
