import { requireUser } from '@/core/auth/session';
import { FeedbackPage } from '@/modules/self-learn/pages/feedback-page';

export default async function FeedbackRoute({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ saved?: string; revised?: string }>;
}) {
  const user = await requireUser(['learner']);
  const { sessionId } = await params;
  const { saved, revised } = await searchParams;
  return <FeedbackPage user={user} sessionId={sessionId} saved={saved} revised={revised} />;
}
