export type FeedbackCue =
  | 'tap'
  | 'navigate'
  | 'open'
  | 'select'
  | 'pickup'
  | 'place'
  | 'hint'
  | 'flip'
  | 'correct'
  | 'incorrect'
  | 'complete'
  | 'focus-start'
  | 'focus-pause'
  | 'focus-end';

export const feedbackPatterns: Record<FeedbackCue, number | number[]> = {
  tap: 6,
  navigate: 8,
  open: 10,
  select: 6,
  pickup: 8,
  place: 12,
  hint: 8,
  flip: 8,
  correct: [12, 35, 12],
  incorrect: [18, 45, 8],
  complete: [12, 40, 16, 55, 22],
  'focus-start': 12,
  'focus-pause': 8,
  'focus-end': [14, 50, 20],
};

export function isFeedbackCue(value: unknown): value is FeedbackCue {
  return typeof value === 'string' && Object.hasOwn(feedbackPatterns, value);
}

/** Pointer interactions use the same engine as buttons, including inside dialog portals. */
export function emitFeedback(cue: FeedbackCue) {
  if (typeof document !== 'undefined')
    document.dispatchEvent(new CustomEvent('tally-feedback', { detail: cue }));
}
