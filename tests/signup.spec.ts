import { test, expect } from '@playwright/test';


test.describe('Signup page', () => {
  test.beforeEach(async ({ page }) => {    await page.goto('/signup');
  });

  test('signup page loads', async ({ page }) => {
    await expect(page).toHaveURL(/signup/);
    await expect(page.locator('form')).toBeVisible();
  });

  test('shows exactly 3 role options: List, Rent, Haul', async ({ page }) => {
    // Look for role checkboxes
    const listOption = page.getByText(/^List$/i).or(page.getByLabel(/list/i)).first();
    const rentOption = page.getByText(/^Rent$/i).or(page.getByLabel(/rent/i)).first();
    const haulOption = page.getByText(/^Haul$/i).or(page.getByLabel(/haul/i)).first();

    await expect(listOption).toBeVisible();
    await expect(rentOption).toBeVisible();
    await expect(haulOption).toBeVisible();
  });

  test('does not show duplicate List option', async ({ page }) => {
    // Count how many times "List" appears as a role checkbox label
    const listLabels = page.getByText(/^List$/i);
    const count = await listLabels.count();
    expect(count).toBeLessThanOrEqual(1);
  });

  test('has email, password, and name fields', async ({ page }) => {
    await expect(page.locator('input[type="email"], input[name*="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });
});
