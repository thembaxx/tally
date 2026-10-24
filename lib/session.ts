import type { Lesson } from './learning';
import { confidenceOptions, isDay, natural, type ConceptResult } from './reviews';
import { challengeLevels, type Challenge } from './challenge-questions';

export type ReviewSession = { kind: 'review'; ids: string[] };
export type Session = Lesson | 'daily' | ReviewSession;
export type TaskResult = { mistakes: number; hints: number };
export type LessonDraft = {
  lessonId: string;
  reviewIds: string[];
  day: string;
  attempt: number;
  reviewAttempts: Record<string, number>;
  intro: boolean;
  step: number;
  reflect: boolean;
  confidence: string;
  note: string;
  results: Record<string, TaskResult>;
  reviewPlan?: Challenge[];
  dailyChallenge?: Challenge;
};
export type SessionResult = {
  day: string;
  confidence: string;
  note: string;
  concepts: ConceptResult[];
};
export function sessionId(session: Session) {
  return session === 'daily' ? 'daily' : 'kind' in session ? 'review' : session.id;
}
export function matchesDraft(draft: LessonDraft | null, session: Session, day: string) {
  if (!draft || draft.lessonId !== sessionId(session)) return false;
  if (session === 'daily') return draft.day === day;
  return !('kind' in session) || session.ids.join(',') === draft.reviewIds.join(',');
}
export function readDraft(raw: unknown, ids: string[]): LessonDraft | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;
  if (
    typeof d.lessonId !== 'string' ||
    ![...ids, 'daily', 'review'].includes(d.lessonId) ||
    !isDay(d.day)
  )
    return null;
  const reviewIds = Array.isArray(d.reviewIds)
    ? [
        ...new Set(
          d.reviewIds.filter((id): id is string => typeof id === 'string' && ids.includes(id)),
        ),
      ].slice(0, 2)
    : [];
  if (d.lessonId === 'review' && !reviewIds.length) return null;
  function challenge(raw: unknown, allowed: string[]): Challenge | null {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
    const c = raw as Record<string, unknown>;
    if (
      typeof c.id !== 'string' ||
      !allowed.includes(c.id) ||
      !challengeLevels.includes(c.level as Challenge['level']) ||
      typeof c.attempt !== 'number' ||
      !Number.isSafeInteger(c.attempt) ||
      c.attempt < 0 ||
      c.attempt > 1000000
    )
      return null;
    return {
      id: c.id,
      attempt: c.attempt,
      level: c.level as Challenge['level'],
      ...(c.followUp === true ? { followUp: true } : {}),
    };
  }
  let reviewPlan: Challenge[] | undefined;
  if (d.reviewPlan !== undefined) {
    if (
      d.lessonId !== 'review' ||
      !Array.isArray(d.reviewPlan) ||
      !d.reviewPlan.length ||
      d.reviewPlan.length > 4
    )
      return null;
    const plan = d.reviewPlan.map((raw) => challenge(raw, reviewIds));
    if (plan.some((c) => !c)) return null;
    reviewPlan = plan as Challenge[];
    if (
      reviewPlan
        .filter((c) => !c.followUp)
        .map((c) => c.id)
        .join(',') !== reviewIds.join(',')
    )
      return null;
    for (let i = 0; i < reviewPlan.length; i++) {
      const c = reviewPlan[i],
        previous = reviewPlan[i - 1];
      if (
        c.followUp &&
        (!previous ||
          previous.followUp ||
          previous.id !== c.id ||
          c.attempt !== previous.attempt + 1)
      )
        return null;
    }
  }
  const dailyChallenge =
    d.dailyChallenge === undefined ? undefined : challenge(d.dailyChallenge, ids);
  if (
    d.dailyChallenge !== undefined &&
    (d.lessonId !== 'daily' || !dailyChallenge || dailyChallenge.followUp)
  )
    return null;
  const results =
    d.results && typeof d.results === 'object'
      ? Object.fromEntries(
          Object.entries(d.results).flatMap(([key, value]) => {
            if (!/^\d{1,2}$/.test(key) || !value || typeof value !== 'object') return [];
            return [[key, { mistakes: natural(value.mistakes), hints: natural(value.hints) }]];
          }),
        )
      : {};
  return {
    lessonId: d.lessonId,
    reviewIds,
    day: d.day,
    attempt: natural(d.attempt),
    reviewAttempts:
      d.reviewAttempts && typeof d.reviewAttempts === 'object'
        ? Object.fromEntries(
            Object.entries(d.reviewAttempts)
              .filter(([id]) => reviewIds.includes(id))
              .map(([id, attempt]) => [id, natural(attempt)]),
          )
        : {},
    intro: d.intro === true,
    step: natural(d.step, 99),
    reflect: d.reflect === true,
    confidence:
      typeof d.confidence === 'string' && confidenceOptions.includes(d.confidence)
        ? d.confidence
        : 'Getting there',
    note: typeof d.note === 'string' ? d.note.slice(0, 2000) : '',
    results,
    ...(reviewPlan ? { reviewPlan } : {}),
    ...(dailyChallenge ? { dailyChallenge } : {}),
  };
}
