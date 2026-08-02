import { test, expect } from '@playwright/test';

test.describe('public landing page', () => {
  test('root redirects to /login when calendar_as_landing_page is false (default)', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('login, calendar, and impressum pages all link to each other', async ({ page, context }) => {
    await context.clearCookies();
    await page.goto('/login');
    await expect(page.getByRole('link', { name: 'Öffentlicher Terminplan' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Impressum' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Hilfe' })).toBeVisible();

    await page.getByRole('link', { name: 'Impressum' }).click();
    await expect(page).toHaveURL(/\/impressum$/);
    await expect(page.getByText('Vereinsinformation')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Anmelden' })).toBeVisible();

    await page.getByRole('link', { name: 'Öffentlicher Terminplan' }).click();
    await expect(page).toHaveURL(/\/calendar$/);
    await expect(page.getByRole('link', { name: 'Impressum' })).toBeVisible();
  });
});
