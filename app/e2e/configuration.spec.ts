import { test, expect } from '@playwright/test';
import { randomBytes } from 'node:crypto';

test('admin can edit an AppConfig field and manage a district', async ({ page }) => {
  const districtName = `E2E Distrikt Neu ${randomBytes(4).toString('hex')}`;
  const titleShortForm = `E2E Titel Neu ${randomBytes(4).toString('hex')}`;

  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e-admin@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  await page.goto('/configuration');
  await expect(page.getByRole('heading', { name: 'Anwendungs-Konfiguration' })).toBeVisible();

  // Funktionen is the default tab - its toggles are visible immediately.
  await expect(page.getByRole('switch', { name: 'Administratoren in Benutzerliste anzeigen?' })).toBeVisible();

  await page.getByRole('tab', { name: 'Konfiguration' }).click();
  const organisationField = page.getByLabel('Vereinsname');
  await organisationField.fill('E2E Verein');
  await page.getByRole('button', { name: 'Speichern' }).click();

  await page.reload();
  await page.getByRole('tab', { name: 'Konfiguration' }).click();
  await expect(page.getByLabel('Vereinsname')).toHaveValue('E2E Verein');

  await page.getByRole('tab', { name: 'Distrikte' }).click();
  await page.getByRole('button', { name: 'Neuer Distrikt' }).click();
  // getByLabel('Name', { exact: true }) - a plain substring match also
  // matches the AppConfig form's "Vereinsname" field ("Name" is a substring
  // of "Vereinsname"), resolving to 2 elements.
  await page.getByRole('dialog').getByLabel('Name', { exact: true }).fill(districtName);
  await page.getByRole('dialog').getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByText(districtName)).toBeVisible();

  await page
    .getByRole('listitem')
    .filter({ hasText: districtName })
    .getByRole('button', { name: 'Löschen' })
    .click();
  await page.getByRole('button', { name: 'Wirklich löschen?' }).click();
  await expect(page.getByText(districtName)).not.toBeVisible();

  await page.getByRole('tab', { name: 'Akademische Titel' }).click();
  await expect(page.getByRole('heading', { name: 'Akademische Titel' })).toBeVisible();
  await page.getByRole('button', { name: 'Titel hinzufügen' }).click();
  await page.getByRole('dialog').getByLabel('Kurzform').fill(titleShortForm);
  await page.getByRole('dialog').getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByText(titleShortForm)).toBeVisible();

  await page
    .getByRole('listitem')
    .filter({ hasText: titleShortForm })
    .getByRole('button', { name: 'Löschen' })
    .click();
  await page.getByRole('button', { name: 'Wirklich löschen?' }).click();
  await expect(page.getByText(titleShortForm)).not.toBeVisible();

  await page.getByRole('tab', { name: 'Rollen (E-Mail-Adressen)' }).click();
  await expect(page.getByRole('heading', { name: 'Rollen (E-Mail-Adressen)' })).toBeVisible();
  // "Kann Anwendung konfigurieren" (ApplicationAdmin) is seeded by e2e.rake
  // specifically for e2e-admin@example.org, so it's guaranteed present and
  // has a distinctive display_name to filter on among the full roles list.
  await page
    .getByRole('listitem')
    .filter({ hasText: 'Kann Anwendung konfigurieren' })
    .getByRole('button', { name: 'E-Mail bearbeiten' })
    .click();
  await page.getByRole('dialog').getByLabel('E-Mail-Adresse').fill('e2e-rolle@example.org');
  await page.getByRole('dialog').getByRole('button', { name: 'Speichern' }).click();
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Kann Anwendung konfigurieren' }).getByText('e2e-rolle@example.org'),
  ).toBeVisible();
});

test('clicking through all six settings tabs shows the right section for each', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e-admin@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  await page.goto('/configuration');

  await expect(page.getByRole('switch', { name: 'Administratoren in Benutzerliste anzeigen?' })).toBeVisible();

  await page.getByRole('tab', { name: 'Konfiguration' }).click();
  await expect(page.getByLabel('Domain')).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Administratoren in Benutzerliste anzeigen?' })).not.toBeVisible();

  await page.getByRole('tab', { name: 'Impressum' }).click();
  await expect(page.getByLabel('Impressums-Text')).toBeVisible();
  await expect(page.getByLabel('Domain')).not.toBeVisible();

  await page.getByRole('tab', { name: 'Distrikte' }).click();
  await expect(page.getByRole('heading', { name: 'Distrikte' })).toBeVisible();
  await expect(page.getByLabel('Impressums-Text')).not.toBeVisible();

  await page.getByRole('tab', { name: 'Akademische Titel' }).click();
  await expect(page.getByRole('heading', { name: 'Akademische Titel' })).toBeVisible();

  await page.getByRole('tab', { name: 'Rollen (E-Mail-Adressen)' }).click();
  await expect(page.getByRole('heading', { name: 'Rollen (E-Mail-Adressen)' })).toBeVisible();

  await page.getByRole('tab', { name: 'Funktionen' }).click();
  await expect(page.getByRole('switch', { name: 'Administratoren in Benutzerliste anzeigen?' })).toBeVisible();
});

// Drives main's own logo upload control (the "Design" tab / LogoSection.tsx -
// see docs/superpowers/specs/2026-08-02-custom-logo-upload-design.md on
// main), the one-and-only "upload the lodge logo" control post-reconciliation
// - this branch's own now-deleted LogoUploadWidget used to be exercised here
// instead. NOTE: this worktree doesn't itself have main's Design tab/
// LogoSection/BijouLogo frontend changes or the POST /api/v1/logo route yet
// (bringing those in is the eventual merge's job, not this reconciliation's -
// see .superpowers/sdd/reconcile-custom-logo/brief.md) - this test is
// written to the shape the post-merge app will have (tab label 'Design',
// index 4, per main's ConfigurationPage.tsx; aria-label 'Logo hochladen' per
// main's de.json `configuration.logoUpload` key, read via LogoSection.tsx)
// and is not runnable against this worktree's current frontend in isolation.
// See the reconciliation report for how this gap was handled.
test('admin can upload a new lodge logo and see the manifest reflect it', async ({ page, request }) => {
  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e-admin@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  await page.goto('/configuration');
  await page.getByRole('tab', { name: 'Design' }).click();

  const before = await request.get('/api/v1/public/manifest.webmanifest');
  const beforeIconUrl = (await before.json()).icons[0].src;

  // A 1x1 transparent PNG - the smallest valid PNG sharp can decode.
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );
  await page.getByLabel('Logo hochladen').setInputFiles({ name: 'logo.png', mimeType: 'image/png', buffer: png });

  await expect(page.getByRole('alert')).toHaveCount(0);

  const after = await request.get('/api/v1/public/manifest.webmanifest');
  const afterIconUrl = (await after.json()).icons[0].src;
  expect(afterIconUrl).not.toBe(beforeIconUrl);
});
