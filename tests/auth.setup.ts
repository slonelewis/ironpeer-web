import { test as setup, expect } from '@playwright/test';
import { AUTH_FILE } from '../playwright.config';

setup('authenticate', async ({ page }) => {
  const email = process.env.PLAYWRIGHT_TEST_EMAIL;
  const password = process.env.PLAYWRIGHT_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error('PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD must be set');
  }

  await page.goto('/login', { waitUntil: 'load', timeout: 60000 });

  // Wait for the email field to be ready
  const emailField = page.locator('input[type="email"]').first();
  await emailField.waitFor({ state: 'visible', timeout: 30000 });
  await emailField.fill(email);

  // Fill password
  const passwordField = page.locator('input[type="password"]').first();
  await passwordField.fill(password);

  // Click submit — use text fallback if type=submit not found
  const submitBtn = page.locator('button[type="submit"]').or(
    page.getByRole('button', { name: /log in/i })
  ).first();
  await submitBtn.click();

  // Wait for redirect away from login
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 30000 });

  // Save the auth state
  await page.context().storageState({ path: AUTH_FILE });
  console.log('Auth saved to', AUTH_FILE);
});
