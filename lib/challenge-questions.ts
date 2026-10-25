import type { Entry } from './learning';
import { money } from './south-africa';

export const challengeLevels = ['guided', 'standard', 'stretch'] as const;
export type ChallengeLevel = (typeof challengeLevels)[number];
export type Challenge = { id: string; attempt: number; level: ChallengeLevel; followUp?: boolean };

// Guided questions reduce the number of decisions and show the method. Stretch
// questions transfer the same concept to a reverse or multi-step problem.
export function challengeEntry(id: string, attempt: number, level: 'guided' | 'stretch'): Entry {
  const n = Math.max(0, Math.floor(attempt)) % 24;
  const guided = level === 'guided';
  const number = (
    prompt: string,
    label: string,
    answer: number,
    explanation: string,
    tip: string,
  ): Entry => ({ prompt, labels: [label], answers: [[String(answer)]], explanation, tip });
  const account = (
    prompt: string,
    label: string,
    answers: string[],
    explanation: string,
    tip: string,
  ): Entry => ({ prompt, labels: [label], answers: [answers], explanation, tip });
  switch (id) {
    case 'equation': {
      const cash = 100 + n * 10,
        equipment = 80 + n * 5,
        debt = 40 + n * 5;
      return guided
        ? number(
            `A shop owns ${money(cash)} and owes ${money(debt)}. Use Equity = Assets − Liabilities. How much is the owner’s equity?`,
            'Owner’s equity (R)',
            cash - debt,
            `${money(cash)} − ${money(debt)} = ${money(cash - debt)} of equity.`,
            'Subtract the amount owed from the assets.',
          )
        : number(
            `A shop has ${money(cash)} cash and ${money(equipment)} equipment. Its owner’s equity is ${money(cash + equipment - debt)}. How much does the shop owe?`,
            'Liabilities (R)',
            debt,
            `Assets total ${money(cash + equipment)}. Assets − Equity = ${money(debt)} of liabilities.`,
            'Add both assets, then rearrange Assets = Liabilities + Equity.',
          );
    }
    case 'debit': {
      const cost = 300 + n * 20,
        cash = 100 + n * 5;
      return guided
        ? account(
            `A shop buys equipment for ${money(cost)} cash. Equipment is an asset, and an increase in an asset is a debit. Which account is debited?`,
            'Debit account',
            ['equipment', 'computer', 'laptop', 'office equipment'],
            'Debit Equipment because the business gained an asset. Credit Cash for the payment.',
            'Name the asset the shop gained.',
          )
        : {
            prompt: `A shop buys equipment for ${money(cost)}, paying ${money(cash)} cash and owing the supplier the rest. Name the debit account and enter both credit amounts.`,
            labels: ['Debit account', 'Cash credit (R)', 'Trade payables credit (R)'],
            answers: [['equipment', 'office equipment'], [String(cash)], [String(cost - cash)]],
            explanation: `Debit Equipment ${money(cost)}; credit Cash ${money(cash)} and Trade payables ${money(cost - cash)}. Credits total ${money(cost)}.`,
            tip: 'The equipment cost is split between cash paid and the amount owed.',
          };
    }
    case 'statements':
    case 'bakery': {
      const revenue = 300 + n * 20,
        cost = 100 + n * 5,
        rent = 40 + n;
      return guided
        ? number(
            `Sales are ${money(revenue)} and cost of sales is ${money(cost)}. Gross profit = Sales − Cost of sales. What is gross profit?`,
            'Gross profit (R)',
            revenue - cost,
            `${money(revenue)} − ${money(cost)} = ${money(revenue - cost)} gross profit.`,
            'Subtract the cost of sales from sales.',
          )
        : number(
            `Sales are ${money(revenue)}, cost of sales is ${money(cost)}, and rent is ${money(rent)}. There are no other expenses. What is operating profit?`,
            'Operating profit (R)',
            revenue - cost - rent,
            `Gross profit is ${money(revenue - cost)}. Subtract ${money(rent)} rent to get ${money(revenue - cost - rent)} operating profit.`,
            'Calculate gross profit first, then subtract operating expenses.',
          );
    }
    case 'accruals': {
      const earned = 500 + n * 20,
        collected = 100 + n * 5;
      const month = ['March', 'May', 'July', 'September'][n % 4];
      const nextMonth = ['April', 'June', 'August', 'October'][n % 4];
      return guided
        ? account(
            `A tutor delivers a lesson in ${month} and receives payment in ${nextMonth}. Accrual accounting records revenue when the work is delivered. Which month records revenue?`,
            'Revenue month',
            [month, month.slice(0, 3)],
            `${month} records the earned revenue. ${nextMonth} records collection of the receivable.`,
            'Use the month in which the tutor delivered the lesson.',
          )
        : number(
            `A tutor earns ${money(earned)} in March. Customers pay ${money(collected)} before March ends and will pay the rest in April. There was no opening receivable. What is trade receivables at March end?`,
            'Trade receivables (R)',
            earned - collected,
            `${money(earned)} earned − ${money(collected)} collected = ${money(earned - collected)} still receivable.`,
            'Revenue includes the work already delivered; the receivable is the unpaid portion.',
          );
    }
    case 'inventory': {
      const first = 4 + n,
        cost = 3 + (n % 3),
        extra = 2 + (n % 2);
      return guided
        ? number(
            `A shop’s first batch has ${first} items costing ${money(cost)} each. It sells all ${first} using FIFO. Cost of sales = Items sold × First purchase cost. What is cost of sales?`,
            'Cost of sales (R)',
            first * cost,
            `${first} × ${money(cost)} = ${money(first * cost)} cost of sales.`,
            'Use the oldest purchase cost for these items.',
          )
        : number(
            `A shop buys ${first} items at ${money(cost)} each, then ${first + extra} at ${money(cost + 2)} each. It sells ${first + extra} using FIFO. What is cost of sales?`,
            'Cost of sales (R)',
            first * cost + extra * (cost + 2),
            `Use all ${first} older items and ${extra} newer items: ${money(first * cost)} + ${money(extra * (cost + 2))} = ${money(first * cost + extra * (cost + 2))}.`,
            'The sale crosses two batches. Exhaust the oldest batch first.',
          );
    }
    case 'depreciation': {
      const annual = 100 + n * 10,
        years = 3 + (n % 3),
        residual = 50 + n * 5;
      return guided
        ? number(
            `Equipment costs ${money(annual * years)}, has no residual value, and lasts ${years} years. Annual straight-line depreciation = Cost ÷ Years. What is annual depreciation?`,
            'Annual depreciation (R)',
            annual,
            `${money(annual * years)} ÷ ${years} = ${money(annual)} per year.`,
            'Divide cost by useful life.',
          )
        : number(
            `Equipment costs ${money(annual * years + residual)}, lasts ${years} years, and has ${money(residual)} residual value. After two full years of straight-line depreciation, what is its carrying amount?`,
            'Carrying amount (R)',
            annual * (years - 2) + residual,
            `Annual depreciation is ${money(annual)}. Cost − two years’ depreciation = ${money(annual * (years - 2) + residual)}.`,
            'Calculate annual depreciation after subtracting residual value, then subtract two years from cost.',
          );
    }
    case 'ratios': {
      const liabilities = 100 + n * 10,
        assets = liabilities * 2;
      return guided
        ? number(
            `Current assets are ${money(assets)} and current liabilities are ${money(liabilities)}. Current ratio = Current assets ÷ Current liabilities. What is the current ratio?`,
            'Current ratio',
            2,
            `${money(assets)} ÷ ${money(liabilities)} = 2.`,
            'Divide assets by liabilities. Enter the number before “to 1”.',
          )
        : number(
            `A business has ${money(liabilities)} current liabilities and ${money(liabilities)} current assets. Its target current ratio is 3. How much additional cash must the owner invest to reach that target, with liabilities unchanged?`,
            'Additional cash (R)',
            liabilities * 2,
            `The target is ${money(liabilities * 3)} in current assets. Subtract existing ${money(liabilities)} assets: add ${money(liabilities * 2)} cash.`,
            'Find target current assets, then subtract the assets already held.',
          );
    }
    case 'budgeting': {
      const budget = 200 + n * 10,
        saving = 20 + n,
        extra = 50 + n * 2;
      return guided
        ? number(
            `Supplies were budgeted at ${money(budget)} and actually cost ${money(budget - saving)}. Favourable expense variance = Budget − Actual. How many rand under budget is this?`,
            'Favourable variance (R)',
            saving,
            `${money(budget)} − ${money(budget - saving)} = ${money(saving)} under budget.`,
            'Subtract actual spending from budgeted spending.',
          )
        : number(
            `Supplies were budgeted at ${money(budget)} and rent at R100. Actual supplies cost ${money(budget - saving)} and actual rent cost ${money(100 + extra)}. How many rand over the combined budget did the business spend?`,
            'Unfavourable variance (R)',
            extra - saving,
            `Supplies save ${money(saving)}, but rent exceeds budget by ${money(extra)}. Net overspend = ${money(extra - saving)}.`,
            'Compare total actual expenses with total budgeted expenses.',
          );
    }
    case 'breakeven': {
      const price = 10 + n,
        variable = 6 + n,
        fixed = 200 + n * 20,
        profit = 80 + n * 4;
      return guided
        ? number(
            `A product sells for ${money(price)} and has ${money(variable)} variable cost per unit. Contribution per unit = Price − Variable cost. How much does each unit contribute toward fixed costs?`,
            'Contribution per unit (R)',
            4,
            `${money(price)} − ${money(variable)} = R4 per unit.`,
            'Subtract the variable cost of one unit from its selling price.',
          )
        : number(
            `A product sells for ${money(price)} with ${money(variable)} variable cost per unit. Fixed costs are ${money(fixed)}. How many units must sell to earn ${money(profit)} operating profit?`,
            'Units for target profit',
            (fixed + profit) / 4,
            `Each unit contributes R4. (${money(fixed)} + ${money(profit)}) ÷ R4 = ${(fixed + profit) / 4} units.`,
            'Contribution must cover both fixed costs and the target profit.',
          );
    }
    case 'deferrals': {
      const monthly = 100 + n * 10;
      return guided
        ? number(
            `A customer prepays ${money(monthly * 2)} for two equal months of service. Revenue per month = Prepayment ÷ Months. How much revenue is earned after delivering one month?`,
            'Revenue earned this month (R)',
            monthly,
            `${money(monthly * 2)} ÷ 2 = ${money(monthly)} earned for one month.`,
            'Only the delivered month is earned.',
          )
        : number(
            `A customer prepays ${money(monthly * 5)} for five equal months of service. Two months have been delivered. What deferred revenue liability remains?`,
            'Deferred revenue remaining (R)',
            monthly * 3,
            `Each month earns ${money(monthly)}. Three undelivered months remain: ${money(monthly * 3)} deferred revenue.`,
            'Find the monthly amount, then count the months still owed.',
          );
    }
    case 'consolidation': {
      const parent = 300 + n * 20,
        child = 200 + n * 10,
        internal = 50 + n * 5;
      return guided
        ? number(
            `A parent has ${money(parent)} sales, including ${money(internal)} to its wholly owned subsidiary. The subsidiary has ${money(child)} external sales. Group revenue = Parent sales + Subsidiary sales − Internal sales. What is group revenue?`,
            'Consolidated revenue (R)',
            parent + child - internal,
            `${money(parent)} + ${money(child)} − ${money(internal)} = ${money(parent + child - internal)}.`,
            'Remove the sale made inside the group.',
          )
        : number(
            `A parent reports ${money(parent)} sales and its wholly owned subsidiary reports ${money(child)} external sales. Consolidated revenue is ${money(parent + child - internal)}. The only elimination is a sale from parent to subsidiary. How much was that internal sale?`,
            'Internal sale (R)',
            internal,
            `Combined sales before elimination are ${money(parent + child)}. Subtract consolidated revenue to find ${money(internal)} internal sales.`,
            'Reverse the consolidation calculation to find the eliminated amount.',
          );
    }
    case 'journal-lab': {
      const monthly = 100 + n * 10;
      return guided
        ? account(
            `A shop borrows ${money(monthly)} cash from a bank. The loan is a liability, and liabilities increase with credits. Which account is credited?`,
            'Credit account',
            ['loan', 'bank loan', 'loan payable', 'loans payable'],
            'Debit Cash and credit Loan payable. Borrowing is a liability, not revenue.',
            'Name the liability owed to the bank.',
          )
        : {
            prompt: `A customer prepaid ${money(monthly * 3)} for three equal months of service, recorded as Deferred revenue. After delivering one month, name the debit and credit accounts and the amount of this adjusting entry.`,
            labels: ['Debit account', 'Credit account', 'Adjusting entry amount (R)'],
            answers: [
              ['deferred revenue', 'unearned revenue'],
              ['revenue', 'service revenue', 'income'],
              [String(monthly)],
            ],
            explanation: `Debit Deferred revenue ${money(monthly)} and credit Revenue ${money(monthly)} to recognise the delivered month.`,
            tip: 'Reduce the liability and recognise one month of earned revenue.',
          };
    }
    case 'spot-the-slip': {
      const monthly = 100 + n * 10;
      return guided
        ? account(
            `A shop buys an oven for ${money(monthly * 5)} and debits Rent expense. The oven is equipment that will be used for years. Which asset account should replace Rent expense?`,
            'Correct debit account',
            ['equipment', 'oven', 'machinery', 'kitchen equipment'],
            'Equipment is the asset purchased. Rent expense does not describe an oven.',
            'Use the account for long-lived business equipment.',
          )
        : {
            prompt: `A tutor received ${money(monthly * 3)} for three equal months and incorrectly recorded it all as Revenue. Only one month has been delivered. What should total Revenue and Deferred revenue be for this contract now?`,
            labels: ['Correct revenue (R)', 'Correct deferred revenue (R)'],
            answers: [[String(monthly)], [String(monthly * 2)]],
            explanation: `One month earns ${money(monthly)}; the remaining ${money(monthly * 2)} is a liability for service still owed.`,
            tip: 'Separate the delivered month from the two months still owed.',
          };
    }
    case 'cashflow': {
      const operating = 400 + n * 20,
        investing = 600 + n * 20,
        financing = 300 + n * 10;
      return guided
        ? account(
            `A shop collects ${money(operating)} cash from customers for goods sold. Customer collections are part of daily business operations. Is this operating, investing, or financing cash flow?`,
            'Cash flow category',
            ['operating', 'operating activity', 'operating activities'],
            'Collecting from customers is an operating cash inflow.',
            'Choose the category for everyday trading.',
          )
        : number(
            `A shop collects ${money(operating)} from customers, buys ${money(investing)} equipment with cash, and receives a ${money(financing)} bank loan. These are its only cash movements. What is the net cash increase?`,
            'Net cash increase (R)',
            operating - investing + financing,
            `${money(operating)} operating − ${money(investing)} investing + ${money(financing)} financing = ${money(operating - investing + financing)} increase.`,
            'Add inflows and subtract outflows across all three categories.',
          );
    }
    case 'recall': {
      const item = [
        [
          'A supplier invoice is unpaid. The business owes money to the supplier. Amounts owed are liabilities.',
          'liability',
          'liabilities',
        ],
        [
          'The business owns cash in its bank account. Resources the business controls are assets.',
          'asset',
          'assets',
        ],
        [
          'The owner’s residual share is what remains after liabilities are deducted from assets. That share is equity.',
          'equity',
          'owner’s equity',
        ],
      ][n % 3];
      return guided
        ? account(
            `${item[0]} Is this an asset, liability, or equity?`,
            'Account category',
            [item[1], item[2]],
            item[0],
            'Match the situation to resources owned, amounts owed, or the owner’s share.',
          )
        : {
            prompt: `A business repays ${money(100 + n * 10)} of bank-loan principal using cash. There is no interest. Which account category decreases for Cash, and which decreases for Loan payable?`,
            labels: ['Cash category', 'Loan payable category'],
            answers: [
              ['asset', 'assets'],
              ['liability', 'liabilities'],
            ],
            explanation:
              'Cash is an asset and Loan payable is a liability. Repaying principal reduces both; it does not create an expense.',
            tip: 'Classify each account separately. Principal repayment changes assets and liabilities.',
          };
    }
    default:
      throw new Error(`No adaptive questions for ${id}`);
  }
}
