// Relative imports: drizzle-kit loads schema files outside Next.js (no "@/" alias).
import { index, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { activities, courses, users } from '../../core/db/schema';

// One quiz question a learner got wrong, scheduled for spaced review (Leitner boxes).
// Rows are created from activity_attempts.detail.answers; see queries.ts syncReviewItems().
export const reviewItems = pgTable(
  'review_items',
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    activityId: text()
      .notNull()
      .references(() => activities.id, { onDelete: 'cascade' }),
    courseId: text()
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    questionIndex: integer().notNull(),
    // Snapshot of the prompt, so an edited quiz does not show the wrong question
    prompt: text().notNull(),
    // The option the learner picked in the quiz (shown as "last time you picked")
    wrongAnswer: integer(),
    // 0 = just missed, MASTERED_BOX = mastered (see schedule.ts)
    box: integer().notNull().default(0),
    dueAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    reviewCount: integer().notNull().default(0),
    lapseCount: integer().notNull().default(0),
    lastReviewedAt: timestamp({ withTimezone: true }),
    masteredAt: timestamp({ withTimezone: true }),
    // updatedAt of the quiz attempt that put this question here
    sourceAttemptAt: timestamp({ withTimezone: true }).notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex().on(t.userId, t.activityId, t.questionIndex), index().on(t.userId, t.dueAt)],
);

export type ReviewItem = typeof reviewItems.$inferSelect;
