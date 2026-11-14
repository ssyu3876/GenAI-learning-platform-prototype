'use server';

// Studio mutations. Every action: requireUser(staff) → zod → canEditCourse → write → revalidate.
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { count, eq } from 'drizzle-orm';
import { z } from 'zod';
import { generateJson, generateText } from '@/core/ai/client';
import { requireUser } from '@/core/auth/session';
import {
  COURSE_COLORS,
  generateCourseDraft,
  saveCourseDraft,
  uniqueCourseCode,
  uniqueSlug,
  type CourseDraft,
} from '@/core/content/draft';
import { canViewCourse, getCourseById, getCourseOutline } from '@/core/content/queries';
import { getDb } from '@/core/db/client';
import {
  activities,
  classCourses,
  courses,
  lessons,
  type CourseStatus,
  type CourseVisibility,
  type UserRole,
} from '@/core/db/schema';
import { newId } from '@/core/ids';
import type { ActionResult } from '@/core/types';
import { fmt, getT } from '@/i18n';
import type { Translations } from '@/i18n';
import { outputLanguage } from '@/i18n/ai';
import { localizeContent } from '@/i18n/content';
import { ACTIVITY_TYPES, activitySpecs, getActivityType } from '@/registry/activities';
import {
  activityOrder,
  lessonOrder,
  loadEditableActivity,
  loadEditableCourse,
  loadEditableLesson,
  renumberActivities,
  renumberLessons,
  touchCourse,
} from './access';
import { formatIssues, moveItem, parseTags } from './ordering';
import {
  buildActivitySystemPrompt,
  buildActivityUserPrompt,
  buildRewritePrompt,
  REWRITE_SYSTEM_PROMPT,
  stripOuterFence,
} from './prompts';

const STAFF: UserRole[] = ['instructor', 'admin'];
const MAX_LESSONS = 20;
const MAX_ACTIVITIES_PER_LESSON = 10;

/** Dictionary keys for the activity type names shown inside action messages. */
const ACTIVITY_LABEL_KEY: Record<string, keyof Translations['activities']['types']> = {
  slides: 'slides',
  sequence: 'sequence',
  sort: 'sort',
  quiz: 'quiz',
  roleplay: 'roleplay',
  coding: 'coding',
  codingExercise: 'codingExercise',
  reading: 'reading',
};

function activityLabel(t: Translations, type: string, fallback: string): string {
  const key = ACTIVITY_LABEL_KEY[type];
  return key ? t.activities.types[key] : fallback;
}

function notAllowed(t: Translations): ActionResult {
  return { ok: false, error: t.studio.actions.notAllowed };
}

/** Optional text field: trims, and treats an empty string as "not given". */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v ? v : undefined));

const levelSchema = z.enum(['beginner', 'intermediate', 'advanced']);
const audienceSchema = z.enum(['everyone', 'non_cs', 'cs']);

function firstError(error: z.ZodError, fallback: string): string {
  return error.issues[0]?.message ?? fallback;
}

function revalidateCourse(course: { id: string; slug: string }) {
  revalidatePath('/studio');
  revalidatePath(`/studio/${course.id}`, 'layout');
  revalidatePath(`/courses/${course.slug}`, 'layout');
}

// ---------------------------------------------------------------------------
// Create courses
// ---------------------------------------------------------------------------

const generateSchema = (t: Translations) =>
  z.object({
    topic: z.string().trim().min(3, t.studio.actions.topicTooShort).max(200),
    audienceNote: optionalText(300),
    level: levelSchema.catch('beginner'),
    lessonCount: z.coerce.number().int().min(1).max(6).catch(3),
    materials: optionalText(20000),
    requirements: optionalText(1000),
    types: z.array(z.string()).default([]),
  });

