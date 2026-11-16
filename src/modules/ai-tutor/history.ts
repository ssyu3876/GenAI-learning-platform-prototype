// Persisted tutor sessions and the teacher-facing AI-help overview.
import { and, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/core/db/client';
import {
  activities,
  activityAttemptHistory,
  activityAttempts,
  classMembers,
  classes,
  courses,
  enrollments,
  lessons,
  users,
} from '@/core/db/schema';
import type { SessionUser } from '@/core/types';
import { newId } from '@/core/ids';
import { tutorMessages, tutorRecommendationClicks, tutorSessions, type TutorEntry } from './schema';

export interface TutorSessionSummary {
  id: string;
  entry: TutorEntry;
  courseId: string | null;
  courseTitle: string | null;
  lessonId: string | null;
  lessonTitle: string | null;
  reviewQuestion: string;
  updatedAt: Date;
  messages: Array<{ role: 'user' | 'assistant'; content: string; createdAt: Date }>;
}

export async function resolveTutorSession(input: {
  userId: string;
  sessionId?: string;
  entry: TutorEntry;
  courseId?: string | null;
  lessonId?: string | null;
  reviewQuestion?: string;
}): Promise<string> {
  const db = await getDb();
  if (input.sessionId) {
    const [existing] = await db
      .select({ id: tutorSessions.id })
      .from(tutorSessions)
      .where(and(eq(tutorSessions.id, input.sessionId), eq(tutorSessions.userId, input.userId)))
      .limit(1);
    if (existing) {
      await db.update(tutorSessions).set({ updatedAt: new Date() }).where(eq(tutorSessions.id, existing.id));
      return existing.id;
    }
  }
  const id = newId('tutorSession');
  await db.insert(tutorSessions).values({
    id,
    userId: input.userId,
    entry: input.entry,
    courseId: input.courseId ?? null,
    lessonId: input.lessonId ?? null,
    reviewQuestion: input.reviewQuestion ?? '',
  });
  return id;
}

export async function appendTutorExchange(
  sessionId: string,
  userMessage: string,
  assistantMessage: string,
): Promise<void> {
  const db = await getDb();
  await db.insert(tutorMessages).values([
    { id: newId('tutorMsg'), sessionId, role: 'user', content: userMessage },
    { id: newId('tutorMsg'), sessionId, role: 'assistant', content: assistantMessage },
  ]);
  await db.update(tutorSessions).set({ updatedAt: new Date() }).where(eq(tutorSessions.id, sessionId));
}

export async function listTutorHistory(userId: string): Promise<TutorSessionSummary[]> {
  const db = await getDb();
  const sessions = await db
    .select({
      id: tutorSessions.id,
      entry: tutorSessions.entry,
      courseId: tutorSessions.courseId,
      courseTitle: courses.title,
      lessonId: tutorSessions.lessonId,
      lessonTitle: lessons.title,
      reviewQuestion: tutorSessions.reviewQuestion,
      updatedAt: tutorSessions.updatedAt,
    })
    .from(tutorSessions)
    .leftJoin(courses, eq(courses.id, tutorSessions.courseId))
    .leftJoin(lessons, eq(lessons.id, tutorSessions.lessonId))
    .where(eq(tutorSessions.userId, userId))
    .orderBy(desc(tutorSessions.updatedAt))
    .limit(20);
  if (sessions.length === 0) return [];
  const messages = await db
    .select({
      sessionId: tutorMessages.sessionId,
      role: tutorMessages.role,
      content: tutorMessages.content,
      createdAt: tutorMessages.createdAt,
    })
    .from(tutorMessages)
    .where(inArray(tutorMessages.sessionId, sessions.map((session) => session.id)))
    .orderBy(tutorMessages.createdAt);
  const bySession = new Map<string, TutorSessionSummary['messages']>();
  for (const message of messages) {
    const list = bySession.get(message.sessionId) ?? [];
    list.push({ role: message.role, content: message.content, createdAt: message.createdAt });
    bySession.set(message.sessionId, list);
  }
  return sessions.map((session) => ({ ...session, messages: bySession.get(session.id) ?? [] }));
}

export interface TutorInsight {
  lessonId: string | null;
  lessonTitle: string;
  courseTitle: string;
  asked: number;
  lastQuestion: string;
  lastAt: Date;
}

const quizSchema = z.object({
  questions: z.array(z.object({ prompt: z.string(), options: z.array(z.string()), answerIndex: z.number().int() })),
});
const quizDetailSchema = z.object({ answers: z.array(z.number().int().nullable()) });

export interface WrongQuestionInsight {
  prompt: string;
  lessonTitle: string;
  courseTitle: string;
  count: number;
}

export async function listTutorInsights(
  user: SessionUser,
  scope: 'classes' | 'courses' = 'classes',
): Promise<{
  sessions: number;
  questions: number;
  recommendationClicks: number;
  lessons: TutorInsight[];
  wrongQuestions: WrongQuestionInsight[];
  recentQuestions: Array<{ question: string; studentName: string; lessonTitle: string; createdAt: Date }>;
}> {
  const db = await getDb();
  let studentIds: string[] = [];
  if (user.role === 'admin') {
    const rows = await db.select({ id: users.id }).from(users).where(eq(users.role, 'learner'));
    studentIds = rows.map((row) => row.id);
  } else if (scope === 'courses') {
    const rows = await db
      .select({ userId: enrollments.userId })
      .from(enrollments)
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .where(eq(courses.ownerId, user.id));
    studentIds = [...new Set(rows.map((row) => row.userId))];
  } else {
    const rows = await db
      .select({ userId: classMembers.userId })
      .from(classMembers)
      .innerJoin(classes, eq(classes.id, classMembers.classId))
      .where(eq(classes.instructorId, user.id));
    studentIds = [...new Set(rows.map((row) => row.userId))];
  }
  if (studentIds.length === 0) return { sessions: 0, questions: 0, recommendationClicks: 0, lessons: [], wrongQuestions: [], recentQuestions: [] };
  const rows = await db
    .select({
      id: tutorSessions.id,
      lessonId: tutorSessions.lessonId,
      lessonTitle: lessons.title,
      courseTitle: courses.title,
      reviewQuestion: tutorSessions.reviewQuestion,
      updatedAt: tutorSessions.updatedAt,
      userId: tutorSessions.userId,
      studentName: users.name,
    })
    .from(tutorSessions)
    .leftJoin(lessons, eq(lessons.id, tutorSessions.lessonId))
    .leftJoin(courses, eq(courses.id, tutorSessions.courseId))
    .innerJoin(users, eq(users.id, tutorSessions.userId))
    .where(inArray(tutorSessions.userId, studentIds))
    .orderBy(desc(tutorSessions.updatedAt));
  const lessonMap = new Map<string, TutorInsight>();
  for (const row of rows) {
    const key = row.lessonId ?? `general:${row.courseTitle ?? 'unknown'}`;
    const entry =
      lessonMap.get(key) ??
      {
        lessonId: row.lessonId,
        lessonTitle: row.lessonTitle ?? 'General tutor chat',
        courseTitle: row.courseTitle ?? 'No course',
        asked: 0,
        lastQuestion: '',
        lastAt: row.updatedAt,
      };
    entry.asked += 1;
    if (row.updatedAt >= entry.lastAt) {
      entry.lastAt = row.updatedAt;
      entry.lastQuestion = row.reviewQuestion || 'General question';
    }
    lessonMap.set(key, entry);
  }

  let attempts = await db
    .select({
      config: activities.config,
      detail: activityAttemptHistory.detail,
      lessonTitle: lessons.title,
      courseTitle: courses.title,
    })
    .from(activityAttemptHistory)
    .innerJoin(activities, eq(activities.id, activityAttemptHistory.activityId))
    .innerJoin(lessons, eq(lessons.id, activities.lessonId))
    .innerJoin(courses, eq(courses.id, lessons.courseId))
    .where(and(inArray(activityAttemptHistory.userId, studentIds), eq(activities.type, 'quiz')));
  if (attempts.length === 0) {
    // Existing installs have only the latest attempt until new attempts start filling the log.
    attempts = await db
      .select({
        config: activities.config,
        detail: activityAttempts.detail,
        lessonTitle: lessons.title,
        courseTitle: courses.title,
      })
      .from(activityAttempts)
      .innerJoin(activities, eq(activities.id, activityAttempts.activityId))
      .innerJoin(lessons, eq(lessons.id, activities.lessonId))
      .innerJoin(courses, eq(courses.id, lessons.courseId))
      .where(and(inArray(activityAttempts.userId, studentIds), eq(activities.type, 'quiz')));
  }
  const wrongMap = new Map<string, WrongQuestionInsight>();
  for (const attempt of attempts) {
    const config = quizSchema.safeParse(attempt.config);
    const detail = quizDetailSchema.safeParse(attempt.detail);
    if (!config.success || !detail.success) continue;
    config.data.questions.forEach((question, index) => {
      const answer = detail.data.answers[index];
      if (answer === null || answer === undefined || answer === question.answerIndex) return;
      const key = `${attempt.lessonTitle}:${question.prompt}`;
      const entry =
        wrongMap.get(key) ??
        {
          prompt: question.prompt,
          lessonTitle: attempt.lessonTitle,
          courseTitle: attempt.courseTitle,
          count: 0,
        };
      entry.count += 1;
      wrongMap.set(key, entry);
    });
  }

  return {
    sessions: rows.length,
    questions: rows.filter((row) => row.reviewQuestion).length,
    recommendationClicks: (
      await db
        .select({ id: tutorRecommendationClicks.id })
        .from(tutorRecommendationClicks)
        .where(inArray(tutorRecommendationClicks.userId, studentIds))
    ).length,
    lessons: [...lessonMap.values()].sort((a, b) => b.asked - a.asked).slice(0, 12),
    wrongQuestions: [...wrongMap.values()].sort((a, b) => b.count - a.count).slice(0, 12),
    recentQuestions: rows
      .filter((row) => row.reviewQuestion)
      .slice(0, 20)
      .map((row) => ({
        question: row.reviewQuestion,
        studentName: row.studentName,
        lessonTitle: row.lessonTitle ?? 'General tutor chat',
        createdAt: row.updatedAt,
      })),
  };
}
