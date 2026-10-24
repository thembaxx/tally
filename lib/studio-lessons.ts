import type { Lesson } from './learning';

export const studioLessons: Lesson[] = [
  {
    id: 'recall',
    title: 'The Memory Gym',
    subtitle: 'Small cards. Stronger connections.',
    color: 'butter',
    icon: 'cards',
    minutes: 4,
    level: 'Foundations',
    format: 'recall',
    concept:
      'Retrieval means trying to remember before looking. That little effort helps an idea stay with you. These cards connect accounting words to familiar situations.',
    example:
      'Before you turn a card over, say your answer quietly or type a few words. Check the explanation, then decide whether you want to try that card again.',
    tip: 'Try to remember first. A partly remembered answer is a useful place to start.',
    entry: {
      prompt: 'What is the name for something a business owns?',
      labels: ['Account category'],
      answers: [['asset', 'assets']],
      explanation: 'An asset is a resource the business controls that can help it in the future.',
      tip: 'Think of the laptop or cash the business owns.',
    },
    order: [
      'Try to remember',
      'Reveal the explanation',
      'Check your understanding',
      'Return after a little time',
    ],
    orderTip: 'Give your memory a chance before revealing the idea.',
    activities: [
      {
        type: 'recall',
        cards: [
          {
            id: 'asset',
            question: 'A bakery owns an oven. What kind of account is it?',
            answer: 'An asset.',
            explanation: 'The oven is a resource the bakery owns and uses to earn income.',
            example: 'Cash, delivery bikes, and money customers owe you can also be assets.',
          },
          {
            id: 'debit',
            question: 'An asset increases. Does that usually go on the debit or credit side?',
            answer: 'The debit side.',
            explanation:
              'Debits increase assets and expenses. Credits increase liabilities, equity, and revenue.',
            example: 'Buying a R500 laptop: debit Equipment R500 and credit Cash R500.',
          },
          {
            id: 'profit',
            question: 'Revenue is R100. The items sold cost R40. What is gross profit?',
            answer: 'R60.',
            explanation:
              'Gross profit = revenue minus cost of sales. It comes before operating expenses.',
            example: 'R100 − R40 = R60. Rent and other operating expenses come afterward.',
          },
        ],
      },
    ],
  },
  {
    id: 'journal-lab',
    title: 'The Journal Lab',
    subtitle: 'Build both sides of the story.',
    color: 'blue',
    icon: 'journal',
    minutes: 6,
    level: 'Next level',
    format: 'journal',
    concept:
      'A journal entry translates a transaction into accounts. Choose what changes, place each account on its debit or credit side, and record equal amounts.',
    example:
      'A R500 laptop paid for in cash increases Equipment and decreases Cash. Debit Equipment R500. Credit Cash R500. Both are assets; the direction of the change decides the side.',
    tip: 'Identify the accounts first. Then ask which one increases and which one decreases.',
    entry: {
      prompt: 'What account do you credit when you pay with business cash?',
      labels: ['Credit account'],
      answers: [['cash', 'bank']],
      explanation: 'Credit Cash to record a decrease in that asset.',
      tip: 'What leaves the business?',
    },
    order: [
      'Identify the transaction',
      'Choose the accounts',
      'Record both sides',
      'Confirm equal totals',
    ],
    orderTip: 'A balanced entry still needs the correct accounts.',
    activities: [
      {
        type: 'journal',
        challenge: {
          title: 'A tool for the job.',
          story:
            'Your design studio buys a R500 laptop using business cash. Build the journal entry.',
          accounts: ['Cash', 'Equipment', 'Trade payables', 'Revenue'],
          debit: 'Equipment',
          credit: 'Cash',
          amount: 500,
          explanation:
            'Equipment increases with a R500 debit. Cash decreases with a R500 credit. You changed the mix of assets, without changing total assets.',
          tip: 'The laptop comes in. Cash goes out.',
        },
      },
      {
        type: 'journal',
        challenge: {
          title: 'Buy now. Pay later.',
          story:
            'Your bakery receives R200 of unused packaging supplies. The supplier will be paid next month. Treat the unused supplies as an asset.',
          accounts: ['Supplies', 'Cash', 'Trade payables', 'Sales revenue'],
          debit: 'Supplies',
          credit: 'Trade payables',
          amount: 200,
          explanation:
            'Debit Supplies R200 because an asset increased. Credit Trade payables R200 because an obligation increased. No cash has moved yet.',
          tip: 'The supplies arrive today, and the promise to pay is a liability.',
        },
      },
    ],
  },
  {
    id: 'spot-the-slip',
    title: 'Spot the Slip',
    subtitle: 'Good accountants ask good questions.',
    color: 'peach',
    icon: 'detective',
    minutes: 5,
    level: 'Going deeper',
    format: 'detective',
    concept:
      'An entry can balance and still be wrong. Look at the timing, the account choice, and the story behind the numbers. A useful review explains the error and how to fix it.',
    example:
      'A R1 200 annual insurance payment is fully charged to expense on day one. If coverage starts now, most of that payment is initially a prepaid asset. The expense appears as each month of coverage is used.',
    tip: 'Balanced totals are the start of a review, not the end of it.',
    entry: {
      prompt:
        'An entry has equal debits and credits. Does that alone prove the accounts are correct?',
      labels: ['Yes or no'],
      answers: [['no', 'no it does not']],
      explanation: 'No. Equal totals cannot catch every account or timing error.',
      tip: 'A transaction still needs the right story.',
    },
    order: [
      'Read the transaction',
      'Inspect the accounts',
      'Check recognition timing',
      'Verify equal debits and credits',
    ],
    orderTip: 'Review the economic story as well as the arithmetic.',
    activities: [
      {
        type: 'choice',
        challenge: {
          title: 'Balanced… but is it right?',
          story:
            'A studio buys a R900 camera with cash. Its bookkeeper debits Rent expense R900 and credits Cash R900. The camera will be used for several years.',
          question: 'What needs another look?',
          correct: 'asset',
          tip: 'Which account describes a long-lived camera?',
          illustration: 'journal',
          options: [
            {
              id: 'asset',
              label: 'Use Equipment instead of Rent expense.',
              explanation:
                'Exactly. The camera is a long-lived asset in this example. Debit Equipment R900 and credit Cash R900. Its cost can be depreciated over its useful life.',
            },
            {
              id: 'cash',
              label: 'Debit Cash instead of crediting it.',
              explanation:
                'Cash was paid out, so crediting Cash is correct. Look at the account used for the camera.',
            },
            {
              id: 'fine',
              label: 'Nothing—the entry balances.',
              explanation:
                'It does balance, but the wrong debit account changes the meaning. A camera is not a rent payment.',
            },
          ],
        },
      },
      {
        type: 'choice',
        challenge: {
          title: 'The timing detective.',
          story:
            'A customer prepays R600 for six equal months of tutoring. No lesson has been delivered yet. The tutor records all R600 as revenue immediately.',
          question: 'What should the initial credit be?',
          correct: 'deferred',
          tip: 'What does the tutor still owe the customer?',
          options: [
            {
              id: 'deferred',
              label: 'Deferred revenue: there is still a service to deliver.',
              explanation:
                'Yes. Cash increases, but the tutor still owes six months of service. Credit Deferred Revenue R600, then recognise R100 of revenue as each month is delivered.',
            },
            {
              id: 'earned',
              label: 'Revenue: cash arrived, so it is already earned.',
              explanation:
                'Receiving cash and earning revenue are different events under accrual accounting. The service has not been delivered yet.',
            },
            {
              id: 'expense',
              label: 'Tutoring expense: the customer has paid.',
              explanation:
                'The tutor received money, not an expense. Think about the promise to deliver future lessons.',
            },
          ],
        },
      },
    ],
  },
];

