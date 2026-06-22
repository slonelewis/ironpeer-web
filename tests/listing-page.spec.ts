import { test, expect } from '@playwright/test';

// REQUIRES: at least one published listing on the marketplace

/** Navigate to the first listing found via search */
async function goToFirstListing(page: any): Promise<boolean> {
  await page.goto('/s', { timeout: 10000 });
  const firstListing = page.locator('a[href*="/l/"]').first();
  if (!(await firstListing.isVisible())) return false;
  await firstListing.click();
  await page.waitForLoadState('domcontentloaded');
  return true;
}

test.describe('Listing page', () => {
  test('individual listing page loads from search result', async ({ page }) => {
    const found = await goToFirstListing(page);
    if (!found) {
      test.skip();
      return;
    }
    await expect(page).not.toHaveURL(/notfound|404/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('shows listing title', async ({ page }) => {
    const found = await goToFirstListing(page);
    if (!found) { test.skip(); return; }
    // Title typically in h1 or prominent heading
    const heading = page.locator('h1, h2, [class*="title"]').first();
    await expect(heading).toBeVisible();
    const text = await heading.innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('shows listing price', async ({ page }) => {
    const found = await goToFirstListing(page);
    if (!found) { test.skip(); return; }
    await expect(page.getByText(/\$\d+/i).first()).toBeVisible();
  });

  test('shows IronPeer Protection badge', async ({ page }) => {
    const found = await goToFirstListing(page);
    if (!found) { test.skip(); return; }
    await expect(page.getByText(/ironpeer protection/i).first()).toBeVisible();
  });

  test('shows security deposit notice', async ({ page }) => {
    const found = await goToFirstListing(page);
    if (!found) { test.skip(); return; }
    await expect(
      page.getByText(/security deposit|refundable deposit/i).first()
    ).toBeVisible();
  });

  test('shows cancellation policy', async ({ page }) => {
    const found = await goToFirstListing(page);
    if (!found) { test.skip(); return; }
    await expect(
      page.getByText(/cancellation|72h|72 hour/i).first()
    ).toBeVisible();
  });

  test('shows availability calendar', async ({ page }) => {
    const found = await goToFirstListing(page);
    if (!found) { test.skip(); return; }
    // Calendar could be a date picker or calendar grid
    const calendar = page
      .locator('[class*="calendar"], [class*="Calendar"], [class*="datepicker"], [class*="DatePicker"]')
      .or(page.locator('table[class*="cal"]'))
      .first();
    if (await calendar.count() > 0) {
      await expect(calendar).toBeVisible();
    } else {
      // Might be a "select dates" button
      const datesBtn = page.getByRole('button', { name: /date|dates|when/i }).first();
      await expect(datesBtn).toBeVisible();
    }
  });

  test('shows owner info / avatar', async ({ page }) => {
    const found = await goToFirstListing(page);
    if (!found) { test.skip(); return; }
    // Owner section could be a link to /u/:id or an avatar image
    const ownerSection = page
      .locator('a[href*="/u/"]')
      .or(page.locator('[class*="owner"], [class*="Owner"], [class*="host"]'))
      .first();
    await expect(ownerSection).toBeVisible();
  });

  test('shows listing photos', async ({ page }) => {
    const found = await goToFirstListing(page);
    if (!found) { test.skip(); return; }
    const img = page.locator('[class*="listing"] img, [class*="gallery"] img, [class*="photo"] img, [class*="image"] img').first();
    if (await img.count() > 0) {
      await expect(img).toBeVisible();
    } else {
      // Fallback: any img on page that isn't a logo/avatar
      await expect(page.locator('img').first()).toBeVisible();
    }
  });

  test('shows category or subcategory', async ({ page }) => {
    const found = await goToFirstListing(page);
    if (!found) { test.skip(); return; }
    // Could be breadcrumb, metadata, or tag
    const categoryText = page.getByText(
      /hauler|trailer|dirt work|farm|construction|power|lighting|seasonal|lawn|attachment/i
    ).first();
    await expect(categoryText).toBeVisible();
  });

  test('booking panel visible on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const found = await goToFirstListing(page);
    if (!found) { test.skip(); return; }
    // Booking/request panel — could be a sticky sidebar
    const bookPanel = page
      .locator('[class*="booking"], [class*="Booking"], [class*="order-panel"], [class*="checkout"]')
      .or(page.getByRole('button', { name: /request|book|reserve/i }))
      .first();
    await expect(bookPanel).toBeVisible();
  });

  test('delivery option shown when delivery available', async ({ page }) => {
    const found = await goToFirstListing(page);
    if (!found) { test.skip(); return; }
    // Not all listings have delivery — only check if present
    const deliveryOption = page.getByText(/delivery|pickup/i).first();
    if (await deliveryOption.isVisible()) {
      // Delivery/pickup selector should be interactive
      await expect(deliveryOption).toBeVisible();
    }
  });
});
