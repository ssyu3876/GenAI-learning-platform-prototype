// Read functions for self-learn (server only).
import { and, count, desc, eq, gte, inArray } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import { courses, learnerProfiles, lessons, type Course } from '@/core/db/schema';
import type { AudienceProfile } from './audience';
import { courseGenerationSessions, courseSeries, type CourseGenerationSession } from './schema';
import type { CourseSeriesPlan } from './types';

export const DAILY_COURSE_LIMIT = 5;

export type OwnCourse = Pick<Course, 'id' | 'slug' | 'title' | 'emoji' | 'color' | 'summary' | 'createdAt'> & {
  lessonCount: number;
  sessionId?: string;
};

/** Courses this learner generated for themselves, newest first. */
export async function listOwnCourses(userId: string): Promise<OwnCourse[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: courses.id,
      slug: courses.slug,
      title: courses.title,
      emoji: courses.emoji,
      color: courses.color,
      summary: courses.summary,
      createdAt: courses.createdAt,
    })
    .from(courses)
    .where(and(eq(courses.ownerId, userId), eq(courses.source, 'learner_ai')))
    .orderBy(desc(courses.createdAt));
  if (rows.length === 0) return [];
  const counts = await db
    .select({ courseId: lessons.courseId, n: count() })
    .from(lessons)
    .where(
      inArray(
        lessons.courseId,
        rows.map((r) => r.id),
      ),
    )
    .groupBy(lessons.courseId);
  const byId = new Map(counts.map((c) => [c.courseId, c.n]));
  const sessions = await db
    .select({ id: courseGenerationSessions.id, courseId: courseGenerationSessions.courseId })
    .from(courseGenerationSessions)
    .where(and(eq(courseGenerationSessions.userId, userId), inArray(courseGenerationSessions.courseId, rows.map((r) => r.id))))
    .orderBy(desc(courseGenerationSessions.createdAt));
  const sessionByCourse = new Map<string, string>();
  for (const session of sessions) {
    if (session.courseId && !sessionByCourse.has(session.courseId)) sessionByCourse.set(session.courseId, session.id);
  }
  return rows.map((r) => ({
    ...r,
    lessonCount: byId.get(r.id) ?? 0,
    sessionId: sessionByCourse.get(r.id),
  }));
}

export async function countCoursesGeneratedToday(userId: string): Promise<number> {
  const db = await getDb();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [row] = await db
    .select({ n: count() })
    .from(courses)
    .where(and(eq(courses.ownerId, userId), eq(courses.source, 'learner_ai'), gte(courses.createdAt, since)));
  return row?.n ?? 0;
}

export async function getAudienceProfile(userId: string): Promise<AudienceProfile | null> {
  const db = await getDb();
  const [row] = await db
    .select({
      background: learnerProfiles.background,
      codingLevel: learnerProfiles.codingLevel,
      track: learnerProfiles.track,
    })
    .from(learnerProfiles)
    .where(eq(learnerProfiles.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function getGenerationSession(
  userId: string,
  sessionId: string,
): Promise<CourseGenerationSession | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(courseGenerationSessions)
    .where(and(eq(courseGenerationSessions.id, sessionId), eq(courseGenerationSessions.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function getCourseSeries(userId: string, seriesId: string): Promise<{
  id: string;
  plan: CourseSeriesPlan;
  request: CourseGenerationSession['request'];
} | null> {
  const db = await getDb();
  const [row] = await db
    .select({ id: courseSeries.id, plan: courseSeries.plan, request: courseSeries.request })
    .from(courseSeries)
    .where(and(eq(courseSeries.id, seriesId), eq(courseSeries.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function listSeriesSessions(seriesId: string): Promise<
  Array<{ id: string; seriesPart: number | null; status: CourseGenerationSession['status']; courseId: string | null }>
> {
  const db = await getDb();
  return db
    .select({
      id: courseGenerationSessions.id,
      seriesPart: courseGenerationSessions.seriesPart,
      status: courseGenerationSessions.status,
      courseId: courseGenerationSessions.courseId,
    })
    .from(courseGenerationSessions)
    .where(eq(courseGenerationSessions.seriesId, seriesId))
    .orderBy(courseGenerationSessions.seriesPart);
}

export async function getSeriesForSession(session: CourseGenerationSession): Promise<{
  id: string;
  plan: CourseSeriesPlan;
} | null> {
  if (!session.seriesId) return null;
  const db = await getDb();
  const [row] = await db
    .select({ id: courseSeries.id, plan: courseSeries.plan })
    .from(courseSeries)
    .where(eq(courseSeries.id, session.seriesId))
    .limit(1);
  return row ?? null;
}

export async function getGeneratedCourse(session: CourseGenerationSession): Promise<{
  course: Course;
  lessons: Array<{ id: string; title: string; estimatedMinutes: number; position: number }>;
} | null> {
  if (!session.courseId) return null;
  const db = await getDb();
  const [course] = await db.select().from(courses).where(eq(courses.id, session.courseId)).limit(1);
  if (!course) return null;
  const rows = await db
    .select({ id: lessons.id, title: lessons.title, estimatedMinutes: lessons.estimatedMinutes, position: lessons.position })
    .from(lessons)
    .where(eq(lessons.courseId, course.id))
    .orderBy(lessons.position);
  return { course, lessons: rows };
}
