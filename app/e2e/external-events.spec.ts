import { randomBytes } from 'node:crypto';
import { test, expect } from '@playwright/test';

// Per-run-unique title, same rationale as announcements.spec.ts: this suite
// runs against a shared, non-transactional e2e DB, and a Playwright retry of
// a failed test must not collide with whatever the previous attempt left
// behind (the seed fixtures give us no pre-existing "external event" row to
// rely on - see api/e2e/seedFrontendE2e.ts - so every test here creates its
// own via the admin CRUD flow first).
function uniqueTitle(label: string): string {
  return `E2E ${label} ${randomBytes(4).toString('hex')}`;
}

async function login(page: import('@playwright/test').Page, email: string) {
  await page.goto('/login');
  await page.getByLabel('E-Mail').fill(email);
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();
}

/** Dated "today" by default (not a fixed future date) so the created row falls inside the Arbeitsplan List/Kalender view's default current-month window - the standalone, unfiltered /external-events list this suite used to rely on for a far-future date no longer exists. */
async function createExternalEvent(page: import('@playwright/test').Page, title: string, date = new Date().toISOString().slice(0, 10)) {
  await page.goto('/external-events/new');
  await page.getByLabel(/Titel/).fill(title);
  await page.getByLabel(/Loge/).fill('E2E Gastloge');
  await page.getByLabel(/Ort/).fill('Teststadt');
  await page.getByLabel(/Datum/).fill(date);
  await page.getByLabel(/Beginn/).fill('19:00');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
}

test('a plain member can view an external event via the Arbeitsplan list view, and self-register/-unregister', async ({ page }) => {
  const title = uniqueTitle('Mitgliedstermin');

  // e2e-admin@example.org holds WorkingPlanAdmin (api/src/authz/ability.ts's
  // workingPlanAdminAbilities grants `manage ExternalEvent`) - seed the event
  // as that user first, since the seed fixtures don't provide one.
  await login(page, 'e2e-admin@example.org');
  await createExternalEvent(page, title);
  await page.getByRole('button', { name: 'Abmelden' }).click();

  await login(page, 'e2e@example.org');
  await page.getByRole('link', { name: 'Arbeitsplan' }).click();
  await expect(page).toHaveURL(/\/events$/);
  await page.getByRole('button', { name: 'Liste', exact: true }).click();

  // The "external-events" blanket filter defaults off (EventsListPage.tsx's
  // initial selectedFilters is Set(['birthdays']) only - useCalendarRangeData.ts
  // gates any manually-created external event, i.e. one with no
  // ics_source_uuid, behind that key) - the List view shares this filter with
  // the Kalender view (same useCalendarRangeData hook), so without opting in
  // here the freshly-created row above never renders and the cell click below
  // times out. Same combobox interaction as events-calendar.spec.ts's own ICS
  // filter test. disableCloseOnSelect (CalendarFilter.tsx) keeps the popper
  // mounted after the click, which can intercept the table row click below -
  // Escape closes it first.
  await page.getByRole('combobox', { name: /Anzeigen/i }).click();
  await page.getByRole('option', { name: 'Termine außer Haus' }).click();
  await page.keyboard.press('Escape');

  await page.getByRole('cell', { name: title }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  // Plain members must not see manage controls (baseline `can(['index', 'show'], 'ExternalEvent')`
  // only - see ability.ts - never `update`/`destroy`).
  await expect(page.getByRole('button', { name: 'Bearbeiten' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Löschen' })).toHaveCount(0);

  // Scoped to the <main> content landmark (AppShell.tsx) - the register/
  // unregister toggle's "Abmelden" label otherwise collides with TopNav's
  // own "Abmelden" logout button (auth.signOut), which is present on every
  // authenticated page and would make an unscoped getByRole('button', {name:
  // 'Abmelden'}) match two elements once the toggle flips post-registration.
  const main = page.getByRole('main');
  await expect(main.getByRole('button', { name: 'Anmelden', exact: true })).toBeVisible();
  await main.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(main.getByRole('button', { name: 'Abmelden' })).toBeVisible();

  await main.getByRole('button', { name: 'Abmelden' }).click();
  await expect(main.getByRole('button', { name: 'Anmelden', exact: true })).toBeVisible();
});

test('an admin can create, edit, and delete an external event', async ({ page }) => {
  const title = uniqueTitle('Adminfest');
  const editedTitle = `${title} (geändert)`;

  await login(page, 'e2e-admin@example.org');
  await createExternalEvent(page, title);

  await page.getByRole('button', { name: 'Bearbeiten' }).click();
  await page.getByLabel(/Titel/).fill(editedTitle);
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { name: editedTitle })).toBeVisible();

  await page.getByRole('button', { name: 'Löschen' }).click();
  await page.getByRole('button', { name: /wirklich löschen/i }).click();
  // ExternalEventDetailPage now redirects to /events (Arbeitsplan) after a
  // delete, not the removed /external-events list page.
  await expect(page).toHaveURL(/\/events$/);
  await expect(page.getByText(editedTitle)).not.toBeVisible();
});
