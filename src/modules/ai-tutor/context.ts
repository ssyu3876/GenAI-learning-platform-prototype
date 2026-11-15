// Loads what the tutor needs to know: the current lesson (only if the learner may see it)
// and the learner's onboarding profile. Server only.
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/core/db/client';
import { activities, activityAttempts, learnerProfiles } from '@/core/db/schema';
import { canViewCourse, getCourseById, getLessonWithActivities } from '@/core/content/queries';
import type { SessionUser } from '@/core/types';
import { getLocale } from '@/i18n';
import { localizeContent } from '@/i18n/content';
import { LESSON_CHAR_LIMIT, truncate, type TutorLearnerProfile, type TutorLessonContext, type TutorReviewContext } from './prompt';

// Only the question prompts are read, never the answers, so they cannot leak into the prompt.
const quizPromptsSchema = z.object({ questions: z.array(z.object({ prompt: z.string() })) });
const quizDetailSchema = z.object({ answers: z.array(z.number().int().nullable()) });
const quizSchema = z.object({
  questions: z.array(
    z.object({
      prompt: z.string(),
      options: z.array(z.string()),
      answerIndex: z.number().int(),
      explanation: z.string().default(''),
    }),
  ),
});

export async function loadLessonContext(user: SessionUser, lessonId: string): Promise<TutorLessonContext | null> {
  const lesson = await getLessonWithActivities(lessonId);
  if (!lesson) return null;
  const course = await getCourseById(lesson.courseId);
  if (!course || !(await canViewCourse(user, course))) return null;

  const gradedItems: string[] = [];
  for (const activity of lesson.activities) {
    if (activity.type === 'quiz') {
      const parsed = quizPromptsSchema.safeParse(activity.config);
      if (parsed.success) {
        for (const q of parsed.data.questions) gradedItems.push(`Quiz question: ${q.prompt.slice(0, 200)}`);
        continue;
      }
    }
    gradedItems.push(`${activity.type} activity: ${activity.title}`);
  }

  return {
    id: lesson.id,
    courseId: course.id,
    title: lesson.title,
    courseTitle: course.title,
    subject: course.subject,
    content: truncate(lesson.content, LESSON_CHAR_LIMIT),
    gradedItems: gradedItems.slice(0, 20),
  };
}

export async function loadLearnerProfile(userId: string): Promise<TutorLearnerProfile | null> {
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

/** Re-reads the question from the stored quiz so a client cannot spoof the answer key. */
export async function loadReviewContext(
  user: SessionUser,
  lessonId: string,
  prompt: string,
): Promise<TutorReviewContext | null> {
  const lesson = await getLessonWithActivities(lessonId);
  if (!lesson) return null;
  const course = await getCourseById(lesson.courseId);
  if (!course || !(await canViewCourse(user, course))) return null;
  const locale = await getLocale();
  const db = await getDb();
  const attempts = await db
    .select({ activityId: activityAttempts.activityId, detail: activityAttempts.detail })
    .from(activityAttempts)
    .innerJoin(activities, eq(activities.id, activityAttempts.activityId))
    .where(and(eq(activityAttempts.userId, user.id), eq(activities.lessonId, lessonId)));
  for (const activity of lesson.activities) {
    if (activity.type !== 'quiz') continue;
    const parsed = quizSchema.safeParse(activity.config);
    if (!parsed.success) continue;
    const questionIndex = parsed.data.questions.findIndex((item) => {
      const localized = localizeContent(item.prompt, locale);
      return item.prompt === prompt || localized === prompt;
    });
    if (questionIndex < 0) continue;
    const question = parsed.data.questions[questionIndex]!;
    // Only permit the review exception when this learner has actually attempted the quiz.
    // The latest attempt may already be correct while an older review card is still unmastered,
    // so this is a "has attempted" gate rather than a "latest answer is still wrong" gate.
    const answeredBefore = attempts.some((attempt) => {
      if (attempt.activityId !== activity.id) return false;
      const answers = quizDetailSchema.safeParse(attempt.detail);
      return answers.success && answers.data.answers[questionIndex] !== undefined;
    });
    if (!answeredBefore) return null;
    const options = localizeContent(question.options, locale);
    return {
      question: localizeContent(question.prompt, locale),
      options,
      wrongAnswer: null,
      correctAnswer: options[question.answerIndex] ?? '',
      explanation: localizeContent(question.explanation ?? '', locale),
    };
  }
  return null;
}
