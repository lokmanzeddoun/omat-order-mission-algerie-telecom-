import { test, expect, type Page } from '@playwright/test';
import { login } from './fixtures';

const year = new Date().getFullYear();

async function createOrdre(page: Page, destination: string) {
  await page.getByRole('banner').getByRole('button', { name: 'Nouvel ordre de mission' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nouvel ordre de mission' });
  await dialog.getByRole('button', { name: 'Créer l’ordre de mission' }).click();
  await expect(dialog.getByText('La date de départ est obligatoire.')).toBeVisible();
  await dialog.getByLabel('Motif de la mission').fill(`Mission E2E ${destination}`);
  await dialog.getByLabel('Date de départ').fill(`${year}-10-01`);
  await dialog.getByLabel('Heure de départ').fill('08:00');
  await dialog.getByLabel('Date de retour').fill(`${year}-10-03`);
  await dialog.getByLabel('Heure de retour').fill('17:00');
  await dialog.getByLabel('Destination').fill(destination);
  await dialog.getByLabel('Moyen de transport').selectOption('SERVICE_CAR');
  const pdf = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Créer l’ordre de mission' }).click();
  await pdf; // creating an ordre downloads its PDF, as before
  await expect(dialog).toBeHidden();
}

test.describe('ordres de mission', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'superAdmin');
  });

  test('create, open detail, edit, validate and archive', async ({ page }) => {
    const destination = `Tlemcen-E2E${Date.now() % 100000}`;
    await createOrdre(page, destination);

    await page.goto('dashboard/admins');
    await page.getByRole('button', { name: 'Actualiser' }).click();
    await page.getByRole('searchbox', { name: 'Filtrer Destination' }).fill(destination);
    const table = page.getByRole('table', { name: 'Liste des ordres de mission' });
    const row = table.locator('tbody tr').filter({ hasText: destination });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('En cours');

    // Download from the row
    const pdf = page.waitForEvent('download');
    await row.getByRole('button', { name: 'Télécharger' }).click();
    await pdf;

    // Detail page (double-click)
    await row.dblclick();
    await expect(page).toHaveURL(/admins\/ordres\/\d+$/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Ordre de mission N°');
    await expect(page.getByText('Validation')).toBeVisible();

    // Edit from the detail page
    await page.getByRole('button', { name: 'Modifier' }).click();
    const edit = page.getByRole('dialog', { name: 'Modifier l’ordre de mission' });
    await edit.getByLabel('Heure de départ').fill('09:30');
    await edit.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(edit).toBeHidden();
    await expect(page.getByText(`01/10/${year} 09:30`)).toBeVisible();

    // Validate with the calculated entitlements
    await page.getByRole('button', { name: 'Valider' }).click();
    const validate = page.getByRole('dialog', { name: 'Valider l’ordre de mission' });
    const rights = await validate.getByText(/Droits calculés/).innerText();
    const [meals, nights] = (rights.match(/\d+/g) ?? ['0', '0']).map(Number);
    await validate.getByRole('button', { name: 'Valider et créer le décompte' }).click();
    await expect(validate.getByText('La distance parcourue est obligatoire.')).toBeVisible();
    await validate.getByLabel('Repas avec prise en charge').fill(String(meals));
    await validate.getByLabel('Nuitées avec prise en charge').fill(String(nights));
    await validate.getByLabel('Distance parcourue (km)').fill('120');
    await validate.getByRole('button', { name: 'Valider et créer le décompte' }).click();
    await expect(validate).toBeHidden();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Validé');

    // Archive (only available once validated)
    await page.getByRole('button', { name: "Plus d'actions" }).click();
    await page.getByRole('menuitem', { name: 'Archiver' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Archiver' }).click();
    await expect(page.getByRole('alertdialog')).toBeHidden();
  });

  test('cancel an ordre from the list', async ({ page }) => {
    const destination = `Bejaia-E2E${Date.now() % 100000}`;
    await createOrdre(page, destination);
    await page.goto('dashboard/admins');
    await page.getByRole('searchbox', { name: 'Filtrer Destination' }).fill(destination);
    const row = page.locator('tbody tr').filter({ hasText: destination });
    await expect(row).toHaveCount(1);
    await row.getByRole('button', { name: "Plus d'actions" }).click();
    await expect(page.getByRole('menuitem', { name: 'Archiver' })).toHaveCount(0);
    await page.getByRole('menuitem', { name: 'Annuler l’ordre' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: 'Annuler l’ordre' }).click();
    await expect(row).toHaveCount(0);
  });
});
