import type { Challenge, ChallengeLevel } from './challenge-questions';
import { weakestReviews, type Review } from './reviews';

export function recommendedChallenge(review: Review | undefined): {
  level: ChallengeLevel;
  reason: string;
} {
  if (!review?.attempts || !review.total)
    return { level: 'guided', reason: 'Start with a smaller problem and the method shown.' };
  if (review.mistakes || review.hints || review.confidence === 'Still learning')
    return {
      level: 'guided',
      reason:
        'Your last practice needed support. Work through the method, then try a fresh question.',
    };
  if (review.guided)
    return {
      level: 'standard',
      reason: 'You completed guided practice. Try applying the idea without the steps shown.',
    };
  if (review.streak >= 2)
    return {
      level: 'stretch',
      reason:
        'You recalled this independently on separate days. Try a multi-step or reverse problem.',
    };
  return { level: 'standard', reason: 'Practice applying the idea in a new example.' };
}

export function practiceTopics(
  reviews: Record<string, Review>,
  today: string,
  explored: string[],
  available: string[],
) {
  const due = weakestReviews(reviews, today).filter((id) => available.includes(id));
  if (due.length) return due.slice(0, 2);
  const support = available.filter((id) => {
    const review = reviews[id];
    return (
      review?.attempts &&
      (review.mistakes ||
        review.hints ||
        review.guided ||
        !review.streak ||
        review.confidence === 'Still learning')
    );
  });
  if (support.length) return support.slice(0, 2);
  const uncertain = available.find((id) => explored.includes(id) && !reviews[id]?.attempts);
  if (uncertain) return [uncertain];
  // Introduce one new topic at a time in lesson order. XP and focus minutes do
  // not unlock harder questions or skip the foundations.
  const next = available.find((id) => !explored.includes(id) && !reviews[id]?.attempts);
  if (next) return [next];
  return available
    .filter((id) => reviews[id])
    .sort((a, b) => reviews[a].due.localeCompare(reviews[b].due))
    .slice(0, 2);
}

export function followUp(challenge: Challenge, level: ChallengeLevel): Challenge {
  return { id: challenge.id, attempt: challenge.attempt + 1, level, followUp: true };
}
