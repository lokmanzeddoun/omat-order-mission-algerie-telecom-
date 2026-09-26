import { test, expect } from '@playwright/test';
import { adminRoutes, login } from './fixtures';

// Baseline smoke suite: every route renders its title without page errors,
// and full-page screenshots are written for visual review (not asserted).
test.describe('admin routes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'superAdmin');
  });

  for (const route of adminRoutes) {
    test(`renders ${route.path}`, async ({ page }, testInfo) => {
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(route.path);
      await expect(page.getByRole('heading', { name: route.title }).first()).toBeVisible();
      await page.waitForLoadState('networkidle');
      await page.screenshot({
        path: `e2e/.screens/${testInfo.project.name || 'desktop'}/${route.path.replace(/\//g, '_')}.png`,
        fullPage: true,
      });
      expect(errors).toEqual([]);
    });
  }
});

test.describe('role landing', () => {
  test('admin lands on admin dashboard', async ({ page }) => {
    await login(page, 'admin');
  });

  test('user lands on user dashboard', async ({ page }) => {
    await login(page, 'user');
    await expect(page.getByText(/ordre de mission/i).first()).toBeVisible();
  });
});
