import { practiceTopics, recommendedChallenge } from './adaptive';
import type { ChallengeLevel } from './challenge-questions';
import type { CoachingEvidence } from './experiences';
import { isDay } from './reviews';
import type { Review } from './reviews';

export type Explanation = 'simple' | 'example' | 'deeper';
export type TutorProfile = {
  support: 'auto' | 'guided' | 'independent';
  explanation: 'auto' | Explanation;
  session: 'auto' | 'one' | 'two';
  formats: Record<string, Explanation>;
  startingPoint: {
    answers: Record<string, 'ready' | 'support'>;
    day?: string;
  };
};
export const initialTutor: TutorProfile = {
  support: 'auto',
  explanation: 'auto',
  session: 'auto',
  formats: {},
  startingPoint: { answers: {} },
};
const explanations = ['simple', 'example', 'deeper'];
export function readTutor(raw: unknown, ids: string[]): TutorProfile {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return initialTutor;
  const p = raw as Partial<TutorProfile>;
  const rawAnswers = p.startingPoint?.answers;
  const answers =
    rawAnswers && typeof rawAnswers === 'object'
      ? (Object.fromEntries(
          Object.entries(rawAnswers).filter(
            ([id, value]) =>
              ['equation', 'debit', 'statements'].includes(id) &&
              (value === 'ready' || value === 'support'),
          ),
        ) as TutorProfile['startingPoint']['answers'])
      : {};
  return {
    support: p.support === 'guided' || p.support === 'independent' ? p.support : 'auto',
    explanation: explanations.includes(p.explanation || '')
      ? (p.explanation as Explanation)
      : 'auto',
    session: p.session === 'one' || p.session === 'two' ? p.session : 'auto',
    formats:
      p.formats && typeof p.formats === 'object'
        ? Object.fromEntries(
            Object.entries(p.formats).filter(
              ([id, mode]) =>
                [...ids, 'reconcile', 'repair', 'cash-case'].includes(id) &&
                explanations.includes(mode),
            ),
          )
        : {},
    startingPoint: {
      answers,
      ...(isDay(p.startingPoint?.day) &&
      ['equation', 'debit', 'statements'].every((id) => answers[id])
        ? { day: p.startingPoint.day }
        : {}),
    },
  };
}

export function personalChallenge(
  id: string,
  review: Review | undefined,
  tutor: TutorProfile,
  coaching?: CoachingEvidence,
  lesson = false,
): { level: ChallengeLevel; reason: string } {
  if (tutor.support === 'guided')
    return {
      level: 'guided',
      reason: 'You chose smaller steps with the method shown. Change this whenever you like.',
    };
  const recommendation = recommendedChallenge(review);
  if (tutor.support === 'independent')
    return {
      level: recommendation.level === 'stretch' ? 'stretch' : 'standard',
      reason: 'You chose to try independently. Hints and worked examples are still available.',
    };
  if (coaching?.misconception && coaching.tries >= 2)
    return {
      level: 'guided',
      reason: `Your reasoning check suggests revisiting this connection: ${coaching.misconception}`,
    };
  if (!review?.attempts || !review.total) {
    const starting = tutor.startingPoint.answers[id];
    if (starting)
      return starting === 'ready'
        ? {
            level: 'standard',
            reason:
              'You made this connection in your starting-point check. Try a fresh question independently.',
          }
        : {
            level: 'guided',
            reason:
              'You asked for help with this starting idea. Begin with a smaller problem and the method shown.',
          };
    // An ordinary lesson already teaches the idea before its first question.
    if (lesson)
      return {
        level: 'standard',
        reason: 'Explore the example, then try applying it. Take all the time you need.',
      };
  }
  return recommendation;
}

export function explanationFor(
  id: string,
  tutor: TutorProfile,
  review?: Review,
  coaching?: CoachingEvidence,
): Explanation {
  if (tutor.formats[id]) return tutor.formats[id];
  if (tutor.explanation !== 'auto') return tutor.explanation;
  if (
    coaching?.misconception ||
    review?.mistakes ||
    review?.hints ||
    tutor.support === 'guided' ||
    tutor.startingPoint.answers[id] === 'support'
  )
    return 'example';
  if (review && review.streak >= 2 && !review.guided) return 'deeper';
  return 'simple';
}

// A repair suggestion is optional. Unknown prerequisites never block exploration.
const prerequisites: Record<string, string[]> = {
  debit: ['equation'],
  statements: ['debit'],
  bakery: ['debit', 'statements'],
  accruals: ['debit'],
  inventory: ['statements'],
  depreciation: ['debit'],
  ratios: ['equation', 'statements'],
  budgeting: ['statements'],
  breakeven: ['statements'],
  deferrals: ['accruals'],
  consolidation: ['equation', 'statements'],
  'journal-lab': ['debit'],
  'spot-the-slip': ['debit'],
  cashflow: ['statements'],
  recall: ['equation'],
};
function needsSupport(review?: Review) {
  return (
    !!review?.attempts &&
    !!review.total &&
    (review.mistakes >= 2 || review.hints >= 2 || review.confidence === 'Still learning')
  );
}
export function tutorPlan(
  reviews: Record<string, Review>,
  today: string,
  completed: string[],
  ids: string[],
  tutor: TutorProfile,
  goal: number,
  coaching: Record<string, CoachingEvidence> = {},
) {
  let topics = practiceTopics(reviews, today, completed, ids);
  const misconception = ids.find((id) => coaching[id]?.tries >= 2 && coaching[id].misconception);
  if (misconception) topics = [...new Set([misconception, ...topics])];
  const first = topics[0];
  const repair =
    needsSupport(reviews[first]) || misconception === first
      ? prerequisites[first]?.find((id) => ids.includes(id) && needsSupport(reviews[id]))
      : undefined;
  if (repair) topics = [repair, first];
  const smaller =
    tutor.session === 'one' ||
    (tutor.session === 'auto' &&
      (goal === 3 || needsSupport(reviews[topics[0]]) || !!misconception));
  topics = topics.slice(0, smaller ? 1 : 2);
  return {
    topics,
    repair,
    reason: repair
      ? 'Reconnect a supporting idea first, then return to the bigger concept.'
      : smaller
        ? 'One idea at a time, with room to think. Your next topic can wait.'
        : 'A small mix chosen from your answers, hints, confidence and review dates.',
  };
}

export const startingQuestions = [
  {
    id: 'equation',
    title: 'What is your share?',
    prompt:
      'A little shop owns R500 in cash and owes the bank R200. How much belongs to its owner?',
    choices: ['R300', 'R700', 'R200'],
    answer: 'R300',
    explanation:
      'Assets R500 = liabilities R200 + equity R300. The owner’s share is what remains after the debt.',
  },
  {
    id: 'debit',
    title: 'Follow the value.',
    prompt: 'The shop buys an oven with cash. What has happened?',
    choices: [
      'One asset changed into another asset.',
      'Every cash payment is an expense.',
      'The shop earned revenue.',
    ],
    answer: 'One asset changed into another asset.',
    explanation:
      'Debit Equipment; credit Cash. The shop still owns the value, now as an oven. A payment is not always an expense.',
  },
  {
    id: 'statements',
    title: 'What did the shop earn?',
    prompt: 'Sales are R400. Cost of sales is R150 and rent is R50. What is the profit?',
    choices: ['R400', 'R250', 'R200'],
    answer: 'R200',
    explanation:
      'R400 revenue − R150 cost of sales = R250 gross profit. Less R50 rent leaves R200 net profit.',
  },
] as const;
