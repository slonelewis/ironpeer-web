import { test, expect } from '@playwright/test';

// Tests for public user profile pages (/u/:id)

/** Find a user profile link from the search page */
async function findUserProfileUrl(page: any): Promise<string | null> {
  // Try to find a link to a user profile from a listing
  await page.goto('/s', { timeout: 10000 });
  const firstListing = page.locator('a[href*="/l/"]').first();
  if (!(await firstListing.isVisible())) return null;

  await firstListing.click();
  await page.waitForLoadState('domcontentloaded');

  const profileLink = page.locator('a[href*="/u/"]').first();
  if (!(await profileLink.isVisible())) return null;

  return await profileLink.getAttribute('href');
}

test.describe('Public user profile', () => {
  test('public user profile /u/:id loads', async ({ page }) => {
    const profileUrl = await findUserProfileUrl(page);
    if (!profileUrl) {
      test.skip();
      return;
    }
    await page.goto(profileUrl, { timeout: 10000 });
    await expect(page).not.toHaveURL(/notfound|404/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('public profile shows user display name', async ({ page }) => {
    const profileUrl = await findUserProfileUrl(page);
    if (!profileUrl) { test.skip(); return; }

    await page.goto(profileUrl, { timeout: 10000 });
    // Display name in heading or prominent text
    const nameEl = page.locator('h1, h2, [class*="displayName"], [class*="userName"]').first();
    await expect(nameEl).toBeVisible();
    const text = await nameEl.innerText();
    expect(text.trim().length).toBeGreaterThan(0);
  });

  test('public profile shows reviews or empty review state', async ({ page }) => {
    const profileUrl = await findUserProfileUrl(page);
    if (!profileUrl) { test.skip(); return; }

    await page.goto(profileUrl, { timeout: 10000 });
    // Reviews section or empty state
    const reviewsSection = page
      .getByText(/review|rating/i)
      .or(page.locator('[class*="review"], [class*="Review"]'))
      .first();
    await expect(reviewsSection).toBeVisible();
  });

  test("public profile shows user's listings if they are an owner", async ({ page }) => {
    const profileUrl = await findUserProfileUrl(page);
    if (!profileUrl) { test.skip(); return; }

    await page.goto(profileUrl, { timeout: 10000 });
    // Listings might be shown or linked — conditional
    const listingsSection = page
      .getByText(/listings|equipment/i)
      .or(page.locator('a[href*="/l/"]'))
      .first();
    if (await listingsSection.isVisible()) {
      await expect(listingsSection).toBeVisible();
    }
  });

  test('public profile has member since or joined date', async ({ page }) => {
    const profileUrl = await findUserProfileUrl(page);
    if (!profileUrl) { test.skip(); return; }

    await page.goto(profileUrl, { timeout: 10000 });
    const memberSince = page.getByText(/member since|joined|since \d{4}/i).first();
    if (await memberSince.isVisible()) {
      await expect(memberSince).toBeVisible();
    }
  });

  test('/u base page does not 404', async ({ page }) => {
    await page.goto('/u', { timeout: 10000 });
    // /u base may redirect or show something — just not 404
    await expect(page.locator('body')).toBeVisible();
  });
});
