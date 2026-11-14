// CSV download of the admin activity log, with the current filters applied.
import { requireUser } from '@/core/auth/session';
import { auditCsv, csvFileName } from '@/modules/admin/export';
import { listAuditForExport, type AuditFilters } from '@/modules/admin/queries';

export async function GET(request: Request) {
  await requireUser(['admin']);
  const params = new URL(request.url).searchParams;
  const action = params.get('action');
  const actor = params.get('actor');
  const since = params.get('since');
  const filters: AuditFilters = {
    action: action && action.length <= 60 ? action : undefined,
    actor: actor && actor.trim() ? actor.trim().slice(0, 60) : undefined,
    since: since === 'day' || since === 'week' || since === 'month' ? since : undefined,
  };
  const rows = await listAuditForExport(filters);
  return new Response(auditCsv(rows), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${csvFileName('activity')}"`,
      'cache-control': 'no-store',
    },
  });
}
