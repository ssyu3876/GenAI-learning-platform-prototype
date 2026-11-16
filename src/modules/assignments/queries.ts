// Read functions for class assignments.
import { and, asc, count, desc, eq, inArray, isNotNull, ne, or } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import {
  classMembers,
  classes,
  courses,
  lessons,
  users,
} from '@/core/db/schema';
import type { SessionUser } from '@/core/types';
import {
  classTerms,
  assignmentFiles,
  assignmentGroups,
  assignmentGroupMembers,
  assignmentPeerReviews,
  assignmentQuestions,
  assignmentSubmissions,
  assignments,
  type AssignmentQuestionKind,
  type AssignmentSource,
  type AssignmentSubmissionStatus,
  type AssignmentType,
} from './schema';

export interface TeacherClassOption {
  id: string;
  name: string;
  students: number;
}

export interface TeacherCourseOption {
  id: string;
  title: string;
  classIds: string[];
  lessons: Array<{ id: string; title: string; position: number }>;
}

export interface ClassTermInfo {
  classId: string;
  className: string;
  name: string;
  startDate: Date | null;
  weeks: number;
}

export interface AssignmentSummary {
  id: string;
  classId: string;
  title: string;
  type: AssignmentType;
  source: AssignmentSource;
  weekNo: number;
  dueAt: Date;
  points: number;
  weight: number;
  publishedAt: Date | null;
  className: string;
  courseTitle: string;
  lessonTitle: string | null;
  submissionCount: number;
  unlockAt: Date | null;
}

export interface StudentAssignmentSummary extends AssignmentSummary {
  courseId: string;
  submissionStatus: AssignmentSubmissionStatus | null;
  score: number | null;
  submittedAt: Date | null;
  locked: boolean;
}

export interface AssignmentQuestionView {
  id: string;
  kind: AssignmentQuestionKind;
  prompt: string;
  options: string[];
  points: number;
  hasImage: boolean;
}

export interface TeacherQuestionView extends AssignmentQuestionView {
  answer: string;
}

export interface AssignmentFileInfo {
  filename: string;
  mimeType: string;
  size: number;
}

export interface SubmissionView {
  id: string;
  userId: string;
  studentName: string;
  groupName: string | null;
  status: AssignmentSubmissionStatus;
  score: number | null;
  feedback: string;
  submittedAt: Date;
  textContent: string;
  fileName: string | null;
  fileSize: number | null;
  answers: Record<string, string>;
}

export interface AssignmentGroupInfo {
  id: string;
  name: string;
  members: string[];
}

export interface TeacherAssignmentDetail {
  id: string;
  classId: string;
  courseId: string;
  lessonId: string | null;
  weekNo: number;
  type: AssignmentType;
  source: AssignmentSource;
  title: string;
  instructions: string;
  dueAt: Date;
  points: number;
  weight: number;
  groupSize: number;
  peerReviewCount: number;
  publishedAt: Date | null;
  className: string;
  courseTitle: string;
  lessonTitle: string | null;
  questions: TeacherQuestionView[];
  file: AssignmentFileInfo | null;
  submissions: SubmissionView[];
}

export interface StudentAssignmentDetail {
  id: string;
  weekNo: number;
  type: AssignmentType;
  title: string;
  instructions: string;
  dueAt: Date;
  points: number;
  weight: number;
  groupSize: number;
  peerReviewCount: number;
  className: string;
  courseTitle: string;
  lessonTitle: string | null;
  questions: AssignmentQuestionView[];
  file: AssignmentFileInfo | null;
  submission: SubmissionView | null;
  unlockAt: Date | null;
  locked: boolean;
  group: AssignmentGroupInfo | null;
}

async function managedClassIds(user: SessionUser): Promise<string[]> {
  const db = await getDb();
  const rows = await db
    .select({ id: classes.id })
    .from(classes)
    .where(user.role === 'admin' ? undefined : eq(classes.instructorId, user.id));
  return rows.map((row) => row.id);
}

