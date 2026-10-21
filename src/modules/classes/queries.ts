// Read functions for classes: lists, members, assigned courses and the engagement dashboard.
// Everything is derived from core tables (learning_events, attempts, completions).
import { and, asc, avg, count, countDistinct, desc, eq, gte, inArray, isNotNull, max, or, sql, sum } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import {
  activities,
  activityAttempts,
  classCourses,
  classes,
  classMembers,
  courses,
  enrollments,
  learningEvents,
  lessons,
  users,
  type ClassRow,
} from '@/core/db/schema';
import { EVENT_TYPES } from '@/core/events';
import { getCourseProgress } from '@/core/progress/service';
import { getLevel } from '@/core/progress/xp';
import type { SessionUser } from '@/core/types';
import {
  errorRate,
  parseQuizAnswers,
  parseQuizQuestions,
  tallyQuestions,
  topWrongPick,
  type QuestionInsight,
} from './insights';
import { fillDaySeries, mean, nudgeReason, type DayPoint, type NudgeReason } from './logic';
import { classInsightSummaries } from './schema';

const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (n: number) => new Date(Date.now() - n * DAY_MS);

function toDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function canManageClass(user: SessionUser, cls: Pick<ClassRow, 'instructorId'>): boolean {
  return user.role === 'admin' || (user.role === 'instructor' && cls.instructorId === user.id);
}

/** The class if this staff user may manage it, otherwise null. */
export async function getManagedClass(user: SessionUser, classId: string): Promise<ClassRow | null> {
  const db = await getDb();
  const [row] = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
  if (!row || !canManageClass(user, row)) return null;
  return row;
}

export interface StaffClassSummary {
  id: string;
  name: string;
  description: string;
  inviteCode: string;
  instructorName: string;
  memberCount: number;
  courseCount: number;
}

/** Instructor: own classes. Admin: every class. */
export async function listStaffClasses(user: SessionUser): Promise<StaffClassSummary[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: classes.id,
      name: classes.name,
      description: classes.description,
      inviteCode: classes.inviteCode,
      instructorName: users.name,
    })
    .from(classes)
    .innerJoin(users, eq(users.id, classes.instructorId))
    .where(user.role === 'admin' ? undefined : eq(classes.instructorId, user.id))
    .orderBy(desc(classes.createdAt));
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return [];
  const members = await db
    .select({ classId: classMembers.classId, n: count() })
    .from(classMembers)
    .where(inArray(classMembers.classId, ids))
    .groupBy(classMembers.classId);
  const assigned = await db
    .select({ classId: classCourses.classId, n: count() })
    .from(classCourses)
    .where(inArray(classCourses.classId, ids))
    .groupBy(classCourses.classId);
  const memberMap = new Map(members.map((m) => [m.classId, m.n]));
  const courseMap = new Map(assigned.map((c) => [c.classId, c.n]));
  return rows.map((r) => ({
    ...r,
    memberCount: memberMap.get(r.id) ?? 0,
    courseCount: courseMap.get(r.id) ?? 0,
  }));
}

export interface LearnerClassSummary {
  id: string;
  name: string;
  description: string;
  instructorName: string;
  courses: { id: string; slug: string; title: string; emoji: string; color: string }[];
}

export async function listLearnerClasses(userId: string): Promise<LearnerClassSummary[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: classes.id,
      name: classes.name,
      description: classes.description,
      instructorName: users.name,
    })
    .from(classMembers)
    .innerJoin(classes, eq(classes.id, classMembers.classId))
    .innerJoin(users, eq(users.id, classes.instructorId))
    .where(eq(classMembers.userId, userId))
    .orderBy(desc(classMembers.joinedAt));
  const ids = rows.map((r) => r.id);
  const assigned = ids.length
    ? await db
        .select({
          classId: classCourses.classId,
          id: courses.id,
          slug: courses.slug,
          title: courses.title,
          emoji: courses.emoji,
          color: courses.color,
        })
        .from(classCourses)
        .innerJoin(courses, eq(courses.id, classCourses.courseId))
        .where(and(inArray(classCourses.classId, ids), eq(courses.status, 'published')))
        .orderBy(asc(classCourses.assignedAt))
    : [];
  return rows.map((r) => ({
    ...r,
    courses: assigned
      .filter((a) => a.classId === r.id)
      .map(({ id, slug, title, emoji, color }) => ({ id, slug, title, emoji, color })),
  }));
}