export async function generateCourse(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(STAFF);
  const { locale, t } = await getT();
  const parsed = generateSchema(t).safeParse({
    ...Object.fromEntries(formData),
    types: formData.getAll('types'),
  });
  if (!parsed.success) return { ok: false, error: firstError(parsed.error, t.studio.actions.checkForm) };
  const known = parsed.data.types.filter((type) => getActivityType(type));
  if (ACTIVITY_TYPES.length > 0 && known.length === 0) {
    return { ok: false, error: t.studio.actions.pickAtLeastOneType };
  }

  const { draft, mocked } = await generateCourseDraft({
    topic: parsed.data.topic,
    audienceNote: parsed.data.audienceNote,
    level: parsed.data.level,
    lessonCount: parsed.data.lessonCount,
    materials: parsed.data.materials,
    requirements: parsed.data.requirements,
    specs: activitySpecs(known),
    feature: 'studio.generate_course',
    userId: user.id,
    locale,
  });
  if (mocked) {
    // Never persist demo content as if it were the teacher's course. A failed model call
    // must be visible and retryable; the blank-course path remains available.
    return { ok: false, error: t.studio.actions.aiGenerationFailed };
  }
  const saved = await saveCourseDraft(draft, {
    ownerId: user.id,
    source: 'ai',
    status: 'draft',
    visibility: 'private',
  });
  revalidatePath('/studio');
  redirect(`/studio/${saved.id}`);
}

const blankSchema = (t: Translations) =>
  z.object({
    title: z.string().trim().min(3, t.studio.actions.courseTitleMin).max(100),
    subject: optionalText(60),
    level: levelSchema.catch('beginner'),
    audience: audienceSchema.catch('everyone'),
  });

export async function createBlankCourse(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(STAFF);
  const { locale, t } = await getT();
  const parsed = blankSchema(t).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error, t.studio.actions.courseTitleRequired) };
  const lessonTitle = locale === 'zh' ? '第 1 课' : 'Lesson 1';
  const draft: CourseDraft = {
    title: parsed.data.title,
    summary: '',
    subject: parsed.data.subject ?? 'General',
    level: parsed.data.level,
    audience: parsed.data.audience,
    tags: [],
    emoji: '🌱',
    color: 'mint',
    lessons: [
      {
        title: lessonTitle,
        content:
          locale === 'zh'
            ? '## 第 1 课\n\n在这里写下你的课程内容。支持 Markdown：**加粗**、列表、表格和代码。'
            : '## Lesson 1\n\nWrite your lesson here. Markdown works: **bold**, lists, tables and code.',
        estimatedMinutes: 10,
        activities: [],
      },
    ],
  };
  const saved = await saveCourseDraft(draft, {
    ownerId: user.id,
    source: 'manual',
    status: 'draft',
    visibility: 'private',
  });
  revalidatePath('/studio');
  redirect(`/studio/${saved.id}`);
}

// ---------------------------------------------------------------------------
// Course details, publishing, duplicating
// ---------------------------------------------------------------------------

const metaSchema = (t: Translations) =>
  z.object({
    courseId: z.string().min(1),
    title: z
      .string()
      .trim()
      .min(3, t.studio.actions.courseTitleMin)
      .max(100, t.studio.actions.courseTitleTooLong),
    summary: z.string().trim().max(400, t.studio.actions.summaryTooLong).default(''),
    subject: z.string().trim().max(60, t.studio.actions.subjectTooLong).default(''),
    level: levelSchema,
    audience: audienceSchema,
    tags: z.string().max(400).default(''),
    emoji: z
      .string()
      .trim()
      .min(1, t.studio.actions.pickEmoji)
      .max(16, t.studio.actions.singleEmoji),
    color: z.enum(COURSE_COLORS),
  });

export async function updateCourseMeta(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(STAFF);
  const { locale, t } = await getT();
  const parsed = metaSchema(t).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error, t.studio.actions.checkCourseDetails) };
  const course = await loadEditableCourse(user, parsed.data.courseId);
  if (!course) return notAllowed(t);
  const { courseId: _id, tags, subject, ...fields } = parsed.data;
  // In Chinese mode the form shows translated text. If a field was not edited, keep the
  // original English value so switching back to English still shows the author's text.
  const unchanged = (submitted: string, original: string) =>
    locale === 'zh' && submitted === localizeContent(original, locale) ? original : submitted;
  const parsedTags = parseTags(tags);
  const localizedTags = localizeContent(course.tags, locale);
  const nextTags = JSON.stringify(parsedTags) === JSON.stringify(localizedTags) ? course.tags : parsedTags;
  const db = await getDb();
  await db
    .update(courses)
    .set({
      ...fields,
      title: unchanged(fields.title, course.title),
      summary: unchanged(fields.summary.replace(/\r\n/g, '\n'), course.summary),
      subject: subject ? unchanged(subject, course.subject) : 'General',
      tags: nextTags,
      updatedAt: new Date(),
    })
    .where(eq(courses.id, course.id));
  revalidateCourse(course);
  return { ok: true, message: t.studio.actions.courseMetaSaved };
}