export async function listClassTerms(user: SessionUser): Promise<ClassTermInfo[]> {
  const db = await getDb();
  const rows = await db
    .select({
      classId: classes.id,
      className: classes.name,
      name: classTerms.name,
      startDate: classTerms.startDate,
      weeks: classTerms.weeks,
    })
    .from(classes)
    .leftJoin(classTerms, eq(classTerms.classId, classes.id))
    .where(user.role === 'admin' ? undefined : eq(classes.instructorId, user.id))
    .orderBy(classes.name);
  return rows.map((row) => ({
    classId: row.classId,
    className: row.className,
    name: row.name ?? '',
    startDate: row.startDate,
    weeks: row.weeks ?? 16,
  }));
}

async function termMap(classIds: string[]): Promise<Map<string, { startDate: Date; weeks: number }>> {
  if (classIds.length === 0) return new Map();
  const db = await getDb();
  const rows = await db
    .select({ classId: classTerms.classId, startDate: classTerms.startDate, weeks: classTerms.weeks })
    .from(classTerms)
    .where(inArray(classTerms.classId, classIds));
  return new Map(rows.map((row) => [row.classId, { startDate: row.startDate, weeks: row.weeks }]));
}

export function termUnlockAt(term: { startDate: Date; weeks: number } | undefined, weekNo: number): Date | null {
  if (!term) return null;
  return new Date(term.startDate.getTime() + Math.max(0, weekNo - 1) * 7 * 24 * 60 * 60 * 1000);
}

export async function groupForStudent(
  assignmentId: string,
  userId: string,
): Promise<AssignmentGroupInfo | null> {
  const db = await getDb();
  const [row] = await db
    .select({ id: assignmentGroups.id, name: assignmentGroups.name })
    .from(assignmentGroups)
    .innerJoin(assignmentGroupMembers, eq(assignmentGroupMembers.groupId, assignmentGroups.id))
    .where(and(eq(assignmentGroups.assignmentId, assignmentId), eq(assignmentGroupMembers.userId, userId)))
    .limit(1);
  if (!row) return null;
  const members = await db
    .select({ name: users.name })
    .from(assignmentGroupMembers)
    .innerJoin(users, eq(users.id, assignmentGroupMembers.userId))
    .where(eq(assignmentGroupMembers.groupId, row.id))
    .orderBy(users.name);
  return { id: row.id, name: row.name, members: members.map((member) => member.name) };
}

export async function listTeacherClasses(user: SessionUser): Promise<TeacherClassOption[]> {
  const db = await getDb();
  const rows = await db
    .select({ id: classes.id, name: classes.name, n: count(classMembers.userId) })
    .from(classes)
    .leftJoin(classMembers, eq(classMembers.classId, classes.id))
    .where(user.role === 'admin' ? undefined : eq(classes.instructorId, user.id))
    .groupBy(classes.id, classes.name)
    .orderBy(classes.name);
  return rows.map((row) => ({ id: row.id, name: row.name, students: Number(row.n) }));
}

/** Courses a teacher may attach an assignment to, with their lessons. */
export async function listTeacherCourses(user: SessionUser): Promise<TeacherCourseOption[]> {
  const db = await getDb();
  const courseRows = await db
    .select({ id: courses.id, title: courses.title })
    .from(courses)
    .where(
      user.role === 'admin'
        ? eq(courses.status, 'published')
        : or(
            eq(courses.ownerId, user.id),
            and(eq(courses.status, 'published'), eq(courses.visibility, 'public')),
          ),
    )
    .orderBy(courses.title);
  if (courseRows.length === 0) return [];
  const lessonRows = await db
    .select({ id: lessons.id, courseId: lessons.courseId, title: lessons.title, position: lessons.position })
    .from(lessons)
    .where(inArray(lessons.courseId, courseRows.map((row) => row.id)))
    .orderBy(asc(lessons.position));
  return courseRows.map((course) => ({
    id: course.id,
    title: course.title,
    classIds: [],
    lessons: lessonRows
      .filter((lesson) => lesson.courseId === course.id)
      .map((lesson) => ({ id: lesson.id, title: lesson.title, position: lesson.position })),
  }));
}

