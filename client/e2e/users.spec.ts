import { test, expect } from '@playwright/test';
import { login } from './fixtures';

test.describe('utilisateurs', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'superAdmin');
    await page.goto('dashboard/admins/users');
    await expect(page.getByRole('heading', { name: 'Utilisateurs', level: 1 })).toBeVisible();
  });

  test('tabs filter by role', async ({ page }) => {
    const table = page.getByRole('table', { name: 'Liste des utilisateurs' });
    await page.getByRole('tab', { name: /administrateurs/i }).click();
    await expect(table.locator('tbody tr').filter({ hasText: 'Agent' })).toHaveCount(0);
    await page.getByRole('tab', { name: /agents/i }).click();
    await expect(table.locator('tbody tr').filter({ hasText: 'Administrateur' })).toHaveCount(0);
  });

  test('create, view, edit, reset password, new ordre and archive', async ({ page }) => {
    const matricule = String(90000 + (Date.now() % 9999));
    const table = page.getByRole('table', { name: 'Liste des utilisateurs' });

    // Create with validation
    await page.getByRole('button', { name: 'Ajouter un utilisateur' }).click();
    const create = page.getByRole('dialog', { name: 'Ajouter un utilisateur' });
    await create.getByRole('button', { name: 'Ajouter' }).click();
    await expect(create.getByText('Le matricule est obligatoire.')).toBeVisible();
    await expect(create.getByText('Le service est obligatoire.')).toBeVisible();
    await create.getByLabel('Matricule').fill(matricule);
    await create.getByLabel('Adresse e-mail').fill(`e2e.${matricule}@algérietelecom.dz`);
    await create.getByLabel(/^Nom\b/).fill('Testeur');
    await create.getByLabel('Prénom').fill('E2E');
    await create.getByLabel('Grade (fonction)').fill('Analyste');
    await create.getByLabel('Service').selectOption({ index: 1 });
    await create.getByRole('button', { name: 'Ajouter' }).click();
    await expect(create).toBeHidden();

    await page.getByRole('searchbox', { name: 'Filtrer Matricule' }).fill(matricule);
    const row = table.getByRole('row').filter({ hasText: matricule });
    await expect(row).toHaveCount(1);

    // View
    await row.dblclick();
    const view = page.getByRole('dialog', { name: 'Détails de l’utilisateur' });
    await expect(view.getByLabel(/^Nom\b/)).toHaveValue('Testeur');
    await view.getByRole('button', { name: 'Fermer' }).first().click();

    // Edit (matricule locked)
    await row.getByRole('button', { name: 'Modifier' }).click();
    const edit = page.getByRole('dialog', { name: 'Modifier l’utilisateur' });
    await expect(edit.getByLabel('Matricule')).toHaveAttribute('readonly', '');
    await edit.getByLabel('Grade (fonction)').fill('Analyste principal');
    await edit.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(row).toContainText('Analyste principal');

    // Reset password
    await row.getByRole('button', { name: "Plus d'actions" }).click();
    await page.getByRole('menuitem', { name: 'Réinitialiser le mot de passe' }).click();
    const reset = page.getByRole('dialog', { name: 'Réinitialiser le mot de passe' });
    await reset.getByLabel('Nouveau mot de passe').fill('abc');
    await reset.getByRole('button', { name: 'Réinitialiser' }).click();
    await expect(reset.getByText('au moins 6 caractères')).toBeVisible();
    await reset.getByLabel('Nouveau mot de passe').fill('Nouveau123');
    await reset.getByLabel('Confirmer le mot de passe').fill('Nouveau123');
    await reset.getByRole('button', { name: 'Réinitialiser' }).click();
    await expect(reset).toBeHidden();

    // New ordre de mission for this user opens the mission form
    await row.getByRole('button', { name: "Plus d'actions" }).click();
    await page.getByRole('menuitem', { name: 'Nouvel ordre de mission' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();

    // Archive
    await row.getByRole('button', { name: "Plus d'actions" }).click();
    await page.getByRole('menuitem', { name: 'Archiver' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Archiver' }).click();
    await expect(table.getByRole('row').filter({ hasText: matricule })).toHaveCount(0);
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
