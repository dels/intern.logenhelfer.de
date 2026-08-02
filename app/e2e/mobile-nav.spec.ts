import { test, expect, type Page } from '@playwright/test';

// Shared by both viewport-size tests below: log in and assert the burger
// button never visually overlaps the page headline at the current viewport.
async function assertBurgerDoesNotOverlapHeading(page: Page) {
  await page.goto('/login');
  await page.getByLabel('E-Mail').fill('e2e@example.org');
  await page.getByLabel('Passwort').fill('e2e-Passw0rd!');
  await page.getByRole('button', { name: 'Anmelden', exact: true }).click();

  const heading = page.getByRole('heading', { name: 'Übersicht' });
  await expect(heading).toBeVisible();
  const burger = page.getByRole('button', { name: 'Menü öffnen' });
  await expect(burger).toBeVisible();

  const headingBox = await heading.boundingBox();
  const burgerBox = await burger.boundingBox();
  if (!headingBox || !burgerBox) throw new Error('expected both elements to have a layout box');

  const overlaps = headingBox.x < burgerBox.x + burgerBox.width
    && headingBox.x + headingBox.width > burgerBox.x
    && headingBox.y < burgerBox.y + burgerBox.height
    && headingBox.y + headingBox.height > burgerBox.y;
  expect(overlaps).toBe(false);

  await burger.click();
  await expect(page.getByRole('link', { name: 'Übersicht' })).toBeVisible();
}

test.describe('mobile navigation', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('the burger button and the page headline do not overlap on a narrow viewport', async ({ page }) => {
    await assertBurgerDoesNotOverlapHeading(page);
  });
});

test.describe('mobile navigation at tablet width', () => {
  // 768px is still below this app's MUI `md` breakpoint (900px, unmodified
  // default - see src/theme.ts), so AppShell still renders its mobile
  // burger-menu layout here, not the permanent desktop sidebar. Same
  // overlap assertion as the 375px case therefore applies unchanged.
  test.use({ viewport: { width: 768, height: 1024 } });

  test('the burger button and the page headline do not overlap on a tablet-width viewport', async ({ page }) => {
    await assertBurgerDoesNotOverlapHeading(page);
  });
});
