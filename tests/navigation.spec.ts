import { test, expect } from '@playwright/test';

const COMING_SOON = true; // flip to false when going live

test.describe('Navigation — public pages', () => {
  test('homepage loads (coming soon page in COMING_SOON mode)', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });
    await expect(page.locator('body')).toBeVisible();
    // In coming soon mode, page should not 404
    await expect(page).not.toHaveURL(/notfound|404/);
  });

  test('login button visible on coming soon page', async ({ page }) => {
    await page.goto('/', { timeout: 30000 });
    const loginBtn = page
      .getByRole('link', { name: /log in/i })
      .or(page.getByRole('button', { name: /log in/i }));
    await expect(loginBtn.first()).toBeVisible();
  });

  test('login page loads and has form fields', async ({ page }) => {
    await page.goto('/login', { timeout: 30000 });
    await expect(page).not.toHaveURL(/notfound|404/);
    await expect(page.locator('input[type="email"], input[name*="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('recover password page loads', async ({ page }) => {
    await page.goto('/recover-password', { timeout: 30000 });
    await expect(page).not.toHaveURL(/notfound|404/);
    await expect(page.locator('body')).toBeVisible();
    await expect(
      page.locator('input[type="email"], input[name*="email"]').first()
    ).toBeVisible();
  });

  test('terms of service page loads', async ({ page }) => {
    await page.goto('/terms-of-service', { timeout: 30000 });
    await expect(page).not.toHaveURL(/notfound|404/);
    await expect(page.locator('body')).toBeVisible();
    // Should contain some recognizable TOS content
    await expect(
      page.getByText(/terms of service|terms and conditions|agreement/i).first()
    ).toBeVisible();
  });

  test('privacy policy page loads', async ({ page }) => {
    await page.goto('/privacy-policy', { timeout: 30000 });
    await expect(page).not.toHaveURL(/notfound|404/);
    await expect(page.locator('body')).toBeVisible();
    await expect(
      page.getByText(/privacy policy|privacy notice|personal information/i).first()
    ).toBeVisible();
  });

  test('404 / notfound page loads for unknown route', async ({ page }) => {
    await page.goto('/notfound', { timeout: 30000 });
    await expect(page.locator('body')).toBeVisible();
    // Should show a 404 or not-found message
    await expect(
      page.getByText(/404|not found|page.*not.*exist/i).first()
    ).toBeVisible();
  });

  test('unknown route redirects to or shows 404', async ({ page }) => {
    await page.goto('/this-route-definitely-does-not-exist-xyz123', { timeout: 30000 });
    await expect(page.locator('body')).toBeVisible();
    // Either URL changes to /notfound or the page shows a not-found message
    const url = page.url();
    const bodyText = await page.locator('body').innerText();
    const isNotFound =
      url.includes('notfound') ||
      /404|not found|page.*not.*exist/i.test(bodyText);
    expect(isNotFound).toBe(true);
  });
});
