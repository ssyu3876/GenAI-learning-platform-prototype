import { and, count, eq, isNotNull, sql, sum } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import { activityAttempts, enrollments, learningEvents, lessonCompletions, users } from '@/core/db/schema';
import { getUserStats } from '@/core/progress/service';
import { computeStreak, getLevel } from '@/core/progress/xp';
import { BADGES, type BadgeDef, type BadgeGroup, type BadgeId, type BadgeSnapshot } from './definitions';

/** The part of a snapshot that comes from `scenario.completed` events. */
export function scenarioTotals(payloads: Array<{ scenarioKey?: string; score?: number }>) {
  const finished = new Set<string>();
  const interviewKeys = new Set<string>();
  let shipItBest = 0;
  let sprintBest = 0;

  for (const payload of payloads) {
    const key = payload.scenarioKey;
    if (!key) continue;
    finished.add(key);
    const score = Number(payload.score ?? 0);
    if (key === 'ship-it') shipItBest = Math.max(shipItBest, score);
    if (key === 'sprint-zero') sprintBest = Math.max(sprintBest, score);
    if (key.startsWith('interview:')) interviewKeys.add(key);
  }

  return {
    scenariosFinished: finished.size,
    longScenariosFinished: (finished.has('ship-it') ? 1 : 0) + (finished.has('sprint-zero') ? 1 : 0),
    shipItBest,
    sprintBest,
    interviewsFinished: interviewKeys.size,
  };
}

/** Everything a badge needs, in one round trip. */
export async function getBadgeSnapshot(userId: string): Promise<BadgeSnapshot> {
  const db = await getDb();

  const [stats, attempts, perfect, lessons, courses] = await Promise.all([
    getUserStats(userId),
    db.select({ n: count() }).from(activityAttempts).where(eq(activityAttempts.userId, userId)),
    db
      .select({ n: count() })
      .from(activityAttempts)
      .where(and(eq(activityAttempts.userId, userId), eq(activityAttempts.bestScore, 100))),
    db.select({ n: count() }).from(lessonCompletions).where(eq(lessonCompletions.userId, userId)),
    db
      .select({ n: count() })
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), isNotNull(enrollments.completedAt))),
  ]);

  // Scenario results live in the event log, so this module never imports another module.
  const scenarioEvents = await db
    .select({ payload: learningEvents.payload })
    .from(learningEvents)
    .where(
      and(eq(learningEvents.userId, userId), eq(learningEvents.type, 'scenario.completed')),
    );

  return {
    totalXp: stats.totalXp,
    level: stats.level.level,
    streak: stats.streak,
    activitiesCompleted: attempts[0]?.n ?? 0,
    perfectActivities: perfect[0]?.n ?? 0,
    lessonsCompleted: lessons[0]?.n ?? 0,
    coursesCompleted: courses[0]?.n ?? 0,
    ...scenarioTotals(scenarioEvents.map((row) => (row.payload ?? {}) as { scenarioKey?: string; score?: number })),
  };
}

export interface BadgeState {
  def: BadgeDef;
  earned: boolean;
  have: number;
  need: number;
  percent: number;
}

export function evaluateBadges(snapshot: BadgeSnapshot): BadgeState[] {
  return BADGES.map((def) => {
    const { have, need } = def.progress(snapshot);
    return {
      def,
      earned: def.earned(snapshot),
      have,
      need,
      percent: need > 0 ? Math.round((have / need) * 100) : def.earned(snapshot) ? 100 : 0,
    };
  });
}

export async function getBadgeStates(userId: string): Promise<{
  snapshot: BadgeSnapshot;
  badges: BadgeState[];
  earnedCount: number;
}> {
  const snapshot = await getBadgeSnapshot(userId);
  const badges = evaluateBadges(snapshot);
  return { snapshot, badges, earnedCount: badges.filter((b) => b.earned).length };
}

/** Used by the home widget: only the ones that are close, so it stays actionable. */
export async function getBadgeHighlights(userId: string) {
  const { badges, earnedCount, snapshot } = await getBadgeStates(userId);
  const next = badges
    .filter((b) => !b.earned && b.need > 0)
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 3);
  return { next, earnedCount, total: badges.length, snapshot };
}

