import { requireUser } from '@/core/auth/session';
import { GeneratePage } from '@/modules/self-learn/pages/generate-page';

export default async function GenerateRoute({ params }: { params: Promise<{ sessionId: string }> }) {
  const user = await requireUser(['learner']);
  const { sessionId } = await params;
  return <GeneratePage user={user} sessionId={sessionId} />;
}
