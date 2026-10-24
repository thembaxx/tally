import type { StudioActivity } from './activity-types';
import { studioLessons, cashFlowLesson } from './studio-lessons';
import { createBakeryLesson } from './bakery';
import { practiceEntry } from './questions';
import { readReviews, type Review } from './reviews';
import { readDraft, type LessonDraft } from './session';
import { practiceTopics, recommendedChallenge } from './adaptive';
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
    explanation: 'Your investment is the owner’s share. $1,200 of assets = $800 owed + $400 owned.',
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
      'You open a lemonade stand with $40 of your own and borrow $60. Your $100 cash is an asset. The $60 loan is a liability. Your $40 is equity.',
    tip: 'Own it? Asset. Owe it? Liability. Your share? Equity.',
    entry: {
      prompt: 'Your lemonade stand has $100 in assets and owes $60. How much is your equity?',
      labels: ['Owner’s equity ($)'],
      answers: [['40']],
      explanation: 'Equity = Assets − Liabilities. $100 − $60 = $40 belongs to you.',
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
      'Every transaction has at least two sides. Debits go on the left, credits on the right. Total debits always equal total credits.',
    example:
      'Buy a $500 laptop with cash: debit Equipment $500 (an asset goes up), credit Cash $500 (an asset goes down). Debit doesn’t always mean “increase”: it depends on the account.',
    tip: 'Assets and expenses grow with debits. Liabilities, equity, and revenue grow with credits.',
    entry: {
      prompt: 'You buy a $500 laptop with business cash. Which accounts do you debit and credit?',
      labels: ['Debit account', 'Credit account'],
      answers: [
        ['equipment', 'laptop', 'computer', 'computer equipment', 'office equipment'],
        ['cash', 'bank', 'bank account', 'business cash'],
      ],
      explanation:
        'Debit Equipment: your equipment increases. Credit Cash: your cash decreases. The $500 entries balance.',
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
      'The income statement tells the story of profit over a period. Revenue minus cost of goods sold gives gross profit. Subtract operating expenses to find operating profit.',
    example:
      'A bakery earns $1,000. Ingredients cost $400. Gross profit is $600. After $200 of rent and other operating expenses, operating profit is $400.',
    tip: 'Revenue is the whole pie. Profit is what you keep after costs.',
    entry: {
      prompt:
        'Your bakery earns $1,000 in revenue. Cost of goods sold is $400. What is gross profit?',
      labels: ['Gross profit ($)'],
      answers: [['600']],
      explanation:
        'Gross profit = Revenue − Cost of goods sold. $1,000 − $400 = $600. Operating expenses come later.',
      tip: 'Gross profit comes before rent and other operating expenses.',
    },
    order: [
      'Revenue',
      'Cost of goods sold',
      'Gross profit',
      'Operating expenses',
      'Operating profit',
    ],
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
      'Accrual accounting records revenue when earned and expenses when incurred, even when cash moves on a different day.',
    example:
      'You tutor a student in March and receive $80 in April. Under accrual accounting, March has $80 of revenue and $80 of accounts receivable.',
    tip: 'Earned and received can happen on different days.',
    entry: {
      prompt:
        'You earn $80 for tutoring in March, but get paid in April. In which month do you record revenue under accrual accounting?',
      labels: ['Revenue month'],
      answers: [['march', 'mar']],
      explanation:
        'March. The service was delivered then. Accounts receivable tracks the amount still owed to you.',
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
      'Inventory is an asset until it is sold. When sold, its cost becomes an expense called cost of goods sold. FIFO assumes the oldest units are sold first.',
    example:
      'Buy 10 notebooks at $2, then 10 at $3. Sell 10 using FIFO: cost of goods sold is $20, and the remaining inventory is $30.',
    tip: 'On the shelf: asset. Sold: expense.',
    entry: {
      prompt:
        'You buy 10 notebooks at $2, then 10 at $3. Sell the first 10 using FIFO. What is cost of goods sold?',
      labels: ['Cost of goods sold ($)'],
      answers: [['20']],
      explanation:
        'FIFO means first in, first out. The oldest 10 cost $2 each, so cost of goods sold is $20.',
      tip: 'FIFO starts with the oldest purchase.',
    },
    order: [
      'Purchase inventory',
      'Record an asset',
      'Sell the inventory',
      'Recognize cost of goods sold',
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
      'A $1,200 laptop with a $200 residual value lasts 5 years. Annual depreciation is ($1,200 − $200) ÷ 5 = $200.',
    tip: 'Depreciation allocates cost. It doesn’t measure today’s resale price.',
    entry: {
      prompt:
        'A laptop costs $1,200, has a $200 residual value, and lasts 5 years. What is annual straight-line depreciation?',
      labels: ['Annual depreciation ($)'],
      answers: [['200']],
      explanation:
        '($1,200 − $200) ÷ 5 = $200 each year. Depreciation expense rises; accumulated depreciation reduces the asset’s carrying amount.',
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
      'Current assets of $3,000 divided by current liabilities of $1,500 gives 2.0. There are $2 of current assets for each $1 due in the short term.',
    tip: 'A ratio is a clue, not a verdict. Industry and timing matter.',
    entry: {
      prompt:
        'Current assets are $3,000 and current liabilities are $1,500. What is the current ratio?',
      labels: ['Current ratio'],
      answers: [['2', '2.0', '2:1', '2.0:1']],
      explanation:
        '$3,000 ÷ $1,500 = 2.0. This suggests a short-term cushion, but inventory quality and payment timing still matter.',
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
      'A budget is a plan. A variance compares actual results with that plan. For an expense, spending less than planned is usually favorable.',
    example:
      'You budget $500 for supplies and spend $450. You are $50 under budget: a favorable expense variance. Check whether lower spending affected quality.',
    tip: 'A variance starts a conversation. Always ask why.',
    entry: {
      prompt:
        'You budget $500 for supplies and actually spend $450. How many dollars under budget are you?',
      labels: ['Favorable variance ($)'],
      answers: [['50']],
      explanation:
        '$500 − $450 = $50 under budget. For an expense, this is favorable, assuming the business still got what it needed.',
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
      'A smoothie sells for $10 and costs $6 to make. Each sale contributes $4 toward $200 of fixed rent. Sell 50 smoothies to break even: $200 ÷ $4 = 50.',
    tip: 'First cover the cost of making one more unit. What remains pays for the business.',
    entry: {
      prompt:
        'A smoothie sells for $10, variable cost is $6, and fixed costs are $200. How many smoothies must you sell to break even?',
      labels: ['Break-even units'],
      answers: [['50']],
      explanation:
        'Each smoothie contributes $10 − $6 = $4. Divide $200 of fixed costs by $4: 50 smoothies. At 50 units, revenue and total costs are both $500.',
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
    subtitle: 'A promise on the balance sheet',
    color: 'lavender',
    icon: 'clock',
    minutes: 7,
    level: 'Going deeper',
    concept:
      'A payment received before a service is delivered creates deferred revenue: a liability representing a promise to the customer. Revenue is recognized as the service is delivered.',
    example:
      'A customer pays $600 for six months of lessons. At first, debit Cash $600 and credit Deferred Revenue $600. Each month, debit Deferred Revenue $100 and credit Revenue $100.',
    tip: 'Cash received is not automatically revenue earned. Ask what you still owe the customer.',
    entry: {
      prompt:
        'A customer prepays $600 for six equal months of lessons. You deliver one month. How much revenue do you recognize now?',
      labels: ['Revenue earned this month ($)'],
      answers: [['100']],
      explanation:
        '$600 ÷ 6 = $100. Debit Deferred Revenue and credit Revenue by $100. The remaining $500 is still a liability until future lessons are delivered.',
      tip: 'Spread the prepayment across the equal months of service.',
    },
    order: [
      'Receive the customer prepayment',
      'Record cash and deferred revenue',
      'Deliver one month of service',
      'Reduce deferred revenue and recognize revenue',
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
      'A parent reports $1,000 of sales, including $200 to its wholly owned subsidiary. The subsidiary reports $500 of sales to outside customers. Consolidated revenue is $1,000 + $500 − $200 = $1,300.',
    tip: 'The group cannot sell to itself. Only outside-customer sales count as group revenue.',
    entry: {
      prompt:
        'A parent has $1,000 of sales, including $200 to its subsidiary. The subsidiary has $500 of external sales. What is consolidated revenue?',
      labels: ['Consolidated revenue ($)'],
      answers: [['1300']],
      explanation:
        'Add $1,000 and $500, then eliminate the $200 internal sale: $1,300. This simplified exercise assumes full control and focuses only on revenue elimination.',
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
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function previousDay(day: string) {
  const d = new Date(`${day}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return localDay(d);
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
        explanation: 'Money invested by the owner is equity. $900 = $500 + $400.',
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
        explanation: 'Equity is the owner’s residual share. $600 = $200 + $400.',
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
      .replace(/[$£€,]/g, '')
      .replace(/\s+/g, ' ')
      .replace(/[.!?]+$/, '');
  const v = clean(value);
  return answers.some(
    (a) => clean(a) === v || (Number.isFinite(Number(v)) && v !== '' && Number(v) === Number(a)),
  );
}
export const STORAGE_KEY = 'tally-progress-v1';
export type Progress = {
  name: string;
  onboarded: boolean;
  goal: number;
  xp: number;
  completed: string[];
  activity: Record<string, number>;
  dailyRuns: Record<string, number>;
  focusDays: string[];
  theme: 'system' | 'light' | 'dark';
  haptics: boolean;
  sound: boolean;
  soundVolume: number;
  reviews: Record<string, Review>;
  notes: Record<string, string>;
  draft: LessonDraft | null;
};
export const initialProgress: Progress = {
  name: '',
  onboarded: false,
  goal: 5,
  xp: 0,
  completed: [],
  activity: {},
  dailyRuns: {},
  focusDays: [],
  theme: 'system',
  haptics: true,
  sound: false,
  soundVolume: 45,
  reviews: {},
  notes: {},
  draft: null,
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
    return {
      ...initialProgress,
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
