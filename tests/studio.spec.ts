import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { initialProgress, lessons, readProgress } from '../lib/learning';
async function studio(page: Page, format: string) {
  await page.addInitScript((p) => localStorage.setItem('tally-progress-v1', JSON.stringify(p)), {
    ...initialProgress,
    onboarded: true,
    name: 'Jo',
  });
  await page.goto('/?tab=practice');
  await page.getByRole('button', { name: `Try ${format}`, exact: true }).click();
  await page.getByRole('button', { name: 'I’m ready to try' }).click();
}
async function finish(page: Page) {
  await page.getByRole('button', { name: 'Finish lesson', exact: true }).click();
  await expect(page.locator('.earned-xp')).toContainText('+60');
}
test('all formats have complete, playable lesson data; existing progress remains valid', () => {
  expect(lessons).toHaveLength(16);
  expect(lessons.every((l) => !l.locked && l.concept && l.example)).toBe(true);
  for (const format of ['journal', 'recall', 'detective', 'story'])
    expect(lessons.some((l) => l.format === format && l.activities?.length)).toBe(true);
  const saved = readProgress(
    JSON.stringify({ ...initialProgress, xp: 120, completed: ['equation', 'debit'] }),
  );
  expect(saved.xp).toBe(120);
  expect(saved.completed).toEqual(['equation', 'debit']);
});
test('journal lab checks the accounts as well as equal totals', async ({ page }) => {
  await studio(page, 'Build an entry');
  await page.getByRole('button', { name: 'Revenue', exact: true }).click();
  await page.getByRole('button', { name: 'Place account on debit', exact: true }).click();
  await page.getByRole('button', { name: 'Cash', exact: true }).click();
  await page.getByRole('button', { name: 'Place account on credit', exact: true }).click();
  await page.getByLabel('Debit amount ($)', { exact: true }).fill('$500.00');
  await page.getByLabel('Debit amount ($)', { exact: true }).press('Enter');
  await expect(page.getByLabel('Credit amount ($)', { exact: true })).toBeFocused();
  await page.getByLabel('Credit amount ($)', { exact: true }).fill('500');
  await page.getByRole('button', { name: 'Check my entry' }).click();
  await expect(page.getByText(/Your totals balance. Now check/)).toBeVisible();
  await page.getByRole('button', { name: 'Equipment', exact: true }).click();
  await page.getByRole('button', { name: 'Place account on debit: Revenue', exact: true }).click();
  await page.getByRole('button', { name: 'Check my entry' }).click();
  await expect(page.getByText('That’s it!', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Supplies', exact: true }).click();
  await page.getByRole('button', { name: 'Place account on debit', exact: true }).click();
  await page.getByRole('button', { name: 'Accounts payable', exact: true }).click();
  await page.getByRole('button', { name: 'Place account on credit', exact: true }).click();
  await page.getByLabel('Debit amount ($)', { exact: true }).fill('200');
  await page.getByLabel('Credit amount ($)', { exact: true }).fill('200');
  await page.getByRole('button', { name: 'Check my entry' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await finish(page);
});
test('recall cards revisit a fuzzy idea before completing the deck', async ({ page }) => {
  await studio(page, 'Turn a card');
  await page.getByLabel('My first thought').fill('An asset');
  await page.getByRole('button', { name: 'Turn the card', exact: true }).click();
  await expect(page.locator('.recall-back')).toContainText('An asset.');
  await page.getByRole('button', { name: 'Let’s see it again' }).click();
  for (const answer of ['The debit side.', '$60.', 'An asset.']) {
    await page.getByRole('button', { name: 'Turn the card', exact: true }).click();
    await expect(page.locator('.recall-back')).toContainText(answer);
    await page.getByRole('button', { name: 'It’s connecting', exact: true }).click();
  }
  await finish(page);
});
test('story decisions explain incorrect choices and unlock cash-flow understanding', async ({
  page,
}) => {
  await studio(page, 'Follow a story');
  await page.getByRole('button', { name: /Operating: the bakery uses/ }).click();
  await expect(page.getByText(/buying a long-term asset is an investing cash flow/)).toBeVisible();
  await page.getByRole('button', { name: /Investing: the business bought/ }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: /Revenue and accounts receivable increased/ }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await finish(page);
});
test('detective lesson gives specific feedback for balanced but incorrect entries', async ({
  page,
}) => {
  await studio(page, 'Spot the slip');
  await page.getByRole('button', { name: /Nothing—the entry balances/ }).click();
  await expect(page.getByText(/A camera is not a rent payment/)).toBeVisible();
  await page.getByRole('button', { name: /Use Equipment instead of Rent expense/ }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: /Deferred revenue: there is still a service/ }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await finish(page);
});
test('reduced-motion studio is readable, keyboard accessible, and has no AA violations', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await studio(page, 'Spot the slip');
  await expect(page.locator('.choice-task')).toBeVisible();
  await page.getByRole('button', { name: /Use Equipment instead of Rent expense/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('That’s it!', { exact: true })).toBeVisible();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
});

test('lesson filters recalculate scroll entrances and preserve all chapters', async ({ page }) => {
  await page.goto('/?tab=learn');
  for (const [filter, count] of [
    ['Deeper', 5],
    ['Basics', 4],
    ['Next level', 7],
    ['All lessons', 16],
  ] as const) {
    await page.getByRole('button', { name: filter, exact: true }).click();
    await expect(page.locator('.path-section').first()).toHaveCSS('opacity', '1');
    await expect(page.locator('.path-section .lesson-card')).toHaveCount(count);
  }
  await page.getByRole('button', { name: 'Deeper', exact: true }).click();
  await page.getByRole('button', { name: 'Spot the Slip, start lesson', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('the 3D recall flip shows a readable answer face and restores focus on close', async ({
  page,
}) => {
  await studio(page, 'Turn a card');
  await page.getByRole('button', { name: 'Turn the card', exact: true }).click();
  const flippedCard = page.locator('.recall-card');
  await expect(flippedCard).toHaveAttribute('aria-label', /Answer:/);
  // Observe the completed flip instead of assuming a fixed spring duration.
  await expect
    .poll(
      () =>
        flippedCard.evaluate((element) => {
          const transform = new DOMMatrixReadOnly(getComputedStyle(element).transform);
          return Math.abs(transform.m11 + 1) < 0.000001 && Math.abs(transform.m13) < 0.000001;
        }),
      { timeout: 15000 },
    )
    .toBe(true);
  await expect(flippedCard).toHaveScreenshot('recall-answer.png', {
    animations: 'disabled',
    maxDiffPixelRatio: 0.01,
    timeout: 15000,
  });
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Try Turn a card', exact: true })).toBeFocused();
});
