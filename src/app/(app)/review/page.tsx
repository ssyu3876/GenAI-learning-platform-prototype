import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { ReviewPage } from '@/modules/review/pages/review-page';

export const metadata: Metadata = { title: 'Review' };

export default async function Page() {
  const user = await requireUser(['learner']);
  return <ReviewPage user={user} />;
}
