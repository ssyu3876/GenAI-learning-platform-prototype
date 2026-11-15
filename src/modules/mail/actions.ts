'use server';

// Internal mail mutations.
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { requireUser } from '@/core/auth/session';
import { getDb } from '@/core/db/client';
import { mailPreferences, users } from '@/core/db/schema';
import { newId } from '@/core/ids';
import { MAIL_EVENTS_BY_ROLE } from '@/core/mail/notify';
import type { ActionResult } from '@/core/types';
import { fmt, getT } from '@/i18n';
import { mailAttachments, mailDrafts, mailMessages, mailUserState } from './schema';
import { classMemberIds, getMailMessage, getMailPreferences, threadMessageIds, unreadMailCount } from './queries';

const MAX_ATTACHMENTS = 3;
const MAX_ATTACHMENT_BYTES = 500_000;

const bodySchema = z.string().trim().min(1).max(5000);
const subjectSchema = z.string().trim().min(1).max(120);

export async function sendMail(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const { t } = await getT();
  const parsed = z
    .object({
      subject: subjectSchema,
      body: bodySchema,
      classId: z.string().trim().optional(),
      draftId: z.string().trim().optional(),
    })
    .safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: t.mail.actions.checkForm };

  const toIds = new Set(
    formData
      .getAll('recipientIds')
      .filter((value): value is string => typeof value === 'string' && value.length > 0),
  );
  const ccIds = new Set(
    formData.getAll('ccIds').filter((value): value is string => typeof value === 'string' && value.length > 0),
  );
  const bccIds = new Set(
    formData.getAll('bccIds').filter((value): value is string => typeof value === 'string' && value.length > 0),
  );
  if (parsed.data.classId) {
    const members = await classMemberIds(parsed.data.classId, user);
    if (!members) return { ok: false, error: t.mail.actions.classMissing };
    members.forEach((id) => toIds.add(id));
  }
  toIds.delete(user.id);
  ccIds.delete(user.id);
  bccIds.delete(user.id);
  for (const id of toIds) {
    ccIds.delete(id);
    bccIds.delete(id);
  }
  for (const id of ccIds) bccIds.delete(id);
  const allIds = [...new Set([...toIds, ...ccIds, ...bccIds])];
  if (allIds.length === 0) return { ok: false, error: t.mail.actions.noRecipients };

  const db = await getDb();
  const valid = await db
    .select({ id: users.id })
    .from(users)
    .where(inArray(users.id, allIds));
  if (valid.length !== allIds.length) return { ok: false, error: t.mail.actions.recipientMissing };
  const validIds = new Set(valid.map((row) => row.id));
  for (const id of toIds) if (!validIds.has(id)) toIds.delete(id);
  for (const id of ccIds) if (!validIds.has(id)) ccIds.delete(id);
  for (const id of bccIds) if (!validIds.has(id)) bccIds.delete(id);

  const files = formData
    .getAll('attachments')
    .filter((value): value is File => value instanceof File && value.size > 0)
    .slice(0, MAX_ATTACHMENTS);
  if (files.some((file) => file.size > MAX_ATTACHMENT_BYTES)) {
    return { ok: false, error: t.mail.actions.attachmentTooLarge };
  }
  const attachments = await Promise.all(
    files.map(async (file) => ({
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      data: Buffer.from(await file.arrayBuffer()).toString('base64'),
    })),
  );

  const ccList = [...ccIds];
  const bccList = [...bccIds];
  const deliveries = [
    ...[...toIds].map((id) => ({ id, copyType: 'to' as const })),
    ...ccList.map((id) => ({ id, copyType: 'cc' as const })),
    ...bccList.map((id) => ({ id, copyType: 'bcc' as const })),
  ];
  const groupThreadId = newId('mailthread');

  for (const recipient of deliveries) {
    const id = newId('mail');
    await db.insert(mailMessages).values({
      id,
      threadId: groupThreadId,
      senderId: user.id,
      recipientId: recipient.id,
      copyType: recipient.copyType,
      ccIds: ccList,
      bccIds: bccList,
      subject: parsed.data.subject,
      body: parsed.data.body,
    });
    for (const attachment of attachments) {
      await db.insert(mailAttachments).values({
        id: newId('mailfile'),
        messageId: id,
        ...attachment,
      });
    }
  }
  if (parsed.data.draftId) {
    await db.delete(mailDrafts).where(and(eq(mailDrafts.id, parsed.data.draftId), eq(mailDrafts.userId, user.id)));
  }
  revalidatePath('/mail');
  return {
    ok: true,
    message: fmt(t.mail.actions.sentCount, { count: deliveries.length }),
  };
}

