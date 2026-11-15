import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { TutorInsightsPage } from '@/modules/ai-tutor/pages/insights-page';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.aiTutor.insights.title };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string }>;
}) {
  const user = await requireUser(['instructor', 'admin']);
  const { scope } = await searchParams;
  return <TutorInsightsPage user={user} scope={scope === 'courses' ? 'courses' : 'classes'} />;
}
