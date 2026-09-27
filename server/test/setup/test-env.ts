import { config as loadDotenv } from 'dotenv';
import { resolve } from 'path';

/**
 * The e2e database. DATABASE_URL_TEST wins; otherwise it is the dev
 * DATABASE_URL (from server/.env) pointed at the `omat_test` database.
 * Refuses anything whose database name does not end in `_test`, because the
 * suite wipes it.
 */
export function testDatabaseUrl(): string {
  loadDotenv({ path: resolve(__dirname, '../../.env') });
  const raw = process.env.DATABASE_URL_TEST ?? process.env.DATABASE_URL;
  if (!raw) {
    throw new Error('Set DATABASE_URL_TEST (or DATABASE_URL in server/.env).');
  }
  const url = new URL(raw);
  if (!process.env.DATABASE_URL_TEST) url.pathname = '/omat_test';
  const name = url.pathname.slice(1);
  if (!name.endsWith('_test')) {
    throw new Error(
      `Refusing to run e2e tests against "${name}": the database name must end in _test.`,
    );
  }
  return url.toString();
}

/** Env for the app under test. Runs in every test worker (setupFiles). */
export function applyTestEnv() {
  process.env.DATABASE_URL = testDatabaseUrl();
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';
  process.env.JWT_SECRET = 'e2e-access-secret-at-least-32-bytes-long!!';
  process.env.JWT_REFRESH_SECRET = 'e2e-refresh-secret-at-least-32-bytes-long!';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.MFA_ENCRYPTION_KEY = 'e2e-mfa-encryption-key-at-least-32-bytes!';
  process.env.AUTH_MFA_REQUIRED = 'true';
  // The suites log in far more often than a person would.
  process.env.AUTH_RATE_LIMIT = '1000';
}
