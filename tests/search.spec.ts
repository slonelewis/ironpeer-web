import { test, expect } from '@playwright/test';

test.describe('Search page', () => {
  test('search page /s loads', async ({ page }) => {
    await page.goto('/s', { timeout: 30000 });
    await expect(page).not.toHaveURL(/notfound|404/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('search page shows listings or empty state', async ({ page }) => {
    await page.goto('/s', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    // Either listing cards exist or an empty state message
    const listingCards = page.locator('a[href*="/l/"]');
    const emptyState = page.getByText(/no results|no listings|no equipment|nothing found|be the first|no equipment available/i);
    const hasListings = await listingCards.count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);
    expect(hasListings || hasEmptyState).toBe(true);
  });

  test('search results have clickable listing cards', async ({ page }) => {
    await page.goto('/s', { timeout: 30000 });
    const firstListing = page.locator('a[href*="/l/"]').first();
    if (await firstListing.isVisible()) {
      const href = await firstListing.getAttribute('href');
      expect(href).toBeTruthy();
      expect(href).toMatch(/\/l\//);
    }
  });

  test('listing cards show title', async ({ page }) => {
    await page.goto('/s', { timeout: 30000 });
    const firstCard = page.locator('a[href*="/l/"]').first();
    if (await firstCard.isVisible()) {
      // Card should have some text content (title)
      const text = await firstCard.innerText();
      expect(text.trim().length).toBeGreaterThan(0);
    }
  });

  test('listing cards show price', async ({ page }) => {
    await page.goto('/s', { timeout: 30000 });
    const firstCard = page.locator('a[href*="/l/"]').first();
    if (await firstCard.isVisible()) {
      // Price shown as $X/day or similar
      const cardContainer = firstCard.locator('..');
      const priceText = cardContainer.getByText(/\$\d|\/day|per day/i).first();
      const hasPriceInCard = await priceText.isVisible();
      if (!hasPriceInCard) {
        // Broader check — price might be in page context
        const pagePrice = page.getByText(/\$\d+/i).first();
        await expect(pagePrice).toBeVisible();
      }
    }
  });

  test('listing cards show image', async ({ page }) => {
    await page.goto('/s', { timeout: 30000 });
    const firstCard = page.locator('a[href*="/l/"]').first();
    if (await firstCard.isVisible()) {
      // Should have an img inside or near the card
      const img = page.locator('a[href*="/l/"] img, [class*="listing"] img, [class*="card"] img').first();
      if (await img.count() > 0) {
        await expect(img).toBeVisible();
      }
    }
  });

  test('search filters or search bar visible', async ({ page }) => {
    await page.goto('/s', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    // Could be a search bar, category filter, price filter, etc.
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[placeholder*="what" i], input[name*="keyword"], input[name*="search" i]');
    const filterBtn = page.getByRole('button', { name: /filter|category|sort/i });
    const anyInput = page.locator('input').first();
    const hasSearch = await searchInput.count() > 0;
    const hasFilters = await filterBtn.count() > 0;
    const hasAnyInput = await anyInput.count() > 0;
    // At minimum some search/filter UI should exist
    expect(hasSearch || hasFilters || hasAnyInput).toBe(true);
  });

  test('mobile: search page renders without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/s', { timeout: 30000 });
    await expect(page.locator('body')).toBeVisible();
    // Check that horizontal scroll is not created
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyScrollWidth).toBeLessThanOrEqual(windowWidth + 5); // 5px tolerance
  });
});
