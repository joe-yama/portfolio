import { defineConfig, devices } from '@playwright/test';

export const PORT = 4399;
export const baseURL = `http://127.0.0.1:${PORT}/portfolio/`;

export default defineConfig({
  testDir: 'tests/e2e',
  reporter: 'list',
  globalSetup: './tests/e2e/global-setup.ts',
  globalTeardown: './tests/e2e/global-teardown.ts',
  use: { baseURL },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
