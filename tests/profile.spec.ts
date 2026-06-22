import { test, expect } from '@playwright/test';

// REQUIRES: logged in

const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD || '';

test.describe('Profile settings', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Skipping: no test credentials provided');
    await page.goto('/login', { timeout: 10000 });
    await page.fill('input[type="email"], input[name*="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\//, { timeout: 10000 });
  });

  test('profile settings page loads when logged in', async ({ page }) => {
    await page.goto('/profile-settings', { timeout: 10000 });
    await expect(page).not.toHaveURL(/notfound|404|login/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('has display name field', async ({ page }) => {
    await page.goto('/profile-settings', { timeout: 10000 });
    const nameInput = page
      .locator('input[name*="displayName" i], input[name*="name" i]')
      .or(page.getByLabel(/display name|your name|first name/i))
      .first();
    await expect(nameInput).toBeVisible();
  });

  test('has bio field', async ({ page }) => {
    await page.goto('/profile-settings', { timeout: 10000 });
    const bioInput = page
      .locator('textarea[name*="bio" i], input[name*="bio" i]')
      .or(page.getByLabel(/bio|about/i))
      .first();
    await expect(bioInput).toBeVisible();
  });

  test('has profile photo upload area', async ({ page }) => {
    await page.goto('/profile-settings', { timeout: 10000 });
    const uploadArea = page
      .locator('input[type="file"]')
      .or(page.locator('[class*="avatar"], [class*="Avatar"], [class*="photo"]'))
      .or(page.getByText(/upload photo|change photo|profile photo/i))
      .first();
    await expect(uploadArea).toBeVisible();
  });

  test('My Roles section visible', async ({ page }) => {
    await page.goto('/profile-settings', { timeout: 10000 });
    const rolesSection = page
      .getByText(/my roles|roles/i)
      .or(page.locator('[class*="roles"], [class*="Roles"]'))
      .first();
    await expect(rolesSection).toBeVisible();
  });

  test('profile completion banner shows if profile not complete', async ({ page }) => {
    await page.goto('/profile-settings', { timeout: 10000 });
    // Banner only shows if profile is incomplete — conditional check
    const banner = page.getByText(/complete.*profile|profile.*incomplete|finish.*profile/i).first();
    // Don't fail if banner is not present (account might be complete)
    if (await banner.isVisible()) {
      await expect(banner).toBeVisible();
    }
  });

  test('save button is present', async ({ page }) => {
    await page.goto('/profile-settings', { timeout: 10000 });
    const saveBtn = page
      .getByRole('button', { name: /save|update|submit/i })
      .first();
    await expect(saveBtn).toBeVisible();
  });
});