const statusSchema = z.object({
  courseId: z.string().min(1),
  intent: z.enum(['publish_class', 'submit_public', 'unpublish', 'archive']),
});

const STATUS_CHANGES = (
  t: Translations,
): Record<
  z.infer<typeof statusSchema>['intent'],
  { status: CourseStatus; visibility?: CourseVisibility; message: string; clearClassAssignments?: boolean }
> => ({
  publish_class: {
    status: 'published',
    visibility: 'class',
    message: t.studio.actions.publishClassMessage,
  },
  submit_public: {
    status: 'pending_review',
    visibility: 'public',
    message: t.studio.actions.submitPublicMessage,
  },
  unpublish: {
    status: 'draft',
    visibility: 'private',
    message: t.studio.actions.unpublishMessage,
    // Taking a course offline must also remove it from every class. Keeping the
    // class_courses rows would make it reappear later and leave the class count stale.
    clearClassAssignments: true,
  },
  archive: {
    status: 'archived',
    visibility: 'private',
    message: t.studio.actions.archiveMessage,
    clearClassAssignments: true,
  },
});

export async function setCourseStatus(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(STAFF);
  const { t } = await getT();
  const parsed = statusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: t.studio.actions.generic };
  const course = await loadEditableCourse(user, parsed.data.courseId);
  if (!course) return notAllowed(t);
  const db = await getDb();
  const change = STATUS_CHANGES(t)[parsed.data.intent];
  if (change.status === 'published' || change.status === 'pending_review') {
    const [row] = await db.select({ n: count() }).from(lessons).where(eq(lessons.courseId, course.id));
    if (!row?.n) return { ok: false, error: t.studio.actions.addLessonFirst };
  }
  await db.transaction(async (tx) => {
    await tx
      .update(courses)
      .set({
        status: change.status,
        ...(change.visibility ? { visibility: change.visibility } : {}),
        updatedAt: new Date(),
      })
      .where(eq(courses.id, course.id));
    if (change.clearClassAssignments) {
      await tx.delete(classCourses).where(eq(classCourses.courseId, course.id));
    }
  });
  revalidateCourse(course);
  revalidatePath('/courses');
  revalidatePath('/classes', 'layout');
  return { ok: true, message: change.message };
}

const courseIdSchema = z.object({ courseId: z.string().min(1) });

/** Copies a published course (lessons + activities) into a private draft owned by the user. */
export async function duplicateCourse(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(STAFF);
  const { t } = await getT();
  const parsed = courseIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: t.studio.actions.pickCourseToDuplicate };
  const source = await getCourseById(parsed.data.courseId);
  if (!source || source.status !== 'published' || !(await canViewCourse(user, source))) {
    return { ok: false, error: t.studio.actions.onlyPublishedCanDuplicate };
  }
  const outline = await getCourseOutline(source.id);
  if (!outline) return { ok: false, error: t.studio.actions.courseGone };

  const db = await getDb();
  const id = newId('course');
  const title = `${source.title} (my copy)`.slice(0, 100);
  await db.insert(courses).values({
    id,
    slug: await uniqueSlug(title),
    code: await uniqueCourseCode(),
    title,
    summary: source.summary,
    subject: source.subject,
    level: source.level,
    audience: source.audience,
    tags: source.tags,
    color: source.color,
    emoji: source.emoji,
    estimatedMinutes: source.estimatedMinutes,
    status: 'draft',
    visibility: 'private',
    source: 'manual',
    ownerId: user.id,
    forkedFromId: source.id,
  });
  const copies = outline.lessons.map((l) => ({ original: l, newId: newId('lesson') }));
  if (copies.length) {
    await db.insert(lessons).values(
      copies.map(({ original, newId: lessonId }) => ({
        id: lessonId,
        courseId: id,
        position: original.position,
        title: original.title,
        content: original.content,
        estimatedMinutes: original.estimatedMinutes,
      })),
    );
  }
  const activityRows = copies.flatMap(({ original, newId: lessonId }) =>
    original.activities.map((a) => ({
      id: newId('activity'),
      lessonId,
      position: a.position,
      type: a.type,
      title: a.title,
      config: a.config,
      xpReward: a.xpReward,
    })),
  );
  if (activityRows.length) await db.insert(activities).values(activityRows);
  revalidatePath('/studio');
  redirect(`/studio/${id}`);
}

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------

