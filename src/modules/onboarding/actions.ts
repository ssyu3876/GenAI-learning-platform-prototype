'use server';

import { and, eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { generateText } from '@/core/ai/client';
import { requireUser } from '@/core/auth/session';
import { getDb } from '@/core/db/client';
import { courses, learnerProfiles } from '@/core/db/schema';
import { EVENT_TYPES, recordEvent } from '@/core/events';
import { getT } from '@/i18n';
import { byLocale, outputLanguage } from '@/i18n/ai';
import { localizeContent } from '@/i18n/content';
import { pickTrack, recommendCourses } from './recommend';

const answersSchema = z.object({
  background: z.enum(['non_cs', 'cs_student', 'cs_graduate', 'other']),
  codingLevel: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  goal: z.enum(['understand', 'career', 'build', 'ai_skills']),
  interests: z.array(z.string().max(30)).max(6),
  style: z.enum(['concepts', 'hands_on']),
});

export async function completeOnboarding(input: z.infer<typeof answersSchema>): Promise<void> {
  const user = await requireUser(['learner']);
  const { locale } = await getT();
  const answers = answersSchema.parse(input);
  const db = await getDb();

  const catalog = await db
    .select({ id: courses.id, title: courses.title, tags: courses.tags, level: courses.level, audience: courses.audience })
    .from(courses)
    .where(and(eq(courses.status, 'published'), eq(courses.visibility, 'public')));
  const recommended = recommendCourses(answers, catalog);
  const track = pickTrack(answers);
  const titles = recommended
    .map((id) => catalog.find((c) => c.id === id)?.title)
    .filter((title): title is string => Boolean(title))
    .map((title) => localizeContent(title, locale));

  const { text: welcomeNote } = await generateText(
    [
      {
        role: 'system',
        content: [
          'You are Pip, a friendly sprout mascot on a learning platform. Write 2 short sentences (max 45 words) welcoming the learner and saying why their first course fits them. Warm, specific, no hype words, no emoji.',
          outputLanguage(locale),
        ].join('\n'),
      },
      {
        role: 'user',
        content: `Name: ${user.name.split(' ')[0]}. Background: ${answers.background}. Coding: ${answers.codingLevel}/3. Goal: ${answers.goal}. Interests: ${answers.interests.join(', ') || 'none picked'}. Path: ${titles.join(' → ')}.`,
      },
    ],
    {
      feature: 'onboarding.welcome',
      userId: user.id,
      tier: 'fast',
      maxTokens: 120,
      mock: () =>
        byLocale(
          locale,
          `Nice to meet you, ${user.name.split(' ')[0]}! I put "${titles[0] ?? 'a starter course'}" first because it matches what you told me, and we will build up from there.`,
          `很高兴认识你，${user.name.split(' ')[0]}！我把“${titles[0] ?? '一门入门课程'}”放在第一位，因为它最符合你告诉我的情况，之后我们再一步步往上走。`,
        ),
    },
  );

  const values = {
    background: answers.background,
    codingLevel: answers.codingLevel,
    goal: answers.goal,
    interests: answers.interests,
    track,
    recommendedCourseIds: recommended,
    welcomeNote,
  };
  await db
    .insert(learnerProfiles)
    .values({ userId: user.id, ...values })
    .onConflictDoUpdate({ target: learnerProfiles.userId, set: { ...values, updatedAt: new Date() } });
  await recordEvent({ userId: user.id, type: EVENT_TYPES.onboardingCompleted, payload: { track } });
  redirect('/home');
}
