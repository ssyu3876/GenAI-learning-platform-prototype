'use server';

// Assignment authoring, publishing, submission and grading.
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { requireUser } from '@/core/auth/session';
import { getDb } from '@/core/db/client';
import { classes, courses, lessons } from '@/core/db/schema';
import { sendSystemMail } from '@/core/mail/notify';
import { newId } from '@/core/ids';
import type { ActionResult } from '@/core/types';
import { fmt, getT } from '@/i18n';
import { parseQuizDocx, extractDocxMarkdown } from './docx';
import { generateAssignmentDraft } from './generation';
import {
  assignmentQuestions,
  assignmentFiles,
  assignmentGroups,
  assignmentGroupMembers,
  assignmentPeerReviews,
  assignmentSubmissions,
  assignments,
  classTerms,
} from './schema';
import {
  classStudentIds,
  getStudentAssignment,
  getTeacherAssignment,
  isClassTeacher,
  listMissingStudentIds,
} from './queries';

const MAX_FILE_BYTES = 2_000_000;

const createSchema = z.object({
  classId: z.string().min(1),
  courseId: z.string().min(1),
  lessonId: z.string().optional(),
  weekNo: z.coerce.number().int().min(1).max(24),
  type: z.enum(['quiz', 'project', 'assignment']),
  source: z.enum(['manual', 'ai']),
  title: z.string().trim().max(120).optional(),
  instructions: z.string().trim().max(20_000).default(''),
  aiPrompt: z.string().trim().max(3000).optional(),
  dueAt: z.string().min(1),
  points: z.coerce.number().int().min(1).max(1000),
  weight: z.coerce.number().int().min(0).max(1000).default(100),
  groupSize: z.coerce.number().int().min(1).max(10).default(1),
  peerReviewCount: z.coerce.number().int().min(0).max(5).default(0),
});

async function readableFile(formData: FormData, name: string): Promise<{ file: File; data: string } | null> {
  const value = formData.get(name);
  if (!(value instanceof File) || value.size === 0) return null;
  if (value.size > MAX_FILE_BYTES) throw new Error('FILE_TOO_LARGE');
  return { file: value, data: Buffer.from(await value.arrayBuffer()).toString('base64') };
}

