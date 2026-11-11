'use server';

import { z } from 'zod';
import { generateJson } from '@/core/ai/client';
import { requireUser } from '@/core/auth/session';
import { byLocale, outputLanguage } from '@/i18n/ai';
import { getT } from '@/i18n';
import { localizeContent } from '@/i18n/content';
import { loadActivity } from '../server';
import { mockFeedback } from './scoring';
import {
  roleplayConfigSchema,
  roleplayFeedbackSchema,
  roleplayMessageSchema,
  type RoleplayFeedback,
} from './schema';

const inputSchema = z.object({
  activityId: z.string(),
  messages: z.array(roleplayMessageSchema).min(1).max(30),
});

/** Scores a finished role-play against the activity's rubric. */
export async function scoreRoleplay(input: z.infer<typeof inputSchema>): Promise<RoleplayFeedback> {
  const user = await requireUser();
  const { locale } = await getT();
  const parsed = inputSchema.parse(input);
  const activity = await loadActivity(parsed.activityId, roleplayConfigSchema);
  if (!activity) throw new Error('Activity not found');
  const c = localizeContent(activity.config, locale);

  const learnerLabel = byLocale(locale, 'Learner', '学习者');
  const transcript = parsed.messages
    .map((m) => `${m.role === 'persona' ? c.persona : learnerLabel}: ${m.content}`)
    .join('\n');

  const { data } = await generateJson(
    [
      {
        role: 'system',
        content: [
          'You are an encouraging but honest coach assessing a learner after a practice role-play.',
          outputLanguage(locale),
          `Scenario: ${c.scenario}`,
          `Learner role: ${c.learnerRole}. Other side: ${c.persona}, ${c.personaRole}.`,
          `Learner goals: ${c.goals.join('; ')}`,
          `Rubric:\n${c.rubric.map((r) => `- ${r.criterion}: ${r.description}`).join('\n')}`,
          'Score each rubric criterion 0-100 based ONLY on what the learner actually said. Quote or paraphrase specific lines in comments.',
          'Reply with JSON only: { "overall": number 0-100, "criteria": [ { "criterion": string, "score": number, "comment": string (1-2 sentences) } ],',
          '"strengths": string[] (1-3), "improve": string[] (1-3, concrete), "tip": string (one thing to try next time, with an example sentence) }',
        ].join('\n'),
      },
      { role: 'user', content: `Transcript:\n${transcript}` },
    ],
    roleplayFeedbackSchema,
    {
      feature: 'activities.roleplay_score',
      userId: user.id,
      tier: 'smart',
      temperature: 0.3,
      maxTokens: 900,
      mock: () => mockFeedback(c, parsed.messages, locale),
    },
  );
  return { ...data, overall: Math.round(data.overall) };
}
