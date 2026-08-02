import { test, expect } from '@playwright/test';

test('login, session restore, logout', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Anmelden', exact: true })).toBeVisible();

  await page.getByLabel('E-Mail').fill('e2e@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  // refresh cookie restores the session on reload
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  await page.getByRole('button', { name: 'Abmelden' }).click();
  await expect(page.getByRole('button', { name: 'Anmelden', exact: true })).toBeVisible();
});

test('wrong password shows the error', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e@example.org');
  await page.getByLabel('Passwort').fill('wrong');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByText('E-Mail oder Passwort ist falsch.')).toBeVisible();
});
