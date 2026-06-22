import { test, expect } from '@playwright/test';

// Mobile viewport tests — 375x812 (iPhone-size)

const MOBILE_VIEWPORT = { width: 375, height: 812 };

test.describe('Mobile rendering', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
  });

  test('homepage renders on mobile viewport (375x812)', async ({ page }) => {
    await page.goto('/', { timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();
    await expect(page).not.toHaveURL(/notfound|404/);
  });

  test('no horizontal overflow on homepage', async ({ page }) => {
    await page.goto('/', { timeout: 10000 });
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(windowWidth + 5);
  });

  test('hamburger menu visible on mobile homepage', async ({ page }) => {
    await page.goto('/', { timeout: 10000 });
    // Hamburger could be a button with ☰, "menu", or aria-label
    const hamburger = page
      .getByRole('button', { name: /menu|navigation|nav/i })
      .or(page.locator('[aria-label*="menu" i], [class*="hamburger"], [class*="menuToggle"], [class*="mobile-menu"]'))
      .first();
    await expect(hamburger).toBeVisible();
  });

  test('login page renders correctly on mobile', async ({ page }) => {
    await page.goto('/login', { timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('input[type="email"], input[name*="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('no horizontal overflow on login page', async ({ page }) => {
    await page.goto('/login', { timeout: 10000 });
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(windowWidth + 5);
  });

  test('search page renders correctly on mobile', async ({ page }) => {
    await page.goto('/s', { timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();
    await expect(page).not.toHaveURL(/notfound|404/);
  });

  test('no horizontal overflow on search page', async ({ page }) => {
    await page.goto('/s', { timeout: 10000 });
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(windowWidth + 5);
  });

  test('terms of service page renders on mobile', async ({ page }) => {
    await page.goto('/terms-of-service', { timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(windowWidth + 5);
  });

  test('recover password page renders on mobile', async ({ page }) => {
    await page.goto('/recover-password', { timeout: 10000 });
    await expect(page.locator('body')).toBeVisible();
    await expect(page.locator('input[type="email"], input[name*="email"]').first()).toBeVisible();
  });

  test('listing page renders on mobile when listing exists', async ({ page }) => {
    await page.goto('/s', { timeout: 10000 });
    const firstListing = page.locator('a[href*="/l/"]').first();
    if (await firstListing.isVisible()) {
      await firstListing.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).not.toHaveURL(/notfound|404/);
      // Check no overflow
      const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
      const windowWidth = await page.evaluate(() => window.innerWidth);
      expect(bodyScrollWidth).toBeLessThanOrEqual(windowWidth + 5);
    }
  });
});