export async function listTeacherAssignments(user: SessionUser): Promise<AssignmentSummary[]> {
  const ids = await managedClassIds(user);
  if (ids.length === 0) return [];
  const db = await getDb();
  const rows = await db
    .select({
      id: assignments.id,
      classId: assignments.classId,
      courseId: assignments.courseId,
      title: assignments.title,
      type: assignments.type,
      source: assignments.source,
      weekNo: assignments.weekNo,
      dueAt: assignments.dueAt,
      points: assignments.points,
      weight: assignments.weight,
      publishedAt: assignments.publishedAt,
      className: classes.name,
      courseTitle: courses.title,
      lessonTitle: lessons.title,
    })
    .from(assignments)
    .innerJoin(classes, eq(classes.id, assignments.classId))
    .innerJoin(courses, eq(courses.id, assignments.courseId))
    .leftJoin(lessons, eq(lessons.id, assignments.lessonId))
    .where(inArray(assignments.classId, ids))
    .orderBy(desc(assignments.createdAt));
  const counts = await submissionCounts(rows.map((row) => row.id));
  const terms = await termMap([...new Set(rows.map((row) => row.classId))]);
  return rows.map((row) => ({
    ...row,
    submissionCount: counts.get(row.id) ?? 0,
    unlockAt: termUnlockAt(terms.get(row.classId), row.weekNo),
  }));
}

export async function listStudentAssignments(user: SessionUser): Promise<StudentAssignmentSummary[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: assignments.id,
      classId: assignments.classId,
      courseId: assignments.courseId,
      title: assignments.title,
      type: assignments.type,
      source: assignments.source,
      weekNo: assignments.weekNo,
      dueAt: assignments.dueAt,
      points: assignments.points,
      weight: assignments.weight,
      publishedAt: assignments.publishedAt,
      className: classes.name,
      courseTitle: courses.title,
      lessonTitle: lessons.title,
      submissionStatus: assignmentSubmissions.status,
      score: assignmentSubmissions.score,
      submittedAt: assignmentSubmissions.submittedAt,
    })
    .from(assignments)
    .innerJoin(classMembers, eq(classMembers.classId, assignments.classId))
    .innerJoin(classes, eq(classes.id, assignments.classId))
    .innerJoin(courses, eq(courses.id, assignments.courseId))
    .leftJoin(lessons, eq(lessons.id, assignments.lessonId))
    .leftJoin(
      assignmentSubmissions,
      and(
        eq(assignmentSubmissions.assignmentId, assignments.id),
        eq(assignmentSubmissions.userId, user.id),
      ),
    )
    .where(and(eq(classMembers.userId, user.id), isNotNull(assignments.publishedAt)))
    .orderBy(asc(assignments.dueAt));
  const counts = await submissionCounts(rows.map((row) => row.id));
  const terms = await termMap([...new Set(rows.map((row) => row.classId))]);
  return rows.map((row) => {
    const unlockAt = termUnlockAt(terms.get(row.classId), row.weekNo);
    return {
      ...row,
      submissionCount: counts.get(row.id) ?? 0,
      unlockAt,
      locked: Boolean(unlockAt && unlockAt.getTime() > Date.now() && !row.submissionStatus),
    };
  });
}

async function submissionCounts(ids: string[]): Promise<Map<string, number>> {
  if (ids.length === 0) return new Map();
  const db = await getDb();
  const rows = await db
    .select({ assignmentId: assignmentSubmissions.assignmentId, n: count() })
    .from(assignmentSubmissions)
    .where(inArray(assignmentSubmissions.assignmentId, ids))
    .groupBy(assignmentSubmissions.assignmentId);
  return new Map(rows.map((row) => [row.assignmentId, Number(row.n)]));
}

