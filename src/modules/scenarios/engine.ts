// Pure state machines for the two long scenarios. No database, no React: the runner UI and
// the server actions both call these, and they are easy to unit test.
//
// Ship It and Sprint Zero are deliberately different mechanics, so they get different
// engines rather than one type forced to fit both.
import type {
  HistoryEntry,
  ShipAction,
  ShipScenario,
  SprintEnding,
  SprintScenario,
  SprintStep,
  StatKey,
  Stats,
} from './content/types';
import { SHIP_IT } from './content/ship-it';
import { SPRINT_ZERO } from './content/sprint-zero';
import { INTERVIEW_TYPES } from './content/interview';

// ---------------------------------------------------------------------------
// Ship It
// ---------------------------------------------------------------------------
// Ship It
// ---------------------------------------------------------------------------

export type ShipPhase = 'decide' | 'repair' | 'verdict' | 'result' | 'done';

export interface ShipPending {
  action: ShipAction | 'verdict';
  delta: number;
  note: string;
}

export interface ShipState {
  version: 3;
  kind: 'ship';
  /** Loaded in advance, not stored: decides what is written next. */
  turnIndex: number;
  /** The turn ids drawn for this run, in play order. */
  drawn: string[];
  /** Starts at 100 and only ever goes down. */
  quality: number;
  /** Review budget left, in minutes. */
  minutes: number;
  phase: ShipPhase;
  repairIndex: number;
  /** True once the tests or git log have been read on the current turn. */
  evidenceShown: boolean;
  pending: ShipPending | null;
  history: Array<{
    turnId: string;
    title: string;
    action: ShipAction | 'verdict';
    note: string;
    delta: number;
  }>;
  awarded?: boolean;
}

export const SHIP_TIME_BUDGET = SHIP_IT.minutes;

/** Small deterministic PRNG so one run replays the same turns. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], rnd: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * Draw a run from the bank: three correct-as-written, three to reject, three to repair,
 * then shuffle the order so the verdicts are not grouped. The mix is fixed on purpose —
 * a run of nine broken changes teaches suspicion, not calibration.
 */
export function drawShipTurns(seed: number): string[] {
  const rnd = mulberry32(seed);
  const byVerdict = (verdict: 'approve' | 'reject' | 'repair', n: number) =>
    shuffled(
      SHIP_IT.turns.filter((t) => t.good === verdict),
      rnd,
    )
      .slice(0, n)
      .map((t) => t.id);

  return shuffled(
    [
      ...byVerdict('approve', SHIP_IT.drawMix.approve),
      ...byVerdict('reject', SHIP_IT.drawMix.reject),
      ...byVerdict('repair', SHIP_IT.drawMix.repair),
    ],
    rnd,
  );
}

export function startShip(seed = Math.floor(Math.random() * 2 ** 31)): ShipState {
  return {
    version: 3,
    kind: 'ship',
    turnIndex: 0,
    drawn: drawShipTurns(seed),
    quality: 100,
    minutes: SHIP_IT.minutes,
    phase: 'decide',
    repairIndex: 0,
    evidenceShown: false,
    pending: null,
    history: [],
  };
}

export function shipTurn(state: ShipState) {
  const id = state.drawn[state.turnIndex];
  return SHIP_IT.turns.find((t) => t.id === id) ?? null;
}

export function shipComplete(state: ShipState): boolean {
  return state.phase === 'done';
}

export function shipTotalTurns(state: ShipState): number {
  return state.drawn.length;
}

/** Quality is clamped at zero: it can never be recovered. */
function clampQuality(q: number): number {
  return Math.max(0, Math.round(q));
}

function spend(state: ShipState, minutes: number): number {
  return Math.max(0, state.minutes - minutes);
}

/**
 * The four verbs. `evidence` costs time and reveals the tests; it never costs quality,
 * because looking is not a judgement. The other three resolve the turn, and `repair`
 * enters the repair sequence first.
 */
export function shipDecide(state: ShipState, action: ShipAction): ShipState {
  const turn = shipTurn(state);
  if (!turn || state.phase !== 'decide') return state;

  // Reading the tests brings you back to the same decision, better informed.
  if (action === 'evidence') {
    if (state.evidenceShown) return state;
    return {
      ...state,
      evidenceShown: true,
      minutes: spend(state, turn.minutes.evidence),
      history: [
        ...state.history,
        {
          turnId: turn.id,
          title: turn.title,
          action: 'evidence',
          note: 'Read the tests.',
          delta: 0,
        },
      ],
    };
  }

  if (action === 'repair' && turn.repair && turn.repair.steps.length > 0) {
    return {
      ...state,
      phase: 'repair',
      repairIndex: 0,
      minutes: spend(state, turn.minutes.repair),
    };
  }

  const delta = turn.delta[action];
  return {
    ...state,
    quality: clampQuality(state.quality + delta),
    minutes: spend(state, turn.minutes[action]),
    phase: 'result',
    pending: { action, delta, note: turn.note[action] },
    history: [
      ...state.history,
      { turnId: turn.id, title: turn.title, action, note: turn.note[action], delta },
    ],
  };
}

