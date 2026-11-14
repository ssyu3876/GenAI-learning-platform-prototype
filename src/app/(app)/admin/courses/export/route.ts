// CSV download of every course, with the current filters applied.
import { requireUser } from '@/core/auth/session';
import { coursesCsv, csvFileName } from '@/modules/admin/export';
import { parseCourseFilters } from '@/modules/admin/pages/courses-page';
import { listCourses } from '@/modules/admin/queries';

export async function GET(request: Request) {
  await requireUser(['admin']);
  const params = Object.fromEntries(new URL(request.url).searchParams.entries());
  const rows = await listCourses(parseCourseFilters(params));
  return new Response(coursesCsv(rows), {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${csvFileName('courses')}"`,
      'cache-control': 'no-store',
    },
  });
}
