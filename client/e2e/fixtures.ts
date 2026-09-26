import { Page, expect } from '@playwright/test';

// Seeded accounts from server/prisma/seed.ts (local development data only).
export const accounts = {
  superAdmin: { email: 'superadmin@algérietelecom.dz', password: 'password123', home: /dashboard\/admins$/ },
  admin: { email: 'ahmed.benali@algérietelecom.dz', password: 'password123', home: /dashboard\/admins$/ },
  user: { email: 'karim.mansouri@algérietelecom.dz', password: 'password123', home: /dashboard\/users$/ },
} as const;

export type AccountKey = keyof typeof accounts;

export async function login(page: Page, who: AccountKey) {
  const { email, password, home } = accounts[who];
  await page.goto('./');
  await page.getByLabel(/adresse e-mail/i).fill(email);
  await page.getByLabel(/^mot de passe/i).fill(password);
  await page.getByRole('button', { name: /se connecter/i }).click();
  await expect(page).toHaveURL(home);
}

export const adminRoutes = [
  { path: 'dashboard/admins', title: /ordres de mission/i },
  { path: 'dashboard/admins/users', title: /utilisateurs/i },
  { path: 'dashboard/admins/structures', title: /services|structures/i },
  { path: 'dashboard/admins/barem', title: /barème/i },
  { path: 'dashboard/admins/decomptes', title: /décomptes/i },
  { path: 'dashboard/admins/archive', title: /archive/i },
  { path: 'dashboard/admins/support', title: /commentaires/i },
  { path: 'dashboard/admins/analytics', title: /analytique/i },
  { path: 'dashboard/me', title: /profil/i },
] as const;
