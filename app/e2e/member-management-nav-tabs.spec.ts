import { test, expect } from '@playwright/test';

test('members nav tabs and breadcrumbs stay visible and correct while clicking through the sub-lists', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e-admin@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  await page.goto('/members');
  await expect(page.getByRole('tab', { name: 'Mitglieder' })).toHaveAttribute('aria-selected', 'true');

  await page.getByRole('tab', { name: 'Telefonliste' }).click();
  await expect(page).toHaveURL(/\/members\/phone-list$/);
  await expect(page.getByRole('heading', { name: 'Telefonliste' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Telefonliste' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('navigation', { name: 'breadcrumb' }).getByText('Telefonliste')).toBeVisible();

  await page.getByRole('tab', { name: 'Geburtstagsliste' }).click();
  await expect(page).toHaveURL(/\/members\/birthday-list$/);
  await expect(page.getByRole('heading', { name: 'Geburtstagsliste' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Geburtstagsliste' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('navigation', { name: 'breadcrumb' }).getByText('Geburtstagsliste')).toBeVisible();

  await page.getByRole('tab', { name: 'Beamtenrat' }).click();
  await expect(page).toHaveURL(/\/members\/council$/);
  await expect(page.getByRole('heading', { name: 'Beamtenrat' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Beamtenrat' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('navigation', { name: 'breadcrumb' }).getByText('Beamtenrat')).toBeVisible();

  await page.getByRole('tab', { name: 'Mitglieder' }).click();
  await expect(page).toHaveURL(/\/members$/);
  await expect(page.getByRole('heading', { name: 'Mitglieder' })).toBeVisible();
});
