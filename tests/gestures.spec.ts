import { test, expect, type CDPSession, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { initialProgress } from '../lib/learning';

test.use({ hasTouch: true, isMobile: true });
type Point = { x: number; y: number };

async function startLesson(page: Page, lesson: string, webgl = false) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  // Exercise pointer behavior cheaply; the dedicated scene test uses real WebGL.
  if (!webgl)
    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = () => null;
    });
  await page.addInitScript((p) => localStorage.setItem('tally-progress-v1', JSON.stringify(p)), {
    ...initialProgress,
    onboarded: true,
    name: 'Alex',
    xp: 120,
  });
  await page.goto(`/?lesson=${lesson}`);
  await page.getByRole('button', { name: 'I’m ready to try' }).click();
}
async function center(locator: Locator) {
  await locator.scrollIntoViewIfNeeded();
  const bounds = await locator.boundingBox();
  if (!bounds) throw new Error('Gesture target is missing');
  return { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
}
async function contact(
  cdp: CDPSession,
  type: 'touchStart' | 'touchMove' | 'touchEnd' | 'touchCancel',
  points: Point[],
) {
  await cdp.send('Input.dispatchTouchEvent', {
    type,
    touchPoints: points.map((point, id) => ({ ...point, id, radiusX: 4, radiusY: 4, force: 1 })),
  });
}
async function move(cdp: CDPSession, from: Point, to: Point) {
  for (let i = 1; i <= 10; i++) {
    await contact(cdp, 'touchMove', [
      { x: from.x + ((to.x - from.x) * i) / 10, y: from.y + ((to.y - from.y) * i) / 10 },
    ]);
    await new Promise((resolve) => setTimeout(resolve, 18));
  }
}
async function swipe(cdp: CDPSession, from: Point, dx: number, dy: number) {
  await contact(cdp, 'touchStart', [from]);
  await move(cdp, from, { x: from.x + dx, y: from.y + dy });
  await contact(cdp, 'touchEnd', []);
}

test('real touch sorting previews the direction and accepts all three swipes', async ({ page }) => {
  await startLesson(page, 'equation');
  const cdp = await page.context().newCDPSession(page);
  const card = page.locator('.sort-card');
  let point = await center(card);
  await swipe(cdp, point, -16, 0);
  await expect(page.getByText('That’s it!', { exact: true })).toHaveCount(0);
  point = await center(card);
  await contact(cdp, 'touchStart', [point]);
  await move(cdp, point, { x: point.x - 85, y: point.y });
  await expect(page.locator('.sort-gesture-preview')).toHaveText('Asset');
  await expect(card).not.toHaveCSS('transform', 'none');
  await contact(cdp, 'touchEnd', []);
  await expect(page.getByText('That’s it!', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await swipe(cdp, await center(card), 85, 0);
  await expect(page.getByText('That’s it!', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await swipe(cdp, await center(card), 0, -85);
  await expect(page.getByText('That’s it!', { exact: true })).toBeVisible();
});

test('cancellation, diagonals and a second finger never submit a sorting answer', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await startLesson(page, 'equation');
  const cdp = await page.context().newCDPSession(page);
  const card = page.locator('.sort-card');
  let point = await center(card);
  await contact(cdp, 'touchStart', [point]);
  await move(cdp, point, { x: point.x - 85, y: point.y });
  await contact(cdp, 'touchCancel', []);
  await expect(page.locator('.sort-gesture-preview')).toHaveCount(0);
  await swipe(cdp, await center(card), -65, -65);
  point = await center(card);
  await contact(cdp, 'touchStart', [point]);
  await move(cdp, point, { x: point.x - 85, y: point.y });
  await contact(cdp, 'touchStart', [
    { x: point.x - 85, y: point.y },
    { x: point.x + 30, y: point.y + 20 },
  ]);
  await contact(cdp, 'touchEnd', []);
  await expect(page.locator('.feedback')).toHaveCount(0);
  await page.getByRole('button', { name: 'Asset', exact: true }).tap();
  await expect(page.getByText('That’s it!', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('journal accounts drag on touch, highlight slots, and cancel without placing', async ({
  page,
}) => {
  await startLesson(page, 'journal-lab');
  const cdp = await page.context().newCDPSession(page);
  const debit = page.getByRole('button', { name: 'Place account on debit', exact: true });
  const credit = page.getByRole('button', { name: 'Place account on credit', exact: true });
  // Align both the account pool and destinations within the scrollable sheet.
  await debit.scrollIntoViewIfNeeded();
  const source = page.getByRole('button', { name: 'Equipment', exact: true });
  const from = await center(source);
  const bounds = await debit.boundingBox();
  if (!bounds) throw new Error('Missing debit slot');
  const to = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
  await contact(cdp, 'touchStart', [from]);
  await move(cdp, from, to);
  await expect(page.locator('.account-drag-preview')).toHaveText('Equipment');
  await expect(debit).toHaveClass(/drag-over/);
  await contact(cdp, 'touchEnd', []);
  await expect(
    page.getByRole('button', { name: 'Place account on debit: Equipment', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('status').filter({ hasText: 'Equipment placed on debit.' }),
  ).toBeVisible();
  await expect(page.locator('.account-drag-preview')).toHaveCount(0);
  const cash = page.getByRole('button', { name: 'Cash', exact: true });
  const cashFrom = await center(cash);
  const creditBounds = await credit.boundingBox();
  if (!creditBounds) throw new Error('Missing credit slot');
  await contact(cdp, 'touchStart', [cashFrom]);
  await move(cdp, cashFrom, {
    x: creditBounds.x + creditBounds.width / 2,
    y: creditBounds.y + creditBounds.height / 2,
  });
  await contact(cdp, 'touchCancel', []);
  await expect(credit).toContainText('Place account here');
  await cash.tap();
  await credit.tap();
  await expect(
    page.getByRole('button', { name: 'Place account on credit: Cash', exact: true }),
  ).toBeVisible();
});

test('recall swipes flip once, allow scrolling, and keep ratings explicit', async ({ page }) => {
  await startLesson(page, 'recall');
  const cdp = await page.context().newCDPSession(page);
  const card = page.locator('.recall-card');
  await swipe(cdp, await center(card), -85, 0);
  await expect(card).toHaveAttribute('aria-label', /Answer: An asset/);
  await expect(page.getByRole('button', { name: 'It’s connecting', exact: true })).toBeVisible();
  await expect(page.locator('.recall-meter')).toContainText('0 of 3');
  // The synthesized click after the swipe must not flip it back.
  await page.waitForTimeout(450);
  await expect(card).toHaveAttribute('aria-label', /Answer: An asset/);
  await swipe(cdp, await center(card), 85, 0);
  await expect(card).toHaveAttribute('aria-label', /Reveal answer/);
  const dialog = page.getByRole('dialog');
  const before = await dialog.evaluate((element) => element.scrollTop);
  await swipe(cdp, await center(card), 0, -105);
  await expect.poll(() => dialog.evaluate((element) => element.scrollTop)).toBeGreaterThan(before);
  await expect(card).toHaveAttribute('aria-label', /Reveal answer/);
  await page.getByRole('button', { name: 'Turn the card', exact: true }).click();
  await expect(card).toHaveAttribute('aria-label', /Answer: An asset/);
});

test('a captured account drag scrolls at the sheet edge and cancellation restores selection', async ({
  page,
}) => {
  await startLesson(page, 'journal-lab');
  const chip = page.getByRole('button', { name: 'Equipment', exact: true });
  const from = await center(chip);
  const dialog = page.getByRole('dialog');
  const before = await dialog.evaluate((element) => element.scrollTop);
  const bounds = await dialog.boundingBox();
  if (!bounds) throw new Error('Missing sheet');
  const cdp = await page.context().newCDPSession(page);
  await contact(cdp, 'touchStart', [from]);
  await move(cdp, from, { x: from.x, y: bounds.y + bounds.height - 8 });
  await expect
    .poll(() => dialog.evaluate((element) => element.scrollTop))
    .toBeGreaterThan(before + 20);
  await contact(cdp, 'touchCancel', []);
  await expect(page.locator('.account-drag-preview')).toHaveCount(0);
  await expect(chip).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('.journal-slot').first()).toContainText('Place account here');
});

test('mobile sheet handle rebounds short pulls and dismisses long pulls with focus restored', async ({
  page,
}) => {
  await page.goto('/');
  const opener = page.getByRole('button', { name: 'Open settings' });
  await opener.click();
  const handle = page.getByRole('button', { name: 'Dismiss panel' });
  const cdp = await page.context().newCDPSession(page);
  await swipe(cdp, await center(handle), 0, 25);
  await expect(page.getByRole('dialog')).toBeVisible();
  await swipe(cdp, await center(handle), 0, 155);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test('3D pinch and drag work while one-finger vertical swipes and wheels scroll the sheet', async ({
  page,
}) => {
  test.setTimeout(120000);
  await startLesson(page, 'equation', true);
  const scene = page.locator('.exercise-scene .scene');
  await scene.locator('canvas').waitFor();
  const cdp = await page.context().newCDPSession(page);
  const reset = scene.getByRole('button', { name: 'Reset 3D view' });
  await reset.click();
  await expect(scene.locator('output')).toContainText('Zoom 100%');
  const middle = await center(scene.locator('canvas'));
  await swipe(cdp, middle, 65, 0);
  await expect(scene.locator('output')).not.toContainText('Rotation 30 degrees.');
  await reset.click();
  const p = await center(scene.locator('canvas'));
  await contact(cdp, 'touchStart', [
    { x: p.x - 30, y: p.y },
    { x: p.x + 30, y: p.y },
  ]);
  for (let i = 1; i <= 8; i++) {
    await contact(cdp, 'touchMove', [
      { x: p.x - 30 - i * 5, y: p.y },
      { x: p.x + 30 + i * 5, y: p.y },
    ]);
    await page.waitForTimeout(20);
  }
  await contact(cdp, 'touchEnd', []);
  await expect(scene.locator('output')).not.toContainText('Zoom 100%');
  await reset.click();
  await scene.getByRole('button', { name: 'Zoom 3D view in' }).click();
  await expect(scene.locator('output')).toContainText('Zoom 120%');
  await reset.click();
  await scene.getByRole('button', { name: 'Zoom 3D view out' }).click();
  await expect(scene.locator('output')).toContainText('Zoom 83%');
  await reset.click();
  const dialog = page.getByRole('dialog');
  const before = await dialog.evaluate((element) => element.scrollTop);
  await swipe(cdp, await center(scene.locator('canvas')), 0, -100);
  await expect.poll(() => dialog.evaluate((element) => element.scrollTop)).toBeGreaterThan(before);
  await scene.locator('canvas').hover();
  const after = await dialog.evaluate((element) => element.scrollTop);
  await page.mouse.wheel(0, 100);
  await expect.poll(() => dialog.evaluate((element) => element.scrollTop)).toBeGreaterThan(after);
  await expect(scene.locator('output')).toContainText('Zoom 100%');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page
    .getByRole('navigation', { name: 'Main navigation' })
    .getByRole('button', { name: 'Home', exact: true })
    .click();
  const hero = page.locator('.hero-visual .scene');
  const toggle = hero.getByRole('button', { name: 'Show 3D view controls' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.tap();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await hero.getByRole('button', { name: 'Zoom 3D view in' }).tap();
  await expect(hero.locator('output')).toContainText('Zoom 120%');
  await hero.getByRole('button', { name: 'Reset 3D view' }).tap();
  await expect(hero.locator('output')).toContainText('Zoom 100%');
});

test('touch reorder handles move rows and controls remain accessible', async ({ page }) => {
  await startLesson(page, 'debit');
  await page.getByLabel('Debit account', { exact: true }).fill('equipment');
  await page.getByLabel('Credit account', { exact: true }).fill('cash');
  await page.getByRole('button', { name: 'Check my answer' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  const rows = page.locator('.order-row');
  const first = await rows.first().locator('span').nth(1).innerText();
  const from = await center(rows.first().locator('.drag-handle'));
  const next = await rows.nth(1).boundingBox();
  if (!next) throw new Error('Missing reorder row');
  const cdp = await page.context().newCDPSession(page);
  await swipe(cdp, from, 0, next.y + next.height - from.y);
  await expect(rows.nth(1).locator('span').nth(1)).toHaveText(first);
  await expect(rows.nth(1).locator('.order-number')).toHaveText('02');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations.map((violation) => violation.id)).toEqual([]);
});