export interface ClassMemberRow {
  id: string;
  name: string;
  email: string;
  avatarSeed: string;
  joinedAt: Date;
  totalXp: number;
  levelName: string;
  lastActiveAt: Date | null;
  coursesCompleted: number;
}

export async function listClassMembers(classId: string): Promise<ClassMemberRow[]> {
  const db = await getDb();
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      avatarSeed: users.avatarSeed,
      joinedAt: classMembers.joinedAt,
    })
    .from(classMembers)
    .innerJoin(users, eq(users.id, classMembers.userId))
    .where(eq(classMembers.classId, classId))
    .orderBy(asc(users.name));
  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return [];
  const xp = await db
    .select({ userId: learningEvents.userId, xp: sum(learningEvents.xp), last: max(learningEvents.createdAt) })
    .from(learningEvents)
    .where(inArray(learningEvents.userId, ids))
    .groupBy(learningEvents.userId);
  const completed = await db
    .select({ userId: enrollments.userId, n: count() })
    .from(enrollments)
    .where(and(inArray(enrollments.userId, ids), isNotNull(enrollments.completedAt)))
    .groupBy(enrollments.userId);
  const xpMap = new Map(xp.map((x) => [x.userId, x]));
  const doneMap = new Map(completed.map((c) => [c.userId, c.n]));
  return rows.map((r) => {
    const stats = xpMap.get(r.id);
    const totalXp = Number(stats?.xp ?? 0);
    return {
      ...r,
      totalXp,
      levelName: getLevel(totalXp).name,
      lastActiveAt: toDate(stats?.last),
      coursesCompleted: doneMap.get(r.id) ?? 0,
    };
  });
}

export interface ClassCourseRow {
  id: string;
  title: string;
  emoji: string;
  color: string;
  status: string;
  lessonCount: number;
  isAssigned: boolean;
}

async function lessonCounts(courseIds: string[]): Promise<Map<string, number>> {
  if (courseIds.length === 0) return new Map();
  const db = await getDb();
  const rows = await db
    .select({ courseId: lessons.courseId, n: count() })
    .from(lessons)
    .where(inArray(lessons.courseId, courseIds))
    .groupBy(lessons.courseId);
  return new Map(rows.map((r) => [r.courseId, r.n]));
}

export async function listAssignedCourses(classId: string): Promise<ClassCourseRow[]> {
  const db = await getDb();
  const rows = await db
    .select({ id: courses.id, title: courses.title, emoji: courses.emoji, color: courses.color, status: courses.status })
    .from(classCourses)
    .innerJoin(courses, eq(courses.id, classCourses.courseId))
    .where(eq(classCourses.classId, classId))
    .orderBy(asc(classCourses.assignedAt));
  const counts = await lessonCounts(rows.map((r) => r.id));
  return rows.map((r) => ({ ...r, lessonCount: counts.get(r.id) ?? 0, isAssigned: true }));
}

/** Published courses this staff user may assign: own + public catalog (admins: all published). */
export function assignableCourseCondition(user: SessionUser) {
  return user.role === 'admin'
    ? eq(courses.status, 'published')
    : and(eq(courses.status, 'published'), or(eq(courses.visibility, 'public'), eq(courses.ownerId, user.id)));
}

export async function listCourseCandidates(user: SessionUser, classId: string): Promise<ClassCourseRow[]> {
  const db = await getDb();
  const assigned = await db
    .select({ courseId: classCourses.courseId })
    .from(classCourses)
    .where(eq(classCourses.classId, classId));
  const assignedIds = new Set(assigned.map((a) => a.courseId));
  const rows = await db
    .select({ id: courses.id, title: courses.title, emoji: courses.emoji, color: courses.color, status: courses.status })
    .from(courses)
    .where(assignableCourseCondition(user))
    .orderBy(asc(courses.title));
  const available = rows.filter((r) => !assignedIds.has(r.id));
  const counts = await lessonCounts(available.map((r) => r.id));
  return available.map((r) => ({ ...r, lessonCount: counts.get(r.id) ?? 0, isAssigned: false }));
}

