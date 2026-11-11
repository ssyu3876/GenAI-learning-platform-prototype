import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { AdminUsersPage } from '@/modules/admin/pages/users-page';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.admin.metadata.users };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const user = await requireUser(['admin']);
  const { q } = await searchParams;
  return <AdminUsersPage user={user} q={(Array.isArray(q) ? q[0] : q) ?? ''} />;
}