function fileInfo(row: typeof assignmentFiles.$inferSelect | undefined): AssignmentFileInfo | null {
  return row ? { filename: row.filename, mimeType: row.mimeType, size: row.size } : null;
}

export async function getTeacherAssignment(user: SessionUser, id: string): Promise<TeacherAssignmentDetail | null> {
  const ids = await managedClassIds(user);
  if (ids.length === 0) return null;
  const db = await getDb();
  const [row] = await db
    .select({
      assignment: assignments,
      className: classes.name,
      courseTitle: courses.title,
      lessonTitle: lessons.title,
    })
    .from(assignments)
    .innerJoin(classes, eq(classes.id, assignments.classId))
    .innerJoin(courses, eq(courses.id, assignments.courseId))
    .leftJoin(lessons, eq(lessons.id, assignments.lessonId))
    .where(and(eq(assignments.id, id), inArray(assignments.classId, ids)))
    .limit(1);
  if (!row) return null;
  const [questions, file, submissions] = await Promise.all([
    db
      .select()
      .from(assignmentQuestions)
      .where(eq(assignmentQuestions.assignmentId, id))
      .orderBy(asc(assignmentQuestions.position)),
    db.select().from(assignmentFiles).where(eq(assignmentFiles.assignmentId, id)).limit(1),
    db
      .select({ submission: assignmentSubmissions, studentName: users.name, groupName: assignmentGroups.name })
      .from(assignmentSubmissions)
      .innerJoin(users, eq(users.id, assignmentSubmissions.userId))
      .leftJoin(assignmentGroups, eq(assignmentGroups.id, assignmentSubmissions.groupId))
      .where(eq(assignmentSubmissions.assignmentId, id))
      .orderBy(desc(assignmentSubmissions.submittedAt)),
  ]);
  return {
    id: row.assignment.id,
    classId: row.assignment.classId,
    courseId: row.assignment.courseId,
    lessonId: row.assignment.lessonId,
    weekNo: row.assignment.weekNo,
    type: row.assignment.type,
    source: row.assignment.source,
    title: row.assignment.title,
    instructions: row.assignment.instructions,
    dueAt: row.assignment.dueAt,
    points: row.assignment.points,
    weight: row.assignment.weight,
    groupSize: row.assignment.groupSize,
    peerReviewCount: row.assignment.peerReviewCount,
    publishedAt: row.assignment.publishedAt,
    className: row.className,
    courseTitle: row.courseTitle,
    lessonTitle: row.lessonTitle,
    questions: questions.map((question) => ({ ...question, hasImage: Boolean(question.imageMimeType) })),
    file: fileInfo(file[0]),
    submissions: submissions.map(({ submission, studentName, groupName }) => ({
      id: submission.id,
      userId: submission.userId,
      studentName,
      groupName,
      status: submission.status,
      score: submission.score,
      feedback: submission.feedback,
      submittedAt: submission.submittedAt,
      textContent: submission.textContent,
      fileName: submission.fileName,
      fileSize: submission.fileSize,
      answers: submission.answers,
    })),
  };
}

