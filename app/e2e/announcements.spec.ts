import { randomBytes } from 'node:crypto';
import { test, expect } from '@playwright/test';

test('admin can create an announcement; a member can read it, subscribe, and the admin can delete it', async ({ page }) => {
  // Per-run-unique title (matches the convention other specs in this suite use
  // to avoid collisions on the shared, non-transactional e2e DB - see
  // member-management-increment-1.spec.ts/members.spec.ts's distinct
  // fixture emails). Generated inside the test body (not module scope) so a
  // Playwright retry of this same test - e.g. because the delete/cleanup
  // step below fails or times out - generates a FRESH suffix rather than
  // reusing one, and therefore never collides with whatever this test left
  // behind on the previous attempt. getByText is substring-matching, so a
  // stray un-cleaned-up "E2E Ankündigung <hex>" row from a prior failed
  // attempt can never match this run's differently-suffixed title.
  const title = `E2E Ankündigung ${randomBytes(4).toString('hex')}`;

  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e-admin@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  await page.goto('/announcements/new');
  await page.getByLabel(/Titel/).fill(title);
  await page.getByLabel(/Text/).fill('Dies ist ein Test');
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  await page.getByRole('button', { name: 'Abmelden' }).click();

  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

  await page.goto('/announcements');
  await expect(page.getByText(title)).toBeVisible();
  const subscribeSwitch = page.getByRole('switch', { name: 'Per E-Mail benachrichtigen bei neuen Ankündigungen' });
  // Normalize the starting state instead of assuming it's unchecked. This flag
  // lives on the User row (PATCH /api/v1/me/announcement_subscription), not
  // on the announcement, so it persists across runs on the shared,
  // non-transactional e2e DB - a prior run of this same spec (or a Playwright
  // retry after this test failed further down, past the click below) leaves
  // it checked, and an assumed-unchecked assertion here would then fail on
  // every subsequent attempt regardless of the title-collision fix above.
  if (await subscribeSwitch.isChecked()) {
    await subscribeSwitch.click();
    await expect(subscribeSwitch).not.toBeChecked();
    await page.reload();
    await expect(subscribeSwitch).not.toBeChecked();
  }
  await subscribeSwitch.click();
  await expect(subscribeSwitch).toBeChecked();
  await page.reload();
  await expect(subscribeSwitch).toBeChecked();

  await page.getByRole('button', { name: 'Abmelden' }).click();

  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e-admin@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  // Unlike this test's other two logins, this one used to go straight into
  // page.goto('/announcements') with no wait for the login itself to land -
  // a real (if narrow) race: a full-page goto() right after the click can
  // outrun the login POST, landing back on /login with no access token yet.
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();
  await page.goto('/announcements');
  await page.getByText(title).click();
  // Wait for the detail page to actually load before clicking "Löschen" -
  // the list view now also has a row-level delete button with the exact
  // same accessible name, so without this wait the click can race against
  // the still-mounted list page and match the wrong (or multiple) buttons.
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await page.getByRole('button', { name: 'Löschen' }).click();
  await page.getByRole('button', { name: /wirklich löschen/i }).click();
  await expect(page).toHaveURL(/\/announcements$/);
  // Wait for the list page's own heading before checking absence - the URL
  // commits synchronously on navigate() but the route's Outlet can still be
  // mid-transition for a render tick, during which the old detail page (with
  // its useSetBreadcrumb-registered title, since 6fa8d8cc) is still mounted
  // alongside it. A bare getByText(title) checked right after the URL
  // assertion can transiently resolve to both the breadcrumb text and the
  // still-mounted detail heading at once - a strict-mode violation. Waiting
  // for AnnouncementsListPage's own <h1> first guarantees the detail Outlet
  // (and its breadcrumb) has actually unmounted, after which a lingering
  // record can only ever appear once (as a DataGrid cell) - so this keeps
  // catching a delete that silently no-opped (the reason this assertion
  // exists at all - see comment below) without the transient race.
  await expect(page.getByRole('heading', { name: 'Aktuelles' })).toBeVisible();
  // Verify the delete actually took effect (mirrors
  // member-management-increment-1.spec.ts's post-delete absence check) -
  // previously this spec only asserted the URL, so a delete that silently
  // no-opped (e.g. a stale query-cache render after the API call failed)
  // wouldn't have been caught here.
  await expect(page.getByText(title)).not.toBeVisible();
});
