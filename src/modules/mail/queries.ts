// Read functions for the internal mailbox.
import { and, asc, count, desc, eq, inArray, ne, or } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import { classMembers, classes, mailPreferences, users, type UserRole } from '@/core/db/schema';
import type { SessionUser } from '@/core/types';
import { mailAttachments, mailDrafts, mailMessages, mailUserState, type MailDraft, type MailCopyType } from './schema';

export type Mailbox = 'inbox' | 'sent' | 'archived' | 'trash';

export interface MailPerson {
  id: string;
  name: string;
  role: UserRole;
}

export interface MailListItem {
  id: string;
  subject: string;
  preview: string;
  readAt: Date | null;
  createdAt: Date;
  direction: 'received' | 'sent';
  correspondent: MailPerson;
}

export type MailRecipient = MailPerson;

export interface MailClassGroup {
  id: string;
  name: string;
  memberCount: number;
}

export interface MailAttachmentInfo {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

export interface MailThreadItem {
  id: string;
  threadId: string;
  subject: string;
  body: string;
  parentId: string | null;
  readAt: Date | null;
  createdAt: Date;
  sender: MailPerson;
  recipient: MailPerson;
  cc: MailPerson[];
  bcc: MailPerson[];
  copyType: MailCopyType;
  isRecipient: boolean;
  attachments: MailAttachmentInfo[];
}

export interface MailThread {
  threadId: string;
  subject: string;
  messages: MailThreadItem[];
  state: { archived: boolean; trashed: boolean };
}

function preview(body: string): string {
  const flat = body.replace(/\s+/g, ' ').trim();
  return flat.length > 140 ? `${flat.slice(0, 140)}…` : flat;
}

async function peopleMap(ids: string[]): Promise<Map<string, MailPerson>> {
  if (ids.length === 0) return new Map();
  const db = await getDb();
  const rows = await db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(inArray(users.id, ids));
  return new Map(rows.map((row) => [row.id, row]));
}

async function stateRows(userId: string) {
  const db = await getDb();
  return db.select().from(mailUserState).where(eq(mailUserState.userId, userId));
}

/** All message ids in the conversation containing `messageId`, if the user participates. */
export async function threadMessageIds(user: SessionUser, messageId: string): Promise<string[] | null> {
  const db = await getDb();
  const [seed] = await db.select().from(mailMessages).where(eq(mailMessages.id, messageId)).limit(1);
  if (!seed || (seed.senderId !== user.id && seed.recipientId !== user.id)) return null;
  const threadId = seed.threadId ?? seed.id;
  const rows = await db
    .select({ id: mailMessages.id })
    .from(mailMessages)
    .where(or(eq(mailMessages.id, threadId), eq(mailMessages.threadId, threadId)));
  return rows.map((row) => row.id);
}

export async function listMailbox(userId: string, box: Mailbox): Promise<MailListItem[]> {
  const db = await getDb();
  const states = await stateRows(userId);
  const archivedThreads = new Set<string>();
  const deletedThreads = new Set<string>();
  const purgedThreads = new Set<string>();
  if (states.length > 0) {
    const stateMessages = await db
      .select({ id: mailMessages.id, threadId: mailMessages.threadId })
      .from(mailMessages)
      .where(inArray(mailMessages.id, states.map((state) => state.messageId)));
    const threadByMessage = new Map(stateMessages.map((row) => [row.id, row.threadId ?? row.id]));
    for (const state of states) {
      const key = threadByMessage.get(state.messageId);
      if (!key) continue;
      if (state.archivedAt) archivedThreads.add(key);
      if (state.deletedAt) deletedThreads.add(key);
      if (state.purgedAt) purgedThreads.add(key);
    }
  }
  const participant =
    box === 'inbox'
      ? eq(mailMessages.recipientId, userId)
      : box === 'sent'
        ? eq(mailMessages.senderId, userId)
        : or(eq(mailMessages.recipientId, userId), eq(mailMessages.senderId, userId));

  const rows = await db
    .select()
    .from(mailMessages)
    .where(participant)
    .orderBy(desc(mailMessages.createdAt));

  // A conversation is one row in the list. State is applied to the whole thread so a
  // reply cannot stay in the inbox after its root message is archived.
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = row.threadId ?? row.id;
    if (purgedThreads.has(key)) continue;
    if (box === 'trash') {
      if (!deletedThreads.has(key)) continue;
    } else {
      if (deletedThreads.has(key)) continue;
      const archived = archivedThreads.has(key);
      if (box === 'archived' ? !archived : archived) continue;
    }
    const group = groups.get(key) ?? [];
    group.push(row);
    groups.set(key, group);
  }

