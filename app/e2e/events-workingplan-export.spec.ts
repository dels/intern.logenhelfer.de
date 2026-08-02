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
  // record_export fires after the download click (see events/api.ts) - assert
  // it actually succeeds too, not just that a download happened, since a
  // silently-broken audit-log call wouldn't otherwise fail this test.
  const recordExportResponsePromise = page.waitForResponse(
    (res) => res.url().includes('/api/v1/events/record_export') && res.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Arbeitsplan als PDF exportieren' }).click();
  const internalPdfDownload = await internalPdfDownloadPromise;
  expect(internalPdfDownload.suggestedFilename()).toMatch(/\.pdf$/);
  const recordExportResponse = await recordExportResponsePromise;
  expect(recordExportResponse.status()).toBe(204);
});
