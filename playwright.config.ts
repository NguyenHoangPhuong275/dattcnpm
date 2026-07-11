import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

import { assertRunDatabaseUri, createRunDatabaseUri } from './tests/database-safety';

const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (!match) continue;
    const key = match[1];
    let value = (match[2] ?? '').trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key] && value) process.env[key] = value;
  }
}

const explicitE2eUri = process.env.E2E_MONGODB_URI;
if (!explicitE2eUri) {
  throw new Error('E2E_MONGODB_URI is required and must target an isolated e2e database');
}

const existingE2eRunDatabaseUri = process.env.E2E_RUN_MONGODB_URI;
const e2eRunDatabaseUri = existingE2eRunDatabaseUri
  ? (assertRunDatabaseUri(existingE2eRunDatabaseUri, 'e2e'), existingE2eRunDatabaseUri)
  : createRunDatabaseUri(explicitE2eUri, 'e2e');
process.env.E2E_RUN_MONGODB_URI = e2eRunDatabaseUri;
process.env.MONGODB_URI = e2eRunDatabaseUri;

const PORT = process.env.E2E_PORT ?? '3000';
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${PORT}`;
const webServerCommand = process.env.E2E_USE_PRODUCTION_BUILD === '1' ? 'npm run start' : 'npm run dev';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  globalTeardown: './e2e/global-teardown.ts',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    headless: true,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
