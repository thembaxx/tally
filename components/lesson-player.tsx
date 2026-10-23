'use client';
import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AnimatePresence, motion, Reorder, useDragControls, useReducedMotion } from 'motion/react';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckIcon,
  LightbulbIcon,
  HandSwipeLeftIcon,
  DotsSixVerticalIcon,
  SparkleIcon,
  TargetIcon,
} from '@phosphor-icons/react';
import {
  accepts,
  dailyTasks,
  type Lesson,
  type SortItem,
  type Entry,
  type Category,
} from '@/lib/learning';
import { Blob } from './brand';
import { ConceptExplorer } from './concept-explorer';
import type { StudioActivity } from '@/lib/activity-types';
import { ChoiceTask, JournalTask, RecallTask } from './studio-activities';
import { AnswerFeedback } from './answer-feedback';
const Scene = dynamic(() => import('./scene'), {
  ssr: false,
  loading: () => <div className="scene scene-loading" />,
});
type Task =
  | StudioActivity
  | { type: 'sort'; items: SortItem[] }
  | { type: 'entry'; entry: Entry }
  | { type: 'order'; items: string[]; tip: string };
type Props = {
  lesson: Lesson | 'daily';
  day: string;
  onComplete: (mistakes: number, confidence: string) => number;
  onClose: () => void;
  onFocus: () => void;
  feedback: (success: boolean) => void;
};
export function LessonPlayer({ lesson, day, onComplete, onClose, onFocus, feedback }: Props) {
  const still = useReducedMotion();
  const daily = lesson === 'daily';
  const data = dailyTasks(day);
  const tasks: Task[] = daily
    ? [
        { type: 'sort', items: data.sort },
        { type: 'entry', entry: data.entry },
        { type: 'order', items: data.order, tip: data.orderTip },
      ]
    : (lesson.activities ??
      (lesson.id === 'equation'
        ? [
            { type: 'sort', items: requireSort() },
            { type: 'entry', entry: lesson.entry },
          ]
        : [
            { type: 'entry', entry: lesson.entry },
            { type: 'order', items: lesson.order, tip: lesson.orderTip },
          ]));
  const [intro, setIntro] = useState(!daily);
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [reflect, setReflect] = useState(false);
  const [done, setDone] = useState(false);
  const [confidence, setConfidence] = useState('Getting there');
  const [earned, setEarned] = useState(0);
  const [note, setNote] = useState('');
  const task = tasks[step];
  const player = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reset = () => {
      if (
        player.current?.contains(document.activeElement) &&
        document.activeElement?.matches('input, textarea, select, button')
      )
        return;
      const dialog = player.current?.closest<HTMLElement>('[role="dialog"]');
      dialog?.scrollTo({ top: 0, behavior: 'instant' });
      const heading = player.current?.querySelector<HTMLElement>('h2');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }
    };
    const id = setTimeout(reset, still ? 0 : 350);
    return () => clearTimeout(id);
  }, [intro, step, reflect, done, still]);
  function next() {
    if (step < tasks.length - 1) setStep(step + 1);
    else if (!daily) setReflect(true);
    else finish();
  }
  function finish() {
    setEarned(onComplete(mistakes, confidence));
    setDone(true);
    feedback(true);
  }
  if (done)
    return (
      <div className="lesson-complete" ref={player}>
        <div className="celebration" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} style={{ '--i': i } as React.CSSProperties} />
          ))}
        </div>
        <div className="confetti-stars">
          <SparkleIcon size={32} weight="fill" />
          <Blob happy />
          <SparkleIcon size={22} weight="fill" />
        </div>
        <span className="eyebrow">LOOK AT THAT. YOU MADE IT CLICK.</span>
        <h2>{daily ? 'Daily challenge, done.' : 'That’s a lightbulb moment.'}</h2>
        <p>
          {daily
            ? 'Three ways to think. One stronger accounting brain.'
            : 'Understanding grows one small step at a time. You just took a good one.'}
        </p>
        <div className="earned-xp">
          <SparkleIcon weight="fill" />
          <strong>+{earned}</strong> XP
        </div>
        <div className="completion-detail">
          <CheckIcon />
          {mistakes === 0
            ? 'You got every answer on your first try.'
            : `You worked through ${mistakes} ${mistakes === 1 ? 'tricky moment' : 'tricky moments'}. That’s how learning happens.`}
        </div>
        <p className="fine">
          {daily
            ? 'Come back tomorrow for a fresh mix. Repeat runs earn 15 XP.'
            : 'A quick review will be waiting for you in Practice.'}
        </p>
        <button className="button primary full" onClick={onClose}>
          Keep the good feeling <ArrowRightIcon />
        </button>
      </div>
    );
  return (
    <div className="lesson-player" ref={player}>
      <div className="lesson-toolbar">
        <span className="pill">{daily ? 'DAILY MIX' : lesson.level.toUpperCase()}</span>
        <button className="text-button" onClick={onFocus}>
          <TargetIcon /> Focus
        </button>
      </div>
      <div className="lesson-progress">
        <div
          style={{ width: `${intro ? 5 : reflect ? 95 : ((step + 0.5) / tasks.length) * 85}%` }}
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={intro ? 'intro' : reflect ? 'reflect' : step}
          initial={still ? false : { opacity: 0, y: 20, scale: 0.985 }}
          animate={{ opacity: 1, y: 0 }}
          exit={still ? {} : { opacity: 0, y: -12 }}
          transition={{ duration: still ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {intro && !daily ? (
            <div className="lesson-intro">
              <span className="eyebrow">LET’S MAKE IT CLICK</span>
              <h2>{lesson.title}</h2>
              <p className="concept">{lesson.concept}</p>
              <ConceptExplorer lesson={lesson} />
              <div className="worked-example">
                <span>
                  <LightbulbIcon weight="duotone" /> A real-life example
                </span>
                <p>{lesson.example}</p>
              </div>
              <div className="tutor-tip">
                <Blob small />
                <p>{lesson.tip}</p>
              </div>
              <button className="button primary full" onClick={() => setIntro(false)}>
                I’m ready to try <ArrowRightIcon />
              </button>
              <p className="fine center">Take your time. Hints are always here.</p>
            </div>
          ) : reflect ? (
            <div className="reflection">
              <span className="eyebrow">MAKE IT YOURS</span>
              <h2>Could you teach it to a friend?</h2>
              <p>
                Try explaining the idea in one sentence. Saying it in your own words helps it stick.
              </p>
              <label htmlFor="reflection">
                My takeaway <span className="muted">(optional · not graded)</span>
              </label>
              <textarea
                id="reflection"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="The way I think about it is…"
                rows={3}
              />
              <p>How does it feel now?</p>
              <div className="confidence-options">
                {['Still learning', 'Getting there', 'It clicked!'].map((c) => (
                  <button
                    aria-pressed={confidence === c}
                    className={confidence === c ? 'selected' : ''}
                    key={c}
                    onClick={() => setConfidence(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="tutor-tip">
                <Blob small />
                <p>
                  {confidence === 'Still learning'
                    ? 'That’s okay. I’ll bring this back for a gentle review tomorrow.'
                    : 'Lovely. We’ll revisit this in a few days to help it stay with you.'}
                </p>
              </div>
              <button className="button primary full" onClick={finish}>
                Finish lesson <CheckIcon />
              </button>
            </div>
          ) : task ? (
            <>
              <div className="task-label">
                {daily ? 'CHALLENGE' : 'PRACTICE'}{' '}
                <span className="mono">
                  0{step + 1} / 0{tasks.length}
                </span>
              </div>
              {task.type === 'choice' ? (
                <ChoiceTask
                  key={`choice-${step}`}
                  challenge={task.challenge}
                  onNext={next}
                  feedback={feedback}
                  onMistake={() => setMistakes((n) => n + 1)}
                />
              ) : task.type === 'journal' ? (
                <JournalTask
                  key={`journal-${step}`}
                  challenge={task.challenge}
                  onNext={next}
                  feedback={feedback}
                  onMistake={() => setMistakes((n) => n + 1)}
                />
              ) : task.type === 'recall' ? (
                <RecallTask
                  key={`recall-${step}`}
                  cards={task.cards}
                  onNext={next}
                  feedback={feedback}
                  onMistake={() => setMistakes((n) => n + 1)}
                />
              ) : task.type === 'sort' ? (
                <SortTask
                  key={`sort-${step}`}
                  items={task.items}
                  onNext={next}
                  feedback={feedback}
                  onMistake={() => setMistakes((n) => n + 1)}
                />
              ) : task.type === 'entry' ? (
                <EntryTask
                  key={`entry-${step}`}
                  entry={task.entry}
                  onNext={next}
                  feedback={feedback}
                  onMistake={() => setMistakes((n) => n + 1)}
                />
              ) : (
                <OrderTask
                  key={`order-${step}`}
                  items={task.items}
                  tip={task.tip}
                  onNext={next}
                  feedback={feedback}
                  onMistake={() => setMistakes((n) => n + 1)}
                />
              )}
            </>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
function requireSort(): SortItem[] {
  return [
    {
      name: 'A laptop you own',
      category: 'Asset',
      amount: 1200,
      explanation: 'The laptop is a resource the business owns and uses: an asset.',
    },
    {
      name: 'A bank loan',
      category: 'Liability',
      amount: 800,
      explanation: 'The business owes the bank $800. That makes the loan a liability.',
    },
    {
      name: 'Your investment',
      category: 'Equity',
      amount: 400,
      explanation: 'The owner contributed $400. Assets $1,200 = Liabilities $800 + Equity $400.',
    },
  ];
}
function SortTask({
  items,
  onNext,
  onMistake,
  feedback,
}: {
  items: SortItem[];
  onNext: () => void;
  onMistake: () => void;
  feedback: (v: boolean) => void;
}) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Category | null>(null);
  const start = useRef({ x: 0, y: 0 });
  const item = items[index];
  const correct = answer === item.category;
  const sorted = items.slice(0, index + (correct ? 1 : 0));
  const left = sorted.filter((i) => i.category === 'Asset').reduce((s, i) => s + i.amount, 0);
  const right = sorted.filter((i) => i.category !== 'Asset').reduce((s, i) => s + i.amount, 0);
  const tilt = Math.max(-0.28, Math.min(0.28, ((right - left) / items[0].amount) * 0.28));
  function choose(category: Category) {
    if (correct) return;
    setAnswer(category);
    feedback(category === item.category);
    if (category !== item.category) onMistake();
  }
  function advance() {
    if (index === items.length - 1) onNext();
    else {
      setIndex(index + 1);
      setAnswer(null);
    }
  }
  return (
    <>
      <h2>Everything has a place.</h2>
      <p className="muted">Sort the item. Watch the equation find its balance.</p>
      <div className="exercise-scene">
        <Scene tilt={tilt} blocks={sorted.length} />
        <div className="scene-readout mono">
          <span>
            A <b>${left.toLocaleString()}</b>
          </span>
          <span>=</span>
          <span>
            L + E <b>${right.toLocaleString()}</b>
          </span>
        </div>
      </div>
      <motion.div
        className="sort-card"
        key={index}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onPointerDown={(e) => {
          start.current = { x: e.clientX, y: e.clientY };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerUp={(e) => {
          const dx = e.clientX - start.current.x,
            dy = e.clientY - start.current.y;
          if (dy < -50 && Math.abs(dy) > Math.abs(dx)) choose('Equity');
          else if (Math.abs(dx) > 50) choose(dx < 0 ? 'Asset' : 'Liability');
        }}
      >
        <span className="fine mono">
          ITEM {index + 1} OF {items.length}
        </span>
        <h3>{item.name}</h3>
        <strong className="mono">${item.amount.toLocaleString()}</strong>
        <span className="swipe-hint">
          <HandSwipeLeftIcon /> Swipe, or choose below
        </span>
      </motion.div>
      <div className="sort-options">
        {(['Asset', 'Liability', 'Equity'] as Category[]).map((c, i) => (
          <button
            key={c}
            disabled={correct}
            className={answer === c ? (correct ? 'chosen good' : 'chosen bad') : ''}
            onClick={() => choose(c)}
          >
            {i === 0 ? <ArrowLeftIcon /> : i === 1 ? <ArrowRightIcon /> : <ArrowUpIcon />}
            <span>{c}</span>
          </button>
        ))}
      </div>
      {answer && (
        <AnswerFeedback
          correct={correct}
          text={
            correct
              ? item.explanation
              : `${item.category === 'Asset' ? 'This is something the business owns.' : item.category === 'Liability' ? 'This is an amount the business needs to repay.' : 'This is the owner’s share of the business.'} Try once more—you’ve got this.`
          }
          onNext={advance}
        />
      )}
      <div className="tutor-tip">
        <Blob small />
        <p>Own it, owe it, or your share? That’s the whole idea.</p>
      </div>
    </>
  );
}
function EntryTask({
  entry,
  onNext,
  onMistake,
  feedback,
}: {
  entry: Entry;
  onNext: () => void;
  onMistake: () => void;
  feedback: (v: boolean) => void;
}) {
  const [values, setValues] = useState<string[]>(entry.labels.map(() => ''));
  const [result, setResult] = useState<boolean | null>(null);
  const [hint, setHint] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  function check(e: React.FormEvent) {
    e.preventDefault();
    const ok = values.every((v, i) => accepts(v, entry.answers[i]));
    setResult(ok);
    feedback(ok);
    if (!ok) onMistake();
  }
  return (
    <>
      <h2>Over to you.</h2>
      <p className="entry-question">{entry.prompt}</p>
      <form onSubmit={check}>
        <div className="entry-fields">
          {entry.labels.map((label, i) => (
            <label key={label}>
              {label}
              <input
                autoComplete="off"
                ref={(el) => {
                  refs.current[i] = el;
                }}
                value={values[i]}
                disabled={result === true}
                placeholder={
                  entry.answers[i].every((a) => !Number.isNaN(Number(a)))
                    ? 'Enter a number'
                    : 'Type an account or answer'
                }
                inputMode={
                  entry.answers[i].every((a) => !Number.isNaN(Number(a))) ? 'decimal' : 'text'
                }
                onChange={(e) => {
                  setValues((v) => v.map((a, n) => (n === i ? e.target.value : a)));
                  setResult(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && i < entry.labels.length - 1) {
                    e.preventDefault();
                    refs.current[i + 1]?.focus();
                  }
                }}
              />
            </label>
          ))}
        </div>
        {result !== true && (
          <button
            type="submit"
            className="button primary full"
            disabled={values.some((v) => !v.trim())}
          >
            Check my answer <CheckIcon />
          </button>
        )}
      </form>
      {result !== null && (
        <AnswerFeedback
          correct={result}
          text={result ? entry.explanation : `Not quite yet. ${entry.tip} Give it another try.`}
          onNext={onNext}
        />
      )}
      <button
        className="text-button hint-button"
        aria-expanded={hint}
        onClick={() => setHint(!hint)}
      >
        <LightbulbIcon weight="duotone" />
        {hint ? 'Hide hint' : 'A little nudge?'}
      </button>
      {hint && (
        <div className="tutor-tip">
          <Blob small />
          <p>{entry.tip}</p>
        </div>
      )}
      <p className="fine center">Natural answers welcome. “Laptop” works just like “equipment”.</p>
    </>
  );
}
function OrderRow({
  value,
  index,
  total,
  move,
}: {
  value: string;
  index: number;
  total: number;
  move: (i: number, delta: number) => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item className="order-row" value={value} dragListener={false} dragControls={controls}>
      <button
        className="drag-handle"
        onPointerDown={(e) => controls.start(e)}
        aria-label={`Drag ${value}`}
      >
        <DotsSixVerticalIcon size={23} />
      </button>
      <span className="order-number mono">0{index + 1}</span>
      <span>{value}</span>
      <div className="order-arrows">
        <button
          aria-label={`Move ${value} up`}
          disabled={index === 0}
          onClick={() => move(index, -1)}
        >
          <ArrowUpIcon />
        </button>
        <button
          aria-label={`Move ${value} down`}
          disabled={index === total - 1}
          onClick={() => move(index, 1)}
        >
          <ArrowDownIcon />
        </button>
      </div>
    </Reorder.Item>
  );
}
function OrderTask({
  items,
  tip,
  onNext,
  onMistake,
  feedback,
}: {
  items: string[];
  tip: string;
  onNext: () => void;
  onMistake: () => void;
  feedback: (v: boolean) => void;
}) {
  const [order, setOrder] = useState(() => [...items.slice(1), items[0]]);
  const [result, setResult] = useState<boolean | null>(null);
  const [hint, setHint] = useState(false);
  function move(i: number, delta: number) {
    const next = [...order];
    [next[i], next[i + delta]] = [next[i + delta], next[i]];
    setOrder(next);
    setResult(null);
  }
  return (
    <>
      <h2>Put the story in order.</h2>
      <p className="muted">Drag the handles, or tap the arrows. The tower follows you.</p>
      <div className="tower-scene">
        <Scene kind="tower" order={order} compact />
      </div>
      <Reorder.Group
        axis="y"
        values={order}
        onReorder={(v) => {
          setOrder(v);
          setResult(null);
        }}
        className="order-list"
      >
        {order.map((v, i) => (
          <OrderRow key={v} value={v} index={i} total={order.length} move={move} />
        ))}
      </Reorder.Group>
      {result !== true && (
        <button
          className="button primary full"
          onClick={() => {
            const ok = order.every((v, i) => v === items[i]);
            setResult(ok);
            feedback(ok);
            if (!ok) onMistake();
          }}
        >
          Check the order <CheckIcon />
        </button>
      )}
      {result !== null && (
        <AnswerFeedback
          correct={result}
          text={
            result
              ? `Exactly. ${items.join(' → ')}. Each step builds on the one before it.`
              : `A couple of pieces need another look. ${tip}`
          }
          onNext={onNext}
        />
      )}
      <button
        className="text-button hint-button"
        aria-expanded={hint}
        onClick={() => setHint(!hint)}
      >
        <LightbulbIcon /> A little nudge?
      </button>
      {hint && (
        <div className="tutor-tip">
          <Blob small />
          <p>
            {tip} Start with “{items[0]}”.
          </p>
        </div>
      )}
    </>
  );
}
