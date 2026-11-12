// Core tables shared by every module. Module-specific tables live in
// src/modules/<name>/schema.ts and are picked up by drizzle.config.ts automatically.
//
// Naming: TS fields are camelCase; drizzle `casing: 'snake_case'` maps them to snake_case
// columns. Table names are snake_case plural. IDs are prefixed strings from core/ids.ts.
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

const createdAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp({ withTimezone: true }).notNull().defaultNow();

export const USER_ROLES = ['learner', 'instructor', 'admin'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const users = pgTable('users', {
  id: text().primaryKey(),
  email: text().notNull().unique(),
  passwordHash: text().notNull(),
  name: text().notNull(),
  role: text().$type<UserRole>().notNull().default('learner'),
  // Seed for the generated avatar so it stays stable when the name changes
  avatarSeed: text().notNull(),
  createdAt: createdAt(),
  lastActiveAt: timestamp({ withTimezone: true }),
});

export type LearnerBackground = 'non_cs' | 'cs_student' | 'cs_graduate' | 'other';
export type LearnerGoal = 'understand' | 'career' | 'build' | 'ai_skills';
export type LearnerTrack = 'explorer' | 'builder';

export const learnerProfiles = pgTable('learner_profiles', {
  userId: text()
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  background: text().$type<LearnerBackground>().notNull(),
  goal: text().$type<LearnerGoal>().notNull(),
  // 0 = never coded, 3 = codes regularly
  codingLevel: integer().notNull().default(0),
  interests: jsonb().$type<string[]>().notNull().default([]),
  // explorer = concepts first (non-CS friendly), builder = hands-on first
  track: text().$type<LearnerTrack>().notNull(),
  // Ordered course ids recommended by onboarding
  recommendedCourseIds: jsonb().$type<string[]>().notNull().default([]),
  welcomeNote: text().notNull().default(''),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export type CourseStatus = 'draft' | 'pending_review' | 'published' | 'archived';
// public = catalog for everyone, class = only learners of assigned classes, private = owner only
export type CourseVisibility = 'public' | 'class' | 'private';
export type CourseSource = 'seed' | 'manual' | 'ai' | 'learner_ai';
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type CourseAudience = 'everyone' | 'non_cs' | 'cs';

export const courses = pgTable(
  'courses',
  {
    id: text().primaryKey(),
    slug: text().notNull().unique(),
    title: text().notNull(),
    summary: text().notNull().default(''),
    // Free text, e.g. "Software Engineering", "History", "Biology"
    subject: text().notNull().default('Software Engineering'),
    level: text().$type<CourseLevel>().notNull().default('beginner'),
    audience: text().$type<CourseAudience>().notNull().default('everyone'),
    tags: jsonb().$type<string[]>().notNull().default([]),
    // Visual theme key used by the UI (see UI_GUIDELINES.md): coral | mint | butter | sky | lilac
    color: text().notNull().default('mint'),
    emoji: text().notNull().default('🌱'),
    estimatedMinutes: integer().notNull().default(30),
    status: text().$type<CourseStatus>().notNull().default('draft'),
    visibility: text().$type<CourseVisibility>().notNull().default('private'),
    source: text().$type<CourseSource>().notNull().default('manual'),
    ownerId: text().references(() => users.id, { onDelete: 'set null' }),
    // Set when an instructor duplicates a course to customise it
    forkedFromId: text(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.ownerId), index().on(t.status, t.visibility)],
);

export const lessons = pgTable(
  'lessons',
  {
    id: text().primaryKey(),
    courseId: text()
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    position: integer().notNull(),
    title: text().notNull(),
    // Markdown
    content: text().notNull().default(''),
    estimatedMinutes: integer().notNull().default(10),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.courseId, t.position)],
);

export const activities = pgTable(
  'activities',
  {
    id: text().primaryKey(),
    lessonId: text()
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    position: integer().notNull(),
    // Activity type key registered in src/registry/activities.ts (quiz, sort, coding, ...)
    type: text().notNull(),
    title: text().notNull(),
    // Shape is defined by the activity type's zod schema
    config: jsonb().$type<unknown>().notNull(),
    xpReward: integer().notNull().default(20),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index().on(t.lessonId, t.position)],
);

export const enrollments = pgTable(
  'enrollments',
  {
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    courseId: text()
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    enrolledAt: createdAt(),
    completedAt: timestamp({ withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.courseId] })],
);

// One row per (user, activity): best score so far. Re-tries update it.
export const activityAttempts = pgTable(
  'activity_attempts',
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
    bestScore: integer().notNull(),
    attemptCount: integer().notNull().default(1),
    xpEarned: integer().notNull().default(0),
    // Activity-specific result details (answers, transcript summary, feedback...)
    detail: jsonb().$type<unknown>(),
    completedAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex().on(t.userId, t.activityId), index().on(t.courseId)],
);

