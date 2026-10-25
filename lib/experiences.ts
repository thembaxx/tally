import { decisions, readTransactions, type DecisionId } from './business';
export const projectIds = ['reconcile', 'repair', 'cash-case'] as const;
export type ProjectId = (typeof projectIds)[number];
export type CoachingEvidence = {
  tries: number;
  explained: number;
  misconception: string;
  note: string;
};
export type Experiences = {
  transactions: DecisionId[];
  awards: string[];
  projects: Partial<Record<ProjectId, number>>;
  coaching: Record<string, CoachingEvidence>;
};
export const emptyExperiences: Experiences = {
  transactions: [],
  awards: [],
  projects: {},
  coaching: {},
};
export function readExperiences(raw: unknown): Experiences {
  if (!raw || typeof raw !== 'object') return emptyExperiences;
  const p = raw as Partial<Experiences>;
  const count = (v: unknown) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.min(10000, Math.max(0, Math.floor(v))) : 0;
  const awards = [...decisions.map((d) => `shop-${d.id}`), ...projectIds];
  return {
    transactions: readTransactions(p.transactions),
    awards: Array.isArray(p.awards)
      ? [...new Set(p.awards.filter((id) => awards.includes(id)))]
      : [],
    projects: Object.fromEntries(
      projectIds
        .filter((id) => typeof p.projects?.[id] === 'number')
        .map((id) => [id, Math.min(3, count(p.projects?.[id]))]),
    ),
    coaching:
      p.coaching && typeof p.coaching === 'object'
        ? Object.fromEntries(
            Object.entries(p.coaching)
              .filter(([id, v]) => /^[a-z-]{1,30}$/.test(id) && v && typeof v === 'object')
              .slice(0, 40)
              .map(([id, v]) => [
                id,
                {
                  tries: count(v.tries),
                  explained: count(v.explained),
                  misconception:
                    typeof v.misconception === 'string' ? v.misconception.slice(0, 150) : '',
                  note: typeof v.note === 'string' ? v.note.slice(0, 1000) : '',
                },
              ]),
          )
        : {},
  };
}
