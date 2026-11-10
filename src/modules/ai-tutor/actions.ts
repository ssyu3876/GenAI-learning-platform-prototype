'use server';
// Tiny lookup for the "Talking about: <lesson>" chip in the tutor panel.

import { z } from 'zod';
import { requireUser } from '@/core/auth/session';
import type { ActionResult } from '@/core/types';
import { getT } from '@/i18n';
import { byLocale } from '@/i18n/ai';
import { localizeContent } from '@/i18n/content';
import { loadLessonContext } from './context';

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