/** A wrong repair option costs quality and time, then moves on: you cannot retry forever. */
export function shipRepairPick(state: ShipState, optionId: string): ShipState {
  const turn = shipTurn(state);
  if (!turn?.repair || state.phase !== 'repair') return state;

  const step = turn.repair.steps[state.repairIndex];
  if (!step) return state;
  const option = step.options.find((o) => o.id === optionId) ?? step.options[0]!;

  const penalty = option.ok ? 0 : -6;
  const extraTime = option.ok ? 0 : 2;
  const nextIndex = state.repairIndex + 1;

  return {
    ...state,
    quality: clampQuality(state.quality + penalty),
    minutes: spend(state, extraTime),
    phase: nextIndex >= turn.repair.steps.length ? 'verdict' : 'repair',
    repairIndex: nextIndex,
  };
}

/** After a repair the change is sound, so approving is right and rejecting throws it away. */
export function shipVerdict(state: ShipState, action: 'approve' | 'reject'): ShipState {
  const turn = shipTurn(state);
  if (!turn || state.phase !== 'verdict') return state;

  const delta = action === 'approve' ? 0 : -10;
  const note =
    action === 'approve'
      ? 'Repaired, then shipped. This is the sequence a bad turn needs.'
      : 'The repair worked and then you rejected it. The work is wasted.';

  return {
    ...state,
    quality: clampQuality(state.quality + delta),
    minutes: spend(state, 1),
    phase: 'result',
    pending: { action: 'verdict', delta, note },
    history: [...state.history, { turnId: turn.id, title: turn.title, action: 'verdict', note, delta }],
  };
}

export function shipNext(state: ShipState): ShipState {
  const nextIndex = state.turnIndex + 1;
  const done = nextIndex >= state.drawn.length;
  return {
    ...state,
    turnIndex: nextIndex,
    phase: done ? 'done' : 'decide',
    repairIndex: 0,
    evidenceShown: false,
    pending: null,
  };
}

