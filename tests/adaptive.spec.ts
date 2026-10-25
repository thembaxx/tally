import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  initialProgress,
  localDay,
  lessons,
  dailyTasks,
  readProgress,
  accepts,
  type Progress,
} from '../lib/learning';
import { practiceEntry } from '../lib/questions';
import { recommendedChallenge, practiceTopics } from '../lib/adaptive';
import { challengeLevels, type ChallengeLevel } from '../lib/challenge-questions';
import { scheduleReview, type Review } from '../lib/reviews';
import { readDraft, type LessonDraft } from '../lib/session';
import { readBackup } from '../lib/backup';
import { skillStage } from '../lib/skills';

test.use({ timezoneId: 'Africa/Johannesburg', reducedMotion: 'reduce' });
const today = localDay();
const review = (updates: Partial<Review> = {}): Review => ({
  due: '2026-01-01',
  confidence: 'Getting there',
  mistakes: 0,
  hints: 0,
  streak: 1,
  interval: 3,
  attempts: 1,
  firstTry: 1,
  total: 1,
  lastReviewed: '2026-01-01',
  ...updates,
});
const ids = lessons.filter((l) => !l.locked).map((l) => l.id);

test('difficulty follows demonstrated practice; guided work and same-day repeats do not establish independent recall', () => {
  expect(recommendedChallenge(undefined).level).toBe('guided');
  expect(recommendedChallenge(review({ attempts: 0, total: 0, streak: 4 })).level).toBe('guided');
  expect(recommendedChallenge(review()).level).toBe('standard');
  expect(recommendedChallenge(review({ streak: 2 })).level).toBe('stretch');
  for (const support of [{ mistakes: 1 }, { hints: 1 }, { confidence: 'Still learning' }])
    expect(recommendedChallenge(review({ streak: 4, ...support })).level).toBe('guided');

  const result = { id: 'equation', mistakes: 0, hints: 0, firstTry: 0, total: 1, guided: true };
  let history = scheduleReview(undefined, result, 'It clicked!', '2026-10-01');
  expect(history.streak).toBe(0);
  expect(history.interval).toBe(1);
  expect(skillStage(history, true).label).toBe('Building');
  expect(recommendedChallenge(history).level).toBe('standard');
  history = scheduleReview(
    history,
    { ...result, guided: false, firstTry: 1 },
    'It clicked!',
    '2026-10-02',
  );
  expect(history.streak).toBe(1);
  for (let i = 0; i < 4; i++)
    history = scheduleReview(
      history,
      { ...result, guided: false, firstTry: 1 },
      'It clicked!',
      '2026-10-02',
    );
  expect(recommendedChallenge(history).level).toBe('standard');
  history = scheduleReview(
    history,
    { ...result, guided: false, firstTry: 1 },
    'It clicked!',
    '2026-10-05',
  );
  expect(recommendedChallenge(history).level).toBe('stretch');
  expect(practiceTopics({}, today, [], ids)).toEqual(['equation']);
  expect(
    practiceTopics(
      { equation: review({ guided: true, due: '2099-01-01', streak: 0 }) },
      today,
      ['equation'],
      ids,
    ),
  ).toEqual(['equation']);
  expect(
    practiceTopics({ equation: review({ due: '2099-01-01' }) }, today, ['equation'], ids),
  ).toEqual(['debit']);
  const histories = { equation: review({ streak: 3 }), ratios: review({ mistakes: 2, streak: 0 }) };
  expect(practiceTopics(histories, today, Object.keys(histories), ids)[0]).toBe('ratios');
  const daily = dailyTasks(today, histories);
  expect(daily.entryId).toBe('ratios');
  expect(daily.challenge.level).toBe('guided');
});

