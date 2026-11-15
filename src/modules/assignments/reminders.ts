// Scheduled deadline reminders. Called by /api/cron/assignment-reminders on Vercel.
import { and, gt, isNotNull, lte } from 'drizzle-orm';
import { getDb } from '@/core/db/client';
import { sendSystemMail } from '@/core/mail/notify';
import { getTranslations } from '@/i18n';
import { fmt } from '@/i18n';
import { assignmentReminders, assignments } from './schema';
import { listMissingStudentIds } from './queries';

export async function sendScheduledAssignmentReminders(): Promise<{ assignments: number; sent: number }> {
  const db = await getDb();
  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const rows = await db
    .select()
    .from(assignments)
    .where(
      and(
        isNotNull(assignments.publishedAt),
        gt(assignments.dueAt, now),
        lte(assignments.dueAt, soon),
      ),
    );
  const t = getTranslations('en');
  let sent = 0;
  for (const assignment of rows) {
    const missing = await listMissingStudentIds(assignment.id);
    for (const studentId of missing) {
      const inserted = await db
        .insert(assignmentReminders)
        .values({ id: `rem_${assignment.id}_${studentId}`, assignmentId: assignment.id, userId: studentId, kind: 'due24h' })
        .onConflictDoNothing()
        .returning({ id: assignmentReminders.id });
      if (inserted.length === 0) continue;
      try {
        await sendSystemMail({
          senderId: assignment.createdBy,
          recipientId: studentId,
          event: 'assignmentReminder',
          subject: fmt(t.assignments.mail.reminderSubject, { title: assignment.title }),
          body: fmt(t.assignments.mail.reminderBody, {
            title: assignment.title,
            due: assignment.dueAt.toLocaleString('en-GB', {
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }),
          }),
        });
        sent += 1;
      } catch (error) {
        console.warn('[assignments] scheduled reminder failed', error);
      }
    }
  }
  return { assignments: rows.length, sent };
}
