import { test, expect } from '@playwright/test';

test.describe('Listing wizard — protection tab', () => {
  

  test('Haulers & Trailers auto-locks to road-legal — no off-road option visible', async ({ page }) => {
    await page.goto('/l/new');

    // Select Haulers and Trailers
    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption({ label: /hauler/i });

    // Navigate to protection tab
    const protectionTab = page.getByRole('link', { name: /protection/i }).or(
      page.getByRole('button', { name: /protection/i })
    );
    if (await protectionTab.isVisible()) await protectionTab.click();

    // Should NOT see off-road button
    await expect(page.getByRole('button', { name: /off-road/i })).not.toBeVisible();
    await expect(page.getByText(/off-road/i)).not.toBeVisible();

    // Should see the trailer auto-lock notice
    await expect(page.getByText(/trailers and haulers are road-legal by default/i)).toBeVisible();
  });

  test('Non-trailer category shows road-legal yes/no question', async ({ page }) => {
    await page.goto('/l/new');

    const categorySelect = page.locator('select').first();
    await categorySelect.selectOption({ label: /dirt work/i });

    const protectionTab = page.getByRole('link', { name: /protection/i }).or(
      page.getByRole('button', { name: /protection/i })
    );
    if (await protectionTab.isVisible()) await protectionTab.click();

    await expect(page.getByRole('button', { name: /off-road/i }).or(
      page.getByText(/off-road/i)
    ).first()).toBeVisible();
  });
});
