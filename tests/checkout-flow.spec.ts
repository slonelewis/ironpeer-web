import { test, expect } from '@playwright/test';

// REQUIRES: test listing seeded in .env.playwright
const LISTING_ID = process.env.PLAYWRIGHT_TEST_LISTING_ID || '';
const LISTING_SLUG = process.env.PLAYWRIGHT_TEST_LISTING_SLUG || 'playwright-test-listing';
const LISTING_URL = `/l/${LISTING_SLUG}/${LISTING_ID}`;

test.describe('Checkout flow components', () => {
  test.beforeEach(async ({ page }) => {
    if (!LISTING_ID) test.skip();
    await page.goto(LISTING_URL, { waitUntil: 'domcontentloaded', timeout: 15000 });
  });

  test('listing page shows IronPeer Protection badge', async ({ page }) => {
    await expect(page.getByText(/ironpeer protection/i)).toBeVisible({ timeout: 10000 });
  });

  test('listing page shows cancellation policy', async ({ page }) => {
    await expect(page.getByText(/72h|72 hour|cancellation/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('listing page shows security deposit notice', async ({ page }) => {
    await expect(page.getByText(/security deposit|refundable deposit/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('checkout page shows full cancellation policy card', async ({ page }) => {
    const bookBtn = page.getByRole('button', { name: /request|book/i }).first();
    if (await bookBtn.isVisible({ timeout: 5000 })) {
      await bookBtn.click();
      await expect(page.getByText(/cancellation policy/i).first()).toBeVisible({ timeout: 10000 });
    } else {
      test.skip();
    }
  });

  test('checkout shows delivery address section when delivery selected', async ({ page }) => {
    const deliveryOption = page.getByText(/^delivery$/i).or(
      page.getByLabel(/delivery/i)
    ).first();
    if (await deliveryOption.isVisible({ timeout: 5000 })) {
      await deliveryOption.click();
      const bookBtn = page.getByRole('button', { name: /request|book/i }).first();
      if (await bookBtn.isVisible()) {
        await bookBtn.click();
        await expect(page.getByText(/delivery address/i)).toBeVisible({ timeout: 10000 });
      }
    } else {
      test.skip();
    }
  });
});
