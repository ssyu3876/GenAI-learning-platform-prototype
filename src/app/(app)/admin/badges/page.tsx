import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { AdminNav } from '@/modules/admin/components/admin-nav';
import { BadgeOps } from '@/modules/achievements/admin/badge-ops';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.admin.metadata.badges };
}

export default async function Page() {
  await requireUser(['admin']);
  const { t } = await getT();
  return (
    <div>
      <PageHeader title={t.admin.badges.title} subtitle={t.admin.badges.subtitle} />
      <AdminNav current="/admin/badges" />
      <BadgeOps />
    </div>
  );
}
