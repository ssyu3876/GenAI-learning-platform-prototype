'use server';
// Mutations for classes: create, join, import students, remove students, assign courses.

import { and, eq, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { generateJson } from '@/core/ai/client';
import { hashPassword } from '@/core/auth/password';
import { requireUser } from '@/core/auth/session';
import { getDb } from '@/core/db/client';
import { classCourses, classes, classMembers, courses, users } from '@/core/db/schema';
import { EVENT_TYPES, recordEvent } from '@/core/events';
import { newId, newInviteCode, randomString } from '@/core/ids';
import type { ActionResult } from '@/core/types';
import {
  buildMisconceptionInput,
  MISCONCEPTION_SYSTEM_PROMPT,
  misconceptionSummarySchema,
  mockMisconceptionSummary,
  pickFocusQuestions,
  resolveQuestionRefs,
} from './insights';
import { parseStudentCsv, type SkippedRow } from './logic';
import { assignableCourseCondition, getClassQuestionInsights, getManagedClass } from './queries';
import { classInsightSummaries } from './schema';

// No 0/O/1/l/I so temporary passwords are easy to read out or copy by hand.
const PASSWORD_ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
const MAX_CSV_CHARS = 100_000;

const createClassSchema = z.object({
  name: z.string().trim().min(1, 'Give the class a name.').max(80, 'Keep the name under 80 characters.'),
  description: z.string().trim().max(300, 'Keep the description under 300 characters.').default(''),
});

export async function createClass(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(['instructor', 'admin']);
  const parsed = createClassSchema.safeParse({
    name: formData.get('name') ?? '',
    description: formData.get('description') ?? '',
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the form.' };
  const db = await getDb();
  // Invite codes are unique; retry on the rare collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const inviteCode = newInviteCode();
    const [clash] = await db.select({ id: classes.id }).from(classes).where(eq(classes.inviteCode, inviteCode)).limit(1);
    if (clash) continue;
    await db.insert(classes).values({
      id: newId('class'),
      name: parsed.data.name,
      description: parsed.data.description,
      instructorId: user.id,
      inviteCode,
    });
    revalidatePath('/classes');
    return { ok: true, message: `Class created. Share the code ${inviteCode} with your students.` };
  }
  return { ok: false, error: 'Could not make an invite code. Try again.' };
}

const joinSchema = z.object({
  code: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, '').toUpperCase())
    .pipe(z.string().length(6, 'Invite codes have 6 letters and numbers.')),
});

export async function joinClass(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(['learner']);
  const parsed = joinSchema.safeParse({ code: formData.get('code') ?? '' });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the code.' };
  const db = await getDb();
  const [cls] = await db
    .select({ id: classes.id, name: classes.name })
    .from(classes)
    .where(eq(classes.inviteCode, parsed.data.code))
    .limit(1);
  if (!cls) return { ok: false, error: 'No class uses that code. Check it with your teacher.' };
  const inserted = await db
    .insert(classMembers)
    .values({ classId: cls.id, userId: user.id })
    .onConflictDoNothing()
    .returning();
  if (inserted.length === 0) return { ok: false, error: `You are already in ${cls.name}.` };
  await recordEvent({ userId: user.id, type: EVENT_TYPES.classJoined, payload: { classId: cls.id } });
  revalidatePath('/classes');
  revalidatePath('/home');
  return { ok: true, message: `You joined ${cls.name}.` };
}

export interface ImportSummary {
  added: { name: string; email: string }[];
  created: { name: string; email: string; tempPassword: string }[];
  alreadyInClass: string[];
  skipped: SkippedRow[];
}

const importSchema = z.object({
  classId: z.string().min(1),
  csv: z.string().max(MAX_CSV_CHARS, 'That list is too long. Import up to 200 students at a time.'),
});

export async function importStudents(
  _prev: ActionResult<ImportSummary> | null,
  formData: FormData,
): Promise<ActionResult<ImportSummary>> {
  const user = await requireUser(['instructor', 'admin']);
  const parsed = importSchema.safeParse({ classId: formData.get('classId'), csv: formData.get('csv') ?? '' });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Check the list.' };
  const cls = await getManagedClass(user, parsed.data.classId);
  if (!cls) return { ok: false, error: 'You can only import students into your own classes.' };

  const { rows, skipped } = parseStudentCsv(parsed.data.csv);
  if (rows.length === 0) {
    return {
      ok: false,
      error: skipped.length
        ? 'None of the rows had a usable email. Use one student per line: name,email.'
        : 'Paste at least one line like: Mia Wong,mia@uni.edu',
    };
  }

  const db = await getDb();
  const emails = rows.map((r) => r.email);
  const existing = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role })
    .from(users)
    .where(inArray(users.email, emails));
  const byEmail = new Map(existing.map((u) => [u.email, u]));
  const members = existing.length
    ? await db
        .select({ userId: classMembers.userId })
        .from(classMembers)
        .where(and(eq(classMembers.classId, cls.id), inArray(classMembers.userId, existing.map((u) => u.id))))
    : [];
  const memberIds = new Set(members.map((m) => m.userId));

  const summary: ImportSummary = { added: [], created: [], alreadyInClass: [], skipped: [...skipped] };
  for (const row of rows) {
    const found = byEmail.get(row.email);
    if (found) {
      if (found.role !== 'learner') {
        summary.skipped.push({ row: row.row, text: row.email, reason: 'This is a staff account, not a learner' });
        continue;
      }
      if (memberIds.has(found.id)) {
        summary.alreadyInClass.push(row.email);
        continue;
      }
      await db.insert(classMembers).values({ classId: cls.id, userId: found.id }).onConflictDoNothing();
      summary.added.push({ name: found.name, email: found.email });
      continue;
    }
    const tempPassword = randomString(10, PASSWORD_ALPHABET);
    const id = newId('user');
    await db.insert(users).values({
      id,
      email: row.email,
      name: row.name,
      role: 'learner',
      passwordHash: await hashPassword(tempPassword),
      avatarSeed: randomString(8),
    });
    await db.insert(classMembers).values({ classId: cls.id, userId: id });
    summary.created.push({ name: row.name, email: row.email, tempPassword });
  }

  revalidatePath(`/classes/${cls.id}`);
  revalidatePath('/classes');
  const total = summary.added.length + summary.created.length;
  return {
    ok: true,
    data: summary,
    message: total === 1 ? 'Added 1 student.' : `Added ${total} students.`,
  };
}

