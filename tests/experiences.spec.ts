import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { initialProgress, readProgress } from '../lib/learning';
import {
  assets,
  decisions,
  openingBusiness,
  profit,
  readTransactions,
  replay,
  transact,
} from '../lib/business';
import { readBackup } from '../lib/backup';
import { projects } from '../lib/projects';
import { coachPlans } from '../lib/coaching';
import { lessons } from '../lib/learning';
async function start(page: Page, url = '/?tab=practice') {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(
    (p) => {
      HTMLCanvasElement.prototype.getContext = () => null;
      if (!localStorage.getItem('tally-progress-v1'))
        localStorage.setItem('tally-progress-v1', JSON.stringify(p));
    },
    { ...initialProgress, onboarded: true, name: 'Sam' },
  );
  await page.goto(url);
}
const saved = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('tally-progress-v1') || '{}'));
async function decision(page: Page, name: string, prediction: string) {
  await page.getByRole('button', { name, exact: false }).first().click();
  await page.getByRole('button', { name: prediction, exact: true }).click();
  await page.getByRole('button', { name: 'Try this decision' }).click();
}
test('shop decisions preserve the equation, separate cash/profit and reject impossible transactions', () => {
  const b = replay(['stock', 'credit-sale', 'collect', 'loan', 'oven', 'rent', 'wear']);
  expect(b).toMatchObject({
    cash: 1760,
    inventory: 80,
    receivables: 0,
    equipment: 600,
    loan: 500,
    revenue: 40,
    cost: 20,
    rent: 80,
    depreciation: 10,
  });
  expect(profit(b)).toBe(-70);
  expect(assets(b)).toBe(2430);
  expect(transact(openingBusiness, 'sale')).toBe(openingBusiness);
  expect(transact(openingBusiness, 'repay')).toBe(openingBusiness);
  expect(transact(openingBusiness, 'collect')).toBe(openingBusiness);
  let state = openingBusiness;
  for (let i = 0; i < 1200; i++) {
    state = transact(state, decisions[(i * 7 + Math.floor(i / 9)) % decisions.length].id);
    expect(assets(state)).toBe(state.loan + 2000 + profit(state));
    expect(
      Math.min(
        state.cash,
        state.inventory,
        state.receivables,
        state.loan,
        state.equipment - state.depreciation,
      ),
    ).toBeGreaterThanOrEqual(0);
  }
  expect(readTransactions(['sale', 'bad', 'stock', 'credit-sale', 'collect', 'collect'])).toEqual([
    'stock',
    'credit-sale',
    'collect',
  ]);
});
test('older progress migrates and backups retain the shop, cases and learner reflections', () => {
  expect(
    readProgress(JSON.stringify({ xp: 75, notes: { debit: 'My own example' } })),
  ).toMatchObject({
    xp: 75,
    notes: { debit: 'My own example' },
    experiences: { transactions: [], projects: {} },
  });
  const p = {
    ...initialProgress,
    experiences: {
      transactions: ['stock', 'sale'],
      awards: ['shop-stock'],
      projects: { reconcile: 2 },
      coaching: {
        debit: { tries: 2, explained: 1, misconception: '', note: 'An oven is still owned.' },
      },
    },
  };
  expect(readBackup(JSON.stringify({ version: 2, progress: p })).experiences).toEqual(
    p.experiences,
  );
  expect(
    readProgress(
      JSON.stringify({
        experiences: {
          transactions: ['loan'],
          projects: { reconcile: 999 },
          coaching: { debit: { tries: -2, note: 'x'.repeat(2000) } },
        },
      }),
    ).experiences,
  ).toMatchObject({
    transactions: ['loan'],
    projects: { reconcile: 3 },
    coaching: { debit: { tries: 0, note: 'x'.repeat(1000) } },
  });
  expect(Object.keys(coachPlans)).toEqual(expect.arrayContaining(lessons.map((l) => l.id)));
});
test('shop persists a credit sale, traces both journal entries, balances statements and limits XP repeats', async ({
  page,
}) => {
  await start(page);
  await page.getByRole('button', { name: /Big ideas. Little shop/ }).click();
  await expect(page.getByRole('button', { name: /Make a cash sale/ })).toBeDisabled();
  await decision(page, 'Stock the shelf', 'Profit stays the same');
  await decision(page, 'Let a customer pay later', 'Profit stays the same');
  await expect(page.locator('.shop-receipt')).toContainText('Cash stays still');
  await expect(page.locator('.shop-metrics')).toContainText('R1');
  const p = await saved(page);
  expect(p.experiences.transactions).toEqual(['stock', 'credit-sale']);
  expect(p.xp).toBe(10);
  await page.getByRole('button', { name: 'Journal', exact: true }).click();
  await expect(page.locator('.journal-receipt').first()).toContainText('Debit · Trade receivables');
  await expect(page.locator('.journal-receipt').first()).toContainText('Debit · Cost of sales');
  await page.getByRole('button', { name: 'Statements', exact: true }).click();
  await expect(page.locator('.balanced-note')).toContainText('R2');
  await page.reload();
  await page.getByRole('button', { name: /Big ideas. Little shop/ }).click();
  await expect(page.getByRole('button', { name: /Collect from a customer/ })).toBeEnabled();
  await page.getByRole('button', { name: 'Start a fresh shop', exact: true }).click();
  await page.getByRole('button', { name: 'Start fresh', exact: true }).click();
  await decision(page, 'Stock the shelf', 'Profit stays the same');
  expect((await saved(page)).xp).toBe(10);
  await expect(page.getByRole('button', { name: 'Inspect stock', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Inspect stock', exact: true }).click();
  await expect(page.locator('.inspection-note')).toContainText('5 items at R20');
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(accessibility.violations).toEqual([]);
});
test('every practical case saves its checkpoint and completes with explanatory feedback', async ({
  page,
}) => {
  await start(page);
  for (const project of projects) {
    await page.getByRole('button', { name: /Put the pieces together/ }).click();
    await page
      .getByRole('button', { name: new RegExp(project.name.replace(/[.?]/g, '\\$&')) })
      .click();
    for (let i = 0; i < 3; i++) {
      if (i === 1) {
        await page.getByRole('button', { name: 'Close', exact: true }).click();
        await page.reload();
        await page.getByRole('button', { name: /Put the pieces together/ }).click();
        await page
          .getByRole('button', { name: new RegExp(project.name.replace(/[.?]/g, '\\$&')) })
          .click();
      }
      await page
        .getByLabel(project.steps[i].label, { exact: true })
        .fill(project.steps[i].answers[0]);
      await page.getByRole('button', { name: 'Check my reasoning' }).click();
      await expect(page.locator('.answer-feedback')).toContainText(project.steps[i].explanation);
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
    }
    await expect(page.getByText('CASE CLOSED', { exact: true })).toBeVisible();
    expect((await saved(page)).experiences.projects[project.id]).toBe(3);
    await page.getByRole('button', { name: 'Close', exact: true }).click();
  }
  expect((await saved(page)).xp).toBe(90);
});
test('optional coaching gives worked examples and saves reasoning without awarding XP or grading prose', async ({
  page,
}) => {
  await start(page, '/?lesson=debit');
  await page.getByText('Explain it my way', { exact: true }).click();
  await page.getByRole('button', { name: 'Go deeper', exact: true }).click();
  await expect(page.locator('.coach-content').first()).toContainText('Balanced amounts alone');
  await page.getByText('Accounting wordbook', { exact: true }).click();
  await page.getByLabel('Choose a term').selectOption('Trade payables');
  await expect(page.locator('.glossary')).toContainText('creditors');
  await page.getByRole('button', { name: 'I’m ready to try' }).click();
  await page.getByLabel('Debit account', { exact: true }).fill('incorrect');
  await page.getByLabel('Credit account', { exact: true }).fill('cash');
  await page.getByRole('button', { name: 'Check my answer' }).click();
  await page.getByRole('button', { name: 'Walk me through it' }).click();
  await page.getByRole('button', { name: coachPlans.debit.trap, exact: true }).click();
  await expect(page.locator('.why-coach')).toContainText('A payment is not always an expense');
  await page.getByRole('button', { name: coachPlans.debit.right, exact: true }).click();
  await page
    .getByLabel('In your own words', { exact: false })
    .fill('Equipment stays useful after today.');
  await page.getByRole('button', { name: 'Save my thinking', exact: true }).click();
  const p = await saved(page);
  expect(p.experiences.coaching.debit).toMatchObject({
    tries: 2,
    explained: 1,
    note: 'Equipment stays useful after today.',
  });
  expect(p.xp).toBe(0);
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Me', exact: true }).click();
  await page
    .getByRole('region', { name: 'My thinking', exact: true })
    .getByText('Debit & Credit', { exact: true })
    .click();
  await expect(page.getByRole('region', { name: 'My thinking', exact: true })).toContainText(
    'Equipment stays useful after today.',
  );
});
