import { expect, type Page } from '@playwright/test';

const year = new Date().getFullYear();

/** Creates an ordre de mission from the header and returns once its PDF has downloaded. */
export async function createOrdre(page: Page, destination: string) {
  await page.getByRole('banner').getByRole('button', { name: 'Nouvel ordre de mission' }).click();
  const dialog = page.getByRole('dialog', { name: 'Nouvel ordre de mission' });
  await dialog.getByLabel('Motif de la mission').fill(`Mission E2E ${destination}`);
  await dialog.getByLabel('Date de départ').fill(`${year}-10-01`);
  await dialog.getByLabel('Heure de départ').fill('08:00');
  await dialog.getByLabel('Date de retour').fill(`${year}-10-03`);
  await dialog.getByLabel('Heure de retour').fill('17:00');
  await dialog.getByLabel('Destination').fill(destination);
  await dialog.getByLabel('Moyen de transport').selectOption('SERVICE_CAR');
  const pdf = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Créer l’ordre de mission' }).click();
  await pdf;
  await expect(dialog).toBeHidden();
}

/** Validates the ordre with the given destination (admin), which creates its décompte. */
export async function validateOrdre(page: Page, destination: string) {
  await page.goto('dashboard/admins');
  await page.getByRole('searchbox', { name: 'Filtrer Destination' }).fill(destination);
  const row = page.locator('tbody tr').filter({ hasText: destination });
  await expect(row).toHaveCount(1);
  await row.getByRole('button', { name: "Plus d'actions" }).click();
  await page.getByRole('menuitem', { name: 'Valider' }).click();
  const dialog = page.getByRole('dialog', { name: 'Valider l’ordre de mission' });
  const rights = await dialog.getByText(/Droits calculés/).innerText();
  const [meals, nights] = (rights.match(/\d+/g) ?? ['0', '0']).map(Number);
  await dialog.getByLabel('Repas avec prise en charge').fill(String(meals));
  await dialog.getByLabel('Nuitées avec prise en charge').fill(String(nights));
  await dialog.getByLabel('Distance parcourue (km)').fill('80');
  await dialog.getByRole('button', { name: 'Valider et créer le décompte' }).click();
  await expect(dialog).toBeHidden();
}