export interface StudentEngagement {
  id: string;
  name: string;
  avatarSeed: string;
  lastActiveAt: Date | null;
  /** courseId → percent */
  progress: Record<string, number>;
  averageProgress: number | null;
  activitiesDone: number;
  averageScore: number | null;
  nudge: NudgeReason | null;
}

export interface ClassEngagement {
  totalStudents: number;
  activeThisWeek: number;
  averageProgress: number | null;
  activitiesThisWeek: number;
  averageScore: number | null;
  series: DayPoint[];
  courses: { id: string; title: string; emoji: string }[];
  students: StudentEngagement[];
}

export async function getClassEngagement(classId: string): Promise<ClassEngagement> {
  const db = await getDb();
  const members = await db
    .select({ id: users.id, name: users.name, avatarSeed: users.avatarSeed })
    .from(classMembers)
    .innerJoin(users, eq(users.id, classMembers.userId))
    .where(eq(classMembers.classId, classId))
    .orderBy(asc(users.name));
  const assigned = await listAssignedCourses(classId);
  const courseList = assigned.map(({ id, title, emoji }) => ({ id, title, emoji }));
  const courseIds = courseList.map((c) => c.id);
  const ids = members.map((m) => m.id);

  if (ids.length === 0) {
    return {
      totalStudents: 0,
      activeThisWeek: 0,
      averageProgress: null,
      activitiesThisWeek: 0,
      averageScore: null,
      series: fillDaySeries([], 14),
      courses: courseList,
      students: [],
    };
  }

  const weekAgo = daysAgo(7);
  const dayExpr = sql<string>`to_char(${learningEvents.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`;
  const daily = await db
    .select({ day: dayExpr, events: count(), xp: sum(learningEvents.xp) })
    .from(learningEvents)
    .where(and(inArray(learningEvents.userId, ids), gte(learningEvents.createdAt, daysAgo(14))))
    .groupBy(dayExpr);

  const lastSeen = await db
    .select({ userId: learningEvents.userId, last: max(learningEvents.createdAt) })
    .from(learningEvents)
    .where(inArray(learningEvents.userId, ids))
    .groupBy(learningEvents.userId);
  const lastMap = new Map(lastSeen.map((r) => [r.userId, toDate(r.last)]));

  // Attempts are scoped to the class's courses when it has any, else everything they did.
  const attemptScope = courseIds.length
    ? and(inArray(activityAttempts.userId, ids), inArray(activityAttempts.courseId, courseIds))
    : inArray(activityAttempts.userId, ids);
  const attempts = await db
    .select({ userId: activityAttempts.userId, n: count(), score: avg(activityAttempts.bestScore) })
    .from(activityAttempts)
    .where(attemptScope)
    .groupBy(activityAttempts.userId);
  const attemptMap = new Map(attempts.map((a) => [a.userId, a]));
  const [overallScore] = await db
    .select({ score: avg(activityAttempts.bestScore) })
    .from(activityAttempts)
    .where(attemptScope);

  // Distinct (learner, activity) pairs so retries do not inflate the weekly number.
  const [weekActivities] = await db
    .select({
      n: countDistinct(sql`${learningEvents.userId} || ':' || ${learningEvents.activityId}`),
    })
    .from(learningEvents)
    .where(
      and(
        inArray(learningEvents.userId, ids),
        eq(learningEvents.type, EVENT_TYPES.activityCompleted),
        gte(learningEvents.createdAt, weekAgo),
      ),
    );

  const progressByUser = new Map<string, Record<string, number>>();
  for (const id of ids) {
    const map = await getCourseProgress(id, courseIds);
    const record: Record<string, number> = {};
    for (const cid of courseIds) record[cid] = map.get(cid)?.percent ?? 0;
    progressByUser.set(id, record);
  }

  const studentAverages = new Map<string, number | null>();
  for (const id of ids) {
    const record = progressByUser.get(id) ?? {};
    studentAverages.set(id, courseIds.length ? mean(courseIds.map((cid) => record[cid] ?? 0)) : null);
  }
  const classAverage = courseIds.length
    ? mean([...studentAverages.values()].filter((v): v is number => v !== null))
    : null;

  const students: StudentEngagement[] = members.map((m) => {
    const lastActiveAt = lastMap.get(m.id) ?? null;
    const averageProgress = studentAverages.get(m.id) ?? null;
    const att = attemptMap.get(m.id);
    return {
      ...m,
      lastActiveAt,
      progress: progressByUser.get(m.id) ?? {},
      averageProgress: averageProgress === null ? null : Math.round(averageProgress),
      activitiesDone: att?.n ?? 0,
      averageScore: att?.score != null ? Math.round(Number(att.score)) : null,
      nudge: nudgeReason({ lastActiveAt, progress: averageProgress, classAverage }),
    };
  });

  return {
    totalStudents: ids.length,
    activeThisWeek: students.filter((s) => s.lastActiveAt && s.lastActiveAt >= weekAgo).length,
    averageProgress: classAverage === null ? null : Math.round(classAverage),
    activitiesThisWeek: Number(weekActivities?.n ?? 0),
    averageScore: overallScore?.score != null ? Math.round(Number(overallScore.score)) : null,
    series: fillDaySeries(
      daily.map((d) => ({ day: d.day, events: d.events, xp: Number(d.xp ?? 0) })),
      14,
    ),
    courses: courseList,
    students,
  };
}