const replySchema = z.object({ messageId: z.string().min(1), body: bodySchema });

export async function sendReply(_prev: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const { t } = await getT();
  const parsed = replySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: t.mail.actions.checkReply };
  const parent = await getMailMessage(user, parsed.data.messageId);
  if (!parent) return { ok: false, error: t.mail.actions.messageMissing };
  const recipientId = parent.isRecipient ? parent.sender.id : parent.recipient.id;
  if (recipientId === user.id) return { ok: false, error: t.mail.actions.self };
  const id = newId('mail');
  const db = await getDb();
  await db.insert(mailMessages).values({
    id,
    threadId: parent.threadId,
    parentId: parent.id,
    senderId: user.id,
    recipientId,
    subject: parent.subject.startsWith('Re:') ? parent.subject : `Re: ${parent.subject}`,
    body: parsed.data.body,
  });
  revalidatePath('/mail');
  revalidatePath(`/mail/${parent.id}`);
  return { ok: true, message: t.mail.actions.replied };
}

const stateSchema = z.object({
  messageId: z.string().min(1),
  action: z.enum(['archive', 'unarchive', 'delete', 'restore', 'purge', 'markUnread']),
});

export async function setMailState(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = stateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/mail');
  const message = await getMailMessage(user, parsed.data.messageId);
  if (!message) redirect('/mail');
  const db = await getDb();
  if (parsed.data.action === 'markUnread') {
    if (!message.isRecipient) redirect(`/mail/${message.id}`);
    await db
      .update(mailMessages)
      .set({ readAt: null })
      .where(eq(mailMessages.id, message.id));
    revalidatePath('/mail');
    redirect('/mail');
  }

  const ids = await threadMessageIds(user, message.id);
  if (!ids) redirect('/mail');
  const now = new Date();
  const archivedAt = parsed.data.action === 'archive' ? now : parsed.data.action === 'unarchive' ? null : undefined;
  const deletedAt =
    parsed.data.action === 'delete' || parsed.data.action === 'purge'
      ? now
      : parsed.data.action === 'restore'
        ? null
        : undefined;
  const purgedAt = parsed.data.action === 'purge' ? now : undefined;
  for (const id of ids) {
    await db
      .insert(mailUserState)
      .values({
        messageId: id,
        userId: user.id,
        archivedAt: archivedAt ?? null,
        deletedAt: deletedAt ?? null,
        purgedAt: purgedAt ?? null,
      })
      .onConflictDoUpdate({
        target: [mailUserState.messageId, mailUserState.userId],
        set: {
          ...(archivedAt !== undefined ? { archivedAt } : {}),
          ...(deletedAt !== undefined ? { deletedAt } : {}),
          ...(purgedAt !== undefined ? { purgedAt } : {}),
        },
      });
  }
  revalidatePath('/mail');
  if (parsed.data.action === 'archive') redirect('/mail?tab=archived');
  if (parsed.data.action === 'delete' || parsed.data.action === 'purge') redirect('/mail?tab=trash');
  redirect('/mail');
}

const draftSchema = z.object({
  draftId: z.string().optional(),
  classId: z.string().optional(),
  subject: z.string().max(120).default(''),
  body: z.string().max(5000).default(''),
});

