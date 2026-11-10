'use server';

// "Learn anything": a learner types a topic and gets a private mini-course made for them.
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireUser } from '@/core/auth/session';
import { generateCourseDraft, saveCourseDraft } from '@/core/content/draft';
import { EVENT_TYPES, recordEvent } from '@/core/events';
import { enrollInCourse } from '@/core/progress/service';
import type { ActionResult } from '@/core/types';
import { getT } from '@/i18n';
import { byLocale } from '@/i18n/ai';
import { ACTIVITY_TYPES, activitySpecs } from '@/registry/activities';
import { buildAudienceNote, lessonCountFromTopic, pickLearnerTypes } from './audience';
import { countCoursesGeneratedToday, DAILY_COURSE_LIMIT, getAudienceProfile } from './queries';

const schema = z.object({
  topic: z
    .string()
    .trim()
    .min(3, 'Tell Pip what you want to learn (at least 3 characters).')
    .max(200, 'Keep the topic under 200 characters.'),
  why: z
    .string()
    .trim()
    .max(300, 'Keep the reason under 300 characters.')
    .optional()
    .transform((v) => (v ? v : undefined)),
  level: z.enum(['beginner', 'intermediate', 'advanced']).catch('beginner'),
});

export async function generateLearnerCourse(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(['learner']);
  const { locale } = await getT();
  const parsed = schema.safeParse(Object.fromEntries(formData));
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
        `Pip has made ${DAILY_COURSE_LIMIT} courses for you today and needs a rest. Try again tomorrow, or finish one of your courses below.`,
        `Pip 今天已经为你做了 ${DAILY_COURSE_LIMIT} 门课程，需要休息一下。明天再来，或者先把下面已有的课程学完吧。`,
      ),
    };
  }

  const profile = await getAudienceProfile(user.id);
  const types = pickLearnerTypes(ACTIVITY_TYPES.map((d) => d.type));
  const { draft } = await generateCourseDraft({
    topic: parsed.data.topic,
    audienceNote: buildAudienceNote(profile, parsed.data.why),
    level: parsed.data.level,
    lessonCount: lessonCountFromTopic(parsed.data.topic),
    specs: activitySpecs(types),
    feature: 'self_learn.generate_course',
    userId: user.id,
    locale,
  });
  const saved = await saveCourseDraft(draft, {
    ownerId: user.id,
    source: 'learner_ai',
    status: 'published',
    visibility: 'private',
  });
  await enrollInCourse(user.id, saved.id);
  await recordEvent({
    userId: user.id,
    type: EVENT_TYPES.courseGenerated,
    courseId: saved.id,
    payload: { courseId: saved.id },
  });
  revalidatePath('/create');
  revalidatePath('/home');
  redirect(`/courses/${saved.slug}`);
}
