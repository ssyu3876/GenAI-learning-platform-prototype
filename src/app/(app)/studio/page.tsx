import { requireUser } from '@/core/auth/session';
import { StudioHomePage } from '@/modules/studio/pages/studio-home';

export default async function StudioPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser(['instructor', 'admin']);
  const { q } = await searchParams;
  return <StudioHomePage user={user} q={q} />;
}
