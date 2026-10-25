import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { initialProgress, lessons, localDay, readProgress, type Progress } from '../lib/learning';
import {
  initialTutor,
  readTutor,
  personalChallenge,
  explanationFor,
  tutorPlan,
  type TutorProfile,
} from '../lib/personalisation';
import { readBackup } from '../lib/backup';
import { readDraft } from '../lib/session';
import { portable, keepDevicePreferences } from '../lib/vault';
import { practiceEntry } from '../lib/questions';
import { scheduleReview, type Review } from '../lib/reviews';
const ids = lessons.map((l) => l.id);
const day = localDay();
const evidence = (updates: Partial<Review> = {}): Review => ({
  due: day,
  confidence: 'Getting there',
  mistakes: 0,
  hints: 0,
  streak: 1,
  interval: 3,
  attempts: 1,
  firstTry: 1,
  total: 1,
  lastReviewed: day,
  ...updates,
});
const fit = (updates: Partial<TutorProfile> = {}): TutorProfile => ({
  ...initialTutor,
  ...updates,
});
const saved = (page: Page): Promise<Progress> =>
  page.evaluate(() => JSON.parse(localStorage.getItem('tally-progress-v1') || '{}'));
async function start(page: Page, updates: Partial<Progress> = {}, url = '/') {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(
    (p) => {
      if (!localStorage.getItem('tally-progress-v1'))
        localStorage.setItem('tally-progress-v1', JSON.stringify(p));
    },
    { ...initialProgress, name: 'Zola', onboarded: true, graphics: 'simple', ...updates },
  );
  await page.goto(url);
}
async function preferences(page: Page) {
  await page.getByRole('button', { name: 'Tune my learning', exact: true }).click();
}

test('learner preferences validate, migrate and travel through backups and sync without inventing ability scores', () => {
  const old = readProgress(JSON.stringify({ xp: 70, notes: { debit: 'My oven example' } }));
  expect(old.tutor).toEqual(initialTutor);
  expect(old.notes.debit).toBe('My oven example');
  expect(
    readTutor(
      {
        support: 'genius',
        explanation: 'visual-learner',
        session: 99,
        iq: 160,
        formats: { unknown: 'deeper', debit: 'example' },
        startingPoint: {
          answers: { equation: 'ready', debit: 'unsupported', unknown: 'ready' },
          day,
        },
      },
      ids,
    ),
  ).toEqual({
    ...initialTutor,
    formats: { debit: 'example' },
    startingPoint: { answers: { equation: 'ready' } },
  });
  const tutor = fit({
    support: 'guided',
    explanation: 'example',
    session: 'one',
    formats: { debit: 'deeper', repair: 'example' },
    startingPoint: { answers: { equation: 'ready', debit: 'support', statements: 'ready' }, day },
  });
  const p = { ...initialProgress, xp: 70, tutor, notes: { debit: 'My own wording' } };
  const restored = readBackup(JSON.stringify({ version: 2, progress: p }));
  expect(restored.tutor).toEqual(tutor);
  expect(restored.notes.debit).toBe('My own wording');
  expect(portable(p).tutor).toEqual(tutor);
  expect(keepDevicePreferences({ ...initialProgress, theme: 'dark' }, p)).toMatchObject({
    tutor,
    theme: 'dark',
  });
  const draft = {
    lessonId: 'debit',
    reviewIds: [],
    day,
    attempt: 2,
    reviewAttempts: {},
    intro: false,
    step: 0,
    reflect: false,
    confidence: 'Getting there',
    note: 'Keep me',
    results: {},
    lessonChallenge: { id: 'debit', level: 'guided', attempt: 2 },
  };
  expect(readDraft(draft, ids)?.lessonChallenge).toEqual(draft.lessonChallenge);
  expect(
    readDraft({ ...draft, lessonChallenge: { ...draft.lessonChallenge, id: 'ratios' } }, ids),
  ).toBeNull();
  expect(
    readDraft({ ...draft, lessonChallenge: { ...draft.lessonChallenge, level: 'expert' } }, ids),
  ).toBeNull();
  expect(readDraft({ ...draft, lessonChallenge: undefined }, ids)?.lessonChallenge).toBeUndefined();
});