export async function getStudentAssignment(user: SessionUser, id: string): Promise<StudentAssignmentDetail | null> {
  const db = await getDb();
  const [row] = await db
    .select({
      assignment: assignments,
      className: classes.name,
      courseTitle: courses.title,
      lessonTitle: lessons.title,
    })
    .from(assignments)
    .innerJoin(classMembers, eq(classMembers.classId, assignments.classId))
    .innerJoin(classes, eq(classes.id, assignments.classId))
    .innerJoin(courses, eq(courses.id, assignments.courseId))
    .leftJoin(lessons, eq(lessons.id, assignments.lessonId))
    .where(
      and(
        eq(assignments.id, id),
        eq(classMembers.userId, user.id),
        isNotNull(assignments.publishedAt),
      ),
    )
    .limit(1);
  if (!row) return null;
  const group = await groupForStudent(id, user.id);
  const [questions, file, submission] = await Promise.all([
    db
      .select({
        id: assignmentQuestions.id,
        kind: assignmentQuestions.kind,
        prompt: assignmentQuestions.prompt,
        options: assignmentQuestions.options,
        points: assignmentQuestions.points,
        imageMimeType: assignmentQuestions.imageMimeType,
      })
      .from(assignmentQuestions)
      .where(eq(assignmentQuestions.assignmentId, id))
      .orderBy(asc(assignmentQuestions.position)),
    db.select().from(assignmentFiles).where(eq(assignmentFiles.assignmentId, id)).limit(1),
    group
      ? db
          .select()
          .from(assignmentSubmissions)
          .where(and(eq(assignmentSubmissions.assignmentId, id), eq(assignmentSubmissions.groupId, group.id)))
          .orderBy(desc(assignmentSubmissions.submittedAt))
          .limit(1)
      : db
          .select()
          .from(assignmentSubmissions)
          .where(and(eq(assignmentSubmissions.assignmentId, id), eq(assignmentSubmissions.userId, user.id)))
          .limit(1),
  ]);
  const own = submission[0];
  const terms = await termMap([row.assignment.classId]);
  const unlockAt = termUnlockAt(terms.get(row.assignment.classId), row.assignment.weekNo);
  return {
    id: row.assignment.id,
    weekNo: row.assignment.weekNo,
    type: row.assignment.type,
    title: row.assignment.title,
    instructions: row.assignment.instructions,
    dueAt: row.assignment.dueAt,
    points: row.assignment.points,
    weight: row.assignment.weight,
    groupSize: row.assignment.groupSize,
    peerReviewCount: row.assignment.peerReviewCount,
    className: row.className,
    courseTitle: row.courseTitle,
    lessonTitle: row.lessonTitle,
    questions: questions.map((question) => ({ ...question, hasImage: Boolean(question.imageMimeType) })),
    file: fileInfo(file[0]),
    unlockAt,
    locked: Boolean(unlockAt && unlockAt.getTime() > Date.now() && !own),
    group,
    submission: own
      ? {
          id: own.id,
          userId: own.userId,
          studentName: user.name,
          groupName: group?.name ?? null,
          status: own.status,
          score: own.score,
          feedback: own.feedback,
          submittedAt: own.submittedAt,
          textContent: own.textContent,
          fileName: own.fileName,
          fileSize: own.fileSize,
          answers: own.answers,
        }
      : null,
  };
}

export async function isClassTeacher(user: SessionUser, classId: string): Promise<boolean> {
  const db = await getDb();
  const [row] = await db.select({ instructorId: classes.instructorId }).from(classes).where(eq(classes.id, classId)).limit(1);
  return Boolean(row && (user.role === 'admin' || row.instructorId === user.id));
}

export async function isClassStudent(user: SessionUser, classId: string): Promise<boolean> {
  const db = await getDb();
  const [row] = await db
    .select({ userId: classMembers.userId })
    .from(classMembers)
    .where(and(eq(classMembers.classId, classId), eq(classMembers.userId, user.id)))
    .limit(1);
  return Boolean(row);
}

export async function classStudentIds(classId: string): Promise<Array<{ id: string; name: string }>> {
  const db = await getDb();
  return db
    .select({ id: users.id, name: users.name })
    .from(classMembers)
    .innerJoin(users, eq(users.id, classMembers.userId))
    .where(eq(classMembers.classId, classId));
}

