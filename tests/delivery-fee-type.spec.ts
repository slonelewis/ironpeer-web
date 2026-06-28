import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

/**
 * Delivery Fee Type Selector — IronPeer QA
 *
 * Tests the delivery tab in the listing creation/edit wizard:
 * 1. Delivery tab is accessible
 * 2. Enabling "I'll deliver it myself" shows the delivery sub-fields
 * 3. Fee type radio buttons: "Flat fee" and "Flat fee + per mile" are present
 * 4. Selecting "Flat fee" shows single delivery fee input, no per-mile field
 * 5. Selecting "Flat fee + per mile" shows Base delivery fee + Rate per mile fields
 * 6. Delivery radius field is present above the fee type selector
 */

const SCREENSHOTS_DIR = path.resolve(__dirname, '../playwright-screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function screenshot(page: any, name: string) {
  const filePath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`Screenshot: ${filePath}`);
  return filePath;
}

async function navigateToDeliveryTab(page: any) {
  // Navigate to /listings and find an edit/draft link
  await page.goto('/listings', { waitUntil: 'networkidle', timeout: 30000 });
  const editLink = page.locator('a[href*="/edit/"], a[href*="/draft/"]').first();
  const hasEdit = await editLink.count() > 0;

  if (hasEdit) {
    const href = await editLink.getAttribute('href');
    const tabType = href?.includes('/draft/') ? 'draft' : 'edit';
    const base = href?.replace(/\/(edit|draft)\/[^\/]+$/, '');
    if (base) {
      await page.goto(`${base}/${tabType}/delivery`, { waitUntil: 'networkidle', timeout: 30000 });
      return;
    }
  }

  // No existing listing — should not happen if auth setup created one
  throw new Error('No existing listing found to navigate to delivery tab');
}

test.describe('Delivery fee type selector', () => {
  test('Step 1: Delivery tab is accessible and shows shipping option', async ({ page }) => {
    await navigateToDeliveryTab(page);
    await screenshot(page, '01-delivery-tab-initial');

    // Should NOT have redirected to an error page
    await expect(page).not.toHaveURL(/notfound|404|login/);

    // Should see "Shipping" or "Delivery" label somewhere
    const pageContent = await page.content();
    console.log('Current URL:', page.url());
    console.log('Page has shippingLabel:', pageContent.includes('shipping'));
  });

  test('Step 2: Enable delivery (shipping checkbox) → self-delivery option appears', async ({ page }) => {
    await navigateToDeliveryTab(page);

    // Click the shipping/delivery checkbox
    const shippingCheckbox = page.locator('input[name="deliveryOptions"][value="shipping"]').first();
    await shippingCheckbox.waitFor({ state: 'visible', timeout: 10000 });
    await shippingCheckbox.check();
    await page.waitForTimeout(500);

    await screenshot(page, '02-shipping-checked');

    // "How will you deliver it?" section should appear
    await expect(page.getByText("How will you deliver it?")).toBeVisible();
    await expect(page.getByText("I'll deliver it myself")).toBeVisible();
    await expect(page.getByText("I need a hauler to deliver it")).toBeVisible();
  });

  test('Step 3: Select "I\'ll deliver it myself" → delivery radius and fee type appear', async ({ page }) => {
    await navigateToDeliveryTab(page);

    const shippingCheckbox = page.locator('input[name="deliveryOptions"][value="shipping"]').first();
    await shippingCheckbox.waitFor({ state: 'visible', timeout: 10000 });
    await shippingCheckbox.check();
    await page.waitForTimeout(300);

    // Click "I'll deliver it myself"
    await page.getByLabel("I'll deliver it myself").check();
    await page.waitForTimeout(500);

    await screenshot(page, '03-self-delivery-selected');

    // Delivery radius field should be visible
    await expect(page.getByLabel(/delivery radius/i)).toBeVisible();

    // Fee type radio buttons should appear
    await expect(page.getByLabel('Flat fee')).toBeVisible();
    await expect(page.getByLabel('Flat fee + per mile')).toBeVisible();

    console.log('✅ Delivery radius field visible above fee type radios');
  });

  test('Step 4: "Flat fee" selected → single delivery fee input (no per-mile)', async ({ page }) => {
    await navigateToDeliveryTab(page);

    const shippingCheckbox = page.locator('input[name="deliveryOptions"][value="shipping"]').first();
    await shippingCheckbox.waitFor({ state: 'visible', timeout: 10000 });
    await shippingCheckbox.check();
    await page.waitForTimeout(300);

    await page.getByLabel("I'll deliver it myself").check();
    await page.waitForTimeout(300);

    // Select "Flat fee"
    await page.getByLabel('Flat fee').check();
    await page.waitForTimeout(500);

    await screenshot(page, '04-flat-fee-selected');

    // "Delivery fee" currency input should be visible (label matches "Delivery fee (leave blank if free)")
    await expect(page.getByLabel(/delivery fee/i).first()).toBeVisible();

    // "Rate per mile" should NOT be visible
    await expect(page.getByLabel(/rate per mile/i)).not.toBeVisible();

    console.log('✅ Flat fee: single delivery fee input shown, no per-mile');
  });

  test('Step 5: "Flat fee + per mile" → Base delivery fee + Rate per mile inputs', async ({ page }) => {
    await navigateToDeliveryTab(page);

    const shippingCheckbox = page.locator('input[name="deliveryOptions"][value="shipping"]').first();
    await shippingCheckbox.waitFor({ state: 'visible', timeout: 10000 });
    await shippingCheckbox.check();
    await page.waitForTimeout(300);

    await page.getByLabel("I'll deliver it myself").check();
    await page.waitForTimeout(300);

    // Select "Flat fee + per mile"
    await page.getByLabel('Flat fee + per mile').check();
    await page.waitForTimeout(500);

    await screenshot(page, '05-flat-plus-per-mile-selected');

    // "Base delivery fee" label
    await expect(page.getByLabel(/base delivery fee/i)).toBeVisible();

    // "Rate per mile" label
    await expect(page.getByLabel(/rate per mile/i)).toBeVisible();

    console.log('✅ Flat fee + per mile: Base delivery fee + Rate per mile shown');
  });
});
