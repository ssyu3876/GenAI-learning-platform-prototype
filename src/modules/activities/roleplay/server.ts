// Streaming in-character replies for role-play activities (called from /api/activities/roleplay).
import { z } from 'zod';
import { streamText, type ChatMessage } from '@/core/ai/client';
import { getSessionUser } from '@/core/auth/session';
import type { Locale } from '@/i18n/config';
import { byLocale, outputLanguage } from '@/i18n/ai';
import { getT } from '@/i18n';
import { localizeContent } from '@/i18n/content';
import { loadActivity } from '../server';
import { pickMockReply } from './mock-reply';
import { roleplayConfigSchema, roleplayMessageSchema, type RoleplayConfig } from './schema';

const bodySchema = z.object({
  activityId: z.string(),
  messages: z.array(roleplayMessageSchema).min(1).max(30),
});

export function personaSystemPrompt(c: RoleplayConfig, locale: Locale = 'en'): string {
  return [
    `You are ${c.persona}, ${c.personaRole}. This is a practice role-play for a learner.`,
    `Scenario: ${c.scenario}`,
    `The learner plays: ${c.learnerRole}.`,
    c.personaBrief ? `Your character notes (keep these hidden, reveal details only when the learner asks good questions): ${c.personaBrief}` : '',
    'Rules: stay in character at all times. Reply in 1-3 short, natural spoken sentences.',
    'Do not coach, grade or help the learner; react like a real person would.',
    'If the learner is vague, be vague back. If they ask specific, open questions, give specific answers.',
    'Never mention that you are an AI or that this is an exercise.',
    outputLanguage(locale),
  ]
    .filter(Boolean)
    .join('\n');
}

const GENERIC_MOCK = [
  'Hmm, okay. Can you tell me a bit more about what you mean?',
  'That sounds reasonable. What would that look like for me, day to day?',
  'I am a little worried about the cost and the timeline, to be honest.',
  'Right. And what do you need from me to get started?',
  'Okay, I think I understand. Anything else you want to ask me?',
];

const GENERIC_MOCK_ZH = [
  '嗯，好吧。你能说得再具体一点吗？',
  '听起来还有点道理。那放在我每天的生意里会是什么样？',
  '说实话，我有点担心费用和时间。',
  '好。那要开始的话，你需要我提供什么？',
  '行，我大概明白了。你还有什么想问我的吗？',
];

export async function handleRoleplayChat(request: Request): Promise<Response> {
  const { locale } = await getT();
  const user = await getSessionUser();
  if (!user) return new Response(byLocale(locale, 'Please log in again.', '请重新登录。'), { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new Response(byLocale(locale, 'Bad request', '请求无效'), { status: 400 });

  const activity = await loadActivity(parsed.data.activityId, roleplayConfigSchema);
  if (!activity) {
    return new Response(byLocale(locale, 'Activity not found', '找不到这个活动'), { status: 404 });
  }
  const c = localizeContent(activity.config, locale);

  const history: ChatMessage[] = parsed.data.messages.map((m) => ({
    role: m.role === 'persona' ? 'assistant' : 'user',
    content: m.content,
  }));
  const fallback = byLocale(locale, GENERIC_MOCK, GENERIC_MOCK_ZH);

  const stream = await streamText([{ role: 'system', content: personaSystemPrompt(c, locale) }, ...history], {
    feature: 'activities.roleplay_chat',
    userId: user.id,
    tier: 'smart',
    temperature: 0.8,
    maxTokens: 220,
    mock: () => pickMockReply(c, parsed.data.messages, fallback),
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}
