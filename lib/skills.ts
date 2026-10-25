import type { Review } from './reviews';

export const skillStages = [
  { id: 'new', label: 'Not started', description: 'An idea to explore' },
  { id: 'building', label: 'Building', description: 'Ready for more practice' },
  { id: 'strengthening', label: 'Strengthening', description: 'Recalling independently' },
  { id: 'steady', label: 'Steady', description: 'Recalling across several days' },
] as const;

// Completion and XP are not evidence of independent recall. Older backups may
// have a review date without any recorded practice, so keep that uncertainty.
export function skillStage(review: Review | undefined, explored: boolean) {
  if (!review && !explored) return skillStages[0];
  if (
    !review?.total ||
    !review.attempts ||
    review.mistakes ||
    review.hints ||
    review.guided ||
    review.confidence === 'Still learning' ||
    !review.streak
  )
    return skillStages[1];
  return review.streak >= 3 ? skillStages[3] : skillStages[2];
}

export function recallEvidence(review: Review | undefined, explored = true) {
  if (!review?.total || !review.attempts)
    return explored
      ? 'You explored this topic. A short review will show what you can recall.'
      : 'Start with the lesson, then try recalling the idea in your own practice.';
  const support = [
    review.mistakes ? `${review.mistakes} ${review.mistakes === 1 ? 'retry' : 'retries'}` : '',
    review.hints ? `${review.hints} ${review.hints === 1 ? 'hint' : 'hints'}` : '',
  ].filter(Boolean);
  if (support.length) return `Your last practice included ${support.join(' and ')}.`;
  if (review.guided)
    return 'Your last practice used step-by-step guidance. Try a question without the steps next.';
  if (review.confidence === 'Still learning') return 'You marked this “Still learning”.';
  if (!review.streak) return 'Try another day to begin building independent recall.';
  return `You recalled this without hints or retries on ${review.streak === 4 ? 'at least ' : ''}${review.streak} ${review.streak === 1 ? 'separate day' : 'separate days'} in your current streak.`;
}
