import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { accounts } from './fixtures';

async function switchTo(page: Page, language: 'Français' | 'العربية') {
  await page.getByRole('banner').getByRole('button', { name: /changer la langue|تغيير اللغة/i }).click();
  await page.getByRole('menuitemradio', { name: language }).click();
}

test('switch to Arabic on the sign-in page, sign in, and keep the language', async ({ page }) => {
  await page.goto('./');
  await switchTo(page, 'العربية');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('تسجيل الدخول');

  await page.getByLabel('البريد الإلكتروني').fill(accounts.superAdmin.email);
  await page.getByLabel(/^كلمة المرور/).fill(accounts.superAdmin.password);
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await expect(page).toHaveURL(accounts.superAdmin.home);

  // Navigation is translated and sits on the right-hand side.
  const nav = page.getByRole('navigation', { name: 'القائمة الرئيسية' });
  await expect(nav.getByRole('link', { name: 'الأوامر بمهمة' })).toBeVisible();
  const navBox = await nav.boundingBox();
  const viewport = page.viewportSize();
  expect(navBox && viewport && navBox.x + navBox.width / 2 > viewport.width / 2).toBeTruthy();

  // The choice survives a reload.
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

  await switchTo(page, 'Français');
  await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
  await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();
});

test('Arabic pages have no serious accessibility violations', async ({ page }) => {
  await page.goto('./');
  await switchTo(page, 'العربية');
  await page.getByLabel('البريد الإلكتروني').fill(accounts.superAdmin.email);
  await page.getByLabel(/^كلمة المرور/).fill(accounts.superAdmin.password);
  await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
  await expect(page).toHaveURL(accounts.superAdmin.home);
  for (const path of ['dashboard/admins', 'dashboard/admins/decomptes', 'dashboard/admins/analytics']) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    expect(serious.map((v) => `${path}: ${v.id}`)).toEqual([]);
  }
});
