'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import type { Lesson } from '@/lib/learning';
import {
  ArrowsOutSimpleIcon,
  CardsIcon,
  NotebookIcon,
  MagnifyingGlassIcon,
} from '@phosphor-icons/react';
const Scene = dynamic(() => import('./scene'), {
  ssr: false,
  loading: () => <div className="scene scene-loading" />,
});
export function ConceptExplorer({ lesson }: { lesson: Lesson }) {
  const id = lesson.id;
  const [value, setValue] = useState(
    id === 'debit'
      ? 500
      : id === 'statements'
        ? 400
        : id === 'depreciation'
          ? 1
          : id === 'ratios'
            ? 1500
            : id === 'budgeting'
              ? 450
              : id === 'inventory'
                ? 0
                : 0,
  );
  let labels = ['Assets', 'Liabilities + equity'],
    values = [100, 100],
    caption = 'Both sides tell the same story.',
    control = '',
    min = 0,
    max = 10,
    step = 1,
    readout = '';
  if (id === 'bakery') {
    return (
      <div className="activity-preview">
        <NotebookIcon weight="duotone" />
        <h3>From your first sale to balanced statements.</h3>
        <p>
          Follow the same cash, inventory, and equipment through journal entries, profit, and the
          balance sheet.
        </p>
        <span>6 connected activities · your own bakery</span>
      </div>
    );
  }
  if (lesson.format && id !== 'cashflow') {
    const Icon =
      lesson.format === 'journal'
        ? NotebookIcon
        : lesson.format === 'recall'
          ? CardsIcon
          : MagnifyingGlassIcon;
    return (
      <div className="activity-preview">
        <Icon weight="duotone" />
        <h3>
          {lesson.format === 'journal'
            ? 'One story. Two sides.'
            : lesson.format === 'recall'
              ? 'Give the idea a little room.'
              : 'Your curious eye is a superpower.'}
        </h3>
        <p>
          {lesson.format === 'journal'
            ? 'Pick the accounts, build the entry, and watch the two sides come together.'
            : lesson.format === 'recall'
              ? 'Try to remember. Turn the card. Bring the fuzzy ones back for another little look.'
              : 'Read a real-life story, spot what needs another look, and discover why.'}
        </p>
        <span>
          {lesson.format === 'recall'
            ? '3 cards · your pace · no pressure'
            : 'Try it next. Hints are always here.'}
        </span>
      </div>
    );
  }
  if (id === 'cashflow') {
    labels = ['Starting cash', 'Cash after this step'];
    values = [1000, [1000, 1500, 600, 1200][value]];
    control = 'Follow the cash story';
    min = 0;
    max = 3;
    readout = [
      'Start with $1,000 in cash',
      'Operating: collect $500 → $1,500 cash',
      'Investing: buy a $900 oven → $600 cash',
      'Financing: borrow $600 → $1,200 cash',
    ][value];
    caption = 'The same cash takes three different paths. The net change is +$200.';
  } else if (id === 'debit') {
    labels = ['Debit equipment', 'Credit cash'];
    values = [value, value];
    control = 'Laptop purchase ($)';
    min = 100;
    max = 1000;
    step = 100;
    caption = 'Every dollar debited is also credited. Both sides always match.';
    readout = `$${value} debit = $${value} credit`;
  } else if (id === 'statements') {
    labels = ['Revenue', 'Cost of goods sold', 'Gross profit'];
    values = [1000, value, 1000 - value];
    control = 'Ingredient costs ($)';
    min = 100;
    max = 900;
    step = 100;
    caption = 'Watch profit change while revenue stays the same.';
    readout = `$1,000 − $${value} = $${1000 - value} gross profit`;
  } else if (id === 'depreciation') {
    labels = ['Carrying value', 'Accumulated depreciation'];
    values = [1200 - value * 200, value * 200];
    control = 'Year of use';
    min = 0;
    max = 5;
    caption = 'The same $200 of cost moves to depreciation each year. Residual value remains $200.';
    readout = `Year ${value} · carrying value $${1200 - value * 200}`;
  } else if (id === 'ratios') {
    labels = ['Current assets', 'Current liabilities'];
    values = [3000, value];
    control = 'Current liabilities ($)';
    min = 500;
    max = 3000;
    step = 500;
    caption = 'The same assets offer a smaller cushion as short-term obligations grow.';
    readout = `$3,000 ÷ $${value.toLocaleString()} = ${(3000 / value).toFixed(1)}`;
  } else if (id === 'inventory') {
    labels = ['Inventory left', 'Cost of goods sold'];
    values = [50 - value * 2, value * 2];
    control = 'Notebooks sold (FIFO)';
    min = 0;
    max = 10;
    caption =
      'The first 10 notebooks cost $2 each. Selling them moves their cost from an asset to an expense.';
    readout = `${value} sold · $${value * 2} cost · $${50 - value * 2} inventory left`;
  } else if (id === 'budgeting') {
    labels = ['Budget', 'Actual spending'];
    values = [500, value];
    control = 'Actual supply spending ($)';
    min = 100;
    max = 700;
    step = 50;
    caption = 'A smaller actual expense is usually favorable. Ask whether quality stayed the same.';
    readout = `$${Math.abs(500 - value)} ${value > 500 ? 'over budget' : value < 500 ? 'under budget' : 'variance · on budget'}`;
  } else if (id === 'accruals') {
    labels = ['Revenue earned', 'Cash received', 'Still receivable'];
    values = [80, value === 0 ? 0 : 80, value === 0 ? 80 : 0];
    control = 'Move from March to April';
    min = 0;
    max = 1;
    caption = 'Revenue belongs in March. April collects the cash and clears the receivable.';
    readout =
      value === 0 ? 'March · $80 earned, $0 received' : 'April · $80 collected, $0 still owed';
  } else if (id === 'breakeven') {
    labels = ['Revenue', 'Total costs'];
    values = [value * 10, 200 + value * 6];
    control = 'Cups sold';
    min = 0;
    max = 100;
    step = 10;
    caption =
      'Each $10 cup contributes $4 after its $6 variable cost. The first 50 cups cover $200 of fixed costs.';
    readout = `${value} cups · $${value * 4 - 200} ${value * 4 >= 200 ? 'profit' : 'loss'}`;
  } else if (id === 'deferrals') {
    labels = ['Earned revenue', 'Still owed in service'];
    values = [value * 100, 600 - value * 100];
    control = 'Months delivered';
    min = 0;
    max = 6;
    caption = 'Cash arrived first. Revenue appears as each month of service is delivered.';
    readout = `Month ${value} · $${value * 100} earned · $${600 - value * 100} deferred`;
  } else if (id === 'consolidation') {
    labels = ['Combined sales', 'Group revenue'];
    values = [1500, 1500 - value];
    control = 'Sales within the group ($)';
    min = 0;
    max = 500;
    step = 100;
    caption =
      'A group cannot earn revenue by selling to itself. Eliminate internal sales to show the group as one entity.';
    readout = `$1,500 − $${value} internal = $${1500 - value} group revenue`;
  }
  if (id === 'equation')
    return (
      <div className="concept-explorer scale-explorer">
        <Scene compact />
        <div className="explorer-caption">
          <span className="mono">Assets = Liabilities + Equity</span>
          <small>Drag to turn the idea around. Pinch to get closer.</small>
        </div>
      </div>
    );
  return (
    <div className="concept-explorer">
      <div className="explorer-label">
        PLAY WITH THE IDEA <ArrowsOutSimpleIcon size={15} />
      </div>
      <Scene
        kind="bars"
        values={values}
        maxValue={
          {
            cashflow: 1600,
            debit: 1000,
            statements: 1000,
            depreciation: 1200,
            ratios: 3000,
            budgeting: 700,
            inventory: 50,
            accruals: 80,
            breakeven: 1000,
            deferrals: 600,
            consolidation: 1500,
          }[id] || 1500
        }
        compact
      />
      <div className="bar-legend">
        {labels.map((l, i) => (
          <span key={l}>
            <i style={{ background: ['#7a94ed', '#ba96e4', '#7ac6a1'][i % 3] }} />
            <span>
              {l}
              <strong className="mono">${values[i].toLocaleString()}</strong>
            </span>
          </span>
        ))}
      </div>
      <label className="explorer-control" htmlFor={`explorer-${id}`}>
        <span>
          {control}
          <b className="mono">{value.toLocaleString()}</b>
        </span>
        <input
          id={`explorer-${id}`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        />
      </label>
      <div className="explorer-readout mono" aria-live="polite">
        {readout}
      </div>
      <p>{caption}</p>
    </div>
  );
}
