import { index, integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { courses, users } from '../../core/db/schema';
import type { CourseOutline, GenerationRequest } from './types';

export type GenerationStatus = 'outline' | 'generating' | 'generated';
export type FeedbackStage = 'outline' | 'course' | 'lesson';

/**
 * One learner request. The outline is stored before the full course exists, so the learner
 * can review/adjust it without spending the expensive generation tokens twice.
 */
export const courseGenerationSessions = pgTable(
  'course_generation_sessions',
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    request: jsonb().$type<GenerationRequest>().notNull(),
    outline: jsonb().$type<CourseOutline>().notNull(),
    status: text().$type<GenerationStatus>().notNull().default('outline'),
    courseId: text().references(() => courses.id, { onDelete: 'set null' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('course_generation_sessions_user_idx').on(t.userId, t.createdAt)],
);

/** Both gates use this table: framework feedback and post-course feedback. */
export const courseFeedback = pgTable(
  'course_feedback',
  {
    id: text().primaryKey(),
    sessionId: text()
      .notNull()
      .references(() => courseGenerationSessions.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: text().references(() => courses.id, { onDelete: 'set null' }),
    stage: text().$type<FeedbackStage>().notNull(),
    rating: integer(),
    difficulty: text(),
    comment: text().notNull().default(''),
    lessonId: text(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('course_feedback_session_idx').on(t.sessionId, t.createdAt),
    index('course_feedback_user_idx').on(t.userId, t.createdAt),
  ],
);

export type CourseGenerationSession = typeof courseGenerationSessions.$inferSelect;
export type CourseFeedback = typeof courseFeedback.$inferSelect;
