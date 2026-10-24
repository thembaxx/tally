import { addDays } from './south-africa';

export type Review = {
  due: string;
  confidence: string;
  mistakes: number;
  hints: number;
  streak: number;
  interval: number;
  attempts: number;
  firstTry: number;
  total: number;
  lastReviewed?: string;
  guided?: boolean;
  nextQuestion?: number;
};
export type ConceptResult = {
  id: string;
  mistakes: number;
  hints: number;
  firstTry: number;
  total: number;
  guided?: boolean;
  nextQuestion?: number;
};
export const confidenceOptions = ['Still learning', 'Getting there', 'It clicked!'];
export function isDay(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function natural(value: unknown, max = 1000000) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(0, Math.floor(value)))
    : 0;
}
export function readReviews(value: unknown, ids: string[]): Record<string, Review> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).flatMap(([id, raw]) => {
      if (!ids.includes(id) || !raw || typeof raw !== 'object' || !isDay(raw.due)) return [];
      const total = natural(raw.total);
      return [
        [
          id,
          {
            due: raw.due,
            confidence: confidenceOptions.includes(raw.confidence)
              ? raw.confidence
              : 'Getting there',
            mistakes: natural(raw.mistakes),
            hints: natural(raw.hints),
            streak: natural(raw.streak, 4),
            interval: natural(raw.interval, 30),
            attempts: natural(raw.attempts),
            total,
            firstTry: Math.min(total, natural(raw.firstTry)),
            ...(isDay(raw.lastReviewed) ? { lastReviewed: raw.lastReviewed } : {}),
            ...(raw.guided === true ? { guided: true } : {}),
            ...(typeof raw.nextQuestion === 'number' &&
            Number.isSafeInteger(raw.nextQuestion) &&
            raw.nextQuestion >= 0
              ? { nextQuestion: natural(raw.nextQuestion) }
              : {}),
          },
        ],
      ];
    }),
  );
}
export function scheduleReview(
  previous: Review | undefined,
  result: ConceptResult,
  confidence: string,
  day: string,
): Review {
  const independent =
    result.mistakes === 0 &&
    result.hints === 0 &&
    !result.guided &&
    confidence !== 'Still learning';
  // A second run on the same day is useful practice, but not spaced recall.
  const streak = independent
    ? Math.min(4, (previous?.streak || 0) + (previous?.lastReviewed === day ? 0 : 1))
    : 0;
  const interval = [1, 3, 7, 14, 30][streak];
  const due = addDays(day, interval);
  return {
    due,
    confidence,
    mistakes: result.mistakes,
    hints: result.hints,
    streak,
    interval,
    attempts: (previous?.attempts || 0) + 1,
    firstTry: (previous?.firstTry || 0) + result.firstTry,
    total: (previous?.total || 0) + result.total,
    lastReviewed: day,
    ...(result.guided ? { guided: true } : {}),
    nextQuestion: result.nextQuestion ?? (previous?.nextQuestion ?? previous?.attempts ?? 0) + 1,
  };
}
export function weakestReviews(reviews: Record<string, Review>, today: string) {
  return Object.keys(reviews)
    .filter((id) => reviews[id].due <= today)
    .sort((a, b) => {
      const x = reviews[a],
        y = reviews[b];
      return (
        x.streak - y.streak ||
        (x.total ? x.firstTry / x.total : 0) - (y.total ? y.firstTry / y.total : 0) ||
        x.due.localeCompare(y.due) ||
        a.localeCompare(b)
      );
    });
}
