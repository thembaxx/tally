import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { initialProgress, lessons, readProgress, type Progress } from '../lib/learning';
import { practiceEntry } from '../lib/questions';
import { scheduleReview, weakestReviews, readReviews, type Review } from '../lib/reviews';
import { readBackup } from '../lib/backup';
import { createBakeryLesson } from '../lib/bakery';

test.use({ timezoneId: 'UTC' });
const today = new Date().toISOString().slice(0, 10);
function shiftDay(day: string, by: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + by);
  return date.toISOString().slice(0, 10);
}
const clean = { id: 'equation', mistakes: 0, hints: 0, firstTry: 1, total: 1 };
const dueReview = (overrides: Partial<Review> = {}): Review => ({
  due: shiftDay(today, -1),
  confidence: 'Getting there',
  mistakes: 1,
  hints: 0,
  streak: 0,
  interval: 1,
  attempts: 1,
  firstTry: 0,
  total: 1,
  lastReviewed: shiftDay(today, -2),
  ...overrides,
});
async function seed(page: Page, updates: Partial<Progress> = {}) {
  await page.addInitScript(
    (progress) => {
      if (!localStorage.getItem('tally-progress-v1'))
        localStorage.setItem('tally-progress-v1', JSON.stringify(progress));
    },
    { ...initialProgress, onboarded: true, name: 'Jo', ...updates },
  );
  await page.goto('/');
}
async function saved(page: Page) {
  return page.evaluate(
    () => JSON.parse(localStorage.getItem('tally-progress-v1') || '{}') as Progress,
  );
}
async function answer(page: Page, id: string, attempt = 0) {
  const entry = practiceEntry(id, attempt);
  await expect(page.locator('.entry-question')).toHaveText(entry.prompt);
  for (let i = 0; i < entry.labels.length; i++)
    await page.getByLabel(entry.labels[i], { exact: true }).fill(entry.answers[i][0]);
  await page.getByRole('button', { name: 'Check my answer' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
}

test('practice variants have exact arithmetic and every lesson has a review question', () => {
  const fixtures: Record<string, string> = {
    equation: '550',
    inventory: '24',
    depreciation: '300',
    ratios: '3',
    budgeting: '75',
    breakeven: '35',
    deferrals: '120',
    consolidation: '2750',
  };
  for (const [id, expected] of Object.entries(fixtures))
    expect(practiceEntry(id).answers[0][0], id).toBe(expected);
  expect(practiceEntry('equation').answers).not.toEqual(lessons[0].entry.answers);
  expect(practiceEntry('debit', 1).answers[0]).toContain('inventory');
  expect(practiceEntry('debit', 2).answers[1]).toContain('loan payable');
  expect(practiceEntry('ratios').answers[0]).toContain('3:1');
  for (const lesson of lessons) {
    const first = practiceEntry(lesson.id);
    expect(practiceEntry(lesson.id)).toEqual(first);
    expect(practiceEntry(lesson.id, 1).prompt).not.toBe(first.prompt);
    for (let attempt = 0; attempt < 24; attempt++) {
      const entry = practiceEntry(lesson.id, attempt);
      expect(entry.labels.length).toBe(entry.answers.length);
      expect(entry.answers.every((answers) => answers.length > 0 && answers.every(Boolean))).toBe(
        true,
      );
    }
  }
  // Independent examples guard the formulas beyond the first generated values.
  expect(practiceEntry('equation', 7).answers[0][0]).toBe('830');
  expect(practiceEntry('inventory', 7).answers[0][0]).toBe('65');
  expect(practiceEntry('depreciation', 7).answers[0][0]).toBe('440');
  expect(practiceEntry('consolidation', 7).answers[0][0]).toBe('3625');
});

test('spaced success grows intervals; retries, hints, and low confidence bring concepts back sooner', () => {
  const today = '2026-10-23';
  const first = scheduleReview(undefined, clean, 'It clicked!', today);
  expect(first).toMatchObject({
    interval: 3,
    streak: 1,
    due: '2026-10-26',
    attempts: 1,
    firstTry: 1,
    total: 1,
  });
  const repeat = scheduleReview(first, clean, 'It clicked!', today);
  expect(repeat.interval).toBe(3);
  const next = scheduleReview(repeat, clean, 'It clicked!', '2026-10-26');
  expect(next).toMatchObject({ interval: 7, streak: 2, due: '2026-11-02' });
  const third = scheduleReview(next, clean, 'It clicked!', '2026-11-02');
  const fourth = scheduleReview(third, clean, 'It clicked!', '2026-11-16');
  expect(third.interval).toBe(14);
  expect(fourth.interval).toBe(30);
  for (const result of [
    { ...clean, mistakes: 1, firstTry: 0 },
    { ...clean, hints: 1, firstTry: 0 },
  ]) {
    expect(scheduleReview(fourth, result, 'It clicked!', '2026-12-16')).toMatchObject({
      interval: 1,
      streak: 0,
      due: '2026-12-17',
    });
  }
  expect(scheduleReview(fourth, clean, 'Still learning', '2026-12-16').interval).toBe(1);
  expect(scheduleReview(undefined, clean, 'Getting there', '2028-02-27').due).toBe('2028-03-01');
  expect(
    weakestReviews(
      {
        equation: first,
        debit: dueReview({ due: '2026-10-22' }),
        statements: dueReview({ due: '2026-10-22', streak: 2, firstTry: 1 }),
      },
      today,
    ),
  ).toEqual(['debit', 'statements']);
});

test('legacy progress and backup exports migrate without losing XP or review dates', () => {
  const {
    reviews: _reviews,
    notes: _notes,
    draft: _draft,
    ...legacy
  } = { ...initialProgress, name: 'Sam', onboarded: true, xp: 180, completed: ['equation'] };
  const reviews = { equation: { due: '2026-10-26', confidence: 'Still learning', mistakes: 2 } };
  const p = readProgress(JSON.stringify(legacy), JSON.stringify(reviews));
  expect(p.xp).toBe(180);
  expect(p.completed).toEqual(['equation']);
  expect(p.reviews.equation).toMatchObject({ due: '2026-10-26', mistakes: 2, attempts: 0 });
  expect(readProgress(JSON.stringify(legacy), '{broken').xp).toBe(180);
  expect(
    readProgress(JSON.stringify({ ...legacy, reviews: {} }), JSON.stringify(reviews)).reviews,
  ).toEqual({});
  expect(readBackup(JSON.stringify({ progress: legacy, reviews })).reviews).toEqual(p.reviews);
  expect(
    readReviews({ equation: { due: '2026-02-30' }, unknown: reviews.equation }, ['equation']),
  ).toEqual({});
  for (const invalid of [
    '{broken',
    '{}',
    JSON.stringify({ version: 3, progress: p }),
    JSON.stringify({ progress: { ...p, xp: -1 } }),
  ])
    expect(() => readBackup(invalid)).toThrow();
});

test('Home selects weak due concepts, records retries and hints, and persists the short review', async ({
  page,
}) => {
  await seed(page, {
    xp: 120,
    completed: ['equation', 'debit', 'statements'],
    reviews: {
      equation: dueReview({ due: shiftDay(today, -3) }),
      debit: dueReview({ firstTry: 1, total: 4 }),
      statements: dueReview({ streak: 2, firstTry: 4, total: 4 }),
    },
  });
  await expect(page.getByRole('region', { name: 'Your next review' })).toContainText(
    'The Equation · Debit & Credit',
  );
  await page.getByRole('button', { name: 'Review these concepts' }).click();
  await expect(page.getByRole('button', { name: 'I’m ready to try' })).toHaveCount(0);
  await page.getByLabel('Owner’s equity ($)').fill('0');
  await page.getByRole('button', { name: 'Check my answer' }).click();
  await answer(page, 'equation', 1);
  await page.getByRole('button', { name: 'A little nudge?' }).click();
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(results.violations.map((v) => v.id)).toEqual([]);
  await answer(page, 'debit', 1);
  await expect(page.locator('.earned-xp')).toContainText('+20');
  await expect.poll(async () => (await saved(page)).xp).toBe(140);
  const p = await saved(page);
  expect(p.draft).toBeNull();
  expect(p.reviews.equation).toMatchObject({ interval: 1, mistakes: 1, due: shiftDay(today, 1) });
  expect(p.reviews.debit).toMatchObject({ interval: 1, hints: 1, due: shiftDay(today, 1) });
  await page.getByRole('button', { name: 'Keep the good feeling' }).click();
  await page.reload();
  await expect(page.getByRole('region', { name: 'Your next review' })).toContainText('Statements');
});

test('an unfinished lesson resumes its activity and takeaway across reloads, then awards XP once', async ({
  page,
}) => {
  test.setTimeout(120000);
  await seed(page);
  await page.getByRole('button', { name: 'Statements, start lesson', exact: true }).click();
  await page.getByRole('button', { name: 'I’m ready to try' }).click();
  await answer(page, 'statements');
  await expect(page.getByRole('heading', { name: 'Put the story in order.' })).toBeVisible();
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Resume learning' }).click();
  await expect(page.getByRole('heading', { name: 'Put the story in order.' })).toBeVisible();
  const first = lessons.find((l) => l.id === 'statements')!.order[0];
  for (let i = 0; i < 4; i++)
    await page.getByRole('button', { name: `Move ${first} up`, exact: true }).click();
  await page.getByRole('button', { name: 'Check the order' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  const note = 'Gross profit comes before rent.';
  await page.getByLabel('My takeaway').fill(note);
  await expect.poll(async () => (await saved(page)).draft?.note).toBe(note);
  await page.reload();
  await page.getByRole('button', { name: 'Resume learning' }).click();
  await expect(page.getByLabel('My takeaway')).toHaveValue(note);
  await page.getByRole('button', { name: 'Finish lesson' }).click();
  await expect.poll(async () => (await saved(page)).xp).toBe(60);
  await page.getByRole('button', { name: 'Keep the good feeling' }).click();
  await page.getByRole('button', { name: 'Practice', exact: true }).click();
  await expect(page.locator('.saved-takeaway')).toHaveText(`My takeaway: ${note}`);
  await page.reload();
  expect((await saved(page)).xp).toBe(60);
  expect((await saved(page)).draft).toBeNull();
});

test('a real legacy device migrates its separate review schedule', async ({ page }) => {
  await page.addInitScript(
    (due) => {
      localStorage.setItem(
        'tally-progress-v1',
        JSON.stringify({
          name: 'Legacy',
          onboarded: true,
          xp: 120,
          completed: ['equation'],
          activity: {},
        }),
      );
      localStorage.setItem(
        'tally-reviews-v1',
        JSON.stringify({
          equation: { due, confidence: 'Still learning', mistakes: 2 },
        }),
      );
    },
    shiftDay(today, -3),
  );
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Review this concept' })).toBeVisible();
  await expect
    .poll(async () => (await saved(page)).reviews.equation?.due)
    .toBe(shiftDay(today, -3));
  expect((await saved(page)).xp).toBe(120);
});

test('export and import round-trip progress, with explicit replacement and invalid-file recovery', async ({
  page,
}) => {
  await seed(page, {
    xp: 180,
    completed: ['equation'],
    notes: { equation: 'Own = owe + owner.' },
    reviews: { equation: dueReview() },
  });
  await page.getByRole('button', { name: 'Open settings' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export my progress' }).click();
  const download = await downloadPromise;
  const backup = await download.path();
  if (!backup) throw new Error('Backup was not downloaded');
  await page.getByRole('button', { name: 'Start a fresh chapter' }).click();
  await page.getByRole('button', { name: 'Yes, start fresh' }).click();
  await expect.poll(async () => (await saved(page)).xp).toBe(0);
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Import my progress' }).click();
  await (
    await chooser
  ).setFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{bad') });
  await expect(page.getByRole('alert')).toContainText('valid Tally');
  expect((await saved(page)).xp).toBe(0);
  await page.getByLabel('Tally progress backup').setInputFiles(backup);
  await expect(page.getByRole('region', { name: 'Review imported progress' })).toContainText(
    '180 XP',
  );
  expect((await saved(page)).xp).toBe(0);
  await page.getByRole('button', { name: 'Keep current progress' }).click();
  await expect(page.getByRole('region', { name: 'Review imported progress' })).toHaveCount(0);
  await page.getByLabel('Tally progress backup').setInputFiles(backup);
  await page.getByRole('button', { name: 'Restore this progress' }).click();
  await expect.poll(async () => (await saved(page)).xp).toBe(180);
  await page.reload();
  const restored = await saved(page);
  expect(restored.notes.equation).toBe('Own = owe + owner.');
  expect(restored.reviews.equation.due).toBe(shiftDay(today, -1));
  expect(restored.completed).toEqual(['equation']);
});

test('the bakery connects four journal entries to profit and balanced statements', async ({
  page,
}) => {
  test.setTimeout(120000);
  await seed(page);
  await page.goto('/?lesson=bakery');
  await page.getByRole('button', { name: 'I’m ready to try' }).click();
  for (const task of createBakeryLesson().activities!) {
    if (task.type === 'journal') {
      const c = task.challenge;
      await page.getByRole('button', { name: c.debit, exact: true }).click();
      await page.getByRole('button', { name: 'Place account on debit', exact: true }).click();
      await page.getByRole('button', { name: c.credit, exact: true }).click();
      await page.getByRole('button', { name: 'Place account on credit', exact: true }).click();
      await page.getByLabel('Debit amount ($)', { exact: true }).fill(String(c.amount));
      await page.getByLabel('Credit amount ($)', { exact: true }).fill(String(c.amount));
      await page.getByRole('button', { name: 'Check my entry' }).click();
    } else if (task.type === 'choice') {
      const label = task.challenge.options.find((o) => o.id === task.challenge.correct)!.label;
      await page.getByRole('button', { name: label, exact: false }).click();
    }
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
  }
  await page.getByLabel('My takeaway').fill('Cash and profit tell different parts of one story.');
  await page.getByRole('button', { name: 'Finish lesson' }).click();
  await expect(page.locator('.earned-xp')).toContainText('+60');
  await expect.poll(async () => (await saved(page)).completed).toContain('bakery');
  expect((await saved(page)).reviews.bakery).toMatchObject({ total: 6, firstTry: 6, interval: 3 });
});
