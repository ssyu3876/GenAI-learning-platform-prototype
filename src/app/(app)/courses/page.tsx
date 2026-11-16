import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { CatalogView } from '@/modules/courses/components/catalog-view';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.courses.title };
}

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const user = await requireUser();
  // Instructors manage every draft/published course in Studio; the learner catalog is noise there.
  if (user.role === 'instructor') redirect('/studio');
  const { subject } = await searchParams;
  return <CatalogView user={user} subject={subject} />;
}
