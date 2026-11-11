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
import { getT } from '@/i18n';
import { outputLanguage } from '@/i18n/ai';
import { localizeContent } from '@/i18n/content';
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
  const { locale } = await getT();
  if (!ADAPTATION_VARIANTS.includes(variant)) throw new Error('Unknown variant');
  await courseForLesson(user, lessonId);
  const db = await getDb();
  // The cache has one slot per (lesson, variant) and no locale column, so only English
  // results are cached; Chinese is generated (or mocked) per request instead of mixing.
  if (locale === 'en') {
    const [cached] = await db
      .select()
      .from(lessonAdaptations)
      .where(and(eq(lessonAdaptations.lessonId, lessonId), eq(lessonAdaptations.variant, variant)))
      .limit(1);
    if (cached) return { content: cached.content, mocked: false };
  }

  const rawLesson = await getLessonWithActivities(lessonId);
  if (!rawLesson) throw new Error('Lesson not found');
  const lesson = localizeContent(rawLesson, locale);
  const { text, mocked } = await generateText(
    [
      {
        role: 'system',
        content: [
          `You adapt lesson text for different learners. ${VARIANT_PROMPTS[variant]}`,
          'Reply in Markdown, 120-260 words, warm and plain, no hype words, no intro like "Sure!".',
          outputLanguage(locale),
        ].join('\n'),
      },
      { role: 'user', content: `Lesson title: ${lesson.title}\n\n${lesson.content.slice(0, 5000)}` },
    ],
    {
      feature: 'courses.adapt_lesson',
      userId: user.id,
      tier: 'fast',
      maxTokens: 700,
      mock: () =>
        locale === 'zh'
          ? variant === 'simpler'
            ? `### ${lesson.title}，用大白话说\n\n可以把它想成安排一顿聚餐：开火之前，先问清楚谁会来、能吃什么、几点到。软件团队在动手之前做的也是这些事。\n\n*（演示文本：配置 AI 密钥后即可获得这一课的真实改写。）*`
            : variant === 'technical'
              ? `### ${lesson.title}，写给工程师\n\n在实际工作中，这会出现在代码评审、CI 流水线和需求梳理里。常见的坑是把它当成纸面流程，而不是反馈回路。\n\n*（演示文本：配置 AI 密钥后即可获得真实改写。）*`
              : `### 一个真实团队的故事\n\n一个四人团队花了两周做一个没人要求的功能。只要和用户聊上 20 分钟，就能省下这两周。这正是“${lesson.title}”要讲的事。\n\n*（演示文本：配置 AI 密钥后即可获得针对这一课的故事。）*`
          : variant === 'simpler'
            ? `### ${lesson.title}, in plain words\n\nThink of it like planning a group dinner: before anyone cooks, you ask who is coming, what they can eat and when they will arrive. Software teams do the same thing before they build.\n\n*(Demo text: add an AI key to get a real rewrite of this lesson.)*`
            : variant === 'technical'
              ? `### ${lesson.title}, for engineers\n\nIn practice this shows up in code review, CI pipelines and ticket refinement. A common pitfall is treating it as paperwork instead of a feedback loop.\n\n*(Demo text: add an AI key to get a real rewrite.)*`
              : `### A story from a real team\n\nA four-person team spent two weeks building a feature nobody asked for. One 20-minute conversation with a user would have saved them. That is what "${lesson.title}" is about.\n\n*(Demo text: add an AI key for a story tailored to this lesson.)*`,
    },
  );
  if (!mocked && locale === 'en') {
    await db.insert(lessonAdaptations).values({ lessonId, variant, content: text }).onConflictDoNothing();
  }
  return { content: text, mocked };
}
