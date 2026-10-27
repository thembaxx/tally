import { readTransferResults, transferCase, type TransferResult } from './transfer-assessment';
import { emptyExperiences, readExperiences, type Experiences } from './experiences';
import type { StudioActivity } from './activity-types';
import { studioLessons, cashFlowLesson } from './studio-lessons';
import { createBakeryLesson } from './bakery';
import { practiceEntry } from './questions';
import { readReviews, type Review } from './reviews';
import { readDraft, type LessonDraft } from './session';
import { practiceTopics, recommendedChallenge } from './adaptive';
import { accountName, addDays, learnerNumber, southAfricanDay } from './south-africa';
import { initialTutor, readTutor, type TutorProfile } from './personalisation';
export type Category = 'Asset' | 'Liability' | 'Equity';
export type SortItem = { name: string; category: Category; amount: number; explanation: string };
export type Entry = {
  prompt: string;
  labels: string[];
  answers: string[][];
  explanation: string;
  tip: string;
};
export type Lesson = {
  id: string;
  title: string;
  subtitle: string;
  color: string;
  icon: string;
  minutes: number;
  level: 'Foundations' | 'Next level' | 'Going deeper';
  concept: string;
  example: string;
  tip: string;
  entry: Entry;
  order: string[];
  orderTip: string;
  locked?: boolean;
  format?: 'recall' | 'journal' | 'detective' | 'story';
  activities?: StudioActivity[];
};
export const sortItems: SortItem[] = [
  {
    name: 'A laptop you own',
    category: 'Asset',
    amount: 1200,
    explanation: 'The laptop is something the business owns and uses. That makes it an asset.',
  },
  {
    name: 'A bank loan',
    category: 'Liability',
    amount: 800,
    explanation: 'A loan is money the business owes. Amounts owed are liabilities.',
  },
  {
    name: 'Your investment',
    category: 'Equity',
    amount: 400,
    explanation: 'Your investment is the owner’s share. R1 200 of assets = R800 owed + R400 owned.',
  },
];
export const lessons: Lesson[] = [
  {
    id: 'equation',
    title: 'The Equation',
    subtitle: 'Find your balance',
    color: 'peach',
    icon: 'scale',
    minutes: 4,
    level: 'Foundations',
    concept:
      'Everything a business owns has a source: it was borrowed or belongs to its owners. Assets = Liabilities + Equity.',
    example:
      'You open a school tuck shop with R40 of your own and borrow R60. Your R100 cash is an asset. The R60 loan is a liability. Your R40 is equity.',
    tip: 'Own it? Asset. Owe it? Liability. Your share? Equity.',
    entry: {
      prompt: 'Your school tuck shop has R100 in assets and owes R60. How much is your equity?',
      labels: ['Owner’s equity (R)'],
      answers: [['40']],
      explanation: 'Equity = Assets − Liabilities. R100 − R60 = R40 belongs to you.',
      tip: 'Start with what you own, then take away what you owe.',
    },
    order: ['Assets', 'Liabilities', 'Equity'],
    orderTip: 'Build the equation: first what you own, then what you owe, then your share.',
  },
  {
    id: 'debit',
    title: 'Debit & Credit',
    subtitle: 'Two sides. One story.',
    color: 'lavender',
    icon: 'arrows',
    minutes: 5,
    level: 'Foundations',
    concept:
      'Every transaction has at least two sides. Debits go on the left, credits on the right. Total debits always equal total credits. Amounts owed to suppliers are trade payables (creditors).',
    example:
      'Buy a R500 laptop with cash: debit Equipment R500 (an asset goes up), credit Cash R500 (an asset goes down). Debit doesn’t always mean “increase”: it depends on the account.',
    tip: 'Assets and expenses grow with debits. Liabilities, equity, and revenue grow with credits.',
    entry: {
      prompt: 'You buy a R500 laptop with business cash. Which accounts do you debit and credit?',
      labels: ['Debit account', 'Credit account'],
      answers: [
        ['equipment', 'laptop', 'computer', 'computer equipment', 'office equipment'],
        ['cash', 'bank', 'bank account', 'business cash'],
      ],
      explanation:
        'Debit Equipment: your equipment increases. Credit Cash: your cash decreases. The R500 entries balance.',
      tip: 'What came in? Equipment. What went out? Cash.',
    },
    order: [
      'Identify the transaction',
      'Choose the accounts',
      'Record debits and credits',
      'Check that both sides balance',
    ],
    orderTip: 'Follow the transaction from its story to a balanced journal entry.',
  },
  {
    id: 'statements',
    title: 'Statements',
    subtitle: 'See the bigger picture',
    color: 'mint',
    icon: 'chart',
    minutes: 5,
    level: 'Foundations',
    concept:
      'The statement of profit or loss tells the story of profit over a period. Revenue minus cost of sales gives gross profit. Subtract operating expenses to find operating profit.',
    example:
      'A bakery earns R1 000. Ingredients cost R400. Gross profit is R600. After R200 of rent and other operating expenses, operating profit is R400.',
    tip: 'Revenue is the whole pie. Profit is what you keep after costs.',
    entry: {
      prompt: 'Your bakery earns R1 000 in revenue. Cost of sales is R400. What is gross profit?',
      labels: ['Gross profit (R)'],
      answers: [['600']],
      explanation:
        'Gross profit = Revenue − Cost of sales. R1 000 − R400 = R600. Operating expenses come later.',
      tip: 'Gross profit comes before rent and other operating expenses.',
    },
    order: ['Revenue', 'Cost of sales', 'Gross profit', 'Operating expenses', 'Operating profit'],
    orderTip: 'Tell the profit story from money earned to money left.',
  },
  {
    id: 'accruals',
    title: 'Timing Matters',
    subtitle: 'Earned, even before paid',
    color: 'butter',
    icon: 'clock',
    minutes: 5,
    level: 'Next level',
    concept:
      'Accrual accounting records revenue when earned and expenses when incurred, even when cash moves on a different day. Money customers owe the business is recorded as trade receivables (debtors).',
    example:
      'You tutor a student in March and receive R80 in April. Under accrual accounting, March has R80 of revenue and R80 of trade receivables.',
    tip: 'Earned and received can happen on different days.',
    entry: {
      prompt:
        'You earn R80 for tutoring in March, but get paid in April. In which month do you record revenue under accrual accounting?',
      labels: ['Revenue month'],
      answers: [['march', 'mar']],
      explanation:
        'March. The service was delivered then. Trade receivables tracks the amount still owed to you.',
      tip: 'Ask when the work happened, not when cash arrived.',
    },
    order: [
      'Deliver the service',
      'Record revenue and receivable',
      'Receive payment',
      'Clear the receivable',
    ],
    orderTip: 'Follow an earned-but-unpaid sale through to collection.',
  },
  {
    id: 'inventory',
    title: 'Inventory Stories',
    subtitle: 'From shelf to sale',
    color: 'peach',
    icon: 'stack',
    minutes: 6,
    level: 'Next level',
    concept:
      'Inventory is an asset until it is sold. When sold, its cost becomes an expense called cost of sales. FIFO assumes the oldest units are sold first.',
    example:
      'Buy 10 notebooks at R2, then 10 at R3. Sell 10 using FIFO: cost of sales is R20, and the remaining inventory is R30.',
    tip: 'On the shelf: asset. Sold: expense.',
    entry: {
      prompt:
        'You buy 10 notebooks at R2, then 10 at R3. Sell the first 10 using FIFO. What is cost of sales?',
      labels: ['Cost of sales (R)'],
      answers: [['20']],
      explanation:
        'FIFO means first in, first out. The oldest 10 cost R2 each, so cost of sales is R20.',
      tip: 'FIFO starts with the oldest purchase.',
    },
    order: [
      'Purchase inventory',
      'Record an asset',
      'Sell the inventory',
      'Recognise cost of sales',
    ],
    orderTip: 'Track the cost as inventory becomes an expense.',
  },
  {
    id: 'depreciation',
    title: 'Depreciation',
    subtitle: 'Spread an asset’s cost over its useful life',
    color: 'lavender',
    icon: 'chart',
    minutes: 6,
    level: 'Next level',
    concept:
      'Depreciation spreads the cost of a long-lived asset over its useful life. Straight-line depreciation = (Cost − Residual value) ÷ Useful life.',
    example:
      'A R1 200 laptop with a R200 residual value lasts 5 years. Annual depreciation is (R1 200 − R200) ÷ 5 = R200.',
    tip: 'Depreciation allocates cost. It doesn’t measure today’s resale price.',
    entry: {
      prompt:
        'A laptop costs R1 200, has a R200 residual value, and lasts 5 years. What is annual straight-line depreciation?',
      labels: ['Annual depreciation (R)'],
      answers: [['200']],
      explanation:
        '(R1 200 − R200) ÷ 5 = R200 each year. Depreciation expense rises; accumulated depreciation reduces the asset’s carrying amount.',
      tip: 'Take away what will be left, then divide by the years.',
    },
    order: [
      'Find the purchase cost',
      'Subtract residual value',
      'Divide by useful life',
      'Record annual depreciation',
    ],
    orderTip: 'Build the straight-line calculation one step at a time.',
  },
  {
    id: 'ratios',
    title: 'Read Between the Numbers',
    subtitle: 'Turn statements into insight',
    color: 'mint',
    icon: 'chart',
    minutes: 6,
    level: 'Next level',
    concept:
      'Financial ratios put numbers in context. The current ratio compares current assets with current liabilities to help assess short-term liquidity.',
    example:
      'Current assets of R3 000 divided by current liabilities of R1 500 gives 2.0. There are R2 of current assets for each R1 due in the short term.',
    tip: 'A ratio is a clue, not a verdict. Industry and timing matter.',
    entry: {
      prompt:
        'Current assets are R3 000 and current liabilities are R1 500. What is the current ratio?',
      labels: ['Current ratio'],
      answers: [['2', '2.0', '2:1', '2.0:1']],
      explanation:
        'R3 000 ÷ R1 500 = 2.0. This suggests a short-term cushion, but inventory quality and payment timing still matter.',
      tip: 'Current assets ÷ current liabilities.',
    },
    order: [
      'Choose comparable statements',
      'Identify current assets',
      'Identify current liabilities',
      'Calculate and interpret the ratio',
    ],
    orderTip: 'Insight starts with comparable data and ends with context.',
  },
  {
    id: 'budgeting',
    title: 'Plan, Then Compare',
    subtitle: 'Give every number a purpose',
    color: 'butter',
    icon: 'stack',
    minutes: 6,
    level: 'Next level',
    concept:
      'A budget is a plan. A variance compares actual results with that plan. For an expense, spending less than planned is usually favourable.',
    example:
      'You budget R500 for supplies and spend R450. You are R50 under budget: a favourable expense variance. Check whether lower spending affected quality.',
    tip: 'A variance starts a conversation. Always ask why.',
    entry: {
      prompt:
        'You budget R500 for supplies and actually spend R450. How many rand under budget are you?',
      labels: ['Favourable variance (R)'],
      answers: [['50']],
      explanation:
        'R500 − R450 = R50 under budget. For an expense, this is favourable, assuming the business still got what it needed.',
      tip: 'Compare actual spending with the plan.',
    },
    order: [
      'Set a budget',
      'Record actual results',
      'Calculate the variance',
      'Investigate and adjust',
    ],
    orderTip: 'Budgeting is a learning loop, not just a prediction.',
  },
  {
    id: 'cashflow',
    title: 'Cash Flow',
    subtitle: 'Track cash entering and leaving a business',
    color: 'blue',
    icon: 'lock',
    minutes: 6,
    level: 'Next level',
    concept: '',
    example: '',
    tip: '',
    entry: { prompt: '', labels: [], answers: [], explanation: '', tip: '' },
    order: [],
    orderTip: '',
    locked: true,
  },
];
lessons.splice(
  8,
  0,
  {
    id: 'breakeven',
    title: 'The Break-even Point',
    subtitle: 'When every sale starts to count',
    color: 'butter',
    icon: 'chart',
    minutes: 7,
    level: 'Going deeper',
    concept:
      'Contribution margin is selling price minus variable cost. It helps cover fixed costs. Break-even units = Fixed costs ÷ Contribution margin per unit.',
    example:
      'A smoothie sells for R10 and costs R6 to make. Each sale contributes R4 toward R200 of fixed rent. Sell 50 smoothies to break even: R200 ÷ R4 = 50.',
    tip: 'First cover the cost of making one more unit. What remains pays for the business.',
    entry: {
      prompt:
        'A smoothie sells for R10, variable cost is R6, and fixed costs are R200. How many smoothies must you sell to break even?',
      labels: ['Break-even units'],
      answers: [['50']],
      explanation:
        'Each smoothie contributes R10 − R6 = R4. Divide R200 of fixed costs by R4: 50 smoothies. At 50 units, revenue and total costs are both R500.',
      tip: 'Fixed costs ÷ (price − variable cost).',
    },
    order: [
      'Find selling price per unit',
      'Subtract variable cost per unit',
      'Find total fixed costs',
      'Divide fixed costs by contribution margin',
    ],
    orderTip: 'Work out what each sale contributes before calculating how many sales you need.',
  },
  {
    id: 'deferrals',
    title: 'Cash Now, Revenue Later',
    subtitle: 'A promise on the statement of financial position',
    color: 'lavender',
    icon: 'clock',
    minutes: 7,
    level: 'Going deeper',
    concept:
      'A payment received before a service is delivered creates deferred revenue: a liability representing a promise to the customer. Revenue is recognised as the service is delivered.',
    example:
      'A customer pays R600 for six months of lessons. At first, debit Cash R600 and credit Deferred Revenue R600. Each month, debit Deferred Revenue R100 and credit Revenue R100.',
    tip: 'Cash received is not automatically revenue earned. Ask what you still owe the customer.',
    entry: {
      prompt:
        'A customer prepays R600 for six equal months of lessons. You deliver one month. How much revenue do you recognise now?',
      labels: ['Revenue earned this month (R)'],
      answers: [['100']],
      explanation:
        'R600 ÷ 6 = R100. Debit Deferred Revenue and credit Revenue by R100. The remaining R500 is still a liability until future lessons are delivered.',
      tip: 'Spread the prepayment across the equal months of service.',
    },
    order: [
      'Receive the customer prepayment',
      'Record cash and deferred revenue',
      'Deliver one month of service',
      'Reduce deferred revenue and recognise revenue',
    ],
    orderTip: 'Receiving cash creates a promise. Delivering service fulfills that promise.',
  },
  {
    id: 'consolidation',
    title: 'One Group, One Story',
    subtitle: 'See beyond the individual company',
    color: 'mint',
    icon: 'stack',
    minutes: 8,
    level: 'Going deeper',
    concept:
      'Consolidated statements show a parent and its controlled subsidiaries as one economic entity. Add their balances, then eliminate transactions and balances within the group to avoid counting internal activity.',
    example:
      'A parent reports R1 000 of sales, including R200 to its wholly owned subsidiary. The subsidiary reports R500 of sales to outside customers. Consolidated revenue is R1 000 + R500 − R200 = R1 300.',
    tip: 'The group cannot sell to itself. Only outside-customer sales count as group revenue.',
    entry: {
      prompt:
        'A parent has R1 000 of sales, including R200 to its subsidiary. The subsidiary has R500 of external sales. What is consolidated revenue?',
      labels: ['Consolidated revenue (R)'],
      answers: [['1300']],
      explanation:
        'Add R1 000 and R500, then eliminate the R200 internal sale: R1 300. This simplified exercise assumes full control and focuses only on revenue elimination.',
      tip: 'Add both companies, then remove the sale inside the group.',
    },
    order: [
      'Identify the controlled group',
      'Combine company balances',
      'Eliminate internal transactions',
      'Present consolidated statements',
    ],
    orderTip:
      'Define the group before combining it. Internal activity is eliminated before presenting one set of statements.',
  },
);
lessons[lessons.findIndex((l) => l.id === 'cashflow')] = cashFlowLesson;
lessons.splice(lessons.length - 1, 0, ...studioLessons);
lessons.push(createBakeryLesson());
export function localDay(date = new Date()) {
  return southAfricanDay(date);
}
export function previousDay(day: string) {
  return addDays(day, -1);
}
export function dailyIndex(day: string) {
  return [...day].reduce((n, c) => n * 31 + c.charCodeAt(0), 0) >>> 0;
}
export function dailyTasks(day: string, reviews?: Record<string, Review>) {
  const i = dailyIndex(day);
  const l = lessons[1 + (i % 7)];
  const sets: SortItem[][] = [
    sortItems,
    [
      {
        name: 'Cash in your till',
        category: 'Asset',
        amount: 900,
        explanation: 'Cash belongs to the business: it is an asset.',
      },
      {
        name: 'An unpaid supplier bill',
        category: 'Liability',
        amount: 500,
        explanation: 'The business owes its supplier, so the bill is a liability.',
      },
      {
        name: 'Owner’s savings invested',
        category: 'Equity',
        amount: 400,
        explanation: 'Money invested by the owner is equity. R900 = R500 + R400.',
      },
    ],
    [
      {
        name: 'Your delivery bicycle',
        category: 'Asset',
        amount: 600,
        explanation: 'A bicycle used by the business is an asset.',
      },
      {
        name: 'Money owed to the bank',
        category: 'Liability',
        amount: 200,
        explanation: 'The bank must be repaid: that is a liability.',
      },
      {
        name: 'The owner’s share',
        category: 'Equity',
        amount: 400,
        explanation: 'Equity is the owner’s residual share. R600 = R200 + R400.',
      },
    ],
  ];
  const entryId = reviews
    ? practiceTopics(
        reviews,
        day,
        Object.keys(reviews),
        lessons.filter((l) => !l.locked).map((l) => l.id),
      )[0] || l.id
    : l.id;
  const challenge = {
    id: entryId,
    attempt: (i + (reviews?.[entryId]?.nextQuestion ?? reviews?.[entryId]?.attempts ?? 0)) % 24,
    level: reviews ? recommendedChallenge(reviews[entryId]).level : ('standard' as const),
  };
  return {
    sort: sets[i % sets.length],
    entry: practiceEntry(challenge.id, challenge.attempt, challenge.level),
    entryId,
    challenge,
    orderId: lessons[i % 3].id,
    order: lessons[i % 3].order,
    orderTip: lessons[i % 3].orderTip,
  };
}
export function accepts(value: string, answers: string[]) {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[’‘]/g, "'")
      .replace(/[.!?]+$/, '');
  const v = clean(value);
  const numeric = (s: string) => learnerNumber(s.match(/^(.+)\s*:\s*1$/)?.[1] || s);
  const n = numeric(v);
  return answers.some(
    (a) => accountName(clean(a)) === accountName(v) || (n !== null && n === numeric(clean(a))),
  );
}
export const STORAGE_KEY = 'tally-progress-v1';
export type TransferDraft = {
  answers: Record<string, string>;
  hints: Record<string, number>;
  seenSolutions: boolean;
};

