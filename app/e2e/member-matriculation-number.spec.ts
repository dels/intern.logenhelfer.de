import { randomBytes } from 'node:crypto';
import { test, expect } from '@playwright/test';

test('the create-member form prefills Matrikelnummer with the suggested next number, and rejects a manually-entered duplicate', async ({ page }) => {
  // Generated inside the test body (not module scope) so a Playwright retry
  // of this same test gets fresh values instead of colliding with whatever
  // this test's own previous attempt left behind on the shared e2e DB.
  const suggestedNumberEmail = `e2e-suggested-number-${randomBytes(4).toString('hex')}@example.org`;
  const duplicateNumberEmail = `e2e-duplicate-number-${randomBytes(4).toString('hex')}@example.org`;
  // Randomized per attempt (not just the email) - a Playwright retry re-runs
  // this whole test from scratch, and if THIS attempt's own cleanup below
  // fails to complete (e.g. the confirm-delete button detaching mid-click
  // under a CPU-starved gate), a hardcoded lastname would leave a same-named
  // row behind that collides with the retry's own newly-created member,
  // turning one transient hiccup into a permanent failure (same class of bug
  // as 424d1c6's matriculation-number/category-name/login-password fixtures).
  const suggestedLastname = `SuggestedNumber${randomBytes(4).toString('hex')}`;

  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e-strict-admin@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  // Note the suggested value, then accept it as-is for this member.
  await page.goto('/members/new');
  const matriculationField = page.getByLabel(/Matrikelnummer/);
  await expect(matriculationField).not.toHaveValue('');
  const suggested = await matriculationField.inputValue();

  await page.getByLabel(/Vorname/).fill('E2E');
  await page.getByLabel(/Nachname/).fill(suggestedLastname);
  await page.getByLabel(/E-Mail/).fill(suggestedNumberEmail);
  await page.getByLabel(/Geburtsdatum/).fill('1990-01-01');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { name: `Br. E2E ${suggestedLastname}` })).toBeVisible();

  // Creating a second member and manually typing the same (now-taken) number
  // must be rejected, not silently reassigned.
  await page.goto('/members/new');
  await page.getByLabel(/Vorname/).fill('E2E');
  await page.getByLabel(/Nachname/).fill('DuplicateNumber');
  await page.getByLabel(/E-Mail/).fill(duplicateNumberEmail);
  await page.getByLabel(/Geburtsdatum/).fill('1990-01-01');
  await page.getByLabel(/Matrikelnummer/).fill(suggested);
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByText('Matrikelnummer bereits vergeben.')).toBeVisible();
  // Still on the create form - the failed create must not navigate away.
  await expect(page).toHaveURL(/\/members\/new$/);

  // Clean up the one member this spec actually created (same convention as
  // every other e2e spec in this suite).
  await page.goto('/members');
  // Wait for the search-filtered fetch to actually land before clicking the
  // row - fill() only updates MembersListPage's `search` state, and the
  // resulting refetch (useMembers()) re-renders the DataGrid's rows async;
  // clicking too early can target a row that DataGrid is mid-swap on
  // (observed as "element is not attached to the DOM"), same race class as
  // be4d897's reload()/goto() fixes. Match on the encoded search param, not
  // just the endpoint, so this doesn't resolve on the page's initial
  // (unfiltered) load instead.
  const searchResponsePromise = page.waitForResponse(
    (res) => res.url().includes(`search=${encodeURIComponent(suggestedNumberEmail)}`) && res.request().method() === 'GET',
  );
  await page.getByLabel('Suche').fill(suggestedNumberEmail);
  await searchResponsePromise;
  await page.getByText(`E2E ${suggestedLastname}`).click();
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
  await expect(page.getByText(`E2E ${suggestedLastname}`)).not.toBeVisible();
});