export const cashFlowLesson: Lesson = {
  id: 'cashflow',
  title: 'Follow the Cash',
  subtitle: 'Track cash entering and leaving a business',
  color: 'mint',
  icon: 'flow',
  minutes: 6,
  level: 'Next level',
  format: 'story',
  concept:
    'The statement of cash flows tracks cash entering and leaving the business. Operating activities run the business; investing activities buy or sell long-term assets; financing activities raise or repay capital.',
  example:
    'A bakery collects R500 from customers, buys a R900 oven, and receives a R600 bank loan. Those are operating +R500, investing −R900, and financing +R600: cash increases by R200 overall.',
  tip: 'Ask why cash moved. Daily business, long-term investment, or funding?',
  entry: {
    prompt:
      'Operating cash is +R500, investing cash is −R900, and financing cash is +R600. What is the net increase in cash?',
    labels: ['Net cash increase (R)'],
    answers: [['200']],
    explanation: 'R500 − R900 + R600 = R200. The categories show why cash changed.',
    tip: 'Add the three cash-flow categories, keeping the signs.',
  },
  order: [
    'Operating activities',
    'Investing activities',
    'Financing activities',
    'Net change in cash',
  ],
  orderTip: 'The three categories combine to explain the change in cash.',
  activities: [
    {
      type: 'choice',
      challenge: {
        title: 'Follow the money.',
        story: 'Your bakery pays R900 cash for an oven it will use for five years.',
        question: 'Where does this cash payment belong?',
        correct: 'investing',
        tip: 'An oven is a long-term asset.',
        illustration: 'flow',
        options: [
          {
            id: 'operating',
            label: 'Operating: the bakery uses the oven every day.',
            explanation:
              'The oven supports operations, but buying a long-term asset is an investing cash flow. Everyday use and the category of the purchase are different ideas.',
          },
          {
            id: 'investing',
            label: 'Investing: the business bought a long-term asset.',
            explanation:
              'Exactly. Buying an oven is an investing outflow of R900. It does not become a R900 operating expense simply because cash was paid.',
          },
          {
            id: 'financing',
            label: 'Financing: money left the business.',
            explanation:
              'An outflow is not automatically financing. Financing is about owners, lenders, and funding the business.',
          },
        ],
      },
    },
    {
      type: 'choice',
      challenge: {
        title: 'Profit without cash?',
        story:
          'You deliver R300 of tutoring today. The customer will pay next week. Use accrual accounting.',
        question: 'What happened today?',
        correct: 'receivable',
        tip: 'Separate earning the revenue from collecting it.',
        options: [
          {
            id: 'both',
            label: 'Revenue and cash both increased by R300.',
            explanation:
              'The revenue is earned, but no cash has arrived. The unpaid amount becomes a receivable.',
          },
          {
            id: 'receivable',
            label: 'Revenue and trade receivables increased. Cash did not.',
            explanation:
              'That’s the distinction. You earned R300 of revenue and recorded a R300 receivable. Cash increases only when the customer pays.',
          },
          {
            id: 'neither',
            label: 'Nothing changes until the customer pays.',
            explanation:
              'Under accrual accounting, completing the service earns revenue now. Waiting for cash would miss today’s work.',
          },
        ],
      },
    },
  ],
};
