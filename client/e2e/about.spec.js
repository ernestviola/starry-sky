import { expect, test } from '@playwright/test';

test('keeps the About model and controls available through the walkthrough', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/about');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('[class*="controllerParent"]')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/about-intro.png' });
  const stepOne = page.locator('[data-derivation-step="1"]');
  await stepOne.evaluate((section) => section.scrollIntoView());
  await expect(page.locator('[class*="controllerParent"]')).toBeVisible();
  await page.getByLabel('Show sphere wireframe').uncheck();
  await expect(page.getByLabel('Show sphere wireframe')).not.toBeChecked();
  await page.getByLabel('Show sphere wireframe').check();
  await expect.poll(async () => (await page.locator('canvas').boundingBox()).width).toBeGreaterThan(1000);
  await page.screenshot({ path: 'test-results/about-step-1.png' });
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(page.locator('[class*="controllerParent"]')).toBeVisible();
  await expect(page.locator('[class*="wireframeParent"]')).toBeVisible();
  await expect(page.locator('[data-derivation-step="5"]')).toHaveCount(0);
  const explore = page.getByRole('button', { name: 'Explore The Model' });
  await expect(explore).toBeVisible();
  await explore.click();
  const scrollPosition = await page.evaluate(() => scrollY);
  await expect(page.locator('[data-mode="explore"]')).toBeVisible();
  const back = page.getByRole('button', { name: 'Back to Walkthrough' });
  await expect(back).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Find z', exact: true })).toBeHidden();
  await expect(page.getByRole('slider')).toHaveCount(2);
  await expect.poll(() => page.evaluate(() => document.documentElement.style.overflow)).toBe('hidden');
  await page.screenshot({ path: 'test-results/about-desktop-explore.png' });
  await back.click();
  await expect(explore).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Find z', exact: true })).toBeVisible();
  expect(await page.evaluate(() => scrollY)).toBe(scrollPosition);
  await explore.click();
  await page.keyboard.press('Escape');
  await expect(explore).toBeFocused();
});

test('uses native proximity snap and lets the reader leave step 1 upward', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/about');
  await page.evaluate(() => document.fonts.ready);
  const stepOne = page.locator('[data-derivation-step="1"]');
  await stepOne.evaluate((section) => section.scrollIntoView());
  await expect.poll(async () => Math.abs((await stepOne.boundingBox()).y)).toBeLessThan(2);
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType)).toMatch(/^y( proximity)?$/);
  await page.mouse.wheel(0, -400);
  await expect.poll(async () => (await stepOne.boundingBox()).y).toBeGreaterThan(50);
  await stepOne.evaluate((section) => section.scrollIntoView());
  await page.mouse.wheel(0, 900);
  const stepTwo = page.locator('[data-derivation-step="2"]');
  await expect.poll(async () => Math.abs((await stepTwo.boundingBox()).y)).toBeLessThan(2);
});

test('shows only one desktop step card at a time', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/about');
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: 'html { scroll-snap-type: none !important; }' });
  const firstTop = await page.locator('[data-derivation-step="1"]').evaluate((section) =>
    section.getBoundingClientRect().top + window.scrollY,
  );
  for (const [offset, expectedStep] of [[100, 1], [450, 1], [550, 2], [850, 2], [1100, 2]]) {
    await page.evaluate((top) => window.scrollTo(0, top), firstTop + offset);
    await expect.poll(async () => page.locator('[data-derivation-step] [class*="stepCard"]').evaluateAll((cards) =>
      cards.filter((card) => Number(getComputedStyle(card.closest('[data-derivation-step]')).opacity) > 0.01)
        .map((card) => Number(card.closest('[data-derivation-step]').dataset.derivationStep)),
    )).toEqual([expectedStep]);
    if (offset === 550) {
      const opacity = await page.locator('[data-derivation-step="2"]').evaluate((section) =>
        Number(getComputedStyle(section).opacity),
      );
      expect(opacity).toBeGreaterThan(0);
      expect(opacity).toBeLessThan(1);
    }
  }
});

test('border follows distance to the next step in both directions', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/about');
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: 'html { scroll-snap-type: none !important; }' });
  const stepOne = page.locator('[data-derivation-step="1"]');
  const firstTop = await stepOne.evaluate((section) => section.getBoundingClientRect().top + window.scrollY);
  const progress = () => stepOne.locator('[class*="stepCard"]').evaluate((card) =>
    Number(getComputedStyle(card, '::after').getPropertyValue('--border-progress')),
  );
  await page.evaluate((top) => window.scrollTo(0, top), firstTop + 100);
  await expect.poll(progress).toBeGreaterThan(0.15);
  expect(await progress()).toBeLessThan(0.3);
  await page.evaluate((top) => window.scrollTo(0, top), firstTop + 450);
  await expect.poll(progress).toBe(1);
  expect((await stepOne.locator('[class*="stepCard"]').boundingBox()).y).toBeGreaterThanOrEqual(0);
  await page.evaluate((top) => window.scrollTo(0, top), firstTop + 100);
  await expect.poll(progress).toBeLessThan(0.3);
});
