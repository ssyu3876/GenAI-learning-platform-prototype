import { and, desc, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import type { SessionUser } from '@/core/types';
import { getTotalXp } from '@/core/progress/service';
import { scenarioRuns, scenarioSettings, type RunStatus } from './schema';
import type { InterviewRunState, ShipState, SprintState } from './engine';
import { INTERVIEW_TYPES } from './content/interview';
import { SHIP_IT } from './content/ship-it';
import { SPRINT_ZERO } from './content/sprint-zero';
import { DUNGEON } from './content/dungeon';
import { getLocale } from '@/i18n';
import { localizeContent } from '@/i18n/content';

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
  // The dungeon keeps its real state in the browser; the row only records the result.
  if (key === 'agent-dungeon') return s.kind === 'dungeon';
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
export function runProgress(key: string, run: StoredRun | undefined, zh = false): Progress {
  if (!run) return { started: false, label: zh ? '未开始' : 'Not started', percent: 0, best: 0, completions: 0 };

  if (key.startsWith('interview:')) {
    const total = 5;
    const done = run.state.kind === 'interview' ? run.state.interview.answers.length : 0;
    const finished = done >= total || run.completions > 0;
    return {
      started: done > 0 || run.completions > 0,
      label: finished
        ? zh
          ? `最佳 ${run.bestScore}/100`
          : `Best ${run.bestScore}/100`
        : zh
          ? `已答 ${done}/${total} 题`
          : `${done} of ${total} answered`,
      percent: finished ? 100 : Math.round((done / total) * 100),
      best: run.bestScore,
      completions: run.completions,
    };
  }

  if (key === 'agent-dungeon') {
    // Only a cleared run is stored, so "completions > 0" means the dungeon was beaten.
    const cleared = (run?.completions ?? 0) > 0;
    return {
      started: cleared,
      label: cleared
        ? zh
          ? `最佳 ${run!.bestScore}`
          : `Best ${run!.bestScore}`
        : zh
          ? '3 层'
          : '3 layers',
      percent: cleared ? 100 : 0,
      best: run?.bestScore ?? 0,
      completions: run?.completions ?? 0,
    };
  }

  if (key === 'ship-it') {    const total = 9;
    const done = run.state.kind === 'ship' ? run.state.history.length : 0;
    const finished = run.completions > 0 && done === 0;
    return {
      started: done > 0 || run.completions > 0,
      label: finished
        ? zh
          ? `最佳 ${run.bestScore}/100`
          : `Best ${run.bestScore}/100`
        : zh
          ? `已审阅 ${Math.min(done, total)}/${total}`
          : `${Math.min(done, total)} of ${total} reviewed`,
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
    label: finished
      ? zh
        ? `最佳 ${run.bestScore}/100`
        : `Best ${run.bestScore}/100`
      : zh
        ? `已做 ${Math.min(done, total)}/${total} 个决定`
        : `${Math.min(done, total)} of ${total} decisions`,
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
  /** An admin closed this scenario. It stays listed, but nobody can start a new run. */
  closed: boolean;
}

/**
 * The seven interview formats share one switch. Closing them one by one is busywork, and an
 * admin thinks of "practice interviews" as one thing, so the console shows one row for it.
 */
export const INTERVIEW_GROUP = 'interview';

/** Keys an admin has closed. A scenario with no row is open: the catalogue is code. */
export async function getClosedScenarios(): Promise<Set<string>> {
  const db = await getDb();
  const rows = await db
    .select({ key: scenarioSettings.scenarioKey })
    .from(scenarioSettings)
    .where(eq(scenarioSettings.enabled, false));
  const closed = new Set(rows.map((row) => row.key));
  // The group and its formats are one switch in both directions: a closed group closes every
  // format, and a closed format (a row written by an older build) marks the group as closed.
  const formatsClosed = [...closed].some((key) => key.startsWith('interview:'));
  if (closed.has(INTERVIEW_GROUP) || formatsClosed) {
    closed.add(INTERVIEW_GROUP);
    for (const type of INTERVIEW_TYPES) closed.add(`interview:${type.id}`);
  }
  return closed;
}

/**
 * The settings rows that decide whether `key` may run.
 *
 * An interview format answers to the whole group, including rows written for a sibling format
 * by an older build, when closing one format was still possible. Keeping this pure means the
 * rule is testable without a database.
 */
export function scenarioCheckKeys(key: string): string[] {
  if (!key.startsWith('interview:')) return [key];
  return [INTERVIEW_GROUP, ...INTERVIEW_TYPES.map((type) => `interview:${type.id}`)];
}

/** Whether one scenario is playable. Used by the runner before it renders anything. */
export async function isScenarioOpen(key: string): Promise<boolean> {
  const db = await getDb();
  const rows = await db
    .select({ enabled: scenarioSettings.enabled })
    .from(scenarioSettings)
    .where(inArray(scenarioSettings.scenarioKey, scenarioCheckKeys(key)));
  return rows.every((row) => row.enabled);
}

export async function getScenarioCards(userId: string): Promise<ScenarioCardData[]> {
  const locale = await getLocale();
  const zh = locale === 'zh';
  const [runs, closed] = await Promise.all([getAllRuns(userId), getClosedScenarios()]);
  const ship = localizeContent(SHIP_IT, locale);
  const sprint = localizeContent(SPRINT_ZERO, locale);
  const farm = localizeContent(DUNGEON, locale);
  const interviewsCopy = localizeContent(INTERVIEW_TYPES, locale);

  const main: ScenarioCardData[] = [
    {
      key: 'ship-it',
      title: ship.title,
      tagline: ship.tagline,
      summary: ship.summary,
      meta: ship.meta,
      minutes: ship.minutes,
      href: '/scenarios/ship-it',
      progress: runProgress('ship-it', runs.get('ship-it'), zh),
      closed: closed.has('ship-it'),
    },
    {
      key: 'sprint-zero',
      title: sprint.title,
      tagline: sprint.tagline,
      summary: sprint.summary,
      meta: sprint.meta,
      minutes: sprint.minutes,
      href: '/scenarios/sprint-zero',
      progress: runProgress('sprint-zero', runs.get('sprint-zero'), zh),
      closed: closed.has('sprint-zero'),
    },
    {
      key: 'agent-dungeon',
      title: farm.labels.title,
      tagline: farm.labels.tagline,
      summary: farm.labels.summary,
      meta: farm.labels.meta,
      minutes: 10,
      href: '/scenarios/agent-dungeon',
      progress: runProgress('agent-dungeon', runs.get('agent-dungeon'), zh),
      closed: closed.has('agent-dungeon'),
    },
  ];

  const interviews: ScenarioCardData[] = interviewsCopy.map((type) => {
    const key = `interview:${type.id}`;
    return {
      key,
      title: type.name,
      tagline: type.blurb,
      summary: type.blurb,
      meta: zh ? '5 道题' : '5 questions',
      minutes: 10,
      href: `/scenarios/interview?type=${type.id}`,
      progress: runProgress(key, runs.get(key), zh),
      closed: closed.has(key),
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
