import { describe, expect, it } from 'vitest';
import { releaseGameConfig } from '../../content/release-week';
import { releaseRunSchema } from './schema';
import { releaseRunEndingKey, releaseRunScore } from './score';

describe('release-run activity', () => {
  it('builds a valid config with three rounds of two decisions', () => {
    const parsed = releaseRunSchema.safeParse(releaseGameConfig());
    expect(parsed.success).toBe(true);
    if (!parsed.success) return;

    expect(parsed.data.rounds).toHaveLength(3);
    for (const round of parsed.data.rounds) {
      expect(round.steps).toHaveLength(2);
      for (const step of round.steps) expect(step.choices.length).toBeGreaterThanOrEqual(2);
    }
    expect(parsed.data.stats.map((s) => s.key)).toEqual(['budget', 'morale', 'users', 'quality']);
  });

  it('starts between the two extremes, so neither ending is decided on day one', () => {
    const score = releaseRunScore(releaseGameConfig().start);
    expect(releaseRunEndingKey(score)).toBe('bruised');
  });
});
