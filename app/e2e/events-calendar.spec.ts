import { randomBytes } from 'node:crypto';
import { test, expect } from '@playwright/test';

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

test('a member switches the events page between list and calendar view, and can filter external events by source', async ({ page }) => {
  const title = uniqueTitle('Kalendertermin');

  await login(page, 'e2e-admin@example.org');
  await page.goto('/events/new');
  await page.getByLabel(/Titel/).fill(title);
  await page.getByLabel(/Ort/).fill('Festsaal');
  await page.getByLabel(/Datum/).fill(new Date().toISOString().slice(0, 10));
  // Event requires a time unless whole_day (rails-app/app/models/event.rb,
  // enforced client-side by EventForm.tsx's zod refine) - check "Ganztägig"
  // so this create doesn't need to fill+format the time field too.
  await page.getByRole('checkbox', { name: 'Ganztägig' }).check();
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  await page.goto('/events');
  await page.getByRole('button', { name: 'Kalender', exact: true }).click();
  await expect(page.getByText(title)).toBeVisible();

  // Birthdays filter is on by default, external events off - the filter combobox exists regardless of any real data being present.
  await expect(page.getByRole('combobox', { name: /Anzeigen/i })).toBeVisible();

  await page.getByRole('button', { name: 'Liste' }).click();
  // EventsListTable renders a plain MUI <Table> (real <td> cells, role="cell"),
  // not the DataGrid the old internal-only list view used - this distinguishes
  // list view from the calendar view visited moments earlier (whose Chip also
  // renders the title as plain text).
  await expect(page.getByRole('cell', { name: title })).toBeVisible();
});

