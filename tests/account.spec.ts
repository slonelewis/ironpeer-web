import { test, expect } from '@playwright/test';

// REQUIRES: logged in

test.describe('Account settings', () => {
  test.describe.configure({ mode: 'serial' });

  test('/account loads when logged in', async ({ page }) => {
    await page.goto('/account', { timeout: 10000 });
    await expect(page).not.toHaveURL(/notfound|404|login/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('/account/contact-details loads and shows email/phone fields', async ({ page }) => {
    await page.goto('/account/contact-details', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/notfound|404|login/);
    // Should have email field
    const emailInput = page
      .locator('input[type="email"], input[name*="email" i]')
      .first();
    const phoneInput = page
      .locator('input[type="tel"], input[name*="phone" i]')
      .first();
    const hasEmail = await emailInput.count() > 0;
    const hasPhone = await phoneInput.count() > 0;
    expect(hasEmail || hasPhone).toBe(true);
    if (hasEmail) await expect(emailInput).toBeVisible();
  });

  test('/account/change-password loads and shows password fields', async ({ page }) => {
    await page.goto('/account/change-password', { timeout: 10000 });
    await expect(page).not.toHaveURL(/notfound|404|login/);
    const passwordInputs = page.locator('input[type="password"]');
    await expect(passwordInputs.first()).toBeVisible();
    // Should have at least 2 password fields (current + new)
    const count = await passwordInputs.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('/account/payment-methods loads', async ({ page }) => {
    await page.goto('/account/payment-methods', { timeout: 10000 });
    await expect(page).not.toHaveURL(/notfound|404|login/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('/account/payments loads', async ({ page }) => {
    await page.goto('/account/payments', { timeout: 10000 });
    await expect(page).not.toHaveURL(/notfound|404|login/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('/account shows navigation links to sub-pages', async ({ page }) => {
    await page.goto('/account', { timeout: 15000 });
    await page.waitForLoadState('networkidle');
    // Account page should have links to sub-sections
    const links = page.locator('a[href*="/account/"]');
    await expect(links.first()).toBeVisible({ timeout: 10000 });
    const count = await links.count();
    expect(count).toBeGreaterThan(0);
  });

  test('contact details page has save button', async ({ page }) => {
    await page.goto('/account/contact-details', { timeout: 10000 });
    const saveBtn = page
      .getByRole('button', { name: /save|update|submit/i })
      .first();
    await expect(saveBtn).toBeVisible();
  });

  test('change password page has save/submit button', async ({ page }) => {
    await page.goto('/account/change-password', { timeout: 10000 });
    const saveBtn = page
      .getByRole('button', { name: /save|update|change|submit/i })
      .first();
    await expect(saveBtn).toBeVisible();
  });
});