export async function addLesson(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(STAFF);
  const { locale, t } = await getT();
  const parsed = courseIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: t.studio.actions.generic };
  const course = await loadEditableCourse(user, parsed.data.courseId);
  if (!course) return notAllowed(t);
  const existing = await lessonOrder(course.id);
  if (existing.length >= MAX_LESSONS) {
    return { ok: false, error: fmt(t.studio.actions.maxLessons, { max: MAX_LESSONS }) };
  }
  const db = await getDb();
  const lessonId = newId('lesson');
  const title = locale === 'zh' ? `第 ${existing.length + 1} 课` : `Lesson ${existing.length + 1}`;
  await db.insert(lessons).values({
    id: lessonId,
    courseId: course.id,
    position: existing.length,
    title,
    content: locale === 'zh' ? `## ${title}\n\n在这里写下你的课程内容。` : `## ${title}\n\nWrite your lesson here.`,
    estimatedMinutes: 10,
  });
  await touchCourse(course.id);
  revalidateCourse(course);
  redirect(`/studio/${course.id}/lessons/${lessonId}`);
}

const lessonIdSchema = z.object({ lessonId: z.string().min(1) });
const moveSchema = z.object({ direction: z.enum(['up', 'down']) });

export async function deleteLesson(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(STAFF);
  const { t } = await getT();
  const parsed = lessonIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: t.studio.actions.generic };
  const found = await loadEditableLesson(user, parsed.data.lessonId);
  if (!found) return notAllowed(t);
  const { lesson, course } = found;
  if ((await lessonOrder(course.id)).length <= 1) {
    return { ok: false, error: t.studio.actions.onlyLesson };
  }
  const db = await getDb();
  await db.delete(lessons).where(eq(lessons.id, lesson.id));
  await renumberLessons(course.id);
  await touchCourse(course.id);
  revalidateCourse(course);
  return { ok: true, message: t.studio.actions.lessonDeleted };
}

export async function moveLesson(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(STAFF);
  const { t } = await getT();
  const parsed = lessonIdSchema.extend(moveSchema.shape).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: t.studio.actions.generic };
  const found = await loadEditableLesson(user, parsed.data.lessonId);
  if (!found) return notAllowed(t);
  const rows = await lessonOrder(found.course.id);
  const ordered = moveItem(
    rows.map((r) => r.id),
    found.lesson.id,
    parsed.data.direction,
  );
  await renumberLessons(found.course.id, ordered);
  await touchCourse(found.course.id);
  revalidateCourse(found.course);
  return { ok: true };
}

const lessonSchema = (t: Translations) =>
  z.object({
    lessonId: z.string().min(1),
    title: z
      .string()
      .trim()
      .min(1, t.studio.actions.lessonTitleRequired)
      .max(120, t.studio.actions.lessonTitleTooLong),
    estimatedMinutes: z.coerce
      .number({ message: t.studio.actions.minutesNumber })
      .int(t.studio.actions.wholeMinutes)
      .min(1, t.studio.actions.minutesMin)
      .max(120, t.studio.actions.minutesMax),
    content: z.string().max(40000, t.studio.actions.contentTooLong),
  });

export async function updateLesson(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(STAFF);
  const { locale, t } = await getT();
  const parsed = lessonSchema(t).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error, t.studio.actions.checkLessonFields) };
  const found = await loadEditableLesson(user, parsed.data.lessonId);
  if (!found) return notAllowed(t);
  const unchanged = (submitted: string, original: string) =>
    locale === 'zh' && submitted === localizeContent(original, locale) ? original : submitted;
  // Browsers submit textarea line breaks as CRLF; the stored Markdown uses LF.
  const submittedContent = parsed.data.content.replace(/\r\n/g, '\n');
  const db = await getDb();
  await db
    .update(lessons)
    .set({
      title: unchanged(parsed.data.title, found.lesson.title),
      estimatedMinutes: parsed.data.estimatedMinutes,
      content: unchanged(submittedContent, found.lesson.content),
      updatedAt: new Date(),
    })
    .where(eq(lessons.id, found.lesson.id));
  await touchCourse(found.course.id);
  revalidateCourse(found.course);
  return { ok: true, message: t.studio.actions.lessonSaved };
}