test('all topics have deterministic guided and transfer questions with independently checked accounting answers', () => {
  const fixtures: Record<string, { guided: string[]; stretch: string[] }> = {
    equation: { guided: ['95'], stretch: ['75'] },
    debit: { guided: ['equipment'], stretch: ['equipment', '135', '305'] },
    statements: { guided: ['305'], stretch: ['258'] },
    bakery: { guided: ['305'], stretch: ['258'] },
    accruals: { guided: ['September'], stretch: ['505'] },
    inventory: { guided: ['44'], stretch: ['62'] },
    depreciation: { guided: ['170'], stretch: ['425'] },
    ratios: { guided: ['2'], stretch: ['340'] },
    budgeting: { guided: ['27'], stretch: ['37'] },
    breakeven: { guided: ['4'], stretch: ['112'] },
    deferrals: { guided: ['170'], stretch: ['510'] },
    consolidation: { guided: ['625'], stretch: ['85'] },
    'journal-lab': { guided: ['loan'], stretch: ['deferred revenue', 'revenue', '170'] },
    'spot-the-slip': { guided: ['equipment'], stretch: ['170', '340'] },
    cashflow: { guided: ['operating'], stretch: ['170'] },
    recall: { guided: ['asset'], stretch: ['asset', 'liability'] },
  };
  for (const id of ids) {
    for (const level of ['guided', 'stretch'] as const)
      expect(
        practiceEntry(id, 7, level).answers.map((a) => a[0]),
        `${id} ${level}`,
      ).toEqual(fixtures[id][level]);
    for (const level of challengeLevels) {
      expect(practiceEntry(id, 0, level).prompt).not.toBe(practiceEntry(id, 1, level).prompt);
      for (let attempt = 0; attempt < 24; attempt++) {
        const entry = practiceEntry(id, attempt, level);
        expect(practiceEntry(id, attempt, level)).toEqual(entry);
        expect(entry.labels.length).toBe(entry.answers.length);
        expect(entry.explanation && entry.tip && entry.prompt).toBeTruthy();
        entry.answers.forEach((a) =>
          expect(a.length && a.every((v) => v && accepts(v, a))).toBeTruthy(),
        );
      }
    }
    expect(practiceEntry(id, 7, 'stretch').prompt).not.toBe(practiceEntry(id, 7).prompt);
  }
});

test('adaptive drafts and question cursors round-trip through backups, reject invalid plans, and accept legacy sessions', () => {
  const draft: LessonDraft = {
    lessonId: 'review',
    reviewIds: ['equation'],
    day: today,
    attempt: 1,
    reviewAttempts: { equation: 1 },
    intro: false,
    step: 1,
    reflect: false,
    confidence: 'Still learning',
    note: '',
    results: { 0: { mistakes: 1, hints: 0 } },
    reviewPlan: [
      { id: 'equation', attempt: 1, level: 'standard' },
      { id: 'equation', attempt: 2, level: 'guided', followUp: true },
    ],
  };
  const progress = {
    ...initialProgress,
    draft,
    reviews: { equation: review({ guided: true, nextQuestion: 3 }) },
  };
  const restored = readBackup(JSON.stringify({ version: 2, progress }));
  expect(restored.draft).toEqual(draft);
  expect(restored.reviews.equation).toMatchObject({ guided: true, nextQuestion: 3 });
  const old = { ...draft, reviewPlan: undefined, step: 0 };
  expect(readDraft(old, ids)?.reviewPlan).toBeUndefined();
  expect(readDraft(old, ids)?.attempt).toBe(1);
  const first = draft.reviewPlan![0],
    extra = draft.reviewPlan![1];
  for (const plan of [
    [],
    [{ ...first, id: 'unknown' }],
    [{ ...first, level: 'expert' }],
    [{ ...first, attempt: -1 }],
    [extra, first],
    [first, { ...extra, attempt: 8 }],
    [first, extra, extra],
    [first, { ...extra, id: 'debit' }],
  ])
    expect(readDraft({ ...draft, reviewPlan: plan }, ids)).toBeNull();
  expect(
    readDraft(
      {
        ...draft,
        lessonId: 'daily',
        reviewPlan: undefined,
        dailyChallenge: { ...first, level: 'expert' },
      },
      ids,
    ),
  ).toBeNull();
  expect(
    readProgress(
      JSON.stringify({ ...progress, reviews: { equation: review({ nextQuestion: -10 }) } }),
    ).reviews.equation.nextQuestion,
  ).toBeUndefined();
  const outcome = scheduleReview(
    review({ nextQuestion: 2 }),
    { id: 'equation', mistakes: 0, hints: 0, firstTry: 2, total: 2, nextQuestion: 4 },
    'Getting there',
    today,
  );
  expect(outcome.attempts).toBe(2);
  expect(outcome.nextQuestion).toBe(4);
});

