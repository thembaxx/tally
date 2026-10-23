'use client';
import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ArrowRightIcon,
  ArrowCounterClockwiseIcon,
  CheckIcon,
  LightbulbIcon,
  HandTapIcon,
  ArrowsLeftRightIcon,
  CardsIcon,
  MagnifyingGlassIcon,
  NotebookIcon,
} from '@phosphor-icons/react';
import type { ChoiceChallenge, JournalChallenge, RecallCard } from '@/lib/activity-types';
import { accepts } from '@/lib/learning';
import { AnswerFeedback } from './answer-feedback';
import { Blob } from './brand';
const Scene = dynamic(() => import('./scene'), {
  ssr: false,
  loading: () => <div className="scene scene-loading" />,
});
type TaskCallbacks = {
  onNext: () => void;
  onMistake: () => void;
  feedback: (success: boolean) => void;
};
function Nudge({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="text-button hint-button"
        data-tally-sound="hint"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <LightbulbIcon weight="duotone" />
        {open ? 'Keep going' : 'A little nudge?'}
      </button>
      {open && (
        <div className="tutor-tip">
          <Blob small />
          <p>{text}</p>
        </div>
      )}
    </>
  );
}
export function ChoiceTask({
  challenge: c,
  onNext,
  onMistake,
  feedback,
}: TaskCallbacks & { challenge: ChoiceChallenge }) {
  const [answer, setAnswer] = useState<string | null>(null);
  const correct = answer === c.correct;
  const option = c.options.find((o) => o.id === answer);
  const still = useReducedMotion();
  function choose(id: string) {
    if (correct) return;
    setAnswer(id);
    feedback(id === c.correct);
    if (id !== c.correct) onMistake();
  }
  return (
    <div className="choice-task">
      <div className="activity-kicker">
        <MagnifyingGlassIcon weight="duotone" /> LOOK A LITTLE CLOSER
      </div>
      <h2>{c.title}</h2>
      <div className="story-slip">
        <span className="story-tab">THE STORY</span>
        <p>{c.story}</p>
        <span className="story-perforation" />
      </div>
      <h3 className="activity-question">{c.question}</h3>
      <div className="story-options">
        {c.options.map((o, i) => (
          <motion.button
            key={o.id}
            type="button"
            disabled={correct}
            aria-pressed={answer === o.id}
            className={`story-option ${answer === o.id ? (correct ? 'selected correct' : 'selected retry') : ''}`}
            whileHover={still ? {} : { x: 3 }}
            whileTap={still ? {} : { scale: 0.985 }}
            onClick={() => choose(o.id)}
          >
            <span className="option-letter mono">{String.fromCharCode(65 + i)}</span>
            <span>{o.label}</span>
            <span className="option-check">
              {answer === o.id && correct ? <CheckIcon weight="bold" /> : <ArrowRightIcon />}
            </span>
          </motion.button>
        ))}
      </div>
      {option && <AnswerFeedback correct={correct} text={option.explanation} onNext={onNext} />}
      <Nudge text={c.tip} />
    </div>
  );
}
export function JournalTask({
  challenge: c,
  onNext,
  onMistake,
  feedback,
}: TaskCallbacks & { challenge: JournalChallenge }) {
  const [selected, setSelected] = useState<string | null>(null);
  const [accounts, setAccounts] = useState({ debit: '', credit: '' });
  const [amounts, setAmounts] = useState({ debit: '', credit: '' });
  const [result, setResult] = useState<boolean | null>(null);
  const creditRef = useRef<HTMLInputElement>(null);
  const locked = result === true;
  const parse = (s: string) => Number(s.replace(/[$£€,]/g, '')) || 0;
  const debitTotal = parse(amounts.debit),
    creditTotal = parse(amounts.credit);
  const balanced = debitTotal > 0 && debitTotal === creditTotal;
  function put(side: 'debit' | 'credit', account = selected) {
    if (!account || locked || !c.accounts.includes(account)) return;
    setAccounts((v) => ({ ...v, [side]: account }));
    setSelected(null);
    setResult(null);
  }
  function check(e: React.FormEvent) {
    e.preventDefault();
    const ok =
      accounts.debit === c.debit &&
      accounts.credit === c.credit &&
      accepts(amounts.debit, [String(c.amount)]) &&
      accepts(amounts.credit, [String(c.amount)]);
    setResult(ok);
    feedback(ok);
    if (!ok) onMistake();
  }
  return (
    <div className="journal-task">
      <div className="activity-kicker">
        <NotebookIcon weight="duotone" /> YOU’RE THE BOOKKEEPER
      </div>
      <h2>{c.title}</h2>
      <p className="journal-story">{c.story}</p>
      <div className="journal-visual">
        <Scene kind="bars" values={[debitTotal, creditTotal]} maxValue={c.amount * 1.2} compact />
        <div className={`journal-total ${balanced ? 'balanced' : ''}`} aria-live="polite">
          <span>
            DEBITS <strong className="mono">${debitTotal.toLocaleString()}</strong>
          </span>
          <span className="balance-token">
            {balanced ? <CheckIcon weight="bold" /> : <ArrowsLeftRightIcon />}
          </span>
          <span>
            CREDITS <strong className="mono">${creditTotal.toLocaleString()}</strong>
          </span>
        </div>
      </div>
      <p className="account-instruction">
        <HandTapIcon /> Choose an account, then tap its side. You can also drag.
      </p>
      <div className="account-pool" aria-label="Available accounts">
        {c.accounts.map((account) => (
          <button
            type="button"
            key={account}
            disabled={locked}
            draggable={!locked}
            data-tally-sound="select"
            onDragStart={(e) => e.dataTransfer.setData('text/plain', account)}
            aria-pressed={selected === account}
            className={selected === account ? 'selected' : ''}
            onClick={() => setSelected(selected === account ? null : account)}
          >
            {account}
          </button>
        ))}
      </div>
      <form onSubmit={check}>
        <div className="journal-sides">
          {(['debit', 'credit'] as const).map((side) => (
            <div key={side} className={`journal-side ${accounts[side] ? 'filled' : ''}`}>
              <button
                type="button"
                className={`journal-slot ${selected ? 'ready' : ''}`}
                data-tally-sound={selected ? 'select' : undefined}
                disabled={locked}
                aria-label={`Place account on ${side}${accounts[side] ? `: ${accounts[side]}` : ''}`}
                onClick={() => put(side)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  put(side, e.dataTransfer.getData('text/plain'));
                }}
              >
                <span>{side === 'debit' ? 'Debit · left' : 'Credit · right'}</span>
                <strong>{accounts[side] || 'Place account here'}</strong>
                <span className="slot-mark">{accounts[side] ? <CheckIcon /> : '+'}</span>
              </button>
              <label>
                {side === 'debit' ? 'Debit amount ($)' : 'Credit amount ($)'}
                <input
                  ref={side === 'credit' ? creditRef : undefined}
                  inputMode="decimal"
                  autoComplete="off"
                  disabled={locked}
                  value={amounts[side]}
                  placeholder="0.00"
                  onChange={(e) => {
                    setAmounts((v) => ({ ...v, [side]: e.target.value }));
                    setResult(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && side === 'debit') {
                      e.preventDefault();
                      creditRef.current?.focus();
                    }
                  }}
                />
              </label>
            </div>
          ))}
        </div>
        {!locked && (
          <button
            type="submit"
            className="button primary full"
            disabled={
              !accounts.debit || !accounts.credit || !amounts.debit.trim() || !amounts.credit.trim()
            }
          >
            Check my entry <CheckIcon />
          </button>
        )}
      </form>
      {result !== null && (
        <AnswerFeedback
          correct={result}
          text={
            result
              ? c.explanation
              : balanced
                ? 'Your totals balance. Now check whether each account tells the right story. ' +
                  c.tip
                : 'Both sides need the correct accounts and the same transaction amount. ' + c.tip
          }
          onNext={onNext}
        />
      )}
      <Nudge text={c.tip} />
    </div>
  );
}
export function RecallTask({
  cards,
  onNext,
  onMistake,
  feedback,
}: TaskCallbacks & { cards: RecallCard[] }) {
  const [queue, setQueue] = useState(cards.map((c) => c.id));
  const [learned, setLearned] = useState<string[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [thought, setThought] = useState('');
  const still = useReducedMotion();
  const card = cards.find((c) => c.id === queue[0])!;
  function rate(remembered: boolean) {
    if (!flipped) return;
    feedback(remembered);
    if (remembered) {
      if (queue.length === 1) {
        onNext();
        return;
      }
      setLearned((v) => [...v, card.id]);
      setQueue((v) => v.slice(1));
    } else {
      onMistake();
      setQueue((v) => [...v.slice(1), v[0]]);
    }
    setFlipped(false);
    setThought('');
  }
  return (
    <div className="recall-task">
      <div className="activity-kicker">
        <CardsIcon weight="duotone" /> GIVE YOUR MEMORY A LITTLE STRETCH
      </div>
      <h2>Try. Turn. Remember.</h2>
      <p className="muted">
        Think of the answer before you turn the card. No scores. Just connections.
      </p>
      <div className="recall-meter">
        <span>
          {learned.length} of {cards.length} ideas feeling familiar
        </span>
        <span>
          {cards.map((c) => (
            <i key={c.id} className={learned.includes(c.id) ? 'complete' : ''} />
          ))}
        </span>
      </div>
      <div className="recall-perspective">
        <AnimatePresence mode="wait">
          <motion.div
            key={card.id}
            initial={still ? false : { opacity: 0, x: 35, rotate: 3 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={still ? {} : { opacity: 0, x: -35, rotate: -3 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <motion.button
              className="recall-card"
              type="button"
              data-tally-sound="flip"
              onClick={() => setFlipped((v) => !v)}
              aria-label={
                flipped
                  ? `Answer: ${card.answer}. Turn card back.`
                  : `Reveal answer: ${card.question}`
              }
              animate={{ rotateY: flipped && !still ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 180, damping: 24 }}
            >
              <span
                className="recall-face recall-front"
                aria-hidden={flipped}
                style={still && flipped ? { visibility: 'hidden' } : undefined}
              >
                <span className="recall-symbol">
                  <SparkleMark />
                </span>
                <span className="recall-prompt">{card.question}</span>
                <span className="recall-turn">
                  <ArrowsLeftRightIcon /> Tap to find the connection
                </span>
              </span>
              <span
                className="recall-face recall-back"
                aria-hidden={!flipped}
                style={
                  still
                    ? { transform: 'none', visibility: flipped ? 'visible' : 'hidden' }
                    : undefined
                }
              >
                <span className="recall-answer">{card.answer}</span>
                <span>{card.explanation}</span>
                <span className="recall-example">{card.example}</span>
              </span>
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>
      {!flipped ? (
        <>
          <label htmlFor="recall-thought">
            My first thought <span className="muted">(optional · not graded)</span>
            <input
              id="recall-thought"
              value={thought}
              onChange={(e) => setThought(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setFlipped(true);
              }}
              placeholder="I think it’s…"
            />
          </label>
          <button className="button primary full" data-tally-sound="flip" onClick={() => setFlipped(true)}>
            Turn the card <ArrowRightIcon />
          </button>
        </>
      ) : (
        <div className="recall-ratings">
          <button className="button secondary" onClick={() => rate(false)}>
            <ArrowCounterClockwiseIcon /> Let’s see it again
          </button>
          <button className="button primary" onClick={() => rate(true)}>
            It’s connecting <CheckIcon />
          </button>
        </div>
      )}
      <div className="tutor-tip">
        <Blob small />
        <p>
          {flipped
            ? 'If it feels fuzzy, choose “Let’s see it again.” I’ll bring this card back.'
            : 'A little effort before revealing the answer helps the idea stick.'}
        </p>
      </div>
    </div>
  );
}
function SparkleMark() {
  return <CardsIcon size={40} weight="duotone" />;
}
