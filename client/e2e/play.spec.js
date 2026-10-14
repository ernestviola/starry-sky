import { test, expect } from '@playwright/test';

const token = data => `e30.${Buffer.from(JSON.stringify(data)).toString('base64url')}.fixture`;

// Replace WebGL only: exercise the real layout, dialogs, forms and game handlers.
// These controls select fixture stars through the same callbacks as the map.
const mapFixture = `import React from '/node_modules/.vite/deps/react.js';
export default function StarMap({ handleClick, handleInteraction }) {
  return React.createElement('div', {style:{height:'100vh',background:'#0b0c16'}},
    ...['sirius','polaris'].map((id,index)=>React.createElement('button', {
      key:id, type:'button', style:{position:'absolute',top:120+index*60,left:20,minHeight:44},
      onClick:()=>{handleInteraction('star');handleClick(index+1);}
    }, 'Select '+id)));
}`;

async function fixtures(page) {
  const state = { starts: 0, finishes: 0, saves: 0, failStart: false, failFinish: false, failSave: false };
  await page.route('**/src/components/StarMap/index.jsx*', route => route.fulfill({ contentType: 'application/javascript', body: mapFixture }));
  await page.addInitScript(() => Object.defineProperty(navigator, 'geolocation', {
    value: { getCurrentPosition: (_success, failure) => failure({ code: 1 }) },
  }));
  await page.route('**/api/game/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let data;
    if (path.endsWith('/start')) {
      state.starts++;
      if (state.failStart) return route.fulfill({ status: 500, json: {} });
      data = { token: token({ startTime: Date.now(), starsToFind: [{ id: 1, proper: 'Sirius' }, { id: 2, proper: 'Polaris' }] }) };
    } else if (path.endsWith('/select')) {
      data = { success: true, found: [1, 2].includes(Number(route.request().postDataJSON().starId)) };
    } else if (path.endsWith('/submit')) {
      state.finishes++;
      if (state.finishGate) await state.finishGate;
      if (state.failFinish) return route.fulfill({ status: 500, json: {} });
      data = { token: token({ totalTime: 12345 }) };
    } else if (path.endsWith('/name')) {
      state.saves++;
      if (state.failSave) return route.fulfill({ status: 500, json: {} });
      data = { success: true, leaderboardId: 7 };
    } else {
      data = { leaderboard: [{ id: 7, rank: 1, name: 'Ada', totalTimeMiliseconds: 12345 }], page: 1, hasNext: false };
    }
    await route.fulfill({ json: data });
  });
  return state;
}

