import type { ProjectId } from './experiences';
export type ProjectStep = {
  title: string;
  story: string;
  label: string;
  answers: string[];
  tip: string;
  explanation: string;
};
export const projects: {
  id: ProjectId;
  name: string;
  description: string;
  color: string;
  steps: ProjectStep[];
}[] = [
  {
    id: 'reconcile',
    name: 'Where did the R50 go?',
    description: 'Reconcile a bank statement and separate timing differences from missing entries.',
    color: 'blue',
    steps: [
      {
        title: 'Two records, one bank account',
        story:
          'The cash book shows R1 000. The bank statement shows R750. A R200 deposit is still in transit, and a R50 bank fee appears only on the statement. No other differences exist.',
        label: 'Adjusted bank balance (R)',
        answers: ['950'],
        tip: 'Add the deposit in transit to the bank statement balance. The bank has not recorded it yet.',
        explanation:
          'R750 + R200 = R950. The deposit is already in your books, so do not record it twice.',
      },
      {
        title: 'Update the books',
        story:
          'Your cash book is still R1 000. Record the R50 fee that the bank has already charged. The adjusted bank balance is R950.',
        label: 'Corrected cash book balance (R)',
        answers: ['950'],
        tip: 'The bank fee reduces the cash book balance.',
        explanation:
          'R1 000 − R50 = R950. Now both adjusted balances agree. The fee needs an entry; the deposit in transit needs time.',
      },
      {
        title: 'Make the missing entry',
        story:
          'The bank deducted R50 in fees. Cash has decreased. Which account should be debited for the fee?',
        label: 'Debit account',
        answers: [
          'bank charges',
          'bank fees',
          'bank fee',
          'bank charges expense',
          'bank fees expense',
        ],
        tip: 'Name the expense the business incurred.',
        explanation:
          'Debit Bank charges expense R50; credit Cash/Bank R50. Reconciliation identifies both timing differences and missing entries.',
      },
    ],
  },
  {
    id: 'repair',
    name: 'The balanced mistake',
    description: 'A ledger can balance and still be wrong. Find the error and repair it.',
    color: 'peach',
    steps: [
      {
        title: 'Something does not belong',
        story:
          'A R600 oven purchase was recorded as debit Rent expense R600, credit Cash R600. The oven will be used for several years. Which account should have been debited?',
        label: 'Correct asset account',
        answers: ['equipment', 'oven', 'kitchen equipment'],
        tip: 'What resource did the business receive?',
        explanation:
          'Equipment should increase. Equal debits and credits do not prove the accounts are appropriate.',
      },
      {
        title: 'Repair without paying twice',
        story:
          'Cash was correctly credited R600 in the original entry. Correct the error by debiting Equipment R600. Which account must you credit?',
        label: 'Correction credit account',
        answers: ['rent', 'rent expense', 'rental expense'],
        tip: 'Reverse the incorrect debit. Leave the cash entry alone.',
        explanation:
          'Debit Equipment R600, credit Rent expense R600. Crediting Cash again would record a payment that never happened.',
      },
      {
        title: 'Follow the effect',
        story:
          'Reported profit before the correction was R200. Remove the mistaken R600 rent expense. Ignore depreciation for this exercise.',
        label: 'Corrected profit (R)',
        answers: ['800'],
        tip: 'Removing an expense increases profit.',
        explanation:
          'R200 + R600 = R800. Equipment and equity both rise by R600; cash is unchanged by the correction.',
      },
    ],
  },
  {
    id: 'cash-case',
    name: 'Profitable. But out of cash?',
    description: 'Investigate why a busy shop cannot pay its bills.',
    color: 'mint',
    steps: [
      {
        title: 'A good month on paper',
        story:
          'A shop earns R1 000 revenue on credit, with R400 cost of sales and R200 rent expense. None of the customers have paid yet.',
        label: 'Net profit (R)',
        answers: ['400'],
        tip: 'Revenue minus cost of sales minus rent.',
        explanation:
          'R1 000 − R400 − R200 = R400 profit. Accrual accounting records the sale when earned, even before collection.',
      },
      {
        title: 'Follow actual cash',
        story:
          'Opening cash was R500. The shop paid R400 for the goods sold and R200 rent. Customers paid R0. There are no other cash movements.',
        label: 'Cash shortfall (R)',
        answers: ['100'],
        tip: 'Payments total R600. Compare that with the R500 available.',
        explanation:
          'R500 + R0 − R400 − R200 = −R100: a R100 funding shortfall, rather than R400 spendable profit. Without an agreed overdraft or other funding, it cannot make all these payments.',
      },
      {
        title: 'Release cash already earned',
        story:
          'The shop arranges temporary funding. Now a customer pays R300 of the existing receivable. How much NEW revenue does this collection create?',
        label: 'New revenue (R)',
        answers: ['0', 'zero', 'none'],
        tip: 'The sale was already recorded when earned.',
        explanation:
          'R0 new revenue. Cash rises R300 and trade receivables fall R300. Collecting customers’ debts can improve liquidity without changing profit.',
      },
    ],
  },
];
