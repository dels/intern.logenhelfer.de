import { randomBytes } from 'node:crypto';
import { test, expect } from '@playwright/test';

test('admin can create a lodge, add an officer to it, and delete both', async ({ page }) => {
  // Per-run-unique name (same convention as announcements.spec.ts), generated
  // inside the test body so a Playwright retry of this same test generates a
  // fresh suffix instead of colliding with whatever a prior failed attempt
  // left behind on the shared, non-transactional e2e DB.
  const lodgeName = `E2E Loge ${randomBytes(4).toString('hex')}`;

  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e-admin@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  await page.goto('/lodges/new');
  await page.getByLabel(/Name/).fill(lodgeName);
  await page.getByLabel('Distrikt').click();
  await page.getByRole('option').first().click();
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { name: lodgeName })).toBeVisible();

  await page.getByRole('button', { name: 'Neuer Amtsträger' }).click();
  await page.getByLabel(/Vorname/).fill('Max');
  await page.getByLabel(/Nachname/).fill('Mustermann');
  // getByRole('combobox', { name: 'Amt' }), not getByLabel('Amt', { exact: true }):
  // verified locally that MUI Autocomplete's accessible name for this input
  // isn't reachable via getByLabel's exact match (it resolves to 0 matches),
  // while the role+accessible-name lookup finds exactly one combobox. This
  // also sidesteps the same substring-ambiguity concern the brief raised for
  // officers.roleEmail's label ("E-Mail des Amtes" containing "Amt").
  await page.getByRole('combobox', { name: 'Amt' }).click();
  await page.getByRole('option').first().click();
  // role_email is validates_presence_of on the Officer model (see Global
  // Constraints) - omitting it 422s the create and the page never navigates.
  await page.getByLabel(/E-Mail des Amtes/).fill('redner@example.org');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { name: 'Mustermann, Max' })).toBeVisible();

  await page.getByRole('button', { name: 'Löschen' }).click();
  await page.getByRole('button', { name: /wirklich löschen/i }).click();
  await expect(page).toHaveURL(/\/lodges\/[^/]+$/);

  await page.getByRole('button', { name: 'Löschen' }).click();
  await page.getByRole('button', { name: /wirklich löschen/i }).click();
  await expect(page).toHaveURL(/\/lodges$/);
});