async function seed(page: Page, updates: Partial<Progress> = {}) {
  await page.addInitScript(
    (progress) => {
      if (!localStorage.getItem('tally-progress-v1'))
        localStorage.setItem('tally-progress-v1', JSON.stringify(progress));
    },
    { ...initialProgress, onboarded: true, ...updates },
  );
  await page.goto('/');
}
async function saved(page: Page): Promise<Progress> {
  return page.evaluate(() => JSON.parse(localStorage.getItem('tally-progress-v1') || '{}'));
}
async function answer(
  page: Page,
  id: string,
  attempt: number,
  level: ChallengeLevel,
  advance = true,
) {
  const entry = practiceEntry(id, attempt, level);
  await expect(page.locator('.entry-question')).toHaveText(entry.prompt);
  for (let i = 0; i < entry.labels.length; i++)
    await page.getByLabel(entry.labels[i], { exact: true }).fill(entry.answers[i][0]);
  await page.getByRole('button', { name: 'Check my answer', exact: true }).click();
  if (advance) await page.getByRole('button', { name: 'Continue', exact: true }).click();
}

test('a retry inserts one guided follow-up, resumes the same question, and awards XP once per concept', async ({
  page,
}) => {
  await seed(page, { completed: ['equation'], reviews: { equation: review() } });
  await page.getByRole('button', { name: 'Review this concept', exact: true }).click();
  await page.getByLabel('Owner’s equity (R)').fill('0');
  await page.getByRole('button', { name: 'Check my answer' }).click();
  await answer(page, 'equation', 1, 'standard');
  await expect(page.getByRole('note', { name: 'Why this challenge' })).toContainText(
    'Guided practice',
  );
  await expect.poll(async () => (await saved(page)).draft?.step).toBe(1);
  await page.reload();
  await page.getByRole('button', { name: 'Resume learning' }).click();
  await expect(page.locator('.entry-question')).toHaveText(
    practiceEntry('equation', 2, 'guided').prompt,
  );
  await answer(page, 'equation', 2, 'guided', false);
  await page.getByRole('button', { name: 'Continue', exact: true }).evaluate((button) => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });
  await expect(page.locator('.earned-xp')).toContainText('+10');
  const p = await saved(page);
  expect(p.xp).toBe(10);
  expect(p.draft).toBeNull();
  expect(p.reviews.equation).toMatchObject({
    mistakes: 1,
    guided: true,
    streak: 0,
    total: 3,
    nextQuestion: 3,
  });
  await page.reload();
  expect((await saved(page)).xp).toBe(10);
  await page.getByRole('button', { name: 'Review this concept', exact: true }).click();
  await expect(page.locator('.entry-question')).toHaveText(
    practiceEntry('equation', 3, 'guided').prompt,
  );
});