/** Restore only this authored case's fields, retaining exposure to worked solutions. */
export function readTransferDraft(value: unknown, solutionsAlreadySeen = false): TransferDraft {
  const empty = { answers: {}, hints: {}, seenSolutions: solutionsAlreadySeen };
  if (!value || typeof value !== 'object' || Array.isArray(value)) return empty;
  const raw = value as Record<string, unknown>;
  const answers =
    raw.answers && typeof raw.answers === 'object' && !Array.isArray(raw.answers)
      ? (raw.answers as Record<string, unknown>)
      : {};
  const hints =
    raw.hints && typeof raw.hints === 'object' && !Array.isArray(raw.hints)
      ? (raw.hints as Record<string, unknown>)
      : {};
  return {
    answers: Object.fromEntries(
      transferCase.questions.flatMap(({ id }) =>
        typeof answers[id] === 'string' ? [[id, answers[id].slice(0, 100)]] : [],
      ),
    ),
    hints: Object.fromEntries(
      transferCase.questions.flatMap(({ id }) => {
        const count = hints[id];
        return typeof count === 'number' && Number.isSafeInteger(count) && count > 0
          ? [[id, Math.min(100, count)]]
          : [];
      }),
    ),
    seenSolutions: solutionsAlreadySeen || raw.seenSolutions === true,
  };
}

