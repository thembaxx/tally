import { test, expect } from '@playwright/test';
import {
  accepts,
  initialProgress,
  lessons,
  localDay,
  previousDay,
  type Progress,
} from '../lib/learning';
import { money, learnerNumber, dateLabel, addDays, learningContext } from '../lib/south-africa';
import { practiceEntry } from '../lib/questions';
import { challengeLevels } from '../lib/challenge-questions';
import { scheduleReview } from '../lib/reviews';
import { readBackup } from '../lib/backup';

test.use({ reducedMotion: 'reduce' });

test('rand formatting and learner input support South African cents, grouping, and accounting names', () => {
  expect(money(1234)).toBe('R1\u00a0234');
  expect(money(1234.5)).toBe('R1\u00a0234,50');
  expect(money(-12.5)).toBe('-R12,50');
  for (const input of ['R1 234,50', 'R1234.50', 'ZAR 1 234.50', '1\u00a0234,50', 'R1,234.50']) {
    expect(learnerNumber(input), input).toBe(1234.5);
    expect(accepts(input, ['1234.5']), input).toBe(true);
  }
  expect(learnerNumber('-R1 234,50')).toBe(-1234.5);
  expect(learnerNumber('R0,50')).toBe(0.5);
  // Keep the older loose numeric input form readable without rewriting notes.
  expect(accepts('\u00241,200.00', ['1200'])).toBe(true);
  for (const invalid of ['', 'R', 'R1,2,3', '12 34', '1.234.50', 'R1,234,50', 'NaN', 'Infinity'])
    expect(learnerNumber(invalid), invalid).toBeNull();
  expect(accepts('3,0:1', ['3'])).toBe(true);
  expect(accepts('Debtors control', ['Trade receivables'])).toBe(true);
  expect(accepts('Creditors control account', ['Trade payables'])).toBe(true);
  expect(accepts('Accounts payable', ['Trade payables'])).toBe(true);
  expect(accepts('Cost of goods sold', ['Cost of sales'])).toBe(true);
  expect(accepts('Creditors', ['Loan payable'])).toBe(false);
  expect(accepts('Debtors', ['Trade payables'])).toBe(false);
  expect(accepts('', ['0'])).toBe(false);
});

test('SAST calendar boundaries and review arithmetic are independent of the device time zone', () => {
  expect(localDay(new Date('2026-10-24T21:59:59Z'))).toBe('2026-10-24');
  expect(localDay(new Date('2026-10-24T22:00:00Z'))).toBe('2026-10-25');
  expect(localDay(new Date('2026-12-31T22:00:00Z'))).toBe('2027-01-01');
  expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  expect(previousDay('2026-03-01')).toBe('2026-02-28');
  expect(dateLabel('2026-10-24')).toBe('24 Oct 2026');
  const next = scheduleReview(
    undefined,
    { id: 'equation', mistakes: 0, hints: 0, firstTry: 1, total: 1 },
    'Getting there',
    '2026-12-30',
  );
  expect(next.due).toBe('2027-01-02');
});

test('authored lessons and every adaptive question level use rand and local terminology', () => {
  expect(JSON.stringify(lessons)).not.toMatch(/\$\d|\(\$\)|\bfavorable\b|\brecognize\b/);
  expect(lessons.find((l) => l.id === 'equation')!.example).toContain('school tuck shop');
  expect(lessons.find((l) => l.id === 'statements')!.concept).toContain(
    'statement of profit or loss',
  );
  expect(practiceEntry('equation', 0).prompt).toContain('spaza shop');
  expect(practiceEntry('debit', 0).prompt).toContain('EFT');
  expect(accepts('Bank', practiceEntry('debit', 0).answers[1])).toBe(true);
  for (const lesson of lessons)
    for (const level of challengeLevels)
      for (const attempt of [0, 7, 23]) {
        const question = practiceEntry(lesson.id, attempt, level);
        expect(JSON.stringify(question)).not.toMatch(/\$\d|\(\$\)|\bfavorable\b|\brecognize\b/);
      }
});