  const latest = [...groups.values()].map((group) => group[0]!);
  const people = await peopleMap([
    ...new Set(latest.map((row) => (row.recipientId === userId ? row.senderId : row.recipientId))),
  ]);
  return latest.map((row) => {
    const direction = row.recipientId === userId ? 'received' : 'sent';
    const correspondentId = direction === 'received' ? row.senderId : row.recipientId;
    return {
      id: row.id,
      subject: row.subject,
      preview: preview(row.body),
      readAt: row.readAt,
      createdAt: row.createdAt,
      direction,
      correspondent: people.get(correspondentId) ?? {
        id: correspondentId,
        name: 'Unknown user',
        role: 'learner',
      },
    };
  });
}

export async function unreadMailCount(userId: string): Promise<number> {  const db = await getDb();
  const states = await stateRows(userId);
  const hiddenThreads = new Set<string>();
  if (states.length > 0) {
    const rows = await db
      .select({ id: mailMessages.id, threadId: mailMessages.threadId })
      .from(mailMessages)
      .where(inArray(mailMessages.id, states.map((state) => state.messageId)));
    const threadByMessage = new Map(rows.map((row) => [row.id, row.threadId ?? row.id]));
    for (const state of states) {
      if (!state.deletedAt && !state.archivedAt && !state.purgedAt) continue;
      const key = threadByMessage.get(state.messageId);
      if (key) hiddenThreads.add(key);
    }
  }
  const rows = await db
    .select({ id: mailMessages.id, threadId: mailMessages.threadId, readAt: mailMessages.readAt })
    .from(mailMessages)
    .where(eq(mailMessages.recipientId, userId));
  return rows.filter(
    (row) => !row.readAt && !hiddenThreads.has(row.threadId ?? row.id),
  ).length;
}

export interface MailPreferenceValues {
  courseApproved: boolean;
  classAssigned: boolean;
  badgeEarned: boolean;
  courseOffline: boolean;
  assignmentPublished: boolean;
  assignmentReminder: boolean;
  assignmentSubmitted: boolean;
  assignmentGraded: boolean;
  classStudentJoined: boolean;
  courseUpdated: boolean;
  reviewQueue: boolean;
  courseShared: boolean;
}

export async function getMailPreferences(userId: string): Promise<MailPreferenceValues> {
  const db = await getDb();
  const [row] = await db.select().from(mailPreferences).where(eq(mailPreferences.userId, userId)).limit(1);
  return {
    courseApproved: row?.courseApproved ?? true,
    classAssigned: row?.classAssigned ?? true,
    badgeEarned: row?.badgeEarned ?? true,
    courseOffline: row?.courseOffline ?? true,
    assignmentPublished: row?.assignmentPublished ?? true,
    assignmentReminder: row?.assignmentReminder ?? true,
    assignmentSubmitted: row?.assignmentSubmitted ?? true,
    assignmentGraded: row?.assignmentGraded ?? true,
    classStudentJoined: row?.classStudentJoined ?? true,
    courseUpdated: row?.courseUpdated ?? true,
    reviewQueue: row?.reviewQueue ?? true,
    courseShared: row?.courseShared ?? true,
  };
}

export async function listMailRecipients(userId: string): Promise<MailRecipient[]> {
  const db = await getDb();
  return db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(ne(users.id, userId))
    .orderBy(users.name);
}

