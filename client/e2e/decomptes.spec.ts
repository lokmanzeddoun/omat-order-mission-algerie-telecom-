import { test, expect, type Page } from '@playwright/test';
import { login } from './fixtures';
import { createOrdre, validateOrdre } from './helpers';

async function pendingDecompteRow(page: Page, destination: string) {
  await page.goto('dashboard/admins/decomptes');
  await page.getByRole('searchbox', { name: 'Filtrer Ordre de mission' }).fill(destination);
  const row = page.locator('tbody tr').filter({ hasText: destination });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('En attente');
  return row;
}

test.describe('décomptes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'superAdmin');
  });

  test('reject requires a reason; accept with a message; detail, comments, download, archive', async ({ page }) => {
    const a = `Setif-E2E${Date.now() % 100000}`;
    const b = `Batna-E2E${Date.now() % 100000}`;
    await createOrdre(page, a);
    await createOrdre(page, b);
    await validateOrdre(page, a);
    await validateOrdre(page, b);

    // Reject (reason required)
    let row = await pendingDecompteRow(page, a);
    await row.getByRole('button', { name: "Plus d'actions" }).click();
    await page.getByRole('menuitem', { name: 'Rejeter' }).click();
    const reject = page.getByRole('alertdialog');
    await expect(reject.getByRole('button', { name: 'Rejeter' })).toBeDisabled();
    await reject.getByLabel(/Motif du rejet/).fill('Justificatifs manquants (E2E)');
    await reject.getByRole('button', { name: 'Rejeter' }).click();
    await expect(row).toContainText('Rejeté');

    // Comments of the rejected décompte include the reason
    await row.getByRole('button', { name: "Plus d'actions" }).click();
    await page.getByRole('menuitem', { name: 'Voir les commentaires' }).click();
    await expect(page.getByRole('dialog', { name: /commentaires/ })).toContainText('Justificatifs manquants (E2E)');
    await page.keyboard.press('Escape');

    // Accept from the detail page, with a message
    row = await pendingDecompteRow(page, b);
    await row.dblclick();
    await expect(page).toHaveURL(/admins\/decomptes\/\d+$/);
    await page.getByRole('button', { name: 'Accepter' }).click();
    const accept = page.getByRole('alertdialog');
    await accept.getByLabel(/Message à l’employé/).fill('Dossier complet (E2E)');
    await accept.getByRole('button', { name: 'Accepter' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Accepté');

    // Download and link back to the ordre
    const pdf = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Télécharger' }).click();
    await pdf;
    await expect(page.getByRole('link', { name: /Ouvrir l’ordre N°/ })).toBeVisible();

    // Archive from the detail page
    await page.getByRole('button', { name: "Plus d'actions" }).click();
    await page.getByRole('menuitem', { name: 'Archiver' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Archiver' }).click();
    await expect(page.getByRole('alertdialog')).toBeHidden();
  });

  test('status strip filters and CSV export', async ({ page }) => {
    await page.goto('dashboard/admins/decomptes');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /En attente/ }).click();
    const rows = page.locator('tbody tr');
    const n = await rows.count();
    for (let i = 0; i < Math.min(n, 5); i++) {
      const text = await rows.nth(i).innerText();
      if (!/Aucun décompte/.test(text)) expect(text).toContain('En attente');
    }
    const csv = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Exporter (CSV)' }).click();
    expect((await csv).suggestedFilename()).toMatch(/^decomptes-.*\.csv$/);
  });
});
