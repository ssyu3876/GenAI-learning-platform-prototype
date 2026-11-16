// Class assignments: quizzes, projects and written assignments attached to a course week.
// Relative imports: drizzle-kit loads schema files outside Next.js (no "@/" alias).
import { index, integer, jsonb, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { classes, courses, lessons, users } from '../../core/db/schema';

export type AssignmentType = 'quiz' | 'project' | 'assignment';
export type AssignmentSource = 'manual' | 'ai';
export type AssignmentQuestionKind = 'single' | 'short';
export type AssignmentSubmissionStatus = 'submitted' | 'graded';

/** One active term per class: start date + number of teaching weeks. */
export const classTerms = pgTable('class_terms', {
  id: text().primaryKey(),
  classId: text()
    .notNull()
    .unique()
    .references(() => classes.id, { onDelete: 'cascade' }),
  name: text().notNull(),
  startDate: timestamp({ withTimezone: true }).notNull(),
  weeks: integer().notNull().default(16),
  createdBy: text()
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
});

/** Deduplicates scheduled deadline reminders. */

export const assignments = pgTable(
  'assignments',
  {
    id: text().primaryKey(),
    classId: text()
      .notNull()
      .references(() => classes.id, { onDelete: 'cascade' }),
    courseId: text()
      .notNull()
      .references(() => courses.id, { onDelete: 'cascade' }),
    lessonId: text().references(() => lessons.id, { onDelete: 'set null' }),
    weekNo: integer().notNull().default(1),
    type: text().$type<AssignmentType>().notNull(),
    source: text().$type<AssignmentSource>().notNull().default('manual'),
    title: text().notNull(),
    instructions: text().notNull().default(''),
    dueAt: timestamp({ withTimezone: true }).notNull(),
    points: integer().notNull().default(100),
    weight: integer().notNull().default(100),
    groupSize: integer().notNull().default(1),
    peerReviewCount: integer().notNull().default(0),
    publishedAt: timestamp({ withTimezone: true }),
    createdBy: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index().on(t.classId, t.dueAt), index().on(t.courseId, t.weekNo)],
);

/** Deduplicates scheduled deadline reminders. */
export const assignmentReminders = pgTable(
  'assignment_reminders',
  {
    id: text().primaryKey(),
    assignmentId: text()
      .notNull()
      .references(() => assignments.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    kind: text().notNull().default('due24h'),
    sentAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('assignment_reminders_unique').on(t.assignmentId, t.userId, t.kind)],
);

/** Auto-created groups for a group assignment. */
export const assignmentGroups = pgTable(
  'assignment_groups',
  {
    id: text().primaryKey(),
    assignmentId: text()
      .notNull()
      .references(() => assignments.id, { onDelete: 'cascade' }),
    name: text().notNull(),
  },
  (t) => [index().on(t.assignmentId)],
);

export const assignmentGroupMembers = pgTable(
  'assignment_group_members',
  {
    groupId: text()
      .notNull()
      .references(() => assignmentGroups.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (t) => [unique('assignment_group_members_unique').on(t.groupId, t.userId)],
);

/** Peer feedback on another group's/student's submission. */
export const assignmentQuestions = pgTable(
  'assignment_questions',
  {
    id: text().primaryKey(),
    assignmentId: text()
      .notNull()
      .references(() => assignments.id, { onDelete: 'cascade' }),
    position: integer().notNull(),
    kind: text().$type<AssignmentQuestionKind>().notNull(),
    prompt: text().notNull(),
    options: jsonb().$type<string[]>().notNull().default([]),
    answer: text().notNull().default(''),
    points: integer().notNull().default(1),
    imageData: text(),
    imageMimeType: text(),
  },
  (t) => [index().on(t.assignmentId, t.position)],
);

/** Original teacher-provided document (assignment brief, project brief or quiz source). */
export const assignmentFiles = pgTable('assignment_files', {
  id: text().primaryKey(),
  assignmentId: text()
    .notNull()
    .references(() => assignments.id, { onDelete: 'cascade' }),
  filename: text().notNull(),
  mimeType: text().notNull().default('application/octet-stream'),
  size: integer().notNull(),
  data: text().notNull(),
});

export const assignmentSubmissions = pgTable(
  'assignment_submissions',
  {
    id: text().primaryKey(),
    assignmentId: text()
      .notNull()
      .references(() => assignments.id, { onDelete: 'cascade' }),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    groupId: text().references(() => assignmentGroups.id, { onDelete: 'set null' }),
    status: text().$type<AssignmentSubmissionStatus>().notNull().default('submitted'),
    textContent: text().notNull().default(''),
    answers: jsonb().$type<Record<string, string>>().notNull().default({}),
    fileName: text(),
    mimeType: text(),
    fileSize: integer(),
    fileData: text(),
    score: integer(),
    feedback: text().notNull().default(''),
    submittedAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
    gradedAt: timestamp({ withTimezone: true }),
    gradedBy: text().references(() => users.id, { onDelete: 'set null' }),
  },
  (t) => [
    unique('assignment_submissions_assignment_user_unique').on(t.assignmentId, t.userId),
    index().on(t.assignmentId, t.submittedAt),
  ],
);

export const assignmentPeerReviews = pgTable(
  'assignment_peer_reviews',
  {
    id: text().primaryKey(),
    assignmentId: text()
      .notNull()
      .references(() => assignments.id, { onDelete: 'cascade' }),
    reviewerId: text()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    submissionId: text()
      .notNull()
      .references(() => assignmentSubmissions.id, { onDelete: 'cascade' }),
    score: integer(),
    feedback: text().notNull().default(''),
    createdAt: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('assignment_peer_reviews_unique').on(t.reviewerId, t.submissionId)],
);

export type Assignment = typeof assignments.$inferSelect;
export type AssignmentQuestion = typeof assignmentQuestions.$inferSelect;
export type AssignmentSubmission = typeof assignmentSubmissions.$inferSelect;
