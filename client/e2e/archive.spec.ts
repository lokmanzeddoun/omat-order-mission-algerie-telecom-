import { test, expect } from '@playwright/test';
import { login } from './fixtures';

test('archive a service, view it in the archive and restore it', async ({ page }) => {
  await login(page, 'superAdmin');
  const code = `ARC${Date.now().toString().slice(-6)}`;

  await page.goto('dashboard/admins/structures');
  await page.getByRole('button', { name: 'Ajouter un service' }).click();
  const create = page.getByRole('dialog', { name: 'Ajouter un service' });
  await create.getByLabel('Code').fill(code);
  await create.getByLabel('Nom du service').fill('Service archivé E2E');
  await create.getByRole('button', { name: 'Ajouter' }).click();
  await page.getByRole('searchbox', { name: 'Filtrer Code' }).fill(code);
  const row = page.locator('tbody tr').filter({ hasText: code });
  await row.getByRole('button', { name: "Plus d'actions" }).click();
  await page.getByRole('menuitem', { name: 'Archiver' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Archiver' }).click();
  await expect(row).toHaveCount(0);

  await page.goto('dashboard/admins/archive');
  await page.getByRole('tab', { name: /Services/ }).click();
  await page.getByRole('searchbox', { name: 'Filtrer Code' }).fill(code);
  const archived = page.getByRole('table', { name: 'Services archivés' }).locator('tbody tr').filter({ hasText: code });
  await expect(archived).toHaveCount(1);

  await archived.getByRole('button', { name: 'Voir le détail' }).click();
  await expect(page.getByRole('dialog', { name: 'Élément archivé' })).toContainText('Service archivé E2E');
  await page.keyboard.press('Escape');

  await archived.getByRole('button', { name: 'Désarchiver' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Désarchiver' }).click();
  await expect(archived).toHaveCount(0);

  await page.goto('dashboard/admins/structures');
  await page.getByRole('searchbox', { name: 'Filtrer Code' }).fill(code);
  await expect(page.locator('tbody tr').filter({ hasText: code })).toHaveCount(1);
});

test('archive tabs list each kind', async ({ page }) => {
  await login(page, 'superAdmin');
  await page.goto('dashboard/admins/archive');
  for (const [tab, caption] of [
    ['Ordres de mission', 'Ordres de mission archivés'],
    ['Décomptes', 'Décomptes archivés'],
    ['Utilisateurs', 'Utilisateurs archivés'],
    ['Services', 'Services archivés'],
  ]) {
    await page.getByRole('tab', { name: new RegExp(tab) }).click();
    await expect(page.getByRole('table', { name: caption })).toBeVisible();
  }
});
