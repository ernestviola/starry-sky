import { expect, test } from '@playwright/test';

test('captures the About walkthrough', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/about');
  await expect(page.getByRole('heading', { name: 'Inspiration' })).toBeVisible();
  await page.locator('[data-derivation-step="1"]').scrollIntoViewIfNeeded();
  await page.locator('[data-derivation-step="1"]').evaluate((section) => {
    window.scrollTo(0, window.scrollY + section.getBoundingClientRect().top);
  });
  await expect(page.locator('[class*="controllerParent"]')).toBeVisible();
  await page.getByLabel('Show sphere wireframe').uncheck();
  await expect(page.getByLabel('Show sphere wireframe')).not.toBeChecked();
  await page.getByLabel('Show sphere wireframe').check();

  await page.screenshot({ path: 'test-results/about-intro.png' });

  const stepOneTop = await page
    .locator('[data-derivation-step="1"]')
    .evaluate((element) => element.getBoundingClientRect().top + window.scrollY);

  for (let progress = 1; progress <= 20; progress += 1) {
    await page.evaluate((position) => window.scrollTo(0, position), (stepOneTop * progress) / 20);
    await page.waitForTimeout(50);
  }

  await page.waitForTimeout(1300);
  await expect(page.locator('[class*="controllerParent"]')).toBeVisible();
  await expect
    .poll(async () => (await page.locator('canvas').boundingBox()).width)
    .toBeGreaterThan(1000);
  await page.screenshot({ path: 'test-results/about-step-1.png' });

  await page.locator('[class*="earlyDrafts"]').scrollIntoViewIfNeeded();
  await expect(page.locator('[class*="controllerParent"]')).toHaveCount(0);
  await expect(page.locator('[class*="wireframeParent"]')).toHaveCount(0);
});

test('keeps the scroll walkthrough on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/about');

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();

  // Loading the page must not snap down into the walkthrough.
  await page.waitForTimeout(1000);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.getByRole('heading', { name: 'Inspiration' })).toBeInViewport();
  const card = (step) => page.locator(`[data-derivation-step="${step}"] > div`);
  const scrollToStep = async (step) => {
    await page.locator(`[data-derivation-step="${step}"]`).evaluate((section) => {
      window.scrollTo(0, window.scrollY + section.getBoundingClientRect().top);
    });
  };

  // Scrolling moves through the derivation; the model stays pinned on top.
  await scrollToStep(1);
  await expect(page.getByRole('button', { name: 'Step 1' })).toHaveAttribute('aria-current', 'step');
  await expect(card(1).getByLabel(/Declination/)).toBeVisible();
  await scrollToStep(3);
  await expect(page.getByRole('button', { name: 'Step 3' })).toHaveAttribute('aria-current', 'step');
  await expect(card(3).getByLabel(/Right ascension/)).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box.y).toBeLessThanOrEqual(1);

  // Steps 1-4 let swipes on the model scroll the page.
  await expect(canvas).toHaveCSS('pointer-events', 'none');

  // The wireframe toggle sits on the model.
  const wireframe = page.getByLabel('Wireframe', { exact: true });
  await wireframe.uncheck();
  await expect(wireframe).not.toBeChecked();

  // The step rail jumps to a step; step 5 is the orbit playground.
  await page.getByRole('button', { name: 'Step 5' }).click();
  await expect(page.getByRole('button', { name: 'Step 5' })).toHaveAttribute('aria-current', 'step');
  await expect(card(5).getByLabel(/Right ascension/)).toBeVisible();
  await expect(canvas).not.toHaveCSS('pointer-events', 'none');
});
