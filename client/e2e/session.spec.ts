import { expect, test } from '@playwright/test';
import { login } from './fixtures';

// ADR 0002: the session lives in memory and in the httpOnly refresh cookie only.
test('keeps no token in browser storage and survives a reload', async ({ page, context }) => {
  await login(page, 'user');

  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
  expect(stored).not.toMatch(/eyJ[\w-]+\.[\w-]+\.[\w-]+/); // no JWT anywhere
  expect(stored).not.toContain('"token"');

  const cookies = await context.cookies();
  const refresh = cookies.find((c) => c.name === 'refresh_token');
  expect(refresh?.httpOnly).toBe(true);
  expect(refresh?.sameSite).toBe('Strict');

  await page.reload();
  await expect(page).toHaveURL(/dashboard\/users$/);
});
