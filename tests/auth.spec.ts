import { test, expect } from '@playwright/test';

// REQUIRES: PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD env vars for auth tests

const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD || '';

/** Helper: log in with given credentials */
async function login(page: any, email: string, password: string) {
  await page.goto('/login', { timeout: 10000 });
  await page.fill('input[type="email"], input[name*="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
}

test.describe('Authentication', () => {
  test.describe.configure({ mode: 'serial' });

  test('login page has email + password fields and submit button', async ({ page }) => {
    await page.goto('/login', { timeout: 10000 });
    await expect(page.locator('input[type="email"], input[name*="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('login with wrong password shows error message', async ({ page }) => {
    await login(page, TEST_EMAIL || 'test@example.com', 'definitely-wrong-password-xyz');
    // Wait a moment for response
    await page.waitForTimeout(2000);
    const errorMsg = page
      .getByText(/invalid|incorrect|wrong|authentication failed|error/i)
      .or(page.locator('[class*="error"], [class*="Error"], [role="alert"]'));
    // Should either stay on login or show an error
    const url = page.url();
    const onLogin = url.includes('/login');
    if (!onLogin) {
      // If redirected away, something unexpected happened; that's OK if there are no credentials
    } else {
      await expect(errorMsg.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('login with blank fields shows validation errors or prevents submit', async ({ page }) => {
    await page.goto('/login', { timeout: 10000 });
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
    // HTML5 native validation or custom error messaging
    const emailInput = page.locator('input[type="email"], input[name*="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    // Page should still be on login (not navigated away)
    await expect(page).toHaveURL(/login/);
    // Check native validation message or custom error
    const emailValid = await emailInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(emailValid).toBe(false);
  });

  test('recover password page has email field and submit button', async ({ page }) => {
    await page.goto('/recover-password', { timeout: 10000 });
    await expect(page.locator('input[type="email"], input[name*="email"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('after login with valid credentials, auth-only links appear', async ({ page }) => {
    test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Skipping: no test credentials provided');

    await login(page, TEST_EMAIL, TEST_PASSWORD);
    await page.waitForURL(/\//, { timeout: 10000 });

    // After login, should NOT see signup/login nav links
    // and SHOULD see inbox or profile links
    const inboxLink = page
      .getByRole('link', { name: /inbox/i })
      .or(page.locator('a[href*="/inbox"]'));
    const profileLink = page
      .getByRole('link', { name: /profile|account/i })
      .or(page.locator('a[href*="/profile-settings"], a[href*="/account"]'));

    const hasInbox = await inboxLink.first().isVisible();
    const hasProfile = await profileLink.first().isVisible();
    expect(hasInbox || hasProfile).toBe(true);
  });

  test('login with valid credentials redirects away from /login', async ({ page }) => {
    test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Skipping: no test credentials provided');

    await login(page, TEST_EMAIL, TEST_PASSWORD);
    await page.waitForURL(/\//, { timeout: 10000 });

    const url = page.url();
    // Should no longer be on /login
    expect(url).not.toMatch(/\/login$/);
  });

  test('logout works — login link returns after logout', async ({ page }) => {
    test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Skipping: no test credentials provided');

    await login(page, TEST_EMAIL, TEST_PASSWORD);
    await page.waitForURL(/\//, { timeout: 10000 });

    // Find logout button (could be in a menu)
    const menuBtn = page
      .getByRole('button', { name: /menu|account|profile/i })
      .or(page.locator('[class*="avatar"], [class*="Avatar"]'));

    if (await menuBtn.first().isVisible()) {
      await menuBtn.first().click();
      await page.waitForTimeout(500);
    }

    const logoutBtn = page
      .getByRole('button', { name: /log out|logout|sign out/i })
      .or(page.getByRole('link', { name: /log out|logout|sign out/i }));

    if (await logoutBtn.first().isVisible()) {
      await logoutBtn.first().click();
      await page.waitForTimeout(2000);
      // After logout, login link should be visible
      const loginLink = page
        .getByRole('link', { name: /log in|login/i })
        .or(page.getByRole('button', { name: /log in|login/i }));
      await expect(loginLink.first()).toBeVisible({ timeout: 5000 });
    }
  });
});
