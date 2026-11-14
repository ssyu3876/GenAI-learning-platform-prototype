// Read functions for the course studio (server only).
import { and, asc, count, desc, eq, ilike, inArray, isNull, ne, or, type SQL } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import { classCourses, classes, courses, lessons, type Course } from '@/core/db/schema';
import { ensureCourseCodes } from '@/core/content/draft';
import type { SessionUser } from '@/core/types';
import { getLocale } from '@/i18n';
import { localizeContent } from '@/i18n/content';

export type StudioCourse = Course & { lessonCount: number };

async function withLessonCounts(rows: Course[]): Promise<StudioCourse[]> {
  if (rows.length === 0) return [];
  const db = await getDb();
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
  return rows.map((r) => ({ ...r, lessonCount: byId.get(r.id) ?? 0 }));
}

/** Which courses show up in "My courses": own courses, and for admins every staff-made course. */
function studioScope(user: SessionUser): SQL | undefined {
  if (user.role === 'admin') return ne(courses.source, 'learner_ai');
  return eq(courses.ownerId, user.id);
}

export async function listStudioCourses(user: SessionUser, query?: string): Promise<StudioCourse[]> {
  const db = await getDb();
  await ensureCourseCodes();
  const filters: SQL[] = [studioScope(user)].filter((value): value is SQL => Boolean(value));
  const search = query?.trim().replace(/^#/, '');
  if (search) {
    filters.push(or(ilike(courses.title, `%${search}%`), ilike(courses.code, `%${search}%`))!);
  }
  const rows = await db
    .select()
    .from(courses)
    .where(and(...filters))
    .orderBy(desc(courses.updatedAt));
  const locale = await getLocale();
  return localizeContent(await withLessonCounts(rows), locale);
}

/** Published public catalogue courses, to duplicate and customise. */
export async function listForkableCourses(user: SessionUser): Promise<StudioCourse[]> {
  const db = await getDb();
  const rows = await db
    .select()
    .from(courses)
    .where(
      and(
        eq(courses.status, 'published'),
        eq(courses.visibility, 'public'),
        ne(courses.source, 'learner_ai'),
        // seed courses have no owner, and ne() never matches null
        or(isNull(courses.ownerId), ne(courses.ownerId, user.id)),
      ),
    )
    .orderBy(desc(courses.updatedAt));
  const locale = await getLocale();
  return localizeContent(await withLessonCounts(rows), locale);
}

export interface StudioOverview {
  drafts: number;
  published: number;
  pending: number;
  lastEdited: Pick<Course, 'id' | 'title' | 'emoji' | 'updatedAt'> | null;
}

/** Classes currently using a course, for the unpublish confirmation. */
export async function listCourseClassUsage(courseId: string): Promise<Array<{ id: string; name: string }>> {
  const db = await getDb();
  return db
    .select({ id: classes.id, name: classes.name })
    .from(classCourses)
    .innerJoin(classes, eq(classes.id, classCourses.classId))
    .where(eq(classCourses.courseId, courseId))
    .orderBy(asc(classes.name));
}

export async function getStudioOverview(user: SessionUser): Promise<StudioOverview> {
  const locale = await getLocale();
  const db = await getDb();
  const rows = await db
    .select({ status: courses.status, n: count() })
    .from(courses)
    .where(studioScope(user))
    .groupBy(courses.status);
  const n = (s: string) => rows.find((r) => r.status === s)?.n ?? 0;
  const [last] = await db
    .select({ id: courses.id, title: courses.title, emoji: courses.emoji, updatedAt: courses.updatedAt })
    .from(courses)
    .where(studioScope(user))
    .orderBy(desc(courses.updatedAt))
    .limit(1);
  return { drafts: n('draft'), published: n('published'), pending: n('pending_review'), lastEdited: last ? localizeContent(last, locale) : null };
}
