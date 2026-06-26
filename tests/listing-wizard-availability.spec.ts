import { test, expect } from '@playwright/test';

test.describe('Listing wizard — availability tab', () => {

  /**
   * Navigate to the availability edit tab for the first owned listing.
   * Returns the base edit URL or null if no owned listings exist.
   * Requires: logged-in user with at least one listing.
   */
  async function getAvailabilityEditUrl(page: any): Promise<string | null> {
    await page.goto('/listings', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    // Match both published (/edit/) and draft (/draft/) listing links
    const editLink = page.locator('a[href*="/edit/"], a[href*="/draft/"]').first();
    if (await editLink.count() === 0) return null;
    const href = await editLink.getAttribute('href');
    // Determine whether this is a draft or published listing
    const tabType = href?.includes('/draft/') ? 'draft' : 'edit';
    const base = href?.replace(/\/(edit|draft)\/[^\/]+$/, '');
    return base ? `${base}/${tabType}/availability` : null;
  }

  test('availability form is inline — no modal button', async ({ page }) => {
    const url = await getAvailabilityEditUrl(page);
    if (!url) {
      test.skip(true, 'No owned listings — create one with the test account to run this test');
      return;
    }
    await page.goto(url, { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /set availability plan/i })).not.toBeVisible();
    // Use word-boundary match to avoid matching timezone option values like "Africa/Monrovia"
    await expect(page.getByText(/\bMonday\b/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('"Select all days" button exists', async ({ page }) => {
    const url = await getAvailabilityEditUrl(page);
    if (!url) {
      test.skip(true, 'No owned listings — create one with the test account to run this test');
      return;
    }
    await page.goto(url, { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /select all days/i })).toBeVisible({ timeout: 10000 });
  });

  test('"Select all days" checks all 7 days', async ({ page }) => {
    const url = await getAvailabilityEditUrl(page);
    if (!url) {
      test.skip(true, 'No owned listings — create one with the test account to run this test');
      return;
    }
    await page.goto(url, { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /select all days/i }).click();

    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    for (const day of days) {
      const checkbox = page.locator(`input[value="${day}"], input[id*="${day}"]`).first();
      if (await checkbox.count() > 0) {
        await expect(checkbox).toBeChecked();
      }
    }
  });
});
