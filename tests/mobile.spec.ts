import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { initialProgress } from '../lib/learning';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(
    (p) => {
      Reflect.set(window, 'tallyGLProbes', 0);
      HTMLCanvasElement.prototype.getContext = () => {
        Reflect.set(window, 'tallyGLProbes', Reflect.get(window, 'tallyGLProbes') + 1);
        return null;
      };
      if (!localStorage.getItem('tally-progress-v1'))
        localStorage.setItem('tally-progress-v1', JSON.stringify(p));
    },
    { ...initialProgress, onboarded: true, name: 'Zola', graphics: 'simple' },
  );
});
test('WebKit mobile sheets fit small viewports, keep text legible and restore focus', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open settings', exact: true }).tap();
  await page.setViewportSize({ width: 320, height: 480 });
  const name = page.getByLabel('Your name', { exact: true });
  await name.tap();
  await name.fill('Zola learns');
  expect(
    await name.evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
  ).toBeGreaterThanOrEqual(16);
  await expect(name).toBeInViewport();
  expect(
    await page.locator('[role="dialog"]').evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
  ).toBe(true);
  await page.getByRole('button', { name: 'Close', exact: true }).tap();
  await expect(page.getByRole('button', { name: 'Open settings', exact: true })).toBeFocused();
  await page.goto('/?tab=practice');
  await page.getByRole('button', { name: /Big ideas. Little shop/ }).tap();
  await page.getByRole('button', { name: /Stock the shelf/ }).tap();
  await page.getByRole('button', { name: 'Profit stays the same', exact: true }).tap();
  await page.getByRole('button', { name: 'Try this decision', exact: true }).tap();
  await expect(page.locator('.shop-receipt')).toContainText('Unsold stock is an asset');
  expect(await page.evaluate(() => Reflect.get(window, 'tallyGLProbes'))).toBe(0);
  expect(
    await page.locator('[role="dialog"]').evaluate((e) => e.scrollWidth <= e.clientWidth + 1),
  ).toBe(true);
  const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(result.violations).toEqual([]);
});
test('WebKit preserves case checkpoints and supports accessible explanation controls', async ({
  page,
}) => {
  await page.goto('/?tab=practice');
  await page.getByRole('button', { name: /Put the pieces together/ }).tap();
  await page.getByRole('button', { name: /Where did the R50 go/ }).tap();
  await page.getByLabel('Adjusted bank balance (R)', { exact: true }).fill('950');
  await page.getByLabel('Adjusted bank balance (R)', { exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Continue', exact: true }).tap();
  await expect(page.getByRole('heading', { name: 'Update the books', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /Put the pieces together/ }).tap();
  await page.getByRole('button', { name: /Where did the R50 go/ }).tap();
  await expect(page.getByRole('heading', { name: 'Update the books', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).tap();
  await page.goto('/?lesson=debit');
  await page.getByText('Explain it my way', { exact: true }).tap();
  await page.getByRole('button', { name: 'Example', exact: true }).tap();
  await expect(page.locator('.coach-content').first()).toContainText('R500 oven');
});

test('WebKit offers honest vibration support and decodes the sound previews', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Reflect.set(window, 'tallyDecodedSounds', 0);
    Reflect.set(window, 'tallyPlayedSamples', 0);
    const Native = window.AudioContext;
    window.AudioContext = class extends Native {
      override decodeAudioData(bytes: ArrayBuffer) {
        return super.decodeAudioData(bytes).then((buffer) => {
          Reflect.set(window, 'tallyDecodedSounds', Reflect.get(window, 'tallyDecodedSounds') + 1);
          return buffer;
        });
      }
      override createBufferSource() {
        const source = super.createBufferSource();
        const start = source.start.bind(source);
        source.start = (when?: number) => {
          Reflect.set(window, 'tallyPlayedSamples', Reflect.get(window, 'tallyPlayedSamples') + 1);
          start(when);
        };
        return source;
      }
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open settings', exact: true }).tap();
  await expect(page.getByRole('button', { name: 'Test vibration' })).toBeDisabled();
  await expect(
    page.getByRole('status').filter({ hasText: 'This browser doesn’t offer vibration' }),
  ).toBeVisible();
  await page.getByRole('switch', { name: 'Sound effects' }).tap();
  await expect.poll(() => page.evaluate(() => Reflect.get(window, 'tallyDecodedSounds'))).toBe(7);
  await page.getByRole('button', { name: 'Preview sounds', exact: true }).tap();
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, 'tallyPlayedSamples')))
    .toBeGreaterThan(0);
  await page.setViewportSize({ width: 320, height: 480 });
  await page.getByRole('button', { name: 'Preview placement sound' }).tap();
  expect(await page.getByRole('dialog').evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(
    true,
  );
  expect(errors).toEqual([]);
});

test('WebKit keeps personal tutoring controls usable and saves an untimed starting point', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Tune my learning', exact: true }).tap();
  await page
    .getByRole('combobox', { name: 'How much guidance?', exact: true })
    .selectOption('guided');
  await page.getByRole('combobox', { name: 'My practice size', exact: true }).selectOption('one');
  await page.getByRole('button', { name: 'Try it', exact: true }).tap();
  await page.getByRole('button', { name: 'Not sure yet — show me', exact: true }).tap();
  await page.getByRole('button', { name: 'Next idea', exact: true }).tap();
  await page.reload();
  await page.getByRole('button', { name: 'Tune my learning', exact: true }).tap();
  await expect(page.getByRole('combobox', { name: 'How much guidance?', exact: true })).toHaveValue(
    'guided',
  );
  await expect(page.getByRole('combobox', { name: 'My practice size', exact: true })).toHaveValue(
    'one',
  );
  await page.getByRole('button', { name: 'Continue', exact: true }).tap();
  await expect(page.getByRole('heading', { name: 'Follow the value.', exact: true })).toBeFocused();
  await page.setViewportSize({ width: 320, height: 480 });
  expect(await page.getByRole('dialog').evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(
    true,
  );
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  ).toEqual([]);
  const p = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('tally-progress-v1') || '{}'),
  );
  expect(p.tutor.startingPoint.answers.equation).toBe('support');
  expect(p.completed).toEqual([]);
  expect(p.xp).toBe(0);
});