export interface ClassPulse {
  classCount: number;
  studentCount: number;
  activeThisWeek: number;
  busiest: { id: string; name: string; events: number } | null;
}

/** Numbers for the home widget. Instructor: own classes. Admin: all classes. */
export async function getClassPulse(user: SessionUser): Promise<ClassPulse> {
  const db = await getDb();
  const owned = await db
    .select({ id: classes.id, name: classes.name })
    .from(classes)
    .where(user.role === 'admin' ? undefined : eq(classes.instructorId, user.id));
  const classIds = owned.map((c) => c.id);
  if (classIds.length === 0) return { classCount: 0, studentCount: 0, activeThisWeek: 0, busiest: null };

  const memberships = await db
    .select({ classId: classMembers.classId, userId: classMembers.userId })
    .from(classMembers)
    .where(inArray(classMembers.classId, classIds));
  const studentIds = [...new Set(memberships.map((m) => m.userId))];
  if (studentIds.length === 0) {
    return { classCount: classIds.length, studentCount: 0, activeThisWeek: 0, busiest: null };
  }

  const recent = await db
    .select({ userId: learningEvents.userId, n: count() })
    .from(learningEvents)
    .where(and(inArray(learningEvents.userId, studentIds), gte(learningEvents.createdAt, daysAgo(7))))
    .groupBy(learningEvents.userId);
  const recentMap = new Map(recent.map((r) => [r.userId, r.n]));

  const perClass = new Map<string, number>();
  for (const m of memberships) {
    perClass.set(m.classId, (perClass.get(m.classId) ?? 0) + (recentMap.get(m.userId) ?? 0));
  }
  let busiest: ClassPulse['busiest'] = null;
  for (const c of owned) {
    const events = perClass.get(c.id) ?? 0;
    if (events > 0 && (!busiest || events > busiest.events)) busiest = { id: c.id, name: c.name, events };
  }

  return {
    classCount: classIds.length,
    studentCount: studentIds.length,
    activeThisWeek: recent.length,
    busiest,
  };
}

export interface ClassQuestionInsights {
  totalStudents: number;
  /** Students with at least one saved quiz answer in scope */
  studentsWithAnswers: number;
  answerCount: number;
  /** Weighted over every answer, 0-100, null when nothing was answered */
  averageErrorRate: number | null;
  /** Every answered quiz question, worst first */
  questions: QuestionInsight[];
  summary: typeof classInsightSummaries.$inferSelect | null;
}

