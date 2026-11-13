// The admin audit log. Every write goes through `recordAudit` so the console, the role form
// and the scenario panel all produce the same shape, and adding a new audited action never
// means touching the reader.
//
// This is deliberately fire-and-forget: an audit insert must never fail the action it is
// describing, or an admin could not approve a course because the log was unhappy.
import { getDb } from './db/client';
import { adminAudit } from './db/schema';
import { newId } from './ids';
import type { SessionUser } from './types';

export const AUDIT_ACTIONS = {
  roleChanged: 'user.role_changed',
  courseApproved: 'course.approved',
  courseSentBack: 'course.sent_back',
  courseArchived: 'course.archived',
  courseRestored: 'course.restored',
  scenarioClosed: 'scenario.closed',
  scenarioOpened: 'scenario.opened',
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export interface AuditInput {
  actor: SessionUser;
  action: AuditAction;
  targetType: 'user' | 'course' | 'scenario';
  targetId: string;
  /** The name shown in the log; a snapshot, so later renames do not rewrite history. */
  targetName: string;
  detail?: Record<string, unknown>;
}

export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    const db = await getDb();
    await db.insert(adminAudit).values({
      id: newId('audit'),
      actorId: input.actor.id,
      actorName: input.actor.name,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      targetName: input.targetName,
      detail: input.detail ?? null,
    });
  } catch (error) {
    console.error('audit write failed', input.action, error);
  }
}
