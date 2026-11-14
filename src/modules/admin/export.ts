// CSV building for the admin console.
//
// The routes under src/app/(app)/admin/*/export stay thin: they check the role, call one of
// these functions and return the text. Everything that decides a column lives here.

import type { AdminCourseRow, AdminUserRow, AuditRow } from './queries';

/** Escapes one field: quotes when the value contains a comma, a quote or a newline. */
function field(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function table(header: string[], rows: unknown[][]): string {
  const lines = [header, ...rows].map((row) => row.map(field).join(','));
  // The BOM keeps Excel from mangling Chinese names on a double click.
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}

/** ISO date without the time zone suffix, which spreadsheets parse more reliably. */
function day(value: Date | null): string {
  return value ? value.toISOString().slice(0, 10) : '';
}

export function usersCsv(rows: AdminUserRow[]): string {
  return table(
    ['Name', 'Email', 'Role', 'Joined', 'Last active'],
    rows.map((row) => [row.name, row.email, row.role, day(row.createdAt), day(row.lastActiveAt)]),
  );
}

export function coursesCsv(rows: AdminCourseRow[]): string {
  return table(
    ['Title', 'Slug', 'Status', 'Visibility', 'Source', 'Owner', 'Lessons', 'Updated'],
    rows.map((row) => [
      row.title,
      row.slug,
      row.status,
      row.visibility,
      row.source,
      row.ownerName ?? '',
      row.lessonCount,
      day(row.updatedAt),
    ]),
  );
}

export function auditCsv(rows: AuditRow[]): string {
  return table(
    ['When', 'Actor', 'Action', 'Target type', 'Target', 'Detail'],
    rows.map((row) => [
      row.createdAt.toISOString(),
      row.actorName,
      row.action,
      row.targetType,
      row.targetName,
      row.detail ? JSON.stringify(row.detail) : '',
    ]),
  );
}

/** A dated file name, so two downloads do not overwrite each other. */
export function csvFileName(prefix: string): string {
  return `${prefix}-${new Date().toISOString().slice(0, 10)}.csv`;
}