async function finish(page) {
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  const toggle = page.getByRole('button', { name: 'Collapse stars' });
  if (page.viewportSize().width <= 700) {
    await expect(toggle).toBeVisible();
    const bounds = await toggle.boundingBox();
    expect(bounds.height).toBeGreaterThanOrEqual(44);
  } else {
    await expect(toggle).toHaveCount(0);
    await expect(page.getByRole('list', { name: 'Stars to find!' })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Select sirius' }).click();
  await page.getByRole('button', { name: 'Select polaris' }).click();
}

for (const [width, height] of [[320, 568], [390, 844], [650, 900], [844, 390], [1440, 900]]) {
  test(`full results flow at ${width}×${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    const state = await fixtures(page);
    await page.goto('/play');
    await finish(page);
    await expect(page.getByRole('dialog', { name: 'Submit your time' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Game status' })).toHaveCount(0);
    await expect(page.locator('dialog[open]')).toHaveCount(1);
    const submit = page.getByRole('button', { name: 'Submit', exact: true });
    await expect(submit).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath('score.png'), animations: 'disabled' });
    await page.getByRole('button', { name: 'Select sirius' }).click();
    expect(state.finishes).toBe(1);
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Ada');
    await submit.click();
    await expect(page.getByRole('dialog', { name: 'Leaderboard' })).toBeVisible();
    await expect(page.getByText('Ada', { exact: true })).toBeVisible();
    await expect(page.locator('dialog[open]')).toHaveCount(1);
    await page.getByRole('button', { name: 'Select polaris' }).click();
    expect(state.finishes).toBe(1);
    await page.getByRole('button', { name: /Play again/ }).click();
    await expect(page.getByRole('region', { name: 'Game status' })).toBeVisible();
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(page.getByText('0/2')).toBeVisible();
    expect(state.starts).toBe(2);
    expect(state.saves).toBe(1);
  });
}

test('reduced motion preserves desktop dialog centering through instructions and results', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await fixtures(page);
  await page.goto('/play');
  const centered = async () => {
    const box = await page.getByRole('dialog').boundingBox();
    expect(Math.abs(box.x + box.width / 2 - 512)).toBeLessThan(2);
    expect(Math.abs(box.y + box.height / 2 - 384)).toBeLessThan(2);
  };
  await centered();
  await page.getByRole('button', { name: 'How to play' }).click();
  await expect(page.getByRole('dialog', { name: 'How to play' })).toBeVisible();
  await centered();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await finish(page);
  await expect(page.getByRole('textbox', { name: 'Name' })).toBeVisible();
  await centered();
});

test('Escape closes mobile navigation while a Play dialog remains open', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await fixtures(page);
  await page.goto('/play');
  await page.getByRole('button', { name: 'Open navigation menu' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open navigation menu' })).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByRole('dialog', { name: 'Find the stars!' })).toBeVisible();
});

test('request failures recover without restoring gameplay or losing the name', async ({ page }) => {
  const state = await fixtures(page);
  state.failStart = true;
  await page.goto('/play');
  await page.getByRole('button', { name: 'Start', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Unable to start');
  state.failStart = false;
  state.failFinish = true;
  await finish(page);
  await expect(page.getByRole('alert')).toContainText('Unable to calculate');
  await expect(page.getByRole('region', { name: 'Game status' })).toHaveCount(0);
  state.failFinish = false;
  await page.getByRole('button', { name: 'Retry calculation' }).click();
  await page.getByRole('textbox', { name: 'Name' }).fill('Ada');
  state.failSave = true;
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Unable to save');
  await expect(page.getByRole('textbox', { name: 'Name' })).toHaveValue('Ada');
  state.failSave = false;
  await page.getByRole('button', { name: 'Submit', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Leaderboard' })).toBeVisible();
});

for (const [width, height] of [[390, 844], [1024, 768]]) {
  test(`score panel does not jump when calculation resolves at ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    const state = await fixtures(page);
    let release;
    state.finishGate = new Promise(resolve => { release = resolve; });
    await page.goto('/play');
    await finish(page);
    const dialog = page.getByRole('dialog', { name: 'Submit your time' });
    const input = page.getByRole('textbox', { name: 'Name', exact: true });
    const submit = dialog.getByRole('button');
    await expect(page.getByRole('status')).toHaveText('Calculating your time…');
    await expect(input).toBeDisabled();
    await expect(submit).toBeDisabled();
    // Let the actual entrance animation finish, without disabling motion.
    await dialog.evaluate(async element => {
      await Promise.all(element.getAnimations().map(animation => animation.finished));
    });
    const before = await dialog.boundingBox();
    const buttonBefore = await submit.boundingBox();
    await expect(submit).toHaveText('Calculating…');
    release();
    await expect(input).toBeEnabled();
    await expect(submit).toBeEnabled();
    await expect(page.getByText('12.35s', { exact: true })).toBeVisible();
    const after = await dialog.boundingBox();
    const buttonAfter = await submit.boundingBox();
    await expect(submit).toHaveText('Submit');
    const bottomPadding = await dialog.evaluate(element => parseFloat(getComputedStyle(element).paddingBottom));
    expect(after.y + after.height - buttonAfter.y - buttonAfter.height).toBeCloseTo(bottomPadding + 1, 0);
    for (const key of ['x', 'y', 'width', 'height']) {
      expect(Math.abs(after[key] - before[key])).toBeLessThan(1);
      expect(Math.abs(buttonAfter[key] - buttonBefore[key])).toBeLessThan(1);
    }
  });
}

for (const [width, height] of [[320, 568], [390, 844], [650, 900], [844, 390], [1440, 900]]) {
  test(`leaderboard stays anchored while paging at ${width}×${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await fixtures(page);
    let releasePage;
    let failPage = true;
    const pageGate = new Promise(resolve => { releasePage = resolve; });
    await page.route('**/api/game/leaderboard/global*', async route => {
      const pageNumber = Number(new URL(route.request().url()).searchParams.get('page') || 1);
      if (pageNumber === 2) {
        await pageGate;
        if (failPage) return route.fulfill({ status: 500, json: {} });
      }
      await route.fulfill({ json: {
        leaderboard: Array.from({ length: pageNumber === 1 ? 10 : 2 }, (_, index) => ({
          id: index + 1 + (pageNumber - 1) * 10,
          rank: index + 1 + (pageNumber - 1) * 10,
          name: index === 0 ? 'WWWWWWWWWWWW' : 'Ada',
          totalTimeMiliseconds: 12345 + index,
        })),
        page: pageNumber, hasNext: pageNumber === 1,
      } });
    });
    await page.goto('/play');
    await finish(page);
    await page.getByRole('textbox', { name: 'Name', exact: true }).fill('Ada');
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Leaderboard' });
    const next = page.getByRole('button', { name: 'Next page' });
    const replay = page.getByRole('button', { name: /Play again/ });
    await expect(next).toBeEnabled();
    await dialog.evaluate(async element => {
      await Promise.all(element.getAnimations().map(animation => animation.finished));
    });
    const before = await Promise.all([dialog.boundingBox(), next.boundingBox(), replay.boundingBox()]);
    const unchanged = async () => {
      const after = await Promise.all([dialog.boundingBox(), next.boundingBox(), replay.boundingBox()]);
      for (let index = 0; index < before.length; index++) {
        for (const key of ['x', 'y', 'width', 'height']) {
          expect(Math.abs(after[index][key] - before[index][key])).toBeLessThan(1);
        }
      }
      await expect(next).toBeInViewport();
      await expect(replay).toBeInViewport();
    };
    await next.click();
    await expect(page.getByRole('status')).toHaveText('Loading leaderboard…');
    await unchanged();
    releasePage();
    await expect(page.getByRole('alert')).toHaveText('Unable to load leaderboard.');
    await unchanged();
    await page.getByRole('button', { name: 'Reload leaderboard' }).click();
    await expect(next).toBeEnabled();
    await unchanged();
    failPage = false;
    await next.click();
    await expect(page.getByRole('button', { name: 'Previous page' })).toBeEnabled();
    await expect(next).toBeDisabled();
    await expect(dialog.getByText('11', { exact: true })).toBeVisible();
    await unchanged();
    await page.screenshot({ path: testInfo.outputPath('short-leaderboard-page.png'), animations: 'disabled' });
    await page.getByRole('button', { name: 'Previous page' }).click();
    await expect(next).toBeEnabled();
    await unchanged();
  });
}

for (const [width, height] of [[390, 844], [1440, 900]]) {
  test(`approved compact panel and centered footer at ${width}×${height}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await fixtures(page);
    await page.goto('/play');
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    const panel = page.getByRole('region', { name: 'Game status' });
    await expect(panel).toBeVisible();
    const expanded = await panel.boundingBox();
    expect(expanded.height).toBeLessThan(160);
    await expect(panel).toHaveCSS('border-color', 'rgb(49, 50, 61)');
    if (width <= 700) {
      expect(expanded.x).toBe(16);
      expect(height - expanded.y - expanded.height).toBe(16);
      await page.getByRole('button', { name: 'Collapse stars' }).click();
      await expect(page.getByRole('button', { name: 'Expand stars' })).toHaveAttribute('aria-expanded', 'false');
      const collapsed = await panel.boundingBox();
      expect(collapsed.height).toBeLessThan(expanded.height);
      expect(height - collapsed.y - collapsed.height).toBe(16);
      await expect(page.getByRole('list', { name: 'Stars to find!' })).toHaveCount(0);
      await expect(panel.locator('#star-preview')).toHaveText('Sirius');
      await expect(panel.locator('#star-preview')).toBeVisible();
      expect(collapsed.height).toBeCloseTo(126, 0);
      await page.screenshot({ path: testInfo.outputPath('collapsed-game.png') });
      await page.getByRole('button', { name: 'Expand stars' }).press('Space');
      await expect(page.getByRole('button', { name: 'Collapse stars' })).toBeVisible();
      const header = await page.getByRole('button', { name: 'Collapse stars' }).boundingBox();
      await page.mouse.move(header.x + header.width / 2, header.y + header.height / 2);
      await page.mouse.down();
      await page.mouse.move(header.x + header.width / 2, header.y + header.height / 2 + 70, { steps: 6 });
      await page.mouse.up();
      await expect(page.getByRole('button', { name: 'Expand stars' })).toBeVisible();
      await page.getByRole('button', { name: 'Expand stars' }).click();
    } else {
      await expect(panel.getByRole('button')).toHaveCount(0);
      expect(expanded.width).toBe(220);
    }
    await page.getByRole('button', { name: 'Select sirius' }).click();
    if (width <= 700) {
      await expect(panel.locator('#star-preview')).toHaveText('Polaris');
      await expect(panel.locator('#star-preview')).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath('collapsed-after-found.png') });
      await page.getByRole('button', { name: 'Expand stars' }).click();
    }
    await expect(panel.getByRole('listitem').first()).toContainText('Polaris');
    await expect(panel.getByRole('listitem').last()).toContainText('Sirius');
    await expect(panel.getByRole('list').getByText('Sirius', { exact: true })).toHaveCSS('text-decoration-line', 'line-through');
    await expect(panel.getByRole('list').getByText('Polaris', { exact: true })).toHaveCSS('text-decoration-line', 'none');
    await page.screenshot({ path: testInfo.outputPath('compact-game.png') });
    await page.getByRole('button', { name: 'Select polaris' }).click();
    const input = page.getByRole('textbox', { name: 'Name', exact: true });
    await expect(input).toHaveAttribute('placeholder', 'Name');
    await expect(page.locator('label[for="score-name"]')).toHaveCount(0);
    const submit = page.getByRole('button', { name: 'Submit', exact: true });
    await expect(page.getByText('12.35s', { exact: true })).toHaveCSS('font-size', '32px');
    expect((await submit.boundingBox()).width).toBeCloseTo((await input.boundingBox()).width, 0);
    await page.screenshot({ path: testInfo.outputPath('submit-time-c.png'), animations: 'disabled' });
    await input.fill('Ada');
    await submit.click();
    const dialog = page.getByRole('dialog', { name: 'Leaderboard' });
    const prev = await page.getByRole('button', { name: 'Previous page' }).boundingBox();
    const next = await page.getByRole('button', { name: 'Next page' }).boundingBox();
    const replay = await page.getByRole('button', { name: /Play again/ }).boundingBox();
    const bounds = await dialog.boundingBox();
    const center = bounds.x + bounds.width / 2;
    expect(Math.abs((prev.x + next.x + next.width) / 2 - center)).toBeLessThan(1);
    expect(Math.abs(replay.x + replay.width / 2 - center)).toBeLessThan(1);
    expect(replay.y).toBeGreaterThanOrEqual(next.y + next.height);
    await page.screenshot({ path: testInfo.outputPath('centered-leaderboard.png') });
  });
}

