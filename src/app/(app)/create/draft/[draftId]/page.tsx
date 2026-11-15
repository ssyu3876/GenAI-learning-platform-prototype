import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { CourseRequestDraftPage } from '@/modules/self-learn/pages/draft-page';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.selfLearn.draft.title };
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ draftId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser(['learner']);
  const [{ draftId }, { error }] = await Promise.all([params, searchParams]);
  return <CourseRequestDraftPage user={user} draftId={draftId} error={error} />;
}