export async function listMailClasses(user: SessionUser): Promise<MailClassGroup[]> {
  const db = await getDb();
  const rows = await db
    .select({ id: classes.id, name: classes.name, memberCount: count(classMembers.userId) })
    .from(classes)
    .leftJoin(classMembers, eq(classMembers.classId, classes.id))
    .where(user.role === 'admin' ? undefined : eq(classes.instructorId, user.id))
    .groupBy(classes.id, classes.name)
    .orderBy(classes.name);
  return rows.map((row) => ({ ...row, memberCount: Number(row.memberCount) }));
}

/** Validates that the current user may address this class, then returns its members. */
export async function classMemberIds(classId: string, user: SessionUser): Promise<string[] | null> {
  const db = await getDb();
  const [cls] = await db.select().from(classes).where(eq(classes.id, classId)).limit(1);
  if (!cls) return null;
  if (user.role !== 'admin' && cls.instructorId !== user.id) return null;
  const rows = await db
    .select({ userId: classMembers.userId })
    .from(classMembers)
    .where(eq(classMembers.classId, classId));
  return rows.map((row) => row.userId);
}

/** Returns a thread only when the signed-in user is a participant. */
export async function getMailThread(user: SessionUser, messageId: string): Promise<MailThread | null> {
  const db = await getDb();
  const [seed] = await db.select().from(mailMessages).where(eq(mailMessages.id, messageId)).limit(1);
  if (!seed || (seed.senderId !== user.id && seed.recipientId !== user.id)) return null;

  const threadId = seed.threadId ?? seed.id;
  const rows = await db
    .select()
    .from(mailMessages)
    .where(or(eq(mailMessages.id, threadId), eq(mailMessages.threadId, threadId)))
    .orderBy(asc(mailMessages.createdAt));
  if (rows.length === 0) return null;

  const states = await stateRows(user.id);
  const stateByMessage = new Map(states.map((state) => [state.messageId, state]));
  const visible = rows.filter(
    (row) =>
      (row.senderId === user.id || row.recipientId === user.id) && !stateByMessage.get(row.id)?.purgedAt,
  );
  if (visible.length === 0) return null;
  const archived = visible.some((row) => Boolean(stateByMessage.get(row.id)?.archivedAt));
  const trashed = visible.some((row) => Boolean(stateByMessage.get(row.id)?.deletedAt));
  // The sender receives one row per To/Cc/Bcc copy. Show the envelope once, not three
  // identical message cards, while recipients still only ever see their own copy.
  const shown = visible.filter((row, index) => {
    if (row.senderId !== user.id) return true;
    const key = `${row.parentId ?? 'root'}|${row.subject}|${row.body}`;
    return (
      visible.findIndex(
        (candidate) =>
          candidate.senderId === user.id &&
          `${candidate.parentId ?? 'root'}|${candidate.subject}|${candidate.body}` === key,
      ) === index
    );
  });

  const people = await peopleMap([
    ...new Set(shown.flatMap((row) => [row.senderId, row.recipientId, ...row.ccIds, ...row.bccIds])),
  ]);
  const attachmentRows = await db
    .select({
      id: mailAttachments.id,
      messageId: mailAttachments.messageId,
      filename: mailAttachments.filename,
      mimeType: mailAttachments.mimeType,
      size: mailAttachments.size,
    })
    .from(mailAttachments)
    .where(inArray(mailAttachments.messageId, shown.map((row) => row.id)));
  const attachmentsByMessage = new Map<string, MailAttachmentInfo[]>();
  for (const attachment of attachmentRows) {
    const list = attachmentsByMessage.get(attachment.messageId) ?? [];
    list.push({
      id: attachment.id,
      filename: attachment.filename,
      mimeType: attachment.mimeType,
      size: attachment.size,
    });
    attachmentsByMessage.set(attachment.messageId, list);
  }
  const now = new Date();
  for (const row of visible) {
    if (!trashed && row.recipientId === user.id && !row.readAt) {
      await db
        .update(mailMessages)
        .set({ readAt: now })
        .where(and(eq(mailMessages.id, row.id), eq(mailMessages.recipientId, user.id)));
      row.readAt = now;
    }
  }
  const root = shown.find((row) => row.id === threadId) ?? shown[0];
  if (!root) return null;
  return {
    threadId,
    subject: root.subject,
    state: { archived, trashed },
    messages: shown.map((row) => {
      const sender = people.get(row.senderId);
      const recipient = people.get(row.recipientId);
      return {
        id: row.id,
        threadId: row.threadId ?? row.id,
        subject: row.subject,
        body: row.body,
        parentId: row.parentId,
        readAt: row.readAt,
        createdAt: row.createdAt,
        sender: sender ?? { id: row.senderId, name: 'Unknown user', role: 'learner' },
        recipient: recipient ?? { id: row.recipientId, name: 'Unknown user', role: 'learner' },
        cc: row.ccIds.map((id) => people.get(id)).filter((person): person is MailPerson => Boolean(person)),
        bcc: row.bccIds.map((id) => people.get(id)).filter((person): person is MailPerson => Boolean(person)),
        copyType: row.copyType,
        isRecipient: row.recipientId === user.id,
        attachments: attachmentsByMessage.get(row.id) ?? [],
      };
    }),
  };
}