test('keyboard leaderboard entry uses the shared focus color', async ({ page }, testInfo) => {
  await fixtures(page);
  await page.goto('/play');
  await finish(page);
  const input = page.getByRole('textbox', { name: 'Name' });
  await input.fill('Ada');
  await input.press('Tab');
  const submit = page.getByRole('button', { name: 'Submit', exact: true });
  await expect(submit).toBeFocused();
  const expectedColor = await submit.evaluate(element => getComputedStyle(element).outlineColor);
  await submit.press('Enter');
  const dialog = page.getByRole('dialog', { name: 'Leaderboard' });
  await expect(dialog).toBeFocused();
  await expect(dialog).toHaveCSS('outline-color', expectedColor);
  await expect(dialog).toHaveCSS('outline-style', 'solid');
  await expect(dialog).toHaveCSS('outline-width', '2px');
  await page.keyboard.press('Tab');
  const replay = page.getByRole('button', { name: /Play again/ });
  await expect(replay).toBeFocused();
  await expect(replay).toHaveCSS('outline-color', expectedColor);
  await page.screenshot({ path: testInfo.outputPath('shared-focus.png'), animations: 'disabled' });
});

for (const width of [480, 650, 700, 701, 768, 1024]) {
  test(`Play panels stay compact at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await fixtures(page);
    await page.goto('/play');
    const start = await page.getByRole('dialog').boundingBox();
    expect(start.width).toBeLessThanOrEqual(400);
    expect(Math.abs(start.x + start.width / 2 - width / 2)).toBeLessThan(1);
    await page.getByRole('button', { name: 'Start', exact: true }).click();
    const panel = page.getByRole('region', { name: 'Game status' });
    const bounds = await panel.boundingBox();
    expect(bounds.width).toBeLessThanOrEqual(340);
    if (width <= 700) expect(Math.abs(bounds.x + bounds.width / 2 - width / 2)).toBeLessThan(1);
    await page.getByRole('button', { name: 'Select sirius' }).click();
    await page.getByRole('button', { name: 'Select polaris' }).click();
    const score = await page.getByRole('dialog', { name: 'Submit your time' }).boundingBox();
    expect(score.width).toBeLessThanOrEqual(400);
    await page.getByRole('textbox', { name: 'Name' }).fill('Ada');
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
    const leaderboard = page.getByRole('dialog', { name: 'Leaderboard' });
    await expect(leaderboard).toBeVisible();
    const result = await leaderboard.boundingBox();
    expect(result.width).toBeLessThanOrEqual(400);
    expect(Math.abs(result.x + result.width / 2 - width / 2)).toBeLessThan(1);
    if (width === 650) await page.screenshot({ path: testInfo.outputPath('tablet-leaderboard.png') });
  });
}
