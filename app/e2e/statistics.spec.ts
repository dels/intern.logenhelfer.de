import { test, expect } from '@playwright/test';

test('admin can navigate the statistics hub and switch categories while the tab bar stays visible, including the new Meta tab', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e-admin@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  await page.goto('/statistics');
  await expect(page.getByRole('heading', { name: 'Statistiken' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Meta' })).toBeVisible();

  await page.getByRole('tab', { name: 'Meta' }).click();
  await page.getByRole('link', { name: 'Speichernutzung' }).click();
  await expect(page).toHaveURL(/\/statistics\/mem-stats$/);
  await expect(page.getByText(/Benutzer registriert/)).toBeVisible();

  // The tab bar (and its Meta tab) is still visible on the individual
  // report page - previously, navigating into a report unmounted the whole
  // index page (and its tab bar) with no way back except the browser's
  // back button.
  await expect(page.getByRole('tab', { name: 'Meta' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Meta' })).toHaveAttribute('aria-selected', 'true');

  // Switch to the Mitglieder category without leaving the mem-stats page...
  await page.getByRole('tab', { name: 'Mitglieder' }).click();
  await expect(page).toHaveURL(/\/statistics\/mem-stats$/);
  await expect(page.getByRole('link', { name: 'Anmeldeaktivität' })).toBeVisible();

  // ...then follow that category's link to a different report entirely,
  // proving the tab bar lets you hop between reports without ever
  // returning to the bare /statistics hub.
  await page.getByRole('link', { name: 'Anmeldeaktivität' }).click();
  await expect(page).toHaveURL(/\/statistics\/user-stats$/);
  await expect(page.getByRole('tab', { name: 'Mitglieder' })).toHaveAttribute('aria-selected', 'true');
});

test('navigating away from a report (to another report, or out of Statistiken entirely) never leaves its table on screen', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e-admin@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  // Open "Downloads pro Mitglied" (downloads-per-user).
  await page.goto('/statistics/user-file-stats');
  await expect(page.getByRole('heading', { name: 'Downloads pro Mitglied' })).toBeVisible();

  // Navigate to a sibling report via the in-page report list link (the exact
  // path the user described: opening one report, then "navigating away").
  await page.getByRole('link', { name: 'Anmeldeaktivität' }).click();
  await expect(page).toHaveURL(/\/statistics\/user-stats$/);
  await expect(page.getByRole('heading', { name: 'Anmeldeaktivität' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Downloads pro Mitglied' })).not.toBeVisible();

  // Back to the downloads report, then leave Statistiken entirely via the
  // sidebar - its table must not linger once Mitglieder has taken over.
  await page.goto('/statistics/user-file-stats');
  await expect(page.getByRole('heading', { name: 'Downloads pro Mitglied' })).toBeVisible();
  await page.getByRole('link', { name: 'Mitglieder', exact: true }).click();
  await expect(page).toHaveURL(/\/members$/);
  await expect(page.getByRole('heading', { name: 'Mitglieder' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Downloads pro Mitglied' })).not.toBeVisible();
  await expect(page.getByText('Anzahl Downloads')).not.toBeVisible();
});