export async function getAssignmentFile(
  user: SessionUser,
  assignmentId: string,
): Promise<{ filename: string; mimeType: string; data: string } | null> {
  const db = await getDb();
  const [row] = await db
    .select({
      filename: assignmentFiles.filename,
      mimeType: assignmentFiles.mimeType,
      data: assignmentFiles.data,
      classId: assignments.classId,
      publishedAt: assignments.publishedAt,
    })
    .from(assignmentFiles)
    .innerJoin(assignments, eq(assignments.id, assignmentFiles.assignmentId))
    .where(eq(assignmentFiles.assignmentId, assignmentId))
    .limit(1);
  if (!row) return null;
  if (user.role === 'admin' || (await isClassTeacher(user, row.classId))) return row;
  if (row.publishedAt && (await isClassStudent(user, row.classId))) return row;
  return null;
}

export async function getSubmissionFile(
  user: SessionUser,
  submissionId: string,
): Promise<{ filename: string; mimeType: string; data: string } | null> {
  const db = await getDb();
  const [row] = await db
    .select({
      filename: assignmentSubmissions.fileName,
      mimeType: assignmentSubmissions.mimeType,
      data: assignmentSubmissions.fileData,
      classId: assignments.classId,
      userId: assignmentSubmissions.userId,
      assignmentId: assignments.id,
      peerReviewCount: assignments.peerReviewCount,
      groupSize: assignments.groupSize,
    })
    .from(assignmentSubmissions)
    .innerJoin(assignments, eq(assignments.id, assignmentSubmissions.assignmentId))
    .where(eq(assignmentSubmissions.id, submissionId))
    .limit(1);
  if (!row || !row.filename || !row.mimeType || !row.data) return null;
  if (row.userId === user.id || user.role === 'admin' || (await isClassTeacher(user, row.classId))) {
    return { filename: row.filename, mimeType: row.mimeType, data: row.data };
  }
  if (row.peerReviewCount > 0 && row.groupSize === 1) {
    const [own] = await db
      .select({ id: assignmentSubmissions.id })
      .from(assignmentSubmissions)
      .where(
        and(
          eq(assignmentSubmissions.assignmentId, row.assignmentId),
          eq(assignmentSubmissions.userId, user.id),
        ),
      )
      .limit(1);
    if (own) return { filename: row.filename, mimeType: row.mimeType, data: row.data };
  }
  return null;
}

export interface CourseGrade {
  classId: string;
  className: string;
  courseId: string;
  courseTitle: string;
  percent: number;
  gpa: number;
  gradedCount: number;
  weight: number;
}

export async function getStudentGrades(user: SessionUser): Promise<{ courses: CourseGrade[]; overall: number | null }> {
  const rows = await listStudentAssignments(user);
  const byCourse = new Map<string, CourseGrade & { earned: number; possible: number }>();
  for (const row of rows) {
    const graded = row.submissionStatus === 'graded' && row.score !== null && row.points > 0;
    const key = `${row.classId}:${row.courseTitle}`;
    const entry =
      byCourse.get(key) ??
      {
        classId: row.classId,
        className: row.className,
        courseId: row.courseId,
        courseTitle: row.courseTitle,
        percent: 0,
        gpa: 0,
        gradedCount: 0,
        weight: 0,
        earned: 0,
        possible: 0,
      };
    if (graded && row.weight > 0) {
      entry.earned += (row.score! / row.points) * row.weight;
      entry.possible += row.weight;
      entry.gradedCount += 1;
    }
    entry.weight = entry.possible;
    byCourse.set(key, entry);
  }
  let earned = 0;
  let possible = 0;
  const courses = [...byCourse.values()].map((entry) => {
    const percent = entry.possible > 0 ? Math.round((entry.earned / entry.possible) * 1000) / 10 : 0;
    earned += entry.earned;
    possible += entry.possible;
    return {
      classId: entry.classId,
      className: entry.className,
      courseId: entry.courseId,
      courseTitle: entry.courseTitle,
      percent,
      gpa: percentToGpa(percent),
      gradedCount: entry.gradedCount,
      weight: entry.possible,
    };
  });
  return {
    courses,
    overall: possible > 0 ? percentToGpa((earned / possible) * 100) : null,
  };
}

