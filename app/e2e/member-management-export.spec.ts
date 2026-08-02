import { test, expect } from '@playwright/test';

test('admin exports CSV, vCard, encrypted PDF, phone-list PDF, and birthday-list PDF', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e-admin@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  await page.goto('/members');
  await expect(page.getByRole('heading', { name: 'Mitglieder' })).toBeVisible();

  // CSV export - fires a real browser download event; only the filename
  // extension is asserted (the shipped triggerDownload() revokes its blob
  // object URL synchronously right after a.click(), so the download *event*
  // is reliable but the body may not be retrievable afterwards - asserting
  // on download.path()/saveAs() would be racy against that revoke).
  const csvDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'CSV exportieren' }).click();
  const csvDownload = await csvDownloadPromise;
  expect(csvDownload.suggestedFilename()).toMatch(/\.csv$/);

  // vCard export
  const vcfDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'vCard exportieren' }).click();
  const vcfDownload = await vcfDownloadPromise;
  expect(vcfDownload.suggestedFilename()).toMatch(/\.vcf$/);

  // Encrypted PDF export - opens a password dialog first. The dialog's own
  // accessible name (its DialogTitle text) also matches getByLabel('Passwort')
  // in strict mode (the dialog role itself resolves against that text), so
  // the password field is scoped to the dialog role to disambiguate.
  await page.getByRole('button', { name: 'PDF exportieren' }).click();
  const pdfDialog = page.getByRole('dialog');
  await pdfDialog.getByLabel('Passwort').fill('e2e-export-Pw1');
  const pdfDownloadPromise = page.waitForEvent('download');
  await pdfDialog.getByRole('button', { name: 'PDF erzeugen' }).click();
  const pdfDownload = await pdfDownloadPromise;
  expect(pdfDownload.suggestedFilename()).toMatch(/\.pdf$/);

  // Phone-list PDF export
  await page.goto('/members/phone-list');
  await expect(page.getByRole('heading', { name: 'Telefonliste' })).toBeVisible();
  const phoneListDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PDF exportieren' }).click();
  const phoneListDownload = await phoneListDownloadPromise;
  expect(phoneListDownload.suggestedFilename()).toMatch(/\.pdf$/);

  // Birthday-list PDF export
  await page.goto('/members/birthday-list');
  await expect(page.getByRole('heading', { name: 'Geburtstagsliste' })).toBeVisible();
  const birthdayListDownloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PDF exportieren' }).click();
  const birthdayListDownload = await birthdayListDownloadPromise;
  expect(birthdayListDownload.suggestedFilename()).toMatch(/\.pdf$/);
});
