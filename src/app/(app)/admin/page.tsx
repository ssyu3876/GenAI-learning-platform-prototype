import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { AdminOverviewPage } from '@/modules/admin/pages/overview-page';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.admin.metadata.overview };
}

export default async function Page() {
  await requireUser(['admin']);
  return <AdminOverviewPage />;
}
