import { test, expect } from '@playwright/test';

test('keyboard search opens persistent star details on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/stars/search*', route => route.fulfill({ json: {
    stars: [{ id: 7, hip: 123, proper: 'Vega', mag: 0.03, decrad: 0, rarad: 0, healpixId: 1 }],
    hasMore: false,
  } }));
  await page.route('**/api/constellations/search*', route => route.fulfill({ json: {
    constellations: [], hasMore: false,
  } }));
  await page.route('**/api/stars/frame*', route => route.fulfill({ json: { stars: [], frameIds: [] } }));
  await page.route('**/api/constellations/frame*', route => route.fulfill({ json: {
    constellations: [], constellationLines: [],
  } }));
  await page.addInitScript(() => Object.defineProperty(navigator, 'geolocation', {
    value: { getCurrentPosition: () => {} },
  }));

  await page.goto('/explore');
  const search = page.getByRole('combobox', { name: 'Search stars and constellations' });
  await search.fill('Vega');
  await expect(page.getByRole('option', { name: /Vega/ })).toBeVisible();
  await search.press('ArrowDown');
  await search.press('Enter');
  const details = page.getByRole('region', { name: 'Selected star details' });
  await expect(details).toContainText('Vega');
  await expect(details).toBeInViewport();
  await details.getByRole('button', { name: 'Close star details' }).click();
  await expect(details).toHaveCount(0);
});
