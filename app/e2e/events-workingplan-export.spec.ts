import { test, expect } from '@playwright/test';

test('public visitor and admin both export the working-plan PDF', async ({ page }) => {
  // Public PDF export - unauthenticated. `/calendar` is PublicCalendarPage's
  // route (app/src/routes.tsx). The "Als PDF herunterladen" element is a
  // plain <a href="/arbeitsplan.pdf"> (PublicCalendarPage.tsx), not a
  // client-side blob-download button - it's a real link (role "link", per
  // PublicCalendarPage.test.tsx's own assertion), and /arbeitsplan.pdf only
  // resolves through app/nginx.conf.template's alias block in prod/docker,
  // not through this e2e suite's plain Vite dev server. So assert the link
  // itself rather than clicking it and waiting for a download.
  await page.goto('/calendar');
  await expect(page.getByRole('heading', { name: 'Öffentlicher Terminplan' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Als PDF herunterladen' })).toHaveAttribute('href', '/arbeitsplan.pdf');

  // Internal PDF export - authenticated. Mirrors the login pattern from
  // app/e2e/member-management-export.spec.ts.
  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e-admin@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  await page.goto('/events');
  await expect(page.getByRole('heading', { name: 'Arbeitsplan' })).toBeVisible();
  const internalPdfDownloadPromise = page.waitForEvent('download');
  // Task 9: the button now downloads GET /api/v1/events/workingplan.pdf
  // directly (via the shared authenticated downloadFile() blob helper) -
  // that server-side handler logs the export inline itself (see
  // api/src/routes/events.ts's workingplan.pdf route), so there's no
  // separate client-triggered POST /record_export call to wait on any more.
  const internalPdfResponsePromise = page.waitForResponse(
    (res) => res.url().includes('/api/v1/events/workingplan.pdf') && res.request().method() === 'GET',
  );
  await page.getByRole('button', { name: 'Arbeitsplan als PDF exportieren' }).click();
  const internalPdfDownload = await internalPdfDownloadPromise;
  expect(internalPdfDownload.suggestedFilename()).toMatch(/\.pdf$/);
  const internalPdfResponse = await internalPdfResponsePromise;
  expect(internalPdfResponse.status()).toBe(200);
});
