import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { LibraryView } from '@/modules/courses/components/library-view';
import type { LibrarySort } from '@/modules/courses/library';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.courses.library.title };
}

const SORTS: LibrarySort[] = ['heat', 'likes', 'favorites', 'shares'];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; sort?: string }>;
}) {
  const user = await requireUser();
  const query = await searchParams;
  const sort = SORTS.includes(query.sort as LibrarySort) ? (query.sort as LibrarySort) : undefined;
  return <LibraryView user={user} q={query.q} tag={query.tag} sort={sort} />;
}