test('older backups preserve written notes, dates, lesson IDs, XP, and unfinished question plans', () => {
  const oldNote = 'My original note: \u00241,200 in cash.';
  const draft = {
    lessonId: 'review',
    reviewIds: ['equation'],
    day: '2026-10-24',
    attempt: 7,
    reviewAttempts: { equation: 7 },
    intro: false,
    step: 0,
    reflect: false,
    confidence: 'Getting there',
    note: '',
    results: {},
    reviewPlan: [{ id: 'equation', attempt: 7, level: 'standard' }],
  };
  const restored = readBackup(
    JSON.stringify({
      version: 2,
      progress: {
        ...initialProgress,
        xp: 120,
        completed: ['equation'],
        notes: { equation: oldNote },
        activity: { '2026-10-24': 5 },
        draft,
      },
    }),
  );
  expect(restored.notes.equation).toBe(oldNote);
  expect(restored.xp).toBe(120);
  expect(restored.completed).toEqual(['equation']);
  expect(restored.activity).toEqual({ '2026-10-24': 5 });
  expect(restored.draft).toEqual(draft);
  expect(practiceEntry('equation', restored.draft!.attempt).answers[0][0]).toBe('830');
});

test('journal totals and validation agree on rand inputs, with local creditor terminology', async ({
  page,
}) => {
  await page.addInitScript((p) => localStorage.setItem('tally-progress-v1', JSON.stringify(p)), {
    ...initialProgress,
    onboarded: true,
  });
  await page.goto('/?lesson=journal-lab');
  await page.getByRole('button', { name: 'I’m ready to try' }).click();
  await expect(page.getByText(learningContext, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Equipment', exact: true }).click();
  await page.getByRole('button', { name: 'Place account on debit', exact: true }).click();
  await page.getByRole('button', { name: 'Cash', exact: true }).click();
  await page.getByRole('button', { name: 'Place account on credit', exact: true }).click();
  await page.getByLabel('Debit amount (R)', { exact: true }).fill('R500,00');
  await page.getByLabel('Credit amount (R)', { exact: true }).fill('ZAR 500.00');
  await expect(page.locator('.journal-total')).toContainText('DEBITS R500');
  await expect(page.locator('.journal-total')).toContainText('CREDITS R500');
  await page.getByRole('button', { name: 'Check my entry' }).click();
  await expect(page.getByText('That’s it!', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Trade payables', exact: true })).toBeVisible();
});

test('an overseas browser records learning against the South African day after midnight SAST', async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    baseURL,
    timezoneId: 'America/Los_Angeles',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.clock.install({ time: new Date('2026-10-24T22:30:00Z') });
  await page.addInitScript(
    (p) => {
      if (!localStorage.getItem('tally-progress-v1'))
        localStorage.setItem('tally-progress-v1', JSON.stringify(p));
    },
    { ...initialProgress, onboarded: true, theme: 'light' },
  );
  await page.goto('/');
  await expect(page.locator('.date-display')).toContainText('25 Oct 2026');
  await page.getByRole('button', { name: 'Start guided practice', exact: true }).click();
  await page.getByLabel('Owner’s equity (R)', { exact: true }).fill('ZAR 60,00');
  await page.getByRole('button', { name: 'Check my answer' }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('.earned-xp')).toContainText('+10');
  const p: Progress = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('tally-progress-v1')!),
  );
  expect(Object.keys(p.activity)).toEqual(['2026-10-25']);
  expect(p.reviews.equation.due).toBe('2026-10-26');
  await context.close();
});

test('public guides and app metadata declare the South African locale, currency, and VAT assumption', async ({
  page,
  request,
}) => {
  await page.goto('/learn/statements');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en-ZA');
  await expect(page.locator('h1')).toContainText('statement of profit or loss');
  await expect(page.getByText(learningContext, { exact: true })).toBeVisible();
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'en_ZA');
  expect((await request.get('/manifest.webmanifest')).ok()).toBe(true);
  expect((await (await request.get('/manifest.webmanifest')).json()).lang).toBe('en-ZA');
  const home = await (await request.get('/')).text();
  expect(home).toContain('"priceCurrency":"ZAR"');
  expect(home).not.toContain('"priceCurrency":"USD"');
});
