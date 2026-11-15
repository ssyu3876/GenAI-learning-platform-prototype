import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { TutorHistoryPage } from '@/modules/ai-tutor/pages/history-page';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.aiTutor.historyPage.title };
}

export default async function Page() {
  const user = await requireUser(['learner']);
  return <TutorHistoryPage user={user} />;
}
