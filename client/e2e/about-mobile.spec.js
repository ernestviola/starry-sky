import { expect, test } from '@playwright/test';

test('mobile walkthrough scrubs one visible card in both directions without panels', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/about');
  await expect(page.locator('[data-walkthrough="mobile"]')).toBeVisible();
  await expect(page.locator('canvas')).toHaveCount(1);
  await expect(page.locator('[class*="controllerParent"]')).toHaveCount(0);

  const cards = page.locator('[data-derivation-step] [class*="stepCard"]');
  const first = page.locator('[data-derivation-step="1"]');
  const third = page.locator('[data-derivation-step="3"]');
  const visibleSteps = () => cards.evaluateAll((elements) => elements
    .filter((card) => getComputedStyle(card.parentElement).opacity === '1')
    .map((card) => card.parentElement.dataset.derivationStep));
  const firstCard = first.locator('[class*="stepCard"]');
  await page.evaluate(() => document.fonts.ready);
  const firstTop = await first.evaluate((section) => section.getBoundingClientRect().top + scrollY);
  const stageHeight = await page.locator('[class*="modelStage"]').evaluate((stage) => stage.offsetHeight);
  expect(stageHeight).toBeGreaterThan(400);
  expect(await visibleSteps()).toEqual([]);
  await page.evaluate((top) => scrollTo(0, top), firstTop - stageHeight + 100);
  await expect.poll(visibleSteps).toEqual(['1']);
  const cardBox = await firstCard.boundingBox();
  expect(cardBox.y + cardBox.height).toBeCloseTo(844 - 16, 0);
  expect(await firstCard.evaluate((card) => getComputedStyle(card, '::after').display)).toBe('none');
  expect(await firstCard.locator('h2').evaluate((heading) => parseFloat(getComputedStyle(heading).fontSize))).toBe(22);
  const labelAtStart = await page.getByText('Dec', { exact: true }).boundingBox();
  await page.evaluate((top) => scrollTo(0, top), firstTop - stageHeight + 500);
  await expect.poll(async () => {
    const label = await page.getByText('Dec', { exact: true }).boundingBox();
    return Math.abs(label.y - labelAtStart.y);
  }).toBeGreaterThan(10);
  await page.evaluate((top) => scrollTo(0, top), firstTop - stageHeight + 100);
  const thirdTop = await third.evaluate((section) => section.getBoundingClientRect().top + scrollY);
  await page.evaluate((top) => scrollTo(0, top), thirdTop - stageHeight + 100);
  await expect.poll(visibleSteps).toEqual(['3']);
  await page.evaluate((top) => scrollTo(0, top), firstTop - stageHeight + 100);
  await expect.poll(visibleSteps).toEqual(['1']);
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await expect.poll(visibleSteps).toEqual(['5']);
  await expect(page.locator('[data-derivation-step="5"] [class*="stepCard"]')).toBeVisible();
  await page.mouse.move(195, 160);
  const beforeWheel = await page.evaluate(() => scrollY);
  await page.mouse.wheel(0, -400);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(beforeWheel);
});
