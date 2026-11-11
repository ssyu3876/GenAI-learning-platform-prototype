import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { ReviewPage } from '@/modules/review/pages/review-page';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.review.title };
}

export default async function Page() {
  const user = await requireUser(['learner']);
  return <ReviewPage user={user} />;
}
