// Read access to courses / lessons / activities with visibility rules in one place.
import { and, asc, eq, inArray, or } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import {
  activities,
  classCourses,
  classMembers,
  courses,
  lessons,
  type Activity,
  type Course,
  type Lesson,
} from '@/core/db/schema';
import type { SessionUser } from '@/core/types';

export type LessonWithActivities = Lesson & { activities: Activity[] };
export type CourseOutline = Course & { lessons: LessonWithActivities[] };

async function classCourseIdsFor(userId: string): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .select({ courseId: classCourses.courseId })
    .from(classCourses)
    .innerJoin(classMembers, eq(classMembers.classId, classCourses.classId))
    .where(eq(classMembers.userId, userId));
  return [...new Set(rows.map((r) => r.courseId))];
}

/** Courses a user may open: public published, assigned via a class, or their own. */
export async function listVisibleCourses(user: SessionUser): Promise<Course[]> {
  const db = await getDb();
  const assigned = await classCourseIdsFor(user.id);
  const conditions = [
    and(eq(courses.status, 'published'), eq(courses.visibility, 'public')),
    eq(courses.ownerId, user.id),
  ];
  if (assigned.length) {
    conditions.push(and(eq(courses.status, 'published'), inArray(courses.id, assigned)));
  }
  if (user.role === 'admin') conditions.push(eq(courses.status, 'published'));
  return db
    .select()
    .from(courses)
    .where(or(...conditions))
    .orderBy(asc(courses.createdAt));
}

export async function canViewCourse(user: SessionUser, course: Course): Promise<boolean> {
  if (user.role === 'admin' || course.ownerId === user.id) return true;
  if (course.status !== 'published') return false;
  if (course.visibility === 'public') return true;
  // "class" means learners of assigned classes, not every instructor. Other instructors
  // may only discover public catalogue courses; class courses stay inside the cohort.
  return (await classCourseIdsFor(user.id)).includes(course.id);
}

export async function canEditCourse(user: SessionUser, course: Course): Promise<boolean> {
  return user.role === 'admin' || (user.role === 'instructor' && course.ownerId === user.id);
}

export async function getCourseBySlug(slug: string): Promise<Course | null> {
  const db = await getDb();
  const [row] = await db.select().from(courses).where(eq(courses.slug, slug)).limit(1);
  return row ?? null;
}

export async function getCourseById(id: string): Promise<Course | null> {
  const db = await getDb();
  const [row] = await db.select().from(courses).where(eq(courses.id, id)).limit(1);
  return row ?? null;
}

export async function getCourseOutline(courseId: string): Promise<CourseOutline | null> {
  const db = await getDb();
  const course = await getCourseById(courseId);
  if (!course) return null;
  const lessonRows = await db
    .select()
    .from(lessons)
    .where(eq(lessons.courseId, courseId))
    .orderBy(asc(lessons.position));
  const ids = lessonRows.map((l) => l.id);
  const activityRows = ids.length
    ? await db
        .select()
        .from(activities)
        .where(inArray(activities.lessonId, ids))
        .orderBy(asc(activities.position))
    : [];
  return {
    ...course,
    lessons: lessonRows.map((l) => ({
      ...l,
      activities: activityRows.filter((a) => a.lessonId === l.id),
    })),
  };
}

export async function getLessonWithActivities(lessonId: string): Promise<LessonWithActivities | null> {
  const db = await getDb();
  const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId)).limit(1);
  if (!lesson) return null;
  const acts = await db
    .select()
    .from(activities)
    .where(eq(activities.lessonId, lessonId))
    .orderBy(asc(activities.position));
  return { ...lesson, activities: acts };
}