const memberSchema = z.object({ classId: z.string().min(1), userId: z.string().min(1) });

export async function removeStudent(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(['instructor', 'admin']);
  const parsed = memberSchema.safeParse({ classId: formData.get('classId'), userId: formData.get('userId') });
  if (!parsed.success) return { ok: false, error: 'Pick a student to remove.' };
  const cls = await getManagedClass(user, parsed.data.classId);
  if (!cls) return { ok: false, error: 'You can only change your own classes.' };
  const db = await getDb();
  await db
    .delete(classMembers)
    .where(and(eq(classMembers.classId, cls.id), eq(classMembers.userId, parsed.data.userId)));
  revalidatePath(`/classes/${cls.id}`);
  return { ok: true, message: 'Removed from the class. Their progress is kept.' };
}

const courseSchema = z.object({ classId: z.string().min(1), courseId: z.string().min(1) });

export async function assignCourse(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(['instructor', 'admin']);
  const parsed = courseSchema.safeParse({ classId: formData.get('classId'), courseId: formData.get('courseId') });
  if (!parsed.success) return { ok: false, error: 'Pick a course to assign.' };
  const cls = await getManagedClass(user, parsed.data.classId);
  if (!cls) return { ok: false, error: 'You can only change your own classes.' };
  const db = await getDb();
  const [course] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.id, parsed.data.courseId), assignableCourseCondition(user)))
    .limit(1);
  if (!course) return { ok: false, error: 'That course is not published or not available to you.' };
  await db.insert(classCourses).values({ classId: cls.id, courseId: course.id }).onConflictDoNothing();
  revalidatePath(`/classes/${cls.id}`);
  return { ok: true, message: 'Course assigned.' };
}

export async function unassignCourse(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(['instructor', 'admin']);
  const parsed = courseSchema.safeParse({ classId: formData.get('classId'), courseId: formData.get('courseId') });
  if (!parsed.success) return { ok: false, error: 'Pick a course to remove.' };
  const cls = await getManagedClass(user, parsed.data.classId);
  if (!cls) return { ok: false, error: 'You can only change your own classes.' };
  const db = await getDb();
  await db
    .delete(classCourses)
    .where(and(eq(classCourses.classId, cls.id), eq(classCourses.courseId, parsed.data.courseId)));
  revalidatePath(`/classes/${cls.id}`);
  return { ok: true, message: 'Course removed from the class.' };
}

const classIdSchema = z.object({ classId: z.string().min(1) });

/** Insights tab: ask the AI to group the class's wrong quiz answers into misconceptions. */
export async function summariseMisconceptions(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(['instructor', 'admin']);
  const parsed = classIdSchema.safeParse({ classId: formData.get('classId') });
  if (!parsed.success) return { ok: false, error: 'Pick a class first.' };
  const cls = await getManagedClass(user, parsed.data.classId);
  if (!cls) return { ok: false, error: 'You can only summarise your own classes.' };

  const insights = await getClassQuestionInsights(cls.id);
  const focus = pickFocusQuestions(insights.questions);
  if (focus.length === 0) {
    return { ok: false, error: 'Not enough wrong answers yet to spot a pattern. Check back after the next quiz.' };
  }

  const { data, mocked } = await generateJson(
    [
      { role: 'system', content: MISCONCEPTION_SYSTEM_PROMPT },
      { role: 'user', content: buildMisconceptionInput(cls.name, focus) },
    ],
    misconceptionSummarySchema,
    {
      feature: 'classes.summarise_misconceptions',
      userId: user.id,
      tier: 'fast',
      temperature: 0.4,
      maxTokens: 900,
      mock: () => mockMisconceptionSummary(focus),
    },
  );
  const content = mocked ? data : resolveQuestionRefs(data, focus);
  const db = await getDb();
  const values = { content, mocked, answerCount: insights.answerCount, generatedAt: new Date() };
  await db
    .insert(classInsightSummaries)
    .values({ classId: cls.id, ...values })
    .onConflictDoUpdate({ target: classInsightSummaries.classId, set: values });
  revalidatePath(`/classes/${cls.id}`);
  return { ok: true, message: 'Summary updated.' };
}
