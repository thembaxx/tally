import type { Metadata } from 'next';
import { brand } from './site';
import type { Lesson } from './learning';

const topics: Record<string, string> = {
  equation: 'The accounting equation: assets, liabilities and equity',
  debit: 'Debits and credits, explained with a laptop',
  statements: 'How to read an income statement',
  accruals: 'Accrual accounting: when income is earned',
  inventory: 'FIFO inventory and cost of goods sold',
  depreciation: 'Straight-line depreciation, one step at a time',
  ratios: 'Financial ratios: understanding the current ratio',
  budgeting: 'Budget variance: compare your plan with reality',
  cashflow: 'Cash flow: operating, investing and financing',
  breakeven: 'Break-even analysis and contribution margin',
  deferrals: 'Deferred revenue: cash received before it is earned',
  consolidation: 'Consolidated statements: one group, one story',
  recall: 'Accounting flashcards and retrieval practice',
  'journal-lab': 'How to build a balanced journal entry',
  'spot-the-slip': 'Find accounting errors beyond balanced totals',
  bakery: 'Run a bakery: journal entries, profit and the balance sheet',
};

export const guideTitle = (lesson: Lesson) => topics[lesson.id] || lesson.title;

export function pageMetadata(title: string, description: string, path: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      url: path,
      title: `${title} · Tally`,
      description,
      siteName: brand.name,
      images: [{ url: brand.image, width: 1200, height: 630, alt: brand.imageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} · Tally`,
      description,
      images: [{ url: brand.image, alt: brand.imageAlt }],
    },
  };
}
