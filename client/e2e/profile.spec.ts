import { test, expect, type Page } from '@playwright/test';
import { accounts, login } from './fixtures';

async function changePassword(page: Page, current: string, next: string) {
  await page.getByLabel('Mot de passe actuel').fill(current);
  await page.getByLabel('Nouveau mot de passe').fill(next);
  await page.getByLabel('Confirmer le mot de passe').fill(next);
  await page.getByRole('button', { name: 'Enregistrer' }).click();
}

test.describe('profile', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'admin');
    await page.goto('dashboard/me');
  });

  test('shows the account details', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Mon profil', level: 1 })).toBeVisible();
    await expect(page.getByText(accounts.admin.email)).toBeVisible();
  });

  test('validates the password form inline', async ({ page }) => {
    await page.getByLabel('Nouveau mot de passe').fill('short');
    await page.getByLabel('Confirmer le mot de passe').fill('different');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Saisissez votre mot de passe actuel.')).toBeVisible();
    await expect(page.getByText('au moins 8 caractères')).toBeVisible();
    await expect(page.getByText('ne correspondent pas')).toBeVisible();
  });

  test('changes the password and restores it', async ({ page }) => {
    const temp = 'Temporaire123';
    await changePassword(page, accounts.admin.password, temp);
    await expect(page.getByText('Mot de passe modifié avec succès')).toBeVisible();
    await expect(page.getByLabel('Mot de passe actuel')).toHaveValue('');
    await changePassword(page, temp, accounts.admin.password);
    await expect(page.getByText('Mot de passe modifié avec succès').first()).toBeVisible();
  });
});
