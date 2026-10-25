export type CoachPlan = {
  simple: string;
  question: string;
  right: string;
  trap: string;
  misconception: string;
  worked: string;
  deeper: string;
};
const plan = (
  simple: string,
  question: string,
  right: string,
  trap: string,
  misconception: string,
  worked: string,
  deeper: string,
): CoachPlan => ({ simple, question, right, trap, misconception, worked, deeper });
export const coachPlans: Record<string, CoachPlan> = {
  equation: plan(
    'What the business owns comes from its owners or from borrowing.',
    'Why does borrowing R100 keep the equation balanced?',
    'Cash and the amount owed both rise by R100.',
    'Borrowing creates R100 of profit.',
    'Borrowing is not revenue.',
    'Before: assets R200 = debt R0 + equity R200. Borrow R100: assets R300 = debt R100 + equity R200.',
    'Equity is the residual claim: assets less liabilities. A balanced equation is necessary, but an incorrect entry can still balance.',
  ),
  debit: plan(
    'Debit means left. Credit means right. Which side grows an account depends on its type.',
    'Why is buying equipment with cash not automatically an expense?',
    'The business still owns value, now as equipment.',
    'Every payment is immediately an expense.',
    'A payment is not always an expense.',
    'Buy a R500 oven: debit Equipment R500; credit Cash R500. One asset rises as another falls.',
    'Assets and expenses increase with debits; liabilities, equity and revenue increase with credits. Balanced amounts alone do not prove the account choices are correct.',
  ),
  statements: plan(
    'Revenue is what you earn. Profit is what remains after the relevant costs.',
    'Why can a shop have revenue but no profit?',
    'Costs can use up all the revenue.',
    'Revenue and profit always mean the same thing.',
    'Revenue is not profit.',
    'Revenue R500 − cost of sales R200 = gross profit R300. Subtract rent R300: net profit R0.',
    'The income statement measures performance over a period. The balance sheet describes assets, liabilities and equity at a particular date.',
  ),
  accruals: plan(
    'Record work when it is earned, even if the customer pays later.',
    'Why record a sale before its cash arrives?',
    'The goods or service have already been delivered.',
    'Revenue is recorded only when cash arrives.',
    'Earning and collecting happen at different times.',
    'Earn R80 in March: debit Trade receivables; credit Revenue. Collect in April: debit Cash; credit Trade receivables.',
    'Accrual accounting separates economic activity from cash timing. A receivable is an asset, though uncertainty about collection may require an allowance.',
  ),
  inventory: plan(
    'Stock stays an asset until it is sold. Then its cost becomes cost of sales.',
    'Why is unsold stock not all cost of sales?',
    'The business still owns the unsold items.',
    'Everything purchased is already sold.',
    'Purchases and cost of sales are different.',
    'Buy 5 items at R20. Sell 2: cost of sales R40 and closing inventory R60. Under FIFO, the earliest costs leave first.',
    'FIFO is a cost-flow assumption. When costs rise, FIFO often produces lower cost of sales and higher closing inventory than weighted average; the physical stock need not move in that order.',
  ),
  depreciation: plan(
    'Spread equipment cost over the periods that benefit from using it.',
    'Why can depreciation reduce profit without reducing cash today?',
    'The cash was paid when the equipment was bought.',
    'Each depreciation entry is another cash payment.',
    'Depreciation is a non-cash expense.',
    'A R1 000 asset with R100 residual value over 3 years: (R1 000 − R100) ÷ 3 = R300 each year.',
    'Depreciation is cost allocation, not a direct estimate of market value. Accumulated depreciation reduces the asset’s carrying amount; useful life and residual value are estimates.',
  ),
  ratios: plan(
    'A ratio compares two amounts so you can judge them together.',
    'Why does a current ratio above 1 not guarantee cash is available?',
    'Current assets can include stock and unpaid customer debts.',
    'All current assets are cash already.',
    'Liquidity depends on asset quality and timing.',
    'Cash R100 + receivables R200 + inventory R300, against current liabilities R300: current ratio 2, but cash is only R100.',
    'Compare trends, cash conversion and industry context. A single ratio can hide overdue receivables or slow-moving inventory.',
  ),
  budgeting: plan(
    'A budget is a plan. Compare what happened with what you expected.',
    'Why investigate a favourable spending variance?',
    'Lower spending might mean less activity or missed maintenance.',
    'Spending less is always better.',
    'A favourable variance needs context.',
    'Budget R500 for 100 units; spend R400 for 60 units. Spending is lower, but cost per unit rose from R5 to about R6,67.',
    'Separate volume effects from price and efficiency effects. Flexible budgets compare actual activity with an adjusted budget rather than a fixed original volume.',
  ),
  cashflow: plan(
    'Follow cash separately from profit: operations, long-term assets and financing.',
    'Why is a loan receipt a financing cash flow?',
    'It funds the business and creates an obligation to repay.',
    'All cash receipts are sales revenue.',
    'Cash receipts are not all revenue.',
    'Borrow R500: financing inflow R500, cash +R500, loan +R500, profit unchanged.',
    'The indirect operating cash-flow method adjusts profit for non-cash items and working-capital movements. Classification can depend on the reporting framework and transaction details.',
  ),
  breakeven: plan(
    'Each sale helps pay fixed costs after covering its own variable cost.',
    'Why use contribution rather than selling price to find break-even units?',
    'Each unit has variable costs to cover first.',
    'The whole selling price pays fixed costs.',
    'Revenue per unit is not contribution.',
    'Price R50 − variable cost R30 = contribution R20. Fixed costs R200 ÷ R20 = 10 break-even units.',
    'This model assumes a relevant range with stable price, variable cost and sales mix. Round required whole units up; real capacity constraints may change the result.',
  ),
  deferrals: plan(
    'Cash can arrive before revenue is earned. Until delivery, the business still owes something.',
    'Why is a customer deposit initially a liability?',
    'The business still owes the promised goods or service.',
    'Receiving cash means the work is already earned.',
    'A deposit is not necessarily earned revenue.',
    'Receive R300 for 3 future sessions: debit Cash; credit Deferred revenue R300. Deliver one: debit Deferred revenue; credit Revenue R100.',
    'Revenue recognition follows satisfied performance obligations, not simply cash timing. Contracts can contain several obligations and require judgement.',
  ),
  consolidation: plan(
    'A group reports as one economic business. Remove transactions it made with itself.',
    'Why remove a sale between two group companies?',
    'The group has not sold to an outside customer yet.',
    'The group earns extra revenue by selling to itself.',
    'Internal sales are not external group revenue.',
    'Parent sells goods to subsidiary for R100: eliminate the internal sale and matching purchase. If unsold outside the group, also remove any unrealised internal profit.',
    'Consolidation depends on control, not only ownership percentage. Goodwill, non-controlling interests and fair-value adjustments require additional steps beyond this simplified example.',
  ),
};
coachPlans.bakery = coachPlans.statements;
coachPlans['journal-lab'] = coachPlans.debit;
coachPlans['spot-the-slip'] = coachPlans.equation;
coachPlans.recall = coachPlans.equation;
coachPlans.reconcile = plan(
  'Two records can disagree because of timing or a missing entry. Explain each difference before changing the books.',
  'Why should a deposit in transit not be recorded in the cash book again?',
  'It is already in the cash book; the bank has not processed it yet.',
  'Every difference needs a new cash book entry.',
  'Timing differences do not always need journal entries.',
  'Bank statement R750 + deposit in transit R200 = R950. Cash book R1 000 − unrecorded fee R50 = R950.',
  'Reconciliation is an internal control. Investigate unexplained differences rather than inserting a balancing figure. Outstanding payments and deposits affect the adjusted bank side; bank charges and omitted receipts can require book entries.',
);
coachPlans.repair = coachPlans.debit;
coachPlans['cash-case'] = coachPlans.accruals;
export const glossary = [
  [
    'Asset',
    'A resource controlled by the business that is expected to provide future economic benefit. Examples: cash, equipment and inventory.',
  ],
  [
    'Liability',
    'A present obligation the business must settle, such as a bank loan or an amount owed to a supplier.',
  ],
  [
    'Equity',
    'The owners’ residual share: assets minus liabilities. Retained profit increases equity; losses and drawings reduce it.',
  ],
  [
    'Debit & credit',
    'Debit is the left side of an account; credit is the right. Neither word means good or bad. Which increases an account depends on its type.',
  ],
  [
    'Revenue',
    'Income earned from the business’s ordinary activities, such as selling goods or delivering services. It can be earned before cash arrives.',
  ],
  [
    'Profit',
    'Income minus the relevant expenses for a period. Gross profit subtracts cost of sales; net profit also subtracts other expenses.',
  ],
  [
    'Trade receivables',
    'Amounts customers owe for goods or services already delivered. Also called debtors.',
  ],
  [
    'Trade payables',
    'Amounts owed to suppliers for goods or services received. Also called creditors.',
  ],
  [
    'Cost of sales',
    'The cost of the inventory sold during the period. Unsold inventory remains an asset.',
  ],
  [
    'Accrual',
    'Record an economic event when earned or incurred, even if the cash moves in a different period.',
  ],
  [
    'Depreciation',
    'Allocating an asset’s depreciable cost over its useful life. It is not another cash payment.',
  ],
  [
    'Bank reconciliation',
    'Explain differences between the bank statement and the business’s cash book, including timing differences and missing entries.',
  ],
  [
    'Income statement',
    'Also called the statement of profit or loss. It reports income and expenses over a period.',
  ],
  [
    'Balance sheet',
    'Also called the statement of financial position. It reports assets, liabilities and equity at a particular date.',
  ],
] as const;
