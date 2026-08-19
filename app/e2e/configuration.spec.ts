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
  await expect(page.getByLabel('Datenschutzerklärung')).toBeVisible();
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

test('admin can upload a custom logo and reset it back to default', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e-admin@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  // A trivial 1x1 red PNG, generated inline so this test has no binary fixture file to maintain.
  const pngBytes = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );

  await page.goto('/configuration');
  await page.getByRole('tab', { name: 'Design' }).click();
  await expect(page.getByRole('heading', { name: 'Logo (Bijou)' })).toBeVisible();

  const resetButton = page.getByRole('button', { name: 'Auf Standard zurücksetzen' });
  await expect(resetButton).toBeDisabled();

  await page.getByLabel('Logo hochladen', { exact: true }).setInputFiles({
    name: 'e2e-logo.png',
    mimeType: 'image/png',
    buffer: pngBytes,
  });

  await expect(resetButton).toBeEnabled();

  // The top-left nav icon should now point at the uploaded logo, not the bundled default.
  const navLogoSrc = await page.locator('header img').first().getAttribute('src');
  expect(navLogoSrc).toContain('/api/v1/public/logo?v=');

  await resetButton.click();
  await expect(resetButton).toBeDisabled();
  // Auto-retrying (not a one-shot getAttribute+expect): resetButton flips
  // back to disabled as soon as the DELETE mutation itself settles, which can
  // be before its onSuccess invalidation has finished refetching and
  // re-rendering BijouLogo with the new (no-custom-logo) src.
  await expect(page.locator('header img').first()).not.toHaveAttribute('src', /\/api\/v1\/public\/logo/);
});

// Complementary to the reset-roundtrip test above: that one checks the
// in-app crest (<BijouLogo>); this one checks the PWA manifest's icon URLs
// (a separate consumer of the same custom_logos row, added by the PWA
// installability feature) also reflect a newly-uploaded logo. Uploads via
// the same real Design-tab control, no reset - the crest test above already
// covers reset/restore-to-default.
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

  // toHaveCount(0) on an absent alert is vacuously true before the upload
  // finishes too, so it doesn't actually wait for completion - wait for the
  // real post-upload signal instead (nav crest src reflecting the new logo,
  // driven by the same query invalidation the sibling upload/reset test
  // above already relies on).
  await expect(page.locator('header img').first()).toHaveAttribute('src', /\/api\/v1\/public\/logo\?v=/);
  await expect(page.getByRole('alert')).toHaveCount(0);

  const after = await request.get('/api/v1/public/manifest.webmanifest');
  const afterIconUrl = (await after.json()).icons[0].src;
  expect(afterIconUrl).not.toBe(beforeIconUrl);
});
