// Read models for the catalog, course page, lesson page and the "keep going" widget.
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import {
  activityAttempts,
  enrollments,
  learnerProfiles,
  lessonCompletions,
  type Course,
} from '@/core/db/schema';
import { canViewCourse, getCourseBySlug, getCourseOutline, listVisibleCourses } from '@/core/content/queries';
import { getCourseProgress } from '@/core/progress/service';
import type { SessionUser } from '@/core/types';
import { getLocale } from '@/i18n';
import { localizeContent } from '@/i18n/content';

export type CourseCardData = Course & {
  progress: { done: number; total: number; percent: number } | null;
  enrolled: boolean;
};

/**
 * The AI agents course has a student and a professional edition. They are separate rows so
 * content, progress and duration stay clean, but learners see only the edition that matches
 * their onboarding identity. Presets other than the AI agents pair are unaffected.
 */
function editionForBackground(background: string | undefined): 'student' | 'professional' {
  return background === 'cs_student' || background === 'non_cs' ? 'student' : 'professional';
}

function editionOfSeedCourse(course: Course): 'student' | 'professional' | null {
  if (course.source !== 'seed') return null;
  if (course.tags.includes('student')) return 'student';
  if (course.tags.includes('professional')) return 'professional';
  return null;
}

export async function getCatalog(user: SessionUser) {
  const locale = await getLocale();
  const db = await getDb();
  const all = await listVisibleCourses(user);
  const [profile] = await db.select().from(learnerProfiles).where(eq(learnerProfiles.userId, user.id)).limit(1);
  const edition = editionForBackground(profile?.background);
  const visible = all.filter((c) => {
    if (c.status !== 'published' && c.ownerId !== user.id) return false;
    const courseEdition = editionOfSeedCourse(c);
    return courseEdition === null || courseEdition === edition;
  });
  const ids = visible.map((c) => c.id);
  const [progress, enrolledRows] = await Promise.all([
    getCourseProgress(user.id, ids),
    db.select({ courseId: enrollments.courseId }).from(enrollments).where(eq(enrollments.userId, user.id)),
  ]);
  const enrolled = new Set(enrolledRows.map((r) => r.courseId));
  const cards: CourseCardData[] = visible.map((c) => ({
    ...localizeContent(c, locale),
    progress: progress.get(c.id) ?? null,
    enrolled: enrolled.has(c.id),
  }));
  return { cards, profile: profile ?? null };
}

export async function getCoursePageData(user: SessionUser, slug: string) {
  const locale = await getLocale();
  const course = await getCourseBySlug(slug);
  if (!course || !(await canViewCourse(user, course))) return null;
  const rawOutline = await getCourseOutline(course.id);
  if (!rawOutline) return null;
  const outline = localizeContent(rawOutline, locale);
  const db = await getDb();
  const [done, attempts, [enrollment]] = await Promise.all([
    db
      .select({ lessonId: lessonCompletions.lessonId })
      .from(lessonCompletions)
      .where(and(eq(lessonCompletions.userId, user.id), eq(lessonCompletions.courseId, course.id))),
    db
      .select({ activityId: activityAttempts.activityId, bestScore: activityAttempts.bestScore })
      .from(activityAttempts)
      .where(and(eq(activityAttempts.userId, user.id), eq(activityAttempts.courseId, course.id))),
    db
      .select()
      .from(enrollments)
      .where(and(eq(enrollments.userId, user.id), eq(enrollments.courseId, course.id)))
      .limit(1),
  ]);
  const completed = new Set(done.map((d) => d.lessonId));
  const best = new Map(attempts.map((a) => [a.activityId, a.bestScore]));
  const nextLesson = outline.lessons.find((l) => !completed.has(l.id)) ?? outline.lessons[0] ?? null;
  return { outline, completed, best, enrollment: enrollment ?? null, nextLesson };
}

/** Most recent unfinished enrolled course and the next lesson in it. */
export async function getContinueTarget(userId: string) {
  const locale = await getLocale();
  const db = await getDb();
  const rows = await db
    .select({ courseId: enrollments.courseId })
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), isNull(enrollments.completedAt)))
    .orderBy(desc(enrollments.enrolledAt))
    .limit(5);
  for (const { courseId } of rows) {
    const rawOutline = await getCourseOutline(courseId);
    if (!rawOutline || rawOutline.lessons.length === 0) continue;
    const outline = localizeContent(rawOutline, locale);
    const done = await db
      .select({ lessonId: lessonCompletions.lessonId })
      .from(lessonCompletions)
      .where(
        and(
          eq(lessonCompletions.userId, userId),
          inArray(
            lessonCompletions.lessonId,
            outline.lessons.map((l) => l.id),
          ),
        ),
      );
    const doneSet = new Set(done.map((d) => d.lessonId));
    const next = outline.lessons.find((l) => !doneSet.has(l.id));
    if (next) {
      return {
        course: outline,
        lesson: next,
        lessonNumber: outline.lessons.indexOf(next) + 1,
        percent: Math.round((doneSet.size / outline.lessons.length) * 100),
      };
    }
  }
  return null;
}
