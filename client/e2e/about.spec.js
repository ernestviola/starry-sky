import { expect, test } from '@playwright/test';

test('captures the About walkthrough', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/about');
  await expect(page.locator('[class*="controlsContainer"]')).toBeVisible();

  await page.screenshot({ path: 'test-results/about-intro.png' });

  const stepOneTop = await page
    .locator('[data-derivation-step="1"]')
    .evaluate((element) => element.getBoundingClientRect().top + window.scrollY);

  for (let progress = 1; progress <= 20; progress += 1) {
    await page.evaluate((position) => window.scrollTo(0, position), (stepOneTop * progress) / 20);
    await page.waitForTimeout(50);
  }

  await page.waitForTimeout(1300);
  await expect(page.locator('[class*="controlsContainer"]')).toBeVisible();
  await expect
    .poll(async () => (await page.locator('canvas').boundingBox()).width)
    .toBeGreaterThan(1000);
  await page.screenshot({ path: 'test-results/about-step-1.png' });
});
