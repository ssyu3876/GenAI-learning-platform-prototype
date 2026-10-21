'use server';

import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireUser } from '@/core/auth/session';
import { getDb } from '@/core/db/client';
import { activities } from '@/core/db/schema';
import { EVENT_TYPES, recordEvent } from '@/core/events';
import type { ActionResult } from '@/core/types';
import { formatDue, parseQuizQuestions, REVIEW_CORRECT_XP, scheduleNext } from './logic';
import { reviewItems } from './schema';

const answerSchema = z.object({
  itemId: z.string().min(1),
  picked: z.number().int().min(0).max(9),
});

export interface ReviewAnswer {
  correct: boolean;
  answerIndex: number;
  explanation: string;
  mastered: boolean;
  /** "tomorrow", "in 3 days"; null when the card was not due (nothing moved) */
  nextLabel: string | null;
  xpGained: number;
}

/** Checks one review card on the server and moves it to its next box. */
export async function answerReviewCard(input: z.infer<typeof answerSchema>): Promise<ActionResult<ReviewAnswer>> {
  const user = await requireUser();
  const parsed = answerSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'Pick an answer first.' };
  const { itemId, picked } = parsed.data;

  const db = await getDb();
  const [row] = await db
    .select({ item: reviewItems, config: activities.config, lessonId: activities.lessonId })
    .from(reviewItems)
    .innerJoin(activities, eq(activities.id, reviewItems.activityId))
    .where(and(eq(reviewItems.id, itemId), eq(reviewItems.userId, user.id)))
    .limit(1);
  if (!row) return { ok: false, error: 'This card is no longer in your review list.' };

  const q = parseQuizQuestions(row.config)[row.item.questionIndex];
  if (!q || q.prompt !== row.item.prompt) {
    return { ok: false, error: 'The course author changed this question. Skip it for now.' };
  }
  if (picked >= q.options.length) return { ok: false, error: 'Pick one of the options.' };

  const now = new Date();
  const correct = picked === q.answerIndex;
  // Only due cards move between boxes, so answering the same card twice cannot skip ahead
  // or farm XP.
  const isDue = row.item.masteredAt === null && row.item.dueAt.getTime() <= now.getTime();
  const next = isDue ? scheduleNext(row.item.box, correct, now) : null;
  const xpGained = isDue && correct ? REVIEW_CORRECT_XP : 0;

  await db
    .update(reviewItems)
    .set({
      reviewCount: row.item.reviewCount + 1,
      lastReviewedAt: now,
      updatedAt: now,
      ...(next
        ? {
            box: next.box,
            dueAt: next.dueAt,
            masteredAt: next.mastered ? now : null,
            lapseCount: row.item.lapseCount + (!correct && row.item.box > 0 ? 1 : 0),
          }
        : {}),
    })
    .where(eq(reviewItems.id, row.item.id));

  await recordEvent({
    userId: user.id,
    type: EVENT_TYPES.reviewAnswered,
    courseId: row.item.courseId,
    lessonId: row.lessonId,
    activityId: row.item.activityId,
    xp: xpGained,
    payload: { itemId: row.item.id, questionIndex: row.item.questionIndex, correct, box: next?.box ?? row.item.box },
  });

  return {
    ok: true,
    data: {
      correct,
      answerIndex: q.answerIndex,
      explanation: q.explanation,
      mastered: next?.mastered ?? false,
      nextLabel: next && !next.mastered ? formatDue(next.dueAt, now) : null,
      xpGained,
    },
  };
}
