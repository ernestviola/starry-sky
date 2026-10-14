import { expect, test } from '@playwright/test';

for (const [width, height] of [[390, 844], [1440, 1000]]) {
  test(`About model zoom stops in both directions at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.goto('/about');
    const final = page.locator(`[data-derivation-step="${width <= 900 ? 5 : 4}"]`);
    await final.evaluate(section => scrollTo(0, section.getBoundingClientRect().top + scrollY + 100));
    await page.getByRole('button', { name: 'Explore The Model' }).click();
    await expect(page.locator('[data-mode="explore"]')).toBeVisible();
    // The final camera pose takes one second to settle before user orbiting.
    await page.waitForTimeout(1200);
    const axisSpan = async () => {
      const positive = await page.getByText('+X', { exact: true }).boundingBox();
      const negative = await page.getByText('-X', { exact: true }).boundingBox();
      return Math.hypot(positive.x - negative.x, positive.y - negative.y);
    };
    const zoom = async (delta, times) => {
      await page.mouse.move(width * 0.35, height * 0.35);
      for (let i = 0; i < times; i++) await page.mouse.wheel(0, delta);
    };
    const original = await axisSpan();
    await zoom(-1200, 30);
    await expect.poll(axisSpan).toBeGreaterThan(original * 1.1);
    const near = await axisSpan();
    await zoom(-1200, 10);
    await expect.poll(async () => Math.abs(await axisSpan() - near)).toBeLessThan(1);
    await page.screenshot({ path: testInfo.outputPath('zoom-in-limit.png') });
    await zoom(1200, 40);
    await expect.poll(axisSpan).toBeLessThan(original * 0.9);
    const far = await axisSpan();
    await zoom(1200, 10);
    await expect.poll(async () => Math.abs(await axisSpan() - far)).toBeLessThan(1);
    expect(far).toBeGreaterThan(100);
    await page.screenshot({ path: testInfo.outputPath('zoom-out-limit.png') });
    await zoom(-1200, 5);
    await expect.poll(axisSpan).toBeGreaterThan(far + 5);
    await expect(page.getByRole('button', { name: 'Back to Walkthrough' })).toBeVisible();
  });
}
