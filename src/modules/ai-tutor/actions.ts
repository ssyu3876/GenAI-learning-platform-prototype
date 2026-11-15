'use server';
// Tiny lookup for the "Talking about: <lesson>" chip in the tutor panel.

import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireUser } from '@/core/auth/session';
import { getDb } from '@/core/db/client';
import { classMembers } from '@/core/db/schema';
import { newId } from '@/core/ids';
import type { ActionResult } from '@/core/types';
import { getT } from '@/i18n';
import { byLocale } from '@/i18n/ai';
import { localizeContent } from '@/i18n/content';
import { loadLessonContext } from './context';
import { getTutorRecommendations, type TutorRecommendation } from './recommendations';
import { tutorRecommendationClicks } from './schema';

const lessonIdSchema = z.string().min(1).max(64);

export async function getTutorLessonTitle(
  lessonId: string,
): Promise<ActionResult<{ title: string; courseTitle: string }>> {
  const user = await requireUser();
  const { locale } = await getT();
  const parsed = lessonIdSchema.safeParse(lessonId);
  if (!parsed.success) return { ok: false, error: byLocale(locale, 'Unknown lesson.', '未知的课程。') };
  const rawLesson = await loadLessonContext(user, parsed.data);
  if (!rawLesson) return { ok: false, error: byLocale(locale, 'Lesson not found.', '找不到这节课。') };
  const lesson = localizeContent(rawLesson, locale);
  return { ok: true, data: { title: lesson.title, courseTitle: lesson.courseTitle } };
}

export async function getTutorRecommendationsAction(
  lessonId?: string,
): Promise<ActionResult<TutorRecommendation[]>> {
  const user = await requireUser();
  const parsed = z.string().min(1).max(64).optional().safeParse(lessonId);
  if (!parsed.success) return { ok: true, data: [] };
  return { ok: true, data: await getTutorRecommendations(user, parsed.data) };
}

const recommendationClickSchema = z.object({
  kind: z.enum(['lesson', 'course', 'video']),
  title: z.string().min(1).max(300),
  href: z.string().min(1).max(1000),
  courseId: z.string().min(1).max(64).nullable().optional(),
});

export async function trackTutorRecommendation(input: z.infer<typeof recommendationClickSchema>): Promise<void> {
  const user = await requireUser();
  const parsed = recommendationClickSchema.safeParse(input);
  if (!parsed.success) return;
  const db = await getDb();
  const [membership] = await db
    .select({ classId: classMembers.classId })
    .from(classMembers)
    .where(eq(classMembers.userId, user.id))
    .limit(1);
  await db.insert(tutorRecommendationClicks).values({
    id: newId('tutorClick'),
    userId: user.id,
    kind: parsed.data.kind,
    title: parsed.data.title,
    href: parsed.data.href,
    courseId: parsed.data.courseId ?? null,
    classId: membership?.classId ?? null,
  });
}
