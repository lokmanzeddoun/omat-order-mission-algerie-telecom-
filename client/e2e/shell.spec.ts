import { test, expect } from '@playwright/test';
import { accounts, login } from './fixtures';

test('failed sign-in shows an inline error', async ({ page }) => {
  await page.goto('./');
  await page.getByLabel(/adresse e-mail/i).fill(accounts.user.email);
  await page.getByLabel(/^mot de passe/i).fill('wrong-password');
  await page.getByRole('button', { name: /se connecter/i }).click();
  await expect(page.getByRole('alert').filter({ hasText: /incorrect/i })).toBeVisible();
  await expect(page).not.toHaveURL(/dashboard/);
});

test('admin shell: header, exercice, role navigation, user menu', async ({ page }) => {
  await login(page, 'superAdmin');
  const banner = page.getByRole('banner');
  await expect(banner.getByText('Gestion des Ordres de Mission')).toBeVisible();
  await expect(banner.getByRole('combobox')).not.toHaveValue('');
  const nav = page.getByRole('navigation', { name: 'Navigation principale' });
  for (const label of ['Tableau de bord', 'Décomptes', 'Ordres de mission', 'Utilisateurs', 'Services', 'Barème', 'Archive', 'Commentaires']) {
    await expect(nav.getByRole('link', { name: label })).toBeVisible();
  }
  await nav.getByRole('link', { name: 'Utilisateurs' }).click();
  await expect(page).toHaveURL(/admins\/users$/);
  await page.getByRole('button', { name: 'Menu utilisateur' }).click();
  await page.getByRole('menuitem', { name: 'Mon profil' }).click();
  await expect(page).toHaveURL(/dashboard\/me$/);
  // Profile now lives inside the shell
  await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();
});

test('admin shell: no Services entry, page redirects away', async ({ page }) => {
  await login(page, 'admin');
  const nav = page.getByRole('navigation', { name: 'Navigation principale' });
  await expect(nav.getByRole('link', { name: 'Utilisateurs' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Services' })).toHaveCount(0);
  await page.goto('/dashboard/admins/structures');
  await expect(page).not.toHaveURL(/structures$/);
});

test('user shell: own navigation and exercice loaded', async ({ page }) => {
  await login(page, 'user');
  const nav = page.getByRole('navigation', { name: 'Navigation principale' });
  await expect(nav.getByRole('link')).toHaveCount(1);
  await expect(nav.getByRole('link', { name: 'Mes ordres de mission' })).toBeVisible();
  await expect(page.getByRole('banner').getByRole('combobox')).not.toHaveValue('');
});

test('logout returns to sign-in', async ({ page }) => {
  await login(page, 'admin');
  await page.getByRole('button', { name: 'Menu utilisateur' }).click();
  await page.getByRole('menuitem', { name: 'Se déconnecter' }).click();
  await expect(page.getByLabel(/adresse e-mail/i)).toBeVisible();
});
