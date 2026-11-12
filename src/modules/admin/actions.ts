'use server';
// Admin mutations: change a user's role, approve or reject courses waiting for review, and
// take a published course offline. Every one of them writes an audit row.

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { AUDIT_ACTIONS, recordAudit } from '@/core/audit';
import { requireUser } from '@/core/auth/session';
import { getDb } from '@/core/db/client';
import { courses, users, USER_ROLES } from '@/core/db/schema';
import type { ActionResult } from '@/core/types';
import { fmt, getT } from '@/i18n';

const roleSchema = z.object({ userId: z.string().min(1), role: z.enum(USER_ROLES) });

export async function changeUserRole(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const admin = await requireUser(['admin']);
  const { t } = await getT();
  const parsed = roleSchema.safeParse({ userId: formData.get('userId'), role: formData.get('role') });
  if (!parsed.success) return { ok: false, error: t.admin.actions.pickRole };
  // Prevents locking the last admin out by accident.
  if (parsed.data.userId === admin.id && parsed.data.role !== 'admin') {
    return { ok: false, error: t.admin.actions.cannotChangeOwnRole };
  }
  const db = await getDb();
  const updated = await db
    .update(users)
    .set({ role: parsed.data.role })
    .where(eq(users.id, parsed.data.userId))
    .returning({ name: users.name });
  if (updated.length === 0) return { ok: false, error: t.admin.actions.userGone };
  await recordAudit({
    actor: admin,
    action: AUDIT_ACTIONS.roleChanged,
    targetType: 'user',
    targetId: parsed.data.userId,
    targetName: updated[0]?.name ?? t.admin.actions.thisUser,
    detail: { to: parsed.data.role },
  });
  revalidatePath('/admin/users');
  revalidatePath('/admin');
  const name = updated[0]?.name ?? t.admin.actions.thisUser;
  const message =
    parsed.data.role === 'admin'
      ? fmt(t.admin.actions.roleChangedAdmin, { name })
      : fmt(t.admin.actions.roleChanged, { name, role: t.admin.actions.roles[parsed.data.role] });
  return { ok: true, message };
}

const reviewSchema = z.object({ courseId: z.string().min(1) });

async function reviewCourse(formData: FormData, decision: 'approve' | 'reject'): Promise<ActionResult> {
  const admin = await requireUser(['admin']);
  const { t } = await getT();
  const parsed = reviewSchema.safeParse({ courseId: formData.get('courseId') });
  if (!parsed.success) return { ok: false, error: t.admin.actions.pickCourse };
  const db = await getDb();
  const values =
    decision === 'approve'
      ? { status: 'published' as const, visibility: 'public' as const, updatedAt: new Date() }
      : { status: 'draft' as const, visibility: 'private' as const, updatedAt: new Date() };
  const updated = await db
    .update(courses)
    .set(values)
    .where(and(eq(courses.id, parsed.data.courseId), eq(courses.status, 'pending_review')))
    .returning({ title: courses.title });
  if (updated.length === 0) return { ok: false, error: t.admin.actions.courseNotPending };
  await recordAudit({
    actor: admin,
    action: decision === 'approve' ? AUDIT_ACTIONS.courseApproved : AUDIT_ACTIONS.courseSentBack,
    targetType: 'course',
    targetId: parsed.data.courseId,
    targetName: updated[0]?.title ?? t.admin.actions.thisCourse,
  });
  revalidatePath('/admin/courses');
  revalidatePath('/admin');
  revalidatePath('/courses');
  const title = updated[0]?.title ?? t.admin.actions.thisCourse;
  return {
    ok: true,
    message: decision === 'approve' ? fmt(t.admin.actions.approved, { title }) : fmt(t.admin.actions.rejected, { title }),
  };
}

export async function approveCourse(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return reviewCourse(formData, 'approve');
}

export async function rejectCourse(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return reviewCourse(formData, 'reject');
}

/**
 * Take a published course out of the catalog, or put an archived one back as a draft.
 *
 * Archiving keeps the row and its enrollments: learners lose the catalog entry, not their
 * history. Restoring returns it to `draft` rather than publishing it again, so a course that
 * was taken down on purpose cannot reappear without someone looking at it.
 */
async function setCourseOffline(formData: FormData, decision: 'archive' | 'restore'): Promise<ActionResult> {
  const admin = await requireUser(['admin']);
  const { t } = await getT();
  const parsed = reviewSchema.safeParse({ courseId: formData.get('courseId') });
  if (!parsed.success) return { ok: false, error: t.admin.actions.pickCourse };
  const db = await getDb();
  const values =
    decision === 'archive'
      ? { status: 'archived' as const, visibility: 'private' as const, updatedAt: new Date() }
      : { status: 'draft' as const, visibility: 'private' as const, updatedAt: new Date() };
  const updated = await db
    .update(courses)
    .set(values)
    .where(
      and(
        eq(courses.id, parsed.data.courseId),
        eq(courses.status, decision === 'archive' ? 'published' : 'archived'),
      ),
    )
    .returning({ title: courses.title });
  if (updated.length === 0) {
    return {
      ok: false,
      error: decision === 'archive' ? t.admin.actions.notPublished : t.admin.actions.notArchived,
    };
  }
  await recordAudit({
    actor: admin,
    action: decision === 'archive' ? AUDIT_ACTIONS.courseArchived : AUDIT_ACTIONS.courseRestored,
    targetType: 'course',
    targetId: parsed.data.courseId,
    targetName: updated[0]?.title ?? t.admin.actions.thisCourse,
  });
  revalidatePath('/admin/courses');
  revalidatePath('/admin');
  revalidatePath('/courses');
  const title = updated[0]?.title ?? t.admin.actions.thisCourse;
  return {
    ok: true,
    message:
      decision === 'archive'
        ? fmt(t.admin.actions.archived, { title })
        : fmt(t.admin.actions.restored, { title }),
  };
}

export async function archiveCourse(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return setCourseOffline(formData, 'archive');
}

export async function restoreCourse(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  return setCourseOffline(formData, 'restore');
}
