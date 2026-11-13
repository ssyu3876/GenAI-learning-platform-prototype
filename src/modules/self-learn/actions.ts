'use server';

// "Learn anything": requirements -> framework -> approved course -> feedback/iteration.
import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireUser } from '@/core/auth/session';
import { saveCourseDraft, type CourseDraft } from '@/core/content/draft';
import { getDb } from '@/core/db/client';
import { activities, courses, lessons } from '@/core/db/schema';
import { EVENT_TYPES, recordEvent } from '@/core/events';
import { newId } from '@/core/ids';
import { enrollInCourse } from '@/core/progress/service';
import type { ActionResult } from '@/core/types';
import { getT } from '@/i18n';
import { byLocale } from '@/i18n/ai';
import { ACTIVITY_TYPES, activitySpecs } from '@/registry/activities';
import { generateOutline, regenerateOneLesson } from './generation';
import {
  countCoursesGeneratedToday,
  DAILY_COURSE_LIMIT,
  getAudienceProfile,
  getGeneratedCourse,
  getGenerationSession,
} from './queries';
import { courseFeedback, courseGenerationSessions } from './schema';
import { preferredActivityTypes, requestSchema, type GenerationRequest } from './types';

const feedbackSchema = z.object({
  sessionId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  difficulty: z.enum(['too_easy', 'right', 'too_hard']).optional(),
  comment: z
    .string()
    .trim()
    .max(800)
    .optional()
    .transform((value) => (value ? value : undefined)),
});

const lessonFeedbackSchema = z.object({
  sessionId: z.string().min(1),
  lessonId: z.string().min(1),
  comment: z
    .string()
    .trim()
    .max(800)
    .optional()
    .transform((value) => (value ? value : undefined)),
});

function activityTypesFor(request: GenerationRequest): string[] {
  const installed = ACTIVITY_TYPES.map((item) => item.type);
  const isCodeTopic = /\b(code|coding|program|python|javascript|typescript|java|sql|git|react|html|css)\b/i.test(request.topic);
  const preferred = preferredActivityTypes(request.contentFormat, request.assessment).filter(
    (type) => installed.includes(type) && (isCodeTopic || type !== 'coding'),
  );
  return preferred.length ? preferred : installed.filter((type) => isCodeTopic || type !== 'coding');
}

function specsFor(request: GenerationRequest) {
  return activitySpecs(activityTypesFor(request));
}

async function ownSession(userId: string, sessionId: string) {
  const session = await getGenerationSession(userId, sessionId);
  if (!session) throw new Error('Generation session not found.');
  return session;
}

/**
 * A learner often writes "make it 10 lessons" or "I have 6 hours" in the framework feedback.
 * Apply those numbers before prompting, otherwise the fixed budget silently wins.
 */
function requestWithFeedback(request: GenerationRequest, comment?: string): GenerationRequest {
  if (!comment) return request;
  let next = { ...request };
  const count = comment.match(/(\d{1,2})\s*(?:lessons?|节(?:课)?|门课|课)/i);
  if (count) {
    const value = Number(count[1]);
    if (Number.isInteger(value) && value >= 3 && value <= 12) next = { ...next, lessonCount: value };
  }
  const hours = comment.match(/(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h|小时)/i);
  if (hours) {
    const minutes = Math.round(Number(hours[1]) * 60);
    if (minutes >= 15 && minutes <= 20 * 60) {
      next = { ...next, timeBudget: 'custom', customMinutes: minutes };
    }
  }
  return next;
}

/** Step 1: requirements -> framework. The full course is not written yet. */
export async function generateLearnerOutline(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser(['learner']);
  const { locale } = await getT();
  const parsed = requestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: byLocale(
        locale,
        parsed.error.issues[0]?.message ?? 'Tell Pip a topic.',
        '请告诉 Pip 你想学什么（至少 3 个字符，最多 200 个字符）。',
      ),
    };
  }
  if ((await countCoursesGeneratedToday(user.id)) >= DAILY_COURSE_LIMIT) {
    return {
      ok: false,
      error: byLocale(
        locale,
        `Pip has made ${DAILY_COURSE_LIMIT} courses for you today. Try again tomorrow.`,
        `Pip 今天已经为你做了 ${DAILY_COURSE_LIMIT} 门课程，明天再来吧。`,
      ),
    };
  }

  const { customHours, ...base } = parsed.data;
  const request: GenerationRequest = {
    ...base,
    customMinutes: base.timeBudget === 'custom' ? Math.round((customHours ?? 1) * 60) : undefined,
    locale,
  };
  const profile = await getAudienceProfile(user.id);
  const specs = specsFor(request);
  try {
    const outline = await generateOutline({ request, profile, specs, userId: user.id });
    const db = await getDb();
    const sessionId = newId('courseGen');
    await db.insert(courseGenerationSessions).values({
      id: sessionId,
      userId: user.id,
      request,
      outline,
      status: 'outline',
    });
    revalidatePath('/create');
    redirect(`/create/outline/${sessionId}`);
  } catch (error) {
    const digest = error && typeof error === 'object' && 'digest' in error ? String(error.digest) : '';
    if (digest.startsWith('NEXT_REDIRECT')) throw error;
    return {
      ok: false,
      error: byLocale(
        locale,
        error instanceof Error ? error.message : 'Pip could not plan this course. Try again.',
        error instanceof Error ? `Pip 规划课程时出错了：${error.message}` : 'Pip 规划课程时出错了，请再试一次。',
      ),
    };
  }
}

