// POST /api/tutor handler: validates the chat, adds lesson + learner context and streams
// Pip's reply as plain text. The route file only forwards the request here.
import { z } from 'zod';
import { streamText, type ChatMessage } from '@/core/ai/client';
import { getSessionUser } from '@/core/auth/session';
import { EVENT_TYPES, recordEvent } from '@/core/events';
import { getT } from '@/i18n';
import { byLocale } from '@/i18n/ai';
import { localizeContent } from '@/i18n/content';
import { loadLearnerProfile, loadLessonContext } from './context';
import { buildMockReply, buildSystemPrompt } from './prompt';
import { MAX_HISTORY, MAX_MESSAGE_CHARS } from './shared';

const tutorRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
      }),
    )
    .min(1)
    .max(MAX_HISTORY)
    .refine((m) => m.at(-1)?.role === 'user', 'The last message must be from the learner.'),
  lessonId: z.string().min(1).max(64).optional(),
});

function errorResponse(status: number, error: string): Response {
  return Response.json({ error }, { status });
}

export async function handleTutorRequest(request: Request): Promise<Response> {
  const { locale } = await getT();
  const user = await getSessionUser();
  if (!user) {
    return errorResponse(401, byLocale(locale, 'Please log in again to chat with Pip.', '请重新登录后再和 Pip 聊天。'));
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, byLocale(locale, 'The request was not valid JSON.', '请求内容不是有效的 JSON。'));
  }
  const parsed = tutorRequestSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(
      400,
      byLocale(
        locale,
        `Pip could not read that message. Keep it under ${MAX_MESSAGE_CHARS} characters.`,
        `Pip 没能读懂这条消息。请把字数控制在 ${MAX_MESSAGE_CHARS} 个字符以内。`,
      ),
    );
  }

  const { messages, lessonId } = parsed.data;
  const [rawLesson, profile] = await Promise.all([
    lessonId ? loadLessonContext(user, lessonId) : Promise.resolve(null),
    user.role === 'learner' ? loadLearnerProfile(user.id) : Promise.resolve(null),
  ]);
  const lesson = rawLesson ? localizeContent(rawLesson, locale) : null;
  const question = messages.at(-1)?.content ?? '';

  const chat: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt({ lesson, profile, learnerName: user.name, locale }) },
    ...messages,
  ];

  await recordEvent({
    userId: user.id,
    type: EVENT_TYPES.tutorAsked,
    courseId: lesson?.courseId ?? null,
    lessonId: lesson?.id ?? null,
    xp: 0,
    payload: { lessonId: lesson?.id ?? null },
  });

  const stream = await streamText(chat, {
    feature: 'tutor.chat',
    userId: user.id,
    tier: 'fast',
    maxTokens: 700,
    mock: () => buildMockReply({ question, lesson, locale }),
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
