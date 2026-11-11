// The quality line is rebuilt from history, so every quality change has to reach history
// exactly once. These tests pin that contract: one point per settled turn, no point for
// reading the tests, and a last point that always matches the live quality.
import { describe, expect, it } from 'vitest';
import { SHIP_IT } from './content/ship-it';
import {
  SHIP_START_QUALITY,
  shipAlternatives,
  shipDecide,
  shipNext,
  shipQualitySeries,
  shipRepairPick,
  shipTurn,
  shipVerdict,
  sprintAdvance,
  sprintChoose,
  sprintEnding,
  sprintEnterWeek,
  sprintLeaveSummary,
  sprintScore,
  sprintStep,
  startShip,
  startSprint,
  type ShipState,
} from './engine';
import { RELEASE_WEEK } from './content/release-week';

describe('shipQualitySeries', () => {
  it('starts with one point at 100', () => {
    expect(shipQualitySeries(startShip(1))).toEqual([
      { turn: 0, quality: SHIP_START_QUALITY, label: 'Start' },
    ]);
  });

  it('adds one point per settled turn and matches the live quality', () => {
    let state = startShip(42);
    const total = state.drawn.length;

    for (let turn = 1; turn <= total; turn++) {
      expect(shipTurn(state)).not.toBeNull();
      // Approving settles the turn whether the approval is right or wrong.
      state = shipDecide(state, 'approve');

      const series = shipQualitySeries(state);
      expect(series).toHaveLength(turn + 1);
      expect(series[series.length - 1]?.quality).toBe(state.quality);

      state = shipNext(state);
    }

    expect(state.phase).toBe('done');
  });

  it('never goes back up', () => {
    let state = startShip(7);
    while (state.phase !== 'done') {
      state = state.phase === 'decide' ? shipDecide(state, 'approve') : shipNext(state);
    }

    const qualities = shipQualitySeries(state).map((p) => p.quality);
    expect(qualities).toHaveLength(state.drawn.length + 1);
    expect(qualities).toEqual([...qualities].sort((a, b) => b - a));
    expect(qualities[qualities.length - 1]).toBe(state.quality);
  });

  it('does not plot reading the tests, because looking is not a decision', () => {
    const state = shipDecide(startShip(5), 'evidence');
    expect(state.history).toHaveLength(1);

    const series = shipQualitySeries(state);
    expect(series).toHaveLength(1);
    expect(series[0]?.quality).toBe(SHIP_START_QUALITY);
  });

  it('puts a wrong repair step on the turn it belongs to', () => {    const turn = SHIP_IT.turns.find((t) => t.repair && t.repair.steps.length > 0);
    if (!turn?.repair) throw new Error('The turn bank needs at least one turn with a repair.');

    let state: ShipState = { ...startShip(9), drawn: [turn.id], turnIndex: 0 };
    state = shipDecide(state, 'repair');
    expect(state.phase).toBe('repair');

    const firstStep = turn.repair.steps[0];
    const wrong = firstStep?.options.find((o) => !o.ok);
    if (!wrong) throw new Error('The first repair step needs a wrong option to test against.');
    state = shipRepairPick(state, wrong.id);
    expect(state.quality).toBe(SHIP_START_QUALITY - 6);

    // Finish the remaining steps correctly so only the first mistake can count.
    while (state.phase === 'repair') {
      const step = turn.repair.steps[state.repairIndex];
      const good = step?.options.find((o) => o.ok);
      state = shipRepairPick(state, good?.id ?? '');
    }
    state = shipVerdict(state, 'approve');

    const series = shipQualitySeries(state);
    expect(series).toHaveLength(2);
    expect(series[1]?.quality).toBe(SHIP_START_QUALITY - 6);
    expect(series[1]?.quality).toBe(state.quality);
    expect(state.history).toHaveLength(1);
    expect(state.history[0]?.delta).toBe(-6);
  });
});