/** Used by the composer to prefill a forward, and by the reply action. */
export async function getMailMessage(user: SessionUser, messageId: string): Promise<MailThreadItem | null> {
  const db = await getDb();
  const [row] = await db.select().from(mailMessages).where(eq(mailMessages.id, messageId)).limit(1);
  if (!row || (row.senderId !== user.id && row.recipientId !== user.id)) return null;
  const people = await peopleMap([row.senderId, row.recipientId, ...row.ccIds, ...row.bccIds]);
  const sender = people.get(row.senderId);
  const recipient = people.get(row.recipientId);
  if (!sender || !recipient) return null;
  return {
    id: row.id,
    threadId: row.threadId ?? row.id,
    subject: row.subject,
    body: row.body,
    parentId: row.parentId,
    readAt: row.readAt,
    createdAt: row.createdAt,
    sender,
    recipient,
    cc: row.ccIds.map((id) => people.get(id)).filter((person): person is MailPerson => Boolean(person)),
    bcc: row.bccIds.map((id) => people.get(id)).filter((person): person is MailPerson => Boolean(person)),
    copyType: row.copyType,
    isRecipient: row.recipientId === user.id,
    attachments: [],
  };
}

export async function listMailDrafts(userId: string): Promise<MailDraft[]> {
  const db = await getDb();
  return db
    .select()
    .from(mailDrafts)
    .where(eq(mailDrafts.userId, userId))
    .orderBy(desc(mailDrafts.updatedAt));
}

export async function getMailDraft(userId: string, draftId: string): Promise<MailDraft | null> {
  const db = await getDb();
  const [row] = await db
    .select()
    .from(mailDrafts)
    .where(and(eq(mailDrafts.id, draftId), eq(mailDrafts.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function getMailAttachment(
  user: SessionUser,
  attachmentId: string,
): Promise<{ filename: string; mimeType: string; size: number; data: string } | null> {
  const db = await getDb();
  const [row] = await db
    .select({
      filename: mailAttachments.filename,
      mimeType: mailAttachments.mimeType,
      size: mailAttachments.size,
      data: mailAttachments.data,
      senderId: mailMessages.senderId,
      recipientId: mailMessages.recipientId,
    })
    .from(mailAttachments)
    .innerJoin(mailMessages, eq(mailMessages.id, mailAttachments.messageId))
    .where(eq(mailAttachments.id, attachmentId))
    .limit(1);
  if (!row || (row.senderId !== user.id && row.recipientId !== user.id)) return null;
  return { filename: row.filename, mimeType: row.mimeType, size: row.size, data: row.data };
}
