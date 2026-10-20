import { and, desc, eq } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import type { SessionUser } from '@/core/types';
import { getTotalXp } from '@/core/progress/service';
import { scenarioRuns, type RunStatus } from './schema';
import type { InterviewRunState, ShipState, SprintState } from './engine';
import { INTERVIEW_TYPES } from './content/interview';

export interface StoredRun {
  id: string;
  scenarioKey: string;
  status: RunStatus;
  state: ShipState | SprintState | InterviewRunState;
  bestScore: number;
  completions: number;
  updatedAt: Date;
}

/**
 * Stored runs from an older engine version are treated as absent rather than crashed on.
 * The schema is the same column; only the jsonb shape changed, so a shape check is enough
 * and the next write replaces the row.
 */
const COMPAT_VERSION = 3;

function isCompatible(key: string, state: unknown): boolean {
  if (!state || typeof state !== 'object') return false;
  const s = state as { version?: number; kind?: string; drawn?: unknown; allHistory?: unknown; interview?: unknown };
  if (s.version !== COMPAT_VERSION) return false;
  // The version alone was not enough: an earlier build also used 2 but had no `drawn`.
  // Check the fields the page actually reads, so a shape change can never crash a render.
  if (key === 'ship-it') return s.kind === 'ship' && Array.isArray(s.drawn);
  if (key === 'sprint-zero') return s.kind === 'sprint' && Array.isArray(s.drawn) && Array.isArray(s.allHistory);
  return s.kind === 'interview' && typeof s.interview === 'object' && s.interview !== null;
}

export async function getRun(userId: string, key: string): Promise<StoredRun | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(scenarioRuns)
    .where(and(eq(scenarioRuns.userId, userId), eq(scenarioRuns.scenarioKey, key)))
    .limit(1);
  if (!row || !isCompatible(key, row.state)) return null;
  return {
    id: row.id,
    scenarioKey: row.scenarioKey,
    status: row.status,
    state: row.state as StoredRun['state'],
    bestScore: row.bestScore,
    completions: row.completions,
    updatedAt: row.updatedAt,
  };
}

export async function getAllRuns(userId: string): Promise<Map<string, StoredRun>> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(scenarioRuns)
    .where(eq(scenarioRuns.userId, userId))
    .orderBy(desc(scenarioRuns.updatedAt));
  const map = new Map<string, StoredRun>();
  for (const row of rows) {
    if (!isCompatible(row.scenarioKey, row.state)) continue;
    map.set(row.scenarioKey, {
      id: row.id,
      scenarioKey: row.scenarioKey,
      status: row.status,
      state: row.state as StoredRun['state'],
      bestScore: row.bestScore,
      completions: row.completions,
      updatedAt: row.updatedAt,
    });
  }
  return map;
}

export interface Progress {
  started: boolean;
  label: string;
  percent: number;
  best: number;
  completions: number;
}

/** A compact progress line for a card: how far in, and the best result. */
export function runProgress(key: string, run: StoredRun | undefined): Progress {
  if (!run) return { started: false, label: 'Not started', percent: 0, best: 0, completions: 0 };

  if (key.startsWith('interview:')) {
    const total = 5;
    const done = run.state.kind === 'interview' ? run.state.interview.answers.length : 0;
    const finished = done >= total || run.completions > 0;
    return {
      started: done > 0 || run.completions > 0,
      label: finished ? `Best ${run.bestScore}/100` : `${done} of ${total} answered`,
      percent: finished ? 100 : Math.round((done / total) * 100),
      best: run.bestScore,
      completions: run.completions,
    };
  }

  if (key === 'ship-it') {
    const total = 9;
    const done = run.state.kind === 'ship' ? run.state.history.length : 0;
    const finished = run.completions > 0 && done === 0;
    return {
      started: done > 0 || run.completions > 0,
      label: finished ? `Best ${run.bestScore}/100` : `${Math.min(done, total)} of ${total} reviewed`,
      percent: Math.round((Math.min(done, total) / total) * 100),
      best: run.bestScore,
      completions: run.completions,
    };
  }

  const total = 24;
  const done = run.state.kind === 'sprint' ? run.state.allHistory.length : 0;
  const finished = run.completions > 0 && done === 0;
  return {
    started: done > 0 || run.completions > 0,
    label: finished ? `Best ${run.bestScore}/100` : `${done} of ${total} decisions`,
    percent: Math.round((Math.min(done, total) / total) * 100),
    best: run.bestScore,
    completions: run.completions,
  };
}

export interface ScenarioCardData {
  key: string;
  title: string;
  tagline: string;
  summary: string;
  meta: string;
  minutes: number;
  href: string;
  progress: Progress;
}

export async function getScenarioCards(userId: string): Promise<ScenarioCardData[]> {
  const runs = await getAllRuns(userId);

  const main: ScenarioCardData[] = [
    {
      key: 'ship-it',
      title: 'Ship It',
      tagline: 'Spend review time, keep project quality',
      summary:
        'Nine claims from an agent. Approving is free, rejecting costs a little, repairing costs the most. Most turns cannot be fixed by one click.',
      meta: '9 turns',
      minutes: 12,
      href: '/scenarios/ship-it',
      progress: runProgress('ship-it', runs.get('ship-it')),
    },
    {
      key: 'sprint-zero',
      title: 'Sprint Zero',
      tagline: 'Pick a week, run it, live with the numbers',
      summary:
        'Three weeks, eight decisions each, drawn from a bank of twelve. Each week starts where the last one ended and ends with a summary of what moved.',
      meta: '3 weeks',
      minutes: 20,
      href: '/scenarios/sprint-zero',
      progress: runProgress('sprint-zero', runs.get('sprint-zero')),
    },
  ];

  const interviews: ScenarioCardData[] = INTERVIEW_TYPES.map((type) => {
    const key = `interview:${type.id}`;
    return {
      key,
      title: type.name,
      tagline: type.blurb,
      summary: type.blurb,
      meta: '5 questions',
      minutes: 10,
      href: `/scenarios/interview?type=${type.id}`,
      progress: runProgress(key, runs.get(key)),
    };
  });

  return [...main, ...interviews];
}

export async function getScenarioStats(userId: string) {
  const runs = await getAllRuns(userId);
  const finished = [...runs.values()].filter((r) => r.completions > 0);
  const best = [...runs.values()].reduce((max, r) => Math.max(max, r.bestScore), 0);
  const xp = await getTotalXp(userId);
  return { started: runs.size, finished: finished.length, best, totalXp: xp };
}

export async function requireRunForUser(user: SessionUser, key: string): Promise<StoredRun | null> {
  return getRun(user.id, key);
}
