import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { AdminActivityPage } from '@/modules/admin/pages/activity-page';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.admin.metadata.activity };
}

export default async function Page() {
  await requireUser(['admin']);
  return <AdminActivityPage />;
}
