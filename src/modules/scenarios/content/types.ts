// Shared shapes for the scenarios module. Two mechanics live here:
//
// 1. Ship It — a review of an AI agent. Three verbs with different time costs, a quality
//    number that only goes down, and some turns that require repairing the output first.
// 2. Sprint Zero — a small team over three weeks. Four stats, a question bank per week,
//    a drawn subset each play, and a week summary between weeks.
//
// Neither touches the database. See actions.ts.

export type StatKey = 'budget' | 'morale' | 'users' | 'quality';

export interface StatDef {
  key: StatKey;
  label: string;
  /** Used to scale the bar */
  max: number;
  /** At or below this the stat is in trouble */
  danger: number;
}

export type Stats = Record<StatKey, number>;

export interface HistoryEntry {
  stepId: string;
  part: number;
  title: string;
  choiceLabel: string;
  outcome: string;
  effects: Partial<Stats>;
  timedOut?: boolean;
}

// ---------------------------------------------------------------------------
// Ship It
// ---------------------------------------------------------------------------

export type ShipAction = 'approve' | 'reject' | 'repair' | 'evidence';

export interface ShipRepairOption {
  id: string;
  label: string;
  ok: boolean;
  note: string;
}

export interface ShipRepairStep {
  prompt: string;
  options: ShipRepairOption[];
}

/** The repair sequence for one turn, with a line explaining why it is needed. */
export interface ShipRepair {
  prompt: string;
  steps: ShipRepairStep[];
}

export interface ShipTurn {
  id: string;
  title: string;
  /** What the agent says it did. Treat it as a claim, never as a fact. */
  claim: string;
  diff: string[];
  /**
   * What running the tests or reading the git log actually shows. Paid for with the
   * evidence verb: information is cheap, but it is not free.
   */
  evidence: string;
  /** The response that keeps quality intact. */
  good: 'approve' | 'reject' | 'repair';
  /** Minutes each verb costs on this turn. */
  minutes: Record<ShipAction, number>;
  /** Quality change for each verb. The good verb is 0 and evidence is always 0. */
  delta: Record<ShipAction, number>;
  note: Record<ShipAction, string>;
  /** Required when good === 'repair': the sequence that makes the change sound. */
  repair?: ShipRepair;
}

export interface ShipScenario {
  key: string;
  title: string;
  tagline: string;
  summary: string;
  meta: string;
  /** Review budget in minutes */
  minutes: number;
  /** Must sum to 1 */
  weights: { quality: number; time: number };
  /** How many turns a run uses out of 	urns. */
  drawCount: number;
  /** How many of each verdict to draw, so the mix is never one-sided. */
  drawMix: { approve: number; reject: number; repair: number };
  turns: ShipTurn[];
}

// ---------------------------------------------------------------------------
// Sprint Zero
// ---------------------------------------------------------------------------

export interface SprintChoice {
  id: string;
  label: string;
  cost: string;
  effects: Partial<Stats>;
  outcome: string;
  /** Choosing this ends the run immediately. It is the trap option. */
  fatal?: { title: string; body: string };
}

export interface SprintStep {
  id: string;
  /** Narrative position: 1 = opening, 2 = middle, 3 = late. Used for the draw. */
  act: 1 | 2 | 3;
  title: string;
  body: string;
  choices: SprintChoice[];
  seconds?: number;
  timeoutChoice?: number;
}

export interface SprintWeek {
  id: string;
  title: string;
  tagline: string;
  /** Questions available this week. Only `draw` of them are used per play. */
  bank: SprintStep[];
  /** How many to draw, in act order. */
  draw: [number, number, number];
}

export interface SprintEnding {
  key: string;
  title: string;
  body: string;
  insight: string;
  takeaway: string;
}

export interface SprintScenario {
  key: string;
  title: string;
  tagline: string;
  summary: string;
  meta: string;
  minutes: number;
  stats: StatDef[];
  start: () => Stats;
  weeks: SprintWeek[];
  ending: (stats: Stats, history: HistoryEntry[]) => SprintEnding;
  score: (stats: Stats, history: HistoryEntry[]) => number;
}