function percentToGpa(percent: number): number {
  if (percent >= 90) return 4;
  if (percent >= 85) return 3.7;
  if (percent >= 80) return 3.3;
  if (percent >= 75) return 3;
  if (percent >= 70) return 2.7;
  if (percent >= 65) return 2.3;
  if (percent >= 60) return 2;
  return 0;
}

export interface PeerReviewTarget {
  submissionId: string;
  studentName: string;
  textContent: string;
  fileName: string | null;
}

export interface PeerReviewView {
  submissionId: string;
  score: number | null;
  feedback: string;
}

export async function getPeerReviewData(
  user: SessionUser,
  assignmentId: string,
): Promise<{ targets: PeerReviewTarget[]; reviews: PeerReviewView[] }> {
  const db = await getDb();
  const [assignment] = await db
    .select({ peerReviewCount: assignments.peerReviewCount, groupSize: assignments.groupSize })
    .from(assignments)
    .where(eq(assignments.id, assignmentId))
    .limit(1);
  if (!assignment || assignment.peerReviewCount <= 0 || assignment.groupSize > 1) {
    return { targets: [], reviews: [] };
  }
  const [own] = await db
    .select({ id: assignmentSubmissions.id })
    .from(assignmentSubmissions)
    .where(and(eq(assignmentSubmissions.assignmentId, assignmentId), eq(assignmentSubmissions.userId, user.id)))
    .limit(1);
  if (!own) return { targets: [], reviews: [] };
  const targets = await db
    .select({
      submissionId: assignmentSubmissions.id,
      studentName: users.name,
      textContent: assignmentSubmissions.textContent,
      fileName: assignmentSubmissions.fileName,
    })
    .from(assignmentSubmissions)
    .innerJoin(users, eq(users.id, assignmentSubmissions.userId))
    .where(
      and(
        eq(assignmentSubmissions.assignmentId, assignmentId),
        ne(assignmentSubmissions.userId, user.id),
      ),
    )
    .limit(assignment.peerReviewCount);
  const reviews = await db
    .select({
      submissionId: assignmentPeerReviews.submissionId,
      score: assignmentPeerReviews.score,
      feedback: assignmentPeerReviews.feedback,
    })
    .from(assignmentPeerReviews)
    .where(
      and(
        eq(assignmentPeerReviews.assignmentId, assignmentId),
        eq(assignmentPeerReviews.reviewerId, user.id),
      ),
    );
  return { targets, reviews };
}

export async function getQuestionImage(
  user: SessionUser,
  questionId: string,
): Promise<{ mimeType: string; data: string } | null> {
  const db = await getDb();
  const [row] = await db
    .select({
      mimeType: assignmentQuestions.imageMimeType,
      data: assignmentQuestions.imageData,
      classId: assignments.classId,
      publishedAt: assignments.publishedAt,
    })
    .from(assignmentQuestions)
    .innerJoin(assignments, eq(assignments.id, assignmentQuestions.assignmentId))
    .where(eq(assignmentQuestions.id, questionId))
    .limit(1);
  if (!row || !row.mimeType || !row.data) return null;
  if (user.role === 'admin' || (await isClassTeacher(user, row.classId))) return { mimeType: row.mimeType, data: row.data };
  if (row.publishedAt && (await isClassStudent(user, row.classId))) return { mimeType: row.mimeType, data: row.data };
  return null;
}

export async function listMissingStudentIds(assignmentId: string): Promise<string[]> {  const db = await getDb();
  const [assignment] = await db
    .select({ classId: assignments.classId })
    .from(assignments)
    .where(eq(assignments.id, assignmentId))
    .limit(1);
  if (!assignment) return [];
  const students = await classStudentIds(assignment.classId);
  const submitted = await db
    .select({ userId: assignmentSubmissions.userId })
    .from(assignmentSubmissions)
    .where(eq(assignmentSubmissions.assignmentId, assignmentId));
  const done = new Set(submitted.map((row) => row.userId));
  return students.map((student) => student.id).filter((id) => !done.has(id));
}