test('tutoring uses topic-specific recall, reasoning and explicit choices; check-ins never establish mastery', () => {
  const baseline = fit({
    startingPoint: { answers: { equation: 'ready', debit: 'support', statements: 'ready' }, day },
  });
  expect(personalChallenge('equation', undefined, baseline).level).toBe('standard');
  expect(personalChallenge('debit', undefined, baseline).level).toBe('guided');
  expect(personalChallenge('debit', evidence({ streak: 3 }), baseline).level).toBe('stretch');
  for (const help of [{ mistakes: 2 }, { hints: 2 }, { confidence: 'Still learning' }])
    expect(personalChallenge('equation', evidence({ streak: 4, ...help }), baseline).level).toBe(
      'guided',
    );
  expect(
    personalChallenge('ratios', evidence({ streak: 3 }), initialTutor, {
      tries: 2,
      explained: 0,
      misconception: 'Revenue is not profit.',
      note: 'I took a long time',
    }).level,
  ).toBe('guided');
  expect(
    personalChallenge('equation', evidence({ streak: 3 }), fit({ support: 'guided' })).level,
  ).toBe('guided');
  expect(
    personalChallenge('equation', evidence({ mistakes: 2 }), fit({ support: 'independent' })).level,
  ).toBe('standard');
  expect(explanationFor('debit', initialTutor, evidence({ mistakes: 2 }))).toBe('example');
  expect(explanationFor('ratios', initialTutor, evidence({ streak: 3 }))).toBe('deeper');
  expect(
    explanationFor('ratios', fit({ formats: { ratios: 'simple' } }), evidence({ streak: 3 })),
  ).toBe('simple');
  expect(
    scheduleReview(
      undefined,
      { id: 'equation', mistakes: 0, hints: 0, firstTry: 0, total: 1, guided: true },
      'It clicked!',
      day,
    ).streak,
  ).toBe(0);
});

test('plans repair demonstrated prerequisite gaps and adapt practice size while leaving exploration open', () => {
  const reviews = {
    ratios: evidence({ mistakes: 3 }),
    equation: evidence({ mistakes: 2, due: '2099-01-01' }),
  };
  expect(tutorPlan(reviews, day, ['ratios', 'equation'], ids, initialTutor, 5)).toMatchObject({
    topics: ['equation'],
    repair: 'equation',
  });
  expect(
    tutorPlan(reviews, day, ['ratios', 'equation'], ids, fit({ session: 'two' }), 5).topics,
  ).toEqual(['equation', 'ratios']);
  expect(
    tutorPlan({ ratios: reviews.ratios }, day, ['ratios'], ids, initialTutor, 5),
  ).toMatchObject({ topics: ['ratios'], repair: undefined });
  const clean = { equation: evidence(), debit: evidence() };
  expect(tutorPlan(clean, day, ['equation', 'debit'], ids, initialTutor, 3).topics).toHaveLength(1);
  expect(
    tutorPlan(clean, day, ['equation', 'debit'], ids, fit({ session: 'two' }), 3).topics,
  ).toHaveLength(2);
  const coaching = {
    statements: { tries: 2, explained: 0, misconception: 'Revenue is not profit.', note: '' },
  };
  expect(
    tutorPlan(clean, day, ['equation', 'debit'], ids, initialTutor, 5, coaching).topics,
  ).toEqual(['statements']);
});

test('optional starting-point check resumes and changes guidance without XP or lesson completion', async ({
  page,
}) => {
  await start(page, { xp: 85, notes: { debit: 'Keep my note' } });
  await preferences(page);
  await page.getByRole('button', { name: 'Try it', exact: true }).click();
  await page.getByRole('button', { name: 'R300', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('You made the connection.');
  await page.getByRole('button', { name: 'Next idea', exact: true }).click();
  await page.reload();
  await preferences(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Follow the value.', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Not sure yet — show me', exact: true }).click();
  await page.getByRole('button', { name: 'Next idea', exact: true }).click();
  await page.getByRole('button', { name: 'R200', exact: true }).click();
  await page.getByRole('button', { name: 'See my starting point', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'A little more you.', exact: true }),
  ).toBeFocused();
  const p = await saved(page);
  expect(p).toMatchObject({
    xp: 85,
    completed: [],
    reviews: {},
    notes: { debit: 'Keep my note' },
    tutor: {
      startingPoint: { day, answers: { equation: 'ready', debit: 'support', statements: 'ready' } },
    },
  });
  await page.getByRole('button', { name: 'Back to my preferences', exact: true }).click();
  await page.getByRole('button', { name: 'That feels like me', exact: true }).click();
  await page.getByRole('button', { name: 'Start my practice', exact: true }).click();
  await expect(page.locator('.entry-question')).toHaveText(
    practiceEntry('equation', 0, 'standard').prompt,
  );
});

