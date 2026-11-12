// Read functions for /admin/scenarios. They live next to the scenario content because this
// module owns both the table and the scenario names; the page is a thin route that composes
// it into the admin shell.
import { count, max, sql } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import type { Locale } from '@/i18n';
import { localizeContent } from '@/i18n/content';
import { DUNGEON } from '../content/dungeon';
import { INTERVIEW_TYPES } from '../content/interview';
import { SHIP_IT } from '../content/ship-it';
import { SPRINT_ZERO } from '../content/sprint-zero';
import { scenarioRuns } from '../schema';
import { getClosedScenarios } from '../queries';

export interface ScenarioOpsRow {
  key: string;
  title: string;
  /** Distinct people who ever touched this scenario. */
  learners: number;
  /** Rows in scenario_runs: one per person per scenario. */
  runs: number;
  finished: number;
  completions: number;
  avgBest: number;
  lastPlayedAt: Date | null;
  /** An admin has closed it: learners see a notice instead of the runner. */
  closed: boolean;
}

/** Localized names for every scenario in the catalogue. */
function scenarioTitles(locale: Locale): Map<string, string> {
  const titles = new Map<string, string>();
  titles.set('ship-it', localizeContent(SHIP_IT, locale).title);
  titles.set('sprint-zero', localizeContent(SPRINT_ZERO, locale).title);
  titles.set('agent-dungeon', localizeContent(DUNGEON, locale).labels.title);
  for (const type of localizeContent(INTERVIEW_TYPES, locale)) {
    titles.set(`interview:${type.id}`, type.name);
  }
  return titles;
}

export interface ScenarioOpsSummary {
  /** Distinct people who have opened any scenario. */
  learners: number;
  runs: number;
  finished: number;
}

export interface ScenarioOpsReport {
  summary: ScenarioOpsSummary;
  rows: ScenarioOpsRow[];
}

/**
 * Every scenario appears, including the ones nobody has opened: "no runs" is the answer an
 * admin is looking for, so it must not be missing from the table.
 */
export async function getScenarioOps(locale: Locale): Promise<ScenarioOpsReport> {
  const db = await getDb();
  const titles = scenarioTitles(locale);
  const [rows, totals, closed] = await Promise.all([
    db
      .select({
        key: scenarioRuns.scenarioKey,
        learners: sql<number>`count(distinct ${scenarioRuns.userId})`.mapWith(Number),
        runs: count(),
        finished: sql<number>`count(*) filter (where ${scenarioRuns.status} = 'finished')`.mapWith(Number),
        completions: sql<number>`coalesce(sum(${scenarioRuns.completions}), 0)`.mapWith(Number),
        avgBest: sql<number>`coalesce(round(avg(${scenarioRuns.bestScore})), 0)`.mapWith(Number),
        lastPlayedAt: max(scenarioRuns.updatedAt),
      })
      .from(scenarioRuns)
      .groupBy(scenarioRuns.scenarioKey),
    db
      .select({
        learners: sql<number>`count(distinct ${scenarioRuns.userId})`.mapWith(Number),
        runs: count(),
        finished: sql<number>`count(*) filter (where ${scenarioRuns.status} = 'finished')`.mapWith(Number),
      })
      .from(scenarioRuns),
    getClosedScenarios(),
  ]);

  const byKey = new Map(rows.map((row) => [row.key, row]));
  const known: ScenarioOpsRow[] = [...titles.entries()].map(([key, title]) => {
    const row = byKey.get(key);
    byKey.delete(key);
    return {
      key,
      title,
      learners: row?.learners ?? 0,
      runs: row?.runs ?? 0,
      finished: row?.finished ?? 0,
      completions: row?.completions ?? 0,
      avgBest: row?.avgBest ?? 0,
      lastPlayedAt: row?.lastPlayedAt ?? null,
      closed: closed.has(key),
    };
  });
  // A key that is no longer in the catalogue (a renamed scenario) still has history worth
  // seeing, so it comes last instead of disappearing.
  const retired: ScenarioOpsRow[] = [...byKey.values()].map((row) => ({
    ...row,
    title: row.key,
    closed: closed.has(row.key),
  }));

  return {
    summary: {
      learners: totals[0]?.learners ?? 0,
      runs: totals[0]?.runs ?? 0,
      finished: totals[0]?.finished ?? 0,
    },
    rows: [...known, ...retired].sort(
      (a, b) => b.learners - a.learners || a.title.localeCompare(b.title),
    ),
  };
}
