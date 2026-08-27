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

test(
  'an admin can toggle the four PDF-footer AppConfig switches through the real settings UI, and both PDFs still download afterwards',
  { tag: '@shared-state' },
  async ({ page, request }) => {
    // Tagged @shared-state (see playwright.config.ts): these four switches
    // are app-wide AppConfig flags read by both PDF routes on every request,
    // same category of shared state as authorization-boundaries.spec.ts's
    // users_can_view_statistics toggle test. The 'shared-state' project runs
    // this to completion (full flip-then-restore cycle) before the
    // 'parallel' project (containing this file's other test, which also
    // downloads both PDFs) starts, so there's no window where a
    // concurrently-running test could observe a half-toggled state.
    //
    // What this proves that api/test/routes/{public,events}.test.ts and
    // api/test/lib/workingplanPdf.test.ts do not: those all exercise
    // resolveFooterLines/the AppConfig round-trip in-process (supertest or
    // direct DB calls). Nothing before this test had ever driven the
    // four switches through the actual admin Settings UI (ConfigurationPage
    // renders them via a generic `FIELDS`-driven ConfigField, whose label
    // comes from an i18n lookup with no compile-time check that the key
    // exists - this test would have caught the real bug found and fixed
    // alongside it, where those four keys had no de.json/en.json entries at
    // all and rendered their raw i18n key path as the switch's accessible
    // name; see ConfigurationPage.test.tsx's own regression test for that).
    //
    // This project's established convention (see workingplanPdf.test.ts's
    // own comment) is to never parse PDF bytes for text content - jsPDF's
    // output isn't practically assertable that way - so like every other
    // PDF test in this codebase, this only checks status/content-type/
    // non-empty body, not the actual footer text. The footer *content*
    // logic itself (resolveFooterLines's officer-lookup/fallback priority)
    // already has thorough dedicated coverage in workingplanPdf.test.ts.
    await page.goto('/login');
    await page.getByLabel('E-Mail').fill('e2e-admin@example.org');
    await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
    await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();

    await page.goto('/configuration');
    await page.getByRole('tab', { name: 'Konfiguration' }).click();
    await expect(page.getByRole('heading', { name: 'Anwendungs-Konfiguration' })).toBeVisible();

    const switches = {
      publicSecretary: page.getByRole('switch', { name: 'Sekretär im Footer des öffentlichen Arbeitsplans anzeigen' }),
      publicWm: page.getByRole('switch', { name: 'Meister vom Stuhl im Footer des öffentlichen Arbeitsplans anzeigen' }),
      internalSecretary: page.getByRole('switch', { name: 'Sekretär im Footer des internen Arbeitsplans anzeigen' }),
      internalWm: page.getByRole('switch', { name: 'Meister vom Stuhl im Footer des internen Arbeitsplans anzeigen' }),
    };
    const saveButton = page.getByRole('button', { name: 'Speichern' }).first();

    async function setAll(checked: boolean) {
      for (const sw of Object.values(switches)) {
        if ((await sw.isChecked()) !== checked) await sw.click();
      }
      await saveButton.click();
      // Wait for the save mutation to settle (button disabled via
      // useUpdateAppConfig()'s isPending while in flight) before reloading -
      // same pattern as authorization-boundaries.spec.ts's statistics toggle
      // test, for the same race-avoidance reason.
      await expect(saveButton).toBeEnabled();
      await page.reload();
      await page.getByRole('tab', { name: 'Konfiguration' }).click();
      for (const sw of Object.values(switches)) {
        if (checked) await expect(sw).toBeChecked();
        else await expect(sw).not.toBeChecked();
      }
    }

    // Normalize to off first - defensive against a prior failed run leaving
    // these on (same defensive pattern as announcements.spec.ts's
    // subscribeSwitch and authorization-boundaries.spec.ts's statisticsSwitch).
    await setAll(false);

    // Flip all four on.
    await setAll(true);

    // Public PDF: real HTTP, unauthenticated, straight at the underlying API
    // route (not the /arbeitsplan.pdf nginx alias, which this e2e harness's
    // plain Vite dev server doesn't provide - see this file's other test's
    // own comment on that point; vite.config.ts's dev proxy does forward
    // /api/* to the real api server, so this is still a genuine real-HTTP
    // round trip, not an in-process supertest call).
    const publicPdfRes = await request.get('/api/v1/public/workingplan.pdf');
    expect(publicPdfRes.status()).toBe(200);
    expect(publicPdfRes.headers()['content-type']).toContain('application/pdf');
    const publicPdfBody = await publicPdfRes.body();
    expect(publicPdfBody.length).toBeGreaterThan(0);
    expect(publicPdfBody.slice(0, 5).toString('latin1')).toBe('%PDF-');

    // Internal PDF: real browser download via the actual export button,
    // same mechanism as this file's other test. Deliberately does NOT read
    // internalPdfResponse.body() (unlike the public-PDF check above) - found
    // empirically while writing this test that Playwright's Response.body()
    // comes back empty (0 bytes) for this particular response, apparently
    // because the app's downloadFile() helper (app/src/api/client.ts)
    // already consumes the fetch body into a Blob for the native
    // save-as-file flow before Playwright's own CDP-level buffering can
    // capture it - a browser-download-specific quirk, not something the
    // public PDF's plain APIRequestContext call hits. Status/content-type/a
    // real completed `download` event is what this file's pre-existing test
    // above already asserts for this same download, and is the honest,
    // reliable signal available here.
    await page.goto('/events');
    await expect(page.getByRole('heading', { name: 'Arbeitsplan' })).toBeVisible();
    const internalPdfResponsePromise = page.waitForResponse(
      (res) => res.url().includes('/api/v1/events/workingplan.pdf') && res.request().method() === 'GET',
    );
    const internalPdfDownloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Arbeitsplan als PDF exportieren' }).click();
    const internalPdfResponse = await internalPdfResponsePromise;
    expect(internalPdfResponse.status()).toBe(200);
    expect(internalPdfResponse.headers()['content-type']).toContain('application/pdf');
    const internalPdfDownload = await internalPdfDownloadPromise;
    expect(internalPdfDownload.suggestedFilename()).toMatch(/\.pdf$/);

    await page.getByRole('button', { name: 'Abmelden' }).click();

    // Restore all four to off so this file's other test (and any other spec
    // relying on the default footer-off state) sees the default again.
    await page.goto('/login');
    await page.getByLabel('E-Mail').fill('e2e-admin@example.org');
    await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
    await page.getByRole('button', { name: 'Anmelden', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();
    await page.goto('/configuration');
    await page.getByRole('tab', { name: 'Konfiguration' }).click();
    await setAll(false);
  },
);
