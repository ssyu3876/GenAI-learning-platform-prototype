import type { ReleaseRunConfig } from './schema';

export type ReleaseStatKey = 'budget' | 'morale' | 'users' | 'quality';
export type ReleaseStats = Record<ReleaseStatKey, number>;

export function clampStat(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/** Same weighting as the long scenario: trust and quality carry most of it. */
export function releaseRunScore(stats: ReleaseStats): number {
  return clampStat(
    stats.morale * 0.3 + stats.quality * 0.3 + stats.budget * 0.2 + stats.users * 0.2,
  );
}

/** Which ending the current meters point at. */
export function releaseRunEndingKey(score: number): keyof ReleaseRunConfig['endings'] {
  if (score >= 75) return 'clean';
  if (score >= 45) return 'bruised';
  return 'burned';
}
