'use client';
import { useState, useRef, useEffect, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import {
  AnimatePresence,
  animate,
  motion,
  Reorder,
  useDragControls,
  useMotionValue,
  useReducedMotion,
} from 'motion/react';
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
  lessons,
  type SortItem,
  type Entry,
  type Category,
} from '@/lib/learning';
import { Blob } from './brand';
import { CoachScope, ExplanationTools } from './learning-coach';
import type { Experiences, CoachingEvidence } from '@/lib/experiences';
import { ConceptExplorer } from './concept-explorer';
import type { StudioActivity } from '@/lib/activity-types';
import { ChoiceTask, JournalTask, RecallTask } from './studio-activities';
import { AnswerFeedback } from './answer-feedback';
import { swipeDirection, useDragAutoScroll, usePointerGesture } from './use-pointer-gesture';
import type { SoundCue } from './use-soundscape';
import { emitFeedback } from '@/lib/feedback';
import { practiceEntry } from '@/lib/questions';
import { challengeLevels, type Challenge } from '@/lib/challenge-questions';
import { followUp } from '@/lib/adaptive';
import {
  initialTutor,
  personalChallenge,
  type TutorProfile,
  type Explanation,
} from '@/lib/personalisation';
import { TutorSupport } from './tutor-support';
import { createBakeryLesson } from '@/lib/bakery';
import { learningContext, money } from '@/lib/south-africa';
import {
  matchesDraft,
  sessionId,
  type LessonDraft,
  type Session,
  type SessionResult,
  type TaskResult,
} from '@/lib/session';
import { confidenceOptions, type ConceptResult, type Review } from '@/lib/reviews';
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
  lesson: Session;
  day: string;
  attempt: number;
  reviewAttempts: Record<string, number>;
  reviews: Record<string, Review>;
  tutor?: TutorProfile;
  onFormat?: (id: string, format: Explanation) => void;
  draft: LessonDraft | null;
  savedNote?: string;
  coaching?: Experiences['coaching'];
  onCoaching?: (id: string, evidence: CoachingEvidence) => void;
  quickStart?: boolean;
  onDraft: (draft: LessonDraft) => void;
  onComplete: (result: SessionResult) => number;
  onCelebrate: () => void;
  onCue: (cue: SoundCue) => void;
  onClose: () => void;
  onFocus: () => void;
  feedback: (success: boolean) => void;
};
export function LessonPlayer({
  lesson,
  day,
  attempt: nextAttempt,
  reviewAttempts: nextReviewAttempts,
  reviews,
  tutor = initialTutor,
  onFormat,
  draft,
  savedNote = '',
  quickStart = false,
  onDraft,
  onComplete,
  coaching,
  onCoaching,
  onCelebrate,
  onCue,
  onClose,
  onFocus,
  feedback,
}: Props) {
  const still = useReducedMotion();
  const daily = lesson === 'daily';
  const review = typeof lesson === 'object' && 'kind' in lesson ? lesson : null;
  const sourceLesson = typeof lesson === 'object' && !('kind' in lesson) ? lesson : null;
  const [checkpoint] = useState(() => (matchesDraft(draft, lesson, day) ? draft : null));
  const [attempt] = useState(checkpoint?.attempt ?? nextAttempt);
  const fullLesson = sourceLesson?.id === 'bakery' ? createBakeryLesson(attempt) : sourceLesson;
  const [reviewAttempts] = useState(checkpoint?.reviewAttempts ?? nextReviewAttempts);
  const [sessionDay] = useState(checkpoint?.day ?? day);
  const [history] = useState(reviews);
  const [startingTutor] = useState(tutor);
  const [coachingHistory] = useState(coaching);
  const [lessonChallenge, setLessonChallenge] = useState<Challenge | undefined>(
    () =>
      checkpoint?.lessonChallenge ??
      (!checkpoint && fullLesson && !fullLesson.activities
        ? {
            id: fullLesson.id,
            attempt,
            level: personalChallenge(
              fullLesson.id,
              history[fullLesson.id],
              startingTutor,
              coachingHistory?.[fullLesson.id],
              true,
            ).level,
          }
        : undefined),
  );
  const [reviewPlan, setReviewPlan] = useState<Challenge[]>(
    () =>
      checkpoint?.reviewPlan ??
      review?.ids.map((id) => ({
        id,
        attempt: reviewAttempts[id] ?? attempt,
        level: checkpoint
          ? 'standard'
          : personalChallenge(id, history[id], startingTutor, coachingHistory?.[id]).level,
      })) ??
      [],
  );
  const [dailyChallenge] = useState(() => {
    if (checkpoint?.dailyChallenge) return checkpoint.dailyChallenge;
    const chosen = dailyTasks(sessionDay, checkpoint ? undefined : history).challenge;
    return checkpoint
      ? chosen
      : {
          ...chosen,
          level: personalChallenge(
            chosen.id,
            history[chosen.id],
            startingTutor,
            coachingHistory?.[chosen.id],
          ).level,
        };
  });
  const data = dailyTasks(sessionDay);
  const tasks: { task: Task; conceptId: string; challenge?: Challenge }[] = daily
    ? [
        { task: { type: 'sort', items: data.sort }, conceptId: 'equation' },
        {
          task: {
            type: 'entry',
            entry: practiceEntry(dailyChallenge.id, dailyChallenge.attempt, dailyChallenge.level),
          },
          conceptId: dailyChallenge.id,
          challenge: dailyChallenge,
        },
        { task: { type: 'order', items: data.order, tip: data.orderTip }, conceptId: data.orderId },
      ]
    : review
      ? reviewPlan.map((challenge) => ({
          task: {
            type: 'entry',
            entry: practiceEntry(challenge.id, challenge.attempt, challenge.level),
          },
          conceptId: challenge.id,
          challenge,
        }))
      : fullLesson
        ? (
            fullLesson.activities ??
            ((fullLesson.id === 'equation'
              ? [
                  { type: 'sort', items: requireSort() },
                  {
                    type: 'entry',
                    entry: practiceEntry(fullLesson.id, attempt, lessonChallenge?.level),
                  },
                ]
              : [
                  {
                    type: 'entry',
                    entry: practiceEntry(fullLesson.id, attempt, lessonChallenge?.level),
                  },
                  { type: 'order', items: fullLesson.order, tip: fullLesson.orderTip },
                ]) as Task[])
          ).map((task) => ({
            task,
            conceptId: fullLesson.id,
            ...(task.type === 'entry' && lessonChallenge ? { challenge: lessonChallenge } : {}),
          }))
        : [];
  const [intro, setIntro] = useState(checkpoint?.intro ?? (!daily && !review && !quickStart));
  const [step, setStep] = useState(Math.min(checkpoint?.step || 0, tasks.length - 1));
  const [results, setResults] = useState<Record<string, TaskResult>>(checkpoint?.results ?? {});
  const mistakes = Object.values(results).reduce((sum, result) => sum + result.mistakes, 0);
  const hints = Object.values(results).reduce((sum, result) => sum + result.hints, 0);
  const [reflect, setReflect] = useState(checkpoint?.reflect ?? false);
  const [done, setDone] = useState(false);
  const [confidence, setConfidence] = useState(checkpoint?.confidence ?? 'Getting there');
  const [earned, setEarned] = useState(0);
  const [note, setNote] = useState(checkpoint?.note ?? savedNote);
  const [answeredStep, setAnsweredStep] = useState(-1);
  const task = tasks[step]?.task;
  const currentChallenge = tasks[step]?.challenge;
  const player = useRef<HTMLDivElement>(null);
  const finished = useRef(false);
  useEffect(() => {
    if (done) return;
    onDraft({
      lessonId: sessionId(lesson),
      reviewIds: review?.ids ?? [],
      day: sessionDay,
      attempt,
      reviewAttempts,
      intro,
      step,
      reflect,
      confidence,
      note,
      results,
      ...(review ? { reviewPlan } : {}),
      ...(daily ? { dailyChallenge } : {}),
      ...(lessonChallenge ? { lessonChallenge } : {}),
    });
  }, [
    lesson,
    review,
    sessionDay,
    attempt,
    reviewAttempts,
    intro,
    step,
    reflect,
    confidence,
    note,
    results,
    reviewPlan,
    dailyChallenge,
    lessonChallenge,
    daily,
    done,
    onDraft,
  ]);
  function record(kind: 'mistakes' | 'hints') {
    setResults((old) => ({
      ...old,
      [step]: {
        mistakes: (old[step]?.mistakes || 0) + (kind === 'mistakes' ? 1 : 0),
        hints: (old[step]?.hints || 0) + (kind === 'hints' ? 1 : 0),
      },
    }));
  }
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
    // Adapt between activities, preserving an answer already being entered.
    if (
      !review &&
      !daily &&
      startingTutor.support === 'auto' &&
      tasks[step + 1]?.task.type === 'entry' &&
      lessonChallenge?.level !== 'guided' &&
      ((results[step]?.mistakes || 0) >= 2 || (results[step]?.hints || 0) >= 2)
    ) {
      setLessonChallenge((old) => (old ? { ...old, level: 'guided' } : old));
    }
    const support =
      (results[step]?.mistakes || 0) + (results[step]?.hints || 0) > 0 ||
      confidence === 'Still learning';
    if (
      review &&
      currentChallenge &&
      !currentChallenge.followUp &&
      support &&
      !reviewPlan[step + 1]?.followUp
    ) {
      setReviewPlan((plan) => [
        ...plan.slice(0, step + 1),
        followUp(currentChallenge, 'guided'),
        ...plan.slice(step + 1),
      ]);
      onCue('navigate');
      setStep(step + 1);
      return;
    }
    if (step < tasks.length - 1) {
      onCue('navigate');
      setStep(step + 1);
    } else if (!daily && !review) {
      onCue('navigate');
      setReflect(true);
    } else finish();
  }
  function chooseFollowUp(level: Challenge['level']) {
    if (!review || !currentChallenge || currentChallenge.followUp) return;
    setReviewPlan((plan) => {
      const rest = plan[step + 1]?.followUp ? plan.slice(step + 2) : plan.slice(step + 1);
      return [...plan.slice(0, step + 1), followUp(currentChallenge, level), ...rest];
    });
  }
  function finish() {
    if (finished.current) return;
    finished.current = true;
    const concepts: Record<string, ConceptResult> = {};
    tasks.forEach(({ conceptId, challenge }, index) => {
      const result = results[index] ?? { mistakes: 0, hints: 0 };
      const previous = concepts[conceptId] ?? {
        id: conceptId,
        total: 0,
        firstTry: 0,
        mistakes: 0,
        hints: 0,
      };
      concepts[conceptId] = {
        id: conceptId,
        total: previous.total + 1,
        firstTry:
          previous.firstTry +
          (challenge?.level !== 'guided' && result.mistakes === 0 && result.hints === 0 ? 1 : 0),
        mistakes: previous.mistakes + result.mistakes,
        hints: previous.hints + result.hints,
        ...(previous.guided || challenge?.level === 'guided' ? { guided: true } : {}),
        ...(challenge
          ? { nextQuestion: Math.max(previous.nextQuestion || 0, challenge.attempt + 1) }
          : {}),
      };
    });
    setEarned(
      onComplete({
        day: sessionDay,
        confidence,
        note: fullLesson ? note : '',
        concepts: Object.values(concepts),
      }),
    );
    setDone(true);
    onCelebrate();
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
        <span className="eyebrow">SESSION COMPLETE</span>
        <h2>
          {review ? 'Review complete.' : daily ? 'Daily challenge, done.' : 'Lesson complete.'}
        </h2>
        <p>
          {tasks.length} {tasks.length === 1 ? 'activity' : 'activities'} completed.
        </p>
        <div className="earned-xp">
          <SparkleIcon weight="fill" />
          <strong>+{earned}</strong> XP
        </div>
        <div className="completion-detail">
          <CheckIcon />
          {mistakes === 0 && hints === 0 && tasks.some((t) => t.challenge?.level === 'guided')
            ? 'You completed practice with the method shown. Try without the steps when you’re ready.'
            : mistakes === 0 && hints === 0
              ? 'You worked through every activity without hints or retries.'
              : mistakes === 0
                ? `You used ${hints} ${hints === 1 ? 'hint' : 'hints'} and completed every activity without retries.`
                : `You completed every activity with ${mistakes} ${mistakes === 1 ? 'retry' : 'retries'} and ${hints} ${hints === 1 ? 'hint' : 'hints'}.`}
        </div>
        <p className="fine">
          {daily
            ? 'Come back tomorrow for a fresh mix. Repeat runs earn 15 XP.'
            : 'Your next review is scheduled around how this session went.'}
        </p>
        <button className="button primary full" onClick={onClose}>
          Done <ArrowRightIcon />
        </button>
      </div>
    );
  return (
    <CoachScope
      key={tasks[step]?.conceptId}
      id={tasks[step]?.conceptId || 'equation'}
      evidence={coaching?.[tasks[step]?.conceptId]}
      save={onCoaching}
      tutor={tutor}
      review={history[tasks[step]?.conceptId]}
      onFormat={onFormat}
    >
      <div className="lesson-player" ref={player}>
        <div className="lesson-toolbar">
          <span className="pill">
            {review ? 'TARGETED REVIEW' : daily ? 'DAILY MIX' : fullLesson?.level.toUpperCase()}
          </span>
          <button className="text-button" onClick={onFocus}>
            <TargetIcon /> Focus
          </button>
        </div>
        <div className="lesson-progress">
          <div
            style={{ width: `${intro ? 5 : reflect ? 95 : ((step + 0.5) / tasks.length) * 85}%` }}
          />
        </div>
        <p className="fine">{learningContext}</p>
        <AnimatePresence mode="wait">
          <motion.div
            key={intro ? 'intro' : reflect ? 'reflect' : step}
            initial={still ? false : { opacity: 0, y: 20, scale: 0.985 }}
            animate={{ opacity: 1, y: 0 }}
            exit={still ? {} : { opacity: 0, y: -12 }}
            transition={{ duration: still ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {intro && fullLesson ? (
              <div className="lesson-intro">
                <span className="eyebrow">LET’S MAKE IT CLICK</span>
                <h2>{fullLesson.title}</h2>
                <p className="concept">{fullLesson.concept}</p>
                <ConceptExplorer lesson={fullLesson} />
                <ExplanationTools id={fullLesson.id} />
                <div className="worked-example">
                  <span>
                    <LightbulbIcon weight="duotone" /> A real-life example
                  </span>
                  <p>{fullLesson.example}</p>
                </div>
                <div className="tutor-tip">
                  <Blob small />
                  <p>{fullLesson.tip}</p>
                </div>
                <button
                  className="button primary full"
                  data-tally-sound="open"
                  onClick={() => setIntro(false)}
                >
                  I’m ready to try <ArrowRightIcon />
                </button>
                <p className="fine center">Take your time. Hints are always here.</p>
              </div>
            ) : reflect ? (
              <div className="reflection">
                <span className="eyebrow">MAKE IT YOURS</span>
                <h2>Could you teach it to a friend?</h2>
                <p>
                  Try explaining the idea in one sentence. Saying it in your own words helps it
                  stick.
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
                  maxLength={2000}
                />
                <p>How does it feel now?</p>
                <div className="confidence-options">
                  {confidenceOptions.map((c) => (
                    <button
                      aria-pressed={confidence === c}
                      className={confidence === c ? 'selected' : ''}
                      key={c}
                      data-tally-sound="select"
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
                      ? 'This topic will return for review tomorrow.'
                      : 'Your answers and hint use will help choose when this returns.'}
                  </p>
                </div>
                <button className="button primary full" onClick={finish}>
                  Finish lesson <CheckIcon />
                </button>
              </div>
            ) : task ? (
              <>
                <div className="task-label">
                  {review ? 'RECALL' : daily ? 'CHALLENGE' : 'PRACTICE'}{' '}
                  <span className="mono">
                    0{step + 1} / 0{tasks.length}
                  </span>
                </div>
                {currentChallenge && (
                  <div className="challenge-context" role="note" aria-label="Why this challenge">
                    <strong>
                      {lessons.find((l) => l.id === currentChallenge.id)?.title} ·{' '}
                      {currentChallenge.level === 'guided'
                        ? 'Guided practice'
                        : currentChallenge.level === 'stretch'
                          ? 'Stretch challenge'
                          : 'Standard practice'}
                    </strong>
                    <p>
                      {currentChallenge.followUp
                        ? 'Practice the same topic with a fresh question. This extra question does not add XP.'
                        : !review &&
                            !daily &&
                            currentChallenge.level === 'guided' &&
                            Object.entries(results).some(
                              ([index, result]) =>
                                Number(index) < step && (result.mistakes >= 2 || result.hints >= 2),
                            )
                          ? 'An earlier activity needed a hand. This next example keeps the method visible.'
                          : currentChallenge.level !==
                              personalChallenge(
                                currentChallenge.id,
                                history[currentChallenge.id],
                                startingTutor,
                                coachingHistory?.[currentChallenge.id],
                                !review && !daily,
                              ).level
                            ? 'Continue with this saved question.'
                            : personalChallenge(
                                currentChallenge.id,
                                history[currentChallenge.id],
                                startingTutor,
                                coachingHistory?.[currentChallenge.id],
                                !review && !daily,
                              ).reason}
                    </p>
                  </div>
                )}
                {((results[step]?.mistakes || 0) >= 2 || (results[step]?.hints || 0) >= 2) && (
                  <TutorSupport
                    key={`support-${step}`}
                    id={tasks[step].conceptId}
                    onHelp={() => record('hints')}
                  />
                )}
                {task.type === 'choice' ? (
                  <ChoiceTask
                    onHint={() => record('hints')}
                    key={`choice-${step}`}
                    challenge={task.challenge}
                    onNext={next}
                    feedback={feedback}
                    onMistake={() => record('mistakes')}
                  />
                ) : task.type === 'journal' ? (
                  <JournalTask
                    onHint={() => record('hints')}
                    key={`journal-${step}`}
                    challenge={task.challenge}
                    onNext={next}
                    feedback={feedback}
                    onMistake={() => record('mistakes')}
                  />
                ) : task.type === 'recall' ? (
                  <RecallTask
                    key={`recall-${step}`}
                    cards={task.cards}
                    onNext={next}
                    feedback={feedback}
                    onMistake={() => record('mistakes')}
                  />
                ) : task.type === 'sort' ? (
                  <SortTask
                    key={`sort-${step}`}
                    items={task.items}
                    onNext={next}
                    feedback={feedback}
                    onMistake={() => record('mistakes')}
                  />
                ) : task.type === 'entry' ? (
                  <EntryTask
                    onHint={() => record('hints')}
                    key={`entry-${step}`}
                    entry={task.entry}
                    onNext={next}
                    feedback={feedback}
                    onMistake={() => record('mistakes')}
                    onCorrect={() => setAnsweredStep(step)}
                  >
                    {review && currentChallenge && answeredStep === step && (
                      <div className="challenge-decisions">
                        <fieldset>
                          <legend>How confident do you feel about this session?</legend>
                          <div className="confidence-options">
                            {confidenceOptions.map((c) => (
                              <button
                                key={c}
                                type="button"
                                aria-pressed={confidence === c}
                                className={confidence === c ? 'selected' : ''}
                                onClick={() => setConfidence(c)}
                              >
                                {c}
                              </button>
                            ))}
                          </div>
                        </fieldset>
                        {!currentChallenge.followUp && (
                          <div
                            role="group"
                            aria-label="Choose a follow-up question"
                            className="challenge-options"
                          >
                            {currentChallenge.level !== 'guided' && (
                              <button
                                type="button"
                                className="text-button"
                                aria-pressed={
                                  !!reviewPlan[step + 1]?.followUp &&
                                  reviewPlan[step + 1]?.level === 'guided'
                                }
                                onClick={() => chooseFollowUp('guided')}
                              >
                                Practice with guidance
                              </button>
                            )}
                            {currentChallenge.level !== 'stretch' && (
                              <button
                                type="button"
                                className="text-button"
                                aria-pressed={
                                  !!reviewPlan[step + 1]?.followUp &&
                                  reviewPlan[step + 1]?.level !== 'guided'
                                }
                                onClick={() =>
                                  chooseFollowUp(
                                    challengeLevels[
                                      challengeLevels.indexOf(currentChallenge.level) + 1
                                    ],
                                  )
                                }
                              >
                                {currentChallenge.level === 'guided'
                                  ? 'Try without the steps'
                                  : 'Try a harder question'}
                              </button>
                            )}
                          </div>
                        )}
                        <p className="fine" aria-live="polite">
                          {reviewPlan[step + 1]?.followUp
                            ? `Continue to a ${reviewPlan[step + 1].level} follow-up question.`
                            : (results[step]?.mistakes ||
                                  results[step]?.hints ||
                                  confidence === 'Still learning') &&
                                !currentChallenge.followUp
                              ? 'Continue to a guided follow-up for this topic.'
                              : 'Continue when you’re ready.'}
                        </p>
                      </div>
                    )}
                  </EntryTask>
                ) : (
                  <OrderTask
                    onHint={() => record('hints')}
                    key={`order-${step}`}
                    items={task.items}
                    tip={task.tip}
                    onNext={next}
                    feedback={feedback}
                    onMistake={() => record('mistakes')}
                  />
                )}
              </>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </CoachScope>
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
      explanation: 'The business owes the bank R800. That makes the loan a liability.',
    },
    {
      name: 'Your investment',
      category: 'Equity',
      amount: 400,
      explanation: 'The owner contributed R400. Assets R1 200 = Liabilities R800 + Equity R400.',
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
  const [preview, setPreview] = useState<Category | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const still = useReducedMotion();
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
  function settle() {
    setPreview(null);
    animate(x, 0, { duration: still ? 0 : 0.2 });
    animate(y, 0, { duration: still ? 0 : 0.2 });
  }
  const gesture = usePointerGesture({
    enabled: !correct,
    onStart: () => {
      x.stop();
      y.stop();
    },
    onMove: (move) => {
      x.set(Math.max(-125, Math.min(125, move.dx * 0.65)));
      y.set(Math.max(-80, Math.min(45, move.dy * 0.5)));
      setPreview(
        Math.abs(move.dx) > Math.abs(move.dy) * 1.2
          ? move.dx < 0
            ? 'Asset'
            : 'Liability'
          : move.dy < -12 && Math.abs(move.dy) > Math.abs(move.dx) * 1.2
            ? 'Equity'
            : null,
      );
    },
    onEnd: (move) => {
      const direction = swipeDirection(move);
      settle();
      if (direction === 'left') choose('Asset');
      if (direction === 'right') choose('Liability');
      if (direction === 'up') choose('Equity');
    },
    onCancel: settle,
  });
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
            A <b>{money(left)}</b>
          </span>
          <span>=</span>
          <span>
            L + E <b>{money(right)}</b>
          </span>
        </div>
      </div>
      <motion.div
        className={`sort-card ${preview ? 'is-swiping' : ''}`}
        key={index}
        style={{ x, y }}
        {...gesture}
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
      >
        {preview && (
          <span className="sort-gesture-preview" aria-hidden="true">
            {preview}
          </span>
        )}
        <span className="fine mono">
          ITEM {index + 1} OF {items.length}
        </span>
        <h3>{item.name}</h3>
        <strong className="mono">{money(item.amount)}</strong>
        <span className="swipe-hint">
          <HandSwipeLeftIcon /> Left: Asset · Right: Liability · Up: Equity
        </span>
      </motion.div>
      <div className="sort-options">
        {(['Asset', 'Liability', 'Equity'] as Category[]).map((c, i) => (
          <button
            key={c}
            disabled={correct}
            data-preview={preview === c}
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
  onHint,
  entry,
  onNext,
  onMistake,
  feedback,
  onCorrect,
  children,
}: {
  entry: Entry;
  onHint: () => void;
  onNext: () => void;
  onMistake: () => void;
  feedback: (v: boolean) => void;
  onCorrect?: () => void;
  children?: ReactNode;
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
    else onCorrect?.();
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
          children={children}
        />
      )}
      <button
        className="text-button hint-button"
        data-tally-sound="hint"
        aria-expanded={hint}
        onClick={() => {
          if (!hint) onHint();
          setHint(!hint);
        }}
      >
        <LightbulbIcon weight="duotone" />
        {hint ? 'Hide hint' : 'Show hint'}
      </button>
      {hint && (
        <div className="tutor-tip">
          <Blob small />
          <p>{entry.tip}</p>
        </div>
      )}
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
  const handle = useRef<HTMLButtonElement>(null);
  const point = useRef({ y: 0 });
  const [dragging, setDragging] = useState(false);
  const startIndex = useRef(index);
  useDragAutoScroll(dragging, point, handle);
  return (
    <Reorder.Item
      className="order-row"
      value={value}
      dragListener={false}
      dragControls={controls}
      dragMomentum={false}
      whileDrag={{ zIndex: 2, boxShadow: '0 8px 24px #202b4324' }}
      onDragStart={(_, info) => {
        startIndex.current = index;
        emitFeedback('pickup');
        point.current.y = info.point.y - window.scrollY;
        setDragging(true);
      }}
      onDrag={(_, info) => {
        point.current.y = info.point.y - window.scrollY;
      }}
      onDragEnd={() => {
        setDragging(false);
        if (startIndex.current !== index) emitFeedback('place');
      }}
    >
      <button
        ref={handle}
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
  onHint,
  items,
  tip,
  onNext,
  onMistake,
  feedback,
}: {
  items: string[];
  tip: string;
  onHint: () => void;
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
    emitFeedback('place');
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
              : `The order isn’t correct yet. ${tip}`
          }
          onNext={onNext}
        />
      )}
      <button
        className="text-button hint-button"
        data-tally-sound="hint"
        aria-expanded={hint}
        onClick={() => {
          if (!hint) onHint();
          setHint(!hint);
        }}
      >
        <LightbulbIcon /> {hint ? 'Hide hint' : 'Show hint'}
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
