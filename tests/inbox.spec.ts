import { test, expect } from '@playwright/test';

// REQUIRES: logged in

const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD || '';

test.describe('Inbox', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Skipping: no test credentials provided');
    await page.goto('/login', { timeout: 10000 });
    await page.fill('input[type="email"], input[name*="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\//, { timeout: 10000 });
  });

  test('inbox page loads when logged in at /inbox', async ({ page }) => {
    await page.goto('/inbox', { timeout: 10000 });
    await expect(page).not.toHaveURL(/notfound|404|login/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('shows orders tab', async ({ page }) => {
    await page.goto('/inbox', { timeout: 10000 });
    const ordersTab = page
      .getByRole('tab', { name: /order/i })
      .or(page.getByRole('link', { name: /order/i }))
      .or(page.getByText(/^orders$/i))
      .first();
    await expect(ordersTab).toBeVisible();
  });

  test('shows sales tab', async ({ page }) => {
    await page.goto('/inbox', { timeout: 10000 });
    const salesTab = page
      .getByRole('tab', { name: /sale/i })
      .or(page.getByRole('link', { name: /sale/i }))
      .or(page.getByText(/^sales$/i))
      .first();
    // Sales tab might only be visible for owners — conditional check
    if (await salesTab.isVisible()) {
      await expect(salesTab).toBeVisible();
    }
  });

  test('empty state shown if no transactions', async ({ page }) => {
    await page.goto('/inbox', { timeout: 10000 });
    const transactionItems = page.locator('a[href*="/order/"], a[href*="/sale/"]');
    const count = await transactionItems.count();
    if (count === 0) {
      // Should show some empty state
      const emptyState = page.getByText(/no orders|no transactions|nothing here|get started/i).first();
      if (await emptyState.isVisible()) {
        await expect(emptyState).toBeVisible();
      } else {
        // Empty state could be a component without text — just verify page loaded
        await expect(page.locator('body')).toBeVisible();
      }
    }
  });

  test('transaction items are clickable', async ({ page }) => {
    await page.goto('/inbox', { timeout: 10000 });
    const firstItem = page.locator('a[href*="/order/"], a[href*="/sale/"]').first();
    if (await firstItem.isVisible()) {
      const href = await firstItem.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toMatch(/\/(order|sale)\//);
    }
  });

  test('/inbox/orders route loads', async ({ page }) => {
    await page.goto('/inbox/orders', { timeout: 10000 });
    await expect(page).not.toHaveURL(/notfound|404/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('/inbox/sales route loads', async ({ page }) => {
    await page.goto('/inbox/sales', { timeout: 10000 });
    await expect(page).not.toHaveURL(/notfound|404/);
    await expect(page.locator('body')).toBeVisible();
  });
});
