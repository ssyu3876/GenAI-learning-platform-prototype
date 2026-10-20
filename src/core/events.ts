// Writes to the append-only learning_events log. Modules never call each other; they write
// events here and read them back (e.g. the leaderboard sums xp, the class dashboard counts
// activity). Add new event types to EVENT_TYPES so they are documented in one place.
import { getDb } from '@/core/db/client';
import { learningEvents } from '@/core/db/schema';
import { newId } from '@/core/ids';

export const EVENT_TYPES = {
  /** payload: { score, attempt } */
  activityCompleted: 'activity.completed',
  lessonCompleted: 'lesson.completed',
  courseEnrolled: 'course.enrolled',
  courseCompleted: 'course.completed',
  /** payload: { mode } — learner opened the AI tutor */
  tutorAsked: 'tutor.asked',
  onboardingCompleted: 'onboarding.completed',
  /** payload: { courseId } — learner generated their own course */
  courseGenerated: 'course.generated',
  classJoined: 'class.joined',
  /** payload: { itemId, questionIndex, correct, box } — learner answered a review card */
  reviewAnswered: 'review.answered',
} as const;

export type EventType = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES] | (string & {});

export interface RecordEventInput {
  userId: string;
  type: EventType;
  courseId?: string | null;
  lessonId?: string | null;
  activityId?: string | null;
  xp?: number;
  payload?: Record<string, unknown>;
  /** Only used by the seed script to backfill history */
  createdAt?: Date;
}

export async function recordEvent(input: RecordEventInput): Promise<void> {
  const db = await getDb();
  await db.insert(learningEvents).values({
    id: newId('event'),
    userId: input.userId,
    type: input.type,
    courseId: input.courseId ?? null,
    lessonId: input.lessonId ?? null,
    activityId: input.activityId ?? null,
    xp: input.xp ?? 0,
    payload: input.payload ?? null,
    ...(input.createdAt ? { createdAt: input.createdAt } : {}),
  });
}
