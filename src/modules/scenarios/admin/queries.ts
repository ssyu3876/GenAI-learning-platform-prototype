// Read functions for /admin/scenarios. They live next to the scenario content because this
// module owns both the table and the scenario names; the page is a thin route that composes
// it into the admin shell.
import { count, max, sql } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import { getTranslations, type Locale } from '@/i18n';
import { localizeContent } from '@/i18n/content';
import { DUNGEON } from '../content/dungeon';
import { SHIP_IT } from '../content/ship-it';
import { SPRINT_ZERO } from '../content/sprint-zero';
import { scenarioRuns } from '../schema';
import { INTERVIEW_GROUP, getClosedScenarios } from '../queries';

/**
 * The interview formats are seven rows in `scenario_runs` but one line in the console, so the
 * aggregate groups them here. Doing it in SQL keeps the learner count a true distinct count
 * instead of a sum of per-format counts.
 *
 * The group name is interpolated as a literal, not bound: the SELECT and the GROUP BY have to
 * be textually identical or Postgres rejects the query, and two bind params are not "equal".
 */
const groupedKey = sql<string>`case when "scenario_key" like 'interview:%' then ${sql.raw(
  `'${INTERVIEW_GROUP}'`,
)} else "scenario_key" end`;

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

/** Localized names for each row of the console: the three scenarios plus the interview group. */
function scenarioTitles(locale: Locale): Map<string, string> {
  const t = getTranslations(locale);
  const titles = new Map<string, string>();
  titles.set('ship-it', localizeContent(SHIP_IT, locale).title);
  titles.set('sprint-zero', localizeContent(SPRINT_ZERO, locale).title);
  titles.set('agent-dungeon', localizeContent(DUNGEON, locale).labels.title);
  titles.set(INTERVIEW_GROUP, t.scenarios.hub.interviewsTitle);
  return titles;
}

/** One row of the aggregate query, before the catalogue is merged in. */
export type ScenarioRunRow = Omit<ScenarioOpsRow, 'title' | 'closed'>;

/**
 * Puts the catalogue and the usage numbers side by side.
 *
 * Two rules matter here and both are easy to get wrong:
 * - a scenario with no runs still gets a row, because "nobody opened it" is the answer an
 *   admin is looking for;
 * - a key that is no longer in the catalogue (renamed or removed) keeps its history at the
 *   bottom instead of silently vanishing.
 */
export function mergeScenarioRows(
  titles: Map<string, string>,
  runsByKey: Map<string, ScenarioRunRow>,
  closed: Set<string>,
): ScenarioOpsRow[] {
  const byKey = new Map(runsByKey);
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
  const retired: ScenarioOpsRow[] = [...byKey.values()].map((row) => ({
    ...row,
    title: row.key,
    closed: closed.has(row.key),
  }));
  const byUsage = (a: ScenarioOpsRow, b: ScenarioOpsRow) =>
    b.learners - a.learners || a.title.localeCompare(b.title);
  // Catalogue first, then the keys that no longer exist: their history stays readable but
  // does not interleave with the scenarios an admin can actually act on.
  return [...known.sort(byUsage), ...retired.sort(byUsage)];
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
        key: groupedKey,
        learners: sql<number>`count(distinct ${scenarioRuns.userId})`.mapWith(Number),
        runs: count(),
        finished: sql<number>`count(*) filter (where ${scenarioRuns.status} = 'finished')`.mapWith(Number),
        completions: sql<number>`coalesce(sum(${scenarioRuns.completions}), 0)`.mapWith(Number),
        avgBest: sql<number>`coalesce(round(avg(${scenarioRuns.bestScore})), 0)`.mapWith(Number),
        lastPlayedAt: max(scenarioRuns.updatedAt),
      })
      .from(scenarioRuns)
      .groupBy(groupedKey),
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

  return {
    summary: {
      learners: totals[0]?.learners ?? 0,
      runs: totals[0]?.runs ?? 0,
      finished: totals[0]?.finished ?? 0,
    },
    rows: mergeScenarioRows(titles, byKey, closed),
  };
}
