import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { BadgesView } from '@/modules/achievements/components/badges-view';

export const metadata: Metadata = { title: 'Badges and growth' };

export default async function BadgesPage() {
  const user = await requireUser();
  return <BadgesView user={user} />;
}
