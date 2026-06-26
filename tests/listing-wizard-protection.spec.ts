import { test, expect } from '@playwright/test';

test.describe('Listing wizard — protection tab', () => {

  /**
   * Get a protection edit URL for an owned listing matching optional category text.
   * Falls back to first available owned listing if no category match found.
   * Returns null if user has no owned listings.
   */
  async function getProtectionEditUrl(page: any, preferCategory?: RegExp): Promise<string | null> {
    await page.goto('/listings', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // Match both published (/edit/) and draft (/draft/) listing links
    const editLinks = await page.locator('a[href*="/edit/"], a[href*="/draft/"]').all();
    if (editLinks.length === 0) return null;

    // Deduplicate by base path so we get one entry per listing
    const seen = new Set<string>();
    const uniqueLinks: Array<{ href: string; tabType: string; base: string }> = [];
    for (const link of editLinks) {
      const href = await link.getAttribute('href');
      if (!href) continue;
      const tabType = href.includes('/draft/') ? 'draft' : 'edit';
      const base = href.replace(/\/(edit|draft)\/[^\/]+$/, '');
      if (!seen.has(base)) {
        seen.add(base);
        uniqueLinks.push({ href, tabType, base });
      }
    }
    if (uniqueLinks.length === 0) return null;

    // Try to find a listing whose URL slug matches the preferred category pattern
    if (preferCategory) {
      for (const { href, tabType, base } of uniqueLinks) {
        if (preferCategory.test(href)) {
          return `${base}/${tabType}/protection`;
        }
      }
    }

    // Fallback: use first available listing
    const { tabType, base } = uniqueLinks[0];
    return `${base}/${tabType}/protection`;
  }

  test('Haulers & Trailers auto-locks to road-legal — no off-road option visible', async ({ page }) => {
    const url = await getProtectionEditUrl(page, /trailer|hauler/i);
    if (!url) {
      test.skip(true, 'No owned listings — create a hauler/trailer listing with the test account to run this test');
      return;
    }
    await page.goto(url, { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('button', { name: /off-road/i })).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/trailers and haulers are road-legal by default/i)).toBeVisible({ timeout: 10000 });
  });

  test('Non-trailer category shows road-legal yes/no question', async ({ page }) => {
    // Find a non-trailer listing
    await page.goto('/listings', { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    // Match both published (/edit/) and draft (/draft/) listing links
    const editLinks = await page.locator('a[href*="/edit/"], a[href*="/draft/"]').all();
    if (editLinks.length === 0) {
      test.skip(true, 'No owned listings — create a non-trailer listing with the test account to run this test');
      return;
    }

    // Deduplicate links by base path
    const seen2 = new Set<string>();
    let url: string | null = null;
    for (const link of editLinks) {
      const href = await link.getAttribute('href');
      if (!href) continue;
      const tabType = href.includes('/draft/') ? 'draft' : 'edit';
      const base = href.replace(/\/(edit|draft)\/[^\/]+$/, '');
      if (seen2.has(base)) continue;
      seen2.add(base);
      // Match on URL slug — non-trailer if slug doesn't include trailer/hauler
      if (!/trailer|hauler/i.test(href)) {
        url = `${base}/${tabType}/protection`;
        break;
      }
    }

    if (!url) {
      test.skip(true, 'No non-trailer listings found with the test account — create one (e.g. dirt work) to run this test');
      return;
    }

    await page.goto(url, { timeout: 30000 });
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('button', { name: /off-road/i }).or(page.getByText(/off-road/i)).first()
    ).toBeVisible({ timeout: 10000 });
  });
});
