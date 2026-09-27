import { execSync } from 'child_process';
import { resolve } from 'path';
import { testDatabaseUrl } from './test-env';

/** Recreates the e2e database from the migrations once per run. */
export default function globalSetup() {
  execSync('npx prisma migrate reset --force --skip-seed --skip-generate', {
    cwd: resolve(__dirname, '../..'),
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
    stdio: 'pipe',
  });
}