export type Progress = {
  transferDraft: TransferDraft;
  transferResults: TransferResult[];
  name: string;
  onboarded: boolean;
  goal: number;
  xp: number;
  completed: string[];
  activity: Record<string, number>;
  dailyRuns: Record<string, number>;
  focusDays: string[];
  theme: 'system' | 'light' | 'dark';
  graphics: 'auto' | 'simple';
  haptics: boolean;
  sound: boolean;
  soundVolume: number;
  reviews: Record<string, Review>;
  notes: Record<string, string>;
  draft: LessonDraft | null;
  experiences: Experiences;
  tutor: TutorProfile;
};
export const initialProgress: Progress = {
  transferDraft: readTransferDraft(null),
  transferResults: [],
  name: '',
  onboarded: false,
  goal: 5,
  xp: 0,
  completed: [],
  activity: {},
  dailyRuns: {},
  focusDays: [],
  theme: 'system',
  graphics: 'auto',
  haptics: true,
  sound: false,
  soundVolume: 45,
  reviews: {},
  notes: {},
  draft: null,
  experiences: emptyExperiences,
  tutor: initialTutor,
};
export function readProgress(raw: string | null, legacyReviews?: string | null): Progress {
  try {
    const p = JSON.parse(raw || 'null');
    if (!p || typeof p !== 'object') return initialProgress;
    let reviewData = p.reviews;
    if (reviewData === undefined) {
      try {
        reviewData = JSON.parse(legacyReviews || '{}');
      } catch {
        reviewData = {};
      }
    }
    const transferResults = readTransferResults(p.transferResults);
    return {
      ...initialProgress,
      transferDraft: readTransferDraft(p.transferDraft, transferResults.length > 0),
      transferResults,
      experiences: readExperiences(p.experiences),
      tutor: readTutor(
        p.tutor,
        lessons.map((l) => l.id),
      ),
      name: typeof p.name === 'string' ? p.name.slice(0, 30) : '',
      onboarded: p.onboarded === true,
      goal: [3, 5, 10].includes(p.goal) ? p.goal : 5,
      xp: typeof p.xp === 'number' && Number.isFinite(p.xp) ? Math.max(0, p.xp) : 0,
      completed: Array.isArray(p.completed)
        ? [
            ...new Set<string>(
              p.completed.filter(
                (x: unknown) => typeof x === 'string' && lessons.some((l) => l.id === x),
              ),
            ),
          ]
        : [],
      activity: validRecord(p.activity),
      dailyRuns: validRecord(p.dailyRuns),
      focusDays: Array.isArray(p.focusDays)
        ? p.focusDays.filter((x: unknown) => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x))
        : [],
      theme: ['system', 'light', 'dark'].includes(p.theme) ? p.theme : 'system',
      graphics: p.graphics === 'simple' ? 'simple' : 'auto',
      haptics: p.haptics !== false,
      sound: p.sound === true,
      soundVolume:
        typeof p.soundVolume === 'number' && Number.isFinite(p.soundVolume)
          ? Math.round(Math.max(0, Math.min(100, p.soundVolume)))
          : 45,
      reviews: readReviews(
        reviewData,
        lessons.map((l) => l.id),
      ),
      notes:
        p.notes && typeof p.notes === 'object' && !Array.isArray(p.notes)
          ? Object.fromEntries(
              Object.entries(p.notes)
                .filter(
                  ([id, value]) => lessons.some((l) => l.id === id) && typeof value === 'string',
                )
                .map(([id, value]) => [id, (value as string).slice(0, 2000)]),
            )
          : {},
      draft: readDraft(
        p.draft,
        lessons.map((l) => l.id),
      ),
    };
  } catch {
    return initialProgress;
  }
}
function validRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      ([k, v]) =>
        /^\d{4}-\d{2}-\d{2}$/.test(k) && typeof v === 'number' && Number.isFinite(v) && v >= 0,
    ),
  );
}
export function streak(activity: Record<string, number>, today: string) {
  let d = activity[today] ? today : previousDay(today),
    count = 0;
  while (activity[d]) {
    count++;
    d = previousDay(d);
  }
  return count;
}
