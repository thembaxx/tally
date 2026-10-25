export const decisions = [
  {
    id: 'stock',
    title: 'Stock the shelf',
    detail: 'Buy 5 items for R100 cash.',
    cash: -100,
    profit: 0,
    debit: 'Inventory',
    credit: 'Cash',
    amount: 100,
    why: 'Unsold stock is an asset. Buying it swaps cash for inventory; the cost becomes an expense when the items sell.',
  },
  {
    id: 'sale',
    title: 'Make a cash sale',
    detail: 'Sell 1 item for R40. Its cost is R20.',
    cash: 40,
    profit: 20,
    debit: 'Cash',
    credit: 'Revenue',
    amount: 40,
    why: 'Record R40 revenue and R20 cost of sales. Cash rises R40, while profit rises only R20.',
  },
  {
    id: 'credit-sale',
    title: 'Let a customer pay later',
    detail: 'Sell 1 item for R40 on credit. Cost: R20.',
    cash: 0,
    profit: 20,
    debit: 'Trade receivables',
    credit: 'Revenue',
    amount: 40,
    why: 'The sale is earned now, so revenue and profit rise. Cash stays still; trade receivables records the R40 owed to you.',
  },
  {
    id: 'collect',
    title: 'Collect from a customer',
    detail: 'Receive R40 already owed to the shop.',
    cash: 40,
    profit: 0,
    debit: 'Cash',
    credit: 'Trade receivables',
    amount: 40,
    why: 'The revenue was recorded at the sale. Collecting the debt swaps a receivable for cash without earning revenue a second time.',
  },
  {
    id: 'loan',
    title: 'Borrow from the bank',
    detail: 'Receive a R500 loan.',
    cash: 500,
    profit: 0,
    debit: 'Cash',
    credit: 'Bank loan',
    amount: 500,
    why: 'Borrowing raises cash and a liability by the same amount. It is financing, not revenue, so it does not create profit.',
  },
  {
    id: 'repay',
    title: 'Repay the bank',
    detail: 'Pay back R100 of loan principal.',
    cash: -100,
    profit: 0,
    debit: 'Bank loan',
    credit: 'Cash',
    amount: 100,
    why: 'Repaying principal reduces cash and the loan liability. It is not an expense. This simulation leaves interest out.',
  },
  {
    id: 'rent',
    title: 'Pay the rent',
    detail: 'Pay R80 for this period’s shop space.',
    cash: -80,
    profit: -80,
    debit: 'Rent expense',
    credit: 'Cash',
    amount: 80,
    why: 'The shop has used the space this period. Rent is an expense, reducing cash, profit and equity by R80.',
  },
  {
    id: 'oven',
    title: 'Buy an oven',
    detail: 'Buy equipment for R600 cash.',
    cash: -600,
    profit: 0,
    debit: 'Equipment',
    credit: 'Cash',
    amount: 600,
    why: 'The oven will serve several periods. Buying it swaps one asset for another rather than expensing its entire cost today.',
  },
  {
    id: 'wear',
    title: 'Recognise wear and tear',
    detail: 'Record R10 depreciation on your oven.',
    cash: 0,
    profit: -10,
    debit: 'Depreciation expense',
    credit: 'Accumulated depreciation',
    amount: 10,
    why: 'Depreciation allocates equipment cost to this period. It reduces the asset’s carrying amount and profit, without a cash payment.',
  },
] as const;
export type DecisionId = (typeof decisions)[number]['id'];
export type Business = {
  cash: number;
  inventory: number;
  receivables: number;
  equipment: number;
  depreciation: number;
  loan: number;
  revenue: number;
  cost: number;
  rent: number;
};
export const openingBusiness: Business = {
  cash: 2000,
  inventory: 0,
  receivables: 0,
  equipment: 0,
  depreciation: 0,
  loan: 0,
  revenue: 0,
  cost: 0,
  rent: 0,
};
export function profit(b: Business) {
  return b.revenue - b.cost - b.rent - b.depreciation;
}
export function assets(b: Business) {
  return b.cash + b.inventory + b.receivables + b.equipment - b.depreciation;
}
export function unavailable(b: Business, id: DecisionId): string | null {
  const d = decisions.find((d) => d.id === id)!;
  if (b.cash + d.cash < 0) return 'You need more cash first.';
  if ((id === 'sale' || id === 'credit-sale') && b.inventory < 20) return 'Stock your shelf first.';
  if (id === 'collect' && b.receivables < 40) return 'Make a credit sale first.';
  if (id === 'repay' && b.loan < 100) return 'There is no R100 loan principal to repay.';
  if (id === 'oven' && b.equipment > 0) return 'Your shop already has an oven.';
  if (id === 'wear' && b.equipment - b.depreciation < 10)
    return 'You need equipment with at least R10 of remaining value.';
  return null;
}
export function transact(b: Business, id: DecisionId): Business {
  if (unavailable(b, id)) return b;
  const d = decisions.find((d) => d.id === id)!;
  const n = { ...b, cash: b.cash + d.cash };
  if (id === 'stock') n.inventory += 100;
  if (id === 'sale' || id === 'credit-sale') {
    n.inventory -= 20;
    n.cost += 20;
    n.revenue += 40;
  }
  if (id === 'credit-sale') n.receivables += 40;
  if (id === 'collect') n.receivables -= 40;
  if (id === 'loan') n.loan += 500;
  if (id === 'repay') n.loan -= 100;
  if (id === 'rent') n.rent += 80;
  if (id === 'oven') n.equipment += 600;
  if (id === 'wear') n.depreciation += 10;
  return n;
}
export function replay(ids: DecisionId[]): Business {
  return ids.reduce(transact, openingBusiness);
}
export function readTransactions(raw: unknown): DecisionId[] {
  if (!Array.isArray(raw)) return [];
  const ids: DecisionId[] = [];
  let b = openingBusiness;
  for (const id of raw.slice(0, 200)) {
    if (!decisions.some((d) => d.id === id)) continue;
    const next = transact(b, id);
    if (next !== b) {
      ids.push(id);
      b = next;
    }
  }
  return ids;
}