/** 65% quality, 35% of the review budget you did not spend. Both on a 0-100 scale. */
export function shipScore(state: ShipState): number {
  const timeRatio = SHIP_TIME_BUDGET > 0 ? state.minutes / SHIP_TIME_BUDGET : 0;
  const raw =
    SHIP_IT.weights.quality * state.quality + SHIP_IT.weights.time * Math.min(1, timeRatio) * 100;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function shipEnding(state: ShipState) {
  const score = shipScore(state);
  const wrong = state.history.filter((h) => h.delta < 0).length;
  const repaired = state.history.filter((h) => h.action === 'verdict').length;
  const approvedClean = state.history.filter((h) => h.action === 'approve' && h.delta === 0).length;

  if (score >= 85) {
    return {
      key: 'clean',
      title: 'Shipped, and nothing broken',
      body: `${repaired} change${repaired === 1 ? '' : 's'} went through a repair, ${approvedClean} went out as written, and nothing that deserved a rejection got approved. Quality held and ${state.minutes} minutes were left.`,
      insight:
        'Approving is the cheapest action available, which is why it is the one to distrust. The turns that cost the most were the ones where the only correct move was to read the tests first, or to make the output better before deciding.',
      takeaway: 'A claim you cannot verify is not a decision yet. Check, then decide.',
    };
  }
  if (score >= 60) {
    return {
      key: 'partial',
      title: 'It shipped with damage',
      body: `${wrong} call${wrong === 1 ? '' : 's'} took quality off, and ${state.minutes} minutes were left unspent. The release went out and the bug list grew.`,
      insight:
        'The time you saved did not survive the invoice. Quality and review time trade against each other, and the weighting is deliberately unkind to approving in a hurry.',
      takeaway: 'If there is no time to check a change, there is no time to ship it.',
    };
  }
  return {
    key: 'incident',
    title: 'It shipped broken',
    body: `Quality finished at ${state.quality} with ${state.minutes} minutes unspent. The incident review found a run of approvals rather than one bad call.`,
    insight:
      'Every wrong turn was cheaper than the right one at the moment you took it. That is the trap: the cost of a bad approval arrives later and lands on someone else.',
    takeaway: 'The cheapest action in the moment is usually the most expensive one in the quarter.',
  };
}

// ---------------------------------------------------------------------------

export type SprintView = 'select' | 'week' | 'summary' | 'ending';

export interface SprintPending {
  label: string;
  outcome: string;
  effects: Partial<Stats>;
  timedOut: boolean;
}

export interface SprintState {
  version: 3;
  kind: 'sprint';
  view: SprintView;
  /** Index of the week being played (0-2). Meaningful for week/summary/ending. */
  week: number;
  /** The step ids drawn for the current week, in play order. */
  drawn: string[];
  stepIndex: number;
  stats: Stats;
  /** Stats when the current week started, for the week summary and for replays. */
  weekStart: Stats;
  weekHistory: HistoryEntry[];
  allHistory: HistoryEntry[];
  completed: boolean[];
  /** Kept per week so a replay restores that week exactly. */
  weekStarts: Array<Stats | null>;
  pending: SprintPending | null;
  /** Set when a trap option ended the run. */
  fatal: { title: string; body: string } | null;
  awarded?: boolean;
}

/**
 * Draw a week from its bank. Three from the opening act, three from the middle, two from
 * the end, then restore narrative order. Different seeds give different weeks.
 */
export function drawWeek(
  bank: SprintStep[],
  draw: readonly [number, number, number],
  seed: number,
): string[] {
  const rnd = mulberry32(seed);
  const picked: Array<{ index: number; id: string }> = [];

  ([1, 2, 3] as const).forEach((act, i) => {
    const pool = bank
      .map((step, index) => ({ step, index }))
      .filter((x) => x.step.act === act);
    for (let j = pool.length - 1; j > 0; j--) {
      const k = Math.floor(rnd() * (j + 1));
      [pool[j], pool[k]] = [pool[k]!, pool[j]!];
    }
    for (const item of pool.slice(0, draw[i] ?? 0)) {
      picked.push({ index: item.index, id: item.step.id });
    }
  });

  return picked.sort((a, b) => a.index - b.index).map((p) => p.id);
}

export function startSprint(): SprintState {
  const stats = SPRINT_ZERO.start();
  return {
    version: 3,
    kind: 'sprint',
    view: 'select',
    week: 0,
    drawn: [],
    stepIndex: 0,
    stats,
    weekStart: stats,
    weekHistory: [],
    allHistory: [],
    completed: SPRINT_ZERO.weeks.map(() => false),
    weekStarts: SPRINT_ZERO.weeks.map(() => null),
    pending: null,
    fatal: null,
  };
}

export function sprintWeekDef(week: number) {
  return SPRINT_ZERO.weeks[week] ?? null;
}

export function sprintStep(state: SprintState): SprintStep | null {
  const week = sprintWeekDef(state.week);
  if (!week) return null;
  const id = state.drawn[state.stepIndex];
  return week.bank.find((s) => s.id === id) ?? null;
}

function clampStats(stats: Stats): Stats {
  return {
    budget: Math.max(0, Math.round(stats.budget)),
    morale: Math.max(0, Math.round(stats.morale)),
    users: Math.max(0, Math.round(stats.users)),
    quality: Math.max(0, Math.round(stats.quality)),
  };
}

/** Open a week: draw its questions and remember the stats it starts on. */
export function sprintEnterWeek(state: SprintState, week: number, seed: number): SprintState {
  const def = sprintWeekDef(week);
  if (!def) return state;

  const completed = [...state.completed];
  // Entering a week you already finished resets it; later weeks close again.
  for (let i = week; i < completed.length; i++) completed[i] = false;

  const weekStarts = [...state.weekStarts];
  const restored = weekStarts[week];

  return {
    ...state,
    view: 'week',
    week,
    drawn: drawWeek(def.bank, def.draw, seed),
    stepIndex: 0,
    stats: restored ? { ...restored } : state.stats,
    weekStart: restored ? { ...restored } : { ...state.stats },
    weekHistory: [],
    completed,
    weekStarts,
    pending: null,
    fatal: null,
  };
}

export function sprintChoose(state: SprintState, choiceId: string, timedOut = false): SprintState {
  const step = sprintStep(state);
  if (!step || state.pending || state.view !== 'week') return state;

  const choice = step.choices.find((c) => c.id === choiceId) ?? step.choices[0]!;
  const stats = clampStats({
    budget: state.stats.budget + (choice.effects.budget ?? 0),
    morale: state.stats.morale + (choice.effects.morale ?? 0),
    users: state.stats.users + (choice.effects.users ?? 0),
    quality: state.stats.quality + (choice.effects.quality ?? 0),
  });

  const entry: HistoryEntry = {
    stepId: step.id,
    part: state.week,
    title: step.title,
    choiceLabel: choice.label,
    outcome: choice.outcome,
    effects: choice.effects,
    timedOut,
  };

  // A trap option ends the run immediately.
  if (choice.fatal) {
    return {
      ...state,
      stats,
      weekHistory: [...state.weekHistory, entry],
      allHistory: [...state.allHistory, entry],
      fatal: choice.fatal,
      view: 'ending',
      pending: null,
    };
  }

  return {
    ...state,
    stats,
    weekHistory: [...state.weekHistory, entry],
    allHistory: [...state.allHistory, entry],
    pending: { label: choice.label, outcome: choice.outcome, effects: choice.effects, timedOut },
  };
}

/** Close the result panel and either ask the next question or end the week. */
export function sprintAdvance(state: SprintState): SprintState {
  const week = sprintWeekDef(state.week);
  if (!week) return state;

  const next = state.stepIndex + 1;
  if (next >= state.drawn.length) {
    const completed = [...state.completed];
    completed[state.week] = true;
    const weekStarts = [...state.weekStarts];
    weekStarts[state.week + 1] = { ...state.stats };
    const last = state.week >= SPRINT_ZERO.weeks.length - 1;
    return {
      ...state,
      stepIndex: next,
      pending: null,
      completed,
      weekStarts,
      view: last ? 'ending' : 'summary',
    };
  }
  return { ...state, stepIndex: next, pending: null };
}

/** Leave the week summary and return to the week picker, with the next week available. */
export function sprintLeaveSummary(state: SprintState): SprintState {
  return { ...state, view: 'select', pending: null };
}

/** What changed during the week, and one sentence about what to watch. */
export function sprintWeekSummary(state: SprintState) {
  const keys: StatKey[] = ['budget', 'morale', 'users', 'quality'];
  const delta = keys.map((key) => ({
    key,
    from: state.weekStart[key],
    to: state.stats[key],
    change: state.stats[key] - state.weekStart[key],
  }));

  const worst = [...delta].sort((a, b) => a.change - b.change)[0];
  const best = [...delta].sort((a, b) => b.change - a.change)[0];

  let advice: string;
  if (state.stats.morale <= 30) {
    advice = 'Morale is close to breaking. Anything that buys the team a day is worth more than a feature this week.';
  } else if (state.stats.quality <= 30) {
    advice = 'Quality is low enough that the next bug will be expensive. Spend a decision on it rather than on scope.';
  } else if (state.stats.budget <= 25) {
    advice = 'The runway is the constraint now. Every decision should either earn or save, and neither is free.';
  } else if (state.stats.users < 20) {
    advice = 'Almost nobody is using it yet. The team is building for a group that has not arrived.';
  } else {
    advice = 'Nothing is on fire. That is the best moment to spend a decision on the thing you keep postponing.';
  }

  return { delta, worst, best, advice };
}

export function sprintEnding(state: SprintState): SprintEnding {
  if (state.fatal) {
    return {
      key: 'fatal',
      title: state.fatal.title,
      body: state.fatal.body,
      insight:
        'This was not a slow decline. It was a single decision that could not be undone, taken when the easier option was one click away.',
      takeaway: 'Some options are survivable and some are not. Reversibility is the question to ask first.',
    };
  }
  return SPRINT_ZERO.ending(state.stats, state.allHistory);
}

export function sprintScore(state: SprintState): number {
  if (state.fatal) return 0;
  return SPRINT_ZERO.score(state.stats, state.allHistory);
}

// ---------------------------------------------------------------------------
// Interview
// ---------------------------------------------------------------------------

export interface InterviewAnswer {
  questionId: string;
  prompt: string;
  answer: string;
  hintsUsed: number;
  score: number;
  competency: string;
}

export interface InterviewState {
  typeId: string;
  questionIndex: number;
  hintsUsed: number;
  answers: InterviewAnswer[];
  /** Shown until the learner answers again; at most one per question. */
  followUp: { label: string; answered: boolean } | null;
  /** Follow-ups already asked on the current question, capped at one. */
  probes?: number;
}

export interface InterviewRunState {
  version: 3;
  kind: 'interview';
  interview: InterviewState;
  awarded?: boolean;
}

export function startInterview(typeId: string): InterviewRunState {
  return {
    version: 3,
    kind: 'interview',
    interview: {
      typeId,
      questionIndex: 0,
      hintsUsed: 0,
      answers: [],
      followUp: null,
      probes: 0,
    },
  };
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export type ScenarioKey = 'ship-it' | 'sprint-zero' | 'interview';

export function isShipKey(key: string): boolean {
  return key === SHIP_IT.key;
}

export function isSprintKey(key: string): boolean {
  return key === SPRINT_ZERO.key;
}

export function isInterviewKey(key: string): boolean {
  return key.startsWith('interview:');
}

export function interviewTypeIds(): string[] {
  return INTERVIEW_TYPES.map((t) => t.id);
}

export type { ShipScenario, SprintScenario };
