import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { AdminCoursesPage, parseCourseFilters } from '@/modules/admin/pages/courses-page';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.admin.metadata.courses };
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireUser(['admin']);
  return <AdminCoursesPage filters={parseCourseFilters(await searchParams)} />;
}
