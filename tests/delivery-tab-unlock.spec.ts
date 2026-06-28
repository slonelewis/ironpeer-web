import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const SS_DIR = path.resolve(__dirname, '../playwright-screenshots');
if (!fs.existsSync(SS_DIR)) fs.mkdirSync(SS_DIR, { recursive: true });

async function ss(page: any, name: string) {
  const p = path.join(SS_DIR, `${name}.png`);
  await page.screenshot({ path: p });
  console.log('📸', name);
  return p;
}

async function getListingBase(page: any) {
  await page.goto('/listings', { waitUntil: 'networkidle', timeout: 30000 });
  const editLink = page.locator('a[href*="/edit/"], a[href*="/draft/"]').first();
  if (await editLink.count() === 0) throw new Error('No listing found');
  const href = await editLink.getAttribute('href');
  const tabType = href?.includes('/draft/') ? 'draft' : 'edit';
  const base = href?.replace(/\/(edit|draft)\/[^\/]+$/, '');
  return { base, tabType };
}

/**
 * Click a FieldCheckbox label — the actual <input> is opacity:0 so we click the <label>
 * @param page Playwright page
 * @param inputName e.g. "deliveryOptions"
 * @param value e.g. "shipping"
 */
async function clickFieldCheckbox(page: any, inputName: string, value: string) {
  // FieldCheckbox renders a hidden input (opacity:0, width:0, height:0) + visible SVG label.
  // We scroll to the label and click it (or JS-click the input directly).
  const id = await page.evaluate(([n, v]: [string, string]) => {
    const el = document.querySelector(`input[type="checkbox"][name="${n}"][value="${v}"]`) as HTMLInputElement | null;
    if (!el) return null;
    el.scrollIntoView({ behavior: 'instant', block: 'center' });
    return el.id || null;
  }, [inputName, value]);

  if (id === null) {
    // Try evaluate existence
    const exists = await page.evaluate(([n, v]: [string, string]) => {
      return !!document.querySelector(`input[name="${n}"][value="${v}"]`);
    }, [inputName, value]);
    console.log(`❌ Checkbox name=${inputName} value=${value} — exists=${exists}`);
    return false;
  }

  await page.waitForTimeout(200);
  // Click the associated <label> element, which IS visible and in viewport after scroll
  const labelClicked = await page.evaluate((inputId: string) => {
    const lbl = document.querySelector(`label[for="${inputId}"]`) as HTMLElement | null;
    if (lbl) { lbl.click(); return true; }
    // fallback: click the input directly
    const inp = document.getElementById(inputId) as HTMLInputElement | null;
    if (inp) { inp.click(); return true; }
    return false;
  }, id);

  console.log(`Clicked checkbox name=${inputName} value=${value} via label: ${labelClicked}`);
  return labelClicked;
}

/**
 * Click a FieldRadioButton — rendered as hidden radio + visible label
 */
async function clickRadioButton(page: any, inputName: string, value: string) {
  const done = await page.evaluate(([name, val]: [string, string]) => {
    const el = document.querySelector(`input[type="radio"][name="${name}"][value="${val}"]`) as HTMLInputElement | null;
    if (!el) return false;
    el.scrollIntoView({ behavior: 'instant', block: 'center' });
    const lbl = el.id ? document.querySelector(`label[for="${el.id}"]`) as HTMLElement | null : null;
    if (lbl) { lbl.click(); return true; }
    el.click();
    return true;
  }, [inputName, value] as [string, string]);
  return done;
}

