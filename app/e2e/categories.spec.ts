import { test, expect } from '@playwright/test';
import { randomBytes } from 'node:crypto';

test('admin can create a category, add a directory to it, and delete both', async ({ page }) => {
  const categoryName = `E2E Kategorie ${randomBytes(4).toString('hex')}`;
  const folderName = `E2E Ordner ${randomBytes(4).toString('hex')}`;

  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e-admin@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  await page.goto('/categories/new');
  await page.getByLabel('Name').fill(categoryName);
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { name: categoryName })).toBeVisible();

  await page.getByRole('button', { name: 'Neuer Ordner' }).click();
  await page.getByLabel('Name').fill(folderName);
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { name: folderName })).toBeVisible();

  await page.goto('/dashboard');
  await page.getByRole('link', { name: categoryName }).click();
  await expect(page.getByRole('link', { name: folderName })).toBeVisible();
  await expect(page).toHaveURL(/\/categories\/[^/]+$/);
  await page.getByRole('link', { name: folderName }).click();
  await expect(page).toHaveURL(/\/directories\/[^/]+$/);
  // Wait for the directory page's own content to render, not just the URL:
  // the URL commits synchronously on click, but the Outlet's route element
  // can lag a render tick behind (React Router transition), during which
  // the previous (category) page's "Löschen" button is still in the DOM
  // alongside the directory row's own delete icon - a real strict-mode
  // trap for a locator-by-role-and-name click right after a bare URL match.
  await expect(page.getByRole('heading', { name: folderName })).toBeVisible();

  await page.getByRole('button', { name: 'Löschen' }).click();
  await page.getByRole('button', { name: /wirklich löschen/i }).click();
  await expect(page).toHaveURL(/\/categories\/[^/]+$/);
  // Wait for the category page's own heading before deleting it - the URL
  // commits synchronously on navigate() but the route's Outlet can still be
  // mid-transition for a render tick, during which the just-deleted
  // directory page's own "Löschen" button can still be in the DOM alongside
  // the category page's, same race class as the member specs' "wait for the
  // list page's own heading" fix.
  await expect(page.getByRole('heading', { name: categoryName })).toBeVisible();

  await page.getByRole('button', { name: 'Löschen' }).click();
  await page.getByRole('button', { name: /wirklich löschen/i }).click();
  await expect(page).toHaveURL(/\/categories$/);
});