export async function saveDraft(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = draftSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/mail/new');
  const recipientIds = formData
    .getAll('recipientIds')
    .filter((value): value is string => typeof value === 'string' && value.length > 0);
  const ccIds = formData
    .getAll('ccIds')
    .filter((value): value is string => typeof value === 'string' && value.length > 0);
  const bccIds = formData
    .getAll('bccIds')
    .filter((value): value is string => typeof value === 'string' && value.length > 0);
  const db = await getDb();
  if (parsed.data.draftId) {
    await db
      .update(mailDrafts)
      .set({
        recipientIds,
        ccIds,
        bccIds,
        classId: parsed.data.classId || null,
        subject: parsed.data.subject,
        body: parsed.data.body,
        updatedAt: new Date(),
      })
      .where(and(eq(mailDrafts.id, parsed.data.draftId), eq(mailDrafts.userId, user.id)));
  } else {
    await db.insert(mailDrafts).values({
      id: newId('maildraft'),
      userId: user.id,
      recipientIds,
      ccIds,
      bccIds,
      classId: parsed.data.classId || null,
      subject: parsed.data.subject,
      body: parsed.data.body,
    });
  }
  revalidatePath('/mail');
  redirect('/mail?tab=drafts');
}

export async function deleteDraft(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = z.object({ draftId: z.string().min(1) }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/mail?tab=drafts');
  const db = await getDb();
  await db.delete(mailDrafts).where(and(eq(mailDrafts.id, parsed.data.draftId), eq(mailDrafts.userId, user.id)));
  revalidatePath('/mail');
  redirect('/mail?tab=drafts');
}

/** Used by the shell bell; polling/SSE keeps the red dot current. */
export async function getUnreadMailCount(): Promise<number> {
  const user = await requireUser();
  return unreadMailCount(user.id);
}

export async function saveMailPreferences(formData: FormData): Promise<void> {
  const user = await requireUser();
  const value = (name: string) => formData.get(name) === 'on';
  const db = await getDb();
  const current = await getMailPreferences(user.id);
  const allowed = MAIL_EVENTS_BY_ROLE[user.role];
  const values = {
    courseApproved: allowed.includes('courseApproved') ? value('courseApproved') : current.courseApproved,
    classAssigned: allowed.includes('classAssigned') ? value('classAssigned') : current.classAssigned,
    badgeEarned: allowed.includes('badgeEarned') ? value('badgeEarned') : current.badgeEarned,
    courseOffline: allowed.includes('courseOffline') ? value('courseOffline') : current.courseOffline,
    assignmentPublished: allowed.includes('assignmentPublished')
      ? value('assignmentPublished')
      : current.assignmentPublished,
    assignmentReminder: allowed.includes('assignmentReminder')
      ? value('assignmentReminder')
      : current.assignmentReminder,
    assignmentSubmitted: allowed.includes('assignmentSubmitted')
      ? value('assignmentSubmitted')
      : current.assignmentSubmitted,
    assignmentGraded: allowed.includes('assignmentGraded') ? value('assignmentGraded') : current.assignmentGraded,
    classStudentJoined: allowed.includes('classStudentJoined')
      ? value('classStudentJoined')
      : current.classStudentJoined,
    courseUpdated: allowed.includes('courseUpdated') ? value('courseUpdated') : current.courseUpdated,
    reviewQueue: allowed.includes('reviewQueue') ? value('reviewQueue') : current.reviewQueue,
    courseShared: allowed.includes('courseShared') ? value('courseShared') : current.courseShared,
    updatedAt: new Date(),
  };
  await db
    .insert(mailPreferences)
    .values({ userId: user.id, ...values })
    .onConflictDoUpdate({ target: mailPreferences.userId, set: values });
  revalidatePath('/mail/settings');
  redirect('/mail/settings');
}
