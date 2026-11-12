import { describe, expect, it } from 'vitest';
import { scenarioTotals } from './queries';

describe('scenarioTotals', () => {
  it('is empty without any finished scenario', () => {
    const totals = scenarioTotals([]);
    expect(totals.finishedScenarios).toEqual([]);
    expect(totals.scenarioRuns).toBe(0);
    expect(totals.dungeonCleared).toBe(false);
    expect(totals.interviewsFinished).toBe(0);
  });

  it('keeps the best score per long scenario, not the last one', () => {
    const totals = scenarioTotals([
      { scenarioKey: 'ship-it', score: 40 },
      { scenarioKey: 'ship-it', score: 90 },
      { scenarioKey: 'ship-it', score: 60 },
    ]);
    expect(totals.shipItBest).toBe(90);
    expect(totals.finishedScenarios).toEqual(['ship-it']);
    // Replays count as runs even when they do not beat the best score.
    expect(totals.scenarioRuns).toBe(3);
  });

  it('counts each interview format once, however many attempts', () => {
    const totals = scenarioTotals([
      { scenarioKey: 'interview:behavioral', score: 50 },
      { scenarioKey: 'interview:behavioral', score: 70 },
      { scenarioKey: 'interview:hr', score: 30 },
    ]);
    expect(totals.interviewsFinished).toBe(2);
    expect(totals.finishedScenarios).toHaveLength(2);
  });

  it('reads the dungeon tier, mode and flawless flag', () => {
    const totals = scenarioTotals([
      { scenarioKey: 'agent-dungeon', score: 70, tier: 2, mode: 'free' },
      { scenarioKey: 'agent-dungeon', score: 85, tier: 4, mode: 'daily', flawless: true },
    ]);
    expect(totals.dungeonCleared).toBe(true);
    expect(totals.dungeonBestTier).toBe(4);
    expect(totals.dungeonBest).toBe(85);
    expect(totals.dungeonFlawless).toBe(true);
    expect(totals.dungeonDaily).toBe(true);
    expect(totals.dungeonWeekly).toBe(false);
  });

  it('ignores rows with no scenario key', () => {
    const totals = scenarioTotals([{ score: 50 }, {}]);
    expect(totals.finishedScenarios).toEqual([]);
    expect(totals.scenarioRuns).toBe(0);
  });

  it('treats a missing score as zero and still counts the finish', () => {
    const totals = scenarioTotals([{ scenarioKey: 'sprint-zero' }]);
    expect(totals.sprintBest).toBe(0);
    expect(totals.finishedScenarios).toEqual(['sprint-zero']);
  });
});
