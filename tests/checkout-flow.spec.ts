import { test, expect } from '@playwright/test';

// These tests check the listing page and checkout flow components.
// Requires at least one published listing on the test marketplace.
test.describe('Checkout flow components', () => {
  test('listing page shows IronPeer Protection badge', async ({ page }) => {
    await page.goto('/s'); // search page — find any listing
    const firstListing = page.locator('a[href*="/l/"]').first();
    if (await firstListing.isVisible()) {
      await firstListing.click();
      await expect(page.getByText(/ironpeer protection/i)).toBeVisible();
    }
  });

  test('listing page shows cancellation policy', async ({ page }) => {
    await page.goto('/s');
    const firstListing = page.locator('a[href*="/l/"]').first();
    if (await firstListing.isVisible()) {
      await firstListing.click();
      // Should show cancellation policy notice
      await expect(
        page.getByText(/72h|72 hour|cancellation/i).first()
      ).toBeVisible();
    }
  });

  test('listing page shows security deposit notice', async ({ page }) => {
    await page.goto('/s');
    const firstListing = page.locator('a[href*="/l/"]').first();
    if (await firstListing.isVisible()) {
      await firstListing.click();
      await expect(
        page.getByText(/security deposit|refundable deposit/i).first()
      ).toBeVisible();
    }
  });

  test('checkout page shows full cancellation policy card', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.PLAYWRIGHT_TEST_EMAIL || '');
    await page.fill('input[type="password"]', process.env.PLAYWRIGHT_TEST_PASSWORD || '');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\//);

    await page.goto('/s');
    const firstListing = page.locator('a[href*="/l/"]').first();
    if (await firstListing.isVisible()) {
      await firstListing.click();
      const bookBtn = page.getByRole('button', { name: /request|book/i }).first();
      if (await bookBtn.isVisible()) {
        await bookBtn.click();
        await expect(page.getByText(/cancellation policy/i).first()).toBeVisible();
        await expect(page.getByText(/72h|72 hour/i).first()).toBeVisible();
        await expect(page.getByText(/no refund/i).first()).toBeVisible();
      }
    }
  });

  test('checkout shows delivery address section when delivery selected', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.PLAYWRIGHT_TEST_EMAIL || '');
    await page.fill('input[type="password"]', process.env.PLAYWRIGHT_TEST_PASSWORD || '');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\//);

    // Find a listing that offers delivery
    await page.goto('/s');
    const firstListing = page.locator('a[href*="/l/"]').first();
    if (await firstListing.isVisible()) {
      await firstListing.click();
      const deliveryOption = page.getByText(/delivery/i).first();
      if (await deliveryOption.isVisible()) {
        await deliveryOption.click();
        const bookBtn = page.getByRole('button', { name: /request|book/i }).first();
        if (await bookBtn.isVisible()) {
          await bookBtn.click();
          await expect(page.getByText(/delivery address/i)).toBeVisible();
          await expect(page.locator('input[placeholder*="Street"], input[placeholder*="123"]').first()).toBeVisible();
        }
      }
    }
  });
});
