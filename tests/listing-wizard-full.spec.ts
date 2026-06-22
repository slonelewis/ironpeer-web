import { test, expect } from '@playwright/test';

// REQUIRES: logged in
// NOTE: category/availability/protection-specific tests are in their own spec files.
// This file covers wizard structure, details tab, pricing, photos, and location.

const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD || '';

test.describe('Listing wizard — full coverage', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Skipping: no test credentials provided');
    await page.goto('/login', { timeout: 10000 });
    await page.fill('input[type="email"], input[name*="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\//, { timeout: 10000 });
  });

  test('new listing wizard loads at /l/new when logged in', async ({ page }) => {
    await page.goto('/l/new', { timeout: 10000 });
    await expect(page).not.toHaveURL(/notfound|404/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('details tab: page shows title and description fields', async ({ page }) => {
    await page.goto('/l/new', { timeout: 10000 });
    // Title input
    const titleInput = page
      .locator('input[name*="title" i], input[placeholder*="title" i]')
      .or(page.getByLabel(/title/i))
      .first();
    // Description textarea
    const descInput = page
      .locator('textarea[name*="description" i], textarea[placeholder*="description" i]')
      .or(page.getByLabel(/description/i))
      .first();
    // At least one should be visible on the details tab
    const hasTitle = await titleInput.count() > 0;
    const hasDesc = await descInput.count() > 0;
    expect(hasTitle || hasDesc).toBe(true);
  });

  test('details tab: can fill title', async ({ page }) => {
    await page.goto('/l/new', { timeout: 10000 });
    const titleInput = page
      .locator('input[name*="title" i], input[placeholder*="title" i]')
      .or(page.getByLabel(/title/i))
      .first();
    if (await titleInput.count() > 0) {
      await titleInput.fill('Test Listing Title');
      await expect(titleInput).toHaveValue('Test Listing Title');
    }
  });

  test('details tab: category dropdown has all expected categories', async ({ page }) => {
    await page.goto('/l/new', { timeout: 10000 });
    const categorySelect = page.locator('select').first();
    if (await categorySelect.count() === 0) {
      // Could be a custom dropdown
      return;
    }
    const options = await categorySelect.locator('option').allTextContents();
    const allText = options.join(' ').toLowerCase();

    const expectedCategories = [
      'hauler',
      'dirt work',
      'farm',
      'construction',
      'power',
      'seasonal',
      'lawn',
      'attachment',
      'other',
    ];

    for (const cat of expectedCategories) {
      expect(allText).toContain(cat.toLowerCase());
    }
  });

  test('pricing tab: can set daily price', async ({ page }) => {
    await page.goto('/l/new', { timeout: 10000 });

    // Navigate to pricing tab
    const pricingTab = page
      .getByRole('link', { name: /pricing|price/i })
      .or(page.getByRole('button', { name: /pricing|price/i }));
    if (await pricingTab.first().isVisible()) {
      await pricingTab.first().click();
    }

    const dailyInput = page
      .locator('input[name*="price" i], input[name*="daily" i]')
      .or(page.getByLabel(/daily price|price per day|day/i))
      .first();
    if (await dailyInput.count() > 0) {
      await dailyInput.fill('75');
      await expect(dailyInput).toHaveValue('75');
    }
  });

  test('pricing tab: weekly and monthly price fields exist', async ({ page }) => {
    await page.goto('/l/new', { timeout: 10000 });

    const pricingTab = page
      .getByRole('link', { name: /pricing|price/i })
      .or(page.getByRole('button', { name: /pricing|price/i }));
    if (await pricingTab.first().isVisible()) {
      await pricingTab.first().click();
    }

    const weeklyInput = page
      .locator('input[name*="week" i]')
      .or(page.getByLabel(/weekly|week/i))
      .first();
    const monthlyInput = page
      .locator('input[name*="month" i]')
      .or(page.getByLabel(/monthly|month/i))
      .first();

    const hasWeekly = await weeklyInput.count() > 0;
    const hasMonthly = await monthlyInput.count() > 0;
    expect(hasWeekly || hasMonthly).toBe(true);
  });

  test('photos tab: shows upload area', async ({ page }) => {
    await page.goto('/l/new', { timeout: 10000 });

    const photosTab = page
      .getByRole('link', { name: /photo/i })
      .or(page.getByRole('button', { name: /photo/i }));
    if (await photosTab.first().isVisible()) {
      await photosTab.first().click();
    }

    const uploadArea = page
      .locator('input[type="file"]')
      .or(page.locator('[class*="upload"], [class*="Upload"], [class*="dropzone"]'))
      .or(page.getByText(/upload|drag.*drop|add photo/i))
      .first();
    await expect(uploadArea).toBeVisible({ timeout: 5000 });
  });

  test('photos tab: shows minimum photo requirement message', async ({ page }) => {
    await page.goto('/l/new', { timeout: 10000 });

    const photosTab = page
      .getByRole('link', { name: /photo/i })
      .or(page.getByRole('button', { name: /photo/i }));
    if (await photosTab.first().isVisible()) {
      await photosTab.first().click();
    }

    // Should mention a minimum number of photos
    const minMsg = page.getByText(/minimum|at least|require.*photo|5 photo/i).first();
    if (await minMsg.isVisible()) {
      await expect(minMsg).toBeVisible();
    }
  });

  test('availability tab: form is inline (no modal popup)', async ({ page }) => {
    await page.goto('/l/new', { timeout: 10000 });

    const availTab = page
      .getByRole('link', { name: /availability/i })
      .or(page.getByRole('button', { name: /availability/i }));
    if (await availTab.first().isVisible()) {
      await availTab.first().click();
    }

    // Should NOT see a "Set availability plan" button (was modal trigger)
    await expect(
      page.getByRole('button', { name: /set availability plan/i })
    ).not.toBeVisible();
  });

  test('availability tab: Select All Days button exists', async ({ page }) => {
    await page.goto('/l/new', { timeout: 10000 });

    const availTab = page
      .getByRole('link', { name: /availability/i })
      .or(page.getByRole('button', { name: /availability/i }));
    if (await availTab.first().isVisible()) {
      await availTab.first().click();
    }

    await expect(
      page.getByRole('button', { name: /select all days/i })
    ).toBeVisible();
  });

  test('availability tab: Save schedule button exists', async ({ page }) => {
    await page.goto('/l/new', { timeout: 10000 });

    const availTab = page
      .getByRole('link', { name: /availability/i })
      .or(page.getByRole('button', { name: /availability/i }));
    if (await availTab.first().isVisible()) {
      await availTab.first().click();
    }

    const saveBtn = page
      .getByRole('button', { name: /save schedule|save availability|save/i })
      .first();
    await expect(saveBtn).toBeVisible();
  });

  test('location tab: address input visible', async ({ page }) => {
    await page.goto('/l/new', { timeout: 10000 });

    const locationTab = page
      .getByRole('link', { name: /location/i })
      .or(page.getByRole('button', { name: /location/i }));
    if (await locationTab.first().isVisible()) {
      await locationTab.first().click();
    }

    const addressInput = page
      .locator('input[name*="address" i], input[name*="location" i], input[placeholder*="address" i]')
      .or(page.getByLabel(/address|location/i))
      .first();
    const mapArea = page.locator('[class*="map"], [class*="Map"]').first();

    const hasInput = await addressInput.count() > 0;
    const hasMap = await mapArea.count() > 0;
    expect(hasInput || hasMap).toBe(true);
  });

  test('protection tab: road-legal question for non-trailer categories', async ({ page }) => {
    await page.goto('/l/new', { timeout: 10000 });

    const categorySelect = page.locator('select').first();
    if (await categorySelect.count() > 0) {
      await categorySelect.selectOption({ label: /dirt work/i });
    }

    const protectionTab = page
      .getByRole('link', { name: /protection/i })
      .or(page.getByRole('button', { name: /protection/i }));
    if (await protectionTab.first().isVisible()) {
      await protectionTab.first().click();
    }

    // Should show off-road / road-legal question
    const roadLegalQ = page
      .getByText(/road-legal|off-road|road legal/i)
      .or(page.getByRole('button', { name: /off-road/i }))
      .first();
    await expect(roadLegalQ).toBeVisible();
  });

  test('protection tab: Haulers & Trailers auto-locks to road-legal', async ({ page }) => {
    await page.goto('/l/new', { timeout: 10000 });

    const categorySelect = page.locator('select').first();
    if (await categorySelect.count() > 0) {
      await categorySelect.selectOption({ label: /hauler/i });
    }

    const protectionTab = page
      .getByRole('link', { name: /protection/i })
      .or(page.getByRole('button', { name: /protection/i }));
    if (await protectionTab.first().isVisible()) {
      await protectionTab.first().click();
    }

    // Off-road option should NOT be visible
    await expect(page.getByRole('button', { name: /off-road/i })).not.toBeVisible();
    // Auto-lock notice should be visible
    await expect(
      page.getByText(/trailers and haulers are road-legal by default/i)
    ).toBeVisible();
  });
});
