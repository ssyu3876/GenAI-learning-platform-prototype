// Read side of the mistake notebook. syncReviewItems() copies wrong quiz answers from
// activity_attempts into review_items; the other functions read them back for the page
// and the home widget. Everything comes from core tables, nothing from other modules.
import { and, eq } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import { activities, activityAttempts, courses, lessons } from '@/core/db/schema';
import { newId } from '@/core/ids';
import { parseQuizAnswers, parseQuizQuestions, SESSION_SIZE, wrongQuestionIndexes } from './logic';
import { reviewItems } from './schema';

const QUIZ_TYPE = 'quiz';

/**
 * Adds every wrong quiz answer the learner has not seen in review yet. A mastered card
 * comes back when a newer quiz attempt gets it wrong again. Safe to call on every view.
 */
export async function syncReviewItems(userId: string): Promise<void> {
  const db = await getDb();
  const attempts = await db
    .select({
      activityId: activityAttempts.activityId,
      courseId: activityAttempts.courseId,
      detail: activityAttempts.detail,
      updatedAt: activityAttempts.updatedAt,
      config: activities.config,
    })
    .from(activityAttempts)
    .innerJoin(activities, eq(activities.id, activityAttempts.activityId))
    .where(and(eq(activityAttempts.userId, userId), eq(activities.type, QUIZ_TYPE)));
  if (attempts.length === 0) return;

  const existing = await db.select().from(reviewItems).where(eq(reviewItems.userId, userId));
  const byKey = new Map(existing.map((r) => [`${r.activityId}:${r.questionIndex}`, r]));
  const now = new Date();
  const inserts: (typeof reviewItems.$inferInsert)[] = [];

  for (const a of attempts) {
    const answers = parseQuizAnswers(a.detail);
    if (!answers) continue;
    const questions = parseQuizQuestions(a.config);
    for (const i of wrongQuestionIndexes(questions, answers)) {
      const q = questions[i]!;
      const item = byKey.get(`${a.activityId}:${i}`);
      if (!item) {
        inserts.push({
          id: newId('rvw'),
          userId,
          activityId: a.activityId,
          courseId: a.courseId,
          questionIndex: i,
          prompt: q.prompt,
          wrongAnswer: answers[i] ?? null,
          dueAt: now,
          sourceAttemptAt: a.updatedAt,
        });
        continue;
      }
      const promptChanged = item.prompt !== q.prompt;
      const missedAgain = item.masteredAt !== null && a.updatedAt > item.masteredAt;
      if (!promptChanged && !missedAgain) continue;
      await db
        .update(reviewItems)
        .set({
          prompt: q.prompt,
          wrongAnswer: answers[i] ?? null,
          box: 0,
          dueAt: now,
          masteredAt: null,
          lapseCount: item.lapseCount + (missedAgain ? 1 : 0),
          sourceAttemptAt: a.updatedAt,
          updatedAt: now,
        })
        .where(eq(reviewItems.id, item.id));
    }
  }
  if (inserts.length) await db.insert(reviewItems).values(inserts).onConflictDoNothing();
}

export interface ReviewCourse {
  id: string;
  slug: string;
  title: string;
  emoji: string;
  color: string;
}

export interface ReviewCard {
  id: string;
  prompt: string;
  options: string[];
  wrongAnswer: number | null;
  box: number;
  dueAt: Date;
  masteredAt: Date | null;
  reviewCount: number;
  lessonId: string;
  lessonTitle: string;
  activityTitle: string;
  course: ReviewCourse;
}

export interface ReviewOverview {
  /** Due now, oldest first, capped at one session */
  session: ReviewCard[];
  dueCount: number;
  inRotation: number;
  masteredCount: number;
  nextDueAt: Date | null;
  /** Every card, grouped by course in the order they were first missed */
  notebook: { course: ReviewCourse; cards: ReviewCard[] }[];
}

async function listReviewCards(userId: string): Promise<ReviewCard[]> {
  const db = await getDb();
  const rows = await db
    .select({
      item: reviewItems,
      config: activities.config,
      activityTitle: activities.title,
      lessonId: lessons.id,
      lessonTitle: lessons.title,
      course: {
        id: courses.id,
        slug: courses.slug,
        title: courses.title,
        emoji: courses.emoji,
        color: courses.color,
      },
    })
    .from(reviewItems)
    .innerJoin(activities, eq(activities.id, reviewItems.activityId))
    .innerJoin(lessons, eq(lessons.id, activities.lessonId))
    .innerJoin(courses, eq(courses.id, reviewItems.courseId))
    .where(eq(reviewItems.userId, userId))
    .orderBy(reviewItems.createdAt, reviewItems.questionIndex);

  const cards: ReviewCard[] = [];
  for (const r of rows) {
    const q = parseQuizQuestions(r.config)[r.item.questionIndex];
    // The author changed or removed this question since it was missed: hide the old card.
    if (!q || q.prompt !== r.item.prompt) continue;
    cards.push({
      id: r.item.id,
      prompt: q.prompt,
      options: q.options,
      wrongAnswer: r.item.wrongAnswer,
      box: r.item.box,
      dueAt: r.item.dueAt,
      masteredAt: r.item.masteredAt,
      reviewCount: r.item.reviewCount,
      lessonId: r.lessonId,
      lessonTitle: r.lessonTitle,
      activityTitle: r.activityTitle,
      course: r.course,
    });
  }
  return cards;
}

export async function getReviewOverview(userId: string): Promise<ReviewOverview> {
  await syncReviewItems(userId);
  const cards = await listReviewCards(userId);
  const now = Date.now();
  const active = cards.filter((c) => !c.masteredAt);
  const due = active
    .filter((c) => c.dueAt.getTime() <= now)
    .sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
  const upcoming = active.filter((c) => c.dueAt.getTime() > now).map((c) => c.dueAt.getTime());

  const groups = new Map<string, { course: ReviewCourse; cards: ReviewCard[] }>();
  for (const c of cards) {
    const g = groups.get(c.course.id) ?? { course: c.course, cards: [] };
    g.cards.push(c);
    groups.set(c.course.id, g);
  }

  return {
    session: due.slice(0, SESSION_SIZE),
    dueCount: due.length,
    inRotation: active.length,
    masteredCount: cards.length - active.length,
    nextDueAt: upcoming.length ? new Date(Math.min(...upcoming)) : null,
    notebook: [...groups.values()],
  };
}
