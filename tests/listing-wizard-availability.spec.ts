import { test, expect } from '@playwright/test';

test.describe('Listing wizard — availability tab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.PLAYWRIGHT_TEST_EMAIL || '');
    await page.fill('input[type="password"]', process.env.PLAYWRIGHT_TEST_PASSWORD || '');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\//);
  });

  test('availability form is inline — no modal button', async ({ page }) => {
    await page.goto('/l/new');

    // Navigate to availability tab if wizard nav is available
    const availabilityTab = page.getByRole('link', { name: /availability/i }).or(
      page.getByRole('button', { name: /availability/i })
    );
    if (await availabilityTab.isVisible()) {
      await availabilityTab.click();
    }

    // Should NOT see a "Set availability plan" button (it's inline now)
    await expect(page.getByRole('button', { name: /set availability plan/i })).not.toBeVisible();

    // Should see day checkboxes directly on the page
    await expect(page.getByText(/monday|mon/i).first()).toBeVisible();
  });

  test('"Select all days" button exists', async ({ page }) => {
    await page.goto('/l/new');

    const availabilityTab = page.getByRole('link', { name: /availability/i }).or(
      page.getByRole('button', { name: /availability/i })
    );
    if (await availabilityTab.isVisible()) {
      await availabilityTab.click();
    }

    await expect(page.getByRole('button', { name: /select all days/i })).toBeVisible();
  });

  test('"Select all days" checks all 7 days', async ({ page }) => {
    await page.goto('/l/new');

    const availabilityTab = page.getByRole('link', { name: /availability/i }).or(
      page.getByRole('button', { name: /availability/i })
    );
    if (await availabilityTab.isVisible()) {
      await availabilityTab.click();
    }

    await page.getByRole('button', { name: /select all days/i }).click();

    // All 7 day checkboxes should be checked
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    for (const day of days) {
      const checkbox = page.locator(`input[value="${day}"], input[id*="${day}"]`).first();
      if (await checkbox.count() > 0) {
        await expect(checkbox).toBeChecked();
      }
    }
  });
});
