'use server';

import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { ActivityOutcome } from '@/core/activity-types';
import { generateText } from '@/core/ai/client';
import { requireUser } from '@/core/auth/session';
import { canViewCourse, getCourseById, getLessonWithActivities } from '@/core/content/queries';
import { getDb } from '@/core/db/client';
import { activities, lessons } from '@/core/db/schema';
import { completeActivity, completeLesson, enrollInCourse } from '@/core/progress/service';
import type { SessionUser } from '@/core/types';
import { getActivityType } from '@/registry/activities';
import { ADAPTATION_VARIANTS, lessonAdaptations, type AdaptationVariant } from './schema';

async function courseForLesson(user: SessionUser, lessonId: string) {
  const db = await getDb();
  const [row] = await db.select({ courseId: lessons.courseId }).from(lessons).where(eq(lessons.id, lessonId)).limit(1);
  const course = row ? await getCourseById(row.courseId) : null;
  if (!course || !(await canViewCourse(user, course))) throw new Error('Not allowed');
  return course;
}

const submitSchema = z.object({
  activityId: z.string(),
  score: z.number().min(0).max(100),
  detail: z.unknown().optional(),
});

/**
 * Score for a submitted activity. Types with a grade() (quiz, sort, sequence) are scored here
 * from the stored config and the learner's answers, and the browser's score is ignored.
 * Types that can only be scored in the browser or by the AI (coding, role-play, slides) still
 * use the submitted score.
 */
function scoreOnServer(type: string, config: unknown, detail: unknown, submitted: number): number {
  const def = getActivityType(type);
  if (!def?.grade) return submitted;
  const parsed = def.schema.safeParse(config);
  if (!parsed.success) throw new Error('This activity is misconfigured');
  const score = def.grade(parsed.data, detail);
  if (score === null) throw new Error('These answers do not match the activity');
  return score;
}

/** Called by the lesson runner when a learner finishes an activity. */
export async function submitActivityResult(input: z.infer<typeof submitSchema>): Promise<ActivityOutcome> {
  const user = await requireUser();
  const data = submitSchema.parse(input);
  const db = await getDb();
  const [act] = await db
    .select({ lessonId: activities.lessonId, type: activities.type, config: activities.config })
    .from(activities)
    .where(eq(activities.id, data.activityId))
    .limit(1);
  if (!act) throw new Error('Activity not found');
  const course = await courseForLesson(user, act.lessonId);
  const score = scoreOnServer(act.type, act.config, data.detail, data.score);
  await enrollInCourse(user.id, course.id);
  const res = await completeActivity({ userId: user.id, activityId: data.activityId, score, detail: data.detail });
  return {
    xpGained: res.xpGained,
    bestScore: res.bestScore,
    leveledUp: res.leveledUp,
    levelName: res.level.name,
    lessonCompleted: res.lessonCompleted,
    courseCompleted: res.courseCompleted,
  };
}

/** For lessons without activities: "I have read this". */
export async function markLessonDone(formData: FormData): Promise<void> {
  const user = await requireUser();
  const lessonId = z.string().parse(formData.get('lessonId'));
  const course = await courseForLesson(user, lessonId);
  await enrollInCourse(user.id, course.id);
  await completeLesson(user.id, lessonId);
  revalidatePath(`/courses/${course.slug}`, 'layout');
}

export async function startCourse(formData: FormData): Promise<void> {
  const user = await requireUser();
  const courseId = z.string().parse(formData.get('courseId'));
  const course = await getCourseById(courseId);
  if (!course || !(await canViewCourse(user, course))) throw new Error('Not allowed');
  await enrollInCourse(user.id, course.id);
  const lessonId = z.string().optional().parse(formData.get('lessonId') ?? undefined);
  redirect(lessonId ? `/courses/${course.slug}/lessons/${lessonId}` : `/courses/${course.slug}`);
}

const VARIANT_PROMPTS: Record<AdaptationVariant, string> = {
  simpler:
    'Rewrite this lesson for someone with no computing background. Use everyday analogies (cooking, building, school projects), short sentences, and define every technical word the first time.',
  technical:
    'Rewrite this lesson for a computer science graduate preparing for industry. Be more precise, add the proper terms, one concrete engineering example (code, tools or a real workflow), and a common pitfall.',
  example:
    'Keep the lesson short and add ONE vivid, realistic workplace story (a small team, a real-looking problem, what went wrong and how this idea fixed it).',
};

/** "Explain it my way": personalised rewrite of the lesson, cached per variant. */
export async function adaptLesson(lessonId: string, variant: AdaptationVariant): Promise<{ content: string; mocked: boolean }> {
  const user = await requireUser();
  if (!ADAPTATION_VARIANTS.includes(variant)) throw new Error('Unknown variant');
  await courseForLesson(user, lessonId);
  const db = await getDb();
  const [cached] = await db
    .select()
    .from(lessonAdaptations)
    .where(and(eq(lessonAdaptations.lessonId, lessonId), eq(lessonAdaptations.variant, variant)))
    .limit(1);
  if (cached) return { content: cached.content, mocked: false };

  const lesson = await getLessonWithActivities(lessonId);
  if (!lesson) throw new Error('Lesson not found');
  const { text, mocked } = await generateText(
    [
      {
        role: 'system',
        content: `You adapt lesson text for different learners. ${VARIANT_PROMPTS[variant]} Reply in Markdown, 120-260 words, warm and plain, no hype words, no intro like "Sure!".`,
      },
      { role: 'user', content: `Lesson title: ${lesson.title}\n\n${lesson.content.slice(0, 5000)}` },
    ],
    {
      feature: 'courses.adapt_lesson',
      userId: user.id,
      tier: 'fast',
      maxTokens: 700,
      mock: () =>
        variant === 'simpler'
          ? `### ${lesson.title}, in plain words\n\nThink of it like planning a group dinner: before anyone cooks, you ask who is coming, what they can eat and when they will arrive. Software teams do the same thing before they build.\n\n*(Demo text: add an AI key to get a real rewrite of this lesson.)*`
          : variant === 'technical'
            ? `### ${lesson.title}, for engineers\n\nIn practice this shows up in code review, CI pipelines and ticket refinement. A common pitfall is treating it as paperwork instead of a feedback loop.\n\n*(Demo text: add an AI key to get a real rewrite.)*`
            : `### A story from a real team\n\nA four-person team spent two weeks building a feature nobody asked for. One 20-minute conversation with a user would have saved them. That is what "${lesson.title}" is about.\n\n*(Demo text: add an AI key for a story tailored to this lesson.)*`,
    },
  );
  if (!mocked) {
    await db.insert(lessonAdaptations).values({ lessonId, variant, content: text }).onConflictDoNothing();
  }
  return { content: text, mocked };
}
