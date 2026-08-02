import { test, expect } from '@playwright/test';
import { randomBytes } from 'node:crypto';

test('admin can create, view, and delete a seeker', async ({ page }) => {
  const suffix = randomBytes(4).toString('hex');
  const lastName = `Testsucher ${suffix}`;
  const referralSource = `E2E-Empfehlung ${suffix}`;

  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e-admin@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  await page.goto('/seekers/new');
  await page.getByLabel(/Vorname/).fill('E2E');
  await page.getByLabel(/^Name/).fill(lastName);
  await page.getByLabel(/Quelle/).fill(referralSource);
  await page.getByRole('button', { name: 'Speichern' }).click();

  await expect(page.getByRole('heading', { name: `${lastName}, E2E` })).toBeVisible();

  await page.getByRole('button', { name: 'Löschen' }).click();
  await page.getByRole('button', { name: /wirklich löschen/ }).click();

  await expect(page).toHaveURL(/\/seekers$/);
  // Wait for the list page's own heading before checking absence - the URL
  // commits synchronously on navigate() but the route's Outlet can still be
  // mid-transition for a render tick, during which the old detail page (with
  // its useSetBreadcrumb-registered name, since 6fa8d8cc) is still mounted
  // alongside it. A bare getByText check right after the URL assertion can
  // transiently resolve to both the breadcrumb text and the still-mounted
  // detail heading at once - a strict-mode violation. Waiting for
  // SeekersListPage's own <h1> first guarantees the detail Outlet (and its
  // breadcrumb) has actually unmounted, after which a lingering record can
  // only ever appear once (as a DataGrid cell) - keeping this able to catch
  // a delete that silently no-opped, without the transient race.
  await expect(page.getByRole('heading', { name: 'Suchende' })).toBeVisible();
  await expect(page.getByText(`${lastName}, E2E`)).not.toBeVisible();
});
