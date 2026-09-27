import { test, expect } from '@playwright/test';
import { login } from './fixtures';

test('admin sees a comment sent by an agent, filters by type and opens it', async ({ page, browser }) => {
  const text = `Question agent E2E ${Date.now()}`;

  // Agent sends a general comment
  await login(page, 'user');
  await page.getByRole('button', { name: 'Ajouter un commentaire' }).click();
  const dialog = page.getByRole('dialog', { name: 'Ajouter un commentaire' });
  await dialog.getByLabel(/Votre commentaire/).fill(text);
  await dialog.getByRole('button', { name: 'Envoyer' }).click();
  await expect(dialog).toBeHidden();

  // Admin reads it
  const admin = await browser.newPage();
  await login(admin, 'superAdmin');
  await admin.goto('dashboard/admins/support');
  await admin.getByRole('button', { name: /Autres/ }).click();
  await admin.getByRole('searchbox', { name: 'Filtrer Message' }).fill(text);
  const row = admin.locator('tbody tr').filter({ hasText: text });
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('Karim Mansouri');
  await row.getByRole('button', { name: 'Voir le détail' }).click();
  await expect(admin.getByRole('dialog', { name: 'Autre' })).toContainText(text);
  await admin.close();
});
