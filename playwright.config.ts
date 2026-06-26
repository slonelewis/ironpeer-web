import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import fs from 'fs';

// Load .env.playwright if it exists (local dev)
const envFile = path.resolve(__dirname, '.env.playwright');
if (fs.existsSync(envFile)) {
  fs.readFileSync(envFile, 'utf-8')
    .split('\n')
    .filter(l => l && !l.startsWith('#'))
    .forEach(l => {
      const [k, ...v] = l.split('=');
      if (k && !process.env[k]) process.env[k] = v.join('=').trim();
    });
}

export const AUTH_FILE = 'playwright/.auth/user.json';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  timeout: 60000,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'https://ironpeer.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 30000,
    navigationTimeout: 60000,
  },
  projects: [
    // Setup: log in once and save session
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Tests that need a logged-in session
    {
      name: 'authenticated',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
      testIgnore: [
        '**/auth.setup.ts',
        '**/auth.spec.ts',
        '**/navigation.spec.ts',
        '**/homepage.spec.ts',
        '**/mobile.spec.ts',
        '**/signup.spec.ts',
      ],
    },
    // Tests that run without login (public pages + auth flow)
    {
      name: 'public',
      use: { ...devices['Desktop Chrome'] },
      testMatch: [
        '**/navigation.spec.ts',
        '**/homepage.spec.ts',
        '**/mobile.spec.ts',
        '**/search.spec.ts',
        '**/auth.spec.ts',
      ],
    },
  ],
});
