import { defineConfig } from '@playwright/test';

// Runs against a locally running stack (see e2e/README.md).
const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3100/omat/';

export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL,
    channel: 'chrome',
    headless: true,
    viewport: { width: 1440, height: 900 },
    locale: 'fr-FR',
    trace: 'retain-on-failure',
  },
});
