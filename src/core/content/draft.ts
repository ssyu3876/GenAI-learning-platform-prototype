// A "course draft" is the JSON shape AI (or a human) produces before it is saved.
// Shared by the studio (instructors), self-learn (learners) and the seed script.
import { and, eq, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { generateJson } from '@/core/ai/client';
import { getDb } from '@/core/db/client';
import {
  activities,
  courses,
  lessons,
  type CourseSource,
  type CourseStatus,
  type CourseVisibility,
} from '@/core/db/schema';
import { newId, randomString, slugify } from '@/core/ids';
import type { Locale } from '@/i18n/config';
import { byLocale, outputLanguage } from '@/i18n/ai';

export const COURSE_COLORS = ['coral', 'mint', 'butter', 'sky', 'lilac'] as const;
export type CourseColor = (typeof COURSE_COLORS)[number];

/**
 * What an activity type tells the generator about itself. Provided by the activities
 * registry and passed in, so core does not depend on any activity implementation.
 */
export interface ActivitySpec {
  type: string;
  label: string;
  /** Explains the `config` JSON shape to the model, with a short example */
  promptGuide: string;
  schema: z.ZodType<unknown>;
  mock: (ctx: { topic: string; lessonTitle: string; locale: Locale }) => unknown;
}

export const activityDraftSchema = z.object({
  type: z.string(),
  title: z.string().min(1).max(120),
  config: z.unknown(),
  xpReward: z.number().int().min(5).max(100).optional(),
});

export const lessonDraftSchema = z.object({
  title: z.string().min(1).max(120),
  content: z.string().min(1),
  estimatedMinutes: z.number().int().min(1).max(60).optional(),
  activities: z.array(activityDraftSchema).max(4).default([]),
});

export const courseDraftSchema = z.object({
  title: z.string().min(3).max(100),
  summary: z.string().max(400).default(''),
  subject: z.string().max(60).default('General'),
  level: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  audience: z.enum(['everyone', 'non_cs', 'cs']).default('everyone'),
  tags: z.array(z.string().max(30)).max(6).default([]),
  emoji: z.string().max(8).default('🌱'),
  color: z.enum(COURSE_COLORS).catch('mint'),
  // Book-like courses can run to twenty chapters; the AI generator still asks for 6 or fewer.
  lessons: z.array(lessonDraftSchema).min(1).max(20),
});

export type CourseDraft = z.infer<typeof courseDraftSchema>;
export type ActivityDraft = z.infer<typeof activityDraftSchema>;

export async function uniqueSlug(title: string): Promise<string> {
  const db = await getDb();
  const base = slugify(title);
  let slug = base;
  for (let i = 0; i < 5; i++) {
    const [hit] = await db.select({ id: courses.id }).from(courses).where(eq(courses.slug, slug)).limit(1);
    if (!hit) return slug;
    slug = `${base}-${randomString(4)}`;
  }
  return `${base}-${randomString(8)}`;
}

/** A four-digit code that is easy to read and search in Studio. */
export async function uniqueCourseCode(): Promise<string> {
  const db = await getDb();
  for (let i = 0; i < 50; i++) {
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const [hit] = await db.select({ id: courses.id }).from(courses).where(eq(courses.code, code)).limit(1);
    if (!hit) return code;
  }
  throw new Error('Could not allocate a unique course code.');
}

/** Backfill codes for courses created before the code column existed. */
export async function ensureCourseCodes(): Promise<void> {
  const db = await getDb();
  const rows = await db.select({ id: courses.id }).from(courses).where(isNull(courses.code));
  for (const row of rows) {
    try {
      const code = await uniqueCourseCode();
      await db
        .update(courses)
        .set({ code })
        .where(and(eq(courses.id, row.id), isNull(courses.code)));
    } catch (error) {
      console.warn('[courses] could not backfill course code', row.id, error);
    }
  }
}

export async function saveCourseDraft(
  draft: CourseDraft,
  opts: {
    ownerId: string | null;
    source: CourseSource;
    status: CourseStatus;
    visibility: CourseVisibility;
    slug?: string;
    forkedFromId?: string;
  },
): Promise<{ id: string; slug: string }> {
  const db = await getDb();
  const id = newId('course');
  const slug = opts.slug ?? (await uniqueSlug(draft.title));
  const code = await uniqueCourseCode();
  const minutes = draft.lessons.reduce((m, l) => m + (l.estimatedMinutes ?? 10), 0);
  await db.insert(courses).values({
    id,
    slug,
    code,
    title: draft.title,
    summary: draft.summary,
    subject: draft.subject,
    level: draft.level,
    audience: draft.audience,
    tags: draft.tags,
    emoji: draft.emoji,
    color: draft.color,
    estimatedMinutes: minutes,
    status: opts.status,
    visibility: opts.visibility,
    source: opts.source,
    ownerId: opts.ownerId,
    forkedFromId: opts.forkedFromId ?? null,
  });
  for (const [li, lesson] of draft.lessons.entries()) {
    const lessonId = newId('lesson');
    await db.insert(lessons).values({
      id: lessonId,
      courseId: id,
      position: li,
      title: lesson.title,
      content: lesson.content,
      estimatedMinutes: lesson.estimatedMinutes ?? 10,
    });
    for (const [ai, act] of lesson.activities.entries()) {
      await db.insert(activities).values({
        id: newId('activity'),
        lessonId,
        position: ai,
        type: act.type,
        title: act.title,
        config: act.config,
        xpReward: act.xpReward ?? 20,
      });
    }
  }
  return { id, slug };
}

/** Keeps only activities whose type exists and whose config passes that type's schema. */
export function sanitizeDraft(draft: CourseDraft, specs: ActivitySpec[]): CourseDraft {
  const byType = new Map(specs.map((s) => [s.type, s]));
  return {
    ...draft,
    lessons: draft.lessons.map((l) => ({
      ...l,
      activities: l.activities.flatMap((a) => {
        const spec = byType.get(a.type);
        if (!spec) return [];
        const parsed = spec.schema.safeParse(a.config);
        return parsed.success ? [{ ...a, config: parsed.data }] : [];
      }),
    })),
  };
}

export interface GenerateCourseInput {
  topic: string;
  /** Who the learners are, in plain words */
  audienceNote?: string;
  level?: CourseDraft['level'];
  lessonCount?: number;
  /** Optional teaching material pasted by an instructor */
  materials?: string;
  /** Extra instructions, e.g. "include a role-play with a client" */
  requirements?: string;
  specs: ActivitySpec[];
  userId: string;
  feature: string;
  /** UI language for model output and the offline mock. Defaults to English. */
  locale?: Locale;
}

function mockDraft(input: GenerateCourseInput): CourseDraft {
  const locale = input.locale ?? 'en';
  const n = Math.min(Math.max(input.lessonCount ?? 3, 1), 6);
  const topic = input.topic.trim() || byLocale(locale, 'Something new', '一些新东西');
  const pick = (type: string) => input.specs.find((s) => s.type === type) ?? input.specs[0];
  const titles = byLocale(locale, ['The big picture', 'Key ideas, one by one', 'Putting it into practice', 'Common mistakes', 'Going further', 'Wrap-up'], [
    '先看全局',
    '逐个理解关键概念',
    '动手实践',
    '常见错误',
    '继续深入',
    '收个尾',
  ]);
  return {
    title: byLocale(locale, `${topic}: a friendly start`, `${topic}：轻松入门`),
    summary: byLocale(
      locale,
      `A short, hands-on introduction to ${topic}. (Offline demo content: add an AI_API_KEY to generate a real course.)`,
      `一门关于${topic}的简短动手入门课。（离线演示内容：配置 AI_API_KEY 后即可生成真实课程。）`,
    ),
    subject: topic.split(' ').slice(0, 3).join(' '),
    level: input.level ?? 'beginner',
    audience: 'everyone',
    tags: [topic.toLowerCase().slice(0, 30)],
    emoji: '🌱',
    color: 'mint',
    lessons: Array.from({ length: n }, (_, i) => {
      const lessonTitle = titles[i] ?? byLocale(locale, `Part ${i + 1}`, `第 ${i + 1} 部分`);
      const spec = pick(i % 2 === 0 ? 'quiz' : 'sort');
      return {
        title: lessonTitle,
        estimatedMinutes: 8,
        content: byLocale(
          locale,
          `## ${lessonTitle}\n\nThis lesson is about **${topic}**.\n\n- What it is and why people care\n- One concrete example you can picture\n- A question to think about before the activity\n\n> Tip from Pip: try explaining today's idea to a friend in one sentence.`,
          `## ${lessonTitle}\n\n这一课讲的是**${topic}**。\n\n- 它是什么，为什么值得关心\n- 一个你能想象出来的具体例子\n- 做活动前可以先想一想的问题\n\n> Pip 的小建议：试着用一句话把今天的内容讲给朋友听。`,
        ),
        activities: spec
          ? [
              {
                type: spec.type,
                title: byLocale(locale, `Check-in: ${lessonTitle}`, `小测：${lessonTitle}`),
                config: spec.mock({ topic, lessonTitle, locale }),
                xpReward: 20,
              },
            ]
          : [],
      };
    }),
  };
}

/** Ask the model for a full course draft. Always returns a valid draft (mock on failure). */
export async function generateCourseDraft(
  input: GenerateCourseInput,
): Promise<{ draft: CourseDraft; mocked: boolean }> {
  const lessonCount = Math.min(Math.max(input.lessonCount ?? 4, 1), 6);
  const typeGuide = input.specs
    .map((s) => `- "${s.type}" (${s.label}): ${s.promptGuide}`)
    .join('\n');
  const system = [
    'You design short, engaging mini-courses for a learning platform.',
    'Write like a warm, clear human teacher: concrete examples, short paragraphs, no hype words',
    '("unlock", "empower", "journey", "dive in"), no emoji spam. Lesson content is Markdown',
    '(headings, lists, a small example or table where it helps), 150-350 words per lesson.',
    outputLanguage(input.locale ?? 'en'),
    'Reply with ONE JSON object only, matching exactly:',
    '{ "title": string, "summary": string (1-2 sentences), "subject": string, "level": "beginner"|"intermediate"|"advanced",',
    '  "audience": "everyone"|"non_cs"|"cs", "tags": string[] (max 5), "emoji": one emoji,',
    '  "color": "coral"|"mint"|"butter"|"sky"|"lilac",',
    '  "lessons": [ { "title": string, "content": markdown string, "estimatedMinutes": number,',
    '                 "activities": [ { "type": string, "title": string, "config": object, "xpReward": number } ] } ] }',
    'Each lesson has 1-2 activities. Allowed activity types and their config shapes:',
    typeGuide,
  ].join('\n');
  const user = [
    `Topic: ${input.topic}`,
    `Number of lessons: ${lessonCount}`,
    `Level: ${input.level ?? 'beginner'}`,
    input.audienceNote ? `Learners: ${input.audienceNote}` : '',
    input.requirements ? `Instructor requirements: ${input.requirements}` : '',
    input.materials ? `Teaching material to base the course on:\n"""\n${input.materials.slice(0, 6000)}\n"""` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const { data, mocked } = await generateJson(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    courseDraftSchema,
    {
      feature: input.feature,
      userId: input.userId,
      tier: 'smart',
      // A full course JSON (lessons + activities) needs room for reasoning and the final
      // JSON. 6k was regularly exhausted by max-effort reasoning, producing empty output.
      maxTokens: 16000,
      temperature: 0.6,
      mock: () => mockDraft(input),
    },
  );
  return { draft: sanitizeDraft(data, input.specs), mocked };
}