describe('shipAlternatives', () => {
  it('is empty until a turn is resolved', () => {
    expect(shipAlternatives(startShip(1))).toEqual([]);
  });

  it('scores every move and marks the one taken', () => {
    let state: ShipState = { ...startShip(1), drawn: ['expiry'], turnIndex: 0 };
    state = shipDecide(state, 'reject');

    const options = shipAlternatives(state);
    expect(options.map((o) => o.key)).toEqual(['approve', 'reject']);
    expect(options.find((o) => o.key === 'approve')).toMatchObject({
      quality: 78,
      loss: 22,
      chosen: false,
      best: false,
    });
    expect(options.find((o) => o.key === 'reject')).toMatchObject({
      quality: 100,
      loss: 0,
      chosen: true,
      best: true,
    });
  });

  it('offers a clean repair as the move that keeps everything', () => {
    const turn = SHIP_IT.turns.find((t) => t.id === 'percentage');
    if (!turn || !turn.repair) throw new Error('The bank needs the percentage repair turn.');

    let state: ShipState = { ...startShip(1), drawn: [turn.id], turnIndex: 0 };
    state = shipDecide(state, 'repair');
    while (state.phase === 'repair') {
      const step = turn.repair.steps[state.repairIndex];
      const good = step?.options.find((o) => o.ok);
      state = shipRepairPick(state, good?.id ?? '');
    }
    state = shipVerdict(state, 'approve');

    expect(state.quality).toBe(100);
    expect(shipAlternatives(state).find((o) => o.key === 'repair')).toMatchObject({
      quality: 100,
      loss: 0,
      chosen: true,
      best: true,
    });
  });

  it('separates the right move from a badly executed one', () => {
    const turn = SHIP_IT.turns.find((t) => t.id === 'percentage');
    if (!turn || !turn.repair) throw new Error('The bank needs the percentage repair turn.');

    let state: ShipState = { ...startShip(1), drawn: [turn.id], turnIndex: 0 };
    state = shipDecide(state, 'repair');
    while (state.phase === 'repair') {
      const step = turn.repair.steps[state.repairIndex];
      const pick =
        state.repairIndex === 0 ? step?.options.find((o) => !o.ok) : step?.options.find((o) => o.ok);
      state = shipRepairPick(state, pick?.id ?? '');
    }
    state = shipVerdict(state, 'approve');

    expect(state.quality).toBe(94);
    expect(shipAlternatives(state).find((o) => o.key === 'repair')).toMatchObject({
      quality: 100,
      chosen: true,
      best: true,
    });
  });
});

describe('Release Week on the sprint engine', () => {
  it('starts with its own stats and three weeks', () => {
    const state = startSprint(RELEASE_WEEK);
    expect(state.stats).toEqual({ budget: 80, morale: 65, users: 30, quality: 75 });
    expect(state.completed).toHaveLength(3);
  });

  it('plays through every week and ends with the release ending', () => {
    let state = startSprint(RELEASE_WEEK);

    for (let week = 0; week < RELEASE_WEEK.weeks.length; week++) {
      state = sprintEnterWeek(state, week, 7, RELEASE_WEEK);
      expect(state.drawn).toHaveLength(3);

      while (state.view === 'week') {
        const step = sprintStep(state, RELEASE_WEEK);
        expect(step).not.toBeNull();
        state = sprintChoose(state, step!.choices[0]!.id, false, RELEASE_WEEK);
        state = sprintAdvance(state, RELEASE_WEEK);
        if (state.view === 'summary') state = sprintLeaveSummary(state);
      }
    }

    expect(state.view).toBe('ending');
    expect(sprintEnding(state, RELEASE_WEEK).title.length).toBeGreaterThan(0);
    const score = sprintScore(state, RELEASE_WEEK);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('keeps Sprint Zero as the default scenario', () => {
    expect(startSprint().stats.budget).toBe(100);
    expect(startSprint().completed).toHaveLength(3);
  });
});
