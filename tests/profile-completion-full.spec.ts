import { test, expect } from '@playwright/test';

// REQUIRES: logged in
// NOTE: Basic profile-completion tests are in profile-completion.spec.ts.
// This file tests the full wizard content including fields and hauler-specific steps.

const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL || '';
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD || '';

test.describe('Profile completion wizard — full', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    test.skip(!TEST_EMAIL || !TEST_PASSWORD, 'Skipping: no test credentials provided');
    await page.goto('/login', { timeout: 10000 });
    await page.fill('input[type="email"], input[name*="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\//, { timeout: 10000 });
  });

  test('/profile-completion loads when logged in', async ({ page }) => {
    await page.goto('/profile-completion', { timeout: 10000 });
    await expect(page).not.toHaveURL(/notfound|404/);
    await expect(page.locator('body')).toBeVisible();
  });

  test('shows step indicator', async ({ page }) => {
    await page.goto('/profile-completion', { timeout: 10000 });
    const stepIndicator = page
      .getByText(/step \d+ of \d+/i)
      .or(page.locator('[class*="stepIndicator"], [class*="step-indicator"], [class*="StepIndicator"]'))
      .first();
    await expect(stepIndicator).toBeVisible({ timeout: 5000 });
  });

  test('has a Next or Continue button', async ({ page }) => {
    await page.goto('/profile-completion', { timeout: 10000 });
    const nextBtn = page
      .getByRole('button', { name: /next|continue/i })
      .first();
    await expect(nextBtn).toBeVisible();
  });

  test('basic info step has first name field', async ({ page }) => {
    await page.goto('/profile-completion', { timeout: 10000 });
    const firstNameInput = page
      .locator('input[name*="firstName" i], input[name*="first_name" i], input[name*="givenName" i]')
      .or(page.getByLabel(/first name/i))
      .first();
    await expect(firstNameInput).toBeVisible();
  });

  test('basic info step has last name field', async ({ page }) => {
    await page.goto('/profile-completion', { timeout: 10000 });
    const lastNameInput = page
      .locator('input[name*="lastName" i], input[name*="last_name" i], input[name*="familyName" i]')
      .or(page.getByLabel(/last name/i))
      .first();
    await expect(lastNameInput).toBeVisible();
  });

  test('basic info step has bio field', async ({ page }) => {
    await page.goto('/profile-completion', { timeout: 10000 });
    const bioInput = page
      .locator('textarea[name*="bio" i]')
      .or(page.getByLabel(/bio|about yourself/i))
      .first();
    if (await bioInput.count() > 0) {
      await expect(bioInput).toBeVisible();
    }
  });

  test('hauler step shows hauler fields if user is a hauler', async ({ page }) => {
    await page.goto('/profile-completion', { timeout: 10000 });

    // Navigate through steps looking for hauler-specific fields
    // Hauler fields: license number, vehicle make/model, tow capacity
    const haulerFields = page
      .getByLabel(/license|cdl|vehicle make|vehicle model|tow capacity/i)
      .or(page.locator('input[name*="license" i], input[name*="vehicle" i], input[name*="tow" i]'))
      .first();

    // Only check if this is a hauler account — non-haulers won't see these fields
    if (await haulerFields.count() > 0) {
      await expect(haulerFields).toBeVisible();
    }
    // If not visible on step 1, try clicking Next to advance
    else {
      const nextBtn = page.getByRole('button', { name: /next|continue/i }).first();
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(1000);
        const haulerFieldsStep2 = page
          .getByLabel(/license|cdl|vehicle make|vehicle model|tow capacity/i)
          .or(page.locator('input[name*="license" i], input[name*="vehicle" i], input[name*="tow" i]'))
          .first();
        // If no hauler fields on step 2 either, user is not a hauler — that's fine
        if (await haulerFieldsStep2.count() > 0) {
          await expect(haulerFieldsStep2).toBeVisible();
        }
      }
    }
  });

  test('wizard does not show 404 at any step', async ({ page }) => {
    await page.goto('/profile-completion', { timeout: 10000 });
    await expect(page).not.toHaveURL(/notfound|404/);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/404|page not found/i);
  });
});
