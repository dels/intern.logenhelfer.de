import { test, expect } from '@playwright/test';

test('public calendar is reachable without logging in', async ({ page, context }) => {
  await context.clearCookies();
  await page.goto('/calendar');
  await expect(page.getByRole('heading', { name: 'Öffentlicher Terminplan' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'E2E Öffentlicher Termin' })).toBeVisible();
});
