import { and, count, eq, isNotNull } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import { activityAttempts, enrollments, learningEvents, lessonCompletions } from '@/core/db/schema';
import { getUserStats } from '@/core/progress/service';
import { BADGES, type BadgeDef, type BadgeSnapshot } from './definitions';

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

  const finished = new Set<string>();
  const interviewKeys = new Set<string>();
  let shipItBest = 0;
  let sprintBest = 0;

  for (const row of scenarioEvents) {
    const payload = (row.payload ?? {}) as { scenarioKey?: string; score?: number };
    const key = payload.scenarioKey;
    if (!key) continue;
    finished.add(key);
    const score = Number(payload.score ?? 0);
    if (key === 'ship-it') shipItBest = Math.max(shipItBest, score);
    if (key === 'sprint-zero') sprintBest = Math.max(sprintBest, score);
    if (key.startsWith('interview:')) interviewKeys.add(key);
  }

  const longScenariosFinished =
    (finished.has('ship-it') ? 1 : 0) + (finished.has('sprint-zero') ? 1 : 0);

  return {
    totalXp: stats.totalXp,
    level: stats.level.level,
    streak: stats.streak,
    activitiesCompleted: attempts[0]?.n ?? 0,
    perfectActivities: perfect[0]?.n ?? 0,
    lessonsCompleted: lessons[0]?.n ?? 0,
    coursesCompleted: courses[0]?.n ?? 0,
    scenariosFinished: finished.size,
    longScenariosFinished,
    shipItBest,
    sprintBest,
    interviewsFinished: interviewKeys.size,
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
