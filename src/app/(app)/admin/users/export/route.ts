// CSV download of the user list, with the current search applied.
import { requireUser } from '@/core/auth/session';
import { csvFileName, usersCsv } from '@/modules/admin/export';
import { listUsersForExport } from '@/modules/admin/queries';

export async function GET(request: Request) {
  await requireUser(['admin']);
  const params = new URL(request.url).searchParams;
  const q = params.get('q') ?? '';
  const roleParam = params.get('role');
  const role = roleParam === 'learner' || roleParam === 'instructor' || roleParam === 'admin' ? roleParam : undefined;
  const sortParam = params.get('sort');
  const sort = sortParam === 'active' || sortParam === 'newest' ? sortParam : undefined;
  const rows = await listUsersForExport(q, { role, sort });
  return new Response(usersCsv(rows), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${csvFileName('users')}"`,
      'cache-control': 'no-store',
    },
  });
}
