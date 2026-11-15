// Progress writes (attempts, lesson / course completion) and per-user stats.
// All XP is written to learning_events so the leaderboard and dashboards have one source.
import { and, count, eq, inArray, sql, sum } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import {
  activities,
  activityAttempts,
  activityAttemptHistory,
  enrollments,
  learningEvents,
  lessonCompletions,
  lessons,
} from '@/core/db/schema';
import { EVENT_TYPES, recordEvent } from '@/core/events';
import { newId } from '@/core/ids';
import {
  COURSE_COMPLETE_XP,
  LESSON_COMPLETE_XP,
  computeStreak,
  getLevel,
  xpDelta,
  type LevelInfo,
} from './xp';

export interface CompleteActivityResult {
  xpGained: number;
  bestScore: number;
  lessonCompleted: boolean;
  courseCompleted: boolean;
  totalXp: number;
  level: LevelInfo;
  leveledUp: boolean;
}

export async function getTotalXp(userId: string): Promise<number> {
  const db = await getDb();
  const [row] = await db
    .select({ xp: sum(learningEvents.xp) })
    .from(learningEvents)
    .where(eq(learningEvents.userId, userId));
  return Number(row?.xp ?? 0);
}

export async function getUserStats(userId: string) {
  const db = await getDb();
  const totalXp = await getTotalXp(userId);
  const days = await db
    .selectDistinct({ day: sql<string>`to_char(${learningEvents.createdAt} at time zone 'UTC', 'YYYY-MM-DD')` })
    .from(learningEvents)
    .where(eq(learningEvents.userId, userId));
  const [done] = await db
    .select({ n: count() })
    .from(activityAttempts)
    .where(eq(activityAttempts.userId, userId));
  return {
    totalXp,
    level: getLevel(totalXp),
    streak: computeStreak(days.map((d) => d.day)),
    activitiesCompleted: done?.n ?? 0,
  };
}

/**
 * Record a learner's result for one activity. Safe to call repeatedly: keeps the best
 * score, only awards XP for improvement, and completes the lesson/course when everything
 * in it is done.
 */
export async function completeActivity(input: {
  userId: string;
  activityId: string;
  score: number;
  detail?: unknown;
}): Promise<CompleteActivityResult> {
  const db = await getDb();
  const score = Math.max(0, Math.min(100, Math.round(input.score)));

  const [activity] = await db
    .select({
      id: activities.id,
      lessonId: activities.lessonId,
      xpReward: activities.xpReward,
      courseId: lessons.courseId,
    })
    .from(activities)
    .innerJoin(lessons, eq(lessons.id, activities.lessonId))
    .where(eq(activities.id, input.activityId))
    .limit(1);
  if (!activity) throw new Error('Activity not found');

  const xpBefore = await getTotalXp(input.userId);

  const [existing] = await db
    .select()
    .from(activityAttempts)
    .where(
      and(eq(activityAttempts.userId, input.userId), eq(activityAttempts.activityId, activity.id)),
    )
    .limit(1);

  const gained = xpDelta(existing?.xpEarned ?? 0, score, activity.xpReward);
  const bestScore = Math.max(existing?.bestScore ?? 0, score);

  await db.insert(activityAttemptHistory).values({
    id: newId('attemptHistory'),
    userId: input.userId,
    activityId: activity.id,
    courseId: activity.courseId,
    score,
    detail: input.detail ?? null,
  });

  if (existing) {
    await db
      .update(activityAttempts)
      .set({
        bestScore,
        attemptCount: existing.attemptCount + 1,
        xpEarned: existing.xpEarned + gained,
        detail: input.detail ?? existing.detail,
        updatedAt: new Date(),
      })
      .where(eq(activityAttempts.id, existing.id));
  } else {
    await db.insert(activityAttempts).values({
      id: newId('attempt'),
      userId: input.userId,
      activityId: activity.id,
      courseId: activity.courseId,
      bestScore,
      xpEarned: gained,
      detail: input.detail ?? null,
    });
  }

  await recordEvent({
    userId: input.userId,
    type: EVENT_TYPES.activityCompleted,
    courseId: activity.courseId,
    lessonId: activity.lessonId,
    activityId: activity.id,
    xp: gained,
    payload: { score, attempt: (existing?.attemptCount ?? 0) + 1 },
  });

  // Lesson is complete when every activity in it has an attempt
  const lessonActivityIds = (
    await db
      .select({ id: activities.id })
      .from(activities)
      .where(eq(activities.lessonId, activity.lessonId))
  ).map((r) => r.id);
  const [attempted] = await db
    .select({ n: count() })
    .from(activityAttempts)
    .where(
      and(
        eq(activityAttempts.userId, input.userId),
        inArray(activityAttempts.activityId, lessonActivityIds),
      ),
    );
  let lessonCompleted = false;
  let courseCompleted = false;
  if ((attempted?.n ?? 0) >= lessonActivityIds.length) {
    const result = await completeLesson(input.userId, activity.lessonId);
    lessonCompleted = result.newlyCompleted;
    courseCompleted = result.courseCompleted;
  }

  const totalXp = await getTotalXp(input.userId);
  const level = getLevel(totalXp);
  return {
    xpGained: gained,
    bestScore,
    lessonCompleted,
    courseCompleted,
    totalXp,
    level,
    leveledUp: level.level > getLevel(xpBefore).level,
  };
}

