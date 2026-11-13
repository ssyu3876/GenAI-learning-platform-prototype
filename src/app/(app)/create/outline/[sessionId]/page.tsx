import { requireUser } from '@/core/auth/session';
import { OutlinePage } from '@/modules/self-learn/pages/outline-page';

export default async function OutlineRoute({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser(['learner']);
  const { sessionId } = await params;
  const { error } = await searchParams;
  return <OutlinePage user={user} sessionId={sessionId} error={error} />;
}