const rewriteSchema = (t: Translations) =>
  z.object({
    lessonId: z.string().min(1),
    instruction: z.string().trim().min(3, t.studio.actions.rewriteInstructionMin).max(500),
    content: z.string().trim().min(1, t.studio.actions.rewriteContentEmpty).max(40000),
  });

/** Returns rewritten Markdown without saving it: the instructor accepts or discards it. */
export async function rewriteLesson(
  _prev: ActionResult<{ content: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ content: string }>> {
  const user = await requireUser(STAFF);
  const { locale, t } = await getT();
  const parsed = rewriteSchema(t).safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { ok: false, error: firstError(parsed.error, t.studio.actions.rewriteInstructionFallback) };
  }
  const found = await loadEditableLesson(user, parsed.data.lessonId);
  if (!found) return { ok: false, error: t.studio.actions.notAllowed };
  const { text, mocked } = await generateText(
    [
      { role: 'system', content: `${REWRITE_SYSTEM_PROMPT}\n${outputLanguage(locale)}` },
      {
        role: 'user',
        content: buildRewritePrompt({
          lessonTitle: found.lesson.title,
          content: parsed.data.content,
          instruction: parsed.data.instruction,
        }),
      },
    ],
    {
      feature: 'studio.rewrite_lesson',
      userId: user.id,
      tier: 'fast',
      maxTokens: 3000,
      temperature: 0.5,
      mock: () => parsed.data.content,
    },
  );
  return {
    ok: true,
    data: { content: mocked ? text : stripOuterFence(text) },
    message: mocked ? t.studio.actions.rewriteDemo : t.studio.actions.rewriteResult,
  };
}

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

const addActivitySchema = z.object({
  lessonId: z.string().min(1),
  type: z.string().min(1),
  mode: z.enum(['blank', 'ai']).catch('blank'),
  note: optionalText(500),
});

/** Adds an activity of any registered type: blank (its defaultConfig) or written by AI. */
export async function addActivity(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(STAFF);
  const { locale, t } = await getT();
  const parsed = addActivitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: t.studio.actions.pickActivityType };
  const def = getActivityType(parsed.data.type);
  if (!def) return { ok: false, error: t.studio.actions.activityTypeMissing };
  const found = await loadEditableLesson(user, parsed.data.lessonId);
  if (!found) return notAllowed(t);
  const { lesson, course } = found;
  const existing = await activityOrder(lesson.id);
  if (existing.length >= MAX_ACTIVITIES_PER_LESSON) {
    return { ok: false, error: fmt(t.studio.actions.maxActivities, { max: MAX_ACTIVITIES_PER_LESSON }) };
  }

  let config: unknown = locale === 'zh' ? localizeContent(def.defaultConfig, locale) : def.defaultConfig;
  let mocked = false;
  if (parsed.data.mode === 'ai') {
    const result = await generateJson(
      [
        { role: 'system', content: buildActivitySystemPrompt({ ...def, locale }) },
        {
          role: 'user',
          content: buildActivityUserPrompt({
            courseTitle: course.title,
            lessonTitle: lesson.title,
            content: lesson.content,
            note: parsed.data.note,
          }),
        },
      ],
      def.schema,
      {
        feature: 'studio.generate_activity',
        userId: user.id,
        tier: 'fast',
        maxTokens: 2500,
        mock: () => def.mock({ topic: course.title, lessonTitle: lesson.title, locale }),
      },
    );
    config = result.data;
    mocked = result.mocked;
  }

  const db = await getDb();
  await db.insert(activities).values({
    id: newId('activity'),
    lessonId: lesson.id,
    position: existing.length,
    type: def.type,
    title: (parsed.data.mode === 'ai' ? `${activityLabel(t, def.type, def.label)}: ${lesson.title}` : activityLabel(t, def.type, def.label)).slice(0, 120),
    config,
    xpReward: 20,
  });
  await touchCourse(course.id);
  revalidateCourse(course);
  const label = activityLabel(t, def.type, def.label);
  // English messages use the type name mid-sentence, so keep it lowercase there.
  const sentenceLabel = locale === 'en' ? label.toLowerCase() : label;
  if (parsed.data.mode === 'blank') {
    return { ok: true, message: fmt(t.studio.actions.activityAdded, { label }) };
  }
  return {
    ok: true,
    message: mocked
      ? fmt(t.studio.actions.activityAddedDemo, { label: sentenceLabel })
      : fmt(t.studio.actions.activityAddedAi, { label: sentenceLabel }),
  };
}

