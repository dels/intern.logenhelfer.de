import { randomBytes } from 'node:crypto';
import { test, expect } from '@playwright/test';

test('admin can create, view, and delete an event', async ({ page }) => {
  // Per-run-unique title (same convention as announcements.spec.ts), generated
  // inside the test body so a Playwright retry of this same test generates a
  // fresh suffix instead of colliding with whatever a prior failed attempt
  // left behind on the shared, non-transactional e2e DB.
  const title = `E2E Testtermin ${randomBytes(4).toString('hex')}`;

  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e-admin@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  await page.goto('/events/new');
  await page.getByLabel(/Titel/).fill(title);
  await page.getByLabel(/Datum/).fill('2026-12-24');
  // Event requires a time unless whole_day (rails-app/app/models/event.rb) - check
  // "Ganztägig" so this create doesn't need to fill+format the time field too.
  await page.getByRole('checkbox', { name: 'Ganztägig' }).check();
  await page.getByRole('button', { name: 'Speichern' }).click();

  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  await page.getByRole('button', { name: 'Löschen' }).click();
  await page.getByRole('button', { name: /wirklich löschen/ }).click();

  await expect(page).toHaveURL(/\/events$/);
  // Wait for the list page's own heading before checking absence - the URL
  // commits synchronously on navigate() but the route's Outlet can still be
  // mid-transition for a render tick, during which the old detail page (with
  // its useSetBreadcrumb-registered title, since 6fa8d8cc) is still mounted
  // alongside it. A bare getByText(title) checked right after the URL
  // assertion can transiently resolve to both the breadcrumb text and the
  // still-mounted detail heading at once - a strict-mode violation. Waiting
  // for EventsListPage's own <h1> first guarantees the detail Outlet (and
  // its breadcrumb) has actually unmounted, after which a lingering record
  // can only ever appear once (as a DataGrid cell) - keeping this able to
  // catch a delete that silently no-opped, without the transient race.
  await expect(page.getByRole('heading', { name: 'Arbeitsplan' })).toBeVisible();
  await expect(page.getByText(title)).not.toBeVisible();
});
