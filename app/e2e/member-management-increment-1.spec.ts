import { randomBytes, randomInt } from 'node:crypto';
import { test, expect } from '@playwright/test';

test('admin sets mother_lodge/accepted_at, assigns a position role, and directory lists render', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e-admin@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  // Create a fresh member, then edit it to set the fields/role this
  // increment added. Email/matriculation_number are generated inside the
  // test body (not module scope) so a Playwright retry of this same test
  // gets fresh values instead of colliding with whatever this test's own
  // previous attempt left behind on the shared, non-transactional e2e DB.
  const expectedAcceptedAt = new Date('2020-05-01T00:00:00').toLocaleString('de', { dateStyle: 'medium' });
  const email = `e2e-increment1-${randomBytes(4).toString('hex')}@example.org`;
  const matriculationNumber = `${randomInt(100000, 999999)}`;

  await page.goto('/members/new');
  await page.getByLabel(/Vorname/).fill('E2E');
  await page.getByLabel(/Nachname/).fill('Increment1');
  await page.getByLabel(/E-Mail/).fill(email);
  await page.getByLabel(/Geburtsdatum/).fill('1990-01-01');
  await page.getByLabel(/Matrikelnummer/).fill(matriculationNumber);
  await page.getByRole('button', { name: 'Speichern' }).click();

  await expect(page.getByRole('heading', { name: 'Br. E2E Increment1' })).toBeVisible();

  await page.getByRole('button', { name: 'Bearbeiten' }).click();
  await page.getByLabel('Mutterloge').fill('Zur Morgenröte');
  await page.getByLabel('Angenommen am').fill('2020-05-01');

  // Position role assignment (Role.positions - administrational_role: false,
  // excluding degree roles). SeniorWarden ("1. Aufseher") is not already
  // granted to e2e-admin, so there's no eviction interaction to worry about.
  await page.getByLabel('Ämter').click();
  await page.getByRole('option', { name: '1. Aufseher' }).click();
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Speichern' }).click();

  // Verify persistence on the detail page after save.
  await expect(page.getByRole('heading', { name: 'Br. E2E Increment1' })).toBeVisible();
  await expect(page.getByText('Mutterloge: Zur Morgenröte')).toBeVisible();
  await expect(page.getByText(`Angenommen am: ${expectedAcceptedAt}`)).toBeVisible();
  await expect(page.getByText('1. Aufseher')).toBeVisible();

  // Directory list pages (Task 2/4) - each renders its own header.
  await page.goto('/members/phone-list');
  await expect(page.getByRole('heading', { name: 'Telefonliste' })).toBeVisible();

  await page.goto('/members/birthday-list');
  await expect(page.getByRole('heading', { name: 'Geburtstagsliste' })).toBeVisible();

  await page.goto('/members/council');
  await expect(page.getByRole('heading', { name: 'Beamtenrat' })).toBeVisible();

  // Clean up the member this spec created, matching the convention every
  // other e2e spec in this suite follows (leave no fixture behind for
  // later specs / re-runs against a shared, non-transactional test DB).
  // The shared, non-transactional test DB accumulates hundreds of members
  // across the full e2e run (paginated 25/page, sorted by lastname) - a
  // plain getByText on the unfiltered list can land on a page this member
  // isn't on. Use the search box (MembersListPage.tsx's `search` field)
  // to narrow to just this member first.
  await page.goto('/members');
  await page.getByLabel('Suche').fill(email);
  await page.getByText('E2E Increment1').click();
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
  await expect(page.getByText('E2E Increment1')).not.toBeVisible();
});
