// Small, grounded recommendation set for the tutor panel: next chapters, public courses
// and videos that already appear in the current chapter. No external search or invented URL.
import { and, desc, eq, ne } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import { classMembers, courses, lessons } from '@/core/db/schema';
import { searchYouTube } from '@/core/video/youtube';
import type { SessionUser } from '@/core/types';
import { tutorRecommendationClicks } from './schema';

export interface TutorRecommendation {
  kind: 'lesson' | 'course' | 'video';
  title: string;
  subtitle: string;
  href: string;
  courseId: string | null;
}

const VIDEO_LINK = /\[([^\]]+)\]\((https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|bilibili\.com)\/[^)]+)\)/gi;

export async function getTutorRecommendations(
  user: SessionUser,
  lessonId?: string | null,
): Promise<TutorRecommendation[]> {
  const db = await getDb();
  const out: TutorRecommendation[] = [];
  let currentCourseTitle = '';
  let currentCourseId: string | null = null;

  if (lessonId) {
    const [row] = await db
      .select({
        courseId: lessons.courseId,
        position: lessons.position,
        title: lessons.title,
        content: lessons.content,
        courseTitle: courses.title,
      })
      .from(lessons)
      .innerJoin(courses, eq(courses.id, lessons.courseId))
      .where(eq(lessons.id, lessonId))
      .limit(1);
    if (row) {
      currentCourseTitle = row.courseTitle;
      currentCourseId = row.courseId;
      const [next] = await db
        .select({ id: lessons.id, title: lessons.title })
        .from(lessons)
        .where(and(eq(lessons.courseId, row.courseId), eq(lessons.position, row.position + 1)))
        .limit(1);
      if (next) {
        const [course] = await db.select({ slug: courses.slug }).from(courses).where(eq(courses.id, row.courseId)).limit(1);
        out.push({
          kind: 'lesson',
          title: next.title,
          subtitle: currentCourseTitle,
          href: `/courses/${course?.slug ?? ''}/lessons/${next.id}`,
          courseId: row.courseId,
        });
      }
      for (const match of row.content.matchAll(VIDEO_LINK)) {
        out.push({
          kind: 'video',
          title: match[1] ?? 'Video in this chapter',
          subtitle: currentCourseTitle,
          href: match[2] ?? '',
          courseId: row.courseId,
        });
        if (out.filter((item) => item.kind === 'video').length >= 2) break;
      }
      if (!out.some((item) => item.kind === 'video')) {
        const query = `${currentCourseTitle} ${row.title}`;
        const videos = await searchYouTube(query);
        for (const video of videos) {
          out.push({
            kind: 'video',
            title: video.title,
            subtitle: 'YouTube',
            href: video.url,
            courseId: row.courseId,
          });
        }
        if (videos.length === 0) {
          out.push({
            kind: 'video',
            title: `Search videos for “${currentCourseTitle}”`,
            subtitle: 'Open an external video search',
            href: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
            courseId: row.courseId,
          });
        }
      }
      const publicCourses = await db
        .select({ id: courses.id, slug: courses.slug, title: courses.title, summary: courses.summary })
        .from(courses)
        .where(
          and(
            eq(courses.status, 'published'),
            eq(courses.visibility, 'public'),
            ne(courses.id, row.courseId),
          ),
        )
        .orderBy(desc(courses.updatedAt))
        .limit(2);
      for (const course of publicCourses) {
        out.push({
          kind: 'course',
          title: course.title,
          subtitle: course.summary.slice(0, 120),
          href: `/courses/${course.slug}`,
          courseId: course.id,
        });
      }
    }
  }
  const classRows = await db
    .select({ classId: classMembers.classId })
    .from(classMembers)
    .where(eq(classMembers.userId, user.id));
  const classIds = new Set(classRows.map((row) => row.classId));
  const clicks = await db
    .select({ href: tutorRecommendationClicks.href, courseId: tutorRecommendationClicks.courseId, classId: tutorRecommendationClicks.classId })
    .from(tutorRecommendationClicks);
  const clickScore = new Map<string, number>();
  for (const click of clicks) {
    let score = 0;
    if (click.classId && classIds.has(click.classId)) score += 2;
    if (currentCourseId && click.courseId === currentCourseId) score += 1;
    if (score > 0) clickScore.set(click.href, (clickScore.get(click.href) ?? 0) + score);
  }
  out.sort((a, b) => {
    const score = (item: TutorRecommendation) =>
      (clickScore.get(item.href) ?? 0) * 10 + (item.kind === 'lesson' ? 2 : item.kind === 'video' ? 1 : 0);
    return score(b) - score(a);
  });
  return out.slice(0, 5);
}
