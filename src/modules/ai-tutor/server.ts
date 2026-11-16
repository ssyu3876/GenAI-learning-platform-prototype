// POST /api/tutor handler: validates the chat, adds lesson + learner context and returns
// Pip's reply as plain text. The route file only forwards the request here.
import { z } from 'zod';
import { generateText, type ChatMessage } from '@/core/ai/client';
import { getSessionUser } from '@/core/auth/session';
import { EVENT_TYPES, recordEvent } from '@/core/events';
import { getT } from '@/i18n';
import { byLocale } from '@/i18n/ai';
import { localizeContent } from '@/i18n/content';
import { loadLearnerProfile, loadLessonContext, loadReviewContext } from './context';
import { appendTutorExchange, resolveTutorSession } from './history';
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
  sessionId: z.string().min(1).max(64).optional(),
  context: z
    .object({
      entry: z.literal('review'),
      lessonId: z.string().min(1).max(64),
      question: z.string().min(1).max(500),
      wrongAnswerIndex: z.number().int().min(0).max(9).nullable().optional(),
    })
    .optional(),
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

  const { messages, lessonId, sessionId: requestedSessionId, context } = parsed.data;
  const effectiveLessonId = context?.lessonId ?? lessonId;
  const [rawLesson, profile, rawReview] = await Promise.all([
    effectiveLessonId ? loadLessonContext(user, effectiveLessonId) : Promise.resolve(null),
    user.role === 'learner' ? loadLearnerProfile(user.id) : Promise.resolve(null),
    context?.entry === 'review'
      ? loadReviewContext(user, context.lessonId, context.question)
      : Promise.resolve(null),
  ]);
  const lesson = rawLesson ? localizeContent(rawLesson, locale) : null;
  const review =
    rawReview && context?.entry === 'review'
      ? {
          ...rawReview,
          wrongAnswer:
            context.wrongAnswerIndex !== null && context.wrongAnswerIndex !== undefined
              ? (rawReview.options[context.wrongAnswerIndex] ?? null)
              : null,
        }
      : null;
  const question = messages.at(-1)?.content ?? '';
  const tutorSessionId = await resolveTutorSession({
    userId: user.id,
    sessionId: requestedSessionId,
    entry: context?.entry ?? (lesson ? 'lesson' : 'general'),
    courseId: lesson?.courseId ?? null,
    lessonId: lesson?.id ?? null,
    reviewQuestion: review?.question ?? context?.question ?? '',
  });

  const chat: ChatMessage[] = [
    { role: 'system', content: buildSystemPrompt({ lesson, profile, learnerName: user.name, review, locale }) },
    ...messages,
  ];

  await recordEvent({
    userId: user.id,
    type: EVENT_TYPES.tutorAsked,
    courseId: lesson?.courseId ?? null,
    lessonId: lesson?.id ?? null,
    xp: 0,
    payload: {
      lessonId: lesson?.id ?? null,
      entry: context?.entry ?? 'lesson',
      reviewQuestion: review?.question ?? null,
    },
  });

  const reply = await generateText(chat, {
    feature: 'tutor.chat',
    userId: user.id,
    tier: 'fast',
    maxTokens: 700,
    timeoutMs: 20_000,
    mock: () => buildMockReply({ question, lesson, review, locale }),
  });
  await appendTutorExchange(tutorSessionId, question, reply.text);

  return new Response(reply.text, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Tutor-Session': tutorSessionId,
    },
  });
}
