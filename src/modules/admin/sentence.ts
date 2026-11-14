// Turns one audit row into a sentence in the reader's language.
//
// Rows store an action key and structured facts, so the sentence is built when it is read.
// A role change also stores the old role, which gets its own template ending in "_from".
import { fmt } from '@/i18n';

export interface AuditLine {
  action: string;
  targetName: string;
  detail: Record<string, unknown> | null;
}

/** Copies keyed by action, for example { "user.role_changed": "made {target} a {role}" }. */
export type ActionCopy = Record<string, string>;
/** Copies keyed by role, for example { learner: "Learner" }. */
export type RoleNames = Record<string, string>;

function roleName(roles: RoleNames, value: unknown): string {
  return typeof value === 'string' ? roles[value] ?? value : '';
}

/**
 * Builds the sentence for one row. Falls back to the raw key when the dictionary has no
 * template, so a new action still shows up instead of rendering as blank.
 */
export function auditSentence(row: AuditLine, copy: ActionCopy, roles: RoleNames): string {
  const from = roleName(roles, row.detail?.from);
  const to = roleName(roles, row.detail?.to);
  const template = (from ? copy[`${row.action}_from`] ?? copy[row.action] : copy[row.action]) ?? undefined;
  if (!template) return `${row.action} · ${row.targetName}`;
  return fmt(template, { target: row.targetName, role: to, from });
}
