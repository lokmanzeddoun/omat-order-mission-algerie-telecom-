import { test, expect } from '@playwright/test';
import { login } from './fixtures';

const year = new Date().getFullYear();

test.describe('agent dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'user');
  });

  test('create own ordre, open its detail, edit, cancel', async ({ page }) => {
    const destination = `Oran-AGT${Date.now() % 100000}`;
    await page.getByRole('banner').getByRole('button', { name: 'Nouvel ordre de mission' }).click();
    const dialog = page.getByRole('dialog', { name: 'Nouvel ordre de mission' });
    await expect(dialog).toContainText('Employé concerné : vous-même');
    await dialog.getByLabel('Motif de la mission').fill('Mission agent E2E');
    await dialog.getByLabel('Date de départ').fill(`02/11/${year}`);
    await dialog.getByLabel('Heure de départ').fill('07:30');
    await dialog.getByLabel('Destination').fill(destination);
    await dialog.getByLabel('Moyen de transport').selectOption('TRANSPORT_ENTREPRISE');
    const pdf = page.waitForEvent('download');
    await dialog.getByRole('button', { name: 'Créer l’ordre de mission' }).click();
    await pdf;

    await page.getByRole('button', { name: 'Actualiser' }).click();
    const table = page.getByRole('table', { name: 'Mes ordres de mission' });
    await page.getByRole('searchbox', { name: 'Filtrer Destination' }).first().fill(destination);
    const row = table.locator('tbody tr').filter({ hasText: destination });
    await expect(row).toHaveCount(1);

    // Agents cannot validate or archive
    await row.getByRole('button', { name: "Plus d'actions" }).click();
    await expect(page.getByRole('menuitem', { name: 'Valider' })).toHaveCount(0);
    await expect(page.getByRole('menuitem', { name: 'Archiver' })).toHaveCount(0);
    await page.keyboard.press('Escape');

    // Detail page on the agent route
    await row.getByRole('button', { name: 'Voir le détail' }).click();
    await expect(page).toHaveURL(/dashboard\/users\/ordres\/\d+$/);
    await page.getByRole('button', { name: 'Modifier' }).click();
    const edit = page.getByRole('dialog', { name: 'Modifier l’ordre de mission' });
    await edit.getByLabel('Motif de la mission').fill('Mission agent E2E (modifiée)');
    await edit.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByRole('heading', { level: 1 }).locator('..')).toContainText('(modifiée)');

    // Cancel it from the list
    await page.getByRole('link', { name: 'Mes ordres de mission' }).first().click();
    await page.getByRole('searchbox', { name: 'Filtrer Destination' }).first().fill(destination);
    await row.getByRole('button', { name: "Plus d'actions" }).click();
    await page.getByRole('menuitem', { name: 'Annuler l’ordre' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Annuler l’ordre' }).click();
    await expect(row).toHaveCount(0);
  });

  test('export CSV, décompte comments and general comment', async ({ page }) => {
    await page.getByRole('banner').getByRole('combobox').selectOption('2024');
    const table = page.getByRole('table', { name: 'Mes ordres de mission' });
    await expect(table.locator('tbody tr').first()).toContainText('Oran');

    const csv = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exporter (CSV)' }).click();
    expect((await csv).suggestedFilename()).toMatch(/mes-ordres-de-mission-2024\.csv$/);

    const decomptes = page.getByRole('table', { name: 'Mes décomptes' });
    await decomptes.locator('tbody tr').first().getByRole('button', { name: 'Voir les commentaires' }).click();
    const panel = page.getByRole('dialog', { name: /Décompte N° \d+ — commentaires/ });
    await expect(panel).toContainText('Décompte validé');
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Ajouter un commentaire' }).click();
    const dialog = page.getByRole('dialog', { name: 'Ajouter un commentaire' });
    await dialog.getByRole('button', { name: 'Envoyer' }).click();
    await expect(dialog.getByText('Saisissez votre commentaire.')).toBeVisible();
    await dialog.getByLabel(/Votre commentaire/).fill('Question générale (test E2E)');
    await dialog.getByRole('button', { name: 'Envoyer' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText('Commentaire ajouté avec succès')).toBeVisible();

    await page.getByRole('banner').getByRole('combobox').selectOption({ index: 0 });
  });
});
