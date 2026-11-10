import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { LeaderboardView } from '@/modules/leaderboard/components/leaderboard-view';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.leaderboard.title };
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; period?: string; view?: string; course?: string }>;
}) {
  const user = await requireUser();
  return <LeaderboardView user={user} params={await searchParams} />;
}
