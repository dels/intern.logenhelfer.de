import { test, expect } from '@playwright/test';

test('a member can change their own password and log in with the new one', { tag: '@shared-state' }, async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  // exact: true - LoginPage also renders a "Mit Passkey anmelden" button
  // (MFA passkey-login work); an un-anchored name match is a
  // case-insensitive substring and matches both buttons. Same fix as
  // authorization-boundaries.spec.ts's shared login() helper.
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  await page.getByRole('link', { name: 'Mein Konto' }).click();
  await expect(page.getByRole('heading', { name: 'Konto' })).toBeVisible();

  await page.getByLabel('Aktuelles Passwort').fill('e2e-Passw0rd!');
  await page.getByLabel('Neues Passwort', { exact: true }).fill('e2e-Passw0rd!-neu');
  await page.getByLabel('Neues Passwort bestätigen').fill('e2e-Passw0rd!-neu');
  // AccountPage now also renders a self-service profile form (email/job
  // title/addresses) above the password form, reusing MemberForm's own
  // "Speichern" button - both buttons share the same accessible name, so
  // `.last()` disambiguates to the password form's button (always second
  // in document order).
  await page.getByRole('button', { name: 'Speichern' }).last().click();
  await expect(page.getByText('Passwort erfolgreich geändert.')).toBeVisible();

  await page.getByRole('button', { name: 'Abmelden' }).click();
  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!-neu');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  // Restore the original seeded password: other specs (auth.spec.ts,
  // announcements.spec.ts) log in as e2e@example.org with the original
  // e2e-Passw0rd!, and the e2e stack seeds the DB once for the whole
  // suite (no per-file reseed) — leave shared fixture state as found.
  await page.getByRole('link', { name: 'Mein Konto' }).click();
  await expect(page.getByRole('heading', { name: 'Konto' })).toBeVisible();
  await page.getByLabel('Aktuelles Passwort').fill('e2e-Passw0rd!-neu');
  await page.getByLabel('Neues Passwort', { exact: true }).fill('e2e-Passw0rd!');
  await page.getByLabel('Neues Passwort bestätigen').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Speichern' }).last().click();
  await expect(page.getByText('Passwort erfolgreich geändert.')).toBeVisible();
});
