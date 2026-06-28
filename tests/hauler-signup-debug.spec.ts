import { test, expect } from '@playwright/test';

test('hauler signup flow - capture console errors', async ({ page }) => {
  const consoleErrors: string[] = [];
  const consoleMessages: string[] = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleMessages.push(`[${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      consoleErrors.push(text);
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(`PAGE ERROR: ${err.message}`);
  });

  // Step 1: Go to signup page
  await page.goto('https://ironpeer.com/signup', { waitUntil: 'networkidle' });
  await page.screenshot({ path: 'test-results/hauler-debug-01-signup.png', fullPage: true });

  // Step 2: Check what's on the page
  const pageTitle = await page.title();
  const pageUrl = page.url();
  console.log('URL after goto:', pageUrl);
  console.log('Title:', pageTitle);

  // Step 3: Look for role selection checkboxes
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/hauler-debug-02-loaded.png', fullPage: true });

  // Try to find and click the "Haul" role checkbox
  const haulerCheckbox = page.locator('input[type="checkbox"][value="hauler"]');
  const haulerCheckboxCount = await haulerCheckbox.count();
  console.log('Hauler checkbox count:', haulerCheckboxCount);

  if (haulerCheckboxCount > 0) {
    await haulerCheckbox.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/hauler-debug-03-hauler-selected.png', fullPage: true });
    console.log('Clicked hauler checkbox');
  } else {
    // Try finding any role-related buttons/labels
    const roleLabels = await page.locator('label').allTextContents();
    console.log('Labels found:', roleLabels.join(', '));
    
    // Look for "Haul" text
    const haulElement = page.getByText('Haul', { exact: true }).first();
    if (await haulElement.count() > 0) {
      await haulElement.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: 'test-results/hauler-debug-03-hauler-selected.png', fullPage: true });
    }
  }

  // Step 4: Check for errors after role selection
  console.log('\n=== CONSOLE ERRORS ===');
  consoleErrors.forEach(e => console.log(e));
  
  console.log('\n=== ALL CONSOLE MESSAGES ===');
  consoleMessages.filter(m => m.includes('error') || m.includes('Error') || m.includes('warn')).forEach(m => console.log(m));

  // Step 5: Check if there's an error overlay
  const errorOverlay = page.locator('text=Array mutators not found');
  const hasError = await errorOverlay.count() > 0;
  console.log('Has "Array mutators" error on page:', hasError);

  await page.screenshot({ path: 'test-results/hauler-debug-04-final.png', fullPage: true });

  // Soft assert - we just want to see what happens
  console.log('\n=== URL AT END ===', page.url());
  
  // The test "passes" even with errors so we can see the output
  expect(consoleErrors.length).toBeGreaterThanOrEqual(0);
});
