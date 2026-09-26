import { test, expect } from '@playwright/test';
import { login } from './fixtures';

test('analytics follows the header exercice and can show all exercices', async ({ page }) => {
  await login(page, 'superAdmin');
  await page.getByRole('banner').getByRole('combobox').selectOption('2024');
  await page.goto('dashboard/admins/analytics');
  const kpis = page.getByRole('region', { name: 'Indicateurs clés' });
  await expect(kpis).toContainText('Ordres de mission');
  await expect(kpis).toContainText('4');
  await expect(page.getByText('Ordres de mission par statut')).toBeVisible();
  // French labels, not raw enum values
  await expect(page.getByText(/INPROGRESS|REGECTED|COMPLETED/)).toHaveCount(0);
  await expect(page.getByRole('table', { name: /par direction/i })).toContainText('Nord');

  await page.getByRole('radio', { name: 'Tous les exercices' }).click();
  await expect(page.getByText('Indicateurs de tous les exercices.')).toBeVisible();
  await expect(kpis).toBeVisible();
  await page.getByRole('banner').getByRole('combobox').selectOption({ index: 0 });
});
