import { randomBytes, randomInt } from 'node:crypto';
import { test, expect } from '@playwright/test';

test('admin can create, view, and delete a member', async ({ page }) => {
  // Generated inside the test body (not module scope) so a Playwright retry
  // of this same test gets fresh values instead of colliding with whatever
  // this test's own previous attempt left behind on the shared e2e DB - a
  // hardcoded lastname would leave a same-named row behind if this attempt's
  // own cleanup below fails to complete, making the final absence-check
  // below fail on the retry's own successful cleanup because of an
  // unrelated stale leftover (same class of bug as 424d1c6/34e24db6's
  // matriculation-number/category-name/login-password fixtures).
  const lastname = `Testmitglied${randomBytes(4).toString('hex')}`;
  const email = `e2e-new-member-${randomBytes(4).toString('hex')}@example.org`;
  const matriculationNumber = `${randomInt(100000, 999999)}`;

  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e-admin@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  await page.goto('/members/new');
  await page.getByLabel(/Vorname/).fill('E2E');
  await page.getByLabel(/Nachname/).fill(lastname);
  await page.getByLabel(/E-Mail/).fill(email);
  await page.getByLabel(/Geburtsdatum/).fill('1990-01-01');
  await page.getByLabel(/Matrikelnummer/).fill(matriculationNumber);
  await page.getByRole('button', { name: 'Speichern' }).click();

  await expect(page.getByRole('heading', { name: `Br. E2E ${lastname}` })).toBeVisible();

  await page.getByRole('button', { name: 'Bearbeiten' }).click();
  await page.getByRole('button', { name: 'Adresse hinzufügen' }).click();
  await page.getByLabel(/Stadt/).fill('Bremen');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByText('Bremen')).toBeVisible();

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
