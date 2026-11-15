import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { PageHeader } from '@/components/ui';
import { AdminNav } from '@/modules/admin/components/admin-nav';
import { AdminClassesPanel } from '@/modules/leaderboard/admin/classes-panel';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.admin.metadata.classes };
}

export default async function Page() {
  await requireUser(['admin']);
  const { t } = await getT();
  return (
    <div>
      <PageHeader title={t.admin.classes.title} subtitle={t.admin.classes.subtitle} />
      <AdminNav current="/admin/classes" />
      <AdminClassesPanel />
    </div>
  );
}
