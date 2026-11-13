import { requireUser } from '@/core/auth/session';
import { SeriesPage } from '@/modules/self-learn/pages/series-page';

export default async function SeriesRoute({
  params,
  searchParams,
}: {
  params: Promise<{ seriesId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await requireUser(['learner']);
  const { seriesId } = await params;
  const { error } = await searchParams;
  return <SeriesPage user={user} seriesId={seriesId} error={error} />;
}