export async function createAssignment(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(['instructor', 'admin']);
  const { locale, t } = await getT();
  const parsed = createSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: t.assignments.actions.checkForm };
  if (!(await isClassTeacher(user, parsed.data.classId))) {
    return { ok: false, error: t.assignments.actions.ownClassesOnly };
  }
  const db = await getDb();
  const [term] = await db
    .select({ weeks: classTerms.weeks })
    .from(classTerms)
    .where(eq(classTerms.classId, parsed.data.classId))
    .limit(1);
  if (term && parsed.data.weekNo > term.weeks) {
    return { ok: false, error: t.assignments.actions.weekOutOfTerm };
  }
  const dueAt = new Date(parsed.data.dueAt);
  if (Number.isNaN(dueAt.getTime())) return { ok: false, error: t.assignments.actions.badDueDate };

  const [course] = await db
    .select({ id: courses.id, title: courses.title, ownerId: courses.ownerId, status: courses.status, visibility: courses.visibility })
    .from(courses)
    .where(eq(courses.id, parsed.data.courseId))
    .limit(1);
  const courseAllowed =
    course &&
    (user.role === 'admin' ||
      course.ownerId === user.id ||
      (course.status === 'published' && course.visibility === 'public'));
  if (!courseAllowed) return { ok: false, error: t.assignments.actions.courseUnavailable };

  let lessonTitle: string | undefined;
  if (parsed.data.lessonId) {
    const [lesson] = await db
      .select({ title: lessons.title, courseId: lessons.courseId })
      .from(lessons)
      .where(eq(lessons.id, parsed.data.lessonId))
      .limit(1);
    if (!lesson || lesson.courseId !== course.id) return { ok: false, error: t.assignments.actions.lessonMissing };
    lessonTitle = lesson.title;
  }

  let upload: { file: File; data: string } | null = null;
  try {
    upload = await readableFile(formData, 'file');
  } catch {
    return { ok: false, error: t.assignments.actions.fileTooLarge };
  }

  let title = parsed.data.title ?? '';
  let instructions = parsed.data.instructions;
  let questions: Array<{ kind: 'single' | 'short'; prompt: string; options: string[]; answer: string; points: number }> = [];
  const source: 'manual' | 'ai' = parsed.data.source;

  if (source === 'ai') {
    const requirement = parsed.data.aiPrompt?.trim() ?? parsed.data.instructions.trim();
    if (!requirement) return { ok: false, error: t.assignments.actions.aiPromptRequired };
    const draft = await generateAssignmentDraft({
      type: parsed.data.type,
      requirement,
      courseTitle: course.title,
      lessonTitle,
      locale,
      userId: user.id,
    });
    title = title || draft.title;
    instructions = instructions || draft.instructions;
    questions = draft.questions;
  } else if (parsed.data.type === 'quiz') {
    if (!upload) return { ok: false, error: t.assignments.actions.quizFileRequired };
    try {
      questions = parseQuizDocx(Buffer.from(upload.data, 'base64'));
    } catch {
      return { ok: false, error: t.assignments.actions.quizParseFailed };
    }
    if (questions.length === 0) return { ok: false, error: t.assignments.actions.quizParseEmpty };
  } else if (upload && !instructions.trim()) {
    try {
      instructions = extractDocxMarkdown(Buffer.from(upload.data, 'base64')).slice(0, 20_000);
    } catch {
      // The uploaded document is still available for download.
    }
  }

  if (!title.trim()) return { ok: false, error: t.assignments.actions.titleRequired };
  if (parsed.data.type === 'quiz' && questions.length === 0) {
    return { ok: false, error: t.assignments.actions.quizQuestionsRequired };
  }

  const id = newId('assignment');
  await db.insert(assignments).values({
    id,
    classId: parsed.data.classId,
    courseId: course.id,
    lessonId: parsed.data.lessonId || null,
    weekNo: parsed.data.weekNo,
    type: parsed.data.type,
    source,
    title: title.slice(0, 120),
    instructions,
    dueAt,
    points: parsed.data.points,
    weight: parsed.data.weight,
    groupSize: parsed.data.groupSize,
    peerReviewCount: parsed.data.groupSize > 1 ? 0 : parsed.data.peerReviewCount,
    createdBy: user.id,
  });

  if (questions.length > 0) {
    await db.insert(assignmentQuestions).values(
      questions.map((question, index) => ({
        id: newId('aq'),
        assignmentId: id,
        position: index,
        kind: question.kind,
        prompt: question.prompt,
        options: question.options,
        answer: question.answer,
        points: question.points,
      })),
    );
  }
  if (upload) {
    await db.insert(assignmentFiles).values({
      id: newId('afile'),
      assignmentId: id,
      filename: upload.file.name,
      mimeType: upload.file.type || 'application/octet-stream',
      size: upload.file.size,
      data: upload.data,
    });
  }

  revalidatePath('/assignments');
  redirect(`/assignments/${id}`);
}

