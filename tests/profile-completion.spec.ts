import { test, expect } from '@playwright/test';

test.describe('Profile completion wizard', () => {
  test('profile-completion route exists and loads', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.PLAYWRIGHT_TEST_EMAIL || '');
    await page.fill('input[type="password"]', process.env.PLAYWRIGHT_TEST_PASSWORD || '');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\//);

    await page.goto('/profile-completion');
    // Should load without a 404
    await expect(page).not.toHaveURL(/404|not-found/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('profile completion shows step indicator', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.PLAYWRIGHT_TEST_EMAIL || '');
    await page.fill('input[type="password"]', process.env.PLAYWRIGHT_TEST_PASSWORD || '');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\//);

    await page.goto('/profile-completion');
    // Should show a step indicator (Step X of Y)
    await expect(page.getByText(/step \d+ of \d+/i).or(
      page.locator('[class*="stepIndicator"], [class*="step-indicator"]')
    ).first()).toBeVisible();
  });
});
