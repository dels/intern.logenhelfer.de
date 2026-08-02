import { test, expect } from '@playwright/test';

// Browser-level coverage for the forgot/reset-password flow
// (ForgotPasswordPage.tsx/ResetPasswordPage.tsx + api/src/routes/passwordReset.ts).
// The full "click a real emailed link" round trip is covered at the
// backend request level (api/test/routes/passwordReset.test.ts, which reads
// the token back off the mocked sendMail call - the raw token is never
// observable from outside the process, by design) and at the frontend unit
// level (ResetPasswordPage.test.tsx, mocked API) - this file only exercises
// what a real browser can actually observe without seeing mail contents:
// the generic non-enumerating response, and a real 422 for a token that was
// never issued.

test('forgot-password shows the identical generic message for a known and an unknown email', async ({ page }) => {
  await page.goto('/login');
  await page.getByRole('link', { name: 'Passwort vergessen?' }).click();
  await expect(page).toHaveURL(/\/forgot-password/);

  await page.getByLabel('E-Mail').fill('e2e@example.org');
  await page.getByRole('button', { name: 'Link anfordern' }).click();
  await expect(page.getByText(/Falls diese E-Mail-Adresse registriert ist/)).toBeVisible();

  await page.goto('/forgot-password');
  await page.getByLabel('E-Mail').fill('definitely-nobody@example.org');
  await page.getByRole('button', { name: 'Link anfordern' }).click();
  await expect(page.getByText(/Falls diese E-Mail-Adresse registriert ist/)).toBeVisible();
});

test('reset-password rejects a token that was never issued', async ({ page }) => {
  await page.goto('/reset-password?token=not-a-real-token');
  await page.getByLabel('Neues Passwort', { exact: true }).fill('newpassword123');
  await page.getByLabel('Neues Passwort bestätigen').fill('newpassword123');
  await page.getByRole('button', { name: 'Passwort speichern' }).click();

  await expect(page.getByText('Der Link ist ungültig oder abgelaufen. Bitte fordere einen neuen an.')).toBeVisible();
});
