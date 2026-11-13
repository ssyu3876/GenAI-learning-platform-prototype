import { describe, expect, it } from 'vitest';
import { INTERVIEW_TYPES } from './content/interview';
import { INTERVIEW_GROUP, scenarioCheckKeys } from './queries';

describe('scenarioCheckKeys', () => {
  it('asks about one row for a normal scenario', () => {
    expect(scenarioCheckKeys('ship-it')).toEqual(['ship-it']);
    expect(scenarioCheckKeys('agent-dungeon')).toEqual(['agent-dungeon']);
  });

  it('asks about the group and every format for an interview', () => {
    const keys = scenarioCheckKeys('interview:hr');
    expect(keys[0]).toBe(INTERVIEW_GROUP);
    expect(keys).toHaveLength(INTERVIEW_TYPES.length + 1);
    for (const type of INTERVIEW_TYPES) expect(keys).toContain(`interview:${type.id}`);
  });

  it('gives every format the same answer, so one switch covers them all', () => {
    const first = scenarioCheckKeys(`interview:${INTERVIEW_TYPES[0]!.id}`);
    const last = scenarioCheckKeys(`interview:${INTERVIEW_TYPES[INTERVIEW_TYPES.length - 1]!.id}`);
    expect(new Set(first)).toEqual(new Set(last));
  });
});
