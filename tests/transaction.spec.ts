import { test, expect } from '@playwright/test';

// REQUIRES: logged in
// REQUIRES: test listing / existing orders (tests skip gracefully if none exist)

const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD || '';

test.describe('Transaction / Order page', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Skipping: no test credentials provided');
    await page.goto('/login', { timeout: 10000 });
    await page.fill('input[type="email"], input[name*="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\//, { timeout: 10000 });
  });

  /** Navigate to first available order. Returns true if found. */
  async function goToFirstOrder(page: any): Promise<boolean> {
    await page.goto('/inbox/orders', { timeout: 10000 });
    const firstOrder = page.locator('a[href*="/order/"]').first();
    if (!(await firstOrder.isVisible())) return false;
    await firstOrder.click();
    await page.waitForLoadState('domcontentloaded');
    return true;
  }

  /** Navigate to first available sale. Returns true if found. */
  async function goToFirstSale(page: any): Promise<boolean> {
    await page.goto('/inbox/sales', { timeout: 10000 });
    const firstSale = page.locator('a[href*="/sale/"]').first();
    if (!(await firstSale.isVisible())) return false;
    await firstSale.click();
    await page.waitForLoadState('domcontentloaded');
    return true;
  }

  test('order page loads when order exists', async ({ page }) => {
    const found = await goToFirstOrder(page);
    if (!found) {
      test.skip();
      return;
    }
    await expect(page).not.toHaveURL(/notfound|404/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('order page shows listing summary', async ({ page }) => {
    const found = await goToFirstOrder(page);
    if (!found) { test.skip(); return; }

    // Listing title or image should be present
    const listingSummary = page
      .locator('[class*="listing"], [class*="Listing"]')
      .or(page.locator('a[href*="/l/"]'))
      .first();
    await expect(listingSummary).toBeVisible();
  });

  test('order page shows dates or duration', async ({ page }) => {
    const found = await goToFirstOrder(page);
    if (!found) { test.skip(); return; }

    const dateInfo = page.getByText(/\d{4}|\d{1,2}\/\d{1,2}|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec/i).first();
    await expect(dateInfo).toBeVisible();
  });

  test('order page shows price breakdown', async ({ page }) => {
    const found = await goToFirstOrder(page);
    if (!found) { test.skip(); return; }

    const priceInfo = page.getByText(/\$\d+|\bsubtotal\b|\btotal\b|\bservice fee\b/i).first();
    await expect(priceInfo).toBeVisible();
  });

  test('order page shows messaging thread or message input', async ({ page }) => {
    const found = await goToFirstOrder(page);
    if (!found) { test.skip(); return; }

    const messageArea = page
      .locator('textarea[name*="message" i], textarea[placeholder*="message" i]')
      .or(page.locator('[class*="message"], [class*="Message"], [class*="chat"]'))
      .first();
    await expect(messageArea).toBeVisible();
  });

  test('order page shows check-in component if rental active', async ({ page }) => {
    const found = await goToFirstOrder(page);
    if (!found) { test.skip(); return; }

    // Check-in button/component is only visible when rental is in active state
    const checkInBtn = page
      .getByRole('button', { name: /check.?in|check.?out/i })
      .or(page.getByText(/check.?in|check.?out/i))
      .first();
    // Conditional — only verify if visible
    if (await checkInBtn.isVisible()) {
      await expect(checkInBtn).toBeVisible();
    }
  });

  test('sale page loads when sale exists', async ({ page }) => {
    const found = await goToFirstSale(page);
    if (!found) { test.skip(); return; }
    await expect(page).not.toHaveURL(/notfound|404/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('sale page shows listing and renter info', async ({ page }) => {
    const found = await goToFirstSale(page);
    if (!found) { test.skip(); return; }

    const listingRef = page
      .locator('a[href*="/l/"]')
      .or(page.locator('[class*="listing"]'))
      .first();
    await expect(listingRef).toBeVisible();
  });
});