/**
 * Error rate per quiz question for the class, from each student's latest saved quiz attempt
 * (activity_attempts.detail.answers). Scoped to the class's courses when it has any.
 */
export async function getClassQuestionInsights(classId: string): Promise<ClassQuestionInsights> {
  const db = await getDb();
  const members = await db
    .select({ userId: classMembers.userId })
    .from(classMembers)
    .where(eq(classMembers.classId, classId));
  const ids = members.map((m) => m.userId);
  const [summary] = await db
    .select()
    .from(classInsightSummaries)
    .where(eq(classInsightSummaries.classId, classId))
    .limit(1);
  const empty: ClassQuestionInsights = {
    totalStudents: ids.length,
    studentsWithAnswers: 0,
    answerCount: 0,
    averageErrorRate: null,
    questions: [],
    summary: summary ?? null,
  };
  if (ids.length === 0) return empty;

  const assigned = await db
    .select({ courseId: classCourses.courseId })
    .from(classCourses)
    .where(eq(classCourses.classId, classId));
  const courseIds = assigned.map((a) => a.courseId);
  const rows = await db
    .select({
      userId: activityAttempts.userId,
      detail: activityAttempts.detail,
      activityId: activities.id,
      activityTitle: activities.title,
      config: activities.config,
      lessonTitle: lessons.title,
      lessonPosition: lessons.position,
      activityPosition: activities.position,
      course: { id: courses.id, title: courses.title, emoji: courses.emoji },
    })
    .from(activityAttempts)
    .innerJoin(activities, eq(activities.id, activityAttempts.activityId))
    .innerJoin(lessons, eq(lessons.id, activities.lessonId))
    .innerJoin(courses, eq(courses.id, activityAttempts.courseId))
    .where(
      and(
        inArray(activityAttempts.userId, ids),
        eq(activities.type, 'quiz'),
        courseIds.length ? inArray(activityAttempts.courseId, courseIds) : undefined,
      ),
    )
    .orderBy(asc(courses.title), asc(lessons.position), asc(activities.position));

  const byActivity = new Map<string, { row: (typeof rows)[number]; answerSets: (number | null)[][] }>();
  const answeredBy = new Set<string>();
  for (const r of rows) {
    const answers = parseQuizAnswers(r.detail);
    if (!answers) continue;
    answeredBy.add(r.userId);
    const entry = byActivity.get(r.activityId) ?? { row: r, answerSets: [] };
    entry.answerSets.push(answers);
    byActivity.set(r.activityId, entry);
  }

  const questions: QuestionInsight[] = [];
  for (const { row, answerSets } of byActivity.values()) {
    const quiz = parseQuizQuestions(row.config);
    tallyQuestions(quiz, answerSets).forEach((t, i) => {
      const q = quiz[i]!;
      if (t.answered === 0) return;
      questions.push({
        key: `${row.activityId}:${i}`,
        activityId: row.activityId,
        activityTitle: row.activityTitle,
        questionIndex: i,
        prompt: q.prompt,
        options: q.options,
        answerIndex: q.answerIndex,
        explanation: q.explanation,
        answered: t.answered,
        wrong: t.wrong,
        errorRate: errorRate(t.wrong, t.answered),
        picks: t.picks,
        topWrong: topWrongPick(t, q.answerIndex),
        lessonTitle: row.lessonTitle,
        course: row.course,
      });
    });
  }
  questions.sort((a, b) => b.errorRate - a.errorRate || b.answered - a.answered);

  const answerCount = questions.reduce((n, q) => n + q.answered, 0);
  const wrongCount = questions.reduce((n, q) => n + q.wrong, 0);
  return {
    ...empty,
    studentsWithAnswers: answeredBy.size,
    answerCount,
    averageErrorRate: answerCount ? errorRate(wrongCount, answerCount) : null,
    questions,
  };
}