export const lessonCompletions = pgTable(
  'lesson_completions',
  {
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    lessonId: text()
      .notNull()
      .references(() => lessons.id, { onDelete: 'cascade' }),
    courseId: text()
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    completedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] })],
);

// Append-only activity log. Single source of truth for XP, streaks, leaderboards and
// engagement analytics. Event type names: "<domain>.<past_tense_verb>".
export const learningEvents = pgTable(
  'learning_events',
  {
    id: text().primaryKey(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text().notNull(),
    courseId: text(),
    lessonId: text(),
    activityId: text(),
    xp: integer().notNull().default(0),
    payload: jsonb().$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.userId, t.createdAt), index().on(t.createdAt), index().on(t.type)],
);

// Classes are core (not owned by the classes module) because leaderboards, dashboards and
// course visibility all scope by class.
export const classes = pgTable('classes', {
  id: text().primaryKey(),
  name: text().notNull(),
  description: text().notNull().default(''),
  instructorId: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  inviteCode: text().notNull().unique(),
  createdAt: createdAt(),
});

export const classMembers = pgTable(
  'class_members',
  {
    classId: text()
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    joinedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.classId, t.userId] }), index().on(t.userId)],
);

export const classCourses = pgTable(
  'class_courses',
  {
    classId: text()
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    courseId: text()
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    assignedAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.classId, t.courseId] })],
);

export const aiUsage = pgTable(
  'ai_usage',
  {
    id: text().primaryKey(),
    userId: text(),
    // Which feature made the call, e.g. "tutor.chat", "studio.generate_course"
    feature: text().notNull(),
    model: text().notNull(),
    // true when the mock provider answered (no API key, limit reached, or provider error)
    mocked: boolean().notNull().default(false),
    promptTokens: integer().notNull().default(0),
    completionTokens: integer().notNull().default(0),
    latencyMs: integer().notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.userId, t.createdAt), index().on(t.createdAt)],
);

/**
 * Admin actions that change something. Append-only: a role change or a course going offline
 * should leave a trace that outlives the person who did it.
 *
 * Writes go through core/audit.ts so every module logs the same shape. `action` is a stable
 * key rendered through i18n at read time, because the console is bilingual and the reader's
 * language is not known when the row is written.
 */
export const adminAudit = pgTable(
  'admin_audit',
  {
    id: text().primaryKey(),
    actorId: text().references(() => users.id, { onDelete: 'set null' }),
    /** Snapshot of who acted, so the row still reads correctly after a rename. */
    actorName: text().notNull(),
    /** e.g. 'user.role_changed', 'course.archived', 'scenario.closed'. */
    action: text().notNull(),
    /** 'user' | 'course' | 'scenario'. */
    targetType: text().notNull(),
    targetId: text().notNull(),
    /** Snapshot of the target's name at the time of the action. */
    targetName: text().notNull(),
    /** Structured facts for the action, e.g. { from: 'learner', to: 'admin' }. */
    detail: jsonb().$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.createdAt), index().on(t.actorId)],
);

export type User = typeof users.$inferSelect;
export type LearnerProfile = typeof learnerProfiles.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type ActivityAttempt = typeof activityAttempts.$inferSelect;
export type LearningEvent = typeof learningEvents.$inferSelect;
export type ClassRow = typeof classes.$inferSelect;
