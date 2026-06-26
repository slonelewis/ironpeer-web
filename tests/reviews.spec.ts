import { test, expect } from '@playwright/test';

test.describe('Reviews system', () => {
  test('review form requires minimum 20 characters', async ({ page }) => {
    // Navigate to a completed transaction if one exists
    await page.goto('/inbox/orders');
    const firstOrder = page.locator('a[href*="/order/"]').first();
    if (await firstOrder.isVisible()) {
      await firstOrder.click();
      const reviewBtn = page.getByRole('button', { name: /leave a review|review/i }).first();
      if (await reviewBtn.isVisible()) {
        await reviewBtn.click();
        // Find the text area and type fewer than 20 chars
        const reviewText = page.locator('textarea').first();
        if (await reviewText.isVisible()) {
          await reviewText.fill('Too short');
          await page.getByRole('button', { name: /submit/i }).click();
          // Should show validation error
          await expect(page.getByText(/20 characters/i)).toBeVisible();
        }
      }
    }
  });
});
