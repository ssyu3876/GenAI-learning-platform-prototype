// Core-side mail notification hook. Raw SQL keeps module boundaries intact: modules that
// need to notify a user do not import another module's schema or actions.
import { eq, sql } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import { mailPreferences, users, type UserRole } from '@/core/db/schema';
import { newId } from '@/core/ids';

export type MailNotificationEvent =
  | 'courseApproved'
  | 'classAssigned'
  | 'badgeEarned'
  | 'courseOffline'
  | 'assignmentPublished'
  | 'assignmentReminder'
  | 'assignmentSubmitted'
  | 'assignmentGraded'
  | 'classStudentJoined'
  | 'courseUpdated'
  | 'reviewQueue'
  | 'courseShared';

export const MAIL_NOTIFICATION_EVENTS: MailNotificationEvent[] = [
  'courseApproved',
  'classAssigned',
  'badgeEarned',
  'courseOffline',
  'assignmentPublished',
  'assignmentReminder',
  'assignmentSubmitted',
  'assignmentGraded',
  'classStudentJoined',
  'courseUpdated',
  'reviewQueue',
  'courseShared',
];

/** Which events can this role actually receive. Hidden events are not offered in settings. */
export const MAIL_EVENTS_BY_ROLE: Record<UserRole, MailNotificationEvent[]> = {
  learner: [
    'classAssigned',
    'courseOffline',
    'badgeEarned',
    'assignmentPublished',
    'assignmentReminder',
    'assignmentGraded',
    'courseUpdated',
    'courseShared',
  ],
  instructor: ['courseApproved', 'courseOffline', 'assignmentSubmitted', 'classStudentJoined', 'courseShared'],
  admin: ['reviewQueue', 'courseShared'],
};

export async function sendSystemMail(input: {
  senderId: string;
  recipientId: string;
  event: MailNotificationEvent;
  subject: string;
  body: string;
}): Promise<void> {
  if (input.senderId === input.recipientId) return;
  const db = await getDb();
  const [recipient] = await db
    .select({ role: users.role })
    .from(users)
    .where(eq(users.id, input.recipientId))
    .limit(1);
  if (!recipient || !MAIL_EVENTS_BY_ROLE[recipient.role].includes(input.event)) return;
  const [preferences] = await db
    .select()
    .from(mailPreferences)
    .where(eq(mailPreferences.userId, input.recipientId))
    .limit(1);
  if (preferences && !preferences[input.event]) return;
  const id = newId('mail');
  const now = new Date();
  await db.execute(sql`
    insert into mail_messages (id, thread_id, sender_id, recipient_id, subject, body, copy_type, cc_ids, bcc_ids, created_at)
    values (${id}, ${id}, ${input.senderId}, ${input.recipientId}, ${input.subject}, ${input.body}, 'to', '[]'::jsonb, '[]'::jsonb, ${now})
  `);
}
