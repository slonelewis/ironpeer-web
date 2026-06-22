import { test, expect } from '@playwright/test';

// These tests require a logged-in session.
// Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD env vars.
test.describe('Listing wizard — categories', () => {
  test.beforeEach(async ({ page }) => {
    // Log in
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.PLAYWRIGHT_TEST_EMAIL || '');
    await page.fill('input[type="password"]', process.env.PLAYWRIGHT_TEST_PASSWORD || '');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\//);
  });

  test('can navigate to new listing wizard', async ({ page }) => {
    await page.goto('/l/new');
    await expect(page).toHaveURL(/l\/new|edit-listing/);
  });

  test('Haulers and Trailers shows Trailer type then Hitch type', async ({ page }) => {
    await page.goto('/l/new');

    // Select Haulers and Trailers category
    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption({ label: /hauler/i });

    // Level 2 should say "Trailer type" not "Hitch type"
    await expect(page.getByText(/trailer type/i).first()).toBeVisible();
    await expect(page.getByText(/hitch type/i)).not.toBeVisible();

    // Select a trailer type to reveal hitch type
    const trailerSelect = page.locator('select').nth(1);
    await trailerSelect.selectOption({ index: 1 });

    // Now hitch type should appear
    await expect(page.getByText(/hitch type/i).first()).toBeVisible();
  });

  test('"Pole" is NOT in hitch type options', async ({ page }) => {
    await page.goto('/l/new');

    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption({ label: /hauler/i });

    const trailerSelect = page.locator('select').nth(1);
    await trailerSelect.selectOption({ index: 1 });

    const hitchSelect = page.locator('select').nth(2);
    const options = await hitchSelect.locator('option').allTextContents();
    expect(options.map(o => o.toLowerCase())).not.toContain('pole');
  });

  test('"Pintle hitch" IS in hitch type options', async ({ page }) => {
    await page.goto('/l/new');

    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption({ label: /hauler/i });

    const trailerSelect = page.locator('select').nth(1);
    await trailerSelect.selectOption({ index: 1 });

    const hitchSelect = page.locator('select').nth(2);
    const options = await hitchSelect.locator('option').allTextContents();
    const hasPintle = options.some(o => /pintle/i.test(o));
    expect(hasPintle).toBe(true);
  });

  test('"Other" is last in Dirt work subcategories', async ({ page }) => {
    await page.goto('/l/new');

    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption({ label: /dirt work/i });

    const subSelect = page.locator('select').nth(1);
    const options = await subSelect.locator('option').allTextContents();
    const nonEmpty = options.filter(o => o.trim() && !o.includes('Select'));
    const last = nonEmpty[nonEmpty.length - 1];
    expect(last.toLowerCase()).toContain('other');
  });
});
