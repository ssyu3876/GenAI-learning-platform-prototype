// Module tables are loaded by drizzle-kit outside Next.js, so schema files use relative
// imports instead of the "@/" alias.
import { index, integer, pgTable, primaryKey, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { courses, lessons, users } from '../../core/db/schema';

export const ADAPTATION_VARIANTS = ['simpler', 'technical', 'example'] as const;
export type AdaptationVariant = (typeof ADAPTATION_VARIANTS)[number];

// "Explain it my way" rewrites, cached per lesson so each variant is generated once.
export const lessonAdaptations = pgTable(
  'lesson_adaptations',
  {
    lessonId: text()
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    variant: text().$type<AdaptationVariant>().notNull(),
    content: text().notNull(),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.lessonId, t.variant] })],
);

/** Public-library interactions. One row per user/course for likes, saves and unique views. */
export const courseLikes = pgTable(
  'course_likes',
  {
    courseId: text()
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.userId] })],
);

export const courseFavorites = pgTable(
  'course_favorites',
  {
    courseId: text()
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.userId] })],
);

export const courseViews = pgTable(
  'course_views',
  {
    courseId: text()
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    viewedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.userId] })],
);

export const courseShares = pgTable(
  'course_shares',
  {
    id: text().primaryKey(),
    courseId: text()
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    senderId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recipientId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.courseId, t.createdAt)],
);

export const courseReviews = pgTable(
  'course_reviews',
  {
    id: text().primaryKey(),
    courseId: text()
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rating: integer().notNull(),
    body: text().notNull().default(''),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('course_reviews_course_user_unique').on(t.courseId, t.userId)],
);