/** Step 2a: learner wants a different direction. */
export async function regenerateOutline(formData: FormData): Promise<void> {
  const user = await requireUser(['learner']);
  const sessionId = z.string().min(1).parse(formData.get('sessionId'));
  const comment = (formData.get('comment') as string | null)?.trim() || undefined;
  const session = await ownSession(user.id, sessionId);
  const request = requestWithFeedback(session.request, comment);
  const specs = specsFor(request);
  const profile = await getAudienceProfile(user.id);
  const outline = await generateOutline({
    request,
    profile,
    specs,
    userId: user.id,
    feedback: comment,
  });
  const db = await getDb();
  await db
    .update(courseGenerationSessions)
    .set({ request, outline, updatedAt: new Date() })
    .where(eq(courseGenerationSessions.id, session.id));
  if (comment) {
    await db.insert(courseFeedback).values({
      id: newId('courseFeedback'),
      sessionId: session.id,
      userId: user.id,
      courseId: session.courseId,
      stage: 'outline',
      comment,
    });
  }
  revalidatePath(`/create/outline/${session.id}`);
  redirect(`/create/outline/${session.id}`);
}

/** Step 2b: framework approved -> course shell + resumable lesson-by-lesson generation. */
export async function approveOutline(formData: FormData): Promise<void> {
  const user = await requireUser(['learner']);
  const sessionId = z.string().min(1).parse(formData.get('sessionId'));
  const session = await ownSession(user.id, sessionId);
  if (session.status === 'generated') redirect(`/create/feedback/${session.id}`);
  if (session.courseId) redirect(`/create/generate/${session.id}`);
  if ((await countCoursesGeneratedToday(user.id)) >= DAILY_COURSE_LIMIT) {
    redirect(`/create/outline/${session.id}?error=limit`);
  }

  const shell: CourseDraft = {
    title: session.outline.title,
    summary: session.outline.promise,
    subject: session.request.topic.slice(0, 60),
    level: session.request.level,
    audience: 'everyone',
    tags: [session.request.topic.toLowerCase().slice(0, 30)],
    emoji: '🌱',
    color: 'mint',
    lessons: [],
  };
  const saved = await saveCourseDraft(shell, {
    ownerId: user.id,
    source: 'learner_ai',
    status: 'published',
    visibility: 'private',
  });
  const db = await getDb();
  await db
    .update(courseGenerationSessions)
    .set({ status: 'generating', courseId: saved.id, updatedAt: new Date() })
    .where(eq(courseGenerationSessions.id, session.id));
  revalidatePath('/create');
  redirect(`/create/generate/${session.id}`);
}

/**
 * Generate the next lesson of an approved outline. The client calls this once per lesson,
 * so each serverless invocation stays below the platform timeout and the learner sees progress.
 */
export async function generateLessonForSession(
  sessionId: string,
): Promise<ActionResult<{ done: boolean; generated: number; total: number }>> {
  const user = await requireUser(['learner']);
  const session = await ownSession(user.id, sessionId);
  if (!session.courseId) redirect(`/create/outline/${session.id}`);
  if (session.status === 'generated') return { ok: true, data: { done: true, generated: session.outline.lessons.length, total: session.outline.lessons.length } };

  const generated = await getGeneratedCourse(session);
  if (!generated) return { ok: false, error: 'Course not found.' };
  const existingPositions = new Set(generated.lessons.map((lesson) => lesson.position));
  const nextIndex = session.outline.lessons.findIndex((_, index) => !existingPositions.has(index));
  if (nextIndex < 0) {
    await finishGeneration(session.id, session.courseId, session.outline.lessons.length, user.id);
    return { ok: true, data: { done: true, generated: session.outline.lessons.length, total: session.outline.lessons.length } };
  }

  const outlineLesson = session.outline.lessons[nextIndex]!;
  const specs = specsFor(session.request);
  let rewritten: Awaited<ReturnType<typeof regenerateOneLesson>>;
  try {
    rewritten = await regenerateOneLesson({
      request: session.request,
      outline: session.outline,
      lessonIndex: nextIndex,
      specs,
      userId: user.id,
      feedback: 'Write this lesson now as part of the approved course.',
    });
  } catch (error) {
    const { locale } = await getT();
    return {
      ok: false,
      error: byLocale(
        locale,
        error instanceof Error ? error.message : 'Pip could not write this lesson. Please retry.',
        'Pip 这一节没写成功，请点重试。',
      ),
    };
  }
  const db = await getDb();
  const lessonId = newId('lesson');
  await db.insert(lessons).values({
    id: lessonId,
    courseId: session.courseId,
    position: nextIndex,
    title: rewritten.title,
    content: rewritten.content,
    estimatedMinutes: outlineLesson.estimatedMinutes,
  });
  for (const [position, activity] of rewritten.activities.entries()) {
    await db.insert(activities).values({
      id: newId('activity'),
      lessonId,
      position,
      type: activity.type,
      title: activity.title,
      config: activity.config,
      xpReward: activity.xpReward ?? 20,
    });
  }

  const done = nextIndex === session.outline.lessons.length - 1;
  if (done) await finishGeneration(session.id, session.courseId, session.outline.lessons.length, user.id);
  revalidatePath(`/courses/${generated.course.slug}`);
  revalidatePath(`/create/generate/${session.id}`);
  return {
    ok: true,
    data: { done, generated: nextIndex + 1, total: session.outline.lessons.length },
  };
}

