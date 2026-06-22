import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads without errors', async ({ page }) => {
    await page.goto('/');
    await expect(page).not.toHaveTitle(/error/i);
    await expect(page.locator('body')).toBeVisible();
  });

  test('shows login button', async ({ page }) => {
    await page.goto('/');
    const loginBtn = page.getByRole('link', { name: /log in/i }).or(
      page.getByRole('button', { name: /log in/i })
    );
    await expect(loginBtn).toBeVisible();
  });
});
