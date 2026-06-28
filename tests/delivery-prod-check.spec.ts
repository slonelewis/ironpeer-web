import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = path.resolve(__dirname, '../playwright-screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

async function ss(page: any, name: string) {
  const p = path.join(SCREENSHOTS_DIR, `${name}.png`);
  await page.screenshot({ path: p, fullPage: false });
  console.log('Screenshot:', p);
}

test.describe('Delivery tab — production reality check', () => {
  test('What tabs exist on existing listing edit', async ({ page }) => {
    await page.goto('/listings', { waitUntil: 'networkidle', timeout: 30000 });
    await ss(page, 'prod-01-listings-page');
    console.log('URL:', page.url());
    console.log('Title:', await page.title());

    // Look for edit/draft links
    const editLink = page.locator('a[href*="/edit/"], a[href*="/draft/"]').first();
    const hasLink = await editLink.count() > 0;
    console.log('Has edit link:', hasLink);

    if (hasLink) {
      const href = await editLink.getAttribute('href');
      console.log('Edit link href:', href);
      const base = href?.replace(/\/(edit|draft)\/[^\/]+$/, '');
      const tabType = href?.includes('/draft/') ? 'draft' : 'edit';

      // Navigate to details tab first
      await page.goto(`${base}/${tabType}/details`, { waitUntil: 'networkidle', timeout: 30000 });
      await ss(page, 'prod-02-details-tab');
      console.log('Details URL:', page.url());

      // Get all wizard nav links
      const navLinks = await page.locator('nav a, [role="navigation"] a').all();
      const navTexts = await Promise.all(navLinks.map(l => l.textContent()));
      console.log('Wizard nav links:', navTexts.filter(t => t?.trim()));

      // Try to navigate directly to delivery
      await page.goto(`${base}/${tabType}/delivery`, { waitUntil: 'networkidle', timeout: 30000 });
      await ss(page, 'prod-03-delivery-direct-nav');
      console.log('After delivery nav URL:', page.url());
      console.log('Redirected to:', page.url().includes('delivery') ? 'STAYED ON DELIVERY' : 'REDIRECTED TO ' + page.url().split('/').pop());
    }
  });
});
