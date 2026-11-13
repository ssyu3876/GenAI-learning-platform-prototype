import { describe, expect, it } from 'vitest';
import { mergeScenarioRows, type ScenarioRunRow } from './queries';

const titles = new Map([
  ['ship-it', 'Ship It'],
  ['sprint-zero', 'Sprint Zero'],
  ['agent-dungeon', 'Agent Dungeon'],
]);

function row(key: string, learners: number, extra: Partial<ScenarioRunRow> = {}): ScenarioRunRow {
  return {
    key,
    learners,
    runs: learners,
    finished: 0,
    completions: 0,
    avgBest: 0,
    lastPlayedAt: null,
    ...extra,
  };
}

describe('mergeScenarioRows', () => {
  it('shows a scenario nobody has opened instead of dropping it', () => {
    const rows = mergeScenarioRows(titles, new Map([['ship-it', row('ship-it', 3)]]), new Set());
    expect(rows.map((r) => r.key)).toEqual(['ship-it', 'agent-dungeon', 'sprint-zero']);
    const untouched = rows.find((r) => r.key === 'agent-dungeon')!;
    expect(untouched.learners).toBe(0);
    expect(untouched.runs).toBe(0);
    expect(untouched.lastPlayedAt).toBeNull();
  });

  it('puts the busiest scenario first, ties broken by title', () => {
    const rows = mergeScenarioRows(
      titles,
      new Map([['sprint-zero', row('sprint-zero', 9)], ['ship-it', row('ship-it', 2)]]),
      new Set(),
    );
    expect(rows.map((r) => r.key)).toEqual(['sprint-zero', 'ship-it', 'agent-dungeon']);
  });

  it('keeps history for a key that left the catalogue, after the live ones', () => {
    const rows = mergeScenarioRows(titles, new Map([['old-lab', row('old-lab', 99)]]), new Set());
    const retired = rows[rows.length - 1]!;
    expect(retired.key).toBe('old-lab');
    expect(retired.title).toBe('old-lab');
    // Busier than everything else, but still last: it is not something you can act on.
    expect(retired.learners).toBe(99);
  });

  it('marks closed scenarios and leaves the rest open', () => {
    const rows = mergeScenarioRows(titles, new Map(), new Set(['ship-it', 'old-lab']));
    expect(rows.find((r) => r.key === 'ship-it')!.closed).toBe(true);
    expect(rows.find((r) => r.key === 'sprint-zero')!.closed).toBe(false);
  });
});
