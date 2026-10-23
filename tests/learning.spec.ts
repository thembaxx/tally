import { test, expect, type Page } from '@playwright/test';
import {
  initialProgress,
  localDay,
  previousDay,
  streak,
  accepts,
  readProgress,
  dailyTasks,
} from '../lib/learning';
async function returning(page: Page) {
  await page.addInitScript(
    (p) => {
      if (!localStorage.getItem('tally-progress-v1'))
        localStorage.setItem('tally-progress-v1', JSON.stringify(p));
    },
    {
      ...initialProgress,
      onboarded: true,
      name: 'Alex',
    },
  );
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'A little wiser, Alex.' })).toBeVisible();
}
test('accounting model, loose checks, daily variation, and real streaks', () => {
  expect(accepts(' $1,200.00 ', ['1200'])).toBe(true);
  expect(accepts('Laptop', ['equipment', 'laptop'])).toBe(true);
  expect(accepts('', ['0'])).toBe(false);
  expect(accepts('cash flow', ['cash'])).toBe(false);
  const day = '2026-10-23';
  expect(streak({ [day]: 5, [previousDay(day)]: 5 }, day)).toBe(2);
  expect(streak({ '2026-10-20': 5 }, day)).toBe(0);
  expect(dailyTasks(day)).toEqual(dailyTasks(day));
  expect(dailyTasks(day)).not.toEqual(dailyTasks(previousDay(day)));
  expect(readProgress('{broken').xp).toBe(0);
  expect(readProgress('{"sound":true,"soundVolume":900}').soundVolume).toBe(100);
  expect(readProgress('{"sound":true,"soundVolume":-2}').soundVolume).toBe(0);
  expect(readProgress('{"sound":true,"soundVolume":"loud"}').soundVolume).toBe(45);
  expect(readProgress('{"sound":false}').sound).toBe(false);
  expect(readProgress('{"xp":"fake","completed":["bad"]}').completed).toEqual([]);
});
test('onboarding, swipe sorting, loose answer, XP and review persistence', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Let’s make it click' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('What should I call you?').fill('Sam');
  await page.getByRole('button', { name: 'A little more about you' }).click();
  await page.getByRole('button', { name: /A steady glow/ }).click();
  await page.getByRole('button', { name: 'A little more about you' }).click();
  await page.getByRole('button', { name: 'Let’s find your first lightbulb moment' }).click();
  await page.getByRole('button', { name: 'I’m ready to try' }).click();
  await page.getByRole('button', { name: 'Liability', exact: true }).click();
  await expect(page.getByText('Let’s think it through')).toBeVisible();
  await page.getByRole('button', { name: 'Asset', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Liability', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  const card = page.locator('.sort-card');
  const box = await card.boundingBox();
  if (!box) throw Error('No swipe card');
  await card.dispatchEvent('pointerdown', {
    clientX: box.x + 100,
    clientY: box.y + 100,
    pointerId: 1,
  });
  await card.dispatchEvent('pointerup', {
    clientX: box.x + 100,
    clientY: box.y + 20,
    pointerId: 1,
  });
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Owner’s equity ($)').fill('$40.00');
  await page.getByRole('button', { name: 'Check my answer' }).click();
  await expect(page.getByText(/\$100 − \$60 = \$40/)).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('My takeaway').fill('What we own equals what we owe plus our share.');
  await page.getByRole('button', { name: 'Still learning', exact: true }).click();
  await page.getByRole('button', { name: 'Finish lesson' }).click();
  await expect(page.locator('.earned-xp')).toContainText('+60');
  await page.getByRole('button', { name: 'Keep the good feeling' }).click();
  await expect(page.getByRole('heading', { name: 'A little wiser, Sam.' })).toBeVisible();
  await page.reload();
  await expect(page.locator('.xp-chip')).toContainText('60');
  await expect(page.locator('.streak-chip')).toContainText('1');
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await expect(
    page.getByRole('button', { name: /The Equation.*Next gentle review/ }),
  ).toBeVisible();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('tally-progress-v1') || '{}'),
  );
  expect(saved.completed).toContain('equation');
  expect(errors).toEqual([]);
});
test('debit synonyms, Enter advance, accessible reorder, and reduced repeat XP', async ({
  page,
}) => {
  await returning(page);
  await page.getByRole('button', { name: 'Debit & Credit, start lesson', exact: true }).click();
  await page.getByRole('button', { name: 'I’m ready to try' }).click();
  await page.getByLabel('Debit account').fill('laptop');
  await page.getByLabel('Debit account').press('Enter');
  await expect(page.getByLabel('Credit account')).toBeFocused();
  await page.getByLabel('Credit account').fill('bank');
  await page.getByLabel('Credit account').press('Enter');
  await expect(page.getByText('That’s it!')).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  const first = 'Identify the transaction';
  for (let i = 0; i < 3; i++)
    await page.getByRole('button', { name: `Move ${first} up`, exact: true }).click();
  await page.getByRole('button', { name: 'Check the order' }).click();
  await expect(page.getByText('That’s it!')).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Finish lesson' }).click();
  await expect(page.locator('.earned-xp')).toContainText('+60');
  await page.getByRole('button', { name: 'Keep the good feeling' }).click();
  await page.getByRole('button', { name: 'Debit & Credit, review lesson', exact: true }).click();
  await page.getByRole('button', { name: 'I’m ready to try' }).click();
  await page.getByLabel('Debit account').fill('equipment');
  await page.getByLabel('Credit account').fill('cash');
  await page.getByRole('button', { name: 'Check my answer' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  for (let i = 0; i < 3; i++)
    await page.getByRole('button', { name: `Move ${first} up`, exact: true }).click();
  await page.getByRole('button', { name: 'Check the order' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Finish lesson' }).click();
  await expect(page.locator('.earned-xp')).toContainText('+10');
});
test('theme persistence, focus pause and finish, navigation and responsive overflow', async ({
  page,
}) => {
  await returning(page);
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByRole('button', { name: 'Light', exact: true }).click();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.clock.install();
  await page.getByRole('switch', { name: 'Focus mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Pause focus timer' }).click();
  const pausedTime = await page.locator('.focus-time').textContent();
  await page.clock.fastForward(60000);
  await expect(page.locator('.focus-time')).toHaveText(pausedTime!);
  await page.getByRole('button', { name: 'Resume focus timer' }).click();
  await page.clock.runFor(1000);
  await page.clock.fastForward(300000);
  await page.clock.runFor(1000);
  await expect(page.locator('.xp-chip')).toContainText('10');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
test('navigation and responsive layouts at five widths', async ({ page }) => {
  test.setTimeout(120000);
  await returning(page);
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const tab of ['Learn', 'Practice', 'Me', 'Home']) {
      await page.getByRole('button', { name: tab, exact: true }).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
  }
  await page.getByRole('button', { name: 'Learn', exact: true }).click();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'A little wiser, Alex.' })).toBeVisible();
});

test('daily mix completes all three tasks and repeat rewards decrease', async ({ page }) => {
  test.setTimeout(120000);
  // Pin the device's clock so the date-seeded activity cannot change between
  // test process and browser, including across time-zone or midnight boundaries.
  const day = '2026-10-23';
  await page.clock.setFixedTime(new Date('2026-10-23T12:00:00Z'));
  await returning(page);
  const tasks = dailyTasks(day);
  for (const expected of [90, 15]) {
    await page
      .getByRole('button', {
        name: expected === 90 ? 'Take the challenge' : 'Play it again',
        exact: true,
      })
      .click();
    for (const item of tasks.sort) {
      await page.getByRole('button', { name: item.category, exact: true }).click();
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
    }
    for (let i = 0; i < tasks.entry.labels.length; i++)
      await page.getByLabel(tasks.entry.labels[i]).fill(tasks.entry.answers[i][0]);
    await page.getByRole('button', { name: 'Check my answer' }).click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    for (let i = 0; i < tasks.order.length - 1; i++)
      await page.getByRole('button', { name: `Move ${tasks.order[0]} up`, exact: true }).click();
    await page.getByRole('button', { name: 'Check the order' }).click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(page.locator('.earned-xp')).toContainText(`+${expected}`);
    await page.getByRole('button', { name: 'Keep the good feeling' }).click();
  }
  await expect(page.locator('.xp-chip')).toContainText('105');
});

test('Me shows personal progress while appearance and other preferences live in Settings', async ({
  page,
}) => {
  await returning(page);
  await page.getByRole('button', { name: 'Me', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your little corner of Tally.' })).toBeVisible();
  await expect(page.getByText('Total XP', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'A few things to be proud of.' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Theme' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'All settings' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Edit profile' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  await expect(page.getByLabel('Your name')).toHaveValue('Alex');
  await expect(page.getByRole('group', { name: 'Choose theme' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Daily goal' })).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Haptic feedback' })).toBeVisible();
  await expect(page.getByRole('switch', { name: 'Sound effects' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Export my progress' })).toBeVisible();
  await page.getByRole('button', { name: 'Dark', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Your little corner of Tally.' })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Choose theme' })).toHaveCount(0);
});

test('sound is opt-in with accessible volume, preview and persisted preference', async ({
  page,
}) => {
  await returning(page);
  await page.getByRole('button', { name: 'Open settings' }).click();
  const sound = page.getByRole('switch', { name: 'Sound effects' });
  const volume = page.getByRole('slider', { name: 'Sound volume' });
  const preview = page.getByRole('button', { name: 'Preview sounds' });
  await expect(sound).toHaveAttribute('aria-checked', 'false');
  await expect(volume).toBeDisabled();
  await expect(preview).toBeDisabled();

  await sound.click();
  await expect(sound).toHaveAttribute('aria-checked', 'true');
  await expect(volume).toBeEnabled();
  await expect(preview).toBeEnabled();
  await volume.press('End');
  for (let i = 0; i < 7; i++) await volume.press('ArrowLeft');
  await expect(volume).toHaveValue('65');
  await preview.click();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Open settings' }).click();
  await expect(page.getByRole('switch', { name: 'Sound effects' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.getByRole('slider', { name: 'Sound volume' })).toHaveValue('65');
  await page.getByRole('switch', { name: 'Sound effects' }).click();
  await expect(page.getByRole('button', { name: 'Preview sounds' })).toBeDisabled();
});
