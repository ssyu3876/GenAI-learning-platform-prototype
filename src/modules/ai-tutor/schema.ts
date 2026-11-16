import { index, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { classes, courses, lessons, users } from '../../core/db/schema';

export type TutorEntry = 'review' | 'lesson' | 'general';
export type TutorRole = 'user' | 'assistant';

/** A learner's AI-tutor thread. Context is stored on the session, messages below. */
export const tutorSessions = pgTable(
  'tutor_sessions',
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    entry: text().$type<TutorEntry>().notNull().default('general'),
    courseId: text().references(() => courses.id, { onDelete: 'set null' }),
    lessonId: text().references(() => lessons.id, { onDelete: 'set null' }),
    reviewQuestion: text().notNull().default(''),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('tutor_sessions_user_idx').on(t.userId, t.createdAt)],
);

export const tutorMessages = pgTable(
  'tutor_messages',
  {
    id: text().primaryKey(),
    sessionId: text()
      .notNull()
      .references(() => tutorSessions.id, { onDelete: 'cascade' }),
    role: text().$type<TutorRole>().notNull(),
    content: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('tutor_messages_session_idx').on(t.sessionId, t.createdAt)],
);

export type TutorSession = typeof tutorSessions.$inferSelect;
export type TutorMessage = typeof tutorMessages.$inferSelect;

/** Curated by instructors so recommendations never invent external video URLs. */

/** Lightweight recommendation click log for future ranking/quality analysis. */
export const tutorRecommendationClicks = pgTable(
  'tutor_recommendation_clicks',
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text().notNull(),
    title: text().notNull(),
    href: text().notNull(),
    courseId: text().references(() => courses.id, { onDelete: 'set null' }),
    classId: text().references(() => classes.id, { onDelete: 'set null' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('tutor_recommendation_clicks_user_idx').on(t.userId, t.createdAt)],
);
