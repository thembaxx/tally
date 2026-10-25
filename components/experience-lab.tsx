'use client';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { motion, useReducedMotion } from 'motion/react';
import {
  StorefrontIcon,
  DetectiveIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CheckIcon,
  ArrowCounterClockwiseIcon,
} from '@phosphor-icons/react';
import {
  decisions,
  openingBusiness,
  replay,
  unavailable,
  profit,
  assets,
  type DecisionId,
} from '@/lib/business';
import type { Experiences, ProjectId } from '@/lib/experiences';
import { projects } from '@/lib/projects';
import { accepts } from '@/lib/learning';
import { money, learningContext } from '@/lib/south-africa';
import { Modal } from './modal';
import { Segmented } from './ui/controls';
import { Blob } from './brand';
import { CoachScope, ExplanationTools } from './learning-coach';
import { AnswerFeedback } from './answer-feedback';
const Scene = dynamic(() => import('./scene'), {
  ssr: false,
  loading: () => <div className="scene scene-loading" />,
});
export type UpdateExperience = (change: (old: Experiences) => Experiences) => void;
export function ExperienceLab({
  data,
  update,
  feedback,
}: {
  data: Experiences;
  update: UpdateExperience;
  feedback: (correct: boolean) => void;
}) {
  const [screen, setScreen] = useState<'shop' | 'projects' | null>(null);
  return (
    <section className="experience-lab">
      <div className="section-heading">
        <div>
          <span className="eyebrow">LEARN BY LIVING IT</span>
          <h2>Make it your business.</h2>
          <p>Try a decision. Follow its story through the accounts.</p>
        </div>
      </div>
      <div className="experience-launchers">
        <button className="experience-launch shop-launch" onClick={() => setScreen('shop')}>
          <span className="experience-icon">
            <StorefrontIcon size={34} weight="duotone" />
          </span>
          <span className="eyebrow">YOUR LITTLE BUSINESS</span>
          <strong>Big ideas. Little shop.</strong>
          <span>Buy, sell, borrow — see every connection.</span>
          <span className="experience-link">
            {data.transactions.length ? 'Return to my shop' : 'Open my shop'} <ArrowRightIcon />
          </span>
        </button>
        <button className="experience-launch project-launch" onClick={() => setScreen('projects')}>
          <span className="experience-icon">
            <DetectiveIcon size={34} weight="duotone" />
          </span>
          <span className="eyebrow">CASE FILES</span>
          <strong>Put the pieces together.</strong>
          <span>Three small projects. Real accounting puzzles.</span>
          <span className="experience-link">
            Explore projects <ArrowRightIcon />
          </span>
        </button>
      </div>
      <Modal
        open={screen !== null}
        onClose={() => setScreen(null)}
        title={screen === 'shop' ? 'Your little shop' : 'Accounting case files'}
        wide
      >
        {screen === 'shop' ? (
          <BusinessSandbox data={data} update={update} feedback={feedback} />
        ) : screen === 'projects' ? (
          <ProjectRoom data={data} update={update} feedback={feedback} />
        ) : null}
      </Modal>
    </section>
  );
}
function Metric({ name, value }: { name: string; value: number }) {
  return (
    <div>
      <span>{name}</span>
      <strong className="mono">{money(value)}</strong>
    </div>
  );
}
function BusinessSandbox({
  data,
  update,
  feedback,
}: {
  data: Experiences;
  update: UpdateExperience;
  feedback: (correct: boolean) => void;
}) {
  const [tab, setTab] = useState('play');
  const [inspect, setInspect] = useState<'stock' | 'cash' | 'oven' | null>(null);
  const [pending, setPending] = useState<DecisionId | null>(null);
  const [prediction, setPrediction] = useState('');
  const [receipt, setReceipt] = useState<{ id: DecisionId; correct: boolean } | null>(null);
  const [reset, setReset] = useState(false);
  const still = useReducedMotion();
  const b = replay(data.transactions);
  const d = decisions.find((d) => d.id === pending);
  const sign = (n: number) => (n > 0 ? 'up' : n < 0 ? 'down' : 'same');
  const predictions = [
    { id: 'up', label: 'Profit rises' },
    { id: 'same', label: 'Profit stays the same' },
    { id: 'down', label: 'Profit falls' },
  ];
  function commit() {
    if (!d || !prediction || unavailable(b, d.id) || data.transactions.length >= 200) return;
    const correct = prediction === sign(d.profit);
    feedback(correct);
    setReceipt({ id: d.id, correct });
    update((old) =>
      old.transactions.length >= 200 || unavailable(replay(old.transactions), d.id)
        ? old
        : {
            ...old,
            transactions: [...old.transactions, d.id],
            awards: [...new Set([...old.awards, `shop-${d.id}`])],
          },
    );
    setPending(null);
    setPrediction('');
  }
  const last = receipt && decisions.find((d) => d.id === receipt.id);
  const operating = data.transactions.reduce(
    (n, id) =>
      n +
      (['stock', 'sale', 'collect', 'rent'].includes(id)
        ? decisions.find((d) => d.id === id)!.cash
        : 0),
    0,
  );
  const investing = data.transactions.filter((id) => id === 'oven').length * -600;
  const financing = data.transactions.reduce(
    (n, id) => n + (id === 'loan' ? 500 : id === 'repay' ? -100 : 0),
    0,
  );
  return (
    <div className="business-sandbox">
      <div className="shop-intro">
        <span className="eyebrow">A SAFE PLACE TO EXPERIMENT</span>
        <h2>
          Small shop.
          <br />
          <em>Big connections.</em>
        </h2>
        <p>You invested R2 000. What happens next is up to you.</p>
      </div>
      <div className="shop-world">
        <Scene
          kind="shop"
          values={[b.inventory / 20, b.cash, b.equipment]}
          minimalControls
          onInspect={setInspect}
        />
        <span className="shop-world-label">THE TALLY TUCK SHOP</span>
      </div>
      <div className="shop-inspect" role="group" aria-label="Inspect the shop">
        {(['stock', 'cash', 'oven'] as const).map((part) => (
          <button
            key={part}
            className="text-button"
            aria-pressed={inspect === part}
            onClick={() => setInspect(part)}
          >
            Inspect {part === 'cash' ? 'till' : part}
          </button>
        ))}
      </div>
      {inspect && (
        <p className="inspection-note" role="status">
          {inspect === 'stock'
            ? `The shelf holds ${b.inventory / 20} items at R20 cost each. Unsold stock is an asset, not yet an expense.`
            : inspect === 'cash'
              ? `The till has ${money(b.cash)}. Cash can come from sales, customer collections or loans; it is different from profit.`
              : b.equipment
                ? `Your oven cost R600. After ${money(b.depreciation)} accumulated depreciation, its carrying amount is ${money(b.equipment - b.depreciation)}.`
                : 'There is no oven yet. Buying one adds equipment and reduces cash; its cost is allocated over use through depreciation.'}
        </p>
      )}
      <div className="shop-metrics" aria-label="Shop balances">
        <Metric name="Cash available" value={b.cash} />
        <Metric name="Profit this period" value={profit(b)} />
        <Metric name="Stock at cost" value={b.inventory} />
      </div>
      <Segmented
        label="Explore your business"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'play', label: 'Decisions' },
          { id: 'journal', label: 'Journal' },
          { id: 'statements', label: 'Statements' },
        ]}
      />
      {tab === 'play' && (
        <>
          <div className="tutor-tip">
            <Blob small />
            <p>
              Predict first, then watch cash and profit tell different stories. Each new kind of
              decision earns 5 XP once.
            </p>
          </div>
          {receipt && last && (
            <motion.div
              key={data.transactions.length}
              initial={still ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="shop-receipt"
              role="status"
            >
              <span className="eyebrow">
                {receipt.correct ? 'YOU SAW IT COMING' : 'A CONNECTION TO NOTICE'}
              </span>
              <h3>{last.title}</h3>
              <p>{last.why}</p>
              <div className="receipt-effects">
                <span>
                  Cash{' '}
                  <b className="mono">
                    {last.cash > 0 ? '+' : ''}
                    {money(last.cash)}
                  </b>
                </span>
                <span>
                  Profit{' '}
                  <b className="mono">
                    {last.profit > 0 ? '+' : ''}
                    {money(last.profit)}
                  </b>
                </span>
              </div>
              <button className="text-button" onClick={() => setTab('journal')}>
                Trace the journal entry <ArrowRightIcon />
              </button>
            </motion.div>
          )}
          {d ? (
            <div className="prediction-panel">
              <button
                className="text-button"
                onClick={() => {
                  setPending(null);
                  setPrediction('');
                }}
              >
                <ArrowLeftIcon /> Choose another decision
              </button>
              <h3>{d.title}</h3>
              <p>{d.detail}</p>
              <fieldset>
                <legend>What will happen to profit?</legend>
                <div className="prediction-options">
                  {predictions.map((p) => (
                    <button
                      key={p.id}
                      aria-pressed={prediction === p.id}
                      onClick={() => setPrediction(p.id)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <button className="button primary full" disabled={!prediction} onClick={commit}>
                Try this decision <ArrowRightIcon />
              </button>
              <p className="fine">
                A prediction helps you learn. It never blocks you from exploring.
              </p>
            </div>
          ) : (
            <div className="decision-grid">
              {decisions.map((d) => {
                const reason =
                  unavailable(b, d.id) ||
                  (data.transactions.length >= 200
                    ? 'Start a fresh shop to keep exploring.'
                    : null);
                return (
                  <button
                    key={d.id}
                    disabled={!!reason}
                    onClick={() => {
                      setReceipt(null);
                      setPending(d.id);
                    }}
                  >
                    <strong>{d.title}</strong>
                    <span>{reason || d.detail}</span>
                    {data.awards.includes(`shop-${d.id}`) && <CheckIcon aria-label="Explored" />}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
      {tab === 'journal' && (
        <section className="shop-ledger">
          <h3>Every move has two sides.</h3>
          <p className="fine">Newest first. Each entry’s debits equal its credits.</p>
          {data.transactions
            .map((id) => decisions.find((d) => d.id === id)!)
            .reverse()
            .map((d, i) => (
              <div className="journal-receipt" key={`${i}-${d.id}`}>
                <strong>
                  {data.transactions.length - i}. {d.title}
                </strong>
                <dl>
                  <dt>Debit · {d.debit}</dt>
                  <dd>{money(d.amount)}</dd>
                  <dt>Credit · {d.credit}</dt>
                  <dd>{money(d.amount)}</dd>
                  {(d.id === 'sale' || d.id === 'credit-sale') && (
                    <>
                      <dt>Debit · Cost of sales</dt>
                      <dd>R20</dd>
                      <dt>Credit · Inventory</dt>
                      <dd>R20</dd>
                    </>
                  )}
                </dl>
              </div>
            ))}
          <div className="journal-receipt">
            <strong>Opening investment</strong>
            <dl>
              <dt>Debit · Cash</dt>
              <dd>R2 000</dd>
              <dt>Credit · Owner’s capital</dt>
              <dd>R2 000</dd>
            </dl>
          </div>
        </section>
      )}
      {tab === 'statements' && (
        <div className="shop-statements">
          <Statement
            title="Statement of profit or loss"
            subtitle="Since your shop opened"
            rows={[
              ['Revenue', b.revenue],
              ['Cost of sales', -b.cost],
              ['Gross profit', b.revenue - b.cost],
              ['Rent expense', -b.rent],
              ['Depreciation', -b.depreciation],
              ['Net profit', profit(b)],
            ]}
          />
          <Statement
            title="Statement of financial position"
            subtitle="Your shop right now · also called the balance sheet"
            rows={[
              ['Cash', b.cash],
              ['Trade receivables', b.receivables],
              ['Inventory', b.inventory],
              ['Equipment, net of depreciation', b.equipment - b.depreciation],
              ['Total assets', assets(b)],
              ['Bank loan', b.loan],
              ['Owner’s capital + retained profit', 2000 + profit(b)],
              ['Total liabilities + equity', b.loan + 2000 + profit(b)],
            ]}
          />
          <p className="balanced-note">
            <CheckIcon /> Balanced: Assets {money(assets(b))} = Liabilities {money(b.loan)} + Equity{' '}
            {money(2000 + profit(b))}
          </p>
          <Statement
            title="Cash flow"
            subtitle="Cash movements since opening · direct method"
            rows={[
              ['Opening cash', openingBusiness.cash],
              ['Operating activities', operating],
              ['Investing activities', investing],
              ['Financing activities', financing],
              ['Closing cash', b.cash],
            ]}
          />
        </div>
      )}
      <ExplanationTools id="bakery" />
      <p className="fine">
        {learningContext} One simplified period, with no VAT, interest, tax or drawings.
        Depreciation is an illustrative R10 allocation per decision. {data.transactions.length}/200
        decisions saved.
      </p>
      {reset ? (
        <div className="reset-confirm">
          <p>
            Start a fresh shop? Your saved transactions will be cleared. Earned XP stays; decisions
            cannot earn it twice.
          </p>
          <button
            className="small-button"
            onClick={() => {
              update((old) => ({ ...old, transactions: [] }));
              setReset(false);
              setReceipt(null);
              setPending(null);
            }}
          >
            Start fresh
          </button>
          <button className="text-button" onClick={() => setReset(false)}>
            Keep my shop
          </button>
        </div>
      ) : (
        <button className="text-button" onClick={() => setReset(true)}>
          <ArrowCounterClockwiseIcon /> Start a fresh shop
        </button>
      )}
    </div>
  );
}
function Statement({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: [string, number][];
}) {
  return (
    <section className="statement-card">
      <h3>{title}</h3>
      <p className="fine">{subtitle}</p>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd className="mono">{money(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
function ProjectRoom({
  data,
  update,
  feedback,
}: {
  data: Experiences;
  update: UpdateExperience;
  feedback: (correct: boolean) => void;
}) {
  const [id, setId] = useState<ProjectId | null>(null);
  const [value, setValue] = useState('');
  const [correct, setCorrect] = useState<boolean | null>(null);
  const p = projects.find((p) => p.id === id);
  const index = id ? data.projects[id] || 0 : 0;
  const step = p?.steps[index];
  if (!p)
    return (
      <div className="project-shelf">
        <p>
          Three decisions per case. Hints and explanations are always here. Pick any case; your
          place is saved.
        </p>
        {projects.map((p) => (
          <button
            key={p.id}
            className={`project-card ${p.color}`}
            onClick={() => {
              setId(p.id);
              setValue('');
              setCorrect(null);
            }}
          >
            <span className="eyebrow">CASE {projects.indexOf(p) + 1} · 5 MIN</span>
            <strong>{p.name}</strong>
            <span>{p.description}</span>
            <span className="experience-link">
              {data.projects[p.id] === 3
                ? 'Case solved'
                : data.projects[p.id]
                  ? `Resume · ${data.projects[p.id]}/3`
                  : 'Open case'}{' '}
              <ArrowRightIcon />
            </span>
          </button>
        ))}
      </div>
    );
  return (
    <div className="project-room">
      <button className="text-button" onClick={() => setId(null)}>
        <ArrowLeftIcon /> All case files
      </button>
      {step ? (
        <CoachScope
          id={p.id}
          evidence={data.coaching[p.id]}
          save={(id, evidence) =>
            update((old) => ({ ...old, coaching: { ...old.coaching, [id]: evidence } }))
          }
        >
          <span className="eyebrow">
            {p.name} · {index + 1} OF 3
          </span>
          <h2>{step.title}</h2>
          <p className="project-story">{step.story}</p>
          <div className="case-evidence" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <span key={i} className={i < index ? 'complete' : i === index ? 'current' : ''}>
                {i < index ? <CheckIcon /> : `0${i + 1}`}
              </span>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const ok = accepts(value, step.answers);
              setCorrect(ok);
              feedback(ok);
            }}
          >
            <label>
              {step.label}
              <input
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setCorrect(null);
                }}
                inputMode={step.label.includes('(R)') ? 'decimal' : 'text'}
                autoComplete="off"
                maxLength={100}
                disabled={correct === true}
              />
            </label>
            <button className="button primary full" disabled={!value.trim() || correct === true}>
              Check my reasoning <CheckIcon />
            </button>
          </form>
          {correct !== null && (
            <AnswerFeedback
              correct={correct}
              text={correct ? step.explanation : step.tip}
              onNext={() => {
                const final = index === 2;
                update((old) => ({
                  ...old,
                  projects: {
                    ...old.projects,
                    [p.id]: Math.max(old.projects[p.id] || 0, index + 1),
                  },
                  awards: final ? [...new Set([...old.awards, p.id])] : old.awards,
                }));
                setValue('');
                setCorrect(null);
              }}
            />
          )}
          <details className="coach-tools">
            <summary>Give me a clue</summary>
            <p>{step.tip}</p>
          </details>
          <p className="fine">{learningContext} Case completion earns 30 XP once.</p>
        </CoachScope>
      ) : (
        <div className="case-complete">
          <Blob happy />
          <span className="eyebrow">CASE CLOSED</span>
          <h2>You followed the evidence.</h2>
          <p>Your accounts tell a clearer story now. Your progress is saved.</p>
          <button
            className="button primary full"
            onClick={() => {
              update((old) => ({ ...old, projects: { ...old.projects, [p.id]: 0 } }));
              setCorrect(null);
              setValue('');
            }}
          >
            Try the case again
          </button>
          <p className="fine">Repeat cases keep your understanding fresh; XP is earned once.</p>
        </div>
      )}
    </div>
  );
}
