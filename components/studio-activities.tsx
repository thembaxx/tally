'use client';
import { useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from 'motion/react';
import { createPortal } from 'react-dom';
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
import { learnerNumber, money } from '@/lib/south-africa';
import { AnswerFeedback } from './answer-feedback';
import { Blob } from './brand';
import {
  swipeDirection,
  useDragAutoScroll,
  usePointerGesture,
  type Gesture,
} from './use-pointer-gesture';
const Scene = dynamic(() => import('./scene'), {
  ssr: false,
  loading: () => <div className="scene scene-loading" />,
});
type TaskCallbacks = {
  onNext: () => void;
  onMistake: () => void;
  onHint?: () => void;
  feedback: (success: boolean) => void;
};
function Nudge({ text, onHint }: { text: string; onHint?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="text-button hint-button"
        data-tally-sound="hint"
        aria-expanded={open}
        onClick={() => {
          if (!open) onHint?.();
          setOpen(!open);
        }}
      >
        <LightbulbIcon weight="duotone" />
        {open ? 'Hide hint' : 'Show hint'}
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
  onHint,
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
        <MagnifyingGlassIcon weight="duotone" /> EXAMINE THE TRANSACTION
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
      <Nudge text={c.tip} onHint={onHint} />
    </div>
  );
}
function AccountChip({
  account,
  selected,
  disabled,
  onSelect,
  onStart,
  onMove,
  onDrop,
  onCancel,
}: {
  account: string;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
  onStart: (account: string, move: Gesture) => void;
  onMove: (move: Gesture) => void;
  onDrop: (account: string, move: Gesture) => void;
  onCancel: () => void;
}) {
  const gesture = usePointerGesture({
    enabled: !disabled,
    onStart: (move) => onStart(account, move),
    onMove,
    onEnd: (move) => onDrop(account, move),
    onCancel,
  });
  return (
    <button
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      className={selected ? 'selected' : ''}
      data-tally-sound="select"
      onClick={onSelect}
      {...gesture}
      onContextMenu={(event) => event.preventDefault()}
    >
      {account}
    </button>
  );
}

export function JournalTask({
  onHint,
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
  const root = useRef<HTMLDivElement>(null);
  const slots = useRef<Record<'debit' | 'credit', HTMLButtonElement | null>>({
    debit: null,
    credit: null,
  });
  const [dragged, setDragged] = useState<string | null>(null);
  const selectionBeforeDrag = useRef<string | null>(null);
  const [hovered, setHovered] = useState<'debit' | 'credit' | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const point = useRef({ x: 0, y: 0 });
  const ghostX = useMotionValue(0),
    ghostY = useMotionValue(0);
  const locked = result === true;
  const parse = (s: string) => learnerNumber(s) ?? 0;
  const debitTotal = parse(amounts.debit),
    creditTotal = parse(amounts.credit);
  const balanced = debitTotal > 0 && debitTotal === creditTotal;
  function put(side: 'debit' | 'credit', account = selected) {
    if (!account || locked || !c.accounts.includes(account)) return;
    setAccounts((v) => ({ ...v, [side]: account }));
    setSelected(null);
    setResult(null);
    setAnnouncement(`${account} placed on ${side}.`);
  }
  function sideAt(x: number, y: number) {
    for (const side of ['debit', 'credit'] as const) {
      const bounds = slots.current[side]?.getBoundingClientRect();
      if (bounds && x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom)
        return side;
    }
    return null;
  }
  function moveAccount(move: Gesture) {
    point.current = { x: move.x, y: move.y };
    ghostX.set(Math.max(8, Math.min(window.innerWidth - 172, move.x + 12)));
    ghostY.set(move.y - 24);
    setHovered(sideAt(move.x, move.y));
  }
  function clearDrag() {
    setDragged(null);
    setHovered(null);
  }
  useDragAutoScroll(!!dragged, point, root, () =>
    setHovered(sideAt(point.current.x, point.current.y)),
  );
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
    <div className="journal-task" ref={root}>
      <div className="activity-kicker">
        <NotebookIcon weight="duotone" /> YOU’RE THE BOOKKEEPER
      </div>
      <h2>{c.title}</h2>
      <p className="journal-story">{c.story}</p>
      <div className="journal-visual">
        <Scene kind="bars" values={[debitTotal, creditTotal]} maxValue={c.amount * 1.2} compact />
        <div className={`journal-total ${balanced ? 'balanced' : ''}`} aria-live="polite">
          <span>
            DEBITS <strong className="mono">{money(debitTotal)}</strong>
          </span>
          <span className="balance-token">
            {balanced ? <CheckIcon weight="bold" /> : <ArrowsLeftRightIcon />}
          </span>
          <span>
            CREDITS <strong className="mono">{money(creditTotal)}</strong>
          </span>
        </div>
      </div>
      <p className="account-instruction">
        <HandTapIcon /> Drag an account to its side, or choose it and tap a slot.
      </p>
      <div className="account-pool" aria-label="Available accounts">
        {c.accounts.map((account) => (
          <AccountChip
            key={account}
            account={account}
            disabled={locked}
            selected={selected === account}
            onSelect={() => setSelected(selected === account ? null : account)}
            onStart={(value, move) => {
              selectionBeforeDrag.current = selected;
              setDragged(value);
              setSelected(value);
              moveAccount(move);
            }}
            onMove={moveAccount}
            onDrop={(value, move) => {
              const side = sideAt(move.x, move.y);
              if (side) put(side, value);
              else setSelected(selectionBeforeDrag.current);
              clearDrag();
            }}
            onCancel={() => {
              setSelected(selectionBeforeDrag.current);
              clearDrag();
            }}
          />
        ))}
      </div>
      <form onSubmit={check}>
        <div className="journal-sides">
          {(['debit', 'credit'] as const).map((side) => (
            <div key={side} className={`journal-side ${accounts[side] ? 'filled' : ''}`}>
              <button
                type="button"
                ref={(element) => {
                  slots.current[side] = element;
                }}
                className={`journal-slot ${selected ? 'ready' : ''} ${hovered === side ? 'drag-over' : ''}`}
                data-tally-sound={selected ? 'select' : undefined}
                disabled={locked}
                aria-label={`Place account on ${side}${accounts[side] ? `: ${accounts[side]}` : ''}`}
                onClick={() => put(side)}
              >
                <span>{side === 'debit' ? 'Debit · left' : 'Credit · right'}</span>
                <strong>{accounts[side] || 'Place account here'}</strong>
                <span className="slot-mark">{accounts[side] ? <CheckIcon /> : '+'}</span>
              </button>
              <label>
                {side === 'debit' ? 'Debit amount (R)' : 'Credit amount (R)'}
                <input
                  ref={side === 'credit' ? creditRef : undefined}
                  inputMode="decimal"
                  autoComplete="off"
                  disabled={locked}
                  value={amounts[side]}
                  placeholder="0,00"
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
      <span className="sr-only" role="status">
        {announcement}
      </span>
      {dragged &&
        createPortal(
          <motion.div
            aria-hidden="true"
            className="account-drag-preview"
            style={{ x: ghostX, y: ghostY }}
          >
            {dragged}
          </motion.div>,
          document.body,
        )}
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
      <Nudge text={c.tip} onHint={onHint} />
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
  const dragX = useMotionValue(0);
  function settleCard() {
    animate(dragX, 0, { duration: still ? 0 : 0.18 });
  }
  const gesture = usePointerGesture({
    onStart: () => dragX.stop(),
    onMove: (move) => {
      if (Math.abs(move.dx) > Math.abs(move.dy))
        dragX.set(Math.max(-45, Math.min(45, move.dx * 0.25)));
    },
    onEnd: (move) => {
      const direction = swipeDirection(move);
      settleCard();
      if (direction === 'left' || direction === 'right') setFlipped((value) => !value);
    },
    onCancel: settleCard,
  });
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
            style={{ x: dragX }}
            initial={still ? false : { opacity: 0, x: 35, rotate: 3 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={still ? {} : { opacity: 0, x: -35, rotate: -3 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          >
            <motion.button
              className="recall-card"
              {...gesture}
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
                  <ArrowsLeftRightIcon /> Tap or swipe to find the connection
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
          <button
            className="button primary full"
            data-tally-sound="flip"
            onClick={() => setFlipped(true)}
          >
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
