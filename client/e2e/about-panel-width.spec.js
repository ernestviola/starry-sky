import { expect, test } from '@playwright/test';

for (const width of [390, 650, 768, 900]) {
  test(`About floating panels stay compact at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/about');
    await page.evaluate(() => document.fonts.ready);
    const verifyWidth = async locator => {
      await expect(locator).toBeVisible();
      const bounds = await locator.boundingBox();
      expect(bounds.width).toBeCloseTo(Math.min(width - 32, 400), 0);
      expect(bounds.x + bounds.width / 2).toBeCloseTo(width / 2, 0);
      expect(bounds.y + bounds.height).toBeCloseTo(900 - 16, 0);
    };
    const first = page.locator('[data-derivation-step="1"]');
    await first.evaluate(section => scrollTo(0, section.getBoundingClientRect().top + scrollY + 100));
    await verifyWidth(first.locator('[class*="stepCard"]'));
    const final = page.locator('[data-derivation-step="5"]');
    await final.evaluate(section => scrollTo(0, section.getBoundingClientRect().top + scrollY + 100));
    await page.getByRole('button', { name: 'Explore The Model' }).click();
    const panel = page.locator('[class*="explorePanel"]');
    await verifyWidth(panel);
    await expect(panel.getByRole('slider')).toHaveCount(2);
    if (width === 768) await page.screenshot({ path: testInfo.outputPath('about-tablet-controls.png') });
    await page.getByRole('button', { name: 'Back to Walkthrough' }).click();
    await expect(panel).toBeHidden();
    await first.evaluate(section => scrollTo(0, section.getBoundingClientRect().top + scrollY + 100));
    await verifyWidth(first.locator('[class*="stepCard"]'));
  });
}