/** Mark a lesson done (also used directly for reading-only lessons). Idempotent. */
export async function completeLesson(
  userId: string,
  lessonId: string,
): Promise<{ newlyCompleted: boolean; courseCompleted: boolean }> {
  const db = await getDb();
  const [lesson] = await db
    .select({ id: lessons.id, courseId: lessons.courseId })
    .from(lessons)
    .where(eq(lessons.id, lessonId))
    .limit(1);
  if (!lesson) throw new Error('Lesson not found');

  const inserted = await db
    .insert(lessonCompletions)
    .values({ userId, lessonId, courseId: lesson.courseId })
    .onConflictDoNothing()
    .returning();
  if (inserted.length === 0) return { newlyCompleted: false, courseCompleted: false };

  await recordEvent({
    userId,
    type: EVENT_TYPES.lessonCompleted,
    courseId: lesson.courseId,
    lessonId,
    xp: LESSON_COMPLETE_XP,
  });

  const [totals] = await db
    .select({ n: count() })
    .from(lessons)
    .where(eq(lessons.courseId, lesson.courseId));
  const [doneCount] = await db
    .select({ n: count() })
    .from(lessonCompletions)
    .where(and(eq(lessonCompletions.userId, userId), eq(lessonCompletions.courseId, lesson.courseId)));

  let courseCompleted = false;
  if ((doneCount?.n ?? 0) >= (totals?.n ?? 0)) {
    const updated = await db
      .update(enrollments)
      .set({ completedAt: new Date() })
      .where(
        and(
          eq(enrollments.userId, userId),
          eq(enrollments.courseId, lesson.courseId),
          sql`${enrollments.completedAt} is null`,
        ),
      )
      .returning();
    if (updated.length > 0) {
      courseCompleted = true;
      await recordEvent({
        userId,
        type: EVENT_TYPES.courseCompleted,
        courseId: lesson.courseId,
        xp: COURSE_COMPLETE_XP,
      });
    }
  }
  return { newlyCompleted: true, courseCompleted };
}

export async function enrollInCourse(userId: string, courseId: string): Promise<boolean> {
  const db = await getDb();
  const inserted = await db
    .insert(enrollments)
    .values({ userId, courseId })
    .onConflictDoNothing()
    .returning();
  if (inserted.length > 0) {
    await recordEvent({ userId, type: EVENT_TYPES.courseEnrolled, courseId });
    return true;
  }
  return false;
}

/** % of lessons completed per course for one user. */
export async function getCourseProgress(
  userId: string,
  courseIds: string[],
): Promise<Map<string, { done: number; total: number; percent: number }>> {
  const out = new Map<string, { done: number; total: number; percent: number }>();
  if (courseIds.length === 0) return out;
  const db = await getDb();
  const totals = await db
    .select({ courseId: lessons.courseId, n: count() })
    .from(lessons)
    .where(inArray(lessons.courseId, courseIds))
    .groupBy(lessons.courseId);
  const done = await db
    .select({ courseId: lessonCompletions.courseId, n: count() })
    .from(lessonCompletions)
    .where(and(eq(lessonCompletions.userId, userId), inArray(lessonCompletions.courseId, courseIds)))
    .groupBy(lessonCompletions.courseId);
  const doneMap = new Map(done.map((d) => [d.courseId, d.n]));
  for (const t of totals) {
    const d = doneMap.get(t.courseId) ?? 0;
    out.set(t.courseId, { done: d, total: t.n, percent: t.n ? Math.round((d / t.n) * 100) : 0 });
  }
  return out;
}
