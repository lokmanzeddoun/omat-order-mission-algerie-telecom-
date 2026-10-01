import { test, expect } from '@playwright/test';
import { login } from './fixtures';

test.describe('services (structures)', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'superAdmin');
    await page.goto('dashboard/admins/structures');
    await expect(page.getByRole('heading', { name: 'Structures', level: 1 })).toBeVisible();
  });

  test('add, view, edit and archive a service', async ({ page }) => {
    const code = `E2E${Date.now().toString().slice(-6)}`;
    const table = page.getByRole('table', { name: 'Liste des structures' });

    // Add
    await page.getByRole('button', { name: 'Ajouter une structure' }).click();
    const dialog = page.getByRole('dialog', { name: 'Ajouter une structure' });
    await dialog.getByRole('button', { name: 'Ajouter' }).click();
    await expect(dialog.getByText('Le code est obligatoire.')).toBeVisible();
    await dialog.getByLabel('Code').fill(code);
    await dialog.getByLabel('Nom de la structure').fill('Service de test E2E');
    await dialog.getByRole('button', { name: 'Ajouter' }).click();
    await expect(dialog).toBeHidden();

    // Filter row finds it
    await page.getByRole('searchbox', { name: 'Filtrer Code' }).fill(code);
    const row = table.getByRole('row').filter({ hasText: code });
    await expect(row).toHaveCount(1);

    // View (double-click)
    await row.dblclick();
    const view = page.getByRole('dialog', { name: 'Détails de la structure' });
    await expect(view.getByLabel('Nom de la structure')).toHaveValue('Service de test E2E');
    await view.getByRole('button', { name: 'Fermer' }).first().click();

    // Edit
    await row.getByRole('button', { name: 'Modifier' }).click();
    const edit = page.getByRole('dialog', { name: 'Modifier la structure' });
    await expect(edit.getByLabel('Code')).toHaveAttribute('readonly', '');
    await edit.getByLabel('Nom de la structure').fill('Service de test E2E (modifié)');
    await edit.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(row).toContainText('(modifié)');

    // Archive via the "⋯" menu
    await row.getByRole('button', { name: "Plus d'actions" }).click();
    await page.getByRole('menuitem', { name: 'Archiver' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Archiver' }).click();
    await expect(table.getByRole('row').filter({ hasText: code })).toHaveCount(0);
  });

  test('export downloads a file and import opens a file chooser', async ({ page }) => {
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exporter' }).click();
    expect((await download).suggestedFilename()).toBeTruthy();

    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Importer' }).click();
    await chooser;
  });
});
