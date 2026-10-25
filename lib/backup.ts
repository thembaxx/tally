import { readProgress, type Progress } from './learning';
import { isDay } from './reviews';

export function readBackup(text: string): Progress {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Choose a valid Tally progress JSON file.');
  }
  const p = data?.progress;
  if (
    !p ||
    typeof p !== 'object' ||
    Array.isArray(p) ||
    typeof p.xp !== 'number' ||
    !Number.isFinite(p.xp) ||
    p.xp < 0 ||
    !Array.isArray(p.completed) ||
    !p.completed.every((id: unknown) => typeof id === 'string') ||
    typeof p.onboarded !== 'boolean' ||
    typeof p.name !== 'string' ||
    !p.activity ||
    typeof p.activity !== 'object' ||
    Array.isArray(p.activity) ||
    !Object.entries(p.activity).every(
      ([day, value]) =>
        isDay(day) && typeof value === 'number' && Number.isFinite(value) && value >= 0,
    )
  ) {
    throw new Error(
      'This file does not contain valid Tally progress. Your current progress is unchanged.',
    );
  }
  if (data.version !== undefined && data.version !== 2)
    throw new Error('This backup version is not supported. Your current progress is unchanged.');
  // Versionless exports used a separate top-level review schedule.
  return readProgress(JSON.stringify({ ...p, reviews: p.reviews ?? data.reviews ?? {} }));
}