const updateActivitySchema = (t: Translations) =>
  z.object({
    activityId: z.string().min(1),
    title: z
      .string()
      .trim()
      .min(1, t.studio.actions.activityTitleRequired)
      .max(120, t.studio.actions.lessonTitleTooLong),
    xpReward: z.coerce
      .number({ message: t.studio.actions.xpNumber })
      .int(t.studio.actions.wholeXp)
      .min(5, t.studio.actions.xpRange)
      .max(100, t.studio.actions.xpRange),
    config: z.string().max(60000, t.studio.actions.setupTooLarge),
  });

export async function updateActivity(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(STAFF);
  const { locale, t } = await getT();
  const parsed = updateActivitySchema(t).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: firstError(parsed.error, t.studio.actions.checkActivityFields) };
  const found = await loadEditableActivity(user, parsed.data.activityId);
  if (!found) return notAllowed(t);
  const def = getActivityType(found.activity.type);
  if (!def) {
    return {
      ok: false,
      error: fmt(t.studio.actions.activityTypeNotInstalledSetup, { type: found.activity.type }),
    };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(parsed.data.config);
  } catch (err) {
    const detail = err instanceof Error ? err.message : t.studio.actions.jsonDetailFallback;
    return { ok: false, error: fmt(t.studio.actions.invalidJsonDetail, { detail }) };
  }
  const config = def.schema.safeParse(raw);
  if (!config.success) {
    return {
      ok: false,
      error: fmt(t.studio.actions.setupMismatch, {
        label: activityLabel(t, def.type, def.label).toLowerCase(),
        issues: formatIssues(config.error.issues),
      }),
    };
  }
  // Keep the authored English when the Chinese form text was only displayed, not edited.
  const unchangedTitle =
    locale === 'zh' && parsed.data.title === localizeContent(found.activity.title, locale)
      ? found.activity.title
      : parsed.data.title;
  const unchangedConfig =
    locale === 'zh' && JSON.stringify(raw) === JSON.stringify(localizeContent(found.activity.config, locale));
  const db = await getDb();
  await db
    .update(activities)
    .set({
      title: unchangedTitle,
      xpReward: parsed.data.xpReward,
      config: unchangedConfig ? found.activity.config : config.data,
      updatedAt: new Date(),
    })
    .where(eq(activities.id, found.activity.id));
  await touchCourse(found.course.id);
  revalidateCourse(found.course);
  return { ok: true, message: t.studio.actions.activitySaved };
}

const activityIdSchema = z.object({ activityId: z.string().min(1) });

export async function deleteActivity(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(STAFF);
  const { t } = await getT();
  const parsed = activityIdSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: t.studio.actions.generic };
  const found = await loadEditableActivity(user, parsed.data.activityId);
  if (!found) return notAllowed(t);
  const db = await getDb();
  await db.delete(activities).where(eq(activities.id, found.activity.id));
  await renumberActivities(found.lesson.id);
  await touchCourse(found.course.id);
  revalidateCourse(found.course);
  return { ok: true, message: t.studio.actions.activityDeleted };
}

export async function moveActivity(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(STAFF);
  const { t } = await getT();
  const parsed = activityIdSchema.extend(moveSchema.shape).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: t.studio.actions.generic };
  const found = await loadEditableActivity(user, parsed.data.activityId);
  if (!found) return notAllowed(t);
  const rows = await activityOrder(found.lesson.id);
  const ordered = moveItem(
    rows.map((r) => r.id),
    found.activity.id,
    parsed.data.direction,
  );
  await renumberActivities(found.lesson.id, ordered);
  await touchCourse(found.course.id);
  revalidateCourse(found.course);
  return { ok: true };
}