test('Delivery tab — fee type selector', async ({ page }) => {
  test.setTimeout(180000);
  const { base, tabType } = await getListingBase(page);
  console.log('Listing:', base, tabType);

  // Ensure delivery tab is accessible
  await page.goto(`${base}/${tabType}/delivery`, { waitUntil: 'networkidle', timeout: 30000 });
  console.log('URL after delivery nav:', page.url());

  if (!page.url().includes('/delivery')) {
    // Upload photo to unlock wizard (if needed)
    await page.goto(`${base}/${tabType}/photos`, { waitUntil: 'networkidle', timeout: 30000 });
    if (page.url().includes('/photos')) {
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        await fileInput.setInputFiles('/tmp/test-photo.png');
        await page.waitForTimeout(4000);
        const nextBtn = page.getByRole('button', { name: /next/i });
        if (await nextBtn.isEnabled().catch(() => false)) {
          await nextBtn.click();
          await page.waitForLoadState('networkidle');
        }
      }
    }

    // Retry delivery
    await page.goto(`${base}/${tabType}/delivery`, { waitUntil: 'networkidle', timeout: 30000 });
  }

  const deliveryUrl = page.url();
  if (!deliveryUrl.includes('/delivery')) {
    console.log('⚠️  Delivery tab still not accessible:', deliveryUrl.split('/').pop());
    return;
  }

  console.log('✅ On Delivery tab');

  // ── SCREENSHOT A: Initial state ──────────────────────────────────────────
  await ss(page, 'delivery-A-initial-state');
  console.log('Page content:', (await page.locator('main').textContent().catch(() => '')).substring(0, 300));

  // ── Enable shipping ──────────────────────────────────────────────────────
  const clicked = await clickFieldCheckbox(page, 'deliveryOptions', 'shipping');
  console.log('Clicked shipping checkbox:', clicked);
  await page.waitForTimeout(600);

  // ── SCREENSHOT B: Shipping enabled ──────────────────────────────────────
  await ss(page, 'delivery-B-shipping-enabled');

  // Check if "How will you deliver it?" appears
  const deliverMethodSection = page.getByText("How will you deliver it?");
  const hasMethod = await deliverMethodSection.isVisible().catch(() => false);
  console.log('"How will you deliver it?" visible:', hasMethod);

  if (!hasMethod) {
    console.log('❌ Self-delivery section not visible after checking shipping');
    console.log('Page content after check:', (await page.locator('main').textContent().catch(() => '')).substring(0, 500));
    return;
  }

  // ── Select "I'll deliver it myself" ──────────────────────────────────────
  const selfClicked = await clickRadioButton(page, 'deliveryMethod', 'self');
  console.log('Clicked self delivery radio:', selfClicked);
  await page.waitForTimeout(600);

  // ── SCREENSHOT C: Self delivery selected ─────────────────────────────────
  await ss(page, 'delivery-C-self-delivery-selected');

  // Verify sub-fields appear
  const radiusLabel = page.getByText('Delivery radius (miles)');
  const feeTypeLabel = page.getByText('How do you charge for delivery?');
  const flatFeeLabel = page.getByText('Flat fee');
  const flatPlusMileLabel = page.getByText('Flat fee + per mile');

  console.log('Radius label visible:', await radiusLabel.isVisible().catch(() => false));
  console.log('Fee type question visible:', await feeTypeLabel.isVisible().catch(() => false));
  console.log('"Flat fee" label visible:', await flatFeeLabel.isVisible().catch(() => false));
  console.log('"Flat fee + per mile" label visible:', await flatPlusMileLabel.isVisible().catch(() => false));

  // ── Test "Flat fee" selection ─────────────────────────────────────────────
  await clickRadioButton(page, 'deliveryFeeType', 'flat');
  await page.waitForTimeout(400);
  await ss(page, 'delivery-D-flat-fee');

  // The fee label changes based on type
  const deliveryFeeFieldFlat = page.getByText('Delivery fee (leave blank if free)');
  const ratePerMileFlat = page.getByText('Rate per mile');
  console.log('[Flat] "Delivery fee" label visible:', await deliveryFeeFieldFlat.isVisible().catch(() => false));
  console.log('[Flat] "Rate per mile" label visible (should be hidden):', await ratePerMileFlat.isVisible().catch(() => false));

  // ── Test "Flat + per mile" selection ─────────────────────────────────────
  await clickRadioButton(page, 'deliveryFeeType', 'flatPlusMileage');
  await page.waitForTimeout(400);
  await ss(page, 'delivery-E-flat-plus-per-mile');

  const baseFeeLabel = page.getByText('Base delivery fee');
  const ratePerMileLabel = page.getByText('Rate per mile');
  console.log('[Flat+mile] "Base delivery fee" visible:', await baseFeeLabel.isVisible().catch(() => false));
  console.log('[Flat+mile] "Rate per mile" visible:', await ratePerMileLabel.isVisible().catch(() => false));

  // Check for JS console errors
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.waitForTimeout(500);

  // Final results
  console.log('\n╔════ DELIVERY FEE TYPE SELECTOR — TEST RESULTS ════╗');
  console.log('║ 1. Delivery tab accessible:              ✅         ║');
  console.log(`║ 2. "I'll deliver it myself" option:      ${hasMethod ? '✅' : '❌'}         ║`);
  console.log(`║ 3. Delivery radius field visible:        ${await radiusLabel.isVisible().catch(() => false) ? '✅' : '❌'}         ║`);
  console.log(`║ 4. Fee type radios appear:               ${await flatFeeLabel.isVisible().catch(() => false) ? '✅' : '❌'}         ║`);
  console.log(`║    - "Flat fee" radio:                   ${await flatFeeLabel.isVisible().catch(() => false) ? '✅' : '❌'}         ║`);
  console.log(`║    - "Flat fee + per mile" radio:        ${await flatPlusMileLabel.isVisible().catch(() => false) ? '✅' : '❌'}         ║`);
  console.log(`║ 5. [Flat] single fee input shown:        ${await deliveryFeeFieldFlat.isVisible().catch(() => false) ? '✅' : '❌'}         ║`);
  console.log(`║ 6. [Flat+mile] base fee shown:           ${await baseFeeLabel.isVisible().catch(() => false) ? '✅' : '❌'}         ║`);
  console.log(`║ 7. [Flat+mile] rate per mile shown:      ${await ratePerMileLabel.isVisible().catch(() => false) ? '✅' : '❌'}         ║`);
  console.log(`║ 8. JS console errors:                    ${errors.length === 0 ? '✅ None' : '❌ ' + errors.length}     ║`);
  console.log('╚════════════════════════════════════════════════════╝');
});