export async function publishAssignment(formData: FormData): Promise<void> {
  const user = await requireUser(['instructor', 'admin']);
  const { locale, t } = await getT();
  const parsed = z.object({ assignmentId: z.string().min(1) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/assignments');
  const detail = await getTeacherAssignment(user, parsed.data.assignmentId);
  if (!detail) redirect('/assignments');
  const db = await getDb();
  await db.update(assignments).set({ publishedAt: new Date(), updatedAt: new Date() }).where(eq(assignments.id, detail.id));
  if (detail.groupSize > 1) {
    const existing = await db
      .select({ id: assignmentGroups.id })
      .from(assignmentGroups)
      .where(eq(assignmentGroups.assignmentId, detail.id))
      .limit(1);
    if (existing.length === 0) {
      const students = (await classStudentIds(detail.classId)).sort((a, b) => a.name.localeCompare(b.name));
      for (let index = 0; index < students.length; index += detail.groupSize) {
        const members = students.slice(index, index + detail.groupSize);
        const groupId = newId('agroup');
        await db.insert(assignmentGroups).values({
          id: groupId,
          assignmentId: detail.id,
          name: `Group ${Math.floor(index / detail.groupSize) + 1}`,
        });
        await db.insert(assignmentGroupMembers).values(
          members.map((member) => ({ groupId, userId: member.id })),
        );
      }
    }
  }
  const students = await classStudentIds(detail.classId);
  const due = detail.dueAt.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  for (const student of students) {
    try {
      await sendSystemMail({
        senderId: user.id,
        recipientId: student.id,
        event: 'assignmentPublished',
        subject: fmt(t.assignments.mail.publishedSubject, { title: detail.title }),
        body: fmt(t.assignments.mail.publishedBody, {
          title: detail.title,
          course: detail.courseTitle,
          due,
        }),
      });
    } catch (error) {
      console.warn('[assignments] could not send publish notification', error);
    }
  }
  revalidatePath('/assignments');
  revalidatePath(`/assignments/${detail.id}`);
  redirect(`/assignments/${detail.id}`);
}

export async function remindAssignment(formData: FormData): Promise<void> {
  const user = await requireUser(['instructor', 'admin']);
  const { locale, t } = await getT();
  const parsed = z.object({ assignmentId: z.string().min(1) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/assignments');
  const detail = await getTeacherAssignment(user, parsed.data.assignmentId);
  if (!detail) redirect('/assignments');
  const missing = await listMissingStudentIds(detail.id);
  const due = detail.dueAt.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  for (const studentId of missing) {
    try {
      await sendSystemMail({
        senderId: user.id,
        recipientId: studentId,
        event: 'assignmentReminder',
        subject: fmt(t.assignments.mail.reminderSubject, { title: detail.title }),
        body: fmt(t.assignments.mail.reminderBody, {
          title: detail.title,
          due,
        }),
      });
    } catch (error) {
      console.warn('[assignments] could not send reminder', error);
    }
  }
  revalidatePath(`/assignments/${detail.id}`);
  redirect(`/assignments/${detail.id}?reminded=${missing.length}`);
}

export async function submitAssignment(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser(['learner']);
  const { t } = await getT();
  const parsed = z.object({
    assignmentId: z.string().min(1),
    textContent: z.string().max(20_000).default(''),
  }).safeParse({ assignmentId: formData.get('assignmentId'), textContent: formData.get('textContent') ?? '' });
  if (!parsed.success) return { ok: false, error: t.assignments.actions.checkSubmission };
  const assignment = await getStudentAssignment(user, parsed.data.assignmentId);
  if (!assignment) return { ok: false, error: t.assignments.actions.notAvailable };
  if (assignment.locked) return { ok: false, error: t.assignments.actions.locked };
  const db = await getDb();
  const [full] = await db.select().from(assignments).where(eq(assignments.id, assignment.id)).limit(1);
  if (!full) return { ok: false, error: t.assignments.actions.notAvailable };

  const answers: Record<string, string> = {};
  let autoScore = 0;
  let autoPossible = 0;
  for (const question of assignment.questions) {
    const value = String(formData.get(`q_${question.id}`) ?? '').trim();
    answers[question.id] = value;
    const [row] = await db
      .select({ answer: assignmentQuestions.answer, kind: assignmentQuestions.kind })
      .from(assignmentQuestions)
      .where(eq(assignmentQuestions.id, question.id))
      .limit(1);
    if (row?.kind === 'single') {
      autoPossible += 1;
      if (value === row.answer) autoScore += 1;
    }
  }
  if (full.type === 'quiz' && assignment.questions.length === 0) {
    return { ok: false, error: t.assignments.actions.notAvailable };
  }
  if (full.type !== 'quiz' && !parsed.data.textContent.trim() && !formData.get('file')) {
    return { ok: false, error: t.assignments.actions.answerRequired };
  }

  let upload: { file: File; data: string } | null = null;
  try {
    upload = await readableFile(formData, 'file');
  } catch {
    return { ok: false, error: t.assignments.actions.fileTooLarge };
  }

  const score = autoPossible > 0 && autoPossible === assignment.questions.length
    ? Math.round((autoScore / autoPossible) * full.points)
    : null;
  const values = {
    status: 'submitted' as const,
    textContent: parsed.data.textContent,
    answers,
    fileName: upload?.file.name ?? null,
    mimeType: upload?.file.type ?? null,
    fileSize: upload?.file.size ?? null,
    fileData: upload?.data ?? null,
    score,
    feedback: '',
    submittedAt: new Date(),
    gradedAt: null,
    gradedBy: null,
  };
  const [existing] = await db
    .select({ id: assignmentSubmissions.id })
    .from(assignmentSubmissions)
    .where(
      and(
        eq(assignmentSubmissions.assignmentId, assignment.id),
        assignment.group
          ? eq(assignmentSubmissions.groupId, assignment.group.id)
          : eq(assignmentSubmissions.userId, user.id),
      ),
    )
    .limit(1);
  if (existing) {
    await db.update(assignmentSubmissions).set(values).where(eq(assignmentSubmissions.id, existing.id));
  } else {
    await db.insert(assignmentSubmissions).values({
      id: newId('asub'),
      assignmentId: assignment.id,
      userId: user.id,
      groupId: assignment.group?.id ?? null,
      ...values,
    });
  }

  const [cls] = await db
    .select({ instructorId: classes.instructorId })
    .from(classes)
    .where(eq(classes.id, full.classId))
    .limit(1);
  if (cls) {
    try {
      await sendSystemMail({
        senderId: user.id,
        recipientId: cls.instructorId,
        event: 'assignmentSubmitted',
        subject: fmt(t.assignments.mail.submittedSubject, { title: full.title }),
        body: fmt(t.assignments.mail.submittedBody, { student: user.name }),
      });
    } catch (error) {
      console.warn('[assignments] could not send submission notification', error);
    }
  }
  revalidatePath('/assignments');
  revalidatePath(`/assignments/${assignment.id}`);
  return { ok: true, message: t.assignments.actions.submitted };
}

export async function saveClassTerm(formData: FormData): Promise<void> {
  const user = await requireUser(['instructor', 'admin']);
  const parsed = z
    .object({
      classId: z.string().min(1),
      name: z.string().trim().min(1).max(80),
      startDate: z.string().min(1),
      weeks: z.coerce.number().int().min(1).max(30),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/assignments/settings');
  if (!(await isClassTeacher(user, parsed.data.classId))) redirect('/assignments/settings');
  const startDate = new Date(`${parsed.data.startDate}T00:00:00`);
  if (Number.isNaN(startDate.getTime())) redirect('/assignments/settings');
  const db = await getDb();
  const values = {
    name: parsed.data.name,
    startDate,
    weeks: parsed.data.weeks,
    createdBy: user.id,
    updatedAt: new Date(),
  };
  await db
    .insert(classTerms)
    .values({ id: newId('term'), classId: parsed.data.classId, ...values })
    .onConflictDoUpdate({ target: classTerms.classId, set: values });
  revalidatePath('/assignments');
  revalidatePath('/assignments/settings');
  redirect('/assignments/settings');
}

export async function uploadQuestionImage(formData: FormData): Promise<void> {
  const user = await requireUser(['instructor', 'admin']);
  const parsed = z
    .object({ questionId: z.string().min(1), assignmentId: z.string().min(1) })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/assignments');
  const detail = await getTeacherAssignment(user, parsed.data.assignmentId);
  if (!detail) redirect('/assignments');
  let upload: { file: File; data: string } | null = null;
  try {
    upload = await readableFile(formData, 'image');
  } catch {
    redirect(`/assignments/${parsed.data.assignmentId}`);
  }
  if (!upload || !upload.file.type.startsWith('image/')) redirect(`/assignments/${parsed.data.assignmentId}`);
  const db = await getDb();
  await db
    .update(assignmentQuestions)
    .set({ imageData: upload.data, imageMimeType: upload.file.type })
    .where(
      and(
        eq(assignmentQuestions.id, parsed.data.questionId),
        eq(assignmentQuestions.assignmentId, parsed.data.assignmentId),
      ),
    );
  revalidatePath(`/assignments/${parsed.data.assignmentId}`);
  redirect(`/assignments/${parsed.data.assignmentId}`);
}

export async function submitPeerReview(formData: FormData): Promise<void> {
  const user = await requireUser(['learner']);
  const parsed = z
    .object({
      assignmentId: z.string().min(1),
      submissionId: z.string().min(1),
      score: z.coerce.number().min(0).max(1000),
      feedback: z.string().max(2000).default(''),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/assignments');
  const db = await getDb();
  const [assignment] = await db
    .select({ peerReviewCount: assignments.peerReviewCount, groupSize: assignments.groupSize })
    .from(assignments)
    .where(eq(assignments.id, parsed.data.assignmentId))
    .limit(1);
  if (!assignment || assignment.peerReviewCount <= 0 || assignment.groupSize > 1) redirect(`/assignments/${parsed.data.assignmentId}`);
  const [own] = await db
    .select({ id: assignmentSubmissions.id })
    .from(assignmentSubmissions)
    .where(
      and(
        eq(assignmentSubmissions.assignmentId, parsed.data.assignmentId),
        eq(assignmentSubmissions.userId, user.id),
      ),
    )
    .limit(1);
  if (!own) redirect(`/assignments/${parsed.data.assignmentId}`);
  const [target] = await db
    .select({ userId: assignmentSubmissions.userId })
    .from(assignmentSubmissions)
    .where(
      and(
        eq(assignmentSubmissions.id, parsed.data.submissionId),
        eq(assignmentSubmissions.assignmentId, parsed.data.assignmentId),
      ),
    )
    .limit(1);
  if (!target || target.userId === user.id) redirect(`/assignments/${parsed.data.assignmentId}`);
  const values = {
    score: Math.round(parsed.data.score),
    feedback: parsed.data.feedback,
  };
  await db
    .insert(assignmentPeerReviews)
    .values({
      id: newId('peer'),
      assignmentId: parsed.data.assignmentId,
      reviewerId: user.id,
      submissionId: parsed.data.submissionId,
      ...values,
    })
    .onConflictDoUpdate({
      target: [assignmentPeerReviews.reviewerId, assignmentPeerReviews.submissionId],
      set: values,
    });
  revalidatePath(`/assignments/${parsed.data.assignmentId}`);
  redirect(`/assignments/${parsed.data.assignmentId}`);
}

export async function gradeSubmission(formData: FormData): Promise<void> {
  const user = await requireUser(['instructor', 'admin']);
  const { t } = await getT();
  const parsed = z
    .object({ submissionId: z.string().min(1), assignmentId: z.string().min(1), score: z.coerce.number().min(0).max(1000), feedback: z.string().max(3000).default('') })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/assignments');
  const detail = await getTeacherAssignment(user, parsed.data.assignmentId);
  if (!detail) redirect('/assignments');
  const db = await getDb();
  const [submission] = await db
    .select({ userId: assignmentSubmissions.userId, groupId: assignmentSubmissions.groupId })
    .from(assignmentSubmissions)
    .where(and(eq(assignmentSubmissions.id, parsed.data.submissionId), eq(assignmentSubmissions.assignmentId, detail.id)))
    .limit(1);
  if (!submission) redirect(`/assignments/${detail.id}`);
  const score = Math.min(parsed.data.score, detail.points);
  await db
    .update(assignmentSubmissions)
    .set({
      score,
      feedback: parsed.data.feedback,
      status: 'graded',
      gradedAt: new Date(),
      gradedBy: user.id,
    })
    .where(and(eq(assignmentSubmissions.id, parsed.data.submissionId), eq(assignmentSubmissions.assignmentId, detail.id)));
  const recipients = submission.groupId
    ? (
        await db
          .select({ userId: assignmentGroupMembers.userId })
          .from(assignmentGroupMembers)
          .where(eq(assignmentGroupMembers.groupId, submission.groupId))
      ).map((member) => member.userId)
    : [submission.userId];
  for (const recipientId of recipients) {
    try {
      await sendSystemMail({
        senderId: user.id,
        recipientId,
        event: 'assignmentGraded',
        subject: fmt(t.assignments.mail.gradedSubject, { title: detail.title }),
        body: fmt(t.assignments.mail.gradedBody, {
          title: detail.title,
          score,
          points: detail.points,
          feedback: parsed.data.feedback || '—',
        }),
      });
    } catch (error) {
      console.warn('[assignments] could not send grading notification', error);
    }
  }
  revalidatePath('/mail');
  revalidatePath(`/assignments/${detail.id}`);
  redirect(`/assignments/${detail.id}`);
}