test('guidance and explanation preferences apply to ordinary lessons and preserve a saved question after changing preferences', async ({
  page,
}) => {
  await start(page);
  await preferences(page);
  await page
    .getByRole('combobox', { name: 'How much guidance?', exact: true })
    .selectOption('guided');
  await page
    .getByRole('combobox', { name: 'Explain new ideas with', exact: true })
    .selectOption('deeper');
  await page.getByRole('button', { name: 'That feels like me', exact: true }).click();
  await page.goto('/?lesson=debit');
  await page.getByText('Explain it my way', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Go deeper', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Example', exact: true }).click();
  await expect.poll(async () => (await saved(page)).tutor.formats.debit).toBe('example');
  await page.getByRole('button', { name: 'I’m ready to try', exact: true }).click();
  const guided = practiceEntry('debit', 0, 'guided');
  await expect(page.locator('.entry-question')).toHaveText(guided.prompt);
  await expect.poll(async () => (await saved(page)).draft?.lessonChallenge?.level).toBe('guided');
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.goto('/');
  await preferences(page);
  await page
    .getByRole('combobox', { name: 'How much guidance?', exact: true })
    .selectOption('independent');
  await page.getByRole('button', { name: 'That feels like me', exact: true }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Resume learning', exact: true }).click();
  await expect(page.locator('.entry-question')).toHaveText(guided.prompt);
  expect((await saved(page)).tutor).toMatchObject({
    support: 'independent',
    formats: { debit: 'example' },
  });
});

test('repeated difficulty offers a worked example and eases the next activity between steps', async ({
  page,
}) => {
  await start(page, {}, '/?lesson=equation');
  await page.getByRole('button', { name: 'I’m ready to try', exact: true }).click();
  for (let i = 0; i < 2; i++)
    await page.getByRole('button', { name: 'Liability', exact: true }).click();
  const support = page.getByRole('complementary', { name: 'A smaller step' });
  await expect(support).toBeVisible();
  await support.getByRole('button', { name: 'Show a worked example', exact: true }).click();
  await expect(support).toContainText('Borrow R100');
  await page.getByRole('button', { name: 'Asset', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Liability', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Equity', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  const guided = practiceEntry('equation', 0, 'guided');
  await expect(page.locator('.entry-question')).toHaveText(guided.prompt);
  await page.getByLabel(guided.labels[0], { exact: true }).fill(guided.answers[0][0]);
  await page.getByRole('button', { name: 'Check my answer', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Finish lesson', exact: true }).click();
  await expect(page.locator('.earned-xp')).toContainText('+60');
  expect((await saved(page)).reviews.equation).toMatchObject({
    guided: true,
    streak: 0,
    mistakes: 2,
    hints: 1,
  });
});

test('learning fit works in small themes and restores focus to Settings after a nested panel closes', async ({
  page,
}) => {
  await start(page, { theme: 'dark' });
  await page.getByRole('button', { name: 'Open settings', exact: true }).click();
  await page.getByRole('button', { name: /Personalise my tutor/ }).click();
  const panel = page.getByRole('dialog', { name: 'Your learning fit', exact: true });
  await page.setViewportSize({ width: 320, height: 480 });
  expect(await panel.evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
  expect(
    await page
      .getByRole('combobox', { name: 'How much guidance?' })
      .evaluate((e) => parseFloat(getComputedStyle(e).fontSize)),
  ).toBeGreaterThanOrEqual(16);
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  ).toEqual([]);
  await page.evaluate(() => (document.documentElement.dataset.theme = 'light'));
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  ).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Settings', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /Personalise my tutor/ })).toBeFocused();
});

test('an experienced learner gets a stretch lesson while a legacy unfinished question stays unchanged', async ({
  page,
}) => {
  await start(
    page,
    { completed: ['ratios'], reviews: { ratios: evidence({ streak: 3, nextQuestion: 4 }) } },
    '/?lesson=ratios',
  );
  await page.getByText('Explain it my way', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'Go deeper', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'I’m ready to try', exact: true }).click();
  await expect(page.getByRole('note', { name: 'Why this challenge' })).toContainText(
    'Stretch challenge',
  );
  await expect(page.locator('.entry-question')).toHaveText(
    practiceEntry('ratios', 4, 'stretch').prompt,
  );
  await page.evaluate(
    ({ day }) => {
      const p = JSON.parse(localStorage.getItem('tally-progress-v1') || '{}');
      p.draft = {
        lessonId: 'ratios',
        reviewIds: [],
        day,
        attempt: 2,
        reviewAttempts: {},
        intro: false,
        step: 0,
        reflect: false,
        confidence: 'Getting there',
        note: 'Legacy thought',
        results: {},
      };
      localStorage.setItem('tally-progress-v1', JSON.stringify(p));
    },
    { day },
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Resume learning', exact: true }).click();
  await expect(page.locator('.entry-question')).toHaveText(
    practiceEntry('ratios', 2, 'standard').prompt,
  );
  expect((await saved(page)).draft?.note).toBe('Legacy thought');
});