/** Shared create-flow for a whole-day internal event, reused by the tests below - mirrors the existing test's own create flow above. */
async function createInternalEvent(page: import('@playwright/test').Page, title: string) {
  await page.goto('/events/new');
  await page.getByLabel(/Titel/).fill(title);
  await page.getByLabel(/Ort/).fill('Festsaal');
  await page.getByLabel(/Datum/).fill(new Date().toISOString().slice(0, 10));
  await page.getByRole('checkbox', { name: 'Ganztägig' }).check();
  await page.getByRole('button', { name: 'Speichern' }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
}

test('a plain member registers for an internal event via the calendar chip, and the registration is visible on the detail page', async ({ page }) => {
  const title = uniqueTitle('Anmeldetermin');

  // Admin creates the event first - EventCreatePage.tsx has no client-side
  // ability gate (the backend's `can('create', 'Event')` is the real
  // boundary, same shape as ExternalEventCreatePage per
  // authorization-boundaries.spec.ts's own comment on that page) but the
  // existing e2e convention always creates fixtures as the admin user.
  await login(page, 'e2e-admin@example.org');
  await createInternalEvent(page, title);

  // Re-login as a plain member - this test deliberately does NOT use
  // e2e-admin@example.org (unlike the file's one existing test) so it
  // actually exercises the self-registration path a real, non-privileged
  // member would use, not an admin's (which could mask a permission bug).
  await login(page, 'e2e@example.org');
  await page.goto('/events');
  await page.getByRole('button', { name: 'Kalender', exact: true }).click();

  // The calendar Chip navigates to /events/:uuid on click (EventsCalendarView.tsx) -
  // MUI renders a clickable Chip as a real <button>, so getByRole('button', ...)
  // finds it directly instead of relying on click-bubbling from getByText.
  await page.getByRole('button', { name: title }).click();
  await expect(page.getByRole('heading', { name: title })).toBeVisible();

  await expect(page.getByRole('button', { name: 'Anmelden', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Abmelden' })).toBeVisible();

  // Scoped to a listitem, not a bare getByText: AppShell's header also shows
  // the logged-in member's "E2E Tester" name (see AppShell.tsx), which would
  // otherwise make a page-wide getByText('E2E Tester') ambiguous.
  await expect(page.getByRole('listitem').filter({ hasText: 'E2E Tester' })).toBeVisible();
});

test('a plain member cannot register another user for an event via a direct API call (permission boundary)', async ({ page }) => {
  const title = uniqueTitle('Fremdanmeldung');

  // Capture the admin's own uuid off the real GET /api/v1/me response that
  // AuthProvider.tsx's login() flow triggers right after the session POST -
  // there's no UI surface that displays another user's uuid, and the login
  // response itself (session.ts's SessionUserPayload) never includes one.
  // AuthProvider also fires an unauthenticated GET /api/v1/me on every
  // page's initial mount (its session-restore-from-cookie check) - login()'s
  // own page.goto('/login') triggers exactly one of those before the actual
  // login submit, so the predicate must require a 200 (the post-login,
  // authenticated call) or it captures that earlier 401 body instead (which
  // has no `user` key at all).
  const meResponsePromise = page.waitForResponse(
    // Exact pathname, not includes(): '/api/v1/me' is also a substring of
    // '/api/v1/members', which the app calls for unrelated reasons.
    (res) => new URL(res.url()).pathname === '/api/v1/me' && res.request().method() === 'GET' && res.status() === 200,
  );
  await login(page, 'e2e-admin@example.org');
  const adminUuid = ((await (await meResponsePromise).json()) as { user: { uuid: string } }).user.uuid;

  await createInternalEvent(page, title);
  const eventUuidMatch = /\/events\/([^/]+)$/.exec(page.url());
  if (!eventUuidMatch) throw new Error(`expected an event uuid in the URL after create, got ${page.url()}`);
  const eventUuid = eventUuidMatch[1]!;

  // The frontend keeps its bearer token in an in-memory module
  // (app/src/api/token.ts's `accessToken` variable) - never in
  // localStorage/cookies/anywhere page.evaluate could read it - so the only
  // way to drive a real cross-user API call as the member is to capture a
  // real token off the wire, from the actual POST /api/v1/session response
  // login() triggers. No existing e2e spec in this repo has a token-capture
  // precedent (checked events-workingplan-export.spec.ts's only
  // waitForResponse usage, and authorization-boundaries.spec.ts's boundary
  // tests, which all stay within normal UI clicks) - this is a new but
  // narrowly-scoped technique, not an invented shortcut around a real one.
  // Must match the pathname exactly, not just include '/api/v1/session':
  // login()'s page.goto('/login') is a full reload, which resets the
  // in-memory access token and makes AuthProvider's initial GET /api/v1/me
  // 401 - apiFetch's own retry logic (api/client.ts) then silently calls
  // POST /api/v1/session/refresh using the still-valid ADMIN refresh cookie
  // *before* the member's credentials are ever submitted. A substring match
  // captures that refresh response (still the admin's token) instead of the
  // real member login a moment later - verified empirically (first draft of
  // this test asserted 403 and got a 201 back, i.e. self-registration,
  // because "memberToken" was actually the admin's).
  const sessionResponsePromise = page.waitForResponse(
    (res) => new URL(res.url()).pathname === '/api/v1/session' && res.request().method() === 'POST',
  );
  await login(page, 'e2e@example.org');
  const memberToken = ((await (await sessionResponsePromise).json()) as { access_token: string }).access_token;

  // page.request shares the page's context (base URL, cookies) - only the
  // Authorization header needs to be supplied explicitly here, matching
  // exactly what apiFetch (api/client.ts) would send for the member.
  const response = await page.request.post(`/api/v1/events/${eventUuid}/participants`, {
    headers: { Authorization: `Bearer ${memberToken}` },
    data: { user_uuid: adminUuid },
  });
  expect(response.status()).toBe(403);
});

test('a real ICS source appears as a selectable calendar filter option for a plain member (regression for the members-403 bug)', async ({ page }) => {
  const sourceName = uniqueTitle('ICS-Quelle');

  // Admin creates a real ICS source via the actual admin UI
  // (ExternalEventIcsSourcesPage.tsx, routed at /external-event-ics-sources -
  // see routes.tsx) - same page/labels/button as
  // authorization-boundaries.spec.ts's precedent for this page, which only
  // exercises the rejected (member) path; this creates the accepted (admin)
  // path instead. example.com is a real, safe-to-resolve public domain -
  // externalEventIcsSources.ts's POST route does a real DNS lookup
  // (assertSafeIcsUrl) at creation time as an SSRF guard, so a fake/internal
  // hostname would 422 here even though the ICS content itself is never
  // fetched until an explicit sync.
  await login(page, 'e2e-admin@example.org');
  await page.goto('/external-event-ics-sources');
  await page.getByLabel('Name').fill(sourceName);
  await page.getByLabel('URL').fill('https://example.com/e2e-test-calendar.ics');
  await page.getByRole('button', { name: 'Hinzufügen' }).click();
  await expect(page.getByText(sourceName)).toBeVisible();

  // Before Task 3's fix, GET /api/v1/external_event_ics_sources/options was
  // gated on `manage ExternalEvent` (admin-only) instead of `index
  // ExternalEvent` (which defaultUserAbilities grants everyone) - a plain
  // member's calendar filter silently 403'd and came up empty. Re-login as
  // one and confirm the source is actually offered as a filter option now.
  await login(page, 'e2e@example.org');
  await page.goto('/events');
  await page.getByRole('button', { name: 'Kalender', exact: true }).click();
  await page.getByRole('combobox', { name: /Anzeigen/i }).click();
  await expect(page.getByRole('option', { name: sourceName })).toBeVisible();
});

test('a member opens the birthday contact dialog from a calendar chip, sees the birthday member\'s email, and can close it via either affordance', async ({ page }) => {
  // api/e2e/seedFrontendE2e.ts's DATE_OF_BIRTH is `yearsAgo(30)`, built from
  // the CURRENT month/day (see its `yearsAgo` helper) - so every seeded
  // user's birthday is "today" by construction, still true as of this task
  // (verified by reading that file directly, not assumed). e2e@example.org
  // ("E2E Tester") therefore has its own birthday chip visible today.
  await login(page, 'e2e@example.org');
  await page.goto('/events');
  await page.getByRole('button', { name: 'Kalender', exact: true }).click();

  await page.getByRole('button', { name: 'E2E Tester' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('e2e@example.org')).toBeVisible();

  // BirthdayContactDialog.tsx renders exactly two close affordances sharing
  // the same accessible name (t('common.close') = "Schließen"): the
  // top-right IconButton (X icon) and the visible DialogActions Button -
  // see BirthdayContactDialog.test.tsx's own "exactly a top-right close icon
  // and one visible close button" unit test for the same shape assertion.
  const closeButtons = dialog.getByRole('button', { name: 'Schließen' });
  await expect(closeButtons).toHaveCount(2);

  await closeButtons.first().click();
  await expect(dialog).toBeHidden();

  await page.getByRole('button', { name: 'E2E Tester' }).click();
  const reopenedDialog = page.getByRole('dialog');
  await expect(reopenedDialog).toBeVisible();
  await reopenedDialog.getByRole('button', { name: 'Schließen' }).last().click();
  await expect(reopenedDialog).toBeHidden();
});