/** Distance to the next growth stage, for the Pip card. */
export function growthProgress(snapshot: BadgeSnapshot) {
  // Mirrors growthStage() in core/progress/xp.ts: 0..4.
  const stage = snapshot.level <= 1 ? 0 : snapshot.level <= 2 ? 1 : snapshot.level <= 4 ? 2 : snapshot.level <= 6 ? 3 : 4;
  const bounds = [0, 100, 250, 900, 2100];
  const from = bounds[stage] ?? 0;
  const to = bounds[stage + 1] ?? null;
  const percent = to === null ? 100 : Math.min(100, Math.round(((snapshot.totalXp - from) / (to - from)) * 100));
  return { stage: stage as 0 | 1 | 2 | 3 | 4, from, to, percent };
}

export interface BadgeDistributionRow {
  id: BadgeId;
  group: BadgeGroup;
  /** Learners whose snapshot satisfies this badge right now. */
  earnedBy: number;
}

export interface BadgeDistribution {
  /** Every learner account: the denominator for a percentage. */
  learners: number;
  /** Learners with at least one event, so the rest are people who never started. */
  activeLearners: number;
  rows: BadgeDistributionRow[];
}

/**
 * How many learners hold each badge, for /admin/badges.
 *
 * Badges are not stored, so this rebuilds every learner's snapshot from the same tables
 * `getBadgeSnapshot` reads, but in a fixed number of aggregate queries instead of one round
 * trip per person. It is a full scan of the event log: fine for a demo cohort, and the
 * console page is admin-only.
 */
export async function getBadgeDistribution(): Promise<BadgeDistribution> {
  const db = await getDb();
  const [learnerRows, xpRows, dayRows, attemptRows, perfectRows, lessonRows, courseRows, scenarioRows] =
    await Promise.all([
      db.select({ id: users.id }).from(users).where(eq(users.role, 'learner')),
      db
        .select({ userId: learningEvents.userId, total: sum(learningEvents.xp) })
        .from(learningEvents)
        .groupBy(learningEvents.userId),
      db
        .selectDistinct({
          userId: learningEvents.userId,
          day: sql<string>`to_char(${learningEvents.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`,
        })
        .from(learningEvents),
      db.select({ userId: activityAttempts.userId, n: count() }).from(activityAttempts).groupBy(activityAttempts.userId),
      db
        .select({ userId: activityAttempts.userId, n: count() })
        .from(activityAttempts)
        .where(eq(activityAttempts.bestScore, 100))
        .groupBy(activityAttempts.userId),
      db.select({ userId: lessonCompletions.userId, n: count() }).from(lessonCompletions).groupBy(lessonCompletions.userId),
      db
        .select({ userId: enrollments.userId, n: count() })
        .from(enrollments)
        .where(isNotNull(enrollments.completedAt))
        .groupBy(enrollments.userId),
      db
        .select({ userId: learningEvents.userId, payload: learningEvents.payload })
        .from(learningEvents)
        .where(eq(learningEvents.type, 'scenario.completed')),
    ]);

  const push = <T,>(map: Map<string, T[]>, key: string, value: T) => {
    const list = map.get(key);
    if (list) list.push(value);
    else map.set(key, [value]);
  };

  const xpByUser = new Map(xpRows.map((row) => [row.userId, Number(row.total ?? 0)]));
  const daysByUser = new Map<string, string[]>();
  for (const row of dayRows) push(daysByUser, row.userId, row.day);
  const scenariosByUser = new Map<string, Array<{ scenarioKey?: string; score?: number }>>();
  for (const row of scenarioRows) {
    push(scenariosByUser, row.userId, (row.payload ?? {}) as { scenarioKey?: string; score?: number });
  }
  const perUser = (rows: Array<{ userId: string; n: number }>) => new Map(rows.map((row) => [row.userId, row.n]));

  const attempts = perUser(attemptRows);
  const perfect = perUser(perfectRows);
  const lessons = perUser(lessonRows);
  const courses = perUser(courseRows);

  const snapshots: BadgeSnapshot[] = learnerRows.map(({ id }) => {
    const totalXp = xpByUser.get(id) ?? 0;
    return {
      totalXp,
      level: getLevel(totalXp).level,
      streak: computeStreak(daysByUser.get(id) ?? []),
      activitiesCompleted: attempts.get(id) ?? 0,
      perfectActivities: perfect.get(id) ?? 0,
      lessonsCompleted: lessons.get(id) ?? 0,
      coursesCompleted: courses.get(id) ?? 0,
      ...scenarioTotals(scenariosByUser.get(id) ?? []),
    };
  });

  return {
    learners: learnerRows.length,
    activeLearners: learnerRows.filter(({ id }) => xpByUser.has(id)).length,
    rows: BADGES.map((def) => ({
      id: def.id,
      group: def.group,
      earnedBy: snapshots.filter((snapshot) => def.earned(snapshot)).length,
    })),
  };
}

