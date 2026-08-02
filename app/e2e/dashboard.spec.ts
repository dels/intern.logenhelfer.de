import { test, expect } from '@playwright/test';

test('gdpr gate blocks the entire app until accepted, and persists across reload', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('E-Mail').fill('e2e-gdpr@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();

  await expect(page.getByRole('heading', { name: 'Datenschutzbestimmungen' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Ich akzeptiere die Datenschutzvereinbarung' })).toBeDisabled();

  // The gate applies app-wide, not just on the dashboard route: navigating
  // straight to another authenticated route still shows only the gate, and
  // the sidebar (which would otherwise offer a "Mitglieder" link) is hidden.
  await page.goto('/members');
  await expect(page.getByRole('heading', { name: 'Datenschutzbestimmungen' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Mitglieder' })).toHaveCount(0);

  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Ich akzeptiere die Datenschutzvereinbarung' }).click();
  await expect(page.getByRole('heading', { name: 'Datenschutzbestimmungen' })).not.toBeVisible();

  await page.goto('/dashboard');
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Datenschutzbestimmungen' })).not.toBeVisible();
});
