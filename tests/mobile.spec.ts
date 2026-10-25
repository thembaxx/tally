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
