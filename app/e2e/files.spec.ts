import { test, expect } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { randomBytes } from 'node:crypto';

test('admin can upload, download, edit, and delete a file', async ({ page }) => {
  const suffix = randomBytes(4).toString('hex');
  const categoryName = `E2E Dateien-Kategorie ${suffix}`;
  const folderName = `E2E Dateien-Ordner ${suffix}`;
  const uploadFileName = `e2e-upload-${suffix}.txt`;
  const renamedFileName = `e2e-renamed-${suffix}.txt`;

  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e-admin@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  await page.goto('/categories/new');
  await page.getByLabel('Name').fill(categoryName);
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { name: categoryName })).toBeVisible();
  // Real breadcrumbs (task 2) also render the category name as a breadcrumb
  // item, so the exact text now appears twice on this page (heading +
  // breadcrumb) - .first() avoids a strict-mode violation while still
  // asserting on real rendered content rather than the heading's aria role
  // alone.
  await expect(page.getByText(categoryName, { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: 'Neuer Ordner' }).click();
  await page.getByLabel('Name').fill(folderName);
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { name: folderName })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'breadcrumb' }).getByText(categoryName)).toBeVisible();

  const tmpFile = path.join(os.tmpdir(), uploadFileName);
  fs.writeFileSync(tmpFile, 'e2e file contents');

  await expect(page.getByText('Keine Dateien vorhanden.')).toBeVisible();

  // Drag-and-drop upload: select the file directly on the drop zone's hidden
  // input - no separate page/form to navigate to any more, the upload fires
  // immediately and the folder page stays put.
  await page.getByLabel('Dateien hierher ziehen oder klicken zum Auswählen').setInputFiles(tmpFile);
  await expect(page.getByText(uploadFileName)).toBeVisible();
  await expect(page.getByRole('heading', { name: folderName })).toBeVisible();

  // There's no file detail/"show" page any more (dropped 2026-08-02, along
  // with clicking the row text now triggering a download rather than
  // navigating anywhere) - every action below happens via the row's own
  // icon buttons, in place on this same folder page. The folder's own
  // top-level "Bearbeiten"/"Löschen" buttons share the exact same
  // accessible name as the file row's edit/delete icon buttons (both reuse
  // the generic i18n "Bearbeiten"/"Löschen" strings), so every row action
  // below is scoped to this file's own <li> to avoid a strict-mode
  // violation against the folder's controls.
  const fileRow = page.getByRole('listitem').filter({ hasText: uploadFileName });

  const downloadPromise = page.waitForEvent('download');
  await fileRow.getByRole('button', { name: 'Herunterladen' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(uploadFileName);
  await fileRow.getByRole('button', { name: 'Info' }).click();
  await expect(page.getByText('Downloads', { exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Schließen' }).click();

  await fileRow.getByRole('button', { name: 'Bearbeiten' }).click();
  await expect(page.getByRole('heading', { name: 'Bearbeiten' })).toBeVisible();
  await page.getByLabel('Dateiname').fill(renamedFileName);
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { name: folderName })).toBeVisible();
  await expect(page.getByText(renamedFileName)).toBeVisible();

  const renamedRow = page.getByRole('listitem').filter({ hasText: renamedFileName });
  await renamedRow.getByRole('button', { name: 'Löschen' }).click();
  await renamedRow.getByRole('button', { name: 'Wirklich löschen?' }).click();
  await expect(page.getByText(renamedFileName)).not.toBeVisible();
  await expect(page.getByText('Keine Dateien vorhanden.')).toBeVisible();

  fs.unlinkSync(tmpFile);
});