test('learner choices select a fresh harder problem; low confidence brings guidance back, with accessible controls', async ({
  page,
}) => {
  test.setTimeout(120000);
  await seed(page, { completed: ['equation'], reviews: { equation: review() } });
  await page.getByRole('button', { name: 'Review this concept', exact: true }).click();
  await answer(page, 'equation', 1, 'standard', false);
  await page.getByRole('button', { name: 'Try a harder question' }).focus();
  await page.keyboard.press('Enter');
  await expect.poll(async () => (await saved(page)).draft?.reviewPlan?.[1]?.level).toBe('stretch');
  for (const theme of ['light', 'dark']) {
    await page.evaluate((t) => (document.documentElement.dataset.theme = t), theme);
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(
      result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  }
  await page.reload();
  await page.getByRole('button', { name: 'Resume learning' }).click();
  await answer(page, 'equation', 1, 'standard');
  await expect(page.getByRole('note', { name: 'Why this challenge' })).toContainText(
    'Stretch challenge',
  );
  await answer(page, 'equation', 2, 'stretch', false);
  await page.getByRole('button', { name: 'Still learning', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.earned-xp')).toContainText('+10');
  expect((await saved(page)).reviews.equation).toMatchObject({
    confidence: 'Still learning',
    interval: 1,
    nextQuestion: 3,
  });
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Review this concept', exact: true }).click();
  await expect(page.getByRole('note', { name: 'Why this challenge' })).toContainText(
    'Guided practice',
  );
});

test('a new learner moves from guided work to independent practice without XP implying skill', async ({
  page,
}) => {
  await seed(page, { xp: 2000 });
  await page.getByRole('button', { name: 'Start guided practice', exact: true }).click();
  await answer(page, 'equation', 0, 'guided');
  expect((await saved(page)).reviews.equation).toMatchObject({
    guided: true,
    firstTry: 0,
    streak: 0,
    interval: 1,
  });
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Review this concept', exact: true }).click();
  await answer(page, 'equation', 1, 'standard');
  await expect(page.locator('.earned-xp')).toContainText('+10');
  const p = await saved(page);
  expect(p.reviews.equation).toMatchObject({
    firstTry: 1,
    streak: 0,
    interval: 1,
    nextQuestion: 2,
  });
  expect(p.reviews.equation.guided).toBeUndefined();
  expect(p.xp).toBe(2020);
});

test('the daily mix targets weak topics and freezes its question across reloads and changed history', async ({
  page,
}) => {
  const histories = { equation: review({ streak: 3 }), ratios: review({ mistakes: 2, streak: 0 }) };
  await seed(page, { completed: ['equation', 'ratios'], reviews: histories });
  const data = dailyTasks(today, histories);
  await page.getByRole('button', { name: 'Start daily mix', exact: true }).click();
  for (const item of data.sort) {
    await page.getByRole('button', { name: item.category, exact: true }).click();
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
  }
  await expect(page.locator('.entry-question')).toHaveText(data.entry.prompt);
  await expect.poll(async () => (await saved(page)).draft?.dailyChallenge?.id).toBe('ratios');
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('tally-progress-v1')!);
    p.reviews.ratios = { ...p.reviews.ratios, mistakes: 0, streak: 3 };
    localStorage.setItem('tally-progress-v1', JSON.stringify(p));
  });
  await page.reload();
  await page.getByRole('button', { name: 'Resume learning' }).click();
  await expect(page.locator('.entry-question')).toHaveText(data.entry.prompt);
  await expect(page.getByRole('note', { name: 'Why this challenge' })).toContainText(
    'Guided practice',
  );
});

test('a multi-part stretch problem checks every field and returns to guidance after a mistake', async ({
  page,
}) => {
  await seed(page, { completed: ['debit'], reviews: { debit: review({ streak: 2 }) } });
  await page.getByRole('button', { name: 'Review this concept', exact: true }).click();
  const entry = practiceEntry('debit', 1, 'stretch');
  await expect(page.locator('.entry-question')).toHaveText(entry.prompt);
  await page.getByLabel('Debit account', { exact: true }).fill('Equipment');
  await page.getByLabel('Debit account', { exact: true }).press('Enter');
  await expect(page.getByLabel('Cash credit (R)', { exact: true })).toBeFocused();
  await page.getByLabel('Cash credit (R)', { exact: true }).fill('0');
  await page.getByLabel('Cash credit (R)', { exact: true }).press('Enter');
  await expect(page.getByLabel('Trade payables credit (R)', { exact: true })).toBeFocused();
  await page.getByLabel('Trade payables credit (R)', { exact: true }).fill(entry.answers[2][0]);
  await page.getByRole('button', { name: 'Check my answer' }).click();
  await expect(page.getByText('Let’s think it through', { exact: true })).toBeVisible();
  await page.getByLabel('Cash credit (R)', { exact: true }).fill(entry.answers[1][0]);
  await page.getByRole('button', { name: 'Check my answer' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await answer(page, 'debit', 2, 'guided');
  await expect(page.locator('.earned-xp')).toContainText('+10');
  expect((await saved(page)).reviews.debit).toMatchObject({
    mistakes: 1,
    guided: true,
    firstTry: 1,
    total: 3,
  });
});
