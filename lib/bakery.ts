import type { Lesson } from './learning';
import type { JournalChallenge, StudioActivity } from './activity-types';

export function createBakeryLesson(attempt = 0): Lesson {
  const scale = 1 + (attempt % 5);
  const cash = (amount: number) => `$${(amount * scale).toLocaleString('en-US')}`;
  const entry = (
    title: string,
    story: string,
    debit: string,
    credit: string,
    amount: number,
    explanation: string,
  ): StudioActivity => ({
    type: 'journal',
    challenge: {
      title,
      story,
      debit,
      credit,
      amount: amount * scale,
      accounts: [
        ...new Set([
          debit,
          credit,
          'Revenue',
          'Owner’s capital',
          'Inventory',
          'Equipment',
          'Cost of goods sold',
        ]),
      ],
      explanation,
      tip: 'Identify which accounts change, then decide which side increases or decreases each account.',
    } satisfies JournalChallenge,
  });
  return {
    id: 'bakery',
    title: 'Your First Bakery',
    subtitle: 'One business. Every connection.',
    color: 'peach',
    icon: 'journal',
    minutes: 12,
    level: 'Going deeper',
    format: 'story',
    concept:
      'Follow one bakery from its owner’s investment to balanced statements. Every transaction changes accounts, and those accounts tell one connected story.',
    example: `You invest ${cash(2000)} in your bakery. Cash and owner’s capital both start at ${cash(2000)}. You will buy an oven and inventory, make a sale, then connect profit to the balance sheet. Assume no tax, debt or depreciation during this first day.`,
    tip: 'Keep cash, profit, and inventory separate. A balanced journal connects them without treating them as the same thing.',
    entry: {
      prompt: `The bakery earns ${cash(400)}, with ${cash(120)} of goods sold and ${cash(100)} rent. What is net profit?`,
      labels: ['Net profit ($)'],
      answers: [[String(180 * scale)]],
      explanation: `${cash(400)} − ${cash(120)} − ${cash(100)} = ${cash(180)} net profit.`,
      tip: 'Subtract cost of goods sold and rent from revenue.',
    },
    order: [
      'Record transactions',
      'Summarize account balances',
      'Calculate profit',
      'Prepare the balance sheet',
    ],
    orderTip: 'The statements grow from the same set of accounts.',
    activities: [
      entry(
        'First, an oven.',
        `Your bakery starts with ${cash(2000)} cash from your investment. Buy an oven for ${cash(600)} cash. Record the purchase.`,
        'Equipment',
        'Cash',
        600,
        `Debit Equipment and credit Cash ${cash(600)}. Cash is now ${cash(1400)}; equipment is ${cash(600)}. Total assets remain ${cash(2000)}.`,
      ),
      entry(
        'Stock the shelves.',
        `Cash is ${cash(1400)} and equipment is ${cash(600)}. Buy ${cash(300)} of ingredients for cash. Treat these ingredients as inventory until sold.`,
        'Inventory',
        'Cash',
        300,
        `Debit Inventory and credit Cash ${cash(300)}. Cash is ${cash(1100)}, inventory ${cash(300)}, and equipment ${cash(600)}.`,
      ),
      entry(
        'Your first customers.',
        `Customers pay ${cash(400)} cash for baked goods. Record the sale’s revenue side first; we will record the goods’ cost next.`,
        'Cash',
        'Revenue',
        400,
        `Debit Cash and credit Revenue ${cash(400)}. Cash is now ${cash(1500)}. Revenue and inventory cost need separate entries.`,
      ),
      entry(
        'What did that sale cost?',
        `The goods you just sold cost ${cash(120)} from your ${cash(300)} inventory. Transfer that cost from inventory to cost of goods sold.`,
        'Cost of goods sold',
        'Inventory',
        120,
        `Debit Cost of goods sold and credit Inventory ${cash(120)}. Inventory is now ${cash(180)}. Gross profit is ${cash(400)} − ${cash(120)} = ${cash(280)}.`,
      ),
      {
        type: 'choice',
        challenge: {
          title: 'From transactions to profit.',
          story: `You also pay ${cash(100)} rent: debit Rent expense and credit Cash. Revenue is ${cash(400)}, cost of goods sold ${cash(120)}, and rent ${cash(100)}.`,
          question: 'What is the bakery’s net profit for the day?',
          correct: 'profit',
          options: [
            {
              id: 'cash',
              label: cash(1400),
              explanation:
                'That is the closing cash balance. Cash includes the owner’s investment and payments for assets, so it differs from profit.',
            },
            {
              id: 'gross',
              label: cash(280),
              explanation: 'That is gross profit. Subtract rent to find net profit.',
            },
            {
              id: 'profit',
              label: cash(180),
              explanation: `Revenue ${cash(400)} − cost of goods sold ${cash(120)} − rent ${cash(100)} = net profit ${cash(180)}.`,
            },
          ],
          tip: 'Net profit subtracts both the cost of goods sold and operating expenses.',
        },
      },
      {
        type: 'choice',
        challenge: {
          title: 'One balanced story.',
          story: `Closing balances: cash ${cash(1400)}, equipment ${cash(600)}, inventory ${cash(180)}, and no liabilities. The owner invested ${cash(2000)} and earned ${cash(180)} profit, which stays in the business.`,
          question: 'Which balance sheet connects all of today’s transactions?',
          correct: 'balanced',
          options: [
            {
              id: 'balanced',
              label: `Assets ${cash(2180)} = Liabilities $0 + Equity ${cash(2180)}`,
              explanation: `Cash + equipment + inventory = ${cash(2180)}. Equity is investment ${cash(2000)} + profit ${cash(180)}. Both sides tell the same story.`,
            },
            {
              id: 'cash-only',
              label: `Assets ${cash(1400)} = Equity ${cash(1400)}`,
              explanation:
                'Cash is only one asset. The bakery also still owns its oven and unsold inventory.',
            },
            {
              id: 'capital-only',
              label: `Assets ${cash(2180)} = Equity ${cash(2000)}`,
              explanation:
                'The owner’s original investment is only part of closing equity. Add the profit retained by the business.',
            },
          ],
          tip: 'Add all three assets. Then add today’s profit to the original investment.',
        },
      },
    ],
  };
}
