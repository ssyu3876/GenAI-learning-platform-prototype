import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { BadgesView } from '@/modules/achievements/components/badges-view';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.achievements.title };
}

export default async function BadgesPage() {
  const user = await requireUser();
  return <BadgesView user={user} />;
}
