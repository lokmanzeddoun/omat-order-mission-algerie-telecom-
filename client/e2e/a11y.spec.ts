import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { adminRoutes, login } from './fixtures';

async function audit(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const summary = serious.map((v) => `${v.id} (${v.impact}): ${v.nodes.length}× — ${v.nodes[0]?.target.join(' ')}`);
  expect(summary, summary.join('\n')).toEqual([]);
}

test('sign-in page', async ({ page }) => {
  await page.goto('./');
  await audit(page);
});

test.describe('admin pages', () => {
  test.beforeEach(async ({ page }) => login(page, 'superAdmin'));
  for (const route of adminRoutes) {
    test(route.path, async ({ page }) => {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      await audit(page);
    });
  }
  test('ordre detail and an open dialog', async ({ page }) => {
    await page.goto('dashboard/admins/ordres/1');
    await page.waitForLoadState('networkidle');
    await audit(page);
    await page.goto('dashboard/admins/users');
    await page.getByRole('button', { name: 'Ajouter un utilisateur' }).click();
    await audit(page);
  });
});

test('agent dashboard', async ({ page }) => {
  await login(page, 'user');
  await page.waitForLoadState('networkidle');
  await audit(page);
});
