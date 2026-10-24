import type { Entry } from './learning';
import { challengeEntry, type ChallengeLevel } from './challenge-questions';
import { money } from './south-africa';

// Integer inputs keep every generated answer exact. Attempts are saved with the
// session so reloads cannot change the question halfway through an activity.
export function practiceEntry(id: string, attempt = 0, level: ChallengeLevel = 'standard'): Entry {
  if (level !== 'standard') return challengeEntry(id, attempt, level);
  const n = Math.max(0, Math.floor(attempt)) % 24;
  const business = ['spaza shop', 'bicycle repair shop', 'coffee stall', 'bookshop'][n % 4];
  const numeric = (
    prompt: string,
    label: string,
    answer: number,
    explanation: string,
    tip: string,
  ): Entry => ({
    prompt,
    labels: [label],
    answers: [[String(answer)]],
    explanation,
    tip,
  });
  const text = (
    prompt: string,
    label: string,
    answers: string[],
    explanation: string,
    tip: string,
  ): Entry => ({
    prompt,
    labels: [label],
    answers: [answers],
    explanation,
    tip,
  });
  switch (id) {
    case 'equation': {
      const assets = 850 + n * 50,
        debt = 300 + n * 10;
      return numeric(
        `Your ${business} has ${money(assets)} in assets and owes ${money(debt)}. How much is the owner’s equity?`,
        'Owner’s equity (R)',
        assets - debt,
        `${money(assets)} − ${money(debt)} = ${money(assets - debt)}. Assets minus liabilities leaves the owner’s share.`,
        'Equity = Assets − Liabilities.',
      );
    }
    case 'debit': {
      const amount = 650 + n * 25;
      const scenarios = [
        {
          story: `buys ${money(amount)} of equipment and pays by EFT from its business bank account`,
          debit: ['equipment', 'computer', 'laptop', 'office equipment', 'computer equipment'],
          credit: ['bank', 'bank account', 'cash', 'business cash'],
          why: 'Equipment increases and Bank decreases. Both are assets. EFT means electronic funds transfer.',
        },
        {
          story: `buys ${money(amount)} of inventory on credit from a supplier`,
          debit: ['inventory', 'stock', 'merchandise'],
          credit: ['trade payables', 'payables', 'supplier payable', 'creditors'],
          why: 'Inventory increases with a debit. Trade payables (creditors) increase with a credit.',
        },
        {
          story: `borrows ${money(amount)} from a bank and receives the cash`,
          debit: ['cash', 'bank', 'bank account'],
          credit: ['loan payable', 'bank loan', 'loan', 'loans payable'],
          why: 'Cash increases with a debit. Borrowing increases Loan payable with a credit; it is not revenue.',
        },
        {
          story: `earns ${money(amount)} for a service delivered and paid for immediately in cash`,
          debit: ['cash', 'bank', 'bank account'],
          credit: ['revenue', 'service revenue', 'sales', 'income'],
          why: 'Cash increases with a debit. Earned revenue increases with a credit.',
        },
      ];
      const scenario = scenarios[n % scenarios.length];
      return {
        prompt: `Your ${business} ${scenario.story}. Which account is debited and which is credited?`,
        labels: ['Debit account', 'Credit account'],
        answers: [scenario.debit, scenario.credit],
        explanation: `Debit ${scenario.debit[0]} ${money(amount)} and credit ${scenario.credit[0]} ${money(amount)}. ${scenario.why}`,
        tip: 'Debits increase assets and expenses. Credits increase liabilities, equity, and revenue. First identify which accounts change.',
      };
    }
    case 'statements':
    case 'bakery': {
      const revenue = 1400 + n * 100,
        cost = 550 + n * 25;
      return numeric(
        `Your ${business} earns ${money(revenue)} in revenue. Goods sold cost ${money(cost)} and rent is R200. What is gross profit?`,
        'Gross profit (R)',
        revenue - cost,
        `${money(revenue)} − ${money(cost)} = ${money(revenue - cost)} gross profit. Rent is an operating expense and comes afterward.`,
        'Gross profit subtracts cost of sales, before operating expenses.',
      );
    }
    case 'accruals': {
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
      ];
      const month = months[(n + 4) % 11],
        next = months[((n + 4) % 11) + 1];
      return text(
        `Your ${business} delivers an order in ${month} and gets paid in ${next}. Under accrual accounting, which month records the revenue?`,
        'Revenue month',
        [month, month.slice(0, 3)],
        `${month}: revenue is earned when the order is delivered. A receivable records the money still owed.`,
        'Ask when the business earned the revenue, even if payment comes later.',
      );
    }
    case 'inventory': {
      const units = 6 + n,
        oldCost = 4 + (n % 3),
        newCost = oldCost + 2;
      return numeric(
        `Your ${business} buys ${units} items at ${money(oldCost)} each, then ${units} at ${money(newCost)}. It sells ${units} using FIFO. What is cost of sales?`,
        'Cost of sales (R)',
        units * oldCost,
        `FIFO uses the oldest batch: ${units} × ${money(oldCost)} = ${money(units * oldCost)}. The newer batch stays in inventory.`,
        'First in, first out: use the first purchase cost.',
      );
    }
    case 'depreciation': {
      const years = 3 + (n % 5),
        annual = 300 + n * 20,
        residual = 150 + n * 10,
        cost = annual * years + residual;
      return numeric(
        `Equipment costs ${money(cost)}, will last ${years} years, and has a ${money(residual)} residual value. What is annual straight-line depreciation?`,
        'Annual depreciation (R)',
        annual,
        `(${money(cost)} − ${money(residual)}) ÷ ${years} = ${money(annual)} per year.`,
        'Subtract residual value from cost, then divide by useful life.',
      );
    }
    case 'ratios': {
      const debt = 800 + n * 100,
        ratio = 3 + (n % 3),
        assets = debt * ratio;
      const entry = numeric(
        `Your ${business} has current assets of ${money(assets)} and current liabilities of ${money(debt)}. What is the current ratio?`,
        'Current ratio',
        ratio,
        `${money(assets)} ÷ ${money(debt)} = ${ratio}. There are ${money(ratio)} of current assets per R1 of current liabilities.`,
        'Divide current assets by current liabilities.',
      );
      entry.answers[0].push(`${ratio}:1`, `${ratio}.0:1`);
      return entry;
    }
    case 'budgeting': {
      const budget = 750 + n * 50,
        difference = 75 + n * 5;
      return numeric(
        `Your ${business} budgets ${money(budget)} for supplies and spends ${money(budget - difference)}. How many rand under budget is it?`,
        'Favourable variance (R)',
        difference,
        `${money(budget)} − ${money(budget - difference)} = ${money(difference)} under budget. Check whether quality was maintained.`,
        'Subtract actual expense from budgeted expense.',
      );
    }
    case 'breakeven': {
      const price = 15 + n,
        variable = 9 + n,
        units = 35 + n * 5,
        fixed = units * (price - variable);
      return numeric(
        `Your ${business} sells a product for ${money(price)}, with ${money(variable)} variable cost per unit and ${money(fixed)} fixed costs. How many units break even?`,
        'Break-even units',
        units,
        `Each unit contributes ${money(price - variable)}. ${money(fixed)} ÷ ${money(price - variable)} = ${units} units.`,
        'Divide fixed costs by (selling price minus variable cost).',
      );
    }
    case 'deferrals': {
      const months = 3 + (n % 6),
        earned = 120 + n * 10;
      return numeric(
        `A customer prepays ${money(months * earned)} for ${months} equal months of service. After delivering one month, how much revenue is earned?`,
        'Revenue earned this month (R)',
        earned,
        `${money(months * earned)} ÷ ${months} = ${money(earned)} earned. The rest remains deferred revenue until delivery.`,
        'Recognise only the portion of service already delivered.',
      );
    }
    case 'consolidation': {
      const parent = 2200 + n * 100,
        child = 900 + n * 50,
        internal = 350 + n * 25;
      return numeric(
        `A parent reports ${money(parent)} of sales, including ${money(internal)} to its wholly owned subsidiary. The subsidiary sells ${money(child)} externally. What is consolidated revenue?`,
        'Consolidated revenue (R)',
        parent + child - internal,
        `${money(parent)} + ${money(child)} − ${money(internal)} = ${money(parent + child - internal)}. Eliminate the internal sale.`,
        'Add both companies’ sales, then remove sales inside the group.',
      );
    }
    case 'journal-lab':
      return text(
        `Your ${business} receives a ${money(900 + n * 50)} bank loan in cash. Which account is credited?`,
        'Credit account',
        ['loan', 'bank loan', 'loan payable', 'loans payable'],
        'Debit Cash because that asset increases. Credit Loan payable because the liability increases.',
        'A liability grows with a credit. This receipt is borrowed money, not revenue.',
      );
    case 'spot-the-slip':
      return text(
        `Your ${business} buys an oven for ${money(1600 + n * 100)} in cash. Someone debits Rent expense and credits Cash. Which account should replace Rent expense?`,
        'Correct debit account',
        ['equipment', 'oven', 'machinery', 'kitchen equipment'],
        'Debit Equipment. An oven provides benefits over time, so the purchase creates an asset rather than rent expense.',
        'The totals balance, but what did the business actually buy?',
      );
    case 'cashflow': {
      const actions = [
        [
          'buys a delivery van with cash',
          'investing',
          'Buying a long-lived asset is an investing cash outflow.',
        ],
        [
          'receives cash from a bank loan',
          'financing',
          'Borrowing brings in financing cash. It does not create sales revenue.',
        ],
        [
          'collects cash from a customer for goods sold',
          'operating',
          'Customer collections are part of normal operating activities.',
        ],
      ];
      const [action, category, explanation] = actions[n % 3];
      return text(
        `Your ${business} ${action}. Is this an operating, investing, or financing cash flow?`,
        'Cash flow category',
        [category, `${category} activity`, `${category} activities`],
        explanation,
        'Daily trading is operating; long-lived assets are investing; owners and lenders are financing.',
      );
    }
    case 'recall': {
      const cards = [
        ['An unpaid supplier invoice', 'liability', 'The business owes the supplier money.'],
        [
          'Cash in the business bank account',
          'asset',
          'The business controls the cash and can use it.',
        ],
        [
          'The owner’s residual share after liabilities',
          'equity',
          'Equity is what remains for owners after amounts owed.',
        ],
      ];
      const [item, answer, explanation] = cards[n % 3];
      return text(
        `${item}: asset, liability, or equity?`,
        'Account category',
        [answer, { asset: 'assets', liability: 'liabilities', equity: 'owner’s equity' }[answer]!],
        explanation,
        'Think: own it, owe it, or the owner’s share.',
      );
    }
    default:
      throw new Error(`No practice questions for ${id}`);
  }
}