async function finishGeneration(sessionId: string, courseId: string, lessonCount: number, userId: string) {
  const db = await getDb();
  const [course] = await db.select().from(courses).where(eq(courses.id, courseId)).limit(1);
  if (!course) return;
  const rows = await db.select({ minutes: lessons.estimatedMinutes }).from(lessons).where(eq(lessons.courseId, courseId));
  const minutes = rows.reduce((total, row) => total + row.minutes, 0);
  await db.update(courses).set({ estimatedMinutes: minutes, updatedAt: new Date() }).where(eq(courses.id, courseId));
  await db
    .update(courseGenerationSessions)
    .set({ status: 'generated', updatedAt: new Date() })
    .where(eq(courseGenerationSessions.id, sessionId));
  await enrollInCourse(userId, courseId).catch(() => undefined);
  await recordEvent({
    userId,
    type: EVENT_TYPES.courseGenerated,
    courseId,
    payload: { courseId, sessionId, lessons: lessonCount },
  });
  revalidatePath('/create');
  revalidatePath('/home');
}

/** Step 3: post-course feedback (the second gate). */
export async function saveCourseFeedback(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const user = await requireUser(['learner']);
  const parsed = feedbackSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: 'Please check the feedback fields.' };
  const session = await ownSession(user.id, parsed.data.sessionId);
  const db = await getDb();
  await db.insert(courseFeedback).values({
    id: newId('courseFeedback'),
    sessionId: session.id,
    userId: user.id,
    courseId: session.courseId,
    stage: 'course',
    rating: parsed.data.rating ?? null,
    difficulty: parsed.data.difficulty ?? null,
    comment: parsed.data.comment ?? '',
  });
  revalidatePath(`/create/feedback/${session.id}`);
  redirect(`/create/feedback/${session.id}?saved=1`);
}

/** Step 4: revise one lesson without regenerating the whole course. */
export async function regenerateLesson(formData: FormData): Promise<void> {
  const user = await requireUser(['learner']);
  const parsed = lessonFeedbackSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error('Invalid lesson feedback.');
  const session = await ownSession(user.id, parsed.data.sessionId);
  if (!session.courseId) redirect(`/create/outline/${session.id}`);
  const generated = await getGeneratedCourse(session);
  if (!generated) throw new Error('Course not found.');

  const db = await getDb();
  const [lesson] = await db
    .select()
    .from(lessons)
    .where(and(eq(lessons.id, parsed.data.lessonId), eq(lessons.courseId, session.courseId)))
    .limit(1);
  if (!lesson) throw new Error('Lesson not found.');

  const specs = specsFor(session.request);
  const rewritten = await regenerateOneLesson({
    request: session.request,
    outline: session.outline,
    lessonIndex: lesson.position,
    specs,
    userId: user.id,
    feedback: parsed.data.comment ?? '',
  });
  await db
    .update(lessons)
    .set({
      title: rewritten.title,
      content: rewritten.content,
      estimatedMinutes: lesson.estimatedMinutes,
      updatedAt: new Date(),
    })
    .where(eq(lessons.id, lesson.id));
  await db.delete(activities).where(eq(activities.lessonId, lesson.id));
  for (const [position, activity] of rewritten.activities.entries()) {
    await db.insert(activities).values({
      id: newId('activity'),
      lessonId: lesson.id,
      position,
      type: activity.type,
      title: activity.title,
      config: activity.config,
      xpReward: activity.xpReward ?? 20,
    });
  }
  await db.insert(courseFeedback).values({
    id: newId('courseFeedback'),
    sessionId: session.id,
    userId: user.id,
    courseId: session.courseId,
    stage: 'lesson',
    comment: parsed.data.comment ?? '',
    lessonId: lesson.id,
  });
  revalidatePath(`/create/feedback/${session.id}`);
  revalidatePath(`/courses/${generated.course.slug}`);
  redirect(`/create/feedback/${session.id}?revised=1`);
}
