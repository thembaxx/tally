import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { initialProgress, lessons, type Progress } from '../lib/learning';
import { scheduleReview, type Review } from '../lib/reviews';
import { recallEvidence, skillStage } from '../lib/skills';
import { practiceEntry } from '../lib/questions';

test.use({ timezoneId: 'UTC', reducedMotion: 'reduce' });
const today = new Date().toISOString().slice(0, 10);
function day(by: number) {
  const date = new Date(`${today}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + by);
  return date.toISOString().slice(0, 10);
}
const review = (changes: Partial<Review> = {}): Review => ({
  due: day(-1),
  confidence: 'Getting there',
  mistakes: 0,
  hints: 0,
  streak: 1,
  interval: 3,
  attempts: 1,
  firstTry: 1,
  total: 1,
  lastReviewed: day(-4),
  ...changes,
});
const mixed: Partial<Progress> = {
  completed: ['equation', 'debit', 'statements', 'inventory'],
  notes: { equation: 'Own = owe + owner.' },
  reviews: {
    equation: review({ mistakes: 2, streak: 0, firstTry: 0 }),
    debit: review({ hints: 1, streak: 0, firstTry: 0 }),
    statements: review({ streak: 3, interval: 14, attempts: 3, firstTry: 3, total: 3 }),
    ratios: review({ due: day(3) }),
    depreciation: review({ attempts: 0, total: 0, firstTry: 0 }),
  },
};
async function seed(page: Page, updates: Partial<Progress>, path = '/') {
  await page.addInitScript(
    (progress) => {
      if (!localStorage.getItem('tally-progress-v1'))
        localStorage.setItem('tally-progress-v1', JSON.stringify(progress));
    },
    { ...initialProgress, onboarded: true, theme: 'light', ...updates },
  );
  await page.goto(path);
  // The app keeps controls inert until the saved progress has loaded. Focus()
  // does not wait for that guard, unlike the subsequent click-based flows.
  await expect(page.locator('.content-shell')).toHaveAttribute('aria-busy', 'false');
}

test('skill stages require independent recall across days and preserve uncertain legacy evidence', () => {
  expect(skillStage(undefined, false).label).toBe('Not started');
  expect(skillStage(undefined, true).label).toBe('Building');
  expect(skillStage(review({ total: 0, attempts: 0, streak: 4 }), false).label).toBe('Building');
  const result = { id: 'equation', mistakes: 0, hints: 0, firstTry: 1, total: 1 };
  let history = scheduleReview(undefined, result, 'It clicked!', '2026-10-01');
  for (let i = 0; i < 5; i++)
    history = scheduleReview(history, result, 'It clicked!', '2026-10-01');
  expect(skillStage(history, true).label).toBe('Strengthening');
  history = scheduleReview(history, result, 'Getting there', '2026-10-04');
  expect(skillStage(history, true).label).toBe('Strengthening');
  history = scheduleReview(history, result, 'It clicked!', '2026-10-11');
  expect(skillStage(history, true).label).toBe('Steady');
  expect(recallEvidence(history)).toContain('3 separate days');
  for (const changes of [{ mistakes: 1 }, { hints: 1 }, { confidence: 'Still learning' }])
    expect(skillStage({ ...history, ...changes }, true).label).toBe('Building');
  expect(recallEvidence(review({ mistakes: 2, hints: 1 }))).toContain('2 retries and 1 hint');
  expect(recallEvidence(review({ confidence: 'Still learning' }))).toContain('“Still learning”');
});

test('new learners can open the map with a keyboard and launch their first lesson', async ({
  page,
}) => {
  // XP from focus sessions does not imply any skill evidence.
  await seed(page, { xp: 2000, onboarded: false });
  const shortcut = page.getByRole('button', { name: /See how your skills are growing/ });
  await shortcut.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Your skill map' })).toBeVisible();
  await expect(page.locator('.skill-card')).toHaveCount(lessons.filter((l) => !l.locked).length);
  await expect(page.locator('.skill-status', { hasText: 'Not started' })).toHaveCount(16);
  await expect(page).toHaveURL(/tab=learn&view=skills/);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Skill map', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Lessons', exact: true }).click();
  await expect(page.getByRole('group', { name: 'Lesson level' })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Your skill map' })).toBeVisible();
  const start = page.getByRole('button', { name: 'Start The Equation', exact: true });
  await start.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.sort-card')).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await expect(start).toBeFocused();
});

test('the map explains evidence and dates, then updates after a real targeted review', async ({
  page,
}) => {
  await seed(page, mixed);
  const reasons = page.getByRole('region', { name: 'Your next review' });
  await expect(reasons).toContainText('Your last practice included 2 retries.');
  await expect(reasons).toContainText('Your last practice included 1 hint.');
  await page.getByRole('button', { name: /See how your skills are growing/ }).click();
  const equation = page.getByRole('article', { name: 'The Equation', exact: true });
  const steady = page.getByRole('article', { name: 'Statements', exact: true });
  const ratios = page.getByRole('article', { name: 'Read Between the Numbers', exact: true });
  await expect(equation.locator('.skill-status')).toHaveText('Building');
  await expect(steady.locator('.skill-status')).toHaveText('Steady');
  await expect(steady).toContainText('3 separate days');
  await expect(steady).toContainText('Review due');
  await expect(ratios.locator('.skill-status')).toHaveText('Strengthening');
  await expect(ratios).toContainText('Next review');
  await expect(ratios.locator('time')).toHaveAttribute('datetime', day(3));
  for (const title of ['Inventory Stories', 'Depreciation']) {
    const legacy = page.getByRole('article', { name: title, exact: true });
    await expect(legacy.locator('.skill-status')).toHaveText('Building');
    await expect(legacy).toContainText('A short review will show what you can recall.');
  }
  await equation.getByRole('button', { name: 'Review The Equation', exact: true }).click();
  const entry = practiceEntry('equation', 1, 'guided');
  await expect(page.locator('.entry-question')).toHaveText(entry.prompt, { timeout: 15000 });
  await page.getByLabel(entry.labels[0], { exact: true }).fill(entry.answers[0][0]);
  await page.getByRole('button', { name: 'Check my answer' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.earned-xp')).toContainText('+10');
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(equation.locator('.skill-status')).toHaveText('Building');
  await expect(equation).toContainText('step-by-step guidance');
  await expect(equation.locator('time')).toHaveAttribute('datetime', day(1));
  await page.reload();
  await expect(equation.locator('.skill-status')).toHaveText('Building');
  const progress = await page.evaluate(
    () => JSON.parse(localStorage.getItem('tally-progress-v1') || '{}') as Progress,
  );
  expect(progress.xp).toBe(10);
  expect(progress.notes.equation).toBe('Own = owe + owner.');
  expect(progress.completed).toEqual(mixed.completed);
});

test('skill map fits mobile through desktop and passes automated AA checks in both themes', async ({
  page,
}) => {
  await seed(page, mixed, '/?tab=learn&view=skills');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await expect(page.getByRole('heading', { name: 'Your skill map' })).toBeVisible();
  for (const width of [320, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  for (const theme of ['light', 'dark']) {
    await page.getByRole('button', { name: /^Settings/ }).click();
    await page
      .getByRole('button', { name: theme === 'light' ? 'Light' : 'Dark', exact: true })
      .click();
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  }
  expect(errors).toEqual([]);
});
