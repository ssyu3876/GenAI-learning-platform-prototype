import type { Metadata } from 'next';
import { requireUser } from '@/core/auth/session';
import { getT } from '@/i18n';
import { AdminUsersPage } from '@/modules/admin/pages/users-page';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t.admin.metadata.users };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[]; role?: string; sort?: string }>;
}) {
  const user = await requireUser(['admin']);
  const { q, page, role, sort } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q) ?? '';
  const raw = Array.isArray(page) ? page[0] : page;
  const roleValue = role === 'learner' || role === 'instructor' || role === 'admin' ? role : undefined;
  const sortValue = sort === 'active' || sort === 'newest' ? sort : undefined;
  return <AdminUsersPage user={user} q={query} page={Number(raw) || 1} role={roleValue} sort={sortValue} />;
}
