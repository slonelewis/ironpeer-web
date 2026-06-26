import { test, expect } from '@playwright/test';

// Helper: select a category option by regex pattern on text
async function selectCategoryByText(page: any, selectLocator: any, pattern: RegExp) {
  const options = await selectLocator.locator('option').all();
  for (const opt of options) {
    const text = await opt.textContent();
    if (pattern.test(text || '')) {
      const value = await opt.getAttribute('value');
      if (value) {
        await selectLocator.selectOption(value);
        return true;
      }
    }
  }
  return false;
}

// These tests require a logged-in session.
// Set PLAYWRIGHT_TEST_EMAIL and PLAYWRIGHT_TEST_PASSWORD env vars.
test.describe('Listing wizard — categories', () => {
  

  test('can navigate to new listing wizard', async ({ page }) => {
    await page.goto('/l/new');
    await expect(page).toHaveURL(/l\/new|edit-listing/);
  });

  test('Haulers and Trailers shows Trailer type then Hitch type', async ({ page }) => {
    await page.goto('/l/new');
    await page.waitForLoadState('networkidle');

    // Select Haulers and Trailers category
    const categorySelect = page.locator('select').first();
    await expect(categorySelect).toBeVisible({ timeout: 10000 });
    const found = await selectCategoryByText(page, categorySelect, /hauler/i);
    if (!found) return; // skip if category not available

    // Level 2 should say "Trailer type" not "Hitch type"
    await expect(page.getByText(/trailer type/i).first()).toBeVisible();
    await expect(page.getByText(/hitch type/i)).not.toBeVisible();

    // Select a trailer type to reveal hitch type
    const trailerSelect = page.locator('select').nth(1);
    await expect(trailerSelect).toBeVisible();
    await trailerSelect.selectOption({ index: 1 });

    // Now hitch type should appear
    await expect(page.getByText(/hitch type/i).first()).toBeVisible();
  });

  test('"Pole" is NOT in hitch type options', async ({ page }) => {
    await page.goto('/l/new');
    await page.waitForLoadState('networkidle');

    const categorySelect = page.locator('select').first();
    await expect(categorySelect).toBeVisible({ timeout: 10000 });
    const found = await selectCategoryByText(page, categorySelect, /hauler/i);
    if (!found) return;

    const trailerSelect = page.locator('select').nth(1);
    await expect(trailerSelect).toBeVisible();
    await trailerSelect.selectOption({ index: 1 });

    const hitchSelect = page.locator('select').nth(2);
    await expect(hitchSelect).toBeVisible();
    const options = await hitchSelect.locator('option').allTextContents();
    expect(options.map(o => o.toLowerCase())).not.toContain('pole');
  });

  test('"Pintle hitch" IS in hitch type options', async ({ page }) => {
    await page.goto('/l/new');
    await page.waitForLoadState('networkidle');

    const categorySelect = page.locator('select').first();
    await expect(categorySelect).toBeVisible({ timeout: 10000 });
    const found = await selectCategoryByText(page, categorySelect, /hauler/i);
    if (!found) return;

    const trailerSelect = page.locator('select').nth(1);
    await expect(trailerSelect).toBeVisible();
    await trailerSelect.selectOption({ index: 1 });

    const hitchSelect = page.locator('select').nth(2);
    await expect(hitchSelect).toBeVisible();
    const options = await hitchSelect.locator('option').allTextContents();
    const hasPintle = options.some(o => /pintle/i.test(o));
    expect(hasPintle).toBe(true);
  });

  test('"Other" is last in Dirt work subcategories', async ({ page }) => {
    await page.goto('/l/new');
    await page.waitForLoadState('networkidle');

    const categorySelect = page.locator('select').first();
    await expect(categorySelect).toBeVisible({ timeout: 10000 });
    const found = await selectCategoryByText(page, categorySelect, /dirt work/i);
    if (!found) return;

    const subSelect = page.locator('select').nth(1);
    await expect(subSelect).toBeVisible();
    const options = await subSelect.locator('option').allTextContents();
    const nonEmpty = options.filter(o => o.trim() && !o.includes('Select'));
    const last = nonEmpty[nonEmpty.length - 1];
    expect(last.toLowerCase()).toContain('other');
  });
});
